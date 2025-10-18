import { getClient, ok, bad } from './_db.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') return bad('Method not allowed', 405);
  const url = new URL(req.url);
  const by = url.searchParams.get('by') === 'total_score' ? 'total_score' : 'high_score';
  const lim = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || 10)));

  if (!process.env.DATABASE_URL) return bad('Database not configured', 500);
  const sql = getClient();
  const rows = await sql(
    `SELECT username, high_score, total_score, highest_level, runs
       FROM users
      ORDER BY ${by} DESC, username ASC
      LIMIT ${lim}`
  );
  return ok({ by, results: rows });
}
