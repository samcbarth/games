/* Lunchbreak Arcade game kit: canvas setup, overlay, HUD, high scores, input helpers.
   Every game calls Kit.setup({...}) once and then Kit.start / Kit.score / Kit.over. */
(function () {
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var K = window.Kit = {
    state: 'ready', cur: 0, best: null, plays: 0, opts: null,
    setup: function (o) {
      K.opts = o;
      var stage = K.stage = document.getElementById('stage');
      var cv = K.cv = document.getElementById('game');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(o.w * dpr); cv.height = Math.round(o.h * dpr);
      var ctx = K.ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stage.style.aspectRatio = o.w + ' / ' + o.h;
      stage.style.width = 'min(100%, ' + (o.maxW || o.w) + 'px, max(280px, calc(78vh * ' + (o.w / o.h).toFixed(4) + ')))';
      var hud = document.querySelector('.hud'); if (hud) hud.style.width = stage.style.width;
      var b = parseFloat(lsGet('lba.best.' + o.slug));
      K.best = isNaN(b) ? null : b;
      K.hud();
      K.overlay(o.title, o.intro || 'Press Play to start.', 'Play');
      document.addEventListener('keydown', function (e) {
        var tag = (e.target && e.target.tagName) || '';
        if (K.state !== 'playing') {
          if ((e.key === 'Enter' || e.key === ' ') && !K.lock && (tag !== 'INPUT' || e.target.classList.contains('kit-input'))) {
            if (tag === 'BUTTON' || tag === 'A') return;
            e.preventDefault(); e.stopImmediatePropagation(); K.start();
          }
          return;
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0 && tag !== 'INPUT') e.preventDefault();
      });
      return { cv: cv, ctx: ctx, W: o.w, H: o.h };
    },
    overlay: function (title, text, btn, extra) {
      var ov = document.getElementById('overlay');
      ov.innerHTML = '<h2></h2>' + (extra || '') + '<p class="ov-text"></p><button class="btn" type="button"></button>';
      ov.querySelector('h2').textContent = title;
      ov.querySelector('.ov-text').textContent = text;
      var b = ov.querySelector('button'); b.textContent = btn;
      b.addEventListener('click', function (e) { e.stopPropagation(); K.start(); });
      ov.hidden = false;
      setTimeout(function () { try { b.focus({ preventScroll: true }); } catch (e) {} }, 30);
    },
    start: function () {
      if (K.state === 'playing') return;
      document.getElementById('overlay').hidden = true;
      var bs = document.querySelector('.between-slot'); if (bs) bs.classList.remove('show');
      K.state = 'playing'; K.cur = 0; K.plays++; K.hud();
      K.opts.onStart();
    },
    score: function (n) { K.cur = n; K.hud(); },
    fmt: function (n) { return K.opts.fmt ? K.opts.fmt(n) : String(Math.round(n)); },
    isBetter: function (n) {
      if (K.best === null) return true;
      return K.opts.lowerIsBetter ? n < K.best : n > K.best;
    },
    over: function (final, msg, valid) {
      if (K.state !== 'playing') return;
      K.state = 'over'; K.cur = final;
      var rec = valid !== false && (K.opts.lowerIsBetter ? final > 0 : final > 0) && K.isBetter(final);
      if (rec) { K.best = final; lsSet('lba.best.' + K.opts.slug, String(final)); }
      K.hud();
      var extra = '<div class="big">' + K.fmt(final) + '</div>' + (rec ? '<p><strong>New best!</strong></p>' : '');
      K.lock = true; setTimeout(function () { K.lock = false; }, 500);
      K.overlay(msg || 'Round over', 'Best: ' + (K.best === null ? 'none yet' : K.fmt(K.best)), 'Play again', extra);
      var bs = document.querySelector('.between-slot');
      if (bs && bs.querySelector('ins')) {
        bs.classList.add('show');
        if (!bs.dataset.pushed) { bs.dataset.pushed = '1'; try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {} }
      }
    },
    hud: function () {
      var s = document.getElementById('hud-score'), b = document.getElementById('hud-best');
      var lbl = K.opts && K.opts.scoreLabel || 'Score';
      if (s) s.textContent = lbl + ': ' + K.fmt(K.cur);
      if (b) b.textContent = 'Best: ' + (K.best === null ? '-' : K.fmt(K.best));
    },
    /* pointer position in logical game units */
    pos: function (e) {
      var r = K.cv.getBoundingClientRect();
      var t = e.touches && e.touches[0] || e.changedTouches && e.changedTouches[0] || e;
      return { x: (t.clientX - r.left) * K.opts.w / r.width, y: (t.clientY - r.top) * K.opts.h / r.height };
    },
    /* swipe detection on the canvas: cb('up'|'down'|'left'|'right') ; tap cb receives pos */
    swipe: function (cb, tap) {
      var s = null;
      K.cv.addEventListener('pointerdown', function (e) { s = { x: e.clientX, y: e.clientY, p: K.pos(e) }; });
      K.cv.addEventListener('pointerup', function (e) {
        if (!s) return;
        var dx = e.clientX - s.x, dy = e.clientY - s.y, m = Math.max(Math.abs(dx), Math.abs(dy));
        if (m > 24) cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        else if (tap) tap(s.p);
        s = null;
      });
    },
    /* hidden text input so phones open their keyboard */
    textInput: function (onInput, onKey) {
      var inp = document.createElement('input');
      inp.className = 'kit-input'; inp.type = 'text';
      inp.setAttribute('autocomplete', 'off'); inp.setAttribute('autocapitalize', 'off');
      inp.setAttribute('autocorrect', 'off'); inp.setAttribute('spellcheck', 'false');
      inp.setAttribute('aria-label', 'Type here');
      inp.style.cssText = 'position:absolute;left:0;bottom:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;z-index:1';
      K.stage.appendChild(inp);
      inp.addEventListener('input', function () { onInput(inp.value, inp); });
      if (onKey) inp.addEventListener('keydown', function (e) { onKey(e, inp); });
      K.cv.addEventListener('pointerdown', function () { setTimeout(function () { inp.focus({ preventScroll: true }); }, 0); });
      return inp;
    },
    /* manual stepping, used by automated tests when the tab is hidden and rAF is paused */
    fns: [], simT: 0,
    step: function (dt, n) { for (var i = 0; i < (n || 1); i++) { K.simT += dt * 1000; K.fns.forEach(function (f) { f(dt, K.simT); }); } },
    loop: function (fn) {
      var last = 0; K.fns.push(fn);
      function f(t) {
        var dt = last ? Math.min((t - last) / 1000, 0.05) : 0; last = t;
        fn(dt, t); requestAnimationFrame(f);
      }
      requestAnimationFrame(f);
    },
    rr: function (ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
  };
})();
