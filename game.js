'use strict';

// =====================================================
// Series Dash — game loop
// =====================================================

const STARTING_LIVES = 3;

const SCORE_CORRECT = 100;
const SCORE_TIME_BONUS_PER_SEC = 10;
const SCORE_CONV_BONUS = 50;
const SCORE_CONV_PENALTY = 50;

const FEEDBACK_PAUSE_MS = 1300;

const MODES = {
  dash: {
    name: 'Dash',
    initialBudget: 15.0,
    decrement: 0.5,
    minBudget: 3.0,
    hiKey: 'series-dash:hi:dash',
  },
  stress: {
    name: 'Stress-Free',
    initialBudget: 60.0,
    decrement: 0.0,
    minBudget: 60.0,
    hiKey: 'series-dash:hi:stress',
  },
};

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const titleScreen   = $('title-screen');
const gameScreen    = $('game-screen');
const overScreen    = $('game-over-screen');
const startDashBtn  = $('start-dash');
const startStressBtn = $('start-stress');
const restartBtn    = $('restart-btn');
const menuBtn       = $('menu-btn');
const modePill      = $('mode-pill');
const finalModeEl   = $('final-mode');
const scoreEl       = $('score');
const streakEl      = $('streak');
const livesEl       = $('lives');
const budgetEl      = $('budget');
const hiScoreEl     = $('hi-score');
const timerBar      = $('timer-bar');
const timerText     = $('timer-text');
const seriesEl      = $('series');
const seriesFrame   = $('series-frame');
const grid          = $('tests-grid');
const feedbackEl    = $('feedback');
const finalScoreEl  = $('final-score');
const finalStreakEl = $('final-streak');
const finalBestEl   = $('final-best');

// ---------- State ----------
const state = {
  modeId: 'dash',
  mode: MODES.dash,
  score: 0,
  streak: 0,
  bestStreak: 0,
  lives: STARTING_LIVES,
  budget: MODES.dash.initialBudget,
  timeRemaining: MODES.dash.initialBudget,
  series: null,
  convGuess: null, // null | true | false
  roundActive: false,
  rafHandle: null,
  lastTs: 0,
};

// ---------- HUD ----------
function refreshHud() {
  scoreEl.textContent  = state.score;
  streakEl.textContent = state.streak;
  livesEl.textContent  = '●'.repeat(state.lives) + '○'.repeat(STARTING_LIVES - state.lives);
  budgetEl.textContent = state.budget.toFixed(1) + 's';
  hiScoreEl.textContent = getHi();
  modePill.textContent = state.mode.name;
  modePill.dataset.mode = state.modeId;
}

function getHi() {
  return Number(localStorage.getItem(state.mode.hiKey) || 0);
}
function setHi(v) {
  localStorage.setItem(state.mode.hiKey, String(v));
}

// ---------- Build buttons ----------
function buildGrid() {
  const tests = window.SeriesLibrary.TESTS;
  grid.innerHTML = '';

  // 10 test buttons in a 5x2 grid
  const testsWrap = document.createElement('div');
  testsWrap.className = 'tests-wrap';
  tests.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'test-btn';
    btn.dataset.testId = t.id;
    btn.innerHTML = `<span class="num">${(i + 1) % 10}</span><span class="lbl">${t.label}</span><span class="short">${t.short}</span>`;
    btn.addEventListener('click', () => onTestClick(t.id));
    testsWrap.appendChild(btn);
  });
  grid.appendChild(testsWrap);

  // Conv/Div toggle (optional bonus)
  const convWrap = document.createElement('div');
  convWrap.className = 'conv-wrap';
  convWrap.innerHTML = `
    <span class="conv-label">Bonus guess <small>(optional, ±${SCORE_CONV_BONUS} pts)</small></span>
    <button class="conv-btn" data-conv="true">Convergent <kbd>C</kbd></button>
    <button class="conv-btn" data-conv="false">Divergent <kbd>D</kbd></button>
  `;
  convWrap.querySelectorAll('.conv-btn').forEach(btn => {
    btn.addEventListener('click', () => onConvClick(btn.dataset.conv === 'true'));
  });
  grid.appendChild(convWrap);
}

// ---------- Round flow ----------
function startGame(modeId) {
  if (modeId && MODES[modeId]) {
    state.modeId = modeId;
    state.mode = MODES[modeId];
  }
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.lives = STARTING_LIVES;
  state.budget = state.mode.initialBudget;
  refreshHud();
  show(gameScreen); hide(titleScreen); hide(overScreen);
  nextRound();
}

function nextRound() {
  state.series = window.SeriesLibrary.pickSeries();
  state.convGuess = null;
  state.timeRemaining = state.budget;
  state.roundActive = true;
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  clearButtonStates();
  renderSeries();
  startTimer();
}

function renderSeries() {
  // MathJax expects \(...\) for inline; we want display math for big rendering.
  seriesEl.innerHTML = `\\(\\displaystyle ${state.series.latex}\\)`;
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([seriesEl]).catch(err => console.warn(err));
  }
}

function clearButtonStates() {
  document.querySelectorAll('.test-btn, .conv-btn').forEach(b => {
    b.classList.remove('correct', 'wrong', 'selected', 'disabled', 'auto-filled');
    b.disabled = false;
  });
}

// ---------- Timer ----------
function startTimer() {
  cancelAnimationFrame(state.rafHandle);
  state.lastTs = performance.now();
  tick();
}
function tick(ts) {
  if (!state.roundActive) return;
  const now = ts || performance.now();
  const dt = (now - state.lastTs) / 1000;
  state.lastTs = now;
  state.timeRemaining = Math.max(0, state.timeRemaining - dt);

  const pct = Math.max(0, state.timeRemaining / state.budget);
  timerBar.style.width = (pct * 100).toFixed(2) + '%';
  timerText.textContent = state.timeRemaining.toFixed(1);

  if (state.timeRemaining <= 0) {
    onTimeout();
    return;
  }
  state.rafHandle = requestAnimationFrame(tick);
}

// ---------- Click handlers ----------
function onTestClick(testId) {
  if (!state.roundActive) return;
  resolveRound(testId);
}

function onConvClick(guess) {
  if (!state.roundActive) return;
  state.convGuess = guess;
  document.querySelectorAll('.conv-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.conv === String(guess));
  });
}

function onTimeout() {
  state.roundActive = false;
  resolveRound(null); // null = no answer
}

function resolveRound(testId) {
  state.roundActive = false;
  cancelAnimationFrame(state.rafHandle);
  const correctTest = state.series.bestTest;
  const correct = testId === correctTest;

  // Auto-imply convergence guess from the test pick when none was given:
  // Divergence Test only concludes "diverges"; AST only concludes "converges".
  let autoFilled = false;
  if (state.convGuess === null && testId) {
    if (testId === 'divergence') { state.convGuess = false; autoFilled = true; }
    else if (testId === 'ast')   { state.convGuess = true;  autoFilled = true; }
  }

  // Highlight correct/wrong buttons (and reflect any auto-filled conv guess)
  document.querySelectorAll('.test-btn').forEach(btn => {
    if (btn.dataset.testId === correctTest) btn.classList.add('correct');
    if (testId && btn.dataset.testId === testId && !correct) btn.classList.add('wrong');
    btn.classList.add('disabled');
    btn.disabled = true;
  });
  document.querySelectorAll('.conv-btn').forEach(b => {
    if (autoFilled && b.dataset.conv === String(state.convGuess)) {
      b.classList.add('selected', 'auto-filled');
    }
    b.disabled = true;
  });

  let convDelta = 0;
  if (state.convGuess !== null) {
    if (state.convGuess === state.series.convergent) {
      convDelta = +SCORE_CONV_BONUS;
    } else {
      convDelta = -SCORE_CONV_PENALTY;
    }
  }

  let mainDelta = 0;
  if (correct) {
    mainDelta = SCORE_CORRECT + Math.floor(state.timeRemaining * SCORE_TIME_BONUS_PER_SEC);
    state.score += mainDelta + convDelta;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.budget = Math.max(state.mode.minBudget, state.budget - state.mode.decrement);
  } else {
    state.score = Math.max(0, state.score + convDelta);
    state.streak = 0;
    state.lives -= 1;
  }

  refreshHud();
  showFeedback(correct, testId, mainDelta, convDelta, autoFilled);

  setTimeout(() => {
    if (state.lives <= 0) gameOver();
    else nextRound();
  }, FEEDBACK_PAUSE_MS);
}

function showFeedback(correct, picked, mainDelta, convDelta, autoFilled) {
  const correctLabel = labelFor(state.series.bestTest);
  const tag = autoFilled ? ' (auto)' : '';
  const convStr = state.convGuess === null
    ? ''
    : (state.convGuess === state.series.convergent
        ? ` &nbsp; <span class="bonus good">+${SCORE_CONV_BONUS} bonus${tag} — series ${state.series.convergent ? 'converges' : 'diverges'}</span>`
        : ` &nbsp; <span class="bonus bad">-${SCORE_CONV_PENALTY}${tag} — actually ${state.series.convergent ? 'converges' : 'diverges'}</span>`);

  if (correct) {
    feedbackEl.className = 'feedback ok';
    feedbackEl.innerHTML = `✓ <b>${correctLabel}</b> &nbsp; <span class="delta">+${mainDelta}</span>${convStr}`;
  } else if (picked) {
    feedbackEl.className = 'feedback bad';
    feedbackEl.innerHTML = `✗ Best was <b>${correctLabel}</b>${convStr}`;
  } else {
    feedbackEl.className = 'feedback bad';
    feedbackEl.innerHTML = `⌛ Time! Best was <b>${correctLabel}</b>${convStr}`;
  }
}

function labelFor(id) {
  const t = window.SeriesLibrary.TESTS.find(t => t.id === id);
  return t ? t.label : id;
}

function gameOver() {
  hide(gameScreen);
  show(overScreen);
  finalModeEl.textContent   = state.mode.name;
  finalScoreEl.textContent  = state.score;
  finalStreakEl.textContent = state.bestStreak;
  if (state.score > getHi()) setHi(state.score);
  finalBestEl.textContent   = getHi();
}

function backToMenu() {
  cancelAnimationFrame(state.rafHandle);
  state.roundActive = false;
  hide(gameScreen);
  hide(overScreen);
  show(titleScreen);
}

// ---------- Utility ----------
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

// ---------- Keyboard ----------
window.addEventListener('keydown', e => {
  if (!titleScreen.classList.contains('hidden')) {
    if (e.key === 'Enter' || e.key === '1') startGame('dash');
    else if (e.key === '2' || e.key === 's' || e.key === 'S') startGame('stress');
    return;
  }
  if (!overScreen.classList.contains('hidden') && e.key === 'Enter') {
    startGame(state.modeId);
    return;
  }
  if (!state.roundActive) return;
  const k = e.key;
  if (/^[0-9]$/.test(k)) {
    const idx = k === '0' ? 9 : (Number(k) - 1);
    const tests = window.SeriesLibrary.TESTS;
    if (idx >= 0 && idx < tests.length) onTestClick(tests[idx].id);
    return;
  }
  if (k === 'c' || k === 'C') onConvClick(true);
  if (k === 'd' || k === 'D') onConvClick(false);
});

// ---------- Boot ----------
function boot() {
  buildGrid();
  refreshHud();
  startDashBtn.addEventListener('click', () => startGame('dash'));
  startStressBtn.addEventListener('click', () => startGame('stress'));
  restartBtn.addEventListener('click', () => startGame(state.modeId));
  menuBtn.addEventListener('click', backToMenu);
}
boot();
