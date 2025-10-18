import { Player, overlap } from './player.js';
import { Projectile } from './projectile.js';
import { drawHUD } from './hud.js';
import { createLevel } from './level.js';

export class Game {
  constructor(input, canvas) {
    this.input = input;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bounds = { w: canvas.width, h: canvas.height };
    this.state = 'running'; // 'won' | 'lost'
    this.score = 0;

    this.platforms = [];
    this.donuts = [];
    this.projectiles = [];
    this.enemies = [];
    this.player = null;
    this.unicorn = null;

    this.reset();
  }

  reset() {
    this.state = 'running';
    this.score = 0;
    const lvl = createLevel(this.bounds);
    this.platforms = lvl.platforms;
    this.donuts = lvl.donuts;
    this.enemies = lvl.enemies ?? (lvl.enemy ? [lvl.enemy] : []);
    this.projectiles = [];
    this.unicorn = lvl.unicorn;
    this.player = new Player(20, this.bounds.h - 80);
  }

  spawnProjectile(x, y, vx, vy) {
    this.projectiles.push(new Projectile(x, y, vx, vy));
  }

  update(dt) {
    if (this.state !== 'running') {
      if (this.input.wasPressed('Enter')) this.reset();
      return;
    }

    // Edge-triggered inputs should be cleared once per frame
    // The main loop will call input.beginFrame() before update.

    // Update enemies and spawn projectiles
    for (const e of this.enemies) e.update(dt, this);

    // Update projectiles
    for (const p of this.projectiles) p.update(dt, this);
    this.projectiles = this.projectiles.filter(p => !p.dead);

    // Update donuts
    for (const d of this.donuts) d.update(dt, this);
    this.donuts = this.donuts.filter(d => !d.dead);

    // Update player (movement + collisions)
    this.player.update(dt, this.input, this.platforms, this.bounds);

    // Win condition: touch unicorn
    if (overlap(this.player.rect(), this.unicorn)) {
      this.state = 'won';
    }
  }

  draw() {
    const ctx = this.ctx;
    const { w, h } = this.bounds;
    ctx.clearRect(0, 0, w, h);

    // Platforms
    for (const p of this.platforms) {
      ctx.fillStyle = p.color || '#707070';
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    // Donuts
    for (const d of this.donuts) d.draw(ctx);

    // Enemies
    for (const e of this.enemies) e.draw(ctx);

    // Projectiles
    for (const p of this.projectiles) p.draw(ctx);

    // Unicorn (simple body + tail)
    drawUnicorn(ctx, this.unicorn);

    // Player
    this.player.draw(ctx);

    // HUD & overlays
    drawHUD(ctx, this);
  }
}

function drawUnicorn(ctx, u) {
  // Body
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(u.x, u.y, u.w, u.h);
  // Horn
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(u.x + u.w - 8, u.y);
  ctx.lineTo(u.x + u.w, u.y - 10);
  ctx.lineTo(u.x + u.w - 2, u.y + 2);
  ctx.closePath();
  ctx.fill();
  // Rainbow tail
  const colors = ['#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93'];
  for (let i = 0; i < colors.length; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(u.x - (i+1)*4, u.y + 4 + i%2, 4, u.h - 8);
  }
}
