/* Blink Test: tap the moment the lantern turns green. Five rounds, average reaction time. */
(function () {
  var W = 520, H = 380, ROUNDS = 5;
  var g = Kit.setup({
    slug: 'blink-test', w: W, h: H, title: 'Blink Test', lowerIsBetter: true, scoreLabel: 'Average',
    intro: 'Wait for the lantern to turn green, then tap, click or press Space as fast as you can. Five rounds.',
    fmt: function (n) { return n ? Math.round(n) + ' ms' : '-'; },
    onStart: reset
  });
  var ctx = g.ctx, phase, goAt, times, shown, msg, waitT;
  function reset() { times = []; next(); Kit.score(0); }
  function next() {
    phase = 'wait'; msg = 'Wait for green...';
    waitT = performance.now() + 1100 + Math.random() * 2600;
  }
  function hit() {
    if (Kit.state !== 'playing') return;
    var now = performance.now();
    if (phase === 'wait') { phase = 'early'; msg = 'Too soon! Tap to retry this round.'; return; }
    if (phase === 'early') { next(); return; }
    if (phase === 'go') {
      shown = Math.round(now - goAt); times.push(shown);
      var avg = times.reduce(function (a, b) { return a + b; }, 0) / times.length;
      Kit.score(avg);
      if (times.length >= ROUNDS) { phase = 'done'; Kit.over(Math.round(avg), verdict(avg)); return; }
      phase = 'result'; msg = shown + ' ms. Tap for round ' + (times.length + 1) + '.'; return;
    }
    if (phase === 'result') next();
  }
  function verdict(a) { return a < 230 ? 'Lightning reflexes' : a < 300 ? 'Sharp' : a < 400 ? 'Steady' : 'Warming up'; }
  g.cv.addEventListener('pointerdown', function (e) { e.preventDefault(); hit(); });
  document.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && Kit.state === 'playing') { e.preventDefault(); hit(); } });
  function draw(t) {
    var now = performance.now();
    if (Kit.state === 'playing' && phase === 'wait' && now >= waitT) { phase = 'go'; goAt = now; msg = 'NOW!'; }
    var col = phase === 'go' ? '#2f9e44' : phase === 'early' ? '#e67700' : phase === 'wait' ? '#a61e4d' : '#364fc7';
    if (Kit.state !== 'playing') col = '#364fc7';
    ctx.fillStyle = '#16142a'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, 150);
    ctx.shadowColor = col; ctx.shadowBlur = phase === 'go' ? 60 : 25;
    ctx.fillStyle = '#3b3557'; ctx.fillRect(-18, -95, 36, 14);
    ctx.fillStyle = col; Kit.rr(ctx, -55, -80, 110, 150, 30); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.18)'; Kit.rr(ctx, -40, -64, 26, 110, 12); ctx.fill();
    ctx.fillStyle = '#3b3557'; ctx.fillRect(-60, 70, 120, 12);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 24px system-ui,sans-serif';
    if (Kit.state === 'playing') ctx.fillText(msg, W / 2, 290);
    ctx.font = '16px system-ui,sans-serif'; ctx.fillStyle = '#c5bfd6';
    if (times && times.length) ctx.fillText('Rounds: ' + times.map(function (x) { return x; }).join(' / ') + ' ms', W / 2, 330);
    for (var i = 0; i < ROUNDS; i++) {
      ctx.fillStyle = times && i < times.length ? '#ffd43b' : '#3b3557';
      ctx.beginPath(); ctx.arc(W / 2 - 48 + i * 24, 356, 7, 0, 7); ctx.fill();
    }
  }
  times = [];
  Kit.t = { get phase() { return phase; }, hit: hit }; // test hook
  Kit.loop(function (dt, t) { draw(t); });
})();
