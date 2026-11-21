/* Functional tests against the actual inline analyzer and shared site script.
 * Uses a small DOM fixture, not a rendering engine. No ad/server requests.
 * Run: node tests/word-counter.test.cjs
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'word-counter.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const analyzer = scripts.filter(([, attrs, text]) => !/\bsrc=/.test(attrs) && text.includes('function analyzeText'));
assert.equal(analyzer.length, 1, 'exactly one inline analyzer');
assert.equal(scripts.filter(([ , attrs]) => /\bsrc="\/site\.js"/.test(attrs)).length, 1, 'shared site loader exists once');
assert.equal(scripts.filter(([ , attrs]) => /\bsrc="\/privacy\.js/.test(attrs)).length, 1, 'consent bootstrap preserved');
assert.equal(scripts.filter(([ , attrs]) => /adsbygoogle\.js\?client=ca-pub-4432960986920022/.test(attrs)).length, 1, 'publisher loader preserved');

function element(tag = 'div') {
  return {
    tagName: tag.toUpperCase(), value: '', textContent: '', dataset: {}, children: [], events: {},
    style: {setProperty() {}},
    addEventListener(type, handler) { (this.events[type] ||= []).push(handler); },
    dispatch(type) { for (const handler of this.events[type] || []) handler({target: this}); },
    focus() { this.focused = true; },
    scrollIntoView(options) { this.scrollOptions = options; },
    append(child) { this.children.push(child); },
    appendChild(child) { this.children.push(child); return child; },
    setAttribute(name, value) { this[name] = value; }
  };
}

const ids = new Map([...html.matchAll(/<([a-z][\w:-]*)\b[^>]*\bid="([^"]+)"[^>]*>/gi)].map(([, tag, id]) => [id, element(tag)]));
for (const [, id, content] of html.matchAll(/<pre id="([^"]+)">([\s\S]*?)<\/pre>/g)) ids.get(id).textContent = content;
const samples = [...html.matchAll(/<button\b[^>]*\bdata-sample="([^"]+)"[^>]*>/g)].map(([, id]) => {
  const button = element('button'); button.dataset.sample = id; return button;
});
assert.equal(samples.length, 2, 'two explicit sample controls');

const nav = element('div'), head = element('head');
const document = {
  documentElement: {dataset: {theme: 'light'}}, head,
  getElementById(id) { assert.ok(ids.has(id), 'existing element: ' + id); return ids.get(id); },
  createElement: element,
  querySelectorAll(selector) { assert.equal(selector, '[data-sample]'); return samples; },
  querySelector(selector) {
    if (selector === '.nav-actions') return nav;
    if (selector === 'script[data-ct-ad-layout]') return head.children.find(node => 'ctAdLayout' in node.dataset) || null;
    if (selector === 'script[data-chickentask-analytics]') return head.children.find(node => 'chickentaskAnalytics' in node.dataset) || null;
    throw Error('Unexpected selector: ' + selector);
  }
};
const stored = new Map();
const context = {
  console, document, confirmAnswer: true, confirmCalls: 0,
  localStorage: {getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value)},
  matchMedia: () => ({matches: false}),
  confirm(message) { assert.match(message, /Replace the text/); context.confirmCalls++; return context.confirmAnswer; }
};
context.window = context;
vm.createContext(context);
vm.runInContext(analyzer[0][2], context);
const input = ids.get('textInput');
const result = () => Object.fromEntries(['wordCount', 'charCount', 'numberCount', 'sentenceCount', 'paragraphCount', 'readingTime', 'speakingTime', 'readingLevel'].map(id => [id, String(ids.get(id).textContent)]));

assert.deepEqual(result(), {wordCount: '0', charCount: '0', numberCount: '0', sentenceCount: '0', paragraphCount: '0', readingTime: '0 sec', speakingTime: '0 sec', readingLevel: 'N/A'});
samples[0].dispatch('click');
assert.equal(context.confirmCalls, 0, 'empty editor loads sample without confirmation');
assert.deepEqual(result(), {wordCount: '20', charCount: '113', numberCount: '0', sentenceCount: '2', paragraphCount: '2', readingTime: '6 sec', speakingTime: '9 sec', readingLevel: '4'});
assert.equal(input.focused, true);
assert.equal(input.scrollOptions.block, 'center');

input.value = input.value.replace('first ', '').replace('final ', ''); input.dispatch('input');
assert.equal(result().wordCount, '18', 'worked editing exercise changes the live result');
assert.equal(result().charCount, '101');

input.value = 'Keep this private draft.'; input.dispatch('input');
const before = result(); context.confirmAnswer = false;
samples[1].dispatch('click');
assert.equal(context.confirmCalls, 1);
assert.equal(input.value, 'Keep this private draft.', 'cancelling replacement preserves user input');
assert.deepEqual(result(), before, 'cancelling replacement preserves measurements');
input.value = '  \n'; input.dispatch('input');
samples[1].dispatch('click');
assert.equal(input.value, '  \n', 'even whitespace-only input is preserved on cancellation');
context.confirmAnswer = true; samples[1].dispatch('click');
assert.equal(context.confirmCalls, 3);
assert.deepEqual(result(), {wordCount: '10', charCount: '61', numberCount: '1', sentenceCount: '2', paragraphCount: '2', readingTime: '3 sec', speakingTime: '5 sec', readingLevel: '5'});
input.value = input.value.replace('\n\n', '\n'); input.dispatch('input');
assert.equal(result().paragraphCount, '2'); assert.equal(result().charCount, '60');

input.value = 'word '.repeat(399).trim(); input.dispatch('input');
assert.equal(result().readingTime, '2 min', 'rounded duration carries seconds into minutes');
assert.equal(vm.runInContext('formatDuration(59.6)', context), '1 min');
assert.equal(vm.runInContext('formatDuration(0.3)', context), '1 sec');
assert.equal(vm.runInContext('formatDuration(130)', context), '2 min 10 sec');
input.value = '12 3.5 1,000 2nd'; input.dispatch('input');
assert.equal(result().numberCount, '5', 'documented numeric-group limitations match implementation');
input.value = '🙂'; input.dispatch('input');
assert.equal(result().charCount, '2', 'documented UTF-16 character measurement');
ids.get('clearBtn').dispatch('click');
assert.equal(input.value, ''); assert.equal(result().wordCount, '0');

// Full shared script: the Firebase import is intentionally unavailable in this
// VM and is handled by the site's own catch. No Firebase or ad scripts execute.
vm.runInContext(fs.readFileSync(path.join(root, 'site.js'), 'utf8'), context);
assert.equal(ids.get('themeToggle').events.click.length, 1, 'only one theme handler after integration');
ids.get('themeToggle').dispatch('click');
assert.equal(document.documentElement.dataset.theme, 'dark');
assert.equal(stored.get('cmw-theme'), 'dark');
assert.equal(ids.get('ambient').children.length, 24, 'only one particle set');
assert.equal(nav.children.filter(node => node.className === 'account-nav-link').length, 1);
assert.equal(head.children.filter(node => /\/ad-layout\.js\?/.test(node.src || '')).length, 1, 'manual ads now initialized on counter');
assert.equal(head.children.filter(node => /\/analytics\.js\?/.test(node.src || '')).length, 1, 'shared consent-gated analytics loader');
assert.match(html, /\.privacy-dialog\{/); assert.match(html, /\.privacy-actions\{/);
console.log('PASS: counter examples, user-text preservation, documented counts, duration rollover, shared theme/ad integration.');
