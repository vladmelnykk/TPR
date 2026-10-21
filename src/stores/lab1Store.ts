import { create } from 'zustand';

/* ──────────────── types ──────────────── */
export interface Lab1State {
  /** Payoff matrix – rows = alternatives, cols = states of nature */
  matrix: number[][];
  /** Probability for each state of nature */
  probabilities: number[];
  /** Hurwicz pessimism–optimism coefficient (0 = optimist, 1 = pessimist) */
  q: number;

  /* ── actions ── */
  setCell: (row: number, col: number, value: number) => void;
  setProbability: (col: number, value: number) => void;
  setQ: (value: number) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
  addCol: () => void;
  removeCol: (index: number) => void;
}

/* ──────────── default data ──────────── */
const DEFAULT_MATRIX: number[][] = [
  [30, 90, 100],
  [95, 20, 30],
  [85, 80, 75],
];
const DEFAULT_PROBABILITIES = [0.4, 0.3, 0.3];
const DEFAULT_Q = 0.5;

/* ──────────── store ──────────── */
export const useLab1Store = create<Lab1State>((set) => ({
  matrix: DEFAULT_MATRIX,
  probabilities: DEFAULT_PROBABILITIES,
  q: DEFAULT_Q,

  setCell: (row, col, value) =>
    set((s) => {
      const m = s.matrix.map((r) => [...r]);
      m[row][col] = value;
      return { matrix: m };
    }),

  setProbability: (col, value) =>
    set((s) => {
      const p = [...s.probabilities];
      p[col] = value;
      return { probabilities: p };
    }),

  setQ: (value) => set({ q: value }),

  addRow: () =>
    set((s) => ({
      matrix: [...s.matrix, new Array(s.probabilities.length).fill(0)],
    })),

  removeRow: (index) =>
    set((s) => ({
      matrix: s.matrix.filter((_, i) => i !== index),
    })),

  addCol: () =>
    set((s) => ({
      matrix: s.matrix.map((r) => [...r, 0]),
      probabilities: [...s.probabilities, 0],
    })),

  removeCol: (index) =>
    set((s) => ({
      matrix: s.matrix.map((r) => r.filter((_, i) => i !== index)),
      probabilities: s.probabilities.filter((_, i) => i !== index),
    })),
}));

/* ──────── selectors / derived ──────── */

/** Maximax: max_i max_j a_ij */
export function calcMaximax(matrix: number[][]) {
  const rowMaxes = matrix.map((r) => Math.max(...r));
  const best = Math.max(...rowMaxes);
  const bestIdx = rowMaxes.indexOf(best);
  return { values: rowMaxes, best, bestIdx };
}

/** Wald (maximin): max_i min_j a_ij */
export function calcWald(matrix: number[][]) {
  const rowMins = matrix.map((r) => Math.min(...r));
  const best = Math.max(...rowMins);
  const bestIdx = rowMins.indexOf(best);
  return { values: rowMins, best, bestIdx };
}

/** Hurwicz: max_i { q·min_j a_ij + (1‑q)·max_j a_ij } */
export function calcHurwicz(matrix: number[][], q: number) {
  const values = matrix.map(
    (r) => q * Math.min(...r) + (1 - q) * Math.max(...r),
  );
  const best = Math.max(...values);
  const bestIdx = values.indexOf(best);
  return { values, best, bestIdx };
}

/** Bayes–Laplace: max_i Σ_j (a_ij · p_j) */
export function calcBayesLaplace(matrix: number[][], probabilities: number[]) {
  const values = matrix.map((r) =>
    r.reduce((sum, val, j) => sum + val * (probabilities[j] ?? 0), 0),
  );
  const best = Math.max(...values);
  const bestIdx = values.indexOf(best);
  return { values, best, bestIdx };
}
