import { getClient, ok, bad, cleanUsername, readJson } from './_db.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return bad('Method not allowed', 405);
  const body = await readJson(req);
  if (!body) return bad('Invalid JSON');
  const username = cleanUsername(body.username);
  if (!username) return bad('Invalid username. Use 2-16 chars: letters, numbers, underscore.');

  const sql = getClient();
  // Upsert-like behavior
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

