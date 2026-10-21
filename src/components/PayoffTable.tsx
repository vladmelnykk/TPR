import ProbabilityNotice from './ProbabilityNotice'
import type { ChangeEvent } from 'react'
import { useLab1Store } from '../stores/lab1Store'

export default function PayoffTable() {
  const {
    matrix,
    probabilities,
    q,
    setCell,
    setProbability,
    setQ,
    addRow,
    removeRow,
    addCol,
    removeCol
  } = useLab1Store()

  const numRows = matrix.length
  const numCols = probabilities.length

  const handleCell = (r: number, c: number, e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === '' || e.target.value === '-' ? 0 : Number(e.target.value)
    if (Number.isFinite(v)) setCell(r, c, v)
  }

  const handleProb = (c: number, e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === '' ? 0 : Number(e.target.value)
    if (Number.isFinite(v)) setProbability(c, v)
  }

  const handleQ = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (!Number.isNaN(v) && v >= 0 && v <= 1) setQ(v)
  }

  const probSum = probabilities.reduce((a, b) => a + b, 0)
  const probSumOk = probabilities.every(p => p >= 0 && p <= 1) && Math.abs(probSum - 1) < 0.001
  return (
    <div className="space-y-4">
      {/* ─── Table ─── */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <th className="px-3 py-2 text-left font-semibold">A / F</th>
              {Array.from({ length: numCols }, (_, j) => (
                <th key={j} className="px-3 py-2 font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    F{j + 1}
                    {numCols > 1 && (
                      <button
                        onClick={() => removeCol(j)}
                        className="ml-1 text-red-400 hover:text-red-600 text-xs leading-none"
                        title={`Видалити сценарій F${j + 1}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2">
                <button
                  onClick={addCol}
                  className="rounded-md bg-indigo-500 px-2 py-0.5 text-xs text-white hover:bg-indigo-600 transition-colors"
                >
                  + Сценарій
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {matrix.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    A{i + 1}
                    {numRows > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        className="text-red-400 hover:text-red-600 text-xs leading-none"
                        title={`Видалити альтернативу A${i + 1}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>
                {row.map((val, j) => (
                  <td key={j} className="px-2 py-1">
                    <input
                      type="number"
                      aria-label={`Виграш A${i + 1} за сценарію F${j + 1}`}
                      value={val}
                      onChange={e => handleCell(i, j, e)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-gray-100 transition-colors"
                    />
                  </td>
                ))}
                <td />
              </tr>
            ))}
          </tbody>

          {/* Probability row */}
          <tfoot>
            <tr className="bg-indigo-50 dark:bg-indigo-900/30">
              <td className="px-3 py-2 font-semibold text-indigo-700 dark:text-indigo-300">p(j)</td>
              {probabilities.map((p, j) => (
                <td key={j} className="px-2 py-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    aria-label={`Ймовірність сценарію F${j + 1}`}
                    value={p}
                    onChange={e => handleProb(j, e)}
                    className="w-full rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-gray-100 transition-colors"
                  />
                </td>
              ))}

              <td
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 my-2 text-xs font-medium ${
                  probSumOk
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                }`}
              >
                {probSumOk ? '✓' : '⚠'} Σ = {probSum.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ProbabilityNotice probabilities={probabilities} />

      {/* ─── Controls row ─── */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={addRow}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
        >
          + Альтернатива
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="hurwicz-q" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Коефіцієнт Гурвіца (q):
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            id="hurwicz-q"
            value={q}
            onChange={handleQ}
            className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-gray-100 transition-colors"
          />
          <input
            aria-label="Коефіцієнт песимізму Гурвіца"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={q}
            onChange={handleQ}
            className="w-32"
          />
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        q = {q}: вага найгіршого результату — {(q * 100).toFixed(0)}%,
        найкращого — {((1 - q) * 100).toFixed(0)}%. Впливає лише на критерій Гурвіца.
      </p>
    </div>
  )
}
