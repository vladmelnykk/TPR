import PayoffTable from '../components/PayoffTable'
import ResultCards from '../components/ResultCards'

export default function Lab1Page() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Аналіз альтернатив в умовах невизначеності
        </h1>
      </div>

      {/* Payoff table */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
          Матриця виграшів
        </h2>
        <PayoffTable />
      </section>

      {/* Results */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
          Результати за критеріями
        </h2>
        <ResultCards />
      </section>
    </div>
  )
}
