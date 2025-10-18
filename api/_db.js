import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

export function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  return neon(url);
}

export function ok(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export function bad(message, status = 400) {
  return ok({ error: message }, status);
}

export function cleanUsername(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 16) return null;
  if (!/^\w+$/.test(trimmed)) return null; // alphanumeric + underscore
  return trimmed;
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

