import { overlap } from './player.js';

export class Enemy {
  constructor(x, y, opts = {}) {
    this.pos = { x, y };
    this.size = { w: 30, h: 30 };
    this.baseInterval = opts.interval ?? 1.2; // seconds
    this.fireInterval = this.baseInterval;
    this.fireJitter = opts.jitter ?? 0.25;   // +/- percentage variation per shot
    this.fireTimer = Math.random() * this.baseInterval; // randomize initial phase
    this.color = opts.color ?? '#ff5252';
    // Always shoot toward player horizontally; store speed magnitude only
    this.projSpeed = Math.abs(opts.vx ?? 250);
    this.fireVY = opts.vy ?? 0;    // optional vertical component (usually 0)
    this.hp = opts.hp ?? 1;
    this.boss = !!opts.boss;
    if (this.boss) {
      this.size = { w: 50, h: 50 };
      this.color = opts.color ?? '#b855ff';
      this.baseInterval = opts.interval ?? 1.0;
      this.fireTimer = Math.random() * this.baseInterval;
    }
    this.dead = false;
  }

  rect() { return { x: this.pos.x, y: this.pos.y, w: this.size.w, h: this.size.h }; }

  update(dt, game) {
    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && game.state === 'running') {
      // Next interval with jitter and clamp to reasonable bounds
      const jitter = (Math.random() * 2 - 1) * this.fireJitter;
      const next = Math.max(0.6, Math.min(2.5, this.baseInterval * (1 + jitter)));
      this.fireTimer = next;
      // Determine direction toward player at fire time
      const playerMidX = game.player.pos.x + game.player.size.w / 2;
      const myMidX = this.pos.x + this.size.w / 2;
      const dir = playerMidX >= myMidX ? 1 : -1;
      const vx = dir * this.projSpeed;
      const px = dir > 0 ? (this.pos.x + this.size.w) : (this.pos.x - 10);
      const py = this.pos.y + this.size.h/2 - 4;
      if (this.boss) {
        const vy = 140; // fan
        game.spawnProjectile(px, py - 10, vx, -vy);
        game.spawnProjectile(px, py, vx, 0);
        game.spawnProjectile(px, py + 10, vx, vy);
      } else {
        game.spawnProjectile(px, py, vx, this.fireVY);
      }
      if (game.sfx && typeof game.sfx.enemyShoot === 'function') {
        game.sfx.enemyShoot();
      }
    }
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.fillStyle = this.color;
    const { x, y, w, h } = this.rect();
    ctx.fillRect(x, y, w, h);
  }
}
