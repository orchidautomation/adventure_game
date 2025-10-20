import { Input } from './input.js';
import { Game } from './game.js';
import { initUI } from './ui.js';
import { VirtualJoystick } from './virtual-joystick.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = new Input(window);
const game = new Game(input, canvas);
initUI(game);
try {
  const d = localStorage.getItem('pref_difficulty');
  if (d === 'easy' || d === 'hard') game.setDifficulty(d);
} catch {}

// Initialize touch controls
function readPrefs() {
  try { return JSON.parse(localStorage.getItem('control_prefs') || '{}'); } catch { return {}; }
}

let joystick = null;
function applyJoystick(prefs) {
  // Destroy existing joystick
  if (joystick) { try { joystick.destroy(); } catch {} joystick = null; }

  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isTouchDevice) return;

  const touchControls = document.getElementById('touch-controls');
  if (touchControls) touchControls.classList.add('active');

  // Determine base position
  const leftHanded = !!(prefs && prefs.leftHanded);
  const dynamicStick = !!(prefs && prefs.dynamicStick);
  const baseX = leftHanded ? Math.max(100, window.innerWidth - 100 - (window.visualViewport?.offsetLeft || 0)) : 100;
  const baseY = 100;

  joystick = new VirtualJoystick(document.body, {
    baseX, baseY, stickRadius: 50, limitStickTravel: true,
    dynamic: dynamicStick, preferRightSide: leftHanded,
    activationEl: canvas
  });
  input.setJoystick(joystick);

  // Register touch buttons (jump/shoot)
  const btnJump = document.getElementById('btn-jump');
  const btnShoot = document.getElementById('btn-shoot');
  if (btnJump) { if (btnJump._inputCleanup) btnJump._inputCleanup(); input.registerTouchButton('Space', btnJump); }
  if (btnShoot) { if (btnShoot._inputCleanup) btnShoot._inputCleanup(); input.registerTouchButton('KeyF', btnShoot); }

  // Right-side tap-to-jump zone
  const jumpZone = document.getElementById('tap-jump-zone');
  if (jumpZone) { if (jumpZone._inputCleanup) jumpZone._inputCleanup(); input.registerTouchButton('Space', jumpZone); }
}

function initTouchControls() {
  // Detect if device has touch capability
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  if (isTouchDevice) {
    applyJoystick(readPrefs());
  }
}
initTouchControls();

// Re-apply joystick when control settings change or on resize
window.addEventListener('control-settings-change', (e) => applyJoystick(e.detail || readPrefs()));
window.addEventListener('resize', () => applyJoystick(readPrefs()));

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

// Wake Lock: keep screen on while playing
let wakeLock = null;
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch {}
}
function releaseWakeLock() {
  try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') requestWakeLock();
  else releaseWakeLock();
});
window.addEventListener('pointerdown', requestWakeLock, { passive: true });
window.addEventListener('beforeunload', releaseWakeLock);

// Rotate to landscape overlay
const rotateOverlay = document.getElementById('rotate-overlay');
function updateRotateOverlay() {
  const portrait = window.innerHeight > window.innerWidth;
  if (rotateOverlay) rotateOverlay.classList.toggle('active', portrait);
}
window.addEventListener('resize', updateRotateOverlay);
updateRotateOverlay();

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
