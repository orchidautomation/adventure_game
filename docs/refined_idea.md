<!-- moved to docs/ for OSS repo hygiene -->
# 2D Platformer MVP – Refined Idea and 30‑Minute Build Plan

## Vision
A tiny browser-based 2D platformer where the player runs and jumps across a few platforms, avoids enemy projectiles, optionally shoots, collects donuts for a brief power-up, and reaches a unicorn at the end to win. Art can be simple shapes for the MVP; polish and sprites come later.

## Core Gameplay Loop
- Move left/right, jump across gaps and platforms.
- Avoid or dodge enemy projectiles; take damage on hit.
- Collect donuts for a short power-up (speed boost) and score.
- Reach the unicorn to win; lose when hearts reach 0.

## MVP Scope (Timeboxed)
- One single-screen level (no scrolling) with 3–6 platforms.
- One enemy type that periodically fires orange projectiles horizontally.
- Player has 5 hearts (displayed as icons or simple HUD). On hit: lose 1 heart and brief invulnerability.
- Donuts (2–5) grant a 3-second speed boost and +1 score.
- Unicorn goal object triggers a victory state on touch.
- Simple restart-once-over screen (Game Over / You Win).

## Controls
- Left/Right: Arrow keys (`ArrowLeft`, `ArrowRight`).
- Jump: Space (`Space`) with simple coyote time (optional small grace window) or just basic jump.
- Shoot (optional stretch): `F` key. Note: `Tab` often toggles browser focus; avoid for gameplay.

## Visual + Audio
- MVP visuals: draw rectangles/circles on Canvas (player, platforms, donuts, enemy, projectiles, unicorn).
- Colors: player (blue), platforms (gray), donuts (pink circle with hole), enemy (red), projectiles (orange), unicorn (white with rainbow tail as simple shape).
- Optional SFX: simple “beep” for pickup/hit (can be added later via small oscillator or embedded wav).

## Tech Stack
- HTML5 Canvas + vanilla JavaScript (ES modules). No external libraries required.
- One HTML file (`index.html`) and a few JS modules in `src/`.
- Run locally by opening `index.html` in a browser; no build tools needed.

Rationale: Canvas + vanilla JS is fastest to implement in 30 minutes, zero dependencies, and good enough for a smooth MVP.

## Game Systems
- Physics: simple gravity and velocity integration; clamp terminal velocity.
- Collision: AABB vs. AABB for player-platform and player-collectibles; discrete step sufficient for MVP.
- Entities: plain JS objects with `update(dt)` and `draw(ctx)` methods; managed by a simple array.
- Spawning: level definition specifies platforms, enemy, donuts, unicorn positions.
- States: `running`, `won`, `lost` with a basic overlay.
- HUD: hearts (5 max), score (donuts collected), and optional timer.

## Level Layout (MVP)
- Canvas size: 800x450 (16:9) or 800x600 if preferred.
- Ground: a floor platform across the bottom.
- Platforms: 3–5 rectangles at staggered heights.
- Player start: bottom-left.
- Enemy: mid-right platform, fires horizontally left every ~1.2s.
- Donuts: sprinkled along platforms.
- Unicorn: far right near top platform.

## File Structure
- `index.html` – Canvas element, loads `src/main.js` as module.
- `src/main.js` – bootstraps the game loop, input, and scene.
- `src/input.js` – key handling (pressed/held), with `preventDefault` for arrows/space.
- `src/game.js` – game state, update/draw loop orchestration.
- `src/player.js` – player movement, jump, collision with platforms, damage/iframes.
- `src/enemy.js` – basic enemy that fires projectiles on a timer.
- `src/projectile.js` – projectile movement and collision with player/world.
- `src/collectible.js` – donuts logic (pickup, power-up, score).
- `src/level.js` – level data and helpers to spawn entities.
- `src/hud.js` – render hearts and score overlays.

Note: For the 30‑minute version, we can merge some of these into fewer files if needed (e.g., `entities.js`).

## 30‑Minute Implementation Plan
- 0–5 min: Scaffold files, canvas, main loop (requestAnimationFrame), clear screen, draw placeholder.
- 5–12 min: Input handling (arrows + space) and player movement with gravity + ground collision.
- 12–17 min: Platforms (static AABBs) and player-vs-platform collision resolution.
- 17–22 min: Enemy + projectile system; on-hit reduce hearts and apply brief invulnerability.
- 22–25 min: Donuts collectible; on-pickup add score + short speed boost.
- 25–28 min: Unicorn goal + win/lose states and restart handling (press Enter to restart).
- 28–30 min: HUD for hearts/score, quick polish on colors and game state overlays.

## Success Criteria
- Player can move and jump across platforms without falling through.
- Taking projectile damage reduces hearts; at 0 hearts, Game Over.
- Donuts can be collected and give a visible, time-limited speed boost.
- Touching the unicorn shows a Win screen.
- Runs by opening `index.html` in a modern browser; no build step.

## Stretch Goals (If Time Remains)
- Shooting: `F` key to fire player bullet; hit enemy to remove it.
- Simple camera and scrolling level (bigger world than canvas).
- Better jump feel (coyote time, jump buffering, variable jump height).
- Sprites and basic animation frames instead of shapes.
- Sound effects (pickup/hit/win) using Web Audio API or small embedded audio files.

## Risks & Mitigations
- Tab key conflicts: use `F` or `Z` for shoot instead of `Tab`.
- Collision tunneling: projectiles and player move fast; keep speeds reasonable and use small dt.
- Frame-rate variance: base movement on `dt` to keep logic consistent.
- Input ghosting: call `preventDefault` on handled keys to avoid page scrolling.

## Assumptions
- Single desktop browser target (Chrome/Edge/Firefox). Mobile is out of scope for MVP.
- Local run (no server). If a dev server is desired later, use a simple static server.
- No persistence required (no save game); score only per run.

## Next Steps (If You Want Me To Implement)
- Scaffold the file structure and minimal Canvas loop.
- Implement the entities and systems per the 30‑minute plan.
- Provide a short README with run/play instructions.

If you prefer a different control or visual style, I can adjust the plan before coding.
