/* ChickenTask manual ad placements. Account-side Auto ads/CMP are separate. */
(() => {
  'use strict';
  if (window.__ctAdLayoutStarted) return;
  window.__ctAdLayoutStarted = true;

  const main = document.querySelector('main');
  const path = location.pathname.replace(/\.html$/i, '').replace(/\/+$/, '').toLowerCase() || '/';
  const excluded = new Set(['/account', '/privacy', '/tool-credits', '/404']);
  if (!main || excluded.has(path) || /^\/(private|vendor|tests)(\/|$)/.test(path)
      || document.querySelector('#accountForm, [data-ads="off"]')) return;

  // Separate account-verified fixed sidebar and responsive bottom Display units.
  const CLIENT = 'ca-pub-4432960986920022';
  const SIDE_SLOT = '4311141403';
  const BOTTOM_SLOT = '4877112993';
  const EDGE = 16, RAIL_WIDTH = 162, RAIL_HEIGHT = 630, GAP = 160;
  // Match ad-layout.css: outer width min(100% - 32px, 970px), then
  // two 1px panel borders and two 8px horizontal padding areas.
  const BOTTOM_MAX_WIDTH = 970, BOTTOM_GUTTER = 32, BOTTOM_INSET = 18;
  const placements = [];
  let scheduled = false;
  let resize;
  let scrollbarReserve = 0;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/ad-layout.css?v=20261028';
  css.dataset.ctAdStyles = '';
  css.onload = start;
  css.onerror = () => console.warn('ChickenTask ads: layout stylesheet did not load; no manual ads requested.');
  document.head.append(css);

  function start() {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CLIENT;
    // New tools also need a loader. Never load it twice or override CMP/consent.
    if (!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      document.head.append(script);
    }

    for (const side of ['left', 'right']) {
      const p = createPlacement('side-' + side);
      p.outer.hidden = true;
      document.body.append(p.outer);
      placements.push(p);
    }
    const bottom = createPlacement('bottom');
    main.insertAdjacentElement('afterend', bottom.outer);
    placements.push(bottom);
    resize = new ResizeObserver(schedule);
    resize.observe(main);
    resize.observe(bottom.panel);
    window.addEventListener('resize', schedule, {passive: true});
    window.addEventListener('orientationchange', schedule, {passive: true});
    document.addEventListener('fullscreenchange', schedule);
    document.addEventListener('pointerlockchange', schedule);
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('load', schedule, {once: true});
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    layout();
  }

  function createPlacement(position) {
    const outer = document.createElement('aside');
    outer.className = 'ct-ad-placement ct-ad-placement--' + position;
    outer.dataset.ctAdPosition = position;
    outer.setAttribute('aria-label', 'Advertisement');
    outer.setAttribute('google-side-rail-overlap', 'false');
    const panel = document.createElement('div');
    panel.className = 'ct-ad-panel';
    const label = document.createElement('div');
    label.className = 'ct-ad-label';
    label.textContent = 'Advertisement';
    const slot = document.createElement('div');
    slot.className = 'ct-ad-slot';
    panel.append(label, slot);
    outer.append(panel);
    return {outer, panel, slot, position, requested: false, unfilled: false,
      ad: null, renderedWidth: 0};
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; layout(); });
  }

  function layout() {
    const rect = main.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    const innerViewport = Number.isFinite(window.innerWidth) && window.innerWidth > 0
      ? window.innerWidth : viewport;
    // Hiding the bottom unit can remove a vertical scrollbar and widen
    // clientWidth. Retain actual scrollbar space already observed so that
    // this alone cannot make the unit restore, overflow, and hide in a loop.
    scrollbarReserve = Math.max(scrollbarReserve, innerViewport - viewport);
    const bottomViewport = Math.min(viewport, innerViewport - scrollbarReserve);
    const available = Math.max(0, Math.min(bottomViewport - BOTTOM_GUTTER, BOTTOM_MAX_WIDTH) - BOTTOM_INSET);
    const blocked = !!document.fullscreenElement || !!document.pointerLockElement;
    // Measure actual content instead of an arbitrary screen breakpoint. The
    // entire main region, not just a game canvas, gets a 160px clearance.
    const sidesFit = !blocked && rect.width > 0 && rect.height >= RAIL_HEIGHT + 48
      && rect.left >= EDGE + RAIL_WIDTH + GAP
      && viewport - rect.right >= EDGE + RAIL_WIDTH + GAP;
    const top = Math.max(0, rect.top + window.scrollY) + 24;
    for (const p of placements) {
      const isBottom = p.position === 'bottom';
      if (isBottom) rememberBottomWidth(p);
      setHidden(p, p.unfilled || (isBottom ? p.renderedWidth > available + 1 : !sidesFit));
      if (!isBottom) p.outer.style.top = top + 'px';
      // Bottom is independent of side rails and remains eligible at every
      // initial viewport width with room for a supported minimum ad width.
      // A previously rendered creative can retain its width after a resize.
      // Hide that entire placement until it fits again; never clip or refresh it.
      const width = p.slot.getBoundingClientRect().width;
      if (!p.outer.hidden && width >= (isBottom ? 200 : 160)) requestAd(p);
      if (isBottom && !p.outer.hidden) {
        // Also check a just-restored or synchronously rendered unit. Hidden
        // measurements are zero, so retain the last visible required width.
        rememberBottomWidth(p);
        if (p.renderedWidth > available + 1) setHidden(p, true);
      }
    }
  }

  function setHidden(p, hidden) {
    if (p.outer.hidden !== hidden) p.outer.hidden = hidden;
  }

  function rememberBottomWidth(p) {
    if (!p.ad || p.outer.hidden) return;
    const frames = p.ad.querySelectorAll('iframe');
    if (!frames.length && p.ad.dataset.adStatus !== 'filled') return;
    // Only inspect the parent-page ad elements, never cross into an iframe.
    // scrollWidth includes a fixed Google host that overflows a fluid <ins>.
    let width = Math.max(p.ad.getBoundingClientRect().width, p.ad.scrollWidth);
    for (const frame of frames) width = Math.max(width, frame.getBoundingClientRect().width);
    if (Number.isFinite(width) && width > 0) p.renderedWidth = width;
  }

  function requestAd(p) {
    if (p.requested || document.hidden) return;
    // One request per placement per page load. Never refresh ads on a timer,
    // window resize, game event, or failed request.
    p.requested = true;
    const ad = document.createElement('ins');
    p.ad = ad;
    ad.className = 'adsbygoogle';
    ad.dataset.adClient = CLIENT;
    ad.dataset.adSlot = p.position === 'bottom' ? BOTTOM_SLOT : SIDE_SLOT;
    if (p.position === 'bottom') {
      ad.style.display = 'block';
      ad.dataset.adFormat = 'auto';
      // Stay inside the explicit content width instead of expanding past it.
      ad.dataset.fullWidthResponsive = 'false';
    } else {
      ad.style.cssText = 'display:inline-block;width:160px;height:600px';
    }
    p.slot.append(ad);
    if (p.position === 'bottom') resize.observe(ad);
    const observer = new MutationObserver(() => {
      if (ad.dataset.adStatus === 'unfilled') {
        p.unfilled = true;
        setHidden(p, true);
        observer.disconnect();
        if (p.position === 'bottom') resize.unobserve(ad);
        return;
      }
      if (p.position === 'bottom') schedule();
    });
    observer.observe(ad, p.position === 'bottom'
      ? {attributes: true, childList: true, subtree: true,
        attributeFilter: ['data-ad-status', 'style', 'width', 'height', 'class']}
      : {attributes: true, attributeFilter: ['data-ad-status']});
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      p.outer.dataset.adRequestError = 'true';
      console.warn('ChickenTask ads: ' + p.position + ' request failed.', error);
    }
  }
})();

