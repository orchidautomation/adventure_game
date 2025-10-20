/**
 * Simple Virtual Joystick for touch controls
 * Based on virtualjoystick.js pattern - zero dependencies
 */
export class VirtualJoystick {
  constructor(container, options = {}) {
    this.container = container;
    this.baseX = options.baseX || 100;
    this.baseY = options.baseY || 100;
    this.limitStickTravel = options.limitStickTravel !== false;
    this.stickRadius = options.stickRadius || 50;
    this.dynamic = !!options.dynamic; // spawn where first touched
    this.preferRightSide = !!options.preferRightSide; // when dynamic, accept touches on this side

    this._pressed = false;
    this._baseEl = null;
    this._stickEl = null;
    this._touchId = null;

    this._deltaX = 0;
    this._deltaY = 0;
    this._stickX = 0;
    this._stickY = 0;

    this._buildDom();
    this._setupEvents();
  }

  _buildDom() {
    // Base (outer circle)
    const base = document.createElement('div');
    base.style.position = 'fixed';
    base.style.width = '120px';
    base.style.height = '120px';
    base.style.borderRadius = '50%';
    base.style.background = 'rgba(255, 255, 255, 0.15)';
    base.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    base.style.left = `${this.baseX - 60}px`;
    base.style.bottom = `${this.baseY - 60}px`;
    base.style.touchAction = 'none';
    base.style.userSelect = 'none';
    base.style.zIndex = '1000';
    if (this.dynamic) base.style.display = 'none';
    this._baseEl = base;

    // Stick (inner circle)
    const stick = document.createElement('div');
    stick.style.position = 'absolute';
    stick.style.width = '60px';
    stick.style.height = '60px';
    stick.style.borderRadius = '50%';
    stick.style.background = 'rgba(255, 255, 255, 0.5)';
    stick.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    stick.style.left = '30px';
    stick.style.top = '30px';
    stick.style.transition = 'all 0.1s';
    this._stickEl = stick;

    base.appendChild(stick);
    this.container.appendChild(base);
  }

  _setupEvents() {
    const onDown = (x, y, touchId) => {
      this._pressed = true;
      this._touchId = touchId;
      this._stickX = 0;
      this._stickY = 0;
      if (this.dynamic) {
        // Position base centered at touch location
        this._baseEl.style.display = 'block';
        this._baseEl.style.left = `${x - 60}px`;
        this._baseEl.style.bottom = '';
        this._baseEl.style.top = `${y - 60}px`;
      }
      this._updateStick();
    };

    const onMove = (x, y) => {
      if (!this._pressed) return;

      const rect = this._baseEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      this._stickX = x - centerX;
      this._stickY = y - centerY;

      // Limit stick travel
      if (this.limitStickTravel) {
        const distance = Math.sqrt(this._stickX * this._stickX + this._stickY * this._stickY);
        if (distance > this.stickRadius) {
          const angle = Math.atan2(this._stickY, this._stickX);
          this._stickX = Math.cos(angle) * this.stickRadius;
          this._stickY = Math.sin(angle) * this.stickRadius;
        }
      }

      this._deltaX = this._stickX / this.stickRadius;
      this._deltaY = this._stickY / this.stickRadius;
      this._updateStick();
    };

    const onUp = () => {
      this._pressed = false;
      this._touchId = null;
      this._stickX = 0;
      this._stickY = 0;
      this._deltaX = 0;
      this._deltaY = 0;
      this._updateStick();
    };

    // Touch events
    this._baseEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      onDown(touch.clientX, touch.clientY, touch.identifier);
    }, { passive: false });

    this.container.addEventListener('touchmove', (e) => {
      if (!this._pressed) return;
      for (let touch of e.changedTouches) {
        if (touch.identifier === this._touchId) {
          e.preventDefault();
          onMove(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    this.container.addEventListener('touchend', (e) => {
      if (!this._pressed) return;
      for (let touch of e.changedTouches) {
        if (touch.identifier === this._touchId) {
          e.preventDefault();
          onUp();
          break;
        }
      }
    }, { passive: false });

    // Dynamic activation anywhere on the preferred side
    if (this.dynamic) {
      const onDynStart = (x, y, id) => {
        if (this._pressed) return;
        const mid = window.innerWidth / 2;
        const isRight = x >= mid;
        if (this.preferRightSide ? !isRight : isRight) return; // reject opposite side
        onDown(x, y, id);
      };
      this.container.addEventListener('touchstart', (e) => {
        for (let touch of e.changedTouches) {
          e.preventDefault();
          onDynStart(touch.clientX, touch.clientY, touch.identifier);
          break;
        }
      }, { passive: false });
      this.container.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onDynStart(e.clientX, e.clientY, 'mouse');
      });
    }

    // Mouse events (for desktop testing)
    this._baseEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onDown(e.clientX, e.clientY, 'mouse');
    });

    this.container.addEventListener('mousemove', (e) => {
      if (!this._pressed) return;
      e.preventDefault();
      onMove(e.clientX, e.clientY);
    });

    this.container.addEventListener('mouseup', (e) => {
      if (!this._pressed) return;
      e.preventDefault();
      onUp();
    });
  }

  _updateStick() {
    // Position stick relative to center
    this._stickEl.style.left = `${30 + this._stickX}px`;
    this._stickEl.style.top = `${30 + this._stickY}px`;
  }

  deltaX() {
    return this._deltaX;
  }

  deltaY() {
    return this._deltaY;
  }

  isPressed() {
    return this._pressed;
  }

  destroy() {
    if (this._baseEl && this._baseEl.parentNode) {
      this._baseEl.parentNode.removeChild(this._baseEl);
    }
  }
}
