import { getClient, ok, bad, cleanUsername, readJson } from './_db.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return bad('Method not allowed', 405);
  const body = await readJson(req);
  if (!body) return bad('Invalid JSON');

  const username = cleanUsername(body.username);
  const score = Number(body.score);
  const levelReached = Number(body.levelReached);
  const difficulty = body.difficulty === 'hard' ? 'hard' : 'easy';
  const died = !!body.died;

  if (!username) return bad('Invalid username');
  if (!Number.isFinite(score) || score < 0 || score > 10000000) return bad('Invalid score');
  if (!Number.isInteger(levelReached) || levelReached < 1 || levelReached > 9999) return bad('Invalid level');

  const sql = getClient();

  // Ensure user exists
  const userRows = await sql('SELECT id FROM users WHERE username = $1', [username]);
  if (userRows.length === 0) return bad('User not found', 404);
  const userId = userRows[0].id;

  // Insert run
  await sql(
    `INSERT INTO runs (user_id, score, level_reached, difficulty, died)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, score, levelReached, difficulty, died]
  );

  // Update user aggregates
  const out = await sql(
    `UPDATE users
       SET total_score = total_score + $2,
           high_score = GREATEST(high_score, $2),
           highest_level = GREATEST(highest_level, $3),
           runs = runs + 1,
           updated_at = NOW(),
           last_run_at = NOW()
     WHERE id = $1
     RETURNING id, username, total_score, high_score, highest_level, runs, last_run_at`,
    [userId, score, levelReached]
  );

  return ok({ user: out[0] });
}

