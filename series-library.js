'use strict';

// ============================================================
// Series Dash — question bank
// Each item: { latex, bestTest, convergent, note }
// bestTest is one of the TEST IDs below.
// ============================================================

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

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const choose = arr => arr[Math.floor(Math.random() * arr.length)];

// ============================================================
// FIXED CURATED EXAMPLES — drawn from Stewart Ch.11 + lecture notes
// ============================================================

const FIXED_EXAMPLES = [
  // ---- Divergence Test (lim a_n != 0) ----
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n}{n+1}", bestTest: "divergence", convergent: false, note: "lim = 1" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n^2}{5n^2+4}", bestTest: "divergence", convergent: false, note: "lim = 1/5" },
  { latex: "\\sum_{n=1}^{\\infty} \\cos\\!\\left(\\frac{1}{n}\\right)", bestTest: "divergence", convergent: false, note: "lim = cos 0 = 1" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{2n}{\\sqrt{n^2+1}}", bestTest: "divergence", convergent: false, note: "lim = 2" },
  { latex: "\\sum_{n=1}^{\\infty} (-1)^n \\frac{n}{n+2}", bestTest: "divergence", convergent: false, note: "|a_n| -> 1, AST hyp fails" },
  { latex: "\\sum_{n=1}^{\\infty} \\arctan(n)", bestTest: "divergence", convergent: false, note: "lim = pi/2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{3n^4+1}{4n^4-n^2+2}", bestTest: "divergence", convergent: false, note: "lim = 3/4 (resist LCT urge)" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(1+\\frac{1}{n}\\right)^n", bestTest: "divergence", convergent: false, note: "lim = e" },
  { latex: "\\sum_{n=1}^{\\infty} 5^{1/n}", bestTest: "divergence", convergent: false, note: "lim = 1" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{1+\\left(\\frac{2}{3}\\right)^n}", bestTest: "divergence", convergent: false, note: "lim = 1" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{1}{n}\\right)^{1/n}", bestTest: "divergence", convergent: false, note: "n^{-1/n} -> 1" },

  // ---- Geometric Series (pure ar^n) ----
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{2^n}", bestTest: "geometric", convergent: true, note: "r = 1/2" },
  { latex: "\\sum_{n=0}^{\\infty} \\left(\\frac{2}{3}\\right)^n", bestTest: "geometric", convergent: true, note: "r = 2/3" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{3^{n+1}}{4^n}", bestTest: "geometric", convergent: true, note: "= 3 (3/4)^n" },
  { latex: "\\sum_{n=1}^{\\infty} (-1)^{n-1}\\!\\left(\\frac{4}{5}\\right)^n", bestTest: "geometric", convergent: true, note: "|r| = 4/5; geometric trumps AST" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{5^n}{2^{2n+1}}", bestTest: "geometric", convergent: false, note: "= (1/2)(5/4)^n, r > 1" },
  { latex: "\\sum_{n=1}^{\\infty} 2 \\cdot 7^{-n}", bestTest: "geometric", convergent: true, note: "constant times r^n" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{e^n}{\\pi^n}", bestTest: "geometric", convergent: true, note: "r = e/pi" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{(-3)^{n-1}}{4^n}", bestTest: "geometric", convergent: true, note: "r = -3/4" },

  // ---- p-Series (pure 1/n^p) ----
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2}", bestTest: "pSeries", convergent: true, note: "p = 2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{\\sqrt{n}}", bestTest: "pSeries", convergent: false, note: "p = 1/2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n}", bestTest: "pSeries", convergent: false, note: "harmonic" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^{3/2}}", bestTest: "pSeries", convergent: true, note: "p = 3/2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{\\sqrt[3]{n^2}}", bestTest: "pSeries", convergent: false, note: "p = 2/3" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^{1.001}}", bestTest: "pSeries", convergent: true, note: "p > 1 by hair" },
  { latex: "\\sum_{n=1}^{\\infty} n^{-\\pi}", bestTest: "pSeries", convergent: true, note: "p = pi" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{5}{n^4}", bestTest: "pSeries", convergent: true, note: "constant × p-series" },

  // ---- By Definition (telescoping) ----
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{1}{n} - \\frac{1}{n+1}\\right)", bestTest: "byDefinition", convergent: true, note: "telescopes to 1" },
  { latex: "\\sum_{n=1}^{\\infty} \\bigl(\\ln n - \\ln(n+1)\\bigr)", bestTest: "byDefinition", convergent: false, note: "S_N = -ln(N+1) -> -inf" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{1}{\\sqrt{n+2}} - \\frac{1}{\\sqrt{n+3}}\\right)", bestTest: "byDefinition", convergent: true, note: "telescopes" },
  { latex: "\\sum_{n=1}^{\\infty} \\bigl(\\arctan(n+1) - \\arctan(n)\\bigr)", bestTest: "byDefinition", convergent: true, note: "telescopes to pi/4" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{1}{2n-1} - \\frac{1}{2n+1}\\right)", bestTest: "byDefinition", convergent: true, note: "telescopes to 1" },
  { latex: "\\sum_{n=1}^{\\infty} \\ln\\!\\left(\\frac{n+1}{n}\\right)", bestTest: "byDefinition", convergent: false, note: "S_N = ln(N+1) -> inf" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{1}{(n+1)^2} - \\frac{1}{(n+2)^2}\\right)", bestTest: "byDefinition", convergent: true, note: "telescopes to 1/4" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\sqrt{n+1} - \\sqrt{n}\\right)", bestTest: "byDefinition", convergent: false, note: "S_N = sqrt(N+1) - 1 -> inf" },

  // ---- Integral Test ----
  { latex: "\\sum_{n=2}^{\\infty} \\frac{1}{n \\ln n}", bestTest: "integral", convergent: false, note: "antideriv ln ln n" },
  { latex: "\\sum_{n=2}^{\\infty} \\frac{1}{n (\\ln n)^2}", bestTest: "integral", convergent: true, note: "u = ln n -> 1/u^2" },
  { latex: "\\sum_{n=1}^{\\infty} n e^{-n^2}", bestTest: "integral", convergent: true, note: "u = n^2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{\\ln n}{n^2}", bestTest: "integral", convergent: true, note: "IBP" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2+1}", bestTest: "integral", convergent: true, note: "antideriv arctan" },
  { latex: "\\sum_{n=2}^{\\infty} \\frac{\\ln n}{n}", bestTest: "integral", convergent: false, note: "antideriv (ln x)^2/2" },
  { latex: "\\sum_{n=2}^{\\infty} \\frac{1}{n (\\ln n)(\\ln \\ln n)}", bestTest: "integral", convergent: false, note: "iterated logs" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{\\arctan n}{1+n^2}", bestTest: "integral", convergent: true, note: "u = arctan n" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2+4}", bestTest: "integral", convergent: true, note: "arctan-style" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^{\\ln n}}", bestTest: "integral", convergent: true, note: "u = ln x" },

  // ---- Direct Comparison Test ----
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^3+n+1}", bestTest: "dct", convergent: true, note: "<= 1/n^3 (positive correction)" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2+n+1}", bestTest: "dct", convergent: true, note: "<= 1/n^2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{|\\cos n|}{n^2}", bestTest: "dct", convergent: true, note: "<= 1/n^2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{\\sin^2 n}{n^2}", bestTest: "dct", convergent: true, note: "<= 1/n^2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n\\, 2^n}", bestTest: "dct", convergent: true, note: "<= 1/2^n" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^2 e^n}", bestTest: "dct", convergent: true, note: "trap: NOT ratio; <= 1/e^n" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{\\sqrt{n^4+1}}", bestTest: "dct", convergent: true, note: "<= 1/n^2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{\\arctan n}{n^2}", bestTest: "dct", convergent: true, note: "<= (pi/2)/n^2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{3^n+5}", bestTest: "dct", convergent: true, note: "<= 1/3^n" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{2+\\sin n}{n^3}", bestTest: "dct", convergent: true, note: "<= 3/n^3" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{|\\cos^3 n|}{n^{3/2}}", bestTest: "dct", convergent: true, note: "<= 1/n^{3/2}" },

  // ---- Limit Comparison Test ----
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n^3-n-1}", bestTest: "lct", convergent: true, note: "negative lower-order; LCT vs 1/n^3" },
  { latex: "\\sum_{n=2}^{\\infty} \\frac{1}{n^2-n}", bestTest: "lct", convergent: true, note: "neg. lower order; LCT vs 1/n^2" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{2n^2+3n}{\\sqrt{5+n^5}}", bestTest: "lct", convergent: false, note: "~ 1/n^{1/2}" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{\\sqrt{n+2}}{2n^2+n+1}", bestTest: "lct", convergent: true, note: "~ 1/n^{3/2}" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{2^n-1}", bestTest: "lct", convergent: true, note: "geom denom -1; LCT vs 1/2^n" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n^2-1}{3n^4+1}", bestTest: "lct", convergent: true, note: "~ 1/(3 n^2)" },
  { latex: "\\sum_{n=1}^{\\infty} \\sin\\!\\left(\\frac{1}{n}\\right)", bestTest: "lct", convergent: false, note: "~ 1/n" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(1-\\cos\\!\\frac{1}{n}\\right)", bestTest: "lct", convergent: true, note: "~ 1/(2 n^2)" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n+1}{n^3-3n+1}", bestTest: "lct", convergent: true, note: "negative lower-order; DCT bound fails" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{\\sqrt{n^2-1}}", bestTest: "lct", convergent: false, note: "~ 1/n" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{1}{n+\\sqrt{n}}", bestTest: "lct", convergent: false, note: "~ 1/n" },
  { latex: "\\sum_{n=1}^{\\infty} \\tan\\!\\left(\\frac{1}{n}\\right)", bestTest: "lct", convergent: false, note: "~ 1/n" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n^2-n+3}{n^4+2}", bestTest: "lct", convergent: true, note: "~ 1/n^2" },

  // ---- Alternating Series Test ----
  { latex: "\\sum_{n=1}^{\\infty} \\frac{(-1)^{n-1}}{n}", bestTest: "ast", convergent: true, note: "alt. harmonic" },
  { latex: "\\sum_{n=2}^{\\infty} \\frac{(-1)^n}{\\ln n}", bestTest: "ast", convergent: true, note: "1/ln n decreases to 0" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{\\cos(n\\pi)}{\\sqrt{n+1}}", bestTest: "ast", convergent: true, note: "cos(n pi) = (-1)^n" },
  { latex: "\\sum_{n=1}^{\\infty} (-1)^n \\sin\\!\\left(\\frac{\\pi}{2n}\\right)", bestTest: "ast", convergent: true, note: "sin(pi/2n) decreasing to 0" },
  { latex: "\\sum_{n=1}^{\\infty} (-1)^{n-1} \\frac{n}{n^2+1}", bestTest: "ast", convergent: true, note: "n/(n^2+1) -> 0" },
  { latex: "\\sum_{n=1}^{\\infty} (-1)^n \\frac{\\ln n}{n}", bestTest: "ast", convergent: true, note: "ln(n)/n -> 0 (n>=3)" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{2n+1}", bestTest: "ast", convergent: true, note: "Leibniz pi/4" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{(-1)^n}{\\sqrt{n}}", bestTest: "ast", convergent: true, note: "1/sqrt(n) -> 0" },
  { latex: "\\sum_{n=1}^{\\infty} (-1)^n \\arctan\\!\\left(\\frac{1}{n}\\right)", bestTest: "ast", convergent: true, note: "arctan(1/n) -> 0" },

  // ---- Ratio Test ----
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n^2}{3^n}", bestTest: "ratio", convergent: true, note: "rho = 1/3" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n!}{(-3)^n}", bestTest: "ratio", convergent: false, note: "rho = inf" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n^4}{n!}", bestTest: "ratio", convergent: true, note: "rho = 0" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{4^n}{n^4}", bestTest: "ratio", convergent: false, note: "rho = 4" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{(2n)!}{(n!)^2}", bestTest: "ratio", convergent: false, note: "rho = 4" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{(-1)^n n^3}{5^n}", bestTest: "ratio", convergent: true, note: "rho = 1/5" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n^n}{n!}", bestTest: "ratio", convergent: false, note: "rho = e" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{2^n n!}{n^n}", bestTest: "ratio", convergent: true, note: "rho = 2/e" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{(n!)^2}{(2n)!}", bestTest: "ratio", convergent: true, note: "rho = 1/4" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n!}{n^n}", bestTest: "ratio", convergent: true, note: "rho = 1/e" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{n!}{e^{n^2}}", bestTest: "ratio", convergent: true, note: "rho = 0 (e^{2n+1} dominates)" },

  // ---- Root Test ----
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{n+2}{4n+1}\\right)^n", bestTest: "root", convergent: true, note: "rho = 1/4" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{2n+3}{3n+2}\\right)^n", bestTest: "root", convergent: true, note: "rho = 2/3" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{n}{n+1}\\right)^{n^2}", bestTest: "root", convergent: true, note: "rho = 1/e" },
  { latex: "\\sum_{n=2}^{\\infty} \\frac{1}{(\\ln n)^n}", bestTest: "root", convergent: true, note: "rho = 0" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{n+1}{2n+3}\\right)^{-3n}", bestTest: "root", convergent: false, note: "rho = 8 (trap: looks ratio)" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(1-\\frac{1}{n}\\right)^{n^2}", bestTest: "root", convergent: true, note: "rho = 1/e" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{3n+1}{5n-2}\\right)^{2n}", bestTest: "root", convergent: true, note: "rho = 9/25" },
  { latex: "\\sum_{n=1}^{\\infty} \\frac{2^n}{n^n}", bestTest: "root", convergent: true, note: "rho = 0 (root cleaner than ratio)" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\arctan n\\right)^n", bestTest: "root", convergent: false, note: "rho = pi/2 > 1" },
  { latex: "\\sum_{n=1}^{\\infty} \\left(\\frac{3n-1}{2n+5}\\right)^n", bestTest: "root", convergent: false, note: "rho = 3/2" },
];

// ============================================================
// DYNAMIC GENERATORS — randomized templates per test type
// Each generator returns { latex, bestTest, convergent, note }
// ============================================================

const GENERATORS = {
  divergence: [
    () => {
      const k = rand(1, 9);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{n}{n+${k}}`, bestTest: 'divergence', convergent: false, note: 'lim = 1' };
    },
    () => {
      const a = rand(2, 9), b = rand(1, 9), c = rand(2, 9), d = rand(1, 9);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{${a}n+${b}}{${c}n+${d}}`, bestTest: 'divergence', convergent: false, note: `lim = ${a}/${c}` };
    },
    () => {
      const p = rand(2, 4), a = rand(2, 6), b = rand(2, 6), k = rand(1, 9);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{${a}n^{${p}}}{${b}n^{${p}}+${k}}`, bestTest: 'divergence', convergent: false, note: `lim = ${a}/${b}` };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\cos\\!\\left(\\frac{1}{n}\\right)`, bestTest: 'divergence', convergent: false, note: 'lim = 1' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\arctan(n)`, bestTest: 'divergence', convergent: false, note: 'lim = pi/2' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\left(1+\\frac{1}{n}\\right)^{n}`, bestTest: 'divergence', convergent: false, note: 'lim = e' }),
    () => {
      const k = rand(2, 9);
      return { latex: `\\sum_{n=1}^{\\infty} \\sqrt[n]{${k}}`, bestTest: 'divergence', convergent: false, note: `lim ${k}^{1/n} = 1` };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} n \\sin\\!\\left(\\frac{1}{n}\\right)`, bestTest: 'divergence', convergent: false, note: 'lim = 1' }),
    () => {
      const k = rand(2, 9);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{\\ln(${k}n)}{\\ln(n)}`, bestTest: 'divergence', convergent: false, note: 'lim = 1' };
    },
  ],

  geometric: [
    () => {
      const a = rand(1, 4), b = rand(5, 9);
      const sign = choose(['', '-']);
      return { latex: `\\sum_{n=0}^{\\infty} \\left(${sign}\\frac{${a}}{${b}}\\right)^{n}`, bestTest: 'geometric', convergent: true, note: `|r| = ${a}/${b} < 1` };
    },
    () => {
      const a = rand(2, 5), b = rand(6, 12);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{${a}^{n}}{${b}^{n}}`, bestTest: 'geometric', convergent: true, note: `r = ${a}/${b}` };
    },
    () => {
      const a = rand(2, 5), b = rand(6, 12), c = rand(1, 3), d = rand(1, 3);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{${a}^{n+${c}}}{${b}^{n-${d}}}`, bestTest: 'geometric', convergent: true, note: `~ const × (${a}/${b})^n` };
    },
    () => {
      const c = rand(2, 9), a = rand(1, 4), b = rand(5, 9);
      return { latex: `\\sum_{n=1}^{\\infty} ${c}\\left(\\frac{${a}}{${b}}\\right)^{n}`, bestTest: 'geometric', convergent: true, note: `c × r^n, |r|<1` };
    },
    () => {
      const a = rand(3, 5);
      return { latex: `\\sum_{n=0}^{\\infty} \\left(-\\frac{${a}}{2}\\right)^{n}`, bestTest: 'geometric', convergent: false, note: `|r| = ${a}/2 > 1` };
    },
    () => {
      const k = rand(2, 5);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{1}{${k}^{n}}`, bestTest: 'geometric', convergent: true, note: `r = 1/${k}` };
    },
    () => {
      const a = rand(2, 4);
      const b = a + rand(1, 3);
      return { latex: `\\sum_{n=0}^{\\infty} \\frac{${a}^{n}}{${b}^{n+1}}`, bestTest: 'geometric', convergent: true, note: `~ (1/${b}) × (${a}/${b})^n` };
    },
  ],

  pSeries: [
    () => {
      const opts = [
        { p: '2', conv: true }, { p: '3', conv: true }, { p: '4', conv: true },
        { p: '\\frac{3}{2}', conv: true }, { p: '\\frac{5}{2}', conv: true },
        { p: '\\frac{4}{3}', conv: true }, { p: '\\frac{2}{3}', conv: false },
        { p: '\\frac{1}{3}', conv: false }, { p: '\\frac{3}{4}', conv: false },
      ];
      const o = choose(opts);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{1}{n^{${o.p}}}`, bestTest: 'pSeries', convergent: o.conv, note: `p = ${o.p}` };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{n}`, bestTest: 'pSeries', convergent: false, note: 'harmonic' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{\\sqrt{n}}`, bestTest: 'pSeries', convergent: false, note: 'p = 1/2' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{\\sqrt[3]{n^2}}`, bestTest: 'pSeries', convergent: false, note: 'p = 2/3' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{n\\sqrt{n}}`, bestTest: 'pSeries', convergent: true, note: 'p = 3/2' }),
    () => {
      const c = rand(2, 9);
      const p = choose([2, 3, 4]);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{${c}}{n^{${p}}}`, bestTest: 'pSeries', convergent: true, note: `c × p-series, p=${p}` };
    },
  ],

  byDefinition: [
    () => {
      const opts = [
        { p: '1', conv: true }, { p: '\\frac{1}{2}', conv: true },
        { p: '\\frac{1}{3}', conv: true }, { p: '2', conv: true }, { p: '3', conv: true },
      ];
      const o = choose(opts);
      return { latex: `\\sum_{n=1}^{\\infty} \\left(\\frac{1}{n^{${o.p}}}-\\frac{1}{(n+1)^{${o.p}}}\\right)`, bestTest: 'byDefinition', convergent: o.conv, note: 'telescopes' };
    },
    () => {
      const a = rand(0, 5);
      return { latex: `\\sum_{n=1}^{\\infty} \\left(\\frac{1}{\\sqrt{n+${a}}}-\\frac{1}{\\sqrt{n+${a + 1}}}\\right)`, bestTest: 'byDefinition', convergent: true, note: 'telescopes' };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\bigl(\\ln n - \\ln(n+1)\\bigr)`, bestTest: 'byDefinition', convergent: false, note: 'S_N = -ln(N+1)' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\ln\\!\\left(\\frac{n+1}{n}\\right)`, bestTest: 'byDefinition', convergent: false, note: 'S_N = ln(N+1)' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\bigl(\\arctan(n+1) - \\arctan(n)\\bigr)`, bestTest: 'byDefinition', convergent: true, note: 'telescopes to pi/4' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\left(\\frac{1}{2n-1}-\\frac{1}{2n+1}\\right)`, bestTest: 'byDefinition', convergent: true, note: 'telescopes to 1' }),
    () => {
      const a = rand(0, 3);
      return { latex: `\\sum_{n=1}^{\\infty} \\left(\\frac{1}{(n+${a})^2}-\\frac{1}{(n+${a + 1})^2}\\right)`, bestTest: 'byDefinition', convergent: true, note: 'telescopes' };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\left(\\sqrt{n+1}-\\sqrt{n}\\right)`, bestTest: 'byDefinition', convergent: false, note: 'S_N = sqrt(N+1) - 1' }),
  ],

  integral: [
    () => ({ latex: `\\sum_{n=2}^{\\infty} \\frac{1}{n \\ln n}`, bestTest: 'integral', convergent: false, note: 'antideriv ln ln n' }),
    () => {
      const p = choose(['2', '3', '\\frac{3}{2}']);
      return { latex: `\\sum_{n=2}^{\\infty} \\frac{1}{n (\\ln n)^{${p}}}`, bestTest: 'integral', convergent: true, note: 'u = ln n -> p>1' };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} n e^{-n^{2}}`, bestTest: 'integral', convergent: true, note: 'u = n^2' }),
    () => {
      const p = choose([2, 3, 4]);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{\\ln n}{n^{${p}}}`, bestTest: 'integral', convergent: true, note: 'IBP' };
    },
    () => ({ latex: `\\sum_{n=2}^{\\infty} \\frac{1}{n \\sqrt{\\ln n}}`, bestTest: 'integral', convergent: false, note: 'u = ln n -> 1/sqrt(u)' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{\\arctan n}{1+n^{2}}`, bestTest: 'integral', convergent: true, note: 'u = arctan n' }),
    () => {
      const k = rand(1, 9);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{1}{n^2+${k}}`, bestTest: 'integral', convergent: true, note: 'arctan-style' };
    },
  ],

  dct: [
    () => {
      const p = choose(['2', '3', '\\frac{3}{2}', '4']);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{|\\cos n|}{n^{${p}}}`, bestTest: 'dct', convergent: true, note: '|cos n| <= 1' };
    },
    () => {
      const p = choose(['2', '3', '\\frac{5}{2}']);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{\\sin^{2} n}{n^{${p}}}`, bestTest: 'dct', convergent: true, note: '<= 1/n^p' };
    },
    () => {
      const p1 = rand(2, 3);
      const p2 = p1 + rand(1, 2);
      const a = rand(1, 5), b = rand(1, 5), c = rand(1, 5);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{n^{${p1}}+${a}}{n^{${p2}}+${b}n+${c}}`, bestTest: 'dct', convergent: (p2 - p1) > 1, note: 'positive lower-order; clean DCT' };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{2^{n}+n}`, bestTest: 'dct', convergent: true, note: '<= 1/2^n' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{1}{n!+n^{2}}`, bestTest: 'dct', convergent: true, note: '<= 1/n!' }),
    () => {
      const k = rand(2, 4);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{1}{${k}^{n}+n^{3}}`, bestTest: 'dct', convergent: true, note: `<= 1/${k}^n` };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{2+\\sin n}{n^{3}}`, bestTest: 'dct', convergent: true, note: 'numer <= 3' }),
    () => {
      const p = rand(2, 4);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{\\arctan n}{n^{${p}}}`, bestTest: 'dct', convergent: true, note: '<= (pi/2)/n^p' };
    },
    () => {
      const k = rand(1, 5);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{1}{n^{2}+${k}n+1}`, bestTest: 'dct', convergent: true, note: '<= 1/n^2' };
    },
  ],

  lct: [
    () => {
      const a = rand(2, 6), b = rand(2, 6), c = rand(1, 5);
      return { latex: `\\sum_{n=2}^{\\infty} \\frac{n+${a}}{n^{3}-${b}n+${c}}`, bestTest: 'lct', convergent: true, note: 'neg. lower order; ~ 1/n^2' };
    },
    () => {
      const a = rand(2, 5), b = rand(1, 4);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{1}{\\sqrt{n^{2}-${a}n+${b}}}`, bestTest: 'lct', convergent: false, note: '~ 1/n' };
    },
    () => {
      const a = rand(2, 7), b = rand(1, 6);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{n^{2}+1}{n^{4}-${a}n+${b}}`, bestTest: 'lct', convergent: true, note: '~ 1/n^2' };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\sin\\!\\left(\\frac{1}{n}\\right)`, bestTest: 'lct', convergent: false, note: '~ 1/n' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\left(1-\\cos\\!\\left(\\frac{1}{n}\\right)\\right)`, bestTest: 'lct', convergent: true, note: '~ 1/(2 n^2)' }),
    () => {
      const k = choose(['', '^{2}', '^{3}']);
      return { latex: `\\sum_{n=1}^{\\infty} \\tan\\!\\left(\\frac{1}{n${k}}\\right)`, bestTest: 'lct', convergent: k !== '', note: '~ 1/n^k' };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\left(\\sqrt{n^{2}+1}-n\\right)`, bestTest: 'lct', convergent: false, note: '~ 1/(2n)' }),
    () => {
      const a = rand(2, 5), b = rand(1, 4);
      return { latex: `\\sum_{n=2}^{\\infty} \\frac{${a}n+1}{n^{2}-${b}n+1}`, bestTest: 'lct', convergent: false, note: '~ ${a}/n' };
    },
    () => {
      const a = rand(1, 4);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{1}{2^{n}-${a}}`, bestTest: 'lct', convergent: true, note: '~ 1/2^n; DCT bound fails' };
    },
  ],

  ast: [
    () => {
      const opts = [
        { p: '', conv: true, note: 'alt. harmonic' },
        { p: '^{2}', conv: true, note: '1/n^2' },
        { p: '^{3}', conv: true, note: '1/n^3' },
        { p: '^{1/2}', conv: true, note: '1/sqrt(n)' },
        { p: '^{3/2}', conv: true, note: '1/n^{3/2}' },
      ];
      const o = choose(opts);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{(-1)^{n}}{n${o.p}}`, bestTest: 'ast', convergent: o.conv, note: o.note };
    },
    () => ({ latex: `\\sum_{n=2}^{\\infty} \\frac{(-1)^{n+1}}{\\ln n}`, bestTest: 'ast', convergent: true, note: '1/ln n -> 0' }),
    () => {
      const k = rand(1, 5);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{(-1)^{n}}{2n+${k}}`, bestTest: 'ast', convergent: true, note: '1/(2n+k) -> 0' };
    },
    () => {
      const denom = choose(['n', 'n+1', '2n-1', 'n^{2}', '\\sqrt{n}']);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{\\cos(n\\pi)}{${denom}}`, bestTest: 'ast', convergent: true, note: 'cos(n pi) = (-1)^n' };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} (-1)^{n} \\sin\\!\\left(\\frac{1}{n}\\right)`, bestTest: 'ast', convergent: true, note: 'sin(1/n) -> 0' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{\\sqrt{n+1}}`, bestTest: 'ast', convergent: true, note: '1/sqrt(n+1) -> 0' }),
    () => ({ latex: `\\sum_{n=2}^{\\infty} (-1)^{n} \\frac{\\ln n}{n}`, bestTest: 'ast', convergent: true, note: 'ln n / n -> 0 eventually' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} (-1)^{n}\\,\\frac{n}{n^{2}+1}`, bestTest: 'ast', convergent: true, note: 'n/(n^2+1) -> 0' }),
  ],

  ratio: [
    () => {
      const k = rand(2, 5);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{n!}{${k}^{n}}`, bestTest: 'ratio', convergent: false, note: 'rho = inf' };
    },
    () => {
      const k = rand(2, 9);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{${k}^{n}}{n!}`, bestTest: 'ratio', convergent: true, note: 'rho = 0' };
    },
    () => {
      const p = rand(2, 4), k = rand(2, 5);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{n^{${p}} \\cdot ${k}^{n}}{n!}`, bestTest: 'ratio', convergent: true, note: 'rho = 0' };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{(n!)^{2}}{(2n)!}`, bestTest: 'ratio', convergent: true, note: 'rho = 1/4' }),
    () => {
      const k = rand(2, 5), p = rand(1, 3);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{(-${k})^{n}}{n^{${p}} \\cdot n!}`, bestTest: 'ratio', convergent: true, note: 'rho = 0 (abs)' };
    },
    () => {
      const p = rand(2, 5), k = rand(2, 5);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{n^{${p}}}{${k}^{n}}`, bestTest: 'ratio', convergent: true, note: `rho = 1/${k}` };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{n^{n}}{n!}`, bestTest: 'ratio', convergent: false, note: 'rho = e' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{n!}{n^{n}}`, bestTest: 'ratio', convergent: true, note: 'rho = 1/e' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{2^{n} n!}{n^{n}}`, bestTest: 'ratio', convergent: true, note: 'rho = 2/e' }),
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\frac{3^{n} n!}{n^{n}}`, bestTest: 'ratio', convergent: false, note: 'rho = 3/e' }),
  ],

  root: [
    () => {
      const a = rand(2, 6), b = rand(1, 5), c = rand(2, 6), d = rand(1, 5);
      // Avoid degenerate equal coefficients
      const conv = a < c;
      return { latex: `\\sum_{n=1}^{\\infty} \\left(\\frac{${a}n+${b}}{${c}n+${d}}\\right)^{n}`, bestTest: 'root', convergent: conv, note: `rho = ${a}/${c}` };
    },
    () => {
      const a = rand(2, 5), b = rand(2, 4), k = rand(2, 4);
      const conv = 1 < b; // (1/b)^something; need b >= 2 (always here)
      return { latex: `\\sum_{n=1}^{\\infty} \\left(\\frac{n^{2}+${a}}{${b}n^{2}+${k}n+1}\\right)^{n}`, bestTest: 'root', convergent: conv, note: `rho = 1/${b}` };
    },
    () => {
      const a = rand(1, 3), b = rand(5, 9), k = rand(2, 4);
      return { latex: `\\sum_{n=1}^{\\infty} \\left(\\frac{${a}n+1}{${b}n+2}\\right)^{${k}n}`, bestTest: 'root', convergent: true, note: `rho = (${a}/${b})^${k}` };
    },
    () => {
      const a = rand(2, 4), b = rand(5, 9);
      return { latex: `\\sum_{n=1}^{\\infty} \\left(\\frac{${b}n+1}{${a}n+1}\\right)^{-3n}`, bestTest: 'root', convergent: true, note: `rho = (${a}/${b})^3 < 1` };
    },
    () => ({ latex: `\\sum_{n=2}^{\\infty} \\frac{1}{(\\ln n)^{n}}`, bestTest: 'root', convergent: true, note: 'rho = 0' }),
    () => {
      const k = rand(1, 5);
      return { latex: `\\sum_{n=1}^{\\infty} \\left(\\frac{n}{n+${k}}\\right)^{n^{2}}`, bestTest: 'root', convergent: true, note: `rho = e^{-${k}}` };
    },
    () => {
      const k = rand(2, 5);
      return { latex: `\\sum_{n=1}^{\\infty} \\frac{n^{n}}{(${k}n)^{n}}`, bestTest: 'root', convergent: true, note: `rho = 1/${k}` };
    },
    () => ({ latex: `\\sum_{n=1}^{\\infty} \\left(\\arctan n\\right)^{n}`, bestTest: 'root', convergent: false, note: 'rho = pi/2' }),
  ],
};

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

function pickGenerated() {
  const keys = Object.keys(WEIGHTS);
  let total = 0;
  for (const k of keys) total += WEIGHTS[k];
  let r = Math.random() * total;
  let chosen = keys[0];
  for (const k of keys) {
    r -= WEIGHTS[k];
    if (r <= 0) { chosen = k; break; }
  }
  const subs = GENERATORS[chosen];
  return choose(subs)();
}

function pickFixed() {
  return Object.assign({}, choose(FIXED_EXAMPLES));
}

function pickSeries() {
  // Mix curated (40%) with dynamic (60%) so players see canonical examples often
  return Math.random() < 0.6 ? pickGenerated() : pickFixed();
}

window.SeriesLibrary = {
  TESTS,
  pickSeries,
  pickGenerated,
  pickFixed,
  FIXED_EXAMPLES,
  GENERATORS,
};
