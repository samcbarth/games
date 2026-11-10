/* Ridge Solitaire: clear seven ridges of cards by playing one rank up or down from the pile. */
(function () {
  var W = 560, H = 470, CW = 66, CH = 92, GAPX = 78, OVER = 30, X0 = 15, Y0 = 18;
  var SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var g = Kit.setup({
    slug: 'ridge-solitaire', w: W, h: H, title: 'Ridge Solitaire',
    intro: 'Play the bottom card of any column if it is one rank above or below the pile card. Suits do not matter, no wrapping from King to Ace. Stuck? Draw from the stock. Keys: 1 to 7 play a column, Space draws.',
    onStart: reset
  });
  var ctx = g.ctx, cols, stock, pile, cleared, score, ended, hover = -1, moving = null;
  function reset() {
    var deck = [];
    for (var s = 0; s < 4; s++) for (var r = 1; r <= 13; r++) deck.push({ r: r, s: s });
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    cols = []; for (i = 0; i < 7; i++) cols.push(deck.splice(0, 5));
    pile = [deck.pop()]; stock = deck; cleared = 0; score = 0; ended = false; moving = null; Kit.score(0);
  }
  function top() { return pile[pile.length - 1]; }
  function playable(ci) { var c = cols[ci]; if (!c.length) return false; return Math.abs(c[c.length - 1].r - top().r) === 1; }
  function anyMove() { for (var i = 0; i < 7; i++) if (playable(i)) return true; return false; }
  function play(ci) {
    if (Kit.state !== 'playing' || ended || !playable(ci)) return;
    var card = cols[ci].pop();
    moving = { card: card, fx: X0 + ci * GAPX, fy: Y0 + cols[ci].length * OVER, t: 0 };
    pile.push(card); cleared++; score = cleared * 10; Kit.score(score); check();
  }
  function draw1() {
    if (Kit.state !== 'playing' || ended || !stock.length) return;
    pile.push(stock.pop()); check();
  }
  function check() {
    if (cleared === 35) { ended = true; score += 150 + stock.length * 20; Kit.score(score); setTimeout(function () { Kit.over(score, 'Every ridge cleared!'); }, 500); return; }
    if (!stock.length && !anyMove()) { ended = true; setTimeout(function () { Kit.over(score, (35 - cleared) + ' cards left on the ridges'); }, 700); }
  }
  function hit(p) {
    for (var i = 0; i < 7; i++) {
      var c = cols[i]; if (!c.length) continue;
      var x = X0 + i * GAPX, y = Y0 + (c.length - 1) * OVER;
      if (p.x >= x && p.x <= x + CW && p.y >= y && p.y <= y + CH) return i;
    }
    if (p.x >= SX && p.x <= SX + CW && p.y >= SY && p.y <= SY + CH) return 'stock';
    return -1;
  }
  var SX = 150, SY = 340, PX = 330;
  g.cv.addEventListener('pointerdown', function (e) {
    if (Kit.state !== 'playing') return; e.preventDefault();
    var h = hit(Kit.pos(e)); if (h === 'stock') draw1(); else if (h >= 0) play(h);
  });
  g.cv.addEventListener('pointermove', function (e) { var h = hit(Kit.pos(e)); hover = typeof h === 'number' ? h : -1; });
  document.addEventListener('keydown', function (e) {
    if (Kit.state !== 'playing') return;
    if (/^[1-7]$/.test(e.key)) play(+e.key - 1);
    else if (e.key === ' ' || e.key === 'd' || e.key === 'D') { e.preventDefault(); draw1(); }
  });
  function card(x, y, c, glow) {
    ctx.fillStyle = 'rgba(0,0,0,.3)'; Kit.rr(ctx, x + 2, y + 3, CW, CH, 8); ctx.fill();
    ctx.fillStyle = '#fffaf0'; Kit.rr(ctx, x, y, CW, CH, 8); ctx.fill();
    if (glow) { ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 3; Kit.rr(ctx, x, y, CW, CH, 8); ctx.stroke(); ctx.lineWidth = 1; }
    else { ctx.strokeStyle = '#ced4da'; Kit.rr(ctx, x, y, CW, CH, 8); ctx.stroke(); }
    ctx.fillStyle = c.s === 1 || c.s === 2 ? '#c92a2a' : '#212529';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = 'bold 17px system-ui,sans-serif';
    ctx.fillText(RANKS[c.r] + SUITS[c.s], x + 6, y + 5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '34px system-ui,sans-serif';
    ctx.fillText(SUITS[c.s], x + CW / 2, y + CH / 2 + 10);
  }
  function back(x, y) {
    ctx.fillStyle = '#5f3dc4'; Kit.rr(ctx, x, y, CW, CH, 8); ctx.fill();
    ctx.strokeStyle = '#d0bfff'; ctx.lineWidth = 2; Kit.rr(ctx, x + 6, y + 6, CW - 12, CH - 12, 6); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = '#d0bfff'; ctx.beginPath(); ctx.moveTo(x + CW / 2, y + 26); ctx.lineTo(x + CW / 2 + 14, y + CH / 2); ctx.lineTo(x + CW / 2, y + CH - 26); ctx.lineTo(x + CW / 2 - 14, y + CH / 2); ctx.fill();
  }
  function draw(dt) {
    ctx.fillStyle = '#1f513f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.04)'; for (var i = 0; i < W; i += 8) ctx.fillRect(i, 0, 1, H);
    if (!cols) return;
    for (i = 0; i < 7; i++) {
      var c = cols[i], x = X0 + i * GAPX;
      if (!c.length) { ctx.strokeStyle = 'rgba(255,255,255,.2)'; Kit.rr(ctx, x, Y0, CW, CH, 8); ctx.stroke(); }
      for (var j = 0; j < c.length; j++) card(x, Y0 + j * OVER, c[j], j === c.length - 1 && Kit.state === 'playing' && playable(i));
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(i + 1), x + CW / 2, 330);
    }
    if (stock.length) back(SX, SY); else { ctx.strokeStyle = 'rgba(255,255,255,.25)'; Kit.rr(ctx, SX, SY, CW, CH, 8); ctx.stroke(); }
    ctx.fillStyle = '#d3f9d8'; ctx.font = 'bold 14px system-ui,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Stock: ' + stock.length, SX + CW / 2, SY + CH + 18);
    if (moving) {
      moving.t += dt * 5; var k = Math.min(1, moving.t);
      if (pile.length > 1) card(PX, SY, pile[pile.length - 2]);
      card(moving.fx + (PX - moving.fx) * k, moving.fy + (SY - moving.fy) * k, moving.card);
      if (k >= 1) moving = null;
    } else card(PX, SY, top());
    ctx.fillStyle = '#d3f9d8'; ctx.font = 'bold 14px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Pile', PX + CW / 2, SY + CH + 18);
    ctx.font = 'bold 16px system-ui,sans-serif'; ctx.textAlign = 'right'; ctx.fillText('Cleared ' + cleared + ' / 35', W - 16, SY + 30);
  }
  reset();
  Kit.t = { get cols() { return cols; }, get stock() { return stock; }, playable: playable, play: play, draw1: draw1 }; // test hook
  Kit.loop(function (dt) { draw(dt); });
})();
