import {
  calcBayesLaplace,
  calcHurwicz,
  calcMaximax,
  calcWald,
  useLab1Store
} from '../stores/lab1Store'

interface CriterionResult {
  values: number[]
  best: number
  bestIdx: number
}

function CriterionCard({
  title,
  formula,
  result,
  color
}: {
  title: string
  formula: string
  result: CriterionResult
  color: string
}) {
  return (
    <div
      className={`rounded-xl border-2 ${color} bg-white dark:bg-gray-900 p-4 shadow-sm transition-all hover:shadow-md`}
    >
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">{formula}</p>

      <div className="mt-3 space-y-1">
        {result.values.map((v, i) => {
          const isBest = i === result.bestIdx
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isBest
                  ? 'bg-indigo-100 dark:bg-indigo-800/40 font-bold text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span>A{i + 1}</span>
              <span>{v.toFixed(2)}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 px-3 py-2 text-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">Найкраща: </span>
        <span className="font-bold text-indigo-700 dark:text-indigo-300">
          A{result.bestIdx + 1}
        </span>
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          ({result.best.toFixed(2)})
        </span>
      </div>
    </div>
  )
}

export default function ResultCards() {
  const { matrix, probabilities, q } = useLab1Store()

  if (matrix.length === 0 || matrix[0].length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        Додайте альтернативи та стани природи для розрахунку.
      </p>
    )
  }

  const maximax = calcMaximax(matrix)
  const wald = calcWald(matrix)
  const hurwicz = calcHurwicz(matrix, q)
  const bayesLaplace = calcBayesLaplace(matrix, probabilities)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CriterionCard
        title="Максимакс"
        formula="M = maxᵢ maxⱼ aᵢⱼ"
        result={maximax}
        color="border-emerald-300 dark:border-emerald-700"
      />
      <CriterionCard
        title="Критерій Вальда"
        formula="W = maxᵢ minⱼ aᵢⱼ"
        result={wald}
        color="border-sky-300 dark:border-sky-700"
      />
      <CriterionCard
        title="Критерій Гурвіца"
        formula={`H = maxᵢ {${q}·minⱼ + ${(1 - q).toFixed(1)}·maxⱼ}`}
        result={hurwicz}
        color="border-amber-300 dark:border-amber-700"
      />
      <CriterionCard
        title="Байєса-Лапласа"
        formula="Z = maxᵢ Σⱼ(aᵢⱼ·pⱼ)"
        result={bayesLaplace}
        color="border-violet-300 dark:border-violet-700"
      />
    </div>
  )
}
