export default function ProbabilityNotice({ probabilities }: { probabilities: number[] }) {
  const sum = probabilities.reduce((total, value) => total + value, 0)
  const valid = probabilities.every(value => Number.isFinite(value) && value >= 0 && value <= 1)
    && Math.abs(sum - 1) < 0.001

  if (valid) return null

  return (
    <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      Перевірте ймовірності: кожна має бути від 0 до 1, а сума — 1 (100%).
      Зараз сума: {sum.toFixed(3)}. Розрахунки залишаються доступними, але очікуваний
      виграш і показники стабільності мають зміст лише за коректних ймовірностей.
    </p>
  )
}
