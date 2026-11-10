/* Tangleword: untangle scrambled words against the clock. */
(function () {
  var W = 520, H = 460, TIME = 75;
  var LIST = ('planet garden bridge candle orange silver window pocket rabbit forest island marble ' +
    'basket circle dragon friend guitar hammer jungle kitten ladder magnet napkin parrot puzzle rocket ' +
    'saddle tomato velvet walnut yellow zipper anchor breeze castle donkey engine falcon goblet harbor ' +
    'insect jacket kettle lizard meadow noodle oyster pepper quiver ribbon salmon tunnel unicorn violet ' +
    'wizard summit lantern blanket cabbage dolphin feather giraffe harvest journey kingdom leopard monster ' +
    'octopus pancake penguin pumpkin rainbow sandals teacher thunder trumpet volcano weather blossom chimney ' +
    'compass cottage cricket crystal diamond fiddle flannel gallery glacier hamster horizon iceberg jasmine ' +
    'ketchup lobster mailbox mustard network orchard pajamas pelican picture popcorn printer quarrel raccoon ' +
    'sausage seagull shelter sparrow station sunrise tadpole tractor treetop uniform vampire village whisker ' +
    'apple beach cloud dance eagle flame grape house juice knife lemon mango night ocean piano quilt river ' +
    'snake tiger urban vapor whale yacht zebra bread chair dream field ghost honey igloo jelly koala laser ' +
    'melon nurse olive pearl queen robin shell toast vivid wheat crane frost plaza sweet storm brick candy').split(' ');
  var DICT = {}; LIST.forEach(function (w) { DICT[w] = 1; });
  var g = Kit.setup({
    slug: 'tangleword', w: W, h: H, title: 'Tangleword',
    intro: 'Rebuild the hidden word from its scrambled letters. Tap tiles or type. Enter submits, Space shuffles, Backspace undoes. 75 seconds on the clock.',
    onStart: reset
  });
  var ctx = g.ctx, word, tiles, answer, time, score, solved, msg, msgT, shake, bag;
  var BTN = { shuffle: { x: 40, y: 380, w: 130, h: 48, l: 'Shuffle' }, clear: { x: 195, y: 380, w: 130, h: 48, l: 'Clear' }, skip: { x: 350, y: 380, w: 130, h: 48, l: 'Skip -5s' } };
  function reset() { time = TIME; score = 0; solved = 0; msg = ''; msgT = 0; shake = 0; bag = LIST.slice(); nextWord(); Kit.score(0); }
  function nextWord() {
    if (!bag.length) bag = LIST.slice();
    word = bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
    var letters = word.split('');
    do { shuffle(letters); } while (letters.join('') === word);
    tiles = letters.map(function (c) { return { c: c, used: false }; }); answer = [];
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(i) { if (tiles[i].used) return; tiles[i].used = true; answer.push(i); if (answer.length === tiles.length) submit(); }
  function unpick() { var i = answer.pop(); if (i !== undefined) tiles[i].used = false; }
  function clearAns() { answer.forEach(function (i) { tiles[i].used = false; }); answer = []; }
  function submit() {
    var guess = answer.map(function (i) { return tiles[i].c; }).join('');
    if (guess.length !== tiles.length) return;
    if (guess === word || DICT[guess]) {
      var pts = word.length * 10 + Math.round(time / 5); score += pts; solved++; time = Math.min(TIME, time + 3);
      Kit.score(score); say('+' + pts + '  ' + guess.toUpperCase()); nextWord();
    } else { shake = 0.35; say('Not a word here. Try again.'); clearAns(); }
  }
  function skip() { say('It was ' + word.toUpperCase()); time -= 5; nextWord(); }
  function say(s) { msg = s; msgT = 1.6; }
  function layout() {
    var n = tiles.length, size = Math.min(60, (W - 40) / n - 8), tot = n * (size + 8) - 8, x0 = (W - tot) / 2;
    return { size: size, x0: x0 };
  }
  function inBtn(p, b) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }
  g.cv.addEventListener('pointerdown', function (e) {
    if (Kit.state !== 'playing') return;
    e.preventDefault(); var p = Kit.pos(e), L = layout();
    if (inBtn(p, BTN.shuffle)) { clearAns(); shuffle(tiles); return; }
    if (inBtn(p, BTN.clear)) { clearAns(); return; }
    if (inBtn(p, BTN.skip)) { skip(); return; }
    for (var i = 0; i < tiles.length; i++) {
      var x = L.x0 + i * (L.size + 8);
      if (p.x >= x && p.x <= x + L.size) {
        if (p.y >= 250 && p.y <= 250 + L.size) { pick(i); return; }
        if (p.y >= 140 && p.y <= 140 + L.size && i < answer.length) { var k = answer.splice(i, 1)[0]; tiles[k].used = false; return; }
      }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (Kit.state !== 'playing') return;
    if (e.key === 'Backspace') { e.preventDefault(); unpick(); return; }
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (e.key === ' ') { e.preventDefault(); clearAns(); shuffle(tiles); return; }
    if (e.key === 'Escape') { clearAns(); return; }
    if (/^[a-zA-Z]$/.test(e.key)) {
      var c = e.key.toLowerCase();
      for (var i = 0; i < tiles.length; i++) if (!tiles[i].used && tiles[i].c === c) { pick(i); return; }
    }
  });
  function tile(x, y, s, c, col) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; Kit.rr(ctx, x, y + 4, s, s, 10); ctx.fill();
    ctx.fillStyle = col; Kit.rr(ctx, x, y, s, s, 10); ctx.fill();
    if (c) { ctx.fillStyle = '#2b2118'; ctx.font = 'bold ' + Math.round(s * 0.55) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.toUpperCase(), x + s / 2, y + s / 2 + 2); }
  }
  function draw(dt) {
    ctx.fillStyle = '#2d1e2f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3c2a3e'; for (var i = 0; i < 14; i++) ctx.fillRect(0, i * 34, W, 2);
    if (!tiles) return;
    var L = layout(), sx = shake > 0 ? Math.sin(shake * 60) * 6 : 0;
    // timer bar
    ctx.fillStyle = '#4a3550'; Kit.rr(ctx, 30, 24, W - 60, 16, 8); ctx.fill();
    ctx.fillStyle = time < 15 ? '#ff6b6b' : '#ffd43b'; Kit.rr(ctx, 30, 24, Math.max(0, (W - 60) * time / TIME), 16, 8); ctx.fill();
    ctx.fillStyle = '#f1e3f3'; ctx.font = 'bold 18px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(Math.max(0, time)) + 's   Solved: ' + solved, W / 2, 70);
    if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT); ctx.fillStyle = '#8ce99a'; ctx.fillText(msg, W / 2, 106); ctx.globalAlpha = 1; }
    for (i = 0; i < tiles.length; i++) {
      var x = L.x0 + i * (L.size + 8);
      if (i < answer.length) tile(x + sx, 140, L.size, tiles[answer[i]].c, '#ffe066');
      else { ctx.strokeStyle = '#7a5c80'; ctx.lineWidth = 2; Kit.rr(ctx, x + sx, 140, L.size, L.size, 10); ctx.stroke(); }
      if (!tiles[i].used) tile(x, 250, L.size, tiles[i].c, '#f3d9b1');
      else { ctx.fillStyle = '#3c2a3e'; Kit.rr(ctx, x, 250, L.size, L.size, 10); ctx.fill(); }
    }
    Object.keys(BTN).forEach(function (k) {
      var b = BTN[k]; ctx.fillStyle = k === 'skip' ? '#5c3d63' : '#6c4f73'; Kit.rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 17px system-ui,sans-serif'; ctx.fillText(b.l, b.x + b.w / 2, b.y + b.h / 2 + 1);
    });
  }
  Kit.t = { get word() { return word; }, get time() { return time; } }; // test hook
  Kit.loop(function (dt) {
    if (Kit.state === 'playing') {
      time -= dt; msgT -= dt; shake = Math.max(0, shake - dt);
      if (time <= 0) { time = 0; Kit.over(score, solved + ' words untangled'); }
    }
    draw(dt);
  });
})();
