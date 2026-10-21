import type { ChangeEvent } from 'react'
import { calcExpectedValue, calcSavage, calcVariance, useLab2Store } from '../stores/lab2Store'

export default function Lab2Page() {
  const { matrix, probabilities, setCell, setProbability, addRow, removeRow, addCol, removeCol } =
    useLab2Store()

  const numRows = matrix.length
  const numCols = probabilities.length

  const handleCell = (r: number, c: number, e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === '' || e.target.value === '-' ? 0 : Number(e.target.value)
    if (!Number.isNaN(v)) setCell(r, c, v)
  }

  const handleProb = (c: number, e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === '' ? 0 : Number(e.target.value)
    if (!Number.isNaN(v)) setProbability(c, v)
  }

  const probSum = probabilities.reduce((a, b) => a + b, 0)
  const probSumOk = Math.abs(probSum - 1) < 0.001

  /* ── computations ── */
  const hasData = numRows > 0 && numCols > 0
  const ev = hasData ? calcExpectedValue(matrix, probabilities) : null
  const savage = hasData ? calcSavage(matrix) : null
  const variance = hasData ? calcVariance(matrix, probabilities) : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Вибір рішення в умовах ризику
        </h1>
      </div>

      {/* ─── Payoff Table ─── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
          Матриця виграшів
        </h2>

        <div className="space-y-4">
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
                            title="Видалити стовпець"
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
                      + F
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {matrix.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        A{i + 1}
                        {numRows > 1 && (
                          <button
                            onClick={() => removeRow(i)}
                            className="text-red-400 hover:text-red-600 text-xs leading-none"
                            title="Видалити рядок"
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
                  <td className="px-3 py-2 font-semibold text-indigo-700 dark:text-indigo-300">
                    p(j)
                  </td>
                  {probabilities.map((p, j) => (
                    <td key={j} className="px-2 py-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={p}
                        onChange={e => handleProb(j, e)}
                        className="w-full rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-gray-100 transition-colors"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        probSumOk
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {probSumOk ? '✓' : '⚠'} Σ = {probSum.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add row button */}
          <button
            onClick={addRow}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
          >
            + Стратегія
          </button>
        </div>
      </section>

      {/* ─── Results ─── */}
      {hasData && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Результати за критеріями
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* ── Card 1: Expected Value (КОЗ) ── */}
            {ev && (
              <div className="rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  Критерій очікуваного значення
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                  MV_i = Σⱼ(aᵢⱼ · pⱼ) → max
                </p>

                <div className="mt-3 space-y-1">
                  {ev.values.map((v, i) => {
                    const isBest = i === ev.bestIdx
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          isBest
                            ? 'bg-emerald-100 dark:bg-emerald-800/40 font-bold text-emerald-700 dark:text-emerald-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span>A{i + 1}</span>
                        <span>{v.toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 px-3 py-2 text-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Найкраща: </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    A{ev.bestIdx + 1}
                  </span>
                  <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                    ({ev.best.toFixed(2)})
                  </span>
                </div>
              </div>
            )}

            {/* ── Card 2: Savage Minimax Regret ── */}
            {savage && (
              <div className="rounded-xl border-2 border-sky-300 dark:border-sky-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  Критерій Севіджа
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                  rᵢⱼ = max(Fⱼ) − aᵢⱼ → min maxⱼ rᵢⱼ
                </p>

                {/* Risk matrix (compact) */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 dark:text-gray-400">
                        <th className="py-1 pr-2 text-left font-medium">Ризик</th>
                        {savage.riskMatrix[0]?.map((_, j) => (
                          <th key={j} className="py-1 px-1 font-medium text-center">
                            F{j + 1}
                          </th>
                        ))}
                        <th className="py-1 pl-2 font-medium text-center">max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savage.riskMatrix.map((row, i) => {
                        const isBest = i === savage.bestIdx
                        return (
                          <tr
                            key={i}
                            className={
                              isBest
                                ? 'bg-sky-100 dark:bg-sky-800/40 font-bold text-sky-700 dark:text-sky-300'
                                : 'text-gray-600 dark:text-gray-400'
                            }
                          >
                            <td className="py-1 pr-2 font-medium">A{i + 1}</td>
                            {row.map((v, j) => (
                              <td key={j} className="py-1 px-1 text-center">
                                {v.toFixed(0)}
                              </td>
                            ))}
                            <td className="py-1 pl-2 text-center font-semibold">
                              {savage.maxRisks[i].toFixed(0)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 rounded-lg bg-sky-50 dark:bg-sky-900/40 px-3 py-2 text-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Найкраща: </span>
                  <span className="font-bold text-sky-700 dark:text-sky-300">
                    A{savage.bestIdx + 1}
                  </span>
                  <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                    (max ризик = {savage.best.toFixed(0)})
                  </span>
                </div>
              </div>
            )}

            {/* ── Card 3: Variance / Stability ── */}
            {variance && (
              <div className="rounded-xl border-2 border-violet-300 dark:border-violet-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  Стабільність (MV + дисперсія)
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                  V_i = (σ_i / |MV_i|) · 100%
                </p>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 dark:text-gray-400">
                        <th className="py-1 pr-2 text-left font-medium" />
                        <th className="py-1 px-1 font-medium text-center">MV</th>
                        <th className="py-1 px-1 font-medium text-center">D</th>
                        <th className="py-1 px-1 font-medium text-center">σ</th>
                        <th className="py-1 pl-1 font-medium text-center">V, %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variance.expectedValues.map((mv, i) => {
                        const isBestEv = i === variance.bestEvIdx
                        const isBestCv = i === variance.bestCvIdx
                        return (
                          <tr
                            key={i}
                            className={`${
                              isBestEv
                                ? 'bg-violet-100 dark:bg-violet-800/40 font-bold text-violet-700 dark:text-violet-300'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <td className="py-1 pr-2 font-medium">
                              A{i + 1}
                              {isBestEv && (
                                <span
                                  className="ml-1 text-[10px] text-emerald-500"
                                  title="Найвищий MV"
                                >
                                  ★
                                </span>
                              )}
                              {isBestCv && (
                                <span
                                  className="ml-0.5 text-[10px] text-amber-500"
                                  title="Найнижчий V"
                                >
                                  ◆
                                </span>
                              )}
                            </td>
                            <td className="py-1 px-1 text-center">{mv.toFixed(2)}</td>
                            <td className="py-1 px-1 text-center">
                              {variance.dispersions[i].toFixed(2)}
                            </td>
                            <td className="py-1 px-1 text-center">
                              {variance.stdDevs[i].toFixed(2)}
                            </td>
                            <td className="py-1 pl-1 text-center">{variance.cvs[i].toFixed(1)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex gap-2">
                  <div className="flex-1 rounded-lg bg-violet-50 dark:bg-violet-900/40 px-2 py-1.5 text-center">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">★ Max MV</div>
                    <span className="font-bold text-violet-700 dark:text-violet-300 text-sm">
                      A{variance.bestEvIdx + 1}
                    </span>
                  </div>
                  <div className="flex-1 rounded-lg bg-amber-50 dark:bg-amber-900/40 px-2 py-1.5 text-center">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">◆ Min V</div>
                    <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                      A{variance.bestCvIdx + 1}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
