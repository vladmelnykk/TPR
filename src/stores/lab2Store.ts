import { create } from 'zustand';

/* ──────────────── types ──────────────── */
export interface Lab2State {
  /** Payoff matrix – rows = strategies, cols = states of nature */
  matrix: number[][];
  /** Probability for each state of nature */
  probabilities: number[];

  /* ── actions ── */
  setCell: (row: number, col: number, value: number) => void;
  setProbability: (col: number, value: number) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
  addCol: () => void;
  removeCol: (index: number) => void;
}

/* ──────────── default data ──────────── */
const DEFAULT_MATRIX: number[][] = [
  [100, 40, -50],
  [80, 90, 50],
  [40, 60, 120],
];
const DEFAULT_PROBABILITIES = [0.5, 0.3, 0.2];

/* ──────────── store ──────────── */
export const useLab2Store = create<Lab2State>((set) => ({
  matrix: DEFAULT_MATRIX,
  probabilities: DEFAULT_PROBABILITIES,

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

/**
 * Критерій очікуваного значення (КОЗ):
 * MV_i = Σ_j (a_ij · p_j)
 * Найкраща: max MV_i
 */
export function calcExpectedValue(matrix: number[][], probabilities: number[]) {
  const values = matrix.map((row) =>
    row.reduce((sum, val, j) => sum + val * (probabilities[j] ?? 0), 0),
  );
  const best = Math.max(...values);
  const bestIdx = values.indexOf(best);
  return { values, best, bestIdx };
}

/**
 * Критерій мінімаксного ризику Севіджа:
 * 1. max(F_j) per column
 * 2. r_ij = max(F_j) - a_ij
 * 3. max_r_i = max_j(r_ij)
 * Найкраща: min max_r_i
 */
export function calcSavage(matrix: number[][]) {
  if (matrix.length === 0 || matrix[0].length === 0) {
    return { riskMatrix: [] as number[][], maxRisks: [] as number[], best: 0, bestIdx: 0 };
  }

  const numCols = matrix[0].length;

  // max value in each column
  const colMaxes: number[] = [];
  for (let j = 0; j < numCols; j++) {
    colMaxes.push(Math.max(...matrix.map((row) => row[j])));
  }

  // risk matrix: r_ij = max(F_j) - a_ij
  const riskMatrix = matrix.map((row) =>
    row.map((val, j) => colMaxes[j] - val),
  );

  // max risk per row
  const maxRisks = riskMatrix.map((row) => Math.max(...row));

  // best = min of max risks
  const best = Math.min(...maxRisks);
  const bestIdx = maxRisks.indexOf(best);

  return { riskMatrix, maxRisks, best, bestIdx };
}

/**
 * Комбінація очікуваного значення і дисперсії (стабільність):
 * D_i = Σ_j ( (a_ij - MV_i)^2 · p_j )
 * σ_i = √D_i
 * V_i = (σ_i / |MV_i|) · 100  (coefficient of variation, %)
 */
export function calcVariance(matrix: number[][], probabilities: number[]) {
  const ev = calcExpectedValue(matrix, probabilities);

  const dispersions = matrix.map((row, i) => {
    const mv = ev.values[i];
    return row.reduce(
      (sum, val, j) => sum + Math.pow(val - mv, 2) * (probabilities[j] ?? 0),
      0,
    );
  });

  const stdDevs = dispersions.map((d) => Math.sqrt(d));

  const cvs = ev.values.map((mv, i) =>
    mv !== 0 ? (stdDevs[i] / Math.abs(mv)) * 100 : Number.NaN,
  );

  // Best stability: lowest CV (among those with positive MV)
  const bestCvIdx = cvs.reduce(
    (minIdx, cv, i) =>
      ev.values[i] > 0 && Number.isFinite(cv) && (minIdx < 0 || cv < cvs[minIdx]) ? i : minIdx,
    -1,
  );

  return {
    expectedValues: ev.values,
    dispersions,
    stdDevs,
    cvs,
    bestEvIdx: ev.bestIdx,
    bestCvIdx,
  };
}
