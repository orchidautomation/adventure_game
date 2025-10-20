import { Input } from './input.js';
import { Game } from './game.js';
import { initUI } from './ui.js';
import { VirtualJoystick } from './virtual-joystick.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = new Input(window);
const game = new Game(input, canvas);
initUI(game);

// Initialize touch controls
function initTouchControls() {
  // Detect if device has touch capability
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  if (isTouchDevice) {
    // Show touch controls
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
      touchControls.classList.add('active');
    }

    // Initialize virtual joystick
    const joystick = new VirtualJoystick(document.body, {
      baseX: 100,
      baseY: 100,
      stickRadius: 50,
      limitStickTravel: true
    });
    input.setJoystick(joystick);

    // Register touch buttons
    const btnJump = document.getElementById('btn-jump');
    const btnShoot = document.getElementById('btn-shoot');

    if (btnJump) input.registerTouchButton('Space', btnJump);
    if (btnShoot) input.registerTouchButton('KeyF', btnShoot);
  }
}
initTouchControls();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.draw();
  // Clear edge-triggered inputs at the end of the frame
  input.beginFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Prevent page scrolling on spacebar when canvas focused in some browsers
window.addEventListener('keydown', (e) => {
  const target = e.target;
  const tag = (target && target.tagName || '').toUpperCase();
  const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (target && target.isContentEditable);
  if (!isEditable && ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  // Try to unlock audio context on any key press
  try { game.sfx && game.sfx.unlock(); } catch {}
}, { passive: false });

window.addEventListener('pointerdown', () => {
  try { game.sfx && game.sfx.unlock(); } catch {}
});

// Responsive canvas scaling to fill most of the viewport while preserving aspect ratio
const BASE_W = canvas.width;
const BASE_H = canvas.height;
function resizeCanvas() {
  const scale = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H) * 0.95;
  const cssW = Math.max(1, Math.floor(BASE_W * scale));
  const cssH = Math.max(1, Math.floor(BASE_H * scale));
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registered:', registration.scope);
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed:', err);
      });
  });
}
