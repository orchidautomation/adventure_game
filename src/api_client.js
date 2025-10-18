const LS_USER_KEY = 'udd_username';

export function getSavedUsername() {
  try { return localStorage.getItem(LS_USER_KEY) || ''; } catch { return ''; }
}

export function saveUsername(name) {
  try { localStorage.setItem(LS_USER_KEY, name); } catch {}
}

export async function apiRegister(username) {
  const res = await fetch('/api/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }), cache: 'no-store'
  });
  if (!res.ok) throw new Error('Register failed');
  return res.json();
}

export async function apiSubmitRun({ username, score, levelReached, difficulty, died }) {
  const res = await fetch('/api/submit-run', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, score, levelReached, difficulty, died }), cache: 'no-store'
  });
  if (!res.ok) throw new Error('Submit failed');
  return res.json();
}

export async function apiLeaderboard(by = 'high_score', limit = 10) {
  const res = await fetch(`/api/leaderboard?by=${encodeURIComponent(by)}&limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Leaderboard failed');
  return res.json();
}
