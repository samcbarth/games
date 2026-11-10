/* Glowworm: steer a glowing worm through the night garden, eat dewdrops, don't bite yourself. */
(function () {
  var N = 20, C = 24;
  var g = Kit.setup({
    slug: 'glowworm', w: N * C, h: N * C, title: 'Glowworm',
    intro: 'Arrow keys, WASD, swipe or the buttons to steer. Eat dewdrops, avoid your own tail and the walls.',
    onStart: reset
  });
  var ctx = g.ctx, worm, dir, next, food, timer, step, score, glow = 0, dead = false;
  function reset() {
    worm = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    dir = { x: 1, y: 0 }; next = []; step = 0.14; timer = 0; score = 0; dead = false;
    placeFood(); Kit.score(0);
  }
  function placeFood() {
    do { food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N), gold: Math.random() < 0.12 }; }
    while (worm.some(function (s) { return s.x === food.x && s.y === food.y; }));
  }
  var DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  function turn(name) {
    if (Kit.state !== 'playing') return;
    var d = DIRS[name], last = next.length ? next[next.length - 1] : dir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (next.length < 3) next.push(d);
  }
  document.addEventListener('keydown', function (e) {
    var m = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' }[e.key];
    if (m) turn(m);
  });
  Kit.swipe(turn);
  document.querySelectorAll('[data-dir]').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); turn(b.dataset.dir); });
  });
  function tick() {
    if (next.length) dir = next.shift();
    var h = { x: worm[0].x + dir.x, y: worm[0].y + dir.y };
    if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || worm.some(function (s, i) { return i < worm.length - 1 && s.x === h.x && s.y === h.y; })) {
      dead = true; Kit.over(score, score >= 200 ? 'Bright run!' : 'The worm tied itself in a knot'); return;
    }
    worm.unshift(h);
    if (h.x === food.x && h.y === food.y) {
      score += food.gold ? 50 : 10; Kit.score(score); glow = 1;
      if (food.gold) worm.push(Object.assign({}, worm[worm.length - 1]));
      step = Math.max(0.065, step - 0.003); placeFood();
    } else worm.pop();
  }
  function draw(t) {
    ctx.fillStyle = '#141225'; ctx.fillRect(0, 0, g.W, g.H);
    ctx.fillStyle = '#1b1830';
    for (var y = 0; y < N; y++) for (var x = (y % 2); x < N; x += 2) ctx.fillRect(x * C, y * C, C, C);
    // dewdrop
    var pulse = 0.5 + 0.5 * Math.sin(t / 180);
    ctx.save(); ctx.translate(food.x * C + C / 2, food.y * C + C / 2);
    ctx.shadowColor = food.gold ? '#ffd43b' : '#74c0fc'; ctx.shadowBlur = 10 + 8 * pulse;
    ctx.fillStyle = food.gold ? '#ffd43b' : '#a5d8ff';
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(8, 2, 0, 8); ctx.quadraticCurveTo(-8, 2, 0, -9); ctx.fill();
    ctx.restore();
    // worm
    ctx.save(); ctx.shadowColor = '#b2f2bb'; ctx.shadowBlur = 8 + glow * 14;
    for (var i = worm.length - 1; i >= 0; i--) {
      var s = worm[i], k = 1 - i / (worm.length + 4);
      ctx.fillStyle = 'hsl(' + (110 + i * 2) + ',70%,' + (45 + 25 * k) + '%)';
      Kit.rr(ctx, s.x * C + 2, s.y * C + 2, C - 4, C - 4, 8); ctx.fill();
    }
    ctx.restore();
    var hd = worm[0]; ctx.fillStyle = '#141225';
    var ex = dir.y !== 0 ? 5 : 0, ey = dir.x !== 0 ? 5 : 0;
    ctx.beginPath(); ctx.arc(hd.x * C + C / 2 + dir.x * 4 - ex, hd.y * C + C / 2 + dir.y * 4 - ey, 2.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(hd.x * C + C / 2 + dir.x * 4 + ex, hd.y * C + C / 2 + dir.y * 4 + ey, 2.5, 0, 7); ctx.fill();
  }
  reset();
  Kit.loop(function (dt, t) {
    if (Kit.state === 'playing' && !dead) {
      timer += dt; glow = Math.max(0, glow - dt * 2);
      while (timer >= step && Kit.state === 'playing') { timer -= step; tick(); }
    }
    draw(t);
  });
})();
