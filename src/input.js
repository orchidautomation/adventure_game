export class Input {
  constructor(target = window) {
    this.target = target;
    this.down = new Set();
    this.pressed = new Set();
    this._handled = new Set([
      'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Enter','KeyF','Escape','KeyR','Digit1','Digit2','KeyE','KeyH'
    ]);

    // Touch control state
    this.joystick = null;
    this.touchButtons = new Map(); // buttonId -> isPressed

    const isEditable = (el) => {
      if (!el) return false;
      const tag = (el.tagName || '').toUpperCase();
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };

    this._onKeyDown = (e) => {
      if (isEditable(e.target)) return; // don't intercept typing in inputs
      if (this._handled.has(e.code)) e.preventDefault();
      if (!this.down.has(e.code)) {
        this.pressed.add(e.code);
      }
      this.down.add(e.code);
    };
    this._onKeyUp = (e) => {
      if (isEditable(e.target)) return; // don't intercept typing in inputs
      if (this._handled.has(e.code)) e.preventDefault();
      this.down.delete(e.code);
    };

    target.addEventListener('keydown', this._onKeyDown);
    target.addEventListener('keyup', this._onKeyUp);
  }

  setJoystick(joystick) {
    this.joystick = joystick;
  }

  registerTouchButton(buttonId, element) {
    this.touchButtons.set(buttonId, false);

    const onStart = (e) => {
      e.preventDefault();
      if (!this.touchButtons.has(buttonId)) return;

      // Trigger pressed event (edge-triggered)
      if (!this.touchButtons.get(buttonId)) {
        this.pressed.add(buttonId);
      }
      this.touchButtons.set(buttonId, true);
      this.down.add(buttonId);
      element.style.opacity = '0.8';
    };

    const onEnd = (e) => {
      e.preventDefault();
      this.touchButtons.set(buttonId, false);
      this.down.delete(buttonId);
      element.style.opacity = '1';
    };

    element.addEventListener('touchstart', onStart);
    element.addEventListener('touchend', onEnd);
    element.addEventListener('touchcancel', onEnd);
    element.addEventListener('mousedown', onStart);
    element.addEventListener('mouseup', onEnd);

    // Store cleanup
    element._inputCleanup = () => {
      element.removeEventListener('touchstart', onStart);
      element.removeEventListener('touchend', onEnd);
      element.removeEventListener('touchcancel', onEnd);
      element.removeEventListener('mousedown', onStart);
      element.removeEventListener('mouseup', onEnd);
    };
  }

  beginFrame() {
    // Handle joystick input (convert to arrow key equivalents)
    if (this.joystick) {
      const dx = this.joystick.deltaX();
      const threshold = 0.3;

      // Simulate ArrowLeft/ArrowRight based on joystick
      if (dx < -threshold) {
        this.down.add('ArrowLeft');
        this.down.delete('ArrowRight');
      } else if (dx > threshold) {
        this.down.add('ArrowRight');
        this.down.delete('ArrowLeft');
      } else {
        this.down.delete('ArrowLeft');
        this.down.delete('ArrowRight');
      }
    }

    // Clear edge-triggered presses each frame after being observed
    this.pressed.clear();
  }

  isDown(code) {
    return this.down.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  dispose() {
    this.target.removeEventListener('keydown', this._onKeyDown);
    this.target.removeEventListener('keyup', this._onKeyUp);

    // Cleanup joystick
    if (this.joystick) {
      this.joystick.destroy();
      this.joystick = null;
    }

    // Cleanup touch buttons
    this.touchButtons.clear();
  }
}
