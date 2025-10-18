Unicorn Donut Dash – 2D Platformer MVP

How to run
- Open `index.html` directly in a modern desktop browser (Chrome/Edge/Firefox). No build step.
- Controls: Left/Right arrows to move, Space to jump (double jump enabled).
- Goal: Reach the unicorn on the far right. Avoid orange projectiles.
- Donuts: Pick up for a short speed boost and +1 score.
- Restart: Press Enter after winning or losing.

Tech
- HTML5 Canvas + vanilla JavaScript (ES modules). Zero dependencies.

Structure
- `index.html` – Canvas + script loader
- `src/main.js` – game boot + main loop
- `src/input.js` – keyboard handling
- `src/game.js` – orchestration, draw, state transitions
- `src/player.js` – player physics + collisions + hearts
- `src/enemy.js` – shooter enemy
- `src/projectile.js` – orange projectiles
- `src/collectible.js` – donuts
- `src/level.js` – layout and entity placement
- `src/hud.js` – hearts/score and overlays
