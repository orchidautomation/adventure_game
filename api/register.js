import { getClient, ok, bad, cleanUsername, readJson } from './_db.js';

const hasDB = !!process.env.DATABASE_URL;
const mem = (() => {
  if (hasDB) return null;
  if (!globalThis.__MEMDB) {
    globalThis.__MEMDB = { users: new Map() };
  }
  return globalThis.__MEMDB;
})();

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return bad('Method not allowed', 405);
  const body = await readJson(req);
  if (!body) return bad('Invalid JSON');
  const username = cleanUsername(body.username);
  if (!username) return bad('Invalid username. Use 2-16 chars: letters, numbers, underscore.');

  if (!hasDB) {
    const u = mem.users.get(username) || {
      id: genId(), username, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      total_score: 0, high_score: 0, highest_level: 1, runs: 0, last_run_at: null
    };
    u.updated_at = new Date().toISOString();
    mem.users.set(username, u);
    const { id, total_score, high_score, highest_level, runs, last_run_at } = u;
    return ok({ user: { id, username, total_score, high_score, highest_level, runs, last_run_at } });
  } else {
    const sql = getClient();
    const rows = await sql(
      `INSERT INTO users (username)
       VALUES ($1)
       ON CONFLICT (username)
       DO UPDATE SET updated_at = NOW()
       RETURNING id, username, total_score, high_score, highest_level, runs, last_run_at`,
      [username]
    );
    return ok({ user: rows[0] });
  }
}

function genId() { return 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
