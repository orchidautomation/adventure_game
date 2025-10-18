import { Donut } from './collectible.js';
import { Enemy } from './enemy.js';
import { Platform } from './platform.js';

export function createLevel(bounds, opts = {}) {
  const W = bounds.w, H = bounds.h;
  const platforms = [];
  const donuts = [];
  const enemies = [];

  // Utilities
  const rand = (a, b) => Math.random() * (b - a) + a;
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const chance = (p) => Math.random() < p;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // Ground (static)
  const groundY = H - 30;
  platforms.push(new Platform(0, groundY, W, 30, '#606060'));

  // Parameters for a feasible path, tuned to current jump physics and speed
  const diff = opts.difficulty === 'hard' ? 'hard' : 'easy';
  const level = Math.max(1, opts.level || 1);
  const widthMin = diff === 'hard' ? 90 : 130;      // narrower on hard, wider on easy
  const widthMax = diff === 'hard' ? 130 : 180;
  const minVertDelta = diff === 'hard' ? 70 : 60;   // more vertical variation on hard
  const ascendMax = 70, descendMax = 100;    // vertical delta relative to previous top
  const yTop = H - 280, yBottom = H - 90;    // limits for platform tops

  // Evenly spread platforms across the level for ample room
  const steps = diff === 'hard' ? 4 : 5;     // limit total platforms
  const startX = 60 + randi(0, 20);
  const endX = W - 200;
  const span = Math.max(260, endX - startX);
  let prevY = clamp(groundY - randi(50, 75), yTop, yBottom);

  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const baseX = startX + t * span;
    const jitter = randi(-20, 20);
    const w = randi(widthMin, widthMax);
    let x = clamp(baseX + jitter, 20, W - w - 20);

    // Choose Y with ample spacing from previous
    let y;
    if (i === 0) {
      y = prevY;
    } else {
      // Propose a delta within feasible jump bounds, but ensure minimum separation
      let dy = randi(-ascendMax, descendMax);
      if (Math.abs(dy) < minVertDelta) {
        dy = dy >= 0 ? minVertDelta : -minVertDelta;
      }
      y = clamp(prevY + dy, yTop, yBottom);
      // If clamped reduced spacing, enforce spacing relative to prevY
      if (Math.abs(y - prevY) < minVertDelta) {
        y = clamp(prevY + (y >= prevY ? minVertDelta : -minVertDelta), yTop, yBottom);
      }
    }
    prevY = y;

    const p = new Platform(x, y, w, 14, '#707070');
    platforms.push(p);

    // Deterministic donuts
    const mid = Math.floor(steps / 2);
    if (diff === 'easy') {
      if ((i === 1) || (i === mid) || (i === steps - 2)) {
        donuts.push(new Donut(p.x + p.w / 2, p.y - 20));
      }
    } else {
      if (i === mid) {
        donuts.push(new Donut(p.x + p.w / 2, p.y - 20));
      }
    }

    // Enemies
    if (diff === 'easy') {
      if (i === Math.max(1, mid - 1) || i === Math.min(steps - 2, mid + 1)) {
        const fireRight = (i % 2) === 0;
        const speedMag = 250 + Math.min(120, 20 * (level - 1)); // scale with level
        const vx = fireRight ? speedMag : -speedMag;
        const interval = 1.4;
        const ex = clamp(p.x + p.w / 2 - 15, 0, W - 30);
        const ey = p.y - 30;
        enemies.push(new Enemy(ex, ey, { vx, interval, color: fireRight ? '#ff7878' : '#ff4242', jitter: 0.25 }));
      }
    } else {
      // Hard: put enemies on all middle platforms (skip first/last)
      if (i > 0 && i < steps - 1) {
        const fireRight = (i % 2) === 0;
        const baseMin = 320 + Math.min(200, 25 * (level - 1));
        const baseMax = 420 + Math.min(200, 35 * (level - 1));
        const speedMag = randi(baseMin, baseMax);
        const vx = fireRight ? speedMag : -speedMag;
        const interval = rand(Math.max(0.5, 0.8 - 0.05 * (level - 1)), Math.max(0.7, 1.2 - 0.07 * (level - 1)));
        const ex = clamp(p.x + p.w / 2 - 15, 0, W - 30);
        const ey = p.y - 30;
        enemies.push(new Enemy(ex, ey, { vx, interval, color: fireRight ? '#ff7878' : '#ff4242', jitter: 0.5 }));
      }
    }
  }

  // Place unicorn at the end near the last platform
  const last = platforms[platforms.length - 1];
  const unicorn = { x: clamp(last.x + last.w - 44, 0, W - 40), y: last.y - 24, w: 40, h: 24 };

  // Boss every 3 levels (level >= 3)
  if (level >= 3 && (level % 3 === 0)) {
    const bossRight = true;
    const bossVX = bossRight ? -300 - Math.min(200, 20 * (level - 3)) : 300;
    const bossHP = 3 + Math.min(7, Math.floor(level / 2));
    const bx = clamp(last.x + last.w / 2 - 25, 0, W - 50);
    const by = last.y - 50;
    enemies.push(new Enemy(bx, by, { vx: bossVX, interval: 1.0, jitter: 0.35, boss: true, hp: bossHP, color: '#b855ff' }));
  }

  return { platforms, donuts, enemies, unicorn };
}
