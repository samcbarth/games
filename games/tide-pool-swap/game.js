/* Tide Pool Swap: swap neighbouring sea treasures to line up three or more. 25 tides (moves). */
(function () {
  var N = 8, C = 56, TOP = 52, W = N * C, H = N * C + TOP, MOVES = 25, TYPES = 6;
  var COL = ['#f783ac', '#ffd43b', '#69db7c', '#4dabf7', '#ff922b', '#b197fc'];
  var g = Kit.setup({
    slug: 'tide-pool-swap', w: W, h: H, title: 'Tide Pool Swap',
    intro: 'Drag or tap two neighbouring treasures to swap them. Line up 3 or more to collect. Chains score extra. You have 25 tides.',
    onStart: reset
  });
  var ctx = g.ctx, grid, oy, sel, cur = { x: 3, y: 3 }, moves, score, busy, combo, pops = [], down = null;
  function rnd() { return Math.floor(Math.random() * TYPES); }
  function reset() {
    grid = []; oy = [];
    for (var y = 0; y < N; y++) { grid.push([]); oy.push([]); for (var x = 0; x < N; x++) { var t; do { t = rnd(); } while ((x > 1 && grid[y][x - 1] === t && grid[y][x - 2] === t) || (y > 1 && grid[y - 1][x] === t && grid[y - 2][x] === t)); grid[y].push(t); oy[y].push(-(N - y) * C * 0.6); } }
    sel = null; moves = MOVES; score = 0; busy = false; combo = 0; pops = []; Kit.score(0);
    if (!hasMove()) reset();
  }
  function matches() {
    var m = {}, x, y, k;
    for (y = 0; y < N; y++) for (x = 0; x < N - 2; x++) { k = grid[y][x]; if (k >= 0 && grid[y][x + 1] === k && grid[y][x + 2] === k) { m[y * N + x] = m[y * N + x + 1] = m[y * N + x + 2] = 1; } }
    for (x = 0; x < N; x++) for (y = 0; y < N - 2; y++) { k = grid[y][x]; if (k >= 0 && grid[y + 1][x] === k && grid[y + 2][x] === k) { m[y * N + x] = m[(y + 1) * N + x] = m[(y + 2) * N + x] = 1; } }
    return Object.keys(m).map(Number);
  }
  function swap(a, b) { var t = grid[a.y][a.x]; grid[a.y][a.x] = grid[b.y][b.x]; grid[b.y][b.x] = t; }
  function hasMove() {
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var dirs = [[1, 0], [0, 1]];
      for (var d = 0; d < 2; d++) {
        var b = { x: x + dirs[d][0], y: y + dirs[d][1] }; if (b.x >= N || b.y >= N) continue;
        swap({ x: x, y: y }, b); var ok = matches().length > 0; swap({ x: x, y: y }, b); if (ok) return true;
      }
    }
    return false;
  }
  function trySwap(a, b) {
    if (busy || Kit.state !== 'playing' || moves <= 0) return;
    if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1 || b.x < 0 || b.y < 0 || b.x >= N || b.y >= N) return;
    swap(a, b);
    if (!matches().length) { swap(a, b); pops.push({ x: a.x, y: a.y, t: 0.3, bad: true }); sel = null; return; }
    moves--; sel = null; combo = 0; busy = true; setTimeout(resolve, 120);
  }
  function resolve() {
    var m = matches();
    if (!m.length) {
      busy = false;
      if (!hasMove()) { reshuffle(); }
      if (moves <= 0) setTimeout(function () { Kit.over(score, 'The tide is out'); }, 400);
      return;
    }
    combo++;
    m.forEach(function (i) { var x = i % N, y = (i / N) | 0; pops.push({ x: x, y: y, t: 0.35, c: COL[grid[y][x]] }); grid[y][x] = -1; });
    score += m.length * 10 * combo + (m.length > 3 ? (m.length - 3) * 20 : 0); Kit.score(score);
    for (var x = 0; x < N; x++) {
      var write = N - 1;
      for (var y = N - 1; y >= 0; y--) if (grid[y][x] >= 0) { if (write !== y) { grid[write][x] = grid[y][x]; oy[write][x] = (y - write) * C; } write--; }
      for (y = write; y >= 0; y--) { grid[y][x] = rnd(); oy[y][x] = -(write + 1) * C - 20; }
    }
    setTimeout(resolve, 300);
  }
  function reshuffle() {
    var flat = []; grid.forEach(function (r) { flat = flat.concat(r); });
    do { for (var i = flat.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = flat[i]; flat[i] = flat[j]; flat[j] = t; }
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) grid[y][x] = flat[y * N + x];
    } while (matches().length || !hasMove());
  }
  function cellOf(p) { return { x: Math.floor(p.x / C), y: Math.floor((p.y - TOP) / C) }; }
  g.cv.addEventListener('pointerdown', function (e) {
    if (Kit.state !== 'playing') return; e.preventDefault();
    var c = cellOf(Kit.pos(e)); if (c.y < 0 || c.y >= N) return;
    down = { c: c, x: e.clientX, y: e.clientY };
  });
  g.cv.addEventListener('pointerup', function (e) {
    if (!down) return; var dx = e.clientX - down.x, dy = e.clientY - down.y, c = down.c; down = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 18) {
      var b = Math.abs(dx) > Math.abs(dy) ? { x: c.x + Math.sign(dx), y: c.y } : { x: c.x, y: c.y + Math.sign(dy) };
      trySwap(c, b); return;
    }
    if (sel && Math.abs(sel.x - c.x) + Math.abs(sel.y - c.y) === 1) trySwap(sel, c);
    else sel = (sel && sel.x === c.x && sel.y === c.y) ? null : c;
    cur = { x: c.x, y: c.y };
  });
  document.addEventListener('keydown', function (e) {
    if (Kit.state !== 'playing') return;
    var d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (d) {
      if (sel) trySwap(sel, { x: sel.x + d[0], y: sel.y + d[1] });
      else cur = { x: Math.max(0, Math.min(N - 1, cur.x + d[0])), y: Math.max(0, Math.min(N - 1, cur.y + d[1])) };
    } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); sel = sel ? null : { x: cur.x, y: cur.y }; }
  });
  function shape(t, x, y, r) {
    ctx.fillStyle = COL[t]; ctx.beginPath();
    if (t === 0) ctx.arc(x, y, r, 0, 7);
    else if (t === 1) { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r * 0.8); ctx.lineTo(x - r, y + r * 0.8); ctx.closePath(); }
    else if (t === 2) { Kit.rr(ctx, x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7, 6); }
    else if (t === 3) { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); }
    else if (t === 4) { for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
    else { for (i = 0; i < 6; i++) { a = i * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.22, 0, 7); ctx.fill();
  }
  function draw(dt) {
    var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b7285'); bg.addColorStop(1, '#0c2d48');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e6fcf5'; ctx.font = 'bold 20px system-ui,sans-serif'; ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillText('Tides left: ' + (moves === undefined ? MOVES : moves), 14, 26);
    ctx.textAlign = 'right'; ctx.fillText(combo > 1 && busy ? 'Chain x' + combo : '', W - 14, 26);
    if (!grid) return;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      ctx.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.11)';
      ctx.fillRect(x * C, TOP + y * C, C, C);
      oy[y][x] += (0 - oy[y][x]) * Math.min(1, dt * 14);
      if (grid[y][x] >= 0) {
        var isSel = sel && sel.x === x && sel.y === y;
        shape(grid[y][x], x * C + C / 2, TOP + y * C + C / 2 + oy[y][x], isSel ? 22 : 19);
      }
    }
    if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(sel.x * C + 3, TOP + sel.y * C + 3, C - 6, C - 6); }
    if (Kit.state === 'playing') { ctx.strokeStyle = 'rgba(255,212,59,.8)'; ctx.lineWidth = 2; ctx.strokeRect(cur.x * C + 1, TOP + cur.y * C + 1, C - 2, C - 2); }
    ctx.lineWidth = 1;
    pops.forEach(function (p) {
      p.t -= dt; ctx.globalAlpha = Math.max(0, p.t * 3);
      ctx.strokeStyle = p.bad ? '#ff6b6b' : p.c; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x * C + C / 2, TOP + p.y * C + C / 2, 26 - p.t * 30, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    });
    pops = pops.filter(function (p) { return p.t > 0; });
  }
  reset();
  Kit.loop(function (dt) { draw(dt); });
})();
