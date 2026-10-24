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

  // Preserve the existing account and ad unit. Verify this unit is a responsive
  // Display unit in AdSense; the site-wide loader does not establish that fact.
  const CLIENT = 'ca-pub-4432960986920022';
  const SLOT = '4311141403';
  const EDGE = 16, RAIL_WIDTH = 162, RAIL_HEIGHT = 630, GAP = 160;
  const placements = [];
  let scheduled = false;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/ad-layout.css?v=20261024';
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
    const resize = new ResizeObserver(schedule);
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
    return {outer, panel, slot, position, requested: false, unfilled: false, ad: null};
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; layout(); });
  }

  function layout() {
    const rect = main.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    const blocked = !!document.fullscreenElement || !!document.pointerLockElement;
    // Measure actual content instead of an arbitrary screen breakpoint. The
    // entire main region, not just a game canvas, gets a 160px clearance.
    const sidesFit = !blocked && rect.width > 0 && rect.height >= RAIL_HEIGHT + 48
      && rect.left >= EDGE + RAIL_WIDTH + GAP
      && viewport - rect.right >= EDGE + RAIL_WIDTH + GAP;
    const top = Math.max(0, rect.top + window.scrollY) + 24;
    for (const p of placements) {
      const isBottom = p.position === 'bottom';
      p.outer.hidden = p.unfilled || (!isBottom && !sidesFit);
      if (!isBottom) p.outer.style.top = top + 'px';
      // Bottom is independent of side rails and remains eligible at every
      // viewport width. At <=200px there is no supported minimum ad width.
      const width = p.slot.getBoundingClientRect().width;
      if (!p.outer.hidden && width >= (isBottom ? 200 : 160)) requestAd(p);
    }
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
    ad.dataset.adSlot = SLOT;
    if (p.position === 'bottom') {
      ad.style.display = 'block';
      ad.dataset.adFormat = 'auto';
      // Stay inside the explicit content width instead of expanding past it.
      ad.dataset.fullWidthResponsive = 'false';
    } else {
      ad.style.cssText = 'display:inline-block;width:160px;height:600px';
    }
    p.slot.append(ad);
    const observer = new MutationObserver(() => {
      if (ad.dataset.adStatus === 'unfilled') {
        p.unfilled = true;
        p.outer.hidden = true;
        observer.disconnect();
      }
    });
    observer.observe(ad, {attributes: true, attributeFilter: ['data-ad-status']});
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      p.outer.dataset.adRequestError = 'true';
      console.warn('ChickenTask ads: ' + p.position + ' request failed.', error);
    }
  }
})();
