// Basic consent mode: do not download GA4 or send measurement before opt-in.
(() => {
  'use strict';
  const id = 'G-5ZKS0MWH8V';
  function start() {
    if (!window.ChickenTaskPrivacy || !window.ChickenTaskPrivacy.analyticsAllowed()
        || window.__chickenTaskGA4Loaded) return;
    window.__chickenTaskGA4Loaded = true;
    window.gtag('js', new Date());
    window.gtag('config', id, {allow_google_signals: false, allow_ad_personalization_signals: false});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }
  window.addEventListener('ct-analytics-consent', start);
  start();
})();

