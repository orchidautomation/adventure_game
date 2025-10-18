import { overlap } from './player.js';

export class Enemy {
  constructor(x, y, opts = {}) {
    this.pos = { x, y };
    this.size = { w: 30, h: 30 };
    this.fireTimer = 0.0;
    this.fireInterval = opts.interval ?? 1.2; // seconds
    this.color = opts.color ?? '#ff5252';
    this.fireVX = opts.vx ?? -250; // projectile x-velocity
    this.fireVY = opts.vy ?? 0;    // projectile y-velocity
    this.dead = false;
  }

  rect() { return { x: this.pos.x, y: this.pos.y, w: this.size.w, h: this.size.h }; }

  update(dt, game) {
    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && game.state === 'running') {
      this.fireTimer = this.fireInterval;
      const px = this.pos.x + (this.fireVX > 0 ? this.size.w : 0);
      const py = this.pos.y + this.size.h/2 - 4;
      game.spawnProjectile(px, py, this.fireVX, this.fireVY);
    }
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.fillStyle = this.color;
    const { x, y, w, h } = this.rect();
    ctx.fillRect(x, y, w, h);
  }
}
