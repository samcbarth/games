/* Hedge Guard: plant sprinkler towers along the garden path to stop the beetle parade. */
(function () {
  var C = 48, GW = 12, GH = 9, TOP = 40, W = GW * C, H = GH * C + TOP;
  var WAY = [[-1, 1], [9, 1], [9, 4], [2, 4], [2, 7], [12, 7]];
  var g = Kit.setup({
    slug: 'hedge-guard', w: W, h: H, maxW: 720, title: 'Hedge Guard',
    intro: 'Tap a grass tile to plant a sprinkler (50 seeds). Tap a sprinkler to upgrade it. Press Start wave when ready. Keys: arrows, Enter to build, N or Space for the next wave.',
    onStart: reset
  });
  var ctx = g.ctx, path = {}, pts, towers, bugs, shots, gold, lives, wave, kills, inWave, toSpawn, spawnT, score, cur = { x: 5, y: 2 }, msg = '', msgT = 0;
  (function buildPath() {
    pts = WAY.map(function (w) { return { x: w[0] * C + C / 2, y: TOP + w[1] * C + C / 2 }; });
    for (var i = 0; i < WAY.length - 1; i++) {
      var a = WAY[i], b = WAY[i + 1], dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]), x = a[0], y = a[1];
      while (true) { path[x + ',' + y] = 1; if (x === b[0] && y === b[1]) break; x += dx; y += dy; }
    }
  })();
  var BTN = { x: W - 150, y: 5, w: 142, h: 30 };
  function reset() {
    towers = []; bugs = []; shots = []; gold = 120; lives = 10; wave = 0; kills = 0; inWave = false; toSpawn = 0; score = 0; msg = ''; Kit.score(0);
  }
  function say(s) { msg = s; msgT = 1.6; }
  function startWave() {
    if (Kit.state !== 'playing' || inWave) return;
    wave++; inWave = true; toSpawn = 6 + wave * 2; spawnT = 0.2;
  }
  function towerAt(x, y) { for (var i = 0; i < towers.length; i++) if (towers[i].x === x && towers[i].y === y) return towers[i]; return null; }
  function act(x, y) {
    if (Kit.state !== 'playing' || x < 0 || y < 0 || x >= GW || y >= GH) return;
    if (path[x + ',' + y]) { say('That is the path'); return; }
    var t = towerAt(x, y);
    if (t) {
      if (t.lv >= 3) { say('Fully upgraded'); return; }
      var cost = 40 * t.lv; if (gold < cost) { say('Need ' + cost + ' seeds'); return; }
      gold -= cost; t.lv++; t.dmg *= 1.7; t.range += 18; t.rate *= 0.85; say('Upgraded to level ' + t.lv); return;
    }
    if (gold < 50) { say('Need 50 seeds'); return; }
    gold -= 50; towers.push({ x: x, y: y, lv: 1, dmg: 10, range: 100, rate: 0.6, cd: 0 });
  }
  g.cv.addEventListener('pointerdown', function (e) {
    if (Kit.state !== 'playing') return; e.preventDefault();
    var p = Kit.pos(e);
    if (p.x >= BTN.x && p.x <= BTN.x + BTN.w && p.y >= BTN.y && p.y <= BTN.y + BTN.h) { startWave(); return; }
    if (p.y < TOP) return;
    cur = { x: Math.floor(p.x / C), y: Math.floor((p.y - TOP) / C) }; act(cur.x, cur.y);
  });
  document.addEventListener('keydown', function (e) {
    if (Kit.state !== 'playing') return;
    var d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (d) { cur.x = Math.max(0, Math.min(GW - 1, cur.x + d[0])); cur.y = Math.max(0, Math.min(GH - 1, cur.y + d[1])); }
    else if (e.key === 'Enter') act(cur.x, cur.y);
    else if (e.key === 'n' || e.key === 'N' || e.key === ' ') { e.preventDefault(); startWave(); }
  });
  function spawn() {
    var boss = wave % 5 === 0 && toSpawn === 1;
    var hp = (30 + wave * 14) * (boss ? 6 : 1);
    bugs.push({ seg: 0, x: pts[0].x, y: pts[0].y, hp: hp, max: hp, sp: (48 + wave * 2.5) * (boss ? 0.6 : 1), boss: boss });
  }
  function update(dt) {
    msgT -= dt;
    if (inWave) {
      spawnT -= dt;
      if (toSpawn > 0 && spawnT <= 0) { spawn(); toSpawn--; spawnT = Math.max(0.35, 0.85 - wave * 0.03); }
      if (toSpawn === 0 && !bugs.length) { inWave = false; gold += 25 + wave * 5; score += 50; Kit.score(score); say('Wave ' + wave + ' cleared'); }
    }
    for (var i = bugs.length - 1; i >= 0; i--) {
      var b = bugs[i], tgt = pts[b.seg + 1], dx = tgt.x - b.x, dy = tgt.y - b.y, dist = Math.hypot(dx, dy), mv = b.sp * dt;
      if (dist <= mv) { b.x = tgt.x; b.y = tgt.y; b.seg++; if (b.seg >= pts.length - 1) { bugs.splice(i, 1); lives -= b.boss ? 3 : 1; if (lives <= 0) { lives = 0; Kit.over(score, 'The beetles reached the roses on wave ' + wave); return; } } }
      else { b.x += dx / dist * mv; b.y += dy / dist * mv; }
    }
    towers.forEach(function (t) {
      t.cd -= dt; if (t.cd > 0) return;
      var cx = t.x * C + C / 2, cy = TOP + t.y * C + C / 2, best = null, bd = 1e9;
      bugs.forEach(function (b) { var d = Math.hypot(b.x - cx, b.y - cy); if (d <= t.range && b.seg * 1000 - d < bd) { bd = b.seg * 1000 - d; best = b; } });
      if (!best) return;
      t.cd = t.rate; best.hp -= t.dmg; shots.push({ x1: cx, y1: cy, x2: best.x, y2: best.y, t: 0.12 });
      if (best.hp <= 0) { bugs.splice(bugs.indexOf(best), 1); kills++; gold += best.boss ? 40 : 6; score += best.boss ? 100 : 10; Kit.score(score); }
    });
    shots.forEach(function (s) { s.t -= dt; }); shots = shots.filter(function (s) { return s.t > 0; });
  }
  function draw() {
    ctx.fillStyle = '#2b4c2a'; ctx.fillRect(0, 0, W, TOP);
    for (var y = 0; y < GH; y++) for (var x = 0; x < GW; x++) {
      var px = x * C, py = TOP + y * C;
      if (path[x + ',' + y]) { ctx.fillStyle = (x + y) % 2 ? '#c8a86b' : '#d1b277'; ctx.fillRect(px, py, C, C); }
      else { ctx.fillStyle = (x + y) % 2 ? '#5c9e48' : '#65a851'; ctx.fillRect(px, py, C, C); }
    }
    // roses at the exit
    ctx.fillStyle = '#e64980'; for (var r = 0; r < 3; r++) { ctx.beginPath(); ctx.arc(W - 12, TOP + 7 * C + 10 + r * 14, 6, 0, 7); ctx.fill(); }
    (towers || []).forEach(function (t) {
      var cx = t.x * C + C / 2, cy = TOP + t.y * C + C / 2;
      ctx.fillStyle = '#495057'; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 7); ctx.fill();
      ctx.fillStyle = ['', '#4dabf7', '#228be6', '#1864ab'][t.lv]; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; for (var k = 0; k < t.lv; k++) ctx.fillRect(cx - 8 + k * 6, cy + 18, 4, 4);
    });
    if (Kit.state === 'playing') {
      var tc = towerAt(cur.x, cur.y);
      if (tc) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(cur.x * C + C / 2, TOP + cur.y * C + C / 2, tc.range, 0, 7); ctx.stroke(); }
      ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 2; ctx.strokeRect(cur.x * C + 2, TOP + cur.y * C + 2, C - 4, C - 4); ctx.lineWidth = 1;
    }
    (shots || []).forEach(function (s) { ctx.strokeStyle = '#a5d8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); ctx.lineWidth = 1; });
    (bugs || []).forEach(function (b) {
      var s = b.boss ? 16 : 10;
      ctx.fillStyle = b.boss ? '#5f3dc4' : '#2b2b2b'; ctx.beginPath(); ctx.ellipse(b.x, b.y, s, s * 0.75, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#a9e34b'; ctx.beginPath(); ctx.moveTo(b.x, b.y - s * 0.75); ctx.lineTo(b.x, b.y + s * 0.75); ctx.stroke();
      ctx.fillStyle = '#c92a2a'; ctx.fillRect(b.x - 12, b.y - s - 8, 24, 4);
      ctx.fillStyle = '#8ce99a'; ctx.fillRect(b.x - 12, b.y - s - 8, 24 * Math.max(0, b.hp / b.max), 4);
    });
    ctx.fillStyle = '#f1f3f5'; ctx.font = 'bold 16px system-ui,sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText('Seeds ' + gold + '   Roses ' + lives + '   Wave ' + wave, 10, TOP / 2);
    ctx.fillStyle = inWave ? '#5c7a55' : '#f08c00'; Kit.rr(ctx, BTN.x, BTN.y, BTN.w, BTN.h, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(inWave ? 'Wave running' : 'Start wave ' + (wave + 1), BTN.x + BTN.w / 2, BTN.y + BTN.h / 2 + 1);
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT); ctx.fillStyle = 'rgba(0,0,0,.6)'; Kit.rr(ctx, W / 2 - 120, TOP + 8, 240, 30, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(msg, W / 2, TOP + 23); ctx.globalAlpha = 1; }
  }
  reset();
  Kit.loop(function (dt) { if (Kit.state === 'playing') update(dt); draw(); });
})();
