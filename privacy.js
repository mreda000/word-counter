/* Run synchronously before advertising or measurement. */
(() => {
  'use strict';
  if (window.ChickenTaskPrivacy) return;
  const KEY = 'ct-analytics-consent-v1', MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const GA_ID = 'G-5ZKS0MWH8V';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', wait_for_update: 500
  });
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      if (value && typeof value.allowed === 'boolean' && Number.isFinite(value.time)
          && value.time <= Date.now() && Date.now() - value.time < MAX_AGE) return value.allowed;
    } catch (_) { /* Storage unavailable means no optional analytics. */ }
    return false;
  }
  let allowed = false;
  function clearAnalyticsCookies() {
    const domains = [null, location.hostname, '.' + location.hostname];
    const parts = location.hostname.split('.');
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    for (const entry of document.cookie.split(';')) {
      const name = entry.trim().split('=')[0];
      if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) continue;
      for (const domain of domains) document.cookie = name + '=; Max-Age=0; path=/'
        + (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
    }
  }
  function apply(next) {
    allowed = next;
    window['ga-disable-' + GA_ID] = !next;
    // Advertising choices belong exclusively to Google's certified CMP.
    window.gtag('consent', 'update', {analytics_storage: next ? 'granted' : 'denied'});
    if (!next) clearAnalyticsCookies();
    window.dispatchEvent(new CustomEvent('ct-analytics-consent', {detail: {allowed: next}}));
  }
  function choose(next) {
    try { localStorage.setItem(KEY, JSON.stringify({allowed: next, time: Date.now()})); } catch (_) {}
    apply(next);
  }
  window.ChickenTaskPrivacy = {analyticsAllowed: () => allowed};
  apply(read());
  window.addEventListener('storage', event => { if (event.key === KEY || event.key === null) apply(read()); });
  window.addEventListener('focus', () => apply(read()));
  function mount() {
    const footer = document.querySelector('footer .footer-inner > div') || document.querySelector('footer');
    if (!footer) return;
    const open = document.createElement('button');
    open.type = 'button'; open.className = 'privacy-link'; open.textContent = 'Privacy choices';
    const dialog = document.createElement('dialog');
    dialog.className = 'privacy-dialog'; dialog.setAttribute('aria-labelledby', 'ct-privacy-title');
    dialog.innerHTML = '<h2 id="ct-privacy-title">Privacy choices</h2>'
      + '<p>Games and tools work with optional analytics turned off. If you allow analytics, Google Analytics receives usage information such as pages visited, browser details and interaction data. We do not send your tool text or selected files to Analytics.</p>'
      + '<p id="ct-analytics-status" role="status"></p><div class="privacy-actions">'
      + '<button type="button" data-choice="false">Keep analytics off</button>'
      + '<button type="button" data-choice="true">Allow analytics</button></div>'
      + '<h3>Advertising choices</h3><p>Advertising consent is managed separately by Google. Where a regional message applies, use its choices and the Do not sell or share link provided by Google.</p>'
      + '<button type="button" id="ct-ad-choices">Change European advertising consent</button>'
      + '<p id="ct-ad-status" role="status"></p><p><a href="/Privacy">Read the privacy policy</a></p>'
      + '<button type="button" id="ct-close-privacy">Close</button>';
    function status() { dialog.querySelector('#ct-analytics-status').textContent = 'Optional analytics: ' + (allowed ? 'on' : 'off') + '.'; }
    open.addEventListener('click', () => { status(); dialog.showModal(); });
    dialog.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
      choose(button.dataset.choice === 'true'); status();
    }));
    dialog.querySelector('#ct-ad-choices').addEventListener('click', () => {
      if (window.googlefc && typeof window.googlefc.showRevocationMessage === 'function') {
        dialog.close(); window.googlefc.showRevocationMessage();
      } else {
        dialog.querySelector('#ct-ad-status').textContent = 'The Google consent message is not available here yet. It may not apply in your region or may be blocked. You can keep analytics off and contact us using the privacy policy.';
      }
    });
    dialog.querySelector('#ct-close-privacy').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => open.focus());
    footer.append(open); document.body.append(dialog);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true});
  else mount();
})();
