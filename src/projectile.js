import { overlap } from './player.js';

export class Projectile {
  constructor(x, y, vx, vy) {
    this.pos = { x, y };
    this.size = { w: 10, h: 10 };
    this.vel = { x: vx, y: vy };
    this.color = '#ff9800';
    this.dead = false;
  }

  rect() { return { x: this.pos.x, y: this.pos.y, w: this.size.w, h: this.size.h }; }

  update(dt, game) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Hit player
    if (!this.dead && game.state === 'running' && overlap(this.rect(), game.player.rect())) {
      const took = game.player.hurt();
      if (took && game.sfx) game.sfx.hit();
      if (took && game.player.hearts <= 0) {
        if (game.state !== 'lost') {
          game.state = 'lost';
          if (game.sfx) game.sfx.lose();
        }
      }
      this.dead = true;
    }

    // Cull offscreen
    const { w, h } = game.bounds;
    if (this.pos.x < -50 || this.pos.x > w + 50 || this.pos.y < -50 || this.pos.y > h + 50) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    const { x, y, w, h } = this.rect();
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
