export class Input {
  constructor(target = window) {
    this.target = target;
    this.down = new Set();
    this.pressed = new Set();
    this.suspended = false;
    this._handled = new Set([
      'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Enter','KeyF','Escape','KeyR','Digit1','Digit2','KeyE','KeyH'
    ]);

    this._onKeyDown = (e) => {
      if (this._handled.has(e.code)) e.preventDefault();
      if (this.suspended) return;
      if (!this.down.has(e.code)) {
        this.pressed.add(e.code);
      }
      this.down.add(e.code);
    };
    this._onKeyUp = (e) => {
      if (this._handled.has(e.code)) e.preventDefault();
      if (this.suspended) return;
      this.down.delete(e.code);
    };

    target.addEventListener('keydown', this._onKeyDown);
    target.addEventListener('keyup', this._onKeyUp);
  }

  beginFrame() {
    // Clear edge-triggered presses each frame after being observed
    this.pressed.clear();
  }

  isDown(code) {
    return this.down.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  setSuspended(active) {
    this.suspended = !!active;
    if (this.suspended) {
      this.down.clear();
      this.pressed.clear();
    }
  }

  dispose() {
    this.target.removeEventListener('keydown', this._onKeyDown);
    this.target.removeEventListener('keyup', this._onKeyUp);
  }
}
