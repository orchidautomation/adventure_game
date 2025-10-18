import { Input } from './input.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = new Input(window);
const game = new Game(input, canvas);

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
}, { passive: false });
