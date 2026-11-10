/* Rooftop Dash: a courier runs across city rooftops at dusk. Jump gaps and vents. */
(function () {
  var W = 640, H = 360, GRAV = 1700, JUMP = 600;
  var g = Kit.setup({
    slug: 'rooftop-dash', w: W, h: H, maxW: 760, title: 'Rooftop Dash',
    intro: 'Tap, click, Space or Up to jump. Tap again in the air for a second jump. Clear gaps and vents.',
    onStart: reset, scoreLabel: 'Meters'
  });
  var ctx = g.ctx, p, roofs, vents, speed, dist, jumps, alive, stars = [], far = [];
  for (var i = 0; i < 40; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.5, r: Math.random() * 1.5 + 0.3 });
  for (i = 0; i < 12; i++) far.push({ x: i * 70, w: 50 + Math.random() * 30, h: 60 + Math.random() * 120 });
  function reset() {
    p = { x: 110, y: 200, vy: 0, w: 22, h: 34, ground: true };
    roofs = [{ x: -20, w: 520, top: 240 }]; vents = []; speed = 270; dist = 0; jumps = 0; alive = true;
    while (roofs[roofs.length - 1].x < W * 2) addRoof();
    p.y = 240 - p.h; Kit.score(0);
  }
  function addRoof() {
    var last = roofs[roofs.length - 1];
    var air = 2 * JUMP / GRAV;
    var gap = 40 + Math.random() * Math.min(0.55 * air * speed, 210);
    var top = Math.max(150, Math.min(300, last.top + (Math.random() * 110 - 55)));
    if (top < last.top - 70) top = last.top - 70;
    var r = { x: last.x + last.w + gap, w: 180 + Math.random() * 260, top: top };
    roofs.push(r);
    if (r.w > 240 && Math.random() < 0.6) vents.push({ x: r.x + 80 + Math.random() * (r.w - 140), y: top, w: 22, h: 20 + Math.random() * 14 });
  }
  function jump() {
    if (Kit.state !== 'playing') return;
    if (p.ground) { p.vy = -JUMP; p.ground = false; jumps = 1; }
    else if (jumps < 2) { p.vy = -JUMP * 0.85; jumps = 2; }
  }
  document.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && !e.repeat) jump();
  });
  g.cv.addEventListener('pointerdown', function (e) { e.preventDefault(); jump(); });
  function update(dt) {
    speed = Math.min(620, speed + dt * 7);
    var dx = speed * dt; dist += dx;
    roofs.forEach(function (r) { r.x -= dx; }); vents.forEach(function (v) { v.x -= dx; });
    while (roofs.length && roofs[0].x + roofs[0].w < -40) roofs.shift();
    while (vents.length && vents[0].x + vents[0].w < -40) vents.shift();
    while (roofs[roofs.length - 1].x < W * 1.6) addRoof();
    var prevBottom = p.y + p.h;
    p.vy += GRAV * dt; p.y += p.vy * dt; p.ground = false;
    roofs.forEach(function (r) {
      var over = p.x + p.w > r.x && p.x < r.x + r.w;
      if (!over) return;
      if (p.vy >= 0 && prevBottom <= r.top + 2 && p.y + p.h >= r.top) { p.y = r.top - p.h; p.vy = 0; p.ground = true; jumps = 0; }
      else if (p.y + p.h > r.top + 8 && p.x + p.w - r.x < 14) die('Ran into a wall');
    });
    vents.forEach(function (v) {
      if (p.x + p.w - 4 > v.x && p.x + 4 < v.x + v.w && p.y + p.h > v.y - v.h + 4) die('Tripped on a vent');
    });
    if (p.y > H + 40) die('Missed the rooftop');
    Kit.score(Math.floor(dist / 10));
  }
  function die(msg) { if (!alive) return; alive = false; Kit.over(Math.floor(dist / 10), msg); }
  function draw(t) {
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2b1d4a'); sky.addColorStop(0.6, '#e8590c'); sky.addColorStop(1, '#f59f00');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    stars.forEach(function (s) { ctx.fillRect(s.x, s.y, s.r, s.r); });
    ctx.fillStyle = '#ffe8cc'; ctx.beginPath(); ctx.arc(500, 120, 34, 0, 7); ctx.fill();
    var off = (dist * 0.2) % 840;
    ctx.fillStyle = '#5f3dc4';
    far.forEach(function (b) { var x = ((b.x - off) % 840 + 840) % 840 - 60; ctx.fillRect(x, H - 90 - b.h, b.w, b.h + 90); });
    roofs.forEach(function (r) {
      ctx.fillStyle = '#25213a'; ctx.fillRect(r.x, r.top, r.w, H - r.top);
      ctx.fillStyle = '#3b3557'; ctx.fillRect(r.x - 4, r.top, r.w + 8, 8);
      ctx.fillStyle = '#ffd8a8';
      for (var wy = r.top + 26; wy < H; wy += 34) for (var wx = r.x + 16; wx < r.x + r.w - 20; wx += 36)
        if (((wx * 7 + wy * 3) | 0) % 5 < 2) ctx.fillRect(wx, wy, 14, 16);
    });
    vents.forEach(function (v) {
      ctx.fillStyle = '#868e96'; ctx.fillRect(v.x, v.y - v.h, v.w, v.h);
      ctx.fillStyle = '#495057'; ctx.fillRect(v.x - 3, v.y - v.h, v.w + 6, 5);
    });
    // runner
    var leg = p.ground ? Math.sin(t / 60) * 6 : 3;
    ctx.fillStyle = '#ffd43b'; ctx.fillRect(p.x + 3, p.y + 6, p.w - 6, p.h - 16);
    ctx.fillStyle = '#ffe3c2'; ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + 4, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#1971c2'; ctx.fillRect(p.x + 2, p.y - 4, p.w - 4, 4);
    ctx.fillStyle = '#212529';
    ctx.fillRect(p.x + 5 + leg, p.y + p.h - 10, 5, 10); ctx.fillRect(p.x + p.w - 10 - leg, p.y + p.h - 10, 5, 10);
    ctx.fillStyle = '#c92a2a'; ctx.fillRect(p.x - 6, p.y + 10, 8, 12);
  }
  reset();
  Kit.loop(function (dt, t) { if (Kit.state === 'playing' && alive) update(dt); draw(t); });
})();
