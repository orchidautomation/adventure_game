Unicorn Donut Dash – 2D Platformer MVP

How to run
- Open `index.html` directly in a modern desktop browser (Chrome/Edge/Firefox). No build step.
- Controls: On start, choose difficulty: 1/E = Easy (5 hearts), 2/H = Hard (3 hearts). In game: Left/Right arrows to move, Space to jump (double jump), F to shoot, Esc to pause/resume, R to reroll level.
- Goal: Defeat all enemies, then reach the unicorn.
- Donuts: Bonus points with effects by color:
  - Pink: Speed boost
  - Red: +1 heart (up to max)
  - Blue: Damage boost (bullets deal more damage for a short time)
- Restart: Press Enter after winning or losing.

Tech
- HTML5 Canvas + vanilla JavaScript (ES modules). Zero dependencies.
- Web Audio API tones for shooting, hits, and winning.

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
