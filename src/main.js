import { Input } from './input.js';
import { Game } from './game.js';
import { initUI } from './ui.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = new Input(window);
const game = new Game(input, canvas);
initUI(game);

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
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
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
