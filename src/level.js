import { Donut } from './collectible.js';
import { Enemy } from './enemy.js';
import { Platform } from './platform.js';

export function createLevel(bounds) {
  const platforms = [];

  // Ground (static)
  platforms.push(new Platform(0, bounds.h - 30, bounds.w, 30, '#606060'));

  // Staggered platforms: some static, some moving
  // Helper low step (oscillates slightly in x)
  platforms.push(new Platform(60, bounds.h - 90, 100, 14, '#707070', {
    osc: { axis: 'x', amplitude: 20, speed: 1.2 }
  }));
  // Mid platform (static)
  platforms.push(new Platform(180, bounds.h - 140, 140, 14, '#707070'));
  // Mid-high platform (oscillates horizontally)
  platforms.push(new Platform(360, bounds.h - 190, 140, 14, '#707070', {
    osc: { axis: 'x', amplitude: 40, speed: 1.6 }
  }));
  // Top-right platform (oscillates vertically)
  platforms.push(new Platform(560, bounds.h - 230, 160, 14, '#707070', {
    osc: { axis: 'y', amplitude: 16, speed: 1.8 }
  }));

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
