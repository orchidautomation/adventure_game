import { getSavedUsername, saveUsername, apiRegister, apiSubmitRun, apiLeaderboard } from './api_client.js';

let elements = {};
let currentUser = '';
let gameRef = null;
let modalLocks = 0;

export function initUI(game) {
  gameRef = game || null;
  elements.usernameModal = document.getElementById('username-modal');
  elements.usernameInput = document.getElementById('username-input');
  elements.usernameSave = document.getElementById('username-save');
  elements.userDisplay = document.getElementById('user-display');
  elements.lbBtn = document.getElementById('btn-leaderboard');
  elements.lbModal = document.getElementById('leaderboard-modal');
  elements.lbClose = document.getElementById('leaderboard-close');
  elements.lbTabs = document.getElementById('leaderboard-tabs');
  elements.lbBody = document.getElementById('leaderboard-body');

  currentUser = getSavedUsername();
  if (currentUser) {
    elements.userDisplay.textContent = `@${currentUser}`;
    hide(elements.usernameModal);
    // Ensure server knows this user; ignore errors silently
    (async () => { try { await apiRegister(currentUser); } catch {} })();
    if (game) game.usernameReady = true;
  } else {
    show(elements.usernameModal);
    if (game) game.usernameReady = false;
  }

  elements.usernameSave.addEventListener('click', async () => {
    const name = (elements.usernameInput.value || '').trim();
    try {
      await apiRegister(name);
      currentUser = name;
      saveUsername(name);
      elements.userDisplay.textContent = `@${currentUser}`;
      hide(elements.usernameModal);
      if (game) game.usernameReady = true;
    } catch (e) {
      alert('Could not save username. Use 2–16 characters: letters, numbers, underscore.');
    }
  });

  // Submit username on Enter key in input
  elements.usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      elements.usernameSave.click();
    }
  });

  elements.lbBtn.addEventListener('click', async () => {
    await openLeaderboard('high_score');
  });
  elements.lbClose.addEventListener('click', () => hide(elements.lbModal));
  // Click outside the card closes the leaderboard
  elements.lbModal.addEventListener('click', (e) => {
    if (e.target === elements.lbModal) hide(elements.lbModal);
  });
  // Esc closes leaderboard
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && elements.lbModal && elements.lbModal.style.display !== 'none') {
      hide(elements.lbModal);
    }
  });
  elements.lbTabs.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tab]');
    if (!t) return;
    await openLeaderboard(t.dataset.tab);
  });

  // Wire Game end callback
  if (game) {
    async function fetchTop5() {
      try {
        const { results } = await apiLeaderboard('high_score', 5);
        game.top5HS = results;
        game.top5Err = null;
      } catch (e) {
        game.top5HS = null;
        game.top5Err = 'Failed to fetch leaderboard';
      }
    }
    game.onRunEnd = async (summary) => {
      if (!currentUser) return; // cannot submit without user
      try { await apiSubmitRun({ username: currentUser, ...summary }); } catch {}
      await fetchTop5();
    };
    game.onWinEnd = async () => {
      await fetchTop5();
    };
  }
}

async function openLeaderboard(by) {
  setActiveTab(by);
  elements.lbBody.innerHTML = '<div class="lb-row">Loading...</div>';
  show(elements.lbModal);
  try {
    const { results } = await apiLeaderboard(by, 10);
    renderLeaderboard(results);
  } catch {
    elements.lbBody.innerHTML = '<div class="lb-row">Failed to load leaderboard</div>';
  }
}

function renderLeaderboard(rows) {
  elements.lbBody.innerHTML = rows.map((r, i) => `
    <div class="lb-row">
      <div class="lb-rank">${i + 1}</div>
      <div class="lb-name">@${escapeHtml(r.username)}</div>
      <div class="lb-score">HS: ${r.high_score}</div>
      <div class="lb-total">Total: ${r.total_score}</div>
      <div class="lb-level">Lvl: ${r.highest_level}</div>
      <div class="lb-runs">Runs: ${r.runs}</div>
    </div>
  `).join('');
}

function setActiveTab(by) {
  for (const el of elements.lbTabs.querySelectorAll('[data-tab]')) {
    el.classList.toggle('active', el.dataset.tab === by);
  }
}

function hide(el) {
  if (!el) return;
  markModalState(el, false);
  el.style.display = 'none';
}
function show(el) {
  if (!el) return;
  markModalState(el, true);
  el.style.display = 'flex';
}

function markModalState(el, show) {
  if (!el.classList || !el.classList.contains('modal')) return;
  const prev = el.dataset.modalShown === 'true';
  if (show && !prev) {
    el.dataset.modalShown = 'true';
    lockGame();
  } else if (!show && prev) {
    el.dataset.modalShown = 'false';
    unlockGame();
  }
}

function lockGame() {
  modalLocks += 1;
  if (gameRef && modalLocks === 1) {
    gameRef.setExternalPause(true);
  }
}

function unlockGame() {
  if (modalLocks === 0) return;
  modalLocks -= 1;
  if (gameRef && modalLocks === 0) {
    gameRef.setExternalPause(false);
  }
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
