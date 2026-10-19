// Google Analytics 4 tag for ChickenTask.
// Load once on every page without changing gameplay or authentication.
(function () {
  if (window.__chickenTaskGA4Loaded) return;
  window.__chickenTaskGA4Loaded = true;
  var id = 'G-5ZKS0MWH8V';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(script);
})();
