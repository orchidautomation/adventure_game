/**
 * Simple Virtual Joystick for touch controls
 * Based on virtualjoystick.js pattern - zero dependencies
 */
export class VirtualJoystick {
  constructor(container, options = {}) {
    this.container = container;
    this.activationEl = options.activationEl || null; // where dynamic activation is allowed (e.g., canvas)
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
    base.style.zIndex = '90'; // under UI overlays/buttons
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
    this._listeners = this._listeners || {};
    const isInteractiveTarget = (el) => {
      if (!el || !el.closest) return false;
      const selectors = [
        '#topbar', '.modal', '#state-overlay', '#start-menu', '#touch-controls', '.touch-btn',
        'button', 'input', 'select', 'a', '#leaderboard-modal', '#username-modal', '#settings-modal'
      ];
      return selectors.some((sel) => el.closest(sel));
    };
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
    this._listeners.baseTouchStart = (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      onDown(touch.clientX, touch.clientY, touch.identifier);
    };
    this._baseEl.addEventListener('touchstart', this._listeners.baseTouchStart, { passive: false });

    this._listeners.containerTouchMove = (e) => {
      if (!this._pressed) return;
      for (let touch of e.changedTouches) {
        if (touch.identifier === this._touchId) {
          e.preventDefault();
          onMove(touch.clientX, touch.clientY);
          break;
        }
      }
    };
    this.container.addEventListener('touchmove', this._listeners.containerTouchMove, { passive: false });

    this._listeners.containerTouchEnd = (e) => {
      if (!this._pressed) return;
      for (let touch of e.changedTouches) {
        if (touch.identifier === this._touchId) {
          e.preventDefault();
          onUp();
          break;
        }
      }
    };
    this.container.addEventListener('touchend', this._listeners.containerTouchEnd, { passive: false });

    // Dynamic activation anywhere on the preferred side
    if (this.dynamic) {
      const onDynStart = (x, y, id, originalEvent) => {
        if (this._pressed) return;
        const mid = window.innerWidth / 2;
        const isRight = x >= mid;
        if (this.preferRightSide ? !isRight : isRight) return; // reject opposite side
        if (originalEvent && isInteractiveTarget(originalEvent.target)) return; // don't steal UI taps
        if (originalEvent) originalEvent.preventDefault();
        onDown(x, y, id);
      };
      const targetEl = this.activationEl || this.container;
      this._listeners.dynamicTouchStart = (e) => {
        for (let touch of e.changedTouches) {
          onDynStart(touch.clientX, touch.clientY, touch.identifier, e);
          break;
        }
      };
      targetEl.addEventListener('touchstart', this._listeners.dynamicTouchStart, { passive: false });
      this._listeners.dynamicMouseDown = (e) => {
        onDynStart(e.clientX, e.clientY, 'mouse', e);
      };
      targetEl.addEventListener('mousedown', this._listeners.dynamicMouseDown);
    }

    // Mouse events (for desktop testing)
    this._listeners.baseMouseDown = (e) => {
      e.preventDefault();
      onDown(e.clientX, e.clientY, 'mouse');
    };
    this._baseEl.addEventListener('mousedown', this._listeners.baseMouseDown);

    this._listeners.containerMouseMove = (e) => {
      if (!this._pressed) return;
      e.preventDefault();
      onMove(e.clientX, e.clientY);
    };
    this.container.addEventListener('mousemove', this._listeners.containerMouseMove);

    this._listeners.containerMouseUp = (e) => {
      if (!this._pressed) return;
      e.preventDefault();
      onUp();
    };
    this.container.addEventListener('mouseup', this._listeners.containerMouseUp);
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
    try {
      if (this._listeners) {
        if (this._listeners.baseTouchStart) this._baseEl.removeEventListener('touchstart', this._listeners.baseTouchStart, { passive: false });
        if (this._listeners.baseMouseDown) this._baseEl.removeEventListener('mousedown', this._listeners.baseMouseDown);
        if (this._listeners.containerTouchMove) this.container.removeEventListener('touchmove', this._listeners.containerTouchMove, { passive: false });
        if (this._listeners.containerTouchEnd) this.container.removeEventListener('touchend', this._listeners.containerTouchEnd, { passive: false });
        if (this._listeners.containerMouseMove) this.container.removeEventListener('mousemove', this._listeners.containerMouseMove);
        if (this._listeners.containerMouseUp) this.container.removeEventListener('mouseup', this._listeners.containerMouseUp);
        const targetEl = this.activationEl || this.container;
        if (this._listeners.dynamicTouchStart) targetEl.removeEventListener('touchstart', this._listeners.dynamicTouchStart, { passive: false });
        if (this._listeners.dynamicMouseDown) targetEl.removeEventListener('mousedown', this._listeners.dynamicMouseDown);
      }
    } catch {}
    try {
      if (this._baseEl && this._baseEl.parentNode) {
        this._baseEl.parentNode.removeChild(this._baseEl);
      }
    } catch {}
  }
}
