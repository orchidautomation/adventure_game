export function drawHUD(ctx, game) {
  // Hearts
  const pad = 8;
  for (let i = 0; i < game.player.maxHearts; i++) {
    const x = 10 + i * (16 + 4);
    const y = 10;
    ctx.fillStyle = i < game.player.hearts ? '#ff4d6d' : '#55333b';
    drawHeart(ctx, x, y, 16);
  }

  // Score
  ctx.fillStyle = '#ddd';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`Donuts: ${game.score}`, 10, 42);

  // Player status
  if (game.player.boost > 0) {
    ctx.fillStyle = '#aaf0ff';
    ctx.fillText('Speed Boost!', 120, 42);
  }

  if (game.state !== 'running') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, game.bounds.w, game.bounds.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui, sans-serif';
    let title = 'Game Over';
    if (game.state === 'won') title = 'You Win! 🦄';
    else if (game.state === 'paused') title = 'Paused';
    centerText(ctx, title, game.bounds.w / 2, game.bounds.h / 2 - 10);
    ctx.font = '16px system-ui, sans-serif';
    const sub = game.state === 'paused' ? 'Press Esc to resume' : 'Press Enter to restart';
    centerText(ctx, sub, game.bounds.w / 2, game.bounds.h / 2 + 20);
  }
}

function centerText(ctx, text, x, y) {
  const m = ctx.measureText(text);
  ctx.fillText(text, x - m.width / 2, y);
}

function drawHeart(ctx, x, y, size) {
  const w = size, h = size;
  ctx.beginPath();
  ctx.moveTo(x + w/2, y + h*0.75);
  ctx.bezierCurveTo(x + w*0.1, y + h*0.55, x + w*0.0, y + h*0.2, x + w*0.25, y + h*0.2);
  ctx.bezierCurveTo(x + w*0.4, y + h*0.2, x + w*0.5, y + h*0.35, x + w*0.5, y + h*0.45);
  ctx.bezierCurveTo(x + w*0.5, y + h*0.35, x + w*0.6, y + h*0.2, x + w*0.75, y + h*0.2);
  ctx.bezierCurveTo(x + w*1.0, y + h*0.2, x + w*0.9, y + h*0.55, x + w/2, y + h*0.75);
  ctx.closePath();
  ctx.fill();
}
