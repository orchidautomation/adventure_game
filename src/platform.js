export class Platform {
  constructor(x, y, w, h, color = '#707070', opts = {}) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.color = color;
    this.ox = x; this.oy = y; // origin
    this.dx = 0; this.dy = 0; // delta from last frame
    // Oscillation settings: { axis: 'x'|'y', amplitude: number, speed: number, phase?: number }
    this.osc = opts.osc || null;
    this._time = 0;
    this._lastX = x; this._lastY = y;
  }

  update(dt, time) {
    this.dx = 0; this.dy = 0;
    this._lastX = this.x; this._lastY = this.y;
    if (this.osc) {
      const t = time ?? (this._time += dt);
      const phase = this.osc.phase || 0;
      const s = Math.sin(t * this.osc.speed + phase);
      if (this.osc.axis === 'x') this.x = this.ox + s * this.osc.amplitude;
      if (this.osc.axis === 'y') this.y = this.oy + s * this.osc.amplitude;
    }
    this.dx = this.x - this._lastX;
    this.dy = this.y - this._lastY;
  }
}

