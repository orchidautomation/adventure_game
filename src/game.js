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
    this.state = 'running'; // 'won' | 'lost' | 'paused' | 'menu'
    this.level = 1;
    this.levelScore = 0;
    this.totalScore = 0;
    this.time = 0;
    this.difficulty = 'easy'; // 'easy' | 'hard'
    this.damagePerHit = 1;
    this.pointsEnemy = 100;
    this.pointsBoss = 300;
    this.pointsDonut = 25;
    this.damageBoostTimer = 0;

    this.platforms = [];
    this.donuts = [];
    this.projectiles = [];
    this.playerBullets = [];
    this.enemies = [];
    this.player = null;
    this.unicorn = null;
    this.sfx = new Sfx();
    this.onRunEnd = null; // set by UI
    this.onWinEnd = null; // set by UI
    this._reported = false;
    this._winFetched = false;
    this.top5HS = null;
    this.top5Err = null;

    this.externalPause = false;

    this.reset();
    // Start on difficulty selection menu
    this.state = 'menu';
  }

  reset() {
    this.state = 'running';
    this.levelScore = 0;
    const lvl = createLevel(this.bounds, { difficulty: this.difficulty, level: this.level });
    this.platforms = lvl.platforms;
    this.donuts = lvl.donuts;
    this.enemies = lvl.enemies ?? (lvl.enemy ? [lvl.enemy] : []);
    this.projectiles = [];
    this.playerBullets = [];
    this.unicorn = lvl.unicorn;
    this.player = new Player(20, this.bounds.h - 80);
    // Apply difficulty hearts
    const hearts = this.difficulty === 'hard' ? 3 : 5;
    this.player.maxHearts = hearts;
    this.player.hearts = hearts;
    // Apply difficulty invulnerability window
    this.player.invulnDuration = this.difficulty === 'hard' ? 0.55 : 1.0;
    // Compute damage per hit scaling with level
    this.recomputeDamage();
    this.damageBoostTimer = 0;
    this._reported = false;
    this._winFetched = false;
    this.top5HS = null;
    this.top5Err = null;
  }

  spawnProjectile(x, y, vx, vy) {
    this.projectiles.push(new Projectile(x, y, vx, vy));
  }

  spawnPlayerBullet(x, y, vx, damage = 1) {
    this.playerBullets.push(new PlayerBullet(x, y, vx, damage));
  }

  update(dt) {
    this.time += dt;
    if (this.externalPause) {
      return;
    }
    if (this.damageBoostTimer && this.damageBoostTimer > 0) {
      this.damageBoostTimer = Math.max(0, this.damageBoostTimer - dt);
    }
    // Difficulty menu before start
    if (this.state === 'menu') {
      if (this.input.wasPressed('Digit1') || this.input.wasPressed('KeyE')) {
        this.setDifficulty('easy');
        this.level = 1;
        this.totalScore = 0;
        this.reset();
        return;
      }
      if (this.input.wasPressed('Digit2') || this.input.wasPressed('KeyH')) {
        this.setDifficulty('hard');
        this.level = 1;
        this.totalScore = 0;
        this.reset();
        return;
      }
      return; // wait for selection
    }

    // Global reroll: R resets
    if (this.input.wasPressed('KeyR')) {
      this.reset();
      return;
    }
    // Difficulty toggle (live) — 1/E for Easy, 2/H for Hard
    if (this.input.wasPressed('Digit1') || this.input.wasPressed('KeyE')) {
      this.setDifficulty('easy');
    }
    if (this.input.wasPressed('Digit2') || this.input.wasPressed('KeyH')) {
      this.setDifficulty('hard');
    }
    // Pause/resume handling
    if (this.state === 'paused') {
      if (this.input.wasPressed('Escape')) this.state = 'running';
      return;
    }
    if (this.state !== 'running') {
      if (this.input.wasPressed('Enter')) {
        if (this.state === 'won') {
          this.totalScore += this.levelScore;
          this.level += 1;
          this.reset();
        } else if (this.state === 'lost') {
          this.level = 1;
          this.totalScore = 0;
          this.reset();
        }
      }
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
      this.spawnPlayerBullet(bx, by, dir * speed, this.getBulletDamage());
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
    this.player.update(
      dt,
      this.input,
      this.platforms,
      this.bounds,
      { onJump: () => this.sfx.jump() },
      this.enemies.map(e => e.rect())
    );

    // Contact damage with enemies
    for (const e of this.enemies) {
      if (overlap(this.player.rect(), e.rect())) {
        const took = this.player.hurt();
        if (took) this.sfx.hit();
        if (took && this.player.hearts <= 0) {
          this.lose();
        }
      }
    }

    // Win condition: touch unicorn AND all enemies defeated
    if (overlap(this.player.rect(), this.unicorn)) {
      if (this.enemies.length === 0) {
        this.win();
      }
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
    if (this.enemies.length > 0) drawLock(ctx, this.unicorn);

    // Player
    this.player.draw(ctx);

    // HUD & overlays
    drawHUD(ctx, this);
  }

  setExternalPause(active) {
    const next = !!active;
    if (this.externalPause === next) return;
    this.externalPause = next;
    if (this.input && typeof this.input.setSuspended === 'function') {
      this.input.setSuspended(next);
    }
  }
}

Game.prototype.recomputeDamage = function() {
  const base = 1;
  const factor = this.difficulty === 'hard' ? 1.22 : 1.12;
  const cap = this.difficulty === 'hard' ? 3 : 2;
  const scaled = Math.ceil(base * Math.pow(factor, Math.max(0, this.level - 1)));
  this.damagePerHit = Math.min(cap, Math.max(1, scaled));
};

Game.prototype.lose = function() {
  if (this.state !== 'lost') {
    this.state = 'lost';
    this.sfx.lose();
    if (!this._reported && this.onRunEnd) {
      this._reported = true;
      const summary = {
        score: (this.totalScore || 0) + (this.levelScore || 0),
        levelReached: this.level,
        difficulty: this.difficulty,
        died: true
      };
      try { this.onRunEnd(summary); } catch {}
    }
  }
};

Game.prototype.getBulletDamage = function() {
  return (this.damageBoostTimer && this.damageBoostTimer > 0) ? 2 : 1;
};

Game.prototype.win = function() {
  if (this.state !== 'won') {
    this.state = 'won';
    this.sfx.win();
    if (!this._winFetched && this.onWinEnd) {
      this._winFetched = true;
      try { this.onWinEnd(); } catch {}
    }
  }
};

Game.prototype.setDifficulty = function(mode) {
  if (mode !== 'easy' && mode !== 'hard') return;
  if (this.difficulty === mode) return;
  this.difficulty = mode;
  const hearts = this.difficulty === 'hard' ? 3 : 5;
  if (this.player) {
    this.player.maxHearts = hearts;
    this.player.hearts = Math.min(hearts, this.player.hearts);
    // Optionally refill fully on change
    this.player.hearts = hearts;
    this.player.invulnDuration = this.difficulty === 'hard' ? 0.55 : 1.0;
  }
  this.recomputeDamage();
};

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

function drawLock(ctx, u) {
  // Draw a small lock icon to indicate locked goal
  const x = u.x + u.w - 16;
  const y = u.y - 18;
  ctx.fillStyle = 'rgba(255,80,80,0.85)';
  ctx.fillRect(x, y + 6, 12, 10);
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,80,80,0.95)';
  ctx.arc(x + 6, y + 6, 4, Math.PI, 0);
  ctx.stroke();
}
