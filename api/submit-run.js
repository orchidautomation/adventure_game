import { getClient, ok, bad, cleanUsername, readJson } from './_db.js';

const hasDB = !!process.env.DATABASE_URL;
const mem = (() => {
  if (hasDB) return null;
  if (!globalThis.__MEMDB) {
    globalThis.__MEMDB = { users: new Map(), runs: [] };
  } else if (!globalThis.__MEMDB.runs) {
    globalThis.__MEMDB.runs = [];
  }
  return globalThis.__MEMDB;
})();

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

  if (!hasDB) {
    const u = mem.users.get(username);
    if (!u) return bad('User not found', 404);
    const run = { id: genId(), user_id: u.id, score, level_reached: levelReached, difficulty, died, created_at: new Date().toISOString() };
    mem.runs.push(run);
    u.total_score += score;
    u.high_score = Math.max(u.high_score, score);
    u.highest_level = Math.max(u.highest_level, levelReached);
    u.runs += 1;
    u.updated_at = new Date().toISOString();
    u.last_run_at = new Date().toISOString();
    const { id, total_score, high_score, highest_level, runs, last_run_at } = u;
    return ok({ user: { id, username, total_score, high_score, highest_level, runs, last_run_at } });
  } else {
    const sql = getClient();
    const userRows = await sql('SELECT id FROM users WHERE username = $1', [username]);
    if (userRows.length === 0) return bad('User not found', 404);
    const userId = userRows[0].id;
    await sql(
      `INSERT INTO runs (user_id, score, level_reached, difficulty, died)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, score, levelReached, difficulty, died]
    );
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
}

function genId() { return 'r_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
