import { Donut } from './collectible.js';
import { Enemy } from './enemy.js';

export function createLevel(bounds) {
  const platforms = [];

  // Ground
  platforms.push({ x: 0, y: bounds.h - 30, w: bounds.w, h: 30, color: '#606060' });

  // Staggered platforms (added a helper platform and tweaks for reachability)
  platforms.push({ x: 60,  y: bounds.h - 90,  w: 100, h: 14, color: '#707070' }); // helper low step
  platforms.push({ x: 180, y: bounds.h - 140, w: 140, h: 14, color: '#707070' });
  platforms.push({ x: 360, y: bounds.h - 190, w: 140, h: 14, color: '#707070' });
  platforms.push({ x: 560, y: bounds.h - 230, w: 160, h: 14, color: '#707070' });

  // Donuts
  const donuts = [
    new Donut(120, bounds.h - 110),
    new Donut(250, bounds.h - 160),
    new Donut(430, bounds.h - 210),
    new Donut(610, bounds.h - 250)
  ];

  // Enemies positioned on platforms with varied fire directions
  const enemies = [];
  // Enemy on rightmost platform firing left
  enemies.push(new Enemy(620, bounds.h - 260, { vx: -250, interval: 1.1 }));
  // Enemy on middle platform firing right
  enemies.push(new Enemy(360 + 20, bounds.h - 190 - 30, { vx: 250, interval: 1.6, color: '#ff7878' }));
  // Enemy on early platform firing left
  enemies.push(new Enemy(180 + 90, bounds.h - 140 - 30, { vx: -250, interval: 1.4, color: '#ff4242' }));

  // Unicorn goal (simple rect) on the top platform
  const unicorn = { x: 700, y: bounds.h - 230 - 24, w: 40, h: 24 };

  return { platforms, donuts, enemy: enemies[0], enemies, unicorn };
}
