export class Player {
  constructor(x, y) {
    this.pos = { x, y };
    this.size = { w: 28, h: 40 };
    this.vel = { x: 0, y: 0 };
    this.speed = 180; // px/s
    this.jumpVel = -400; // higher jump for reachability
    this.maxFall = 600;
    this.gravity = 1000;

    this.onGround = false;
    this.maxAirJumps = 1; // enable double jump (1 extra in-air jump)
    this.airJumpsLeft = 1;

    this.maxHearts = 5;
    this.hearts = 5;
    this.invuln = 0; // seconds
    this.boost = 0; // seconds

    this.color = '#4ea3ff';
  }

  rect() {
    return { x: this.pos.x, y: this.pos.y, w: this.size.w, h: this.size.h };
  }

  hurt() {
    if (this.invuln > 0) return false;
    this.hearts = Math.max(0, this.hearts - 1);
    this.invuln = 1.0; // 1s iframe
    return true;
  }

  pickupBoost(duration = 3.0) {
    this.boost = Math.max(this.boost, duration);
  }

  update(dt, input, platforms, bounds) {
    const moveLeft = input.isDown('ArrowLeft');
    const moveRight = input.isDown('ArrowRight');
    let move = 0;
    if (moveLeft) move -= 1;
    if (moveRight) move += 1;

    const speedMul = this.boost > 0 ? 1.4 : 1.0;
    this.vel.x = move * this.speed * speedMul;

    // Jump + double jump
    if (input.wasPressed('Space')) {
      if (this.onGround) {
        this.vel.y = this.jumpVel;
        this.onGround = false;
      } else if (this.airJumpsLeft > 0) {
        this.vel.y = this.jumpVel;
        this.airJumpsLeft -= 1;
      }
    }

    // Gravity
    this.vel.y += this.gravity * dt;
    if (this.vel.y > this.maxFall) this.vel.y = this.maxFall;

    // Horizontal move + collisions
    this.pos.x += this.vel.x * dt;
    for (const p of platforms) {
      if (overlap(this.rect(), p)) {
        if (this.vel.x > 0) {
          this.pos.x = p.x - this.size.w; // from left
        } else if (this.vel.x < 0) {
          this.pos.x = p.x + p.w; // from right
        }
      }
    }
    // Keep within bounds horizontally
    if (this.pos.x < 0) this.pos.x = 0;
    if (this.pos.x + this.size.w > bounds.w) this.pos.x = bounds.w - this.size.w;

    // Vertical move + collisions
    this.pos.y += this.vel.y * dt;
    this.onGround = false;
    for (const p of platforms) {
      if (overlap(this.rect(), p)) {
        if (this.vel.y > 0) {
          // falling, landed on top
          this.pos.y = p.y - this.size.h;
          this.vel.y = 0;
          this.onGround = true;
          this.airJumpsLeft = this.maxAirJumps; // reset air jumps on landing
        } else if (this.vel.y < 0) {
          // moving up, hit head
          this.pos.y = p.y + p.h;
          this.vel.y = 0;
        }
      }
    }

    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
    if (this.boost > 0) this.boost = Math.max(0, this.boost - dt);
  }

  draw(ctx) {
    // Flash if invulnerable
    const flash = this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0;
    ctx.fillStyle = flash ? '#fff' : this.color;
    const { x, y, w, h } = this.rect();
    ctx.fillRect(x, y, w, h);
  }
}

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
