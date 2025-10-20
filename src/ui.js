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
  // Start menu (touch/click friendly)
  elements.startMenu = document.getElementById('start-menu');
  elements.startEasy = document.getElementById('start-easy');
  elements.startHard = document.getElementById('start-hard');
  // Top controls
  elements.btnPause = document.getElementById('btn-pause');
  elements.btnRestart = document.getElementById('btn-restart');
  elements.btnSettings = document.getElementById('btn-settings');
  // State overlay
  elements.stateOverlay = document.getElementById('state-overlay');
  elements.stateTitle = document.getElementById('state-title');
  elements.stateSub = document.getElementById('state-sub');
  elements.overlayPrimary = document.getElementById('overlay-primary');
  elements.overlaySecondary = document.getElementById('overlay-secondary');
  // Settings modal
  elements.settingsModal = document.getElementById('settings-modal');
  elements.optLeftHanded = document.getElementById('opt-left-handed');
  elements.optButtonSize = document.getElementById('opt-button-size');
  elements.optDynamicStick = document.getElementById('opt-dynamic-stick');
  elements.settingsClose = document.getElementById('settings-close');
  elements.settingsSave = document.getElementById('settings-save');

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

  // Start menu button handlers
  if (elements.startEasy) {
    elements.startEasy.addEventListener('click', () => startWithDifficulty('easy'));
  }
  if (elements.startHard) {
    elements.startHard.addEventListener('click', () => startWithDifficulty('hard'));
  }

  // Pause/Restart/Settings buttons
  if (elements.btnPause) {
    elements.btnPause.addEventListener('click', () => {
      if (!gameRef) return;
      if (gameRef.state === 'running') gameRef.state = 'paused';
      else if (gameRef.state === 'paused') gameRef.state = 'running';
      updatePauseButton();
    });
  }
  if (elements.btnRestart) {
    elements.btnRestart.addEventListener('click', () => {
      if (!gameRef) return;
      gameRef.reset();
    });
  }
  if (elements.btnSettings) {
    elements.btnSettings.addEventListener('click', () => show(elements.settingsModal));
  }

  // Settings modal behavior
  const saved = loadControlPrefs();
  applyControlPrefs(saved);
  elements.optLeftHanded.checked = !!saved.leftHanded;
  elements.optButtonSize.value = saved.btnSize || 'm';
  elements.optDynamicStick.checked = !!saved.dynamicStick;
  elements.settingsClose.addEventListener('click', () => hide(elements.settingsModal));
  elements.settingsSave.addEventListener('click', () => {
    const prefs = {
      leftHanded: !!elements.optLeftHanded.checked,
      btnSize: elements.optButtonSize.value || 'm',
      dynamicStick: !!elements.optDynamicStick.checked,
    };
    saveControlPrefs(prefs);
    applyControlPrefs(prefs);
    // Notify main loop about control changes
    window.dispatchEvent(new CustomEvent('control-settings-change', { detail: prefs }));
    hide(elements.settingsModal);
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
      // Snapshot progress at each level win (died=false)
      try {
        if (currentUser) {
          const score = (game.totalScore || 0) + (game.levelScore || 0);
          const levelReached = game.level;
          const difficulty = game.difficulty;
          await apiSubmitRun({ username: currentUser, score, levelReached, difficulty, died: false });
        }
      } catch {}
      await fetchTop5();
    };
  }

  // Drive the visibility of the start menu overlay based on game state
  function tickStartMenu() {
    try {
      const shouldShow = !!(gameRef && gameRef.state === 'menu' && gameRef.usernameReady);
      if (elements.startMenu) {
        const currentlyShown = elements.startMenu.style.display !== 'none';
        if (shouldShow !== currentlyShown) {
          elements.startMenu.style.display = shouldShow ? 'flex' : 'none';
          elements.startMenu.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        }
      }
    } catch {}
    requestAnimationFrame(tickStartMenu);
  }
  requestAnimationFrame(tickStartMenu);

  // Drive state overlay (won/lost/paused)
  function tickStateOverlay() {
    if (!gameRef || !elements.stateOverlay) return requestAnimationFrame(tickStateOverlay);
    const s = gameRef.state;
    let showOverlay = false;
    if (s === 'won') {
      elements.stateTitle.textContent = `Level ${gameRef.level} Complete!`;
      elements.stateSub.textContent = `Level Pts: ${gameRef.levelScore}  Total: ${(gameRef.totalScore || 0) + (gameRef.levelScore || 0)}`;
      elements.overlayPrimary.textContent = 'Continue';
      elements.overlaySecondary.textContent = 'Restart';
      showOverlay = true;
    } else if (s === 'lost') {
      elements.stateTitle.textContent = 'Game Over';
      const final = (gameRef.totalScore || 0) + (gameRef.levelScore || 0);
      elements.stateSub.textContent = `Final Score: ${final}`;
      elements.overlayPrimary.textContent = 'Restart';
      elements.overlaySecondary.textContent = 'Menu';
      showOverlay = true;
    } else if (s === 'paused') {
      elements.stateTitle.textContent = 'Paused';
      elements.stateSub.textContent = 'Tap Resume to continue';
      elements.overlayPrimary.textContent = 'Resume';
      elements.overlaySecondary.textContent = 'Restart';
      showOverlay = true;
    }
    elements.stateOverlay.classList.toggle('active', !!showOverlay);
    updatePauseButton();
    requestAnimationFrame(tickStateOverlay);
  }
  if (elements.overlayPrimary) {
    elements.overlayPrimary.addEventListener('click', () => {
      if (!gameRef) return;
      if (gameRef.state === 'won') {
        gameRef.totalScore += gameRef.levelScore;
        gameRef.level += 1;
        gameRef.reset();
      } else if (gameRef.state === 'lost') {
        gameRef.level = 1;
        gameRef.totalScore = 0;
        gameRef.reset();
      } else if (gameRef.state === 'paused') {
        gameRef.state = 'running';
      }
    });
  }
  if (elements.overlaySecondary) {
    elements.overlaySecondary.addEventListener('click', () => {
      if (!gameRef) return;
      if (gameRef.state === 'won') {
        // Restart from level 1
        gameRef.level = 1;
        gameRef.totalScore = 0;
        gameRef.reset();
      } else if (gameRef.state === 'lost') {
        // Go to menu
        gameRef.level = 1;
        gameRef.totalScore = 0;
        gameRef.state = 'menu';
      } else if (gameRef.state === 'paused') {
        gameRef.reset();
      }
    });
  }
  requestAnimationFrame(tickStateOverlay);
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

function startWithDifficulty(mode) {
  if (!gameRef) return;
  if (!gameRef.usernameReady) {
    // Prompt for username first
    if (elements.usernameModal) {
      elements.usernameModal.style.display = 'flex';
      elements.usernameModal.dataset.modalShown = 'true';
      lockGame();
    }
    return;
  }
  try {
    if (mode !== 'easy' && mode !== 'hard') mode = 'easy';
    gameRef.setDifficulty(mode);
    try { localStorage.setItem('pref_difficulty', mode); } catch {}
    gameRef.level = 1;
    gameRef.totalScore = 0;
    gameRef.reset();
    if (elements.startMenu) {
      elements.startMenu.style.display = 'none';
      elements.startMenu.setAttribute('aria-hidden', 'true');
    }
  } catch {}
}

function updatePauseButton() {
  if (!elements.btnPause || !gameRef) return;
  elements.btnPause.textContent = gameRef.state === 'paused' ? 'Resume' : 'Pause';
}

function loadControlPrefs() {
  try {
    return JSON.parse(localStorage.getItem('control_prefs') || '{}');
  } catch {
    return {};
  }
}

function saveControlPrefs(p) {
  try { localStorage.setItem('control_prefs', JSON.stringify(p || {})); } catch {}
}

function applyControlPrefs(p) {
  document.body.classList.toggle('left-handed', !!p.leftHanded);
  document.body.classList.remove('btn-size-s', 'btn-size-l');
  if (p.btnSize === 's') document.body.classList.add('btn-size-s');
  if (p.btnSize === 'l') document.body.classList.add('btn-size-l');
}
