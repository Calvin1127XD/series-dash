'use strict';

// =====================================================================
// Series Dash — question bank
// Compiled from bank-source.md + seed-suggestions.md, audit fixes applied.
// Each entry: { latex, bestTest, accepted, convergent, source, note }
// `accepted` is the array of test IDs the game treats as correct.
// `bestTest` is the canonical answer shown as feedback.
// =====================================================================

const TESTS = [
  { id: 'divergence',   label: 'Divergence Test',     short: 'Div' },
  { id: 'geometric',    label: 'Geometric Series',    short: 'Geo' },
  { id: 'pSeries',      label: 'p-Series',            short: 'p-Test' },
  { id: 'byDefinition', label: 'By Definition',       short: 'Def.' },
  { id: 'integral',     label: 'Integral Test',       short: 'Int.' },
  { id: 'dct',          label: 'Direct Comparison',   short: 'DCT' },
  { id: 'lct',          label: 'Limit Comparison',    short: 'LCT' },
  { id: 'ast',          label: 'Alternating Series',  short: 'AST' },
  { id: 'ratio',        label: 'Ratio Test',          short: 'Ratio' },
  { id: 'root',         label: 'Root Test',           short: 'Root' },
];

// ---------- helpers ----------
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const choose = arr => arr[Math.floor(Math.random() * arr.length)];

function randNonzero(a, b) {
  for (let i = 0; i < 50; i++) {
    const x = rand(a, b);
    if (x !== 0) return x;
  }
  return a !== 0 ? a : 1;
}

function randDistinct(a, b, other) {
  for (let i = 0; i < 50; i++) {
    const x = rand(a, b);
    if (x !== other) return x;
  }
  return a !== other ? a : b;
}

function randDecimal(lo, hi, dp) {
  const v = lo + Math.random() * (hi - lo);
  return Number(v.toFixed(dp));
}

// Sample k distinct values from [0..n-1], returned in descending order.
function pickSortedSubset(n, k) {
  const arr = []; for (let i = 0; i < n; i++) arr.push(i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, k).sort((x, y) => y - x);
}

function degLatex(d) {
  if (d === 0) return '';
  if (d === 1) return 'n';
  return `n^{${d}}`;
}

// Render a degree-d polynomial in n with random POSITIVE-integer coefficients.
// Leading coefficient (for n^d) is always present; extra lower-order terms are
// chosen at random from the remaining degrees. All coefficients in [1, 9].
// This guarantees the polynomial is positive for n ≥ 1, which keeps AST hyps honest.
function genPolyLatex(d, opts) {
  opts = opts || {};
  const maxExtras = Math.min(d, opts.maxExtras != null ? opts.maxExtras : 3);
  const minExtras = Math.max(0, Math.min(maxExtras, opts.minExtras != null ? opts.minExtras : 0));
  const extras = rand(minExtras, maxExtras);
  const lowers = pickSortedSubset(d, extras);
  const lo = opts.coeffMin != null ? opts.coeffMin : 1;
  const hi = opts.coeffMax != null ? opts.coeffMax : 9;
  const parts = [];
  // leading
  const leadC = rand(lo, hi);
  parts.push(`${(leadC === 1 && d > 0) ? '' : leadC}${degLatex(d)}`);
  for (const deg of lowers) {
    const c = rand(lo, hi);
    const cStr = (c === 1 && deg > 0) ? '' : String(c);
    parts.push(`+${cStr}${degLatex(deg)}`);
  }
  return parts.join('');
}

function withSource(entry, src) {
  entry.source = src;
  if (!entry.accepted || !entry.accepted.length) entry.accepted = [entry.bestTest];
  return entry;
}

// LaTeX prettifiers — render terms like an, b/n^p, etc. without "1n" or "n^1" or trailing "+0".
function termAn(a) {
  if (a === 0)  return '';
  if (a === 1)  return 'n';
  if (a === -1) return '-n';
  return `${a}n`;
}
function termAnp(a, p) {
  if (p === 0) return String(a);
  if (p === 1) return termAn(a);
  if (a === 1)  return `n^{${p}}`;
  if (a === -1) return `-n^{${p}}`;
  return `${a}n^{${p}}`;
}
function termPlusB(b) {
  if (b === 0) return '';
  return b > 0 ? `+${b}` : `${b}`;
}
function expKn(k) {
  if (k === 1)  return 'n';
  if (k === -1) return '-n';
  return `${k}n`;
}
function expKnPlusC(k, c) {
  return expKn(k) + termPlusB(c);
}
// Render n^e cleanly for any exponent (number or string). Drops "^{1}" and renders "^{0}" as 1.
function nExp(e) {
  const s = (typeof e === 'number') ? String(e) : e;
  if (s === '0') return '1';
  if (s === '1') return 'n';
  return `n^{${s}}`;
}
// Render "n+a" cleanly: drops "+0".
function nPlus(a) {
  if (a === 0) return 'n';
  return a > 0 ? `n+${a}` : `n${a}`;
}

// =====================================================================
// FIXED EXAMPLES
// =====================================================================
const FIXED_EXAMPLES = [
  // ---- from bank-source.md ----
  { latex: "\\sum_{n=1}^{\\infty} n e^{-n^2}",
    bestTest: "integral", accepted: ["integral","ratio","root","dct"], convergent: true,
    note: "Stewart 11.7. Integral via u=n²; ratio, root, DCT vs 1/n² also work. (LCT vs 1/n² gives L=0, not finite-positive — so LCT is NOT accepted under the lecture's strict statement.)" },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2 e^n}",
    bestTest: "dct", accepted: ["dct","ratio","root"], convergent: true,
    note: "≤ 1/e^n geometric; DCT canonical (lecture MC VI). Ratio/root give 1/e. LCT excluded — every comparison series gives limit 0 or ∞." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n\\, 2^n}",
    bestTest: "dct", accepted: ["dct","ratio","root"], convergent: true,
    note: "≤ 1/2^n geometric. Ratio/root give 1/2. LCT excluded — limits to 0." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{\\ln n}{n^2}",
    bestTest: "integral", accepted: ["integral","dct"], convergent: true,
    note: "Stewart 11.7 IBP. DCT via ln n ≤ √n: ln(n)/n² ≤ 1/n^{3/2}. LCT excluded — no comparison gives finite-positive limit." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n!}",
    bestTest: "ratio", accepted: ["ratio","dct","root"], convergent: true,
    note: "ρ=0. DCT via n! ≥ 2^{n-1} ⇒ 1/n! ≤ 2/2^n." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{4^n}{n^4}",
    bestTest: "divergence", accepted: ["divergence","root","ratio"], convergent: false,
    note: "lim a_n = ∞. Ratio gives 4>1, root gives 4>1." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{n+1}{n^3 - 3n + 1}",
    bestTest: "lct", accepted: ["lct"], convergent: true,
    note: "Stewart MC VI. -3n in denom kills clean DCT bound. LCT vs 1/n²." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^3 - n - 1}",
    bestTest: "lct", accepted: ["lct"], convergent: true,
    note: "Negative lower-order term; LCT vs 1/n³." },

  { latex: "\\sum_{n=1}^{\\infty} \\sin\\!\\left(\\frac{1}{n}\\right)",
    bestTest: "lct", accepted: ["lct"], convergent: false,
    note: "sin(1/n) ~ 1/n; LCT vs harmonic." },

  { latex: "\\sum_{n=1}^{\\infty} \\left(1 - \\cos\\!\\frac{1}{n}\\right)",
    bestTest: "lct", accepted: ["lct"], convergent: true,
    note: "1-cos(1/n) ~ 1/(2n²); LCT vs 1/n²." },

  // Audit B1 fix: |cos^3 n|/n^{3/2} — drop "lct" (oscillating cos has no limit ratio).
  { latex: "\\sum_{n=1}^{\\infty} \\frac{|\\cos^3 n|}{n^{3/2}}",
    bestTest: "dct", accepted: ["dct"], convergent: true,
    note: "≤ 1/n^{3/2} (Stewart MC VI). LCT inapplicable: cos^3 n oscillates." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^3 + n + 1}",
    bestTest: "dct", accepted: ["dct","lct"], convergent: true,
    note: "Positive lower-order denom; ≤ 1/n³ clean DCT. LCT vs 1/n³ also clean." },

  { latex: "\\sum_{n=2}^{\\infty} \\frac{(-1)^n}{\\ln n}",
    bestTest: "ast", accepted: ["ast"], convergent: true,
    note: "AST; conditionally convergent." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{\\cos(n\\pi)}{\\sqrt{n+1}}",
    bestTest: "ast", accepted: ["ast"], convergent: true,
    note: "cos(nπ)=(-1)^n; b_n=1/√(n+1) ↓ 0." },

  { latex: "\\sum_{n=1}^{\\infty} (-1)^n \\sin\\!\\left(\\frac{\\pi}{4n}\\right)",
    bestTest: "ast", accepted: ["ast"], convergent: true,
    note: "b_n=sin(π/4n) ↓ 0; conditionally convergent (|a_n| ~ π/(4n))." },

  { latex: "\\sum_{n=2}^{\\infty} \\frac{1}{n \\ln n}",
    bestTest: "integral", accepted: ["integral"], convergent: false,
    note: "Antideriv ln(ln n) → ∞. Integral canonical." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^{\\ln n}}",
    bestTest: "integral", accepted: ["integral"], convergent: true,
    note: "u = ln x; integral becomes ∫ e^{-(ln x)²} dx, converges." },

  // Audit B2 fix: drop "root" — root gives lim 1, inconclusive.
  { latex: "\\sum_{n=1}^{\\infty} \\left(1+\\frac{1}{n}\\right)^n",
    bestTest: "divergence", accepted: ["divergence"], convergent: false,
    note: "→ e ≠ 0. Root and ratio both give 1 (inconclusive); divergence is the only direct route." },

  { latex: "\\sum_{n=1}^{\\infty} \\arctan(n)",
    bestTest: "divergence", accepted: ["divergence"], convergent: false,
    note: "→ π/2 ≠ 0." },

  // Audit A6 fix: missing Best test, set to byDefinition.
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{1}{\\sqrt{n+2}} - \\frac{1}{\\sqrt{n+3}}\\right)",
    bestTest: "byDefinition", accepted: ["byDefinition"], convergent: true,
    note: "Stewart 11.7 strategy. Telescopes to 1/√3." },

  { latex: "\\sum_{n=1}^{\\infty}\\left(\\frac{n+1}{2n+3}\\right)^{-3n}",
    bestTest: "root", accepted: ["root"], convergent: false,
    note: "Trap: rewrite as ((2n+3)/(n+1))^{3n}; nth root → 2³ = 8." },

  // ---- from seed-suggestions.md ----
  { latex: "\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{n}",
    bestTest: "ast", accepted: ["ast"], convergent: true,
    note: "Alternating harmonic; conditionally convergent." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{n^2}",
    bestTest: "ast", accepted: ["ast"], convergent: true,
    note: "AST; absolutely convergent (|a_n|=1/n²)." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{n}{2^n}",
    bestTest: "ratio", accepted: ["ratio","root","dct"], convergent: true,
    note: "ρ=1/2. Root also 1/2; DCT via n ≤ 2^{n/2} eventually." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2 + 1}",
    bestTest: "dct", accepted: ["dct","lct","integral"], convergent: true,
    note: "Three clean paths: DCT vs 1/n², LCT vs 1/n², integral via arctan." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n + n^2}",
    bestTest: "dct", accepted: ["dct","lct"], convergent: true,
    note: "≤ 1/n² (DCT) or LCT vs 1/n² with L=1. Note: this *equals* 1/n − 1/(n+1) by partial fractions, but the raw form isn't telescoping per the strict f(n) − f(n+1) rule, so byDefinition isn't accepted." },

  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{1}{n} - \\frac{1}{n+1}\\right)",
    bestTest: "byDefinition", accepted: ["byDefinition"], convergent: true,
    note: "Explicit telescoping form. S_N = 1 - 1/(N+1) → 1." },

  { latex: "\\sum_{n=1}^{\\infty} n!\\, e^{-n}",
    bestTest: "ratio", accepted: ["ratio","divergence"], convergent: false,
    note: "ρ = (n+1)/e → ∞. Also a_n → ∞ ≠ 0." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{n^{n}}{(2n)!}",
    bestTest: "ratio", accepted: ["ratio"], convergent: true,
    note: "ρ = e/4 < 1." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n} \\sin\\!\\left(\\frac{1}{n}\\right)",
    bestTest: "lct", accepted: ["lct"], convergent: true,
    note: "a_n ~ 1/n²; LCT vs 1/n²." },

  { latex: "\\sum_{n=1}^{\\infty} \\ln\\!\\left(\\frac{n}{n+1}\\right)",
    bestTest: "byDefinition", accepted: ["byDefinition"], convergent: false,
    note: "= ln n − ln(n+1); telescopes to −ln(N+1) → −∞. a_n → 0 so divergence test inconclusive." },

  { latex: "\\sum_{n=1}^{\\infty} \\bigl(e^{n} - e^{n+1}\\bigr)",
    bestTest: "byDefinition", accepted: ["byDefinition","divergence"], convergent: false,
    note: "Telescopes; S_N = e − e^{N+1} → −∞. Divergence test also concludes." },

  { latex: "\\sum_{n=1}^{\\infty} \\bigl(\\cos(n) - \\cos(n+1)\\bigr)",
    bestTest: "byDefinition", accepted: ["byDefinition","divergence"], convergent: false,
    note: "Telescopes: S_N = cos 1 − cos(N+1) oscillates without limit. Divergence test catches it via prosthaphaeresis." },

  // ---- promoted from no-param "templates" so dedup treats them naturally ----
  { latex: "\\sum_{n=1}^{\\infty} n \\sin\\!\\left(\\frac{1}{n}\\right)",
    bestTest: "divergence", accepted: ["divergence"], convergent: false,
    note: "n sin(1/n) → 1 ≠ 0." },

  { latex: "\\sum_{n=1}^{\\infty} \\bigl(\\sqrt{n+1} - \\sqrt{n}\\bigr)",
    bestTest: "byDefinition", accepted: ["byDefinition"], convergent: false,
    note: "Telescopes; S_N = √(N+1) − 1 → ∞." },

  { latex: "\\sum_{n=1}^{\\infty} \\frac{|\\sin n|}{n!}",
    bestTest: "dct", accepted: ["dct","ratio"], convergent: true,
    note: "|sin n| ≤ 1 ⇒ a_n ≤ 1/n!; ≤ 2/2^n via n! ≥ 2^{n-1}. Ratio gives ρ=0." },

  { latex: "\\sum_{n=2}^{\\infty} \\frac{1}{(\\ln n)^{n}}",
    bestTest: "root", accepted: ["root"], convergent: true,
    note: "nth root = 1/ln n → 0 < 1." },
];

FIXED_EXAMPLES.forEach(e => withSource(e, 'fixed'));

// =====================================================================
// GENERATORS — one array of subtemplates per test ID
// =====================================================================
const GENERATORS = {

  // ---------- divergence ----------
  divergence: [
    // same-degree linear rational (bank-source)
    () => {
      const a = rand(2,9), b = rand(1,9), c = rand(2,9), d = rand(1,9);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{${a}n+${b}}{${c}n+${d}}`,
        bestTest: 'divergence', accepted: ['divergence'], convergent: false,
        note: `lim = ${a}/${c} ≠ 0`,
      }, 'generated');
    },
    // same-degree polynomial rational (bank-source) — integer p in 2..5
    () => {
      const p = rand(2,5);
      const a = rand(2,6), b = rand(1,9), c = rand(2,6), d = rand(1,9);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{${a}n^{${p}}+${b}}{${c}n^{${p}}+${d}}`,
        bestTest: 'divergence', accepted: ['divergence'], convergent: false,
        note: `lim = ${a}/${c}`,
      }, 'generated');
    },
    // nth root of constant (bank-source) — k in 2..9
    () => {
      const k = rand(2,9);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\sqrt[n]{${k}}`,
        bestTest: 'divergence', accepted: ['divergence'], convergent: false,
        note: `${k}^{1/n} → 1`,
      }, 'generated');
    },
    // n/(n+k) — supplementary divergence-test classic
    () => {
      const k = rand(1,9);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{n}{n+${k}}`,
        bestTest: 'divergence', accepted: ['divergence'], convergent: false,
        note: '→ 1',
      }, 'generated');
    },
    // (n sin(1/n) and arctan(n) live in the fixed bank — no-param generators
    // would just produce duplicates of those entries.)

    // AST-disguised rational with deg(num) ≥ deg(denom) — bank-source "p≥q" template
    // Audit A1 fix: oscillator written as proper (-1)^n etc.
    () => {
      const t = rand(3,10);
      const oscillator = choose(['(-1)^{n}', '(-1)^{n+1}', '\\cos(n\\pi)']);
      const dq = rand(1, 3);
      const dp = rand(dq, dq + 2); // dp ≥ dq, but cap at small degrees
      const numer = genPolyLatex(dp, { minExtras: 0, maxExtras: 2, coeffMin: 1, coeffMax: 5 });
      const denom = genPolyLatex(dq, { minExtras: 0, maxExtras: 2, coeffMin: 1, coeffMax: 5 });
      return withSource({
        latex: `\\sum_{n=${t}}^{\\infty} ${oscillator}\\,\\frac{${numer}}{${denom}}`,
        bestTest: 'divergence', accepted: ['divergence'], convergent: false,
        note: 'deg num ≥ deg denom, terms don\'t go to 0 → divergence test',
      }, 'generated');
    },
  ],

  // ---------- geometric ----------
  geometric: [
    // Simple geometric (a/b)^n with a < b → converges
    () => {
      const a = rand(1, 4);
      const b = randDistinct(5, 9, a);
      return withSource({
        latex: `\\sum_{n=0}^{\\infty} \\left(\\frac{${a}}{${b}}\\right)^{n}`,
        bestTest: 'geometric', accepted: ['geometric','ratio'], convergent: true,
        note: `r = ${a}/${b} < 1`,
      }, 'generated');
    },
    // Simple geometric a > b → diverges
    () => {
      const a = rand(5, 9);
      const b = randDistinct(2, 4, a);
      return withSource({
        latex: `\\sum_{n=0}^{\\infty} \\left(\\frac{${a}}{${b}}\\right)^{n}`,
        bestTest: 'geometric', accepted: ['geometric','ratio','divergence'], convergent: false,
        note: `r = ${a}/${b} > 1; terms → ∞ so divergence test also concludes`,
      }, 'generated');
    },
    // Signed geometric (-a/b)^n
    () => {
      const a = rand(1, 14);
      const b = randDistinct(2, 15, a);
      const conv = a < b;
      return withSource({
        latex: `\\sum_{n=0}^{\\infty} \\left(-\\frac{${a}}{${b}}\\right)^{n}`,
        bestTest: 'geometric', accepted: conv ? ['geometric','ratio'] : ['geometric','ratio','divergence'], convergent: conv,
        note: `|r| = ${a}/${b}`,
      }, 'generated');
    },
    // Shifted with constant: c (a/b)^{kn}, |a|≠b so the series isn't degenerate.
    () => {
      const c = randNonzero(-5, 5);
      let a, b;
      do {
        a = randNonzero(-9, 9);
        b = rand(2, 12);
      } while (Math.abs(a) === b);
      const k = rand(1, 4);
      const conv = Math.abs(a) < b;
      const cStr = c < 0 ? `(${c})` : String(c);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} ${cStr}\\left(\\frac{${a}}{${b}}\\right)^{${expKn(k)}}`,
        bestTest: 'geometric', accepted: conv ? ['geometric','ratio'] : ['geometric','ratio','divergence'], convergent: conv,
        note: `|a/b|^k → ${Math.pow(Math.abs(a/b), k).toFixed(3)}`,
      }, 'generated');
    },
    // Audit A2 fix: shifted geometric a^{kn+r}/b^{hn+s} with proper braces and clean exponents.
    () => {
      const t = rand(5, 15);
      const k = rand(1, 3);
      const h = rand(1, 3);
      const r = rand(-3, 3);
      const s = rand(-5, 2);
      const a = randNonzero(2, 9);
      const b = randDistinct(2, 9, a);
      const ak = Math.pow(a, k);
      const bh = Math.pow(b, h);
      const conv = Math.abs(ak / bh) < 1;
      return withSource({
        latex: `\\sum_{n=${t}}^{\\infty} \\frac{${a}^{${expKnPlusC(k, r)}}}{${b}^{${expKnPlusC(h, s)}}}`,
        bestTest: 'geometric', accepted: ['geometric','ratio'], convergent: conv,
        note: `|a^k/b^h| = ${Math.abs(ak/bh).toFixed(3)}`,
      }, 'generated');
    },
  ],

  // ---------- pSeries ----------
  pSeries: [
    // Σ k/(x n^p) — k≠x; p decimal in 0.1..10 (2dp)
    () => {
      const k = rand(1, 10);
      const x = randDistinct(2, 10, k);
      const p = randDecimal(0.10, 10.0, 2);
      const pStr = (p % 1 === 0) ? String(p) : p.toFixed(2);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{${k}}{${x}\\, n^{${pStr}}}`,
        bestTest: 'pSeries', accepted: ['pSeries'], convergent: p > 1,
        note: `p = ${pStr}`,
      }, 'generated');
    },
    // The classic "nice p" forms (sqrt n, n sqrt n, ∛n²)
    () => choose([
      () => withSource({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{n}`,            bestTest: 'pSeries', accepted: ['pSeries'], convergent: false, note: 'p = 1' }, 'generated'),
      () => withSource({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{\\sqrt{n}}`,    bestTest: 'pSeries', accepted: ['pSeries'], convergent: false, note: 'p = 1/2' }, 'generated'),
      () => withSource({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{n\\sqrt{n}}`,   bestTest: 'pSeries', accepted: ['pSeries'], convergent: true,  note: 'p = 3/2' }, 'generated'),
      () => withSource({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{\\sqrt[3]{n^2}}`, bestTest: 'pSeries', accepted: ['pSeries'], convergent: false, note: 'p = 2/3' }, 'generated'),
      () => withSource({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{n^2}`,          bestTest: 'pSeries', accepted: ['pSeries'], convergent: true,  note: 'p = 2' }, 'generated'),
      () => withSource({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{n^3}`,          bestTest: 'pSeries', accepted: ['pSeries'], convergent: true,  note: 'p = 3' }, 'generated'),
    ])(),
  ],

  // ---------- byDefinition ----------
  byDefinition: [
    // telescoping reciprocal-power
    () => {
      const choices = [
        { p: '1', conv: true },
        { p: '2', conv: true },
        { p: '3', conv: true },
        { p: '\\frac{1}{2}', conv: true },
        { p: '\\frac{3}{2}', conv: true },
      ];
      const o = choose(choices);
      const numer = o.p === '1' ? 'n' : `n^{${o.p}}`;
      const numerNext = o.p === '1' ? '(n+1)' : `(n+1)^{${o.p}}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty}\\left(\\frac{1}{${numer}}-\\frac{1}{${numerNext}}\\right)`,
        bestTest: 'byDefinition', accepted: ['byDefinition'], convergent: o.conv,
        note: `S_N = 1 - 1/(N+1)^{${o.p}} → 1`,
      }, 'generated');
    },
    // telescoping shifted reciprocal kth root
    () => {
      const a = rand(1,5);
      const k = rand(2,5);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty}\\left(\\frac{1}{\\sqrt[${k}]{n+${a}}}-\\frac{1}{\\sqrt[${k}]{n+${a + 1}}}\\right)`,
        bestTest: 'byDefinition', accepted: ['byDefinition'], convergent: true,
        note: 'telescopes',
      }, 'generated');
    },
    // log differences (diverges)
    () => {
      const a = rand(0,5);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\bigl(\\ln(${nPlus(a)}) - \\ln(${nPlus(a + 1)})\\bigr)`,
        bestTest: 'byDefinition', accepted: ['byDefinition'], convergent: false,
        note: 'S_N = ln(1+a) - ln(N+a+1) → -∞',
      }, 'generated');
    },
    // arctan differences — written as f(n) − f(n+1) per lecture convention.
    // Σ (arctan(n+a) − arctan(n+a+1)) = arctan(a+1) − π/2  (a finite negative number).
    () => {
      const a = rand(0,5);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\bigl(\\arctan(${nPlus(a)}) - \\arctan(${nPlus(a + 1)})\\bigr)`,
        bestTest: 'byDefinition', accepted: ['byDefinition'], convergent: true,
        note: 'telescopes to arctan(a+1) − π/2',
      }, 'generated');
    },
    // (Σ √(n+1) - √n lives in the fixed bank.)
    // (1/n − 1/(n+a)) for a > 1 was deleted: telescoping should only be f(n) − f(n+1).
  ],

  // ---------- integral ----------
  integral: [
    // 1/(n (ln n)^p) — Audit A7 fix: convergent iff p > 1 (cover p=1 case as divergent)
    () => {
      const p = randDecimal(0.10, 5.5, 1);
      const pStr = (p % 1 === 0) ? String(p) : p.toFixed(1);
      return withSource({
        latex: `\\sum_{n=2}^{\\infty} \\frac{1}{n\\,(\\ln n)^{${pStr}}}`,
        bestTest: 'integral', accepted: ['integral'], convergent: p > 1,
        note: `u = ln n; p = ${pStr}`,
      }, 'generated');
    },
    // Bertrand series 1/(n (ln n)^q) — p=1, classic integral test (u = ln n)
    () => {
      const opts = [
        { qStr: '1',           qNum: 1,   conv: false },
        { qStr: '2',           qNum: 2,   conv: true  },
        { qStr: '\\frac{1}{2}', qNum: 0.5, conv: false },
      ];
      const o = choose(opts);
      return withSource({
        latex: `\\sum_{n=2}^{\\infty} \\frac{1}{n\\, (\\ln n)^{${o.qStr}}}`,
        bestTest: 'integral', accepted: ['integral'], convergent: o.conv,
        note: 'p = 1 Bertrand; only integral test (u = ln n) is clean.',
      }, 'generated');
    },
    // 1/(n^p (ln n)^q) with p=2 — DCT canonical since (ln n)^q ≥ 1 eventually
    () => {
      const qStr = choose(['1','2','\\frac{1}{2}','3']);
      return withSource({
        latex: `\\sum_{n=2}^{\\infty} \\frac{1}{n^{2}\\, (\\ln n)^{${qStr}}}`,
        bestTest: 'dct', accepted: ['dct','lct','integral'], convergent: true,
        note: '≤ 1/n² (eventually); LCT vs 1/n² also clean.',
      }, 'generated');
    },
    // (n e^{-n^2} lives in the fixed bank.)
  ],

  // ---------- dct ----------
  dct: [
    // Audit B1 fix: |cos^k n|/n^p — drop "lct" (oscillating cos has no limit ratio)
    () => {
      const k = rand(1, 5);
      const p = randDecimal(1.1, 5.0, 1);
      const pStr = p.toFixed(1);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{|\\cos^{${k}} n|}{n^{${pStr}}}`,
        bestTest: 'dct', accepted: ['dct'], convergent: true,
        note: `|cos^${k} n| ≤ 1; ≤ 1/n^{${pStr}} converges`,
      }, 'generated');
    },
    // 1/(k^n + n^p) — DCT vs geometric; LCT also clean here
    () => {
      const k = rand(2,5);
      const p = rand(1,3);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{1}{${k}^{n}+${degLatex(p)}}`,
        bestTest: 'dct', accepted: ['dct','lct'], convergent: true,
        note: `≤ 1/${k}^n geometric`,
      }, 'generated');
    },
    // Rational with positive lower-order: (n^p+a)/(n^q+bn+c)
    () => {
      const p = rand(0,3);
      const q = p + rand(3,5);
      const a = rand(1,5), b = rand(1,5), c = rand(1,9);
      const numStr = p === 0 ? String(a) : `${degLatex(p)}+${a}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{${numStr}}{${degLatex(q)}+${termAn(b)}+${c}}`,
        bestTest: 'dct', accepted: ['dct','lct'], convergent: true,
        note: `~ 1/n^{${q-p}}`,
      }, 'generated');
    },
    // (|sin n|/n! lives in the fixed bank.)
  ],

  // ---------- lct ----------
  lct: [
    // sin(1/n)^p — convergent iff p > 1
    () => {
      const p = randDecimal(0.5, 5.0, 1);
      const pStr = (p % 1 === 0) ? String(p) : p.toFixed(1);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty}\\sin\\!\\left(\\frac{1}{n}\\right)^{${pStr}}`,
        bestTest: 'lct', accepted: ['lct'], convergent: p > 1,
        note: `~ 1/n^{${pStr}}`,
      }, 'generated');
    },
    // ln(1 + 1/n^p)
    () => {
      const opts = [
        { p: '\\frac{1}{2}', n: 0.5 },
        { p: '1', n: 1 },
        { p: '\\frac{3}{2}', n: 1.5 },
        { p: '2', n: 2 },
        { p: '3', n: 3 },
      ];
      const o = choose(opts);
      // Special case p=1: ln(1 + 1/n) = ln((n+1)/n) = ln(n+1) − ln(n) telescopes,
      // so byDefinition is also a clean route.
      const accepted = o.p === '1' ? ['lct','byDefinition'] : ['lct'];
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\ln\\!\\left(1+\\frac{1}{${nExp(o.p)}}\\right)`,
        bestTest: 'lct', accepted, convergent: o.n > 1,
        note: o.p === '1'
          ? 'ln(1+1/n) = ln(n+1) − ln(n); telescopes (S_N = ln(N+1) → ∞). LCT vs 1/n also clean.'
          : 'ln(1+x) ~ x for small x; LCT vs 1/n^p with L = 1.',
      }, 'generated');
    },
    // e^(1/n^p) - 1
    () => {
      const opts = [
        { p: '\\frac{1}{2}', n: 0.5 },
        { p: '1', n: 1 },
        { p: '\\frac{3}{2}', n: 1.5 },
        { p: '2', n: 2 },
        { p: '3', n: 3 },
      ];
      const o = choose(opts);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\left(e^{1/${nExp(o.p)}} - 1\\right)`,
        bestTest: 'lct', accepted: ['lct'], convergent: o.n > 1,
        note: 'e^x - 1 ~ x',
      }, 'generated');
    },
    // 1 - cos(c/n)
    () => {
      const c = rand(1,5);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\left(1 - \\cos\\!\\left(\\frac{${c}}{n}\\right)\\right)`,
        bestTest: 'lct', accepted: ['lct'], convergent: true,
        note: `~ ${c}²/(2n²)`,
      }, 'generated');
    },
    // 1 / (k^n - a n^p)
    () => {
      const k = rand(2,5);
      const a = rand(1,3);
      const p = rand(1,3);
      return withSource({
        latex: `\\sum_{n=2}^{\\infty} \\frac{1}{${k}^{n}-${termAnp(a, p)}}`,
        bestTest: 'lct', accepted: ['lct'], convergent: true,
        note: `~ 1/${k}^n`,
      }, 'generated');
    },
    // Rational with NEGATIVE lower-order denominator (LCT, integer exponents only)
    // Asymptotic ~ 1/n^k where k = (d - p) and we force k ≥ 2 for convergence.
    () => {
      const d = rand(3, 6);                    // denominator leading degree
      const k = rand(2, 3);                    // gap → convergent (k ≥ 2 > 1)
      const p = d - k;                         // numerator leading degree (≥ 1)
      const r = rand(1, 2);
      const denomMidExp = d - r;               // e.g. d=4, r=1 → mid term degree 3
      const a = rand(1, 5), b = rand(1, 4), c = rand(1, 9);
      const bMidTerm = b === 1 ? nExp(denomMidExp) : `${b}${nExp(denomMidExp)}`;
      return withSource({
        latex: `\\sum_{n=2}^{\\infty} \\frac{${nExp(p)}+${a}}{${nExp(d)}-${bMidTerm}+${c}}`,
        bestTest: 'lct', accepted: ['lct'], convergent: true,
        note: `~ 1/n^{${k}}, k > 1; -bn^{${denomMidExp}} blocks clean DCT`,
      }, 'generated');
    },
    // Divergent twin: gap = 1 so asymptotic is 1/n
    () => {
      const d = rand(3, 6);
      const p = d - 1;                          // gap = 1 → divergent
      const r = rand(1, 2);
      const denomMidExp = d - r;
      const a = rand(1, 5), b = rand(1, 4), c = rand(1, 9);
      const bMidTerm = b === 1 ? nExp(denomMidExp) : `${b}${nExp(denomMidExp)}`;
      return withSource({
        latex: `\\sum_{n=2}^{\\infty} \\frac{${nExp(p)}+${a}}{${nExp(d)}-${bMidTerm}+${c}}`,
        bestTest: 'lct', accepted: ['lct'], convergent: false,
        note: '~ 1/n (gap = 1); -bn-term blocks clean DCT',
      }, 'generated');
    },
  ],

  // ---------- ast ----------
  ast: [
    // (-1)^n / n^p
    () => {
      const p = randDecimal(0.10, 5.0, 1);
      const pStr = (p % 1 === 0) ? String(p) : p.toFixed(1);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{(-1)^{n}}{${nExp(pStr)}}`,
        bestTest: 'ast', accepted: ['ast'], convergent: true,
        note: `b_n = 1/n^{${pStr}} ↓ 0`,
      }, 'generated');
    },
    // cos(n π) / denom — Audit D3 fix: 2n! → 2 \cdot n!
    () => {
      const denom = choose(['n','n+1','2n-1','\\sqrt{n+1}','n^{2}','n!','2 \\cdot n!','n^{n}','3^{n}']);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{\\cos(n\\pi)}{${denom}}`,
        bestTest: 'ast', accepted: ['ast'], convergent: true,
        note: 'cos(n π) = (-1)^n',
      }, 'generated');
    },
    // (-1)^{n+1} / (xn+k)
    () => {
      const x = rand(2,15);
      const k = rand(1,9);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{${x}n+${k}}`,
        bestTest: 'ast', accepted: ['ast'], convergent: true,
        note: `1/(${x}n+${k}) ↓ 0`,
      }, 'generated');
    },
    // (sin((2n-1)π/2) disguise removed — this course uses cos(nπ) as the only oscillator dressing.)
    // (-1)^n n / (n^2 + a)
    () => {
      const a = rand(1,9);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} (-1)^{n}\\,\\frac{n}{n^{2}+${a}}`,
        bestTest: 'ast', accepted: ['ast'], convergent: true,
        note: 'b_n = n/(n²+a) eventually decreasing to 0',
      }, 'generated');
    },
    // (-1)^n / (ln n)^p
    () => {
      const p = choose(['\\frac{1}{2}','1','2','3']);
      return withSource({
        latex: `\\sum_{n=2}^{\\infty} \\frac{(-1)^{n}}{(\\ln n)^{${p}}}`,
        bestTest: 'ast', accepted: ['ast'], convergent: true,
        note: '1/(ln n)^p ↓ 0',
      }, 'generated');
    },
    // AST disguised polynomial-rational with p < q (uses polynomial macro)
    () => {
      const t = rand(3, 10);
      const oscillator = choose(['(-1)^{n}', '(-1)^{n+1}', '\\cos(n\\pi)']);
      const dp = rand(0, 2);
      const dq = dp + rand(1, 3);
      const numer = genPolyLatex(dp, { minExtras: 0, maxExtras: 2, coeffMin: 1, coeffMax: 5 });
      const denom = genPolyLatex(dq, { minExtras: 0, maxExtras: 2, coeffMin: 1, coeffMax: 5 });
      return withSource({
        latex: `\\sum_{n=${t}}^{\\infty} ${oscillator}\\,\\frac{${numer}}{${denom}}`,
        bestTest: 'ast', accepted: ['ast'], convergent: true,
        note: 'deg num < deg denom; positive coeffs → b_n eventually positive decreasing → 0',
      }, 'generated');
    },
  ],

  // ---------- ratio ----------
  ratio: [
    // n^p × k^n / n!
    () => {
      const p = rand(2, 4);
      const k = rand(2, 6);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{n^{${p}} \\cdot ${k}^{n}}{n!}`,
        bestTest: 'ratio', accepted: ['ratio'], convergent: true,
        note: 'ρ = 0',
      }, 'generated');
    },
    // k^n / n!
    () => {
      const k = rand(2, 9);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{${k}^{n}}{n!}`,
        bestTest: 'ratio', accepted: ['ratio'], convergent: true,
        note: 'ρ = k/(n+1) → 0. (Root via Stirling also works but is beyond lecture scope.)',
      }, 'generated');
    },
    // n^p / n!
    () => {
      const p = rand(2, 5);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{n^{${p}}}{n!}`,
        bestTest: 'ratio', accepted: ['ratio'], convergent: true,
        note: 'ρ = 0',
      }, 'generated');
    },
    // n! / k^n — diverges
    () => {
      const k = rand(2, 5);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{n!}{${k}^{n}}`,
        bestTest: 'ratio', accepted: ['ratio','divergence'], convergent: false,
        note: 'ρ = (n+1)/k → ∞; a_n → ∞ ≠ 0 so divergence test also concludes',
      }, 'generated');
    },
    // n^p / k^n — Audit E1 fix: cap p at 6 not 50.
    () => {
      const p = rand(2, 6);
      const k = rand(2, 5);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{n^{${p}}}{${k}^{n}}`,
        bestTest: 'ratio', accepted: ['ratio','root'], convergent: true,
        note: `ρ = 1/${k}`,
      }, 'generated');
    },
    // (-1)^n n^p / n! — both ratio and AST clean
    () => {
      const p = rand(1, 4);
      const numTerm = p === 1 ? 'n' : `n^{${p}}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{(-1)^{n}\\, ${numTerm}}{n!}`,
        bestTest: 'ratio', accepted: ['ratio','ast'], convergent: true,
        note: 'absolutely convergent; AST also concludes',
      }, 'generated');
    },

    // a^n / n^p — diverges (since k>1: a^n outgrows polynomial)
    () => {
      const p = rand(1, 5);
      const a = rand(2, 6);
      const denTerm = p === 1 ? 'n' : `n^{${p}}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{${a}^{n}}{${denTerm}}`,
        bestTest: 'ratio', accepted: ['ratio','root','divergence'], convergent: false,
        note: `ρ = ${a} > 1`,
      }, 'generated');
    },

    // n! / n^p — diverges (factorial outgrows polynomial)
    () => {
      const p = rand(1, 5);
      const denTerm = p === 1 ? 'n' : `n^{${p}}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{n!}{${denTerm}}`,
        bestTest: 'ratio', accepted: ['ratio','divergence'], convergent: false,
        note: 'ρ = (n+1)·... → ∞',
      }, 'generated');
    },

    // n! · a^n / n^p — diverges
    () => {
      const p = rand(2, 5);
      const a = rand(2, 6);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{n!\\, ${a}^{n}}{n^{${p}}}`,
        bestTest: 'ratio', accepted: ['ratio','divergence'], convergent: false,
        note: 'factorial in numerator wins',
      }, 'generated');
    },

    // n! · n^p / a^n — diverges
    () => {
      const p = rand(1, 4);
      const a = rand(2, 6);
      const numTerm = p === 1 ? 'n' : `n^{${p}}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{n!\\, ${numTerm}}{${a}^{n}}`,
        bestTest: 'ratio', accepted: ['ratio','divergence'], convergent: false,
        note: 'factorial in numerator wins',
      }, 'generated');
    },

    // n^p / (n! · a^n) — converges fast
    () => {
      const p = rand(1, 5);
      const a = rand(2, 6);
      const numTerm = p === 1 ? 'n' : `n^{${p}}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{${numTerm}}{n!\\, ${a}^{n}}`,
        bestTest: 'ratio', accepted: ['ratio'], convergent: true,
        note: 'ρ = 0',
      }, 'generated');
    },

    // a^n / (n^p · n!) — converges fast
    () => {
      const p = rand(1, 4);
      const a = rand(2, 6);
      const denPolyTerm = p === 1 ? 'n' : `n^{${p}}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{${a}^{n}}{${denPolyTerm}\\, n!}`,
        bestTest: 'ratio', accepted: ['ratio'], convergent: true,
        note: 'ρ = 0 (factorial in denom wins)',
      }, 'generated');
    },

    // n! / (n^p · a^n) — diverges (factorial wins, divergence test also catches)
    () => {
      const p = rand(1, 4);
      const a = rand(2, 5);
      const denPolyTerm = p === 1 ? 'n' : `n^{${p}}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{n!}{${denPolyTerm}\\, ${a}^{n}}`,
        bestTest: 'ratio', accepted: ['ratio','divergence'], convergent: false,
        note: 'ρ → ∞',
      }, 'generated');
    },

    // (n!)^2 / a^n — diverges
    () => {
      const a = rand(2, 9);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{(n!)^{2}}{${a}^{n}}`,
        bestTest: 'ratio', accepted: ['ratio','divergence'], convergent: false,
        note: `ρ = (n+1)²/${a} → ∞`,
      }, 'generated');
    },

    // a^n / (n!)^2 — converges
    () => {
      const a = rand(2, 9);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{${a}^{n}}{(n!)^{2}}`,
        bestTest: 'ratio', accepted: ['ratio'], convergent: true,
        note: 'ρ = 0',
      }, 'generated');
    },

    // n^p · a^n · n! / 1 — pure numerator product, diverges trivially
    () => {
      const p = rand(1, 3);
      const a = rand(2, 5);
      const numTerm = p === 1 ? 'n' : `n^{${p}}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} ${numTerm}\\, ${a}^{n}\\, n!`,
        bestTest: 'ratio', accepted: ['ratio','divergence'], convergent: false,
        note: 'a_n → ∞',
      }, 'generated');
    },

    // 1 / (n^p · a^n · n!) — pure denominator product, converges fast
    () => {
      const p = rand(1, 3);
      const a = rand(2, 5);
      const denPolyTerm = p === 1 ? 'n' : `n^{${p}}`;
      return withSource({
        latex: `\\sum_{n=1}^{\\infty} \\frac{1}{${denPolyTerm}\\, ${a}^{n}\\, n!}`,
        bestTest: 'ratio', accepted: ['ratio'], convergent: true,
        note: 'ρ = 0',
      }, 'generated');
    },
  ],

  // ---------- root ----------
  root: [
    // {numerator}/n^n with numerator in {1, 2^n, 3^n}
    // DCT: k^n/n^n ≤ (1/2)^n for n large enough — clean comparison vs geometric.
    // LCT: comparison vs 1/2^n gives L = 0 (extended LCT), accepted in this course.
    () => {
      const t = rand(1, 10);
      const numer = choose(['1', '2^{n}', '3^{n}']);
      return withSource({
        latex: `\\sum_{n=${t}}^{\\infty} \\frac{${numer}}{n^{n}}`,
        bestTest: 'root', accepted: ['root','ratio','dct','lct'], convergent: true,
        note: 'nth root → 0 (canonical); ratio gives 0; DCT vs (1/2)^n; LCT also clean.',
      }, 'generated');
    },
    // ((an+b)/(cn+d))^{kn} — Audit A3 fix: c ≥ 1, d ≥ 0 so cn+d > 0 always.
    // Also force |a| ≠ c so the root limit isn't 1 (which would be inconclusive).
    () => {
      const c = rand(1, 5);
      let a;
      do { a = randNonzero(-5, 5); } while (Math.abs(a) === c);
      const b = randNonzero(-5, 5);
      const d = rand(0, 5);
      const k = randNonzero(-3, 3);
      // root limit = |a/c|^k; converges iff |a/c|^k < 1
      const limit = Math.pow(Math.abs(a / c), k);
      const conv = limit < 1;
      const numStr = termAn(a) + termPlusB(b);
      const denStr = termAn(c) + termPlusB(d);
      return withSource({
        latex: `\\sum_{n=1}^{\\infty}\\left(\\frac{${numStr}}{${denStr}}\\right)^{${expKn(k)}}`,
        bestTest: 'root', accepted: conv ? ['root'] : ['root','divergence'], convergent: conv,
        note: `|a/c|^k = ${limit.toFixed(3)}`,
      }, 'generated');
    },
    // (1/(ln n)^n lives in the fixed bank.)
  ],
};

// =====================================================================
// pickSeries with no-repeat support
// =====================================================================

const WEIGHTS = {
  divergence:   1.0,
  geometric:    0.8,
  pSeries:      0.8,
  byDefinition: 0.7,
  integral:     1.0,
  dct:          1.5,
  lct:          1.5,
  ast:          1.2,
  ratio:        1.5,
  root:         1.2,
};

// Normalize LaTeX so that visually-identical series compare equal across
// the fixed bank and the generators. Examples: `n^2` ≡ `n^{2}`, `n^n` ≡ `n^{n}`.
// Whitespace is stripped. \, and \! (thinspace etc.) are dropped too.
function normalizeLatex(s) {
  return s
    .replace(/\\,|\\!|\\;|\\:|\s+/g, '')          // drop spacing macros + whitespace
    .replace(/\^(\d)\b/g, '^{$1}')                  // ^2 → ^{2}
    .replace(/\^([a-zA-Z])\b/g, '^{$1}')            // ^n → ^{n}
    .replace(/_(\d)\b/g, '_{$1}')
    .replace(/_([a-zA-Z])\b/g, '_{$1}');
}

function selectGeneratorKey() {
  const keys = Object.keys(WEIGHTS);
  let total = 0;
  for (const k of keys) total += WEIGHTS[k];
  let r = Math.random() * total;
  for (const k of keys) {
    r -= WEIGHTS[k];
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}

function pickGenerated(opts) {
  const exclude = (opts && opts.excludeLatex) || null;
  for (let attempt = 0; attempt < 16; attempt++) {
    const k = selectGeneratorKey();
    const subs = GENERATORS[k];
    const result = choose(subs)();
    if (!exclude || !exclude.has(normalizeLatex(result.latex))) return result;
  }
  // Couldn't find a fresh draw in 16 tries; return whatever to avoid deadlock.
  return choose(GENERATORS[selectGeneratorKey()])();
}

function pickFixed(opts) {
  const exclude = (opts && opts.excludeLatex) || null;
  const pool = exclude
    ? FIXED_EXAMPLES.filter(e => !exclude.has(normalizeLatex(e.latex)))
    : FIXED_EXAMPLES;
  if (!pool.length) return null;
  const picked = choose(pool);
  return Object.assign({}, picked, { accepted: picked.accepted.slice() });
}

function pickSeries(opts) {
  const wantFixed = Math.random() >= 0.6;
  if (wantFixed) {
    const f = pickFixed(opts);
    if (f) return f;
  }
  return pickGenerated(opts);
}

window.SeriesLibrary = {
  TESTS,
  pickSeries,
  pickGenerated,
  pickFixed,
  normalizeLatex,
  FIXED_EXAMPLES,
  GENERATORS,
};
