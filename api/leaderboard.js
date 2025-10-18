import { getClient, ok, bad } from './_db.js';

const hasDB = !!process.env.DATABASE_URL;
const mem = (() => {
  if (hasDB) return null;
  if (!globalThis.__MEMDB) {
    globalThis.__MEMDB = { users: new Map(), runs: [] };
  }
  return globalThis.__MEMDB;
})();

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') return bad('Method not allowed', 405);
  const url = new URL(req.url);
  const by = url.searchParams.get('by') === 'total_score' ? 'total_score' : 'high_score';
  const lim = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || 10)));

  if (!hasDB) {
    const arr = Array.from(mem.users.values()).map(u => ({
      username: u.username,
      high_score: u.high_score,
      total_score: u.total_score,
      highest_level: u.highest_level,
      runs: u.runs
    }));
    arr.sort((a, b) => (b[by] - a[by]) || a.username.localeCompare(b.username));
    return ok({ by, results: arr.slice(0, lim) });
  } else {
    const sql = getClient();
    const rows = await sql(
      `SELECT username, high_score, total_score, highest_level, runs
         FROM users
        ORDER BY ${by} DESC, username ASC
        LIMIT ${lim}`
    );
    return ok({ by, results: rows });
  }
}
