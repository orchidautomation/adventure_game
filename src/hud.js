export function drawHUD(ctx, game) {
  // Hearts
  const pad = 8;
  for (let i = 0; i < game.player.maxHearts; i++) {
    const x = 10 + i * (16 + 4);
    const y = 10;
    ctx.fillStyle = i < game.player.hearts ? '#ff4d6d' : '#55333b';
    drawHeart(ctx, x, y, 16);
  }

  // Points and enemies
  ctx.fillStyle = '#ddd';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`Pts: ${game.levelScore}`, 10, 42);
  ctx.fillText(`Enemies: ${game.enemies.length}`, 10, 60);

  // Difficulty label (top-right)
  const label = game.difficulty === 'hard' ? 'Hard' : 'Easy';
  ctx.fillStyle = game.difficulty === 'hard' ? '#ff7878' : '#aaf0ff';
  const text = `Mode: ${label}`;
  const m = ctx.measureText(text);
  ctx.fillText(text, game.bounds.w - m.width - 10, 24);

  // Level and damage (top-center)
  const total = (game.totalScore || 0) + (game.state === 'won' ? game.levelScore : 0);
  const info = `Level ${game.level}  Dmg ${game.damagePerHit}hp  Total ${game.totalScore || 0}`;
  ctx.fillStyle = '#ddd';
  const m2 = ctx.measureText(info);
  ctx.fillText(info, (game.bounds.w - m2.width) / 2, 24);

  // Player status
  if (game.player.boost > 0) {
    ctx.fillStyle = '#aaf0ff';
    ctx.fillText('Speed Boost!', 120, 42);
  }
  if (game.damageBoostTimer && game.damageBoostTimer > 0) {
    ctx.fillStyle = '#ffd166';
    ctx.fillText('Damage Boost!', 220, 42);
  }

  if (game.state !== 'running') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, game.bounds.w, game.bounds.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui, sans-serif';
    let title = 'Game Over';
    if (game.state === 'won') title = `Level ${game.level} Complete!`;
    else if (game.state === 'paused') title = 'Paused';
    else if (game.state === 'menu') title = 'Select Difficulty';
    centerText(ctx, title, game.bounds.w / 2, game.bounds.h / 2 - 10);
    ctx.font = '16px system-ui, sans-serif';
    if (game.state === 'won') {
      centerText(ctx, `Level Pts: ${game.levelScore}  Total: ${game.totalScore + game.levelScore}`, game.bounds.w / 2, game.bounds.h / 2 + 16);
      centerText(ctx, 'Press Enter to advance', game.bounds.w / 2, game.bounds.h / 2 + 36);
    } else if (game.state === 'paused') {
      centerText(ctx, 'Press Esc to resume', game.bounds.w / 2, game.bounds.h / 2 + 20);
    } else if (game.state === 'menu') {
      centerText(ctx, '1/E = Easy (5 hearts), 2/H = Hard (3 hearts)', game.bounds.w / 2, game.bounds.h / 2 + 20);
    } else {
      const final = (game.totalScore || 0) + (game.levelScore || 0);
      centerText(ctx, `Final Score: ${final}`, game.bounds.w / 2, game.bounds.h / 2 + 16);
      centerText(ctx, 'Press Enter to restart', game.bounds.w / 2, game.bounds.h / 2 + 36);
    }
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
