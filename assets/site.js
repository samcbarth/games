/* Sticky nav state + ad slot rendering. Ads only render when SITE_CONFIG has ids. */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var hdr = document.querySelector('header.site');
    function onScroll() { if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
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
