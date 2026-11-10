/* Crate Stack: drag crate shapes onto the warehouse floor. Fill a row or column to ship it. */
(function () {
  var W = 400, H = 580, N = 8, C = 44, BX = 24, BY = 56, TRAY = 470;
  var SHAPES = [
    [[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]],
    [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]], [[0, 0], [0, 1], [1, 1]],
    [[1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[1, 0], [1, 1], [0, 2], [1, 2]]
  ];
  var COLS = ['#e8a35c', '#d08c48', '#c9a26b', '#e0b77a', '#b8834f'];
  var g = Kit.setup({
    slug: 'crate-stack', w: W, h: H, title: 'Crate Stack',
    intro: 'Drag a crate shape onto the floor. Fill a full row or column to ship it out. Keys: 1, 2, 3 to pick, arrows to move, Enter to drop.',
    onStart: reset
  });
  var ctx = g.ctx, board, tray, score, drag = null, ksel = -1, kpos = { x: 3, y: 3 }, flash = [];
  function reset() {
    board = []; for (var i = 0; i < N * N; i++) board.push(0);
    score = 0; flash = []; ksel = -1; drag = null; deal(); Kit.score(0);
  }
  function deal() { tray = [0, 1, 2].map(function () { return { s: SHAPES[Math.floor(Math.random() * SHAPES.length)], c: COLS[Math.floor(Math.random() * COLS.length)] }; }); }
  function fits(s, gx, gy) { return s.every(function (p) { var x = gx + p[0], y = gy + p[1]; return x >= 0 && y >= 0 && x < N && y < N && !board[y * N + x]; }); }
  function anyFit(s) { for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (fits(s, x, y)) return true; return false; }
  function place(i, gx, gy) {
    var piece = tray[i]; if (!piece || !fits(piece.s, gx, gy)) return false;
    piece.s.forEach(function (p) { board[(gy + p[1]) * N + gx + p[0]] = piece.c; });
    score += piece.s.length; tray[i] = null;
    var rows = [], cols = [], x, y;
    for (y = 0; y < N; y++) { var full = true; for (x = 0; x < N; x++) if (!board[y * N + x]) full = false; if (full) rows.push(y); }
    for (x = 0; x < N; x++) { full = true; for (y = 0; y < N; y++) if (!board[y * N + x]) full = false; if (full) cols.push(x); }
    rows.forEach(function (r) { for (var x = 0; x < N; x++) { board[r * N + x] = 0; flash.push({ x: x, y: r, t: 0.4 }); } });
    cols.forEach(function (c) { for (var y = 0; y < N; y++) { board[y * N + c] = 0; flash.push({ x: c, y: y, t: 0.4 }); } });
    var lines = rows.length + cols.length;
    if (lines) score += lines * 10 * lines;
    Kit.score(score);
    if (tray.every(function (t) { return !t; })) deal();
    if (!tray.some(function (t) { return t && anyFit(t.s); })) setTimeout(function () { Kit.over(score, 'The warehouse is full'); }, 350);
    return true;
  }
  function trayRect(i) { return { x: 14 + i * 128, y: TRAY - 10, w: 116, h: 110 }; }
  function dims(s) { var w = 0, h = 0; s.forEach(function (p) { w = Math.max(w, p[0] + 1); h = Math.max(h, p[1] + 1); }); return { w: w, h: h }; }
  function dropCell() {
    if (!drag) return null;
    var tx = drag.x - drag.ox, ty = drag.y - drag.oy;
    return { x: Math.round((tx - BX) / C), y: Math.round((ty - BY) / C) };
  }
  g.cv.addEventListener('pointerdown', function (e) {
    if (Kit.state !== 'playing') return; e.preventDefault();
    var p = Kit.pos(e);
    for (var i = 0; i < 3; i++) {
      var r = trayRect(i);
      if (tray[i] && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
        var d = dims(tray[i].s), lift = e.pointerType === 'touch' ? 80 : 30;
        drag = { i: i, x: p.x, y: p.y, ox: d.w * C / 2, oy: d.h * C / 2 + lift };
        g.cv.setPointerCapture && g.cv.setPointerCapture(e.pointerId); ksel = -1; return;
      }
    }
  });
  g.cv.addEventListener('pointermove', function (e) { if (drag) { var p = Kit.pos(e); drag.x = p.x; drag.y = p.y; } });
  g.cv.addEventListener('pointerup', function () {
    if (!drag) return; var c = dropCell(); place(drag.i, c.x, c.y); drag = null;
  });
  document.addEventListener('keydown', function (e) {
    if (Kit.state !== 'playing') return;
    if (e.key === '1' || e.key === '2' || e.key === '3') { var i = +e.key - 1; if (tray[i]) ksel = i; return; }
    if (ksel < 0) { for (var j = 0; j < 3; j++) if (tray[j]) { ksel = j; break; } }
    var d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (d) { kpos.x = Math.max(0, Math.min(N - 1, kpos.x + d[0])); kpos.y = Math.max(0, Math.min(N - 1, kpos.y + d[1])); }
    if ((e.key === 'Enter' || e.key === ' ') && ksel >= 0) { e.preventDefault(); if (place(ksel, kpos.x, kpos.y)) ksel = -1; }
  });
  function crate(x, y, s, col, alpha) {
    ctx.globalAlpha = alpha || 1;
    ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
    ctx.strokeStyle = 'rgba(80,45,15,.55)'; ctx.lineWidth = Math.max(1, s / 16);
    ctx.strokeRect(x + 3, y + 3, s - 6, s - 6);
    ctx.beginPath(); ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + s - 3, y + s - 3); ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  }
  function draw(dt) {
    ctx.fillStyle = '#2f3a3f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e9ecef'; ctx.font = 'bold 18px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Fill rows or columns to ship them', W / 2, 28);
    ctx.fillStyle = '#5c6970'; ctx.fillRect(BX - 6, BY - 6, N * C + 12, N * C + 12);
    if (!board) return;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var v = board[y * N + x];
      if (v) crate(BX + x * C, BY + y * C, C, v);
      else { ctx.fillStyle = (x + y) % 2 ? '#47535a' : '#4d5a61'; ctx.fillRect(BX + x * C, BY + y * C, C - 1, C - 1); }
    }
    flash.forEach(function (f) { f.t -= dt; ctx.globalAlpha = Math.max(0, f.t * 2.5); ctx.fillStyle = '#fff3bf'; ctx.fillRect(BX + f.x * C, BY + f.y * C, C - 1, C - 1); ctx.globalAlpha = 1; });
    flash = flash.filter(function (f) { return f.t > 0; });
    // ghost
    var gh = null;
    if (drag) { var dc = dropCell(); gh = { s: tray[drag.i].s, x: dc.x, y: dc.y }; }
    else if (ksel >= 0 && tray[ksel] && Kit.state === 'playing') gh = { s: tray[ksel].s, x: kpos.x, y: kpos.y };
    if (gh) {
      var ok = fits(gh.s, gh.x, gh.y);
      gh.s.forEach(function (p) {
        var gx = gh.x + p[0], gy = gh.y + p[1]; if (gx < 0 || gy < 0 || gx >= N || gy >= N) return;
        ctx.fillStyle = ok ? 'rgba(140,233,154,.45)' : 'rgba(255,107,107,.45)'; ctx.fillRect(BX + gx * C, BY + gy * C, C - 1, C - 1);
      });
    }
    for (var i = 0; i < 3; i++) {
      var r = trayRect(i);
      ctx.fillStyle = ksel === i ? '#5f6f77' : '#3a464c'; Kit.rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
      ctx.fillStyle = '#adb5bd'; ctx.font = '12px system-ui,sans-serif'; ctx.fillText(String(i + 1), r.x + 10, r.y + 12);
      var t = tray[i]; if (!t || (drag && drag.i === i)) continue;
      var d = dims(t.s), s = Math.min(24, 96 / Math.max(d.w, d.h)), ox = r.x + (r.w - d.w * s) / 2, oy = r.y + (r.h - d.h * s) / 2;
      var dim = !anyFit(t.s);
      t.s.forEach(function (p) { crate(ox + p[0] * s, oy + p[1] * s, s, t.c, dim ? 0.35 : 1); });
    }
    if (drag) { var tp = tray[drag.i]; tp.s.forEach(function (p) { crate(drag.x - drag.ox + p[0] * C, drag.y - drag.oy + p[1] * C, C, tp.c, 0.9); }); }
  }
  reset();
  Kit.loop(function (dt) { draw(dt); });
})();
