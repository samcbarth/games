/* Theme toggle + ad slot rendering. Ads only render when SITE_CONFIG has ids. */
(function () {
  var root = document.documentElement;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var saved = store('theme');
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme-btn');
    if (btn) btn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') ||
        (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next); store('theme', next);
    });
    renderAds();
  });
  function renderAds() {
    var cfg = window.SITE_CONFIG || {};
    var slots = document.querySelectorAll('.ad-slot');
    if (!cfg.ADSENSE_CLIENT) { slots.forEach(function (s) { s.remove(); }); return; }
    var used = 0;
    slots.forEach(function (s) {
      var id = (cfg.AD_SLOTS || {})[s.getAttribute('data-slot')];
      if (!id) { s.remove(); return; }
      s.innerHTML = '<span class="ad-label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="' +
        cfg.ADSENSE_CLIENT + '" data-ad-slot="' + id + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
      used++;
    });
    if (!used) return;
    var sc = document.createElement('script');
    sc.async = true; sc.crossOrigin = 'anonymous';
    sc.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + cfg.ADSENSE_CLIENT;
    document.head.appendChild(sc);
    document.querySelectorAll('.ad-slot ins').forEach(function (ins) {
      if (ins.closest('.between-slot')) return; // pushed when the round ends
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    });
  }
})();
