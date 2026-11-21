/* Responsive-ad overflow regression tests against the production script.
 * The DOM fixture models a fixed Google host inside a fluid responsive slot.
 * No Google requests, iframe-content access, clipping, or rendered-browser claim.
 * Run: node tests/ad-layout.test.cjs
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../ad-layout.js'), 'utf8');

function fixture(initialViewport, fillImmediately = true) {
  let viewport = initialViewport;
  const frames = [], resizes = [], mutations = [], requests = [];
  const windowEvents = new Map(), documentEvents = new Map();
  const visibilityChanges = [];
  const on = (map, name, fn) => map.set(name, [...(map.get(name) || []), fn]);
  let body, head, main;
  function descendant(node, ancestor) { for (let n = node; n; n = n.parent) if (n === ancestor) return true; return false; }
  function hidden(node) { for (let n = node; n; n = n.parent) if (n.hidden) return true; return false; }
  function placement(node) { for (let n = node; n; n = n.parent) if (n.dataset.ctAdPosition) return n; return null; }
  function slotWidth() { return Math.max(0, Math.min(viewport - 32, 970) - 18); }
  function rect(left, width, height = 100, top = 0) { return {left, right: left + width, top, bottom: top + height, width, height}; }

  class Element {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.dataset = {}; this.style = {}; this.children = []; this._hidden = false; this.attributes = {}; }
    get hidden() { return this._hidden; }
    set hidden(value) {
      if (this._hidden === value) return;
      this._hidden = value;
      if (this.dataset.ctAdPosition === 'bottom') visibilityChanges.push(value);
      // A hidden placement also reports zero size for observed descendants.
      for (const observer of resizes) if ([...observer.targets].some(target => descendant(target, this))) observer.callback([]);
    }
    append(...nodes) { for (const node of nodes) { node.parent = this; this.children.push(node); } }
    insertAdjacentElement(where, node) {
      assert.equal(where, 'afterend'); node.parent = this.parent;
      this.parent.children.splice(this.parent.children.indexOf(this) + 1, 0, node);
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    querySelectorAll(selector) {
      assert.equal(selector, 'iframe');
      return this.children.flatMap(child => [...(child.tagName === 'IFRAME' ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    getBoundingClientRect() {
      if (hidden(this)) return rect(0, 0, 0);
      if (this === main) { const width = Math.min(1120, viewport - 40); return rect((viewport - width) / 2, width, 900, 72); }
      const outer = placement(this), bottom = outer && outer.dataset.ctAdPosition === 'bottom';
      if (bottom) {
        const outerWidth = Math.min(viewport - 32, 970), left = (viewport - outerWidth) / 2;
        if (this === outer || this.className === 'ct-ad-panel') return rect(left, outerWidth, 220, 972);
        return rect(left + 9, this.creativeWidth || slotWidth(), 100, 1160);
      }
      return rect(16, this.className === 'ct-ad-slot' || this.tagName === 'INS' ? 160 : 162, 600, 96);
    }
    get scrollWidth() {
      if (hidden(this)) return 0;
      return Math.max(this.getBoundingClientRect().width, ...this.children.map(child => child.scrollWidth));
    }
  }
  body = new Element('body'); head = new Element('head'); main = new Element('main'); body.append(main);
  const document = {
    hidden: false, fullscreenElement: null, pointerLockElement: null, body, head,
    documentElement: {
      get clientWidth() { return viewport; },
      get scrollWidth() {
        const bottom = body.children.find(node => node.dataset.ctAdPosition === 'bottom');
        if (!bottom || bottom.hidden) return viewport;
        const slot = bottom.children[0].children[1];
        return Math.max(viewport, slot.getBoundingClientRect().left + slot.scrollWidth);
      }
    },
    createElement: tag => new Element(tag),
    querySelector(selector) {
      if (selector === 'main') return main;
      if (selector === '#accountForm, [data-ads="off"]') return null;
      if (selector.startsWith('script[src*=')) return head.children.find(node => node.tagName === 'SCRIPT' && (node.src || '').includes('adsbygoogle.js')) || null;
      throw Error('Unexpected selector ' + selector);
    },
    addEventListener(name, fn) { on(documentEvents, name, fn); }
  };
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.targets = new Set(); resizes.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
  }
  class MutationObserver {
    constructor(callback) { this.callback = callback; this.active = true; mutations.push(this); }
    observe(target, options) { this.target = target; this.options = options; }
    disconnect() { this.active = false; }
  }
  function notify(ad) { for (const observer of mutations) if (observer.active && observer.target === ad) observer.callback([]); }
  function fill(ad, width) {
    const host = new Element('div'), iframe = new Element('iframe');
    host.id = 'aswift_1_host'; host.creativeWidth = width; iframe.creativeWidth = width;
    Object.defineProperty(iframe, 'contentDocument', {get() { throw Error('Must not inspect Google iframe content'); }});
    Object.defineProperty(iframe, 'contentWindow', {get() { throw Error('Must not inspect Google iframe content'); }});
    host.append(iframe); ad.append(host); ad.dataset.adStatus = 'filled'; notify(ad);
  }
  const context = {
    console, document, ResizeObserver, MutationObserver,
    location: {pathname: '/word-counter'}, scrollY: 0,
    requestAnimationFrame(fn) { frames.push(fn); },
    addEventListener(name, fn) { on(windowEvents, name, fn); },
    adsbygoogle: {push() {
      const ads = body.children.flatMap(outer => outer.dataset.ctAdPosition ? outer.children[0].children[1].children : []);
      const ad = ads.find(candidate => !candidate.wasRequested); assert.ok(ad, 'a new slot exists');
      ad.wasRequested = true; requests.push(ad);
      if (fillImmediately) fill(ad, placement(ad).dataset.ctAdPosition === 'bottom' ? slotWidth() : 160);
    }}
  };
  context.window = context; vm.createContext(context); vm.runInContext(source, context);
  head.children.find(node => node.tagName === 'LINK').onload();
  function flush() {
    let count = 0;
    while (frames.length) {
      assert.ok(++count <= 6, 'observer callbacks must settle, not alternate hidden/visible');
      frames.shift()();
    }
    return count;
  }
  function dispatch(name) { for (const fn of windowEvents.get(name) || []) fn(); }
  const bottom = body.children.find(node => node.dataset.ctAdPosition === 'bottom');
  const ad = bottom.children[0].children[1].children[0];
  return {
    bottom, ad, document, requests, visibilityChanges, mutations, fill, notify, flush,
    resize(width, event = 'resize') { viewport = width; dispatch(event); },
    signalResize() { for (const observer of resizes) observer.callback([]); },
    available: slotWidth
  };
}

// Reproduce the actual 952px host overflowing after browser zoom to 899 CSS px.
const wide = fixture(1348); wide.flush();
assert.equal(wide.available(), 952); assert.equal(wide.bottom.hidden, false);
assert.equal(wide.requests.length, 1);
wide.resize(899);
assert.equal(wide.available(), 849);
assert.equal(wide.document.documentElement.scrollWidth, 977, 'fixture reproduces the reported Google-host overflow before the scheduled check');
assert.ok(wide.flush() <= 2, 'hiding and the resulting resize callback settle');
assert.equal(wide.bottom.hidden, true);
assert.equal(wide.document.documentElement.scrollWidth, 899, 'hidden creative no longer expands document');
assert.deepEqual(wide.visibilityChanges, [true]);
for (let i = 0; i < 8; i++) { wide.signalResize(); wide.flush(); }
assert.deepEqual(wide.visibilityChanges, [true], 'zero-size hidden observations cannot restore too early');
assert.equal(wide.requests.length, 1, 'resize never re-requests an ad');
wide.resize(1348); wide.flush();
assert.equal(wide.bottom.hidden, false); assert.deepEqual(wide.visibilityChanges, [true, false]);
assert.equal(wide.requests[0], wide.ad, 'same rendered ad is restored');
assert.equal(wide.requests.length, 1);

// A mobile first-load creative remains visible at its correctly sized 270px.
const mobile = fixture(320); mobile.flush();
assert.equal(mobile.available(), 270); assert.equal(mobile.bottom.hidden, false);
assert.equal(mobile.document.documentElement.scrollWidth, 320);
mobile.resize(290, 'orientationchange'); mobile.flush();
assert.equal(mobile.bottom.hidden, true);
mobile.resize(320, 'orientationchange'); mobile.flush();
assert.equal(mobile.bottom.hidden, false); assert.equal(mobile.requests.length, 1);

// No cached initial container width can hide a pending unit before it renders.
const pending = fixture(1348, false); pending.flush(); pending.resize(899); pending.flush();
assert.equal(pending.bottom.hidden, false);
pending.fill(pending.ad, 849); pending.flush();
assert.equal(pending.bottom.hidden, false); assert.equal(pending.requests.length, 1);

// Late rendering is measured even when main/panel sizes do not change.
const late = fixture(899, false); late.flush(); late.fill(late.ad, 952); late.flush();
assert.equal(late.bottom.hidden, true); assert.equal(late.document.documentElement.scrollWidth, 899);
const observer = late.mutations.find(item => item.target === late.ad);
assert.equal(observer.options.childList, true); assert.equal(observer.options.subtree, true);
assert.ok(observer.options.attributeFilter.includes('width')); assert.ok(observer.options.attributeFilter.includes('style'));

// Unfilled is terminal, even when later resizes or stale status updates arrive.
wide.ad.dataset.adStatus = 'unfilled'; wide.notify(wide.ad); wide.flush();
assert.equal(wide.bottom.hidden, true);
wide.resize(899); wide.flush(); wide.resize(1348); wide.flush();
wide.ad.dataset.adStatus = 'filled'; wide.notify(wide.ad); wide.flush();
assert.equal(wide.bottom.hidden, true); assert.equal(wide.requests.length, 1);
assert.equal(wide.mutations.find(item => item.target === wide.ad).active, false);

console.log('PASS: bottom-ad overflow, same-unit restore, mobile initial sizing, late rendering, unfilled collapse, and stable observer scheduling.');
