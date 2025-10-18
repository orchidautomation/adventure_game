import { overlap } from './player.js';

export class Donut {
  constructor(x, y, type = 'speed') {
    this.pos = { x, y };
    this.radius = 10;
    this.dead = false;
    this.type = type; // 'speed' | 'life' | 'damage'
    this.color = colorFor(type);
  }

  rect() { return { x: this.pos.x - this.radius, y: this.pos.y - this.radius, w: this.radius*2, h: this.radius*2 }; }

  update(dt, game) {
    if (!this.dead && overlap(this.rect(), game.player.rect())) {
      switch (this.type) {
        case 'speed':
          game.player.pickupBoost(3.0);
          break;
        case 'life':
          game.player.hearts = Math.min(game.player.maxHearts, game.player.hearts + 1);
          break;
        case 'damage':
          game.damageBoostTimer = Math.max(game.damageBoostTimer || 0, 6.0);
          break;
      }
      game.levelScore = (game.levelScore || 0) + (game.pointsDonut || 25);
      if (game.sfx && typeof game.sfx.pickup === 'function') game.sfx.pickup();
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

function colorFor(type) {
  switch (type) {
    case 'life': return '#ff4d6d';
    case 'damage': return '#77aaff';
    case 'speed':
    default: return '#ff77b7';
  }
}
