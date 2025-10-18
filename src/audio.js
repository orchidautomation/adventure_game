export class Sfx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    return this.ctx;
  }

  unlock() {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
  }

  playTone({ type = 'sine', freq = 440, duration = 0.12, volume = 0.2, sweepTo = null }) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (sweepTo != null) {
      o.frequency.exponentialRampToValueAtTime(Math.max(10, sweepTo), t0 + duration * 0.9);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(Math.max(0.0001, volume), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + duration + 0.05);
  }

  shoot() {
    this.playTone({ type: 'square', freq: 900, sweepTo: 700, duration: 0.08, volume: 0.15 });
  }

  hit() {
    this.playTone({ type: 'sawtooth', freq: 220, sweepTo: 80, duration: 0.18, volume: 0.25 });
  }

  win() {
    const ctx = this.ensure();
    if (!ctx) return;
    // Simple arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    let start = ctx.currentTime;
    const dur = 0.1;
    for (let i = 0; i < notes.length; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(notes[i], start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.18, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g).connect(ctx.destination);
      o.start(start);
      o.stop(start + dur + 0.05);
      start += 0.09;
    }
  }

  jump() {
    // Upward chirp, distinct from shoot/hit/win
    this.playTone({ type: 'sine', freq: 350, sweepTo: 900, duration: 0.09, volume: 0.18 });
  }

  lose() {
    const ctx = this.ensure();
    if (!ctx) return;
    // Two-step descending tones, distinct pattern
    const start = ctx.currentTime;
    const seq = [
      { t: 0.00, type: 'triangle', f: 200, to: 140, d: 0.18, v: 0.22 },
      { t: 0.16, type: 'triangle', f: 140, to: 90,  d: 0.22, v: 0.20 }
    ];
    for (const s of seq) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = s.type;
      o.frequency.setValueAtTime(s.f, start + s.t);
      o.frequency.exponentialRampToValueAtTime(Math.max(10, s.to), start + s.t + s.d * 0.9);
      g.gain.setValueAtTime(0.0001, start + s.t);
      g.gain.linearRampToValueAtTime(Math.max(0.0001, s.v), start + s.t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + s.t + s.d);
      o.connect(g).connect(ctx.destination);
      o.start(start + s.t);
      o.stop(start + s.t + s.d + 0.05);
    }
  }

  pickup() {
    const ctx = this.ensure();
    if (!ctx) return;
    // Quick ascending chime (distinct from jump/shoot/hit/win/lose)
    const start = ctx.currentTime;
    const notes = [740, 880, 988];
    const dur = 0.055;
    for (let i = 0; i < notes.length; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(notes[i], start + i * 0.045);
      g.gain.setValueAtTime(0.0001, start + i * 0.045);
      g.gain.linearRampToValueAtTime(0.16, start + i * 0.045 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.045 + dur);
      o.connect(g).connect(ctx.destination);
      o.start(start + i * 0.045);
      o.stop(start + i * 0.045 + dur + 0.03);
    }
  }
}
