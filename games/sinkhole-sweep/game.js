/* Sinkhole Sweep: survey a meadow. Numbers tell how many sinkholes touch each patch. */
(function () {
  var N = 9, HOLES = 10, C = 48, S = N * C;
  var g = Kit.setup({
    slug: 'sinkhole-sweep', w: S, h: S, title: 'Sinkhole Sweep',
    intro: 'Tap to survey a patch. Long-press, right-click or use Flag mode to stake a sinkhole. Clear every safe patch to win.',
    onStart: reset
  });
  var ctx = g.ctx, cells, first, revealed, flagMode = false, cur = { x: 4, y: 4 }, t0, score, boom = null, finished;
  function reset() {
    cells = []; for (var i = 0; i < N * N; i++) cells.push({ hole: false, open: false, flag: false, n: 0 });
    first = true; revealed = 0; score = 0; boom = null; finished = false; t0 = performance.now(); Kit.score(0);
  }
  function at(x, y) { return x >= 0 && y >= 0 && x < N && y < N ? cells[y * N + x] : null; }
  function around(x, y, f) { for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) if (dx || dy) { var c = at(x + dx, y + dy); if (c) f(c, x + dx, y + dy); } }
  function plant(sx, sy) {
    var placed = 0;
    while (placed < HOLES) {
      var x = Math.floor(Math.random() * N), y = Math.floor(Math.random() * N);
      if (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1) continue;
      var c = at(x, y); if (c.hole) continue; c.hole = true; placed++;
    }
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) { var n = 0; around(x, y, function (o) { if (o.hole) n++; }); at(x, y).n = n; }
    t0 = performance.now();
  }
  function open(x, y) {
    if (Kit.state !== 'playing' || finished) return;
    var c = at(x, y); if (!c || c.open || c.flag) return;
    if (first) { plant(x, y); first = false; }
    if (c.hole) {
      c.open = true; boom = { x: x, y: y }; finished = true;
      cells.forEach(function (o) { if (o.hole) o.open = true; });
      setTimeout(function () { Kit.over(score, 'You found a sinkhole'); }, 700); return;
    }
    var stack = [[x, y]];
    while (stack.length) {
      var p = stack.pop(), q = at(p[0], p[1]);
      if (q.open || q.flag) continue;
      q.open = true; revealed++;
      if (q.n === 0) around(p[0], p[1], function (o, ox, oy) { if (!o.open && !o.hole) stack.push([ox, oy]); });
    }
    score = revealed * 10; Kit.score(score);
    if (revealed === N * N - HOLES) {
      finished = true;
      var secs = (performance.now() - t0) / 1000;
      score += Math.max(0, Math.round(500 - secs * 3)); Kit.score(score);
      cells.forEach(function (o) { if (o.hole) o.flag = true; });
      setTimeout(function () { Kit.over(score, 'Meadow surveyed in ' + Math.round(secs) + 's'); }, 500);
    }
  }
  function flag(x, y) {
    if (Kit.state !== 'playing' || finished) return;
    var c = at(x, y); if (c && !c.open) c.flag = !c.flag;
  }
  function cellAt(p) { return { x: Math.floor(p.x / C), y: Math.floor(p.y / C) }; }
  var press = null;
  g.cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  g.cv.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    var c = cellAt(Kit.pos(e)); cur = c;
    if (e.button === 2) { flag(c.x, c.y); press = null; return; }
    press = { c: c, done: false, timer: setTimeout(function () { if (press) { press.done = true; flag(c.x, c.y); if (navigator.vibrate) try { navigator.vibrate(20); } catch (er) {} } }, 420) };
  });
  g.cv.addEventListener('pointerup', function () {
    if (!press) return; clearTimeout(press.timer);
    if (!press.done) { if (flagMode) flag(press.c.x, press.c.y); else open(press.c.x, press.c.y); }
    press = null;
  });
  g.cv.addEventListener('pointerleave', function () { if (press) { clearTimeout(press.timer); press = null; } });
  var fb = document.querySelector('[data-act="flag"]');
  if (fb) fb.addEventListener('click', function () { flagMode = !flagMode; fb.classList.toggle('on', flagMode); fb.textContent = flagMode ? 'Flag mode: on' : 'Flag mode: off'; });
  document.addEventListener('keydown', function (e) {
    if (Kit.state !== 'playing') return;
    var k = e.key;
    if (k === 'ArrowUp') cur.y = Math.max(0, cur.y - 1);
    else if (k === 'ArrowDown') cur.y = Math.min(N - 1, cur.y + 1);
    else if (k === 'ArrowLeft') cur.x = Math.max(0, cur.x - 1);
    else if (k === 'ArrowRight') cur.x = Math.min(N - 1, cur.x + 1);
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); open(cur.x, cur.y); }
    else if (k === 'f' || k === 'F') flag(cur.x, cur.y);
  });
  var NUMC = ['', '#1c7ed6', '#2b8a3e', '#e03131', '#5f3dc4', '#c2255c', '#0c8599', '#212529', '#868e96'];
  function draw() {
    ctx.fillStyle = '#2b2a1f'; ctx.fillRect(0, 0, S, S);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var c = cells[y * N + x], px = x * C, py = y * C;
      if (!c.open) {
        ctx.fillStyle = (x + y) % 2 ? '#69a84f' : '#79b85c'; ctx.fillRect(px, py, C, C);
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(px, py, C, 3);
        ctx.strokeStyle = '#4f8a3a'; ctx.beginPath();
        ctx.moveTo(px + 12, py + 34); ctx.lineTo(px + 14, py + 26); ctx.moveTo(px + 30, py + 20); ctx.lineTo(px + 32, py + 12); ctx.stroke();
        if (c.flag) {
          ctx.fillStyle = '#5c3d1e'; ctx.fillRect(px + 22, py + 12, 4, 26);
          ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.moveTo(px + 26, py + 12); ctx.lineTo(px + 38, py + 18); ctx.lineTo(px + 26, py + 24); ctx.fill();
        }
      } else {
        ctx.fillStyle = (x + y) % 2 ? '#d8b98c' : '#e3c79d'; ctx.fillRect(px, py, C, C);
        if (c.hole) {
          ctx.fillStyle = boom && boom.x === x && boom.y === y ? '#c92a2a' : '#6b4f2f'; ctx.fillRect(px, py, C, C);
          ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.ellipse(px + C / 2, py + C / 2, 15, 11, 0, 0, 7); ctx.fill();
        } else if (c.n) {
          ctx.fillStyle = NUMC[c.n]; ctx.font = 'bold 24px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(c.n, px + C / 2, py + C / 2 + 1);
        }
      }
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.strokeRect(px + .5, py + .5, C - 1, C - 1);
    }
    if (Kit.state === 'playing') { ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 3; ctx.strokeRect(cur.x * C + 2, cur.y * C + 2, C - 4, C - 4); ctx.lineWidth = 1; }
  }
  reset();
  Kit.t = { get cells() { return cells; }, open: open, flag: flag }; // test hook
  Kit.loop(draw);
})();
