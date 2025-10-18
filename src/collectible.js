import { overlap } from './player.js';

export class Donut {
  constructor(x, y) {
    this.pos = { x, y };
    this.radius = 10;
    this.dead = false;
    this.color = '#ff77b7';
  }

  rect() { return { x: this.pos.x - this.radius, y: this.pos.y - this.radius, w: this.radius*2, h: this.radius*2 }; }

  update(dt, game) {
    if (!this.dead && overlap(this.rect(), game.player.rect())) {
      game.player.pickupBoost(3.0);
      game.score += 1;
      this.dead = true;
    }
  }

  draw(ctx) {
    const r = this.radius;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, r, 0, Math.PI * 2);
    ctx.fill();
    // hole
    ctx.fillStyle = '#1e1e1e';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

