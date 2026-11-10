/* Keystorm: words drift down like hail. Type each one before it reaches the town. */
(function () {
  var W = 560, H = 420;
  var WORDS = ('cloud rain storm hail sleet frost thunder breeze gust drizzle mist fog sun moon star comet orbit planet ' +
    'rocket engine signal pixel button canvas script loop array object string number random cursor window folder ' +
    'garden river forest meadow canyon valley island harbor bridge tunnel castle tower market village lantern ' +
    'pepper ginger mango lemon cherry walnut biscuit noodle pickle waffle pancake muffin pretzel turnip radish ' +
    'quick brave quiet bright gentle clever eager fuzzy jolly lucky mighty nimble proud rapid silly sturdy swift ' +
    'jump climb dash glide hover sprint wander travel gather juggle sketch paint whistle giggle tumble wobble ' +
    'zebra otter badger falcon heron koala lizard moose panda parrot rabbit salmon turtle walrus yak beetle ' +
    'anchor basket candle drawer feather goggles hammer jacket kettle ladder magnet needle pillow quilt ribbon ' +
    'saddle teapot umbrella violin wagon yarn zipper compass marble puzzle riddle trophy ticket wizard dragon').split(' ');
  var g = Kit.setup({
    slug: 'keystorm', w: W, h: H, title: 'Keystorm',
    intro: 'Type the falling words before they land. On a phone, tap the game to open your keyboard. Space or Enter clears a typo. Three misses ends the storm.',
    onStart: reset
  });
  var ctx = g.ctx, words, lives, score, spawnT, gap, fall, typed = '', flashes = [], cleared;
  var inp = Kit.textInput(function (v, el) {
    if (Kit.state !== 'playing') { el.value = ''; return; }
    var clean = v.toLowerCase().replace(/[^a-z]/g, '');
    if (clean !== v) el.value = clean;
    typed = clean;
    for (var i = 0; i < words.length; i++) if (words[i].t === typed) { hit(i); el.value = ''; typed = ''; break; }
  }, function (e, el) {
    if (e.key === 'Enter' || e.key === ' ') { if (Kit.state === 'playing') { e.preventDefault(); e.stopPropagation(); el.value = ''; typed = ''; } }
  });
  document.addEventListener('keydown', function (e) {
    if (Kit.state === 'playing' && document.activeElement !== inp && e.key.length === 1 && !e.ctrlKey && !e.metaKey) inp.focus({ preventScroll: true });
  });
  function reset() {
    words = []; lives = 3; score = 0; spawnT = 0.3; gap = 2.2; fall = 26; typed = ''; inp.value = ''; flashes = []; cleared = 0;
    Kit.score(0); setTimeout(function () { inp.focus({ preventScroll: true }); }, 0);
  }
  function spawn() {
    var t = WORDS[Math.floor(Math.random() * WORDS.length)];
    if (words.some(function (w) { return w.t === t; })) return;
    ctx.font = 'bold 20px ui-monospace,Consolas,monospace';
    var w = ctx.measureText(t).width;
    words.push({ t: t, x: 20 + Math.random() * (W - 40 - w), y: -10, w: w, v: fall * (0.85 + Math.random() * 0.3) });
  }
  function hit(i) {
    var w = words[i]; score += w.t.length * 10; cleared++; Kit.score(score);
    flashes.push({ x: w.x + w.w / 2, y: w.y, t: 0.5, s: '+' + w.t.length * 10 });
    words.splice(i, 1);
  }
  function update(dt) {
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = gap; gap = Math.max(0.75, gap * 0.975); fall = Math.min(85, fall + 0.9); }
    for (var i = words.length - 1; i >= 0; i--) {
      words[i].y += words[i].v * dt;
      if (words[i].y > H - 56) { words.splice(i, 1); lives--; flashes.push({ x: W / 2, y: H - 70, t: 0.6, s: 'Miss', bad: true }); if (lives <= 0) { Kit.over(score, cleared + ' words typed'); return; } }
    }
    flashes.forEach(function (f) { f.t -= dt; f.y -= 30 * dt; }); flashes = flashes.filter(function (f) { return f.t > 0; });
  }
  function draw() {
    var sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1c2541'); sky.addColorStop(1, '#3a506b');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // town
    ctx.fillStyle = '#0b132b';
    for (var x = 0; x < W; x += 46) { var h = 18 + ((x * 13) % 28); ctx.fillRect(x, H - 50 - h, 40, h + 50); }
    ctx.fillStyle = '#ffd43b'; for (x = 10; x < W; x += 46) ctx.fillRect(x, H - 50 - 8, 6, 6);
    ctx.font = 'bold 20px ui-monospace,Consolas,monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    (words || []).forEach(function (w) {
      var pre = typed && w.t.indexOf(typed) === 0 ? typed.length : 0;
      ctx.fillStyle = 'rgba(255,255,255,.12)'; Kit.rr(ctx, w.x - 6, w.y - 14, w.w + 12, 28, 8); ctx.fill();
      ctx.fillStyle = '#ffd43b'; ctx.fillText(w.t.slice(0, pre), w.x, w.y);
      ctx.fillStyle = '#f8f9fa'; ctx.fillText(w.t.slice(pre), w.x + ctx.measureText(w.t.slice(0, pre)).width, w.y);
    });
    flashes.forEach(function (f) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = f.bad ? '#ff6b6b' : '#8ce99a'; ctx.textAlign = 'center'; ctx.fillText(f.s, f.x, f.y); ctx.globalAlpha = 1; });
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, H - 40, W, 40);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText('> ' + typed + (Math.floor(performance.now() / 400) % 2 ? '_' : ''), 14, H - 20);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ff8787';
    for (var i = 0; i < 3; i++) ctx.fillText(i < lives ? '♥' : '♡', W - 14 - i * 22, H - 20);
  }
  words = []; lives = 3;
  Kit.loop(function (dt) { if (Kit.state === 'playing') update(dt); draw(); });
})();
