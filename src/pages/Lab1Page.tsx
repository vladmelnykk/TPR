import UsageGuide from '../components/UsageGuide'
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
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Порівняйте варіанти рішення, коли майбутній сценарій невідомий. Оцініть
          найкращий і найгірший результат та знайдіть баланс між обережністю й оптимізмом.
        </p>
      </div>

      <UsageGuide mode="uncertainty" />

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
        <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          У кожній картці наведено оцінку для кожної альтернативи. Більше значення —
          краще за відповідним критерієм. Підсвічений варіант має найвищу оцінку.
        </p>
        <ResultCards />
        <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Критерії можуть радити різні рішення, бо відображають різне ставлення до
          невизначеності. Збіг рекомендацій допомагає порівняти варіанти, але не гарантує
          майбутнього виграшу. За однакових найкращих оцінок у підсумку показано першу альтернативу.
        </p>
      </section>
    </div>
  )
}
