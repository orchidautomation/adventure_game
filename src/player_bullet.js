import { overlap } from './player.js';

export class PlayerBullet {
  constructor(x, y, vx, damage = 1) {
    this.pos = { x, y };
    this.size = { w: 8, h: 4 };
    this.vel = { x: vx, y: 0 };
    this.color = '#aaff66';
    this.dead = false;
    this.damage = Math.max(1, Math.floor(damage));
  }

  rect() { return { x: this.pos.x, y: this.pos.y, w: this.size.w, h: this.size.h }; }

  update(dt, game) {
    this.pos.x += this.vel.x * dt;
    // Hit enemies
    for (const e of game.enemies) {
      if (!e.dead && overlap(this.rect(), e.rect())) {
        if (typeof e.hp === 'number') {
          e.hp -= this.damage;
          if (e.hp <= 0) {
            if (!e.killed) {
              e.killed = true;
              e.dead = true;
              const pts = e.boss ? (game.pointsBoss || 300) : (game.pointsEnemy || 100);
              game.levelScore = (game.levelScore || 0) + pts;
            } else {
              e.dead = true;
            }
          }
        } else {
          if (!e.killed) {
            e.killed = true;
            e.dead = true;
            const pts = e.boss ? (game.pointsBoss || 300) : (game.pointsEnemy || 100);
            game.levelScore = (game.levelScore || 0) + pts;
          } else {
            e.dead = true;
          }
        }
        this.dead = true;
        break;
      }
    }
    // Cull offscreen
    const { w, h } = game.bounds;
    if (this.pos.x < -50 || this.pos.x > w + 50) this.dead = true;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    const { x, y, w, h } = this.rect();
    ctx.fillRect(x, y, w, h);
  }
}
