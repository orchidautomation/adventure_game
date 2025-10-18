<!-- moved to docs/ for OSS repo hygiene -->
# Leaderboard MVP – Design and Implementation Plan

## Goal
Add a global leaderboard so players can set a username, have their runs tracked (points, highest level, totals), and see top scores. Keep it reliable, secure, and simple to deploy on Vercel with a Neon (Postgres) database.

## Architecture (Vercel + Neon)
- Frontend: existing Canvas game (static), plus a small DOM overlay for username entry and viewing leaderboard.
- Backend: Vercel Serverless Functions under `api/` (Node.js runtime). Endpoints use Postgres.
- Database: Neon Postgres (Vercel Postgres or direct Neon URL) with a pooled, serverless-friendly driver.
- Auth model: lightweight “named user” (username only) with no password (MVP). Username uniqueness enforced.

## Data Model
- `users`
  - `id` UUID (PK)
  - `username` TEXT UNIQUE NOT NULL
  - `created_at` TIMESTAMPTZ DEFAULT NOW()
  - `updated_at` TIMESTAMPTZ DEFAULT NOW()
  - `total_score` INT DEFAULT 0
  - `high_score` INT DEFAULT 0           // best single-run score
  - `highest_level` INT DEFAULT 1        // best level reached ever
  - `runs` INT DEFAULT 0
  - `last_run_at` TIMESTAMPTZ
- `runs`
  - `id` UUID (PK)
  - `user_id` UUID REFERENCES users(id)
  - `score` INT NOT NULL
  - `level_reached` INT NOT NULL
  - `difficulty` TEXT CHECK (difficulty IN ('easy','hard'))
  - `died` BOOLEAN NOT NULL              // true = game over; false = finished level set
  - `created_at` TIMESTAMPTZ DEFAULT NOW()

SQL (one-time migration):
```
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid() on Neon

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_score INT NOT NULL DEFAULT 0,
  high_score INT NOT NULL DEFAULT 0,
  highest_level INT NOT NULL DEFAULT 1,
  runs INT NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  level_reached INT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','hard')),
  died BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runs_user_created ON runs(user_id, created_at DESC);
```

## API Endpoints
- `POST /api/register` – Create or fetch user by username.
  - Body: `{ username }`
  - Returns: `{ user: { id, username, high_score, highest_level, total_score, runs } }`
- `POST /api/submit-run` – Record a completed run and update aggregates.
  - Body: `{ username, score, levelReached, difficulty, died }`
  - Txn logic:
    - Insert into `runs`.
    - Update `users`:
      - `total_score += score`
      - `high_score = GREATEST(high_score, score)`
      - `highest_level = GREATEST(highest_level, levelReached)`
      - `runs += 1`, `last_run_at = NOW()`
  - Returns: updated user summary and this run id.
- `GET /api/leaderboard?by=high_score|total_score&limit=10` – Top users.
  - Returns: `[{ username, high_score, total_score, highest_level, runs }]`
- `GET /api/user/:username` – User profile + recent runs (optional for MVP, nice to have).

Driver choice
- Use `@neondatabase/serverless` (fetch-based Postgres driver) for low-latency serverless use.
- Alternative: `@vercel/postgres` is also fine; both need a `DATABASE_URL`-style env.

## Client UX Flow
- On first load (menu state), show a small DOM overlay asking for username (prefill from localStorage if available). Buttons: Save + Continue.
- On save: call `POST /api/register`. Cache `{ username, userId }` in localStorage.
- During play: nothing changes.
- On win/loss overlay:
  - Build run payload from in-game results: `{ username, score: totalScore + levelScore? or levelScore? See below, levelReached, difficulty, died }`.
  - MVP: submit each run at “Game Over” with final score for that run: `final = totalScore + levelScore`.
  - On `won` advancing levels: only submit on loss/end-of-session to reflect a single overall run’s score; otherwise we’ll fragment into multiple runs. Option B (later): submit per-level.
- Leaderboard button: open overlay showing top 10 (tabs: High Score, Total Score). Refresh every 10–30s or on open.

Scoring semantics (MVP)
- A “run” = one play session from difficulty selection until death (Game Over). On Game Over, submit `score = totalScore + levelScore` and `levelReached = current level`.
- This aligns with “final score” shown to the player.

## Security & Validation
- Input validation: JSON schema-like checks server-side (length limits on username, scores numeric and sane, difficulty in {easy, hard}).
- Parameterized queries exclusively.
- No PII; usernames only. Enforce 2–16 chars, alphanumeric + underscore.
- Basic anti-abuse: rate-limit by IP (future). For MVP, insert minimal server-side checks (score bounds vs. max plausible per level to flag obvious cheating). Not blocking yet.

## Deployment
- Add `package.json` with:
  - `type: module`
  - deps: `@neondatabase/serverless` (or `@vercel/postgres`)
- Add serverless functions in `api/`:
  - `api/register.js`
  - `api/submit-run.js`
  - `api/leaderboard.js`
- Env vars on Vercel Project:
  - `DATABASE_URL` (Neon connection string)
- One-time SQL migration: run via Neon SQL editor or `psql`.
- CORS: not needed (same origin). All requests from the same Vercel domain.

## Implementation Steps
1) Schema: add SQL file `db/schema.sql`; document one-time setup.
2) Backend: implement `api/register`, `api/submit-run`, `api/leaderboard` using Neon.
3) Client: add small DOM overlay for username (save to localStorage + POST /register).
4) Client: on Game Over, POST /submit-run with final score + level.
5) Client: add Leaderboard overlay (fetch /leaderboard?by=high_score and ?by=total_score).
6) QA: manual tests (create users, submit runs, verify leaderboards update, edge cases).
7) Deploy: set env on Vercel, redeploy; verify from production URL.

## Acceptance Criteria
- Can set username and persist it across sessions (localStorage) and server recognizes it.
- Completing a run (Game Over) submits score + level + difficulty and updates aggregates.
- Leaderboard (high score and total score) shows the correct top 10 with usernames and stats.
- Highest level tracked per user.
- No unhandled server errors; all SQL paramized.

## Risks & Mitigations
- Connection limits: Neon serverless driver mitigates pool limits.
- Tampering: MVP trusts client scores; future improvement—signed payloads, server-side replay, or heuristic validation.
- Username collisions: handled with unique constraint; API returns existing user if taken.
- Cold starts: acceptable for MVP.

## Nice-to-Have (Later)
- OAuth login for identity
- Anti-cheat heuristics and signing
- Daily/weekly leaderboards
- Public user profile with recent runs
- Edge leaderboard for very low latency

---
If you approve this plan, I’ll scaffold the API functions, add `package.json`, the SQL schema file, and the username/leaderboard UI, then wire the game to submit on Game Over.
