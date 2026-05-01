'use strict';

// =====================================================
// Series Dash — game loop
// =====================================================

const STARTING_LIVES = 3;
const FEEDBACK_PAUSE_MS = 1300;

const CONV_BUDGET = 10.0;       // seconds, non-decaying, never decreases
const CONV_RIGHT_MULT = 1.3;
const CONV_WRONG_MULT = 0.7;
const CONV_SKIP_MULT  = 1.0;

const MODES = {
  dash: {
    name: 'Dash',
    initialBudget: 15.0,
    decrement: 0.3,
    minBudget: 4.5,
    scored: true,
    hiKey: 'series-dash:hi:dash',
  },
  stress: {
    name: 'Stress-Free',
    initialBudget: 60.0,
    decrement: 0.0,
    minBudget: 60.0,
    scored: false,
    hiKey: null,
  },
};

const NAME_KEY = 'series-dash:player-name';
const SCORING_VERSION = 'v2-survival-2026-05';
const SCORING_VERSION_KEY = 'series-dash:scoring-version';

// Reset Dash high score when the scoring formula changes, so old scores
// don't poison the new leaderboard.
(function migrateScoring() {
  const stored = localStorage.getItem(SCORING_VERSION_KEY);
  if (stored !== SCORING_VERSION) {
    localStorage.removeItem('series-dash:hi:dash');
    localStorage.setItem(SCORING_VERSION_KEY, SCORING_VERSION);
  }
})();

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const welcomeScreen   = $('welcome-screen');
const modeScreen      = $('mode-screen');
const gameScreen      = $('game-screen');
const overScreen      = $('game-over-screen');
const welcomeForm     = $('welcome-form');
const playerNameInput = $('player-name');
const modeGreeting    = $('mode-greeting');
const startDashBtn    = $('start-dash');
const startStressBtn  = $('start-stress');
const restartBtn      = $('restart-btn');
const menuBtn         = $('menu-btn');
const modePill        = $('mode-pill');
const playerPill      = $('player-pill');
const finalModeEl     = $('final-mode');
const finalNameEl     = $('final-name');
const finalNameLine   = $('final-name-line');
const finalScoreEl    = $('final-score');
const finalScoreLine  = $('final-score-line');
const finalStreakEl   = $('final-streak');
const finalBestEl     = $('final-best');
const finalBestLine   = $('final-best-line');
const hudScore        = $('hud-score');
const hudBest         = $('hud-best');
const scoreEl         = $('score');
const streakEl        = $('streak');
const livesEl         = $('lives');
const budgetEl        = $('budget');
const hiScoreEl       = $('hi-score');
const timerBar        = $('timer-bar');
const timerText       = $('timer-text');
const seriesEl        = $('series');
const grid            = $('tests-grid');
const feedbackEl      = $('feedback');

const convOverlay     = $('conv-overlay');
const convSeriesEl    = $('conv-series');
const convTimerBar    = $('conv-timer-bar');
const convTimerText   = $('conv-timer-text');
const convYesBtn      = $('conv-yes');
const convNoBtn       = $('conv-no');
const convSkipBtn     = $('conv-skip');
const convHint        = $('conv-hint');

// ---------- State ----------
const state = {
  modeId: 'dash',
  mode: MODES.dash,
  playerName: '',
  score: 0,
  streak: 0,
  bestStreak: 0,
  lives: STARTING_LIVES,
  budget: MODES.dash.initialBudget,
  timeRemaining: MODES.dash.initialBudget,
  series: null,
  phase: 'idle',     // 'idle' | 'testing' | 'convDiv' | 'feedback'
  testPicked: null,
  testCorrect: null,
  baseScore: 0,      // pre-multiplier
  rafHandle: null,
  lastTs: 0,
  // conv overlay
  convRafHandle: null,
  convTimeRemaining: CONV_BUDGET,
  convLastTs: 0,
  // dedup + review
  seenLatex: new Set(),       // normalized LaTeX of every series shown this session (across sources)
  history: [],                // [{ series, testPicked, testCorrect, convGuess, convCorrect, baseScore, finalScore }]
};

// ---------- HUD ----------
function refreshHud() {
  const scored = state.mode.scored;
  hudScore.style.display = scored ? '' : 'none';
  hudBest.style.display  = scored ? '' : 'none';

  if (scored) {
    scoreEl.textContent = state.score;
    hiScoreEl.textContent = getHi();
  }
  streakEl.textContent = state.streak;
  livesEl.textContent  = '●'.repeat(state.lives) + '○'.repeat(STARTING_LIVES - state.lives);
  budgetEl.textContent = state.budget.toFixed(1) + 's';
  modePill.textContent = state.mode.name;
  modePill.dataset.mode = state.modeId;
  playerPill.textContent = state.playerName ? state.playerName : '';
  playerPill.style.display = state.playerName ? '' : 'none';
}

function getHi() {
  if (!state.mode.hiKey) return 0;
  return Number(localStorage.getItem(state.mode.hiKey) || 0);
}
function setHi(v) {
  if (!state.mode.hiKey) return;
  localStorage.setItem(state.mode.hiKey, String(v));
}

// ---------- Build buttons ----------
function buildGrid() {
  const tests = window.SeriesLibrary.TESTS;
  grid.innerHTML = '';

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
  state.seenLatex = new Set();
  state.history = [];
  refreshHud();
  hide(welcomeScreen); hide(modeScreen); hide(overScreen);
  show(gameScreen);
  // Reset the visible game UI so the player doesn't see leftovers from a prior run.
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  seriesEl.innerHTML = '';
  clearButtonStates();
  // Disable test buttons during countdown so a stray click can't fire.
  document.querySelectorAll('.test-btn').forEach(b => { b.disabled = true; });
  showReadyCountdown(() => {
    document.querySelectorAll('.test-btn').forEach(b => { b.disabled = false; });
    nextRound();
  });
}

function showReadyCountdown(onDone) {
  const overlay = $('ready-overlay');
  const numEl = $('ready-num');
  const labelEl = $('ready-label');
  show(overlay);
  numEl.classList.remove('go');
  labelEl.textContent = 'Get ready';
  let n = 3;
  numEl.textContent = String(n);
  // restart the CSS animation by toggling
  numEl.style.animation = 'none';
  void numEl.offsetWidth;
  numEl.style.animation = '';

  const step = () => {
    n -= 1;
    if (n > 0) {
      numEl.textContent = String(n);
      numEl.style.animation = 'none';
      void numEl.offsetWidth;
      numEl.style.animation = '';
      setTimeout(step, 1000);
    } else {
      // "GO!"
      labelEl.textContent = '';
      numEl.classList.add('go');
      numEl.textContent = 'GO!';
      numEl.style.animation = 'none';
      void numEl.offsetWidth;
      numEl.style.animation = '';
      setTimeout(() => {
        hide(overlay);
        onDone();
      }, 500);
    }
  };
  setTimeout(step, 1000);
}

function nextRound() {
  state.series = window.SeriesLibrary.pickSeries({ excludeLatex: state.seenLatex });
  if (state.series) {
    state.seenLatex.add(window.SeriesLibrary.normalizeLatex(state.series.latex));
  }
  state.timeRemaining = state.budget;
  state.roundBudget = state.budget;   // budget for THIS round; decrements after correct
  state.phase = 'testing';
  state.testPicked = null;
  state.testCorrect = null;
  state.baseScore = 0;
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  clearButtonStates();
  renderSeries();
  startTimer();
}

function renderSeries() {
  seriesEl.innerHTML = `\\(\\displaystyle ${state.series.latex}\\)`;
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([seriesEl]).catch(err => console.warn(err));
  }
}

function clearButtonStates() {
  document.querySelectorAll('.test-btn').forEach(b => {
    b.classList.remove('correct', 'wrong', 'disabled');
    b.disabled = false;
  });
}

// ---------- Main timer ----------
function startTimer() {
  cancelAnimationFrame(state.rafHandle);
  state.lastTs = performance.now();
  tick();
}
function tick(ts) {
  if (state.phase !== 'testing') return;
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

// ---------- Test pick ----------
function onTestClick(testId) {
  if (state.phase !== 'testing') return;
  resolveTest(testId);
}

function onTimeout() {
  if (state.phase !== 'testing') return;
  resolveTest(null); // null = no answer
}

function acceptedTestsFor(series) {
  return (series.accepted && series.accepted.length) ? series.accepted : [series.bestTest];
}

function resolveTest(testId) {
  state.phase = 'feedback';
  cancelAnimationFrame(state.rafHandle);
  const correctTest = state.series.bestTest;
  const accepted = acceptedTestsFor(state.series);
  const correct = !!testId && accepted.includes(testId);
  state.testPicked = testId;
  state.testCorrect = correct;

  document.querySelectorAll('.test-btn').forEach(btn => {
    if (accepted.includes(btn.dataset.testId)) btn.classList.add('correct');
    if (testId && btn.dataset.testId === testId && !correct) btn.classList.add('wrong');
    btn.classList.add('disabled');
    btn.disabled = true;
  });

  if (!correct) {
    // Wrong test or timeout: lose life, show feedback, advance.
    state.streak = 0;
    state.lives -= 1;
    recordRound({ testCorrect: false });
    refreshHud();
    showTestFeedback(false, testId);
    setTimeout(() => {
      if (state.lives <= 0) gameOver();
      else nextRound();
    }, FEEDBACK_PAUSE_MS);
    return;
  }

  // Correct test. Compute base score (Dash only) BEFORE decrementing the budget.
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.baseScore = state.mode.scored ? computeBaseScore() : 0;
  state.budget = Math.max(state.mode.minBudget, state.budget - state.mode.decrement);

  // If the PLAYER picked divergence or AST, no conv-bonus phase needed
  // (those tests carry their own convergence verdict). Note this is gated on
  // testId — what the player picked — not on bestTest. Picking Ratio on a
  // divergent series, for example, still warrants the bonus prompt.
  if (testId === 'divergence' || testId === 'ast') {
    if (state.mode.scored) state.score += state.baseScore;
    recordRound({ testCorrect: true, finalScore: state.baseScore });
    refreshHud();
    showTestFeedback(true, testId, /*convPhase=*/false, /*multiplier=*/null);
    setTimeout(nextRound, FEEDBACK_PAUSE_MS);
    return;
  }

  // Otherwise: enter convergence-guess bonus phase.
  enterConvPhase();
}

function recordRound(extras) {
  state.history.push(Object.assign({
    series: state.series,
    testPicked: state.testPicked,
    testCorrect: false,
    convGuess: null,
    convStatus: null,
    baseScore: state.baseScore || 0,
    finalScore: 0
  }, extras || {}));
}

function computeBaseScore() {
  // base = 100 × (1 − t_remain/round_budget) × (15 / round_budget)
  //   The first factor is the original "slow answer reward" — using more of your budget pays more.
  //   The second factor was originally (round_budget/15), which shrank scores in later rounds.
  //   Inverting it to (15/round_budget) makes late rounds pay MORE — survival is the reward.
  const rb = state.roundBudget;
  if (rb <= 0) return 0;
  const usedFrac = 1 - (state.timeRemaining / rb);
  const difficultyMult = 15 / rb;
  return Math.round(100 * usedFrac * difficultyMult);
}

// ---------- Convergence-guess bonus ----------
function enterConvPhase() {
  state.phase = 'convDiv';
  state.convTimeRemaining = CONV_BUDGET;

  // Render
  convSeriesEl.innerHTML = `\\(\\displaystyle ${state.series.latex}\\)`;
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([convSeriesEl]).catch(()=>{});
  }
  convYesBtn.classList.remove('correct', 'wrong', 'disabled');
  convNoBtn.classList.remove('correct', 'wrong', 'disabled');
  convSkipBtn.classList.remove('disabled');
  [convYesBtn, convNoBtn, convSkipBtn].forEach(b => b.disabled = false);

  convHint.style.display = state.mode.scored ? '' : 'none';

  show(convOverlay);
  startConvTimer();
}

function startConvTimer() {
  cancelAnimationFrame(state.convRafHandle);
  state.convLastTs = performance.now();
  convTick();
}
function convTick(ts) {
  if (state.phase !== 'convDiv') return;
  const now = ts || performance.now();
  const dt = (now - state.convLastTs) / 1000;
  state.convLastTs = now;
  state.convTimeRemaining = Math.max(0, state.convTimeRemaining - dt);
  const pct = state.convTimeRemaining / CONV_BUDGET;
  convTimerBar.style.width = (pct * 100).toFixed(2) + '%';
  convTimerText.textContent = state.convTimeRemaining.toFixed(1);

  if (state.convTimeRemaining <= 0) {
    resolveConv('skip');
    return;
  }
  state.convRafHandle = requestAnimationFrame(convTick);
}

function onConvPick(guess) {
  if (state.phase !== 'convDiv') return;
  resolveConv(guess);
}

function resolveConv(guess) {
  if (state.phase !== 'convDiv') return;
  state.phase = 'feedback';
  cancelAnimationFrame(state.convRafHandle);

  let multiplier = CONV_SKIP_MULT;
  let convStatus = 'skip'; // 'right' | 'wrong' | 'skip'

  if (guess === 'true' || guess === 'false') {
    const guessBool = (guess === 'true');
    if (guessBool === state.series.convergent) {
      multiplier = CONV_RIGHT_MULT; convStatus = 'right';
    } else {
      multiplier = CONV_WRONG_MULT; convStatus = 'wrong';
    }
    // Highlight the picked button
    const picked = guessBool ? convYesBtn : convNoBtn;
    const correctBtn = state.series.convergent ? convYesBtn : convNoBtn;
    correctBtn.classList.add('correct');
    if (picked !== correctBtn) picked.classList.add('wrong');
  }
  // disable buttons
  [convYesBtn, convNoBtn, convSkipBtn].forEach(b => { b.disabled = true; b.classList.add('disabled'); });

  // Apply multiplier (Dash only)
  let finalScore = state.baseScore;
  if (state.mode.scored) {
    finalScore = Math.round(state.baseScore * multiplier);
    state.score += finalScore;
  }

  recordRound({
    testCorrect: true,
    convGuess: guess,
    convStatus: convStatus,
    finalScore: finalScore
  });

  refreshHud();

  // Pause briefly to let player read the result, then dismiss overlay & feedback below.
  setTimeout(() => {
    hide(convOverlay);
    showTestFeedback(true, state.testPicked, /*convPhase=*/true,
                     /*multiplier=*/multiplier, /*convStatus=*/convStatus, finalScore);
    setTimeout(nextRound, FEEDBACK_PAUSE_MS);
  }, 800);
}

// ---------- Feedback ----------
function showTestFeedback(correct, picked, convPhase, multiplier, convStatus, finalScore) {
  const bestLabel = labelFor(state.series.bestTest);
  const isAlternate = correct && picked && picked !== state.series.bestTest;
  // When the player picked an accepted-but-not-best test, show both their pick and the canonical.
  const correctLabel = isAlternate
    ? `${labelFor(picked)} <span class="alt-note">(best: ${bestLabel})</span>`
    : `${bestLabel}`;

  if (!correct) {
    feedbackEl.className = 'feedback bad';
    if (picked) feedbackEl.innerHTML = `✗ Best was <b>${bestLabel}</b>`;
    else        feedbackEl.innerHTML = `⌛ Time! Best was <b>${bestLabel}</b>`;
    return;
  }

  // Correct test branch
  feedbackEl.className = 'feedback ok';
  if (!state.mode.scored) {
    let convText = '';
    if (convPhase && convStatus === 'right') convText = ' &nbsp; <span class="bonus good">conv. guess: correct</span>';
    if (convPhase && convStatus === 'wrong') convText = ' &nbsp; <span class="bonus bad">conv. guess: wrong (was '
      + (state.series.convergent ? 'convergent' : 'divergent') + ')</span>';
    feedbackEl.innerHTML = `✓ <b>${correctLabel}</b>${convText}`;
    return;
  }

  // Dash mode with score
  if (!convPhase) {
    feedbackEl.innerHTML = `✓ <b>${correctLabel}</b> &nbsp; <span class="delta">+${state.baseScore}</span>`;
  } else {
    let multStr = '';
    if (convStatus === 'right') multStr = ` &nbsp; <span class="bonus good">×${CONV_RIGHT_MULT} conv. bonus</span>`;
    else if (convStatus === 'wrong') multStr = ` &nbsp; <span class="bonus bad">×${CONV_WRONG_MULT} (was ${state.series.convergent ? 'convergent' : 'divergent'})</span>`;
    else multStr = ` &nbsp; <span class="bonus">no bonus</span>`;
    feedbackEl.innerHTML = `✓ <b>${correctLabel}</b> &nbsp; <span class="delta">+${finalScore}</span>${multStr}`;
  }
}

function labelFor(id) {
  const t = window.SeriesLibrary.TESTS.find(t => t.id === id);
  return t ? t.label : id;
}

// ---------- Game over ----------
function gameOver() {
  hide(gameScreen);
  show(overScreen);
  finalNameEl.textContent  = state.playerName || 'anonymous';
  finalNameLine.style.display = state.playerName ? '' : 'none';
  finalModeEl.textContent  = state.mode.name;
  if (state.mode.scored) {
    finalScoreLine.style.display = '';
    finalBestLine.style.display = '';
    finalScoreEl.textContent = state.score;
    if (state.score > getHi()) setHi(state.score);
    finalBestEl.textContent  = getHi();
  } else {
    finalScoreLine.style.display = 'none';
    finalBestLine.style.display = 'none';
  }
  finalStreakEl.textContent = state.bestStreak;
  renderReview();
}

function renderReview() {
  const list = $('review-list');
  if (!list) return;
  list.innerHTML = '';
  const hist = state.history;
  if (!hist.length) {
    list.innerHTML = '<div style="text-align:center;color:var(--ink-dim);padding:18px;">No rounds played.</div>';
    return;
  }
  hist.forEach((h, i) => {
    const item = document.createElement('div');
    item.className = 'review-item ' + (h.testCorrect ? 'correct' : 'wrong');

    const series = h.series;
    const correctTestLabel = labelFor(series.bestTest);
    const accepted = acceptedTestsFor(series);
    const altLabels = accepted.filter(id => id !== series.bestTest).map(labelFor);
    const acceptedNote = altLabels.length ? ` <span class="alt-note">(also: ${altLabels.join(', ')})</span>` : '';
    const pickedLabel = h.testPicked ? labelFor(h.testPicked) : null;
    const convergentText = series.convergent ? 'convergent' : 'divergent';

    let pickHtml;
    if (!h.testPicked) {
      pickHtml = `<span class="pick-tag miss">timeout</span>`;
    } else if (h.testCorrect) {
      pickHtml = `<span class="pick-tag ok">${pickedLabel} ✓</span>`;
    } else {
      pickHtml = `<span class="pick-tag err">${pickedLabel} ✗</span>`;
    }

    let convRow = '';
    if (h.testCorrect && h.convGuess !== null && h.convGuess !== undefined) {
      // conv phase happened
      let tag;
      if (h.convStatus === 'right') tag = `<span class="conv-tag right">${h.convGuess === 'true' ? 'convergent' : 'divergent'} ✓</span>`;
      else if (h.convStatus === 'wrong') tag = `<span class="conv-tag bad">${h.convGuess === 'true' ? 'convergent' : 'divergent'} ✗</span>`;
      else tag = `<span class="conv-tag skip">skipped</span>`;
      convRow = `<div class="review-row"><span class="lbl">Conv guess</span> ${tag}</div>`;
    }

    let scoreHtml = '';
    if (state.mode.scored && h.testCorrect) {
      scoreHtml = `<div class="review-row"><span class="lbl">Score</span> +${h.finalScore || h.baseScore || 0}</div>`;
    }

    item.innerHTML = `
      <div class="review-series" id="rev-${i}">\\(\\displaystyle ${series.latex}\\)</div>
      <div class="review-row"><span class="lbl">Your pick</span> ${pickHtml}</div>
      <div class="review-row"><span class="lbl">Best test</span> <span class="ans-tag">${correctTestLabel}</span>${acceptedNote} · <span class="ans-tag">${convergentText}</span></div>
      ${convRow}
      ${scoreHtml}
    `;
    list.appendChild(item);
  });

  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([list]).catch(()=>{});
  }
}

function backToMenu() {
  cancelAnimationFrame(state.rafHandle);
  cancelAnimationFrame(state.convRafHandle);
  state.phase = 'idle';
  hide(gameScreen);
  hide(overScreen);
  hide(convOverlay);
  show(modeScreen);
  updateGreeting();
}

// ---------- Welcome ----------
function loadName() {
  state.playerName = (localStorage.getItem(NAME_KEY) || '').trim();
  playerNameInput.value = state.playerName;
}
function saveName(n) {
  state.playerName = (n || '').trim();
  if (state.playerName) localStorage.setItem(NAME_KEY, state.playerName);
  else localStorage.removeItem(NAME_KEY);
}
function updateGreeting() {
  if (state.playerName) modeGreeting.textContent = `Welcome, ${state.playerName}. Pick a mode.`;
  else                  modeGreeting.textContent = `Pick a mode.`;
}

welcomeForm.addEventListener('submit', e => {
  e.preventDefault();
  saveName(playerNameInput.value);
  hide(welcomeScreen);
  show(modeScreen);
  updateGreeting();
});

// ---------- Utility ----------
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

// ---------- Keyboard ----------
window.addEventListener('keydown', e => {
  // Welcome screen
  if (!welcomeScreen.classList.contains('hidden')) {
    if (e.key === 'Enter') {
      // form submit handles it
    }
    return;
  }
  // Mode select
  if (!modeScreen.classList.contains('hidden')) {
    if (e.key === '1' || e.key === 'd' || e.key === 'D') startGame('dash');
    else if (e.key === '2' || e.key === 's' || e.key === 'S') startGame('stress');
    return;
  }
  // Game over
  if (!overScreen.classList.contains('hidden')) {
    if (e.key === 'Enter') startGame(state.modeId);
    return;
  }
  // Conv overlay phase
  if (state.phase === 'convDiv') {
    if (e.key === 'c' || e.key === 'C') onConvPick('true');
    else if (e.key === 'd' || e.key === 'D') onConvPick('false');
    else if (e.key === 'Escape') onConvPick('skip');
    return;
  }
  // Test phase
  if (state.phase !== 'testing') return;
  const k = e.key;
  if (/^[0-9]$/.test(k)) {
    const idx = k === '0' ? 9 : (Number(k) - 1);
    const tests = window.SeriesLibrary.TESTS;
    if (idx >= 0 && idx < tests.length) onTestClick(tests[idx].id);
  }
});

// ---------- Wiring ----------
function boot() {
  buildGrid();
  loadName();
  refreshHud();
  startDashBtn.addEventListener('click', () => startGame('dash'));
  startStressBtn.addEventListener('click', () => startGame('stress'));
  restartBtn.addEventListener('click', () => startGame(state.modeId));
  menuBtn.addEventListener('click', backToMenu);
  convYesBtn.addEventListener('click', () => onConvPick('true'));
  convNoBtn.addEventListener('click', () => onConvPick('false'));
  convSkipBtn.addEventListener('click', () => onConvPick('skip'));
}
boot();
