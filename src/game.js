import { Player, overlap } from './player.js';
import { Projectile } from './projectile.js';
import { drawHUD } from './hud.js';
import { createLevel } from './level.js';
import { PlayerBullet } from './player_bullet.js';
import { Sfx } from './audio.js';

export class Game {
  constructor(input, canvas) {
    this.input = input;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bounds = { w: canvas.width, h: canvas.height };
    this.state = 'running'; // 'won' | 'lost' | 'paused'
    this.score = 0;
    this.time = 0;

    this.platforms = [];
    this.donuts = [];
    this.projectiles = [];
    this.playerBullets = [];
    this.enemies = [];
    this.player = null;
    this.unicorn = null;
    this.sfx = new Sfx();

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
    this.playerBullets = [];
    this.unicorn = lvl.unicorn;
    this.player = new Player(20, this.bounds.h - 80);
  }

  spawnProjectile(x, y, vx, vy) {
    this.projectiles.push(new Projectile(x, y, vx, vy));
  }

  spawnPlayerBullet(x, y, vx) {
    this.playerBullets.push(new PlayerBullet(x, y, vx));
  }

  update(dt) {
    this.time += dt;
    // Pause/resume handling
    if (this.state === 'paused') {
      if (this.input.wasPressed('Escape')) this.state = 'running';
      return;
    }
    if (this.state !== 'running') {
      if (this.input.wasPressed('Enter')) this.reset();
      return;
    }

    // Toggle pause from running
    if (this.input.wasPressed('Escape')) {
      this.state = 'paused';
      return;
    }

    // Edge-triggered inputs should be cleared once per frame
    // The main loop will call input.beginFrame() before update.

    // Player shooting
    if (this.input.wasPressed('KeyF')) {
      const dir = this.player.lastDir >= 0 ? 1 : -1;
      const speed = 420 * (this.player.boost > 0 ? 1.2 : 1.0);
      const bx = this.player.pos.x + (dir > 0 ? this.player.size.w : -8);
      const by = this.player.pos.y + this.player.size.h/2 - 2;
      this.spawnPlayerBullet(bx, by, dir * speed);
      this.sfx.shoot();
    }

    // Update moving platforms
    for (const p of this.platforms) {
      if (typeof p.update === 'function') p.update(dt, this.time);
    }

    // Update enemies and spawn projectiles
    for (const e of this.enemies) e.update(dt, this);
    this.enemies = this.enemies.filter(e => !e.dead);

    // Update projectiles
    for (const p of this.projectiles) p.update(dt, this);
    this.projectiles = this.projectiles.filter(p => !p.dead);

    // Update player bullets
    for (const b of this.playerBullets) b.update(dt, this);
    this.playerBullets = this.playerBullets.filter(b => !b.dead);

    // Update donuts
    for (const d of this.donuts) d.update(dt, this);
    this.donuts = this.donuts.filter(d => !d.dead);

    // Update player (movement + collisions)
    this.player.update(dt, this.input, this.platforms, this.bounds, {
      onJump: () => this.sfx.jump()
    });

    // Contact damage with enemies
    for (const e of this.enemies) {
      if (overlap(this.player.rect(), e.rect())) {
        const took = this.player.hurt();
        if (took) this.sfx.hit();
        if (took && this.player.hearts <= 0) {
          if (this.state !== 'lost') {
            this.state = 'lost';
            this.sfx.lose();
          }
        }
      }
    }

    // Win condition: touch unicorn
    if (overlap(this.player.rect(), this.unicorn)) {
      this.state = 'won';
      this.sfx.win();
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

    // Player bullets
    for (const b of this.playerBullets) b.draw(ctx);

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
