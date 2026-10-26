import { useState } from 'react'
import type { Alternative, HierarchyNode } from '../stores/hierarchyStore'
import type { analyzeMatrix, evaluateHierarchy } from '../stores/hierarchyStore'

const number = (value: number, digits = 2) => value.toLocaleString('uk-UA', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const percent = (value: number, digits = 2) => `${number(value * 100, digits)}%`
const points = (value: number, digits = 2) => `${number(value * 100, digits)} бала`
const linkClass = 'text-indigo-700 underline underline-offset-2 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200'

function revealComparisons(nodeId: string) {
  const details = document.getElementById(`criterion-${nodeId}`)?.querySelector('details')
  if (details) details.open = true
}

export function WeightCalculation({ matrix, labels, analysis }: {
  matrix: number[][]
  labels: string[]
  analysis: ReturnType<typeof analyzeMatrix>
}) {
  const size = matrix.length
  const relativeScores = analysis.weights.map(weight => weight / Math.min(...analysis.weights))
  const relativeTotal = relativeScores.reduce((sum, value) => sum + value, 0)
  const comparisons = matrix.flatMap((row, i) => row.flatMap((value, j) => {
    if (i >= j) return []
    if (value === 1) return [`«${labels[i]}» і «${labels[j]}» рівнозначні.`]
    const preferred = value > 1 ? labels[i] : labels[j]
    const other = value > 1 ? labels[j] : labels[i]
    return [`«${preferred}» переважає «${other}» у ${number(value > 1 ? value : 1 / value, 0)} рази.`]
  }))
  const finalProducts = matrix.map(row => row.reduce((sum, value, i) => sum + value * analysis.weights[i], 0))
  const finalTotal = finalProducts.reduce((sum, value) => sum + value, 0)
  const ratio = size === 2 ? matrix[0][1] : 1
  const parts = ratio >= 1 ? [ratio, 1] : [1, 1 / ratio]
  const partsTotal = parts[0] + parts[1]

  return <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-sm leading-relaxed dark:border-indigo-900 dark:bg-indigo-950/20">
    <h4 className="font-semibold">Що означають ці ваги та як їх отримано</h4>
    <p>Уявіть, що між елементами потрібно розподілити 100 балів. Той, якому ви частіше надаєте перевагу, зазвичай отримує більшу частку. Локальна вага показує його частку саме в цій групі.</p>
    {size === 1 ? <p>У групі лише один елемент. Усі 100 балів належать йому, тому вага — <strong>100%</strong>.</p> : size === 2 ? <>
      <p>Ваше порівняння задає співвідношення «{labels[0]}» до «{labels[1]}» як <strong>{number(parts[0], 0)} : {number(parts[1], 0)}</strong>. На двох є {number(partsTotal, 0)} частин. Ділимо частини кожного елемента на цю суму:</p>
      <div className="grid gap-3 sm:grid-cols-2">{labels.map((label, i) => <div key={i} className="rounded-lg bg-white p-3 dark:bg-gray-900"><p className="font-medium">{label}</p><p className="mt-1 tabular-nums">{number(parts[i], 0)} / {number(partsTotal, 0)} × 100% = <strong>{percent(analysis.weights[i])}</strong></p></div>)}</div>
    </> : <>
      <div><h5 className="font-semibold">1. Виходимо з ваших порівнянь</h5><ul className="mt-2 list-disc space-y-1 pl-5">{comparisons.map((text, i) => <li key={i}>{text}</li>)}</ul></div>
      <div><h5 className="font-semibold">2. Об’єднуємо всі переваги</h5><p className="mt-2">Програма враховує всі пари одночасно методом головного власного вектора. Отримані відносні оцінки нижче подано в частинах: найменша дорівнює 1, решта показує перевагу над нею. Якщо парні судження суперечать одне одному, підсумкові співвідношення можуть відрізнятися від окремих введених оцінок.</p></div>
      <div><h5 className="font-semibold">3. Переводимо отримані оцінки у відсотки</h5><p className="mt-2">Сума частин — <strong>{number(relativeTotal, 4)}</strong>. Частини кожного елемента ділимо на цю суму й множимо на 100%.</p></div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700"><table className="w-full text-left text-sm"><caption className="sr-only">Перетворення відносних оцінок у локальні ваги</caption><thead className="bg-white dark:bg-gray-900"><tr>{['Елемент', 'Відносна оцінка', 'Розрахунок частки', 'Локальна вага'].map(label => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}</tr></thead><tbody>{labels.map((label, i) => <tr key={i} className="border-t border-gray-200 dark:border-gray-800"><th className="px-3 py-2 font-normal">{label}</th><td className="px-3 py-2 tabular-nums">{number(relativeScores[i], 4)}</td><td className="min-w-48 px-3 py-2 tabular-nums">{number(relativeScores[i], 4)} / {number(relativeTotal, 4)} × 100%</td><td className="px-3 py-2 font-semibold tabular-nums">{percent(analysis.weights[i])}</td></tr>)}</tbody></table></div>
      <p>Наприклад, «{labels[0]}» отримує <strong>{number(analysis.weights[0] * 100)} із 100 балів</strong> цієї групи. Тому його локальна вага — <strong>{percent(analysis.weights[0])}</strong>. Це частка переваги за вашими оцінками, а не ймовірність успіху.</p>
      <details><summary className="cursor-pointer font-medium text-indigo-700 dark:text-indigo-300">Технічні деталі методу та перевірка обчислень</summary><div className="mt-3 space-y-3"><p>Відносні оцінки вище — інший масштаб підсумкового власного вектора, а не додаткові вхідні дані. Вектор обчислюється так: початкові ваги рівні 1 / {size}; матриця множиться на поточний вектор, а результат ділиться на суму його компонентів. Це повторюється до зміни кожної ваги менш ніж на 10⁻¹².</p><p>Після завершення повторне множення та нормування відтворює ті самі ваги. Нижче показано цю перевірку з округленими числами.</p>{labels.map((label, i) => <div key={i} className="rounded-lg bg-white p-3 dark:bg-gray-900"><p className="font-medium">{label}</p><p className="mt-1 break-words tabular-nums">{matrix[i].map((value, j) => `${number(value, 4)} × ${number(analysis.weights[j], 6)}`).join(' + ')} ≈ {number(finalProducts[i], 6)}</p><p className="mt-1 tabular-nums">{number(finalProducts[i], 6)} / {number(finalTotal, 6)} × 100% ≈ <strong>{percent(analysis.weights[i])}</strong></p></div>)}</div></details>
    </>}
    <p className="text-xs text-gray-600 dark:text-gray-400">Це локальні ваги всередині однієї матриці. Важливість батьківської групи тут ще не врахована — вона входить до глобальної ваги нижче.</p>
  </div>
}

type Result = ReturnType<typeof evaluateHierarchy>
type Factor = { id: string; name: string; weight: number }

export default function HierarchyExplanation({ root, alternatives, result }: {
  root: HierarchyNode
  alternatives: Alternative[]
  result: Result
}) {
  const [chosenId, setChosenId] = useState<string | null>(null)
  const chosen = alternatives.find(a => a.id === chosenId) ?? alternatives[result.ranking[0].index]
  const chosenIndex = alternatives.findIndex(a => a.id === chosen.id)
  const paths = new Map<string, Factor[]>()
  const byId = new Map(result.nodes.map(item => [item.node.id, item]))
  function visit(node: HierarchyNode, factors: Factor[]) {
    paths.set(node.id, factors)
    node.children.forEach(child => visit(child, [...factors, {
      id: child.id, name: child.name || 'Критерій без назви', weight: byId.get(child.id)!.localWeight,
    }]))
  }
  visit(root, [])
  const factorText = (id: string) => paths.get(id)!.map(factor => percent(factor.weight)).join(' × ') || '100%'

  return <section className="space-y-6" aria-labelledby="weight-breakdown-title">
    <div><h2 id="weight-breakdown-title" className="text-lg font-semibold">4. Звідки беруться ваги та підсумкові бали</h2><p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Пройдіть той самий шлях, що й розрахунок: ваші парні оцінки → локальна вага → глобальна вага → внесок у рейтинг.</p></div>
    <div className="grid gap-3 lg:grid-cols-3">{[
      ['Локальна вага', 'Частка елемента серед сусідів у його групі. Обчислюється з матриці порівнянь цієї групи.'],
      ['Глобальна вага', 'Частка критерію в усьому рішенні. Локальні ваги від мети до цього критерію перемножуються.'],
      ['Кінцевий критерій', 'Критерій без підкритеріїв. Саме за ним порівнюються альтернативи. Групи лише розподіляють вагу між своїми нащадками.'],
    ].map(([title, text]) => <div key={title} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{text}</p></div>)}</div>

    <div className="space-y-3"><h3 className="font-semibold">Важливість кожного критерію</h3><p className="text-sm text-gray-600 dark:text-gray-400">У стовпці «Як отримано» наведено всі множники на шляху від мети. Посилання в рядку веде до порівнянь, з яких походить локальна вага.</p>
      {root.children.length ? <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700"><table className="w-full text-left text-sm"><caption className="sr-only">Походження локальних і глобальних ваг критеріїв</caption><thead className="bg-gray-100 dark:bg-gray-800"><tr>{['Шлях від мети', 'Локальна вага', 'Як отримано глобальну вагу'].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">{result.nodes.filter(item => item.node.id !== root.id).map(item => {
        const factors = paths.get(item.node.id)!
        const parentId = factors.length > 1 ? factors[factors.length - 2].id : root.id
        const parentName = factors.length > 1 ? factors[factors.length - 2].name : 'Мета'
        return <tr key={item.node.id}><td className="min-w-60 px-4 py-3"><p className="font-medium">{factors.map(factor => factor.name).join(' → ')}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.node.children.length ? 'Група · вага передається підкритеріям' : 'Кінцевий критерій · тут оцінюються альтернативи'}</p></td><td className="min-w-44 px-4 py-3"><p className="font-semibold tabular-nums">{percent(item.localWeight)}</p><a className={`${linkClass} mt-1 block text-xs`} href={`#criterion-${parentId}`} onClick={() => revealComparisons(parentId)}>Із порівнянь у «{parentName}»</a></td><td className="min-w-60 px-4 py-3"><p className="text-xs leading-relaxed tabular-nums text-gray-600 dark:text-gray-400">{factorText(item.node.id)}{factors.length === 1 ? ' × 100% ваги мети' : ''}</p><p className="mt-1 font-semibold tabular-nums text-indigo-700 dark:text-indigo-300">≈ {percent(item.globalWeight)}</p></td></tr>
      })}</tbody></table></div> : <p className="text-sm text-gray-600 dark:text-gray-400">Окремих критеріїв немає: альтернативи порівнюються безпосередньо щодо мети, яка має вагу 100%.</p>}
      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Сума глобальних ваг лише кінцевих критеріїв — {percent(result.contributions.reduce((sum, leaf) => sum + leaf.weight, 0))}. Ваги груп не додаються до ваг їхніх підкритеріїв: це повторно врахувало б ту саму частку.</p>
    </div>

    <div className="space-y-3"><h3 className="font-semibold">Що означають числа в підсумковій таблиці</h3><p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">Число в клітинці — внесок одного критерію в рейтинг альтернативи, у балах зі 100 можливих. Один бал тут відповідає одному відсотковому пункту підсумкового рейтингу. Під ним показано множення: <strong>частка критерію в рішенні × оцінка альтернативи за цим критерієм</strong>. Оцінка альтернативи отримується з її матриці порівнянь.</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700"><table className="w-full text-left text-sm"><caption className="sr-only">Внески критеріїв із поясненням множників для кожної альтернативи</caption><thead className="bg-gray-100 dark:bg-gray-800"><tr><th className="min-w-64 px-4 py-3">Критерій оцінювання</th><th className="min-w-36 px-4 py-3">Частка в рішенні</th>{alternatives.map(a => <th key={a.id} className="min-w-48 px-4 py-3">{a.name || 'Без назви'}<span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">Внесок у рейтинг</span></th>)}</tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">{result.contributions.map(leaf => <tr key={leaf.id}><td className="px-4 py-3"><p>{leaf.path || 'Без окремих критеріїв'}</p><a href={`#criterion-${leaf.id}`} onClick={() => revealComparisons(leaf.id)} className={`${linkClass} mt-1 block text-xs`}>До порівнянь альтернатив</a></td><td className="px-4 py-3 tabular-nums">{percent(leaf.weight)}</td>{leaf.values.map((value, i) => <td key={i} className="px-4 py-3"><p className="font-semibold tabular-nums">{points(value)}</p><p className="mt-1 text-xs tabular-nums text-gray-600 dark:text-gray-400">{percent(leaf.weight)} × {percent(leaf.localScores[i])}</p></td>)}</tr>)}</tbody><tfoot className="bg-indigo-50 font-semibold dark:bg-indigo-950/40"><tr><td className="px-4 py-3">Рейтинг = сума внесків ↓</td><td className="px-4 py-3">100%</td>{result.scores.map((value, i) => <td key={i} className="px-4 py-3 tabular-nums">{percent(value)}</td>)}</tr></tfoot></table></div>
    </div>

    <div id="score-explanation" className="scroll-mt-6 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 sm:p-5 dark:border-indigo-900 dark:bg-indigo-950/20">
      <h3 className="font-semibold">Розрахунок результату на конкретному прикладі</h3>
      <label className="block text-sm font-medium">Розібрати рейтинг альтернативи<select value={chosen.id} onChange={e => setChosenId(e.target.value)} className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 sm:max-w-sm dark:border-gray-600 dark:bg-gray-900">{alternatives.map(a => <option key={a.id} value={a.id}>{a.name || 'Без назви'}</option>)}</select></label>
      <ol className="space-y-3">{result.contributions.map((leaf, i) => <li key={leaf.id} className="rounded-lg bg-white p-3 dark:bg-gray-900"><p className="text-sm font-medium">{i + 1}. {leaf.path || 'Порівняння щодо мети'}</p><p className="mt-2 text-sm leading-relaxed">Частка критерію: {paths.get(leaf.id)!.length > 1 && <>{factorText(leaf.id)} ≈ </>}<strong>{percent(leaf.weight)}</strong>. Оцінка «{chosen.name || 'Без назви'}» за цим критерієм: <strong>{percent(leaf.localScores[chosenIndex])}</strong>.</p><p className="mt-2 text-sm tabular-nums">{percent(leaf.weight, 4)} × {percent(leaf.localScores[chosenIndex], 4)} ≈ <strong>{points(leaf.values[chosenIndex], 4)}</strong></p><a href={`#criterion-${leaf.id}`} onClick={() => revealComparisons(leaf.id)} className={`${linkClass} mt-2 inline-block text-xs`}>Переглянути вихідні порівняння</a></li>)}</ol>
      <div className="border-t border-indigo-200 pt-4 dark:border-indigo-900"><p className="text-sm text-gray-600 dark:text-gray-400">Додаємо внески всіх кінцевих критеріїв — отримуємо бали зі 100:</p><p className="mt-2 break-words text-base font-semibold tabular-nums text-indigo-800 dark:text-indigo-200">{result.contributions.map(leaf => points(leaf.values[chosenIndex], 4)).join(' + ')} ≈ {number(result.scores[chosenIndex] * 100)} зі 100 → {percent(result.scores[chosenIndex])}</p></div>
      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Наприклад, 20% × 50% = 0,20 × 0,50 = 0,10: критерій додає 10 балів до підсумкового рейтингу зі 100. У термінах відсотків це 10 відсоткових пунктів — доданок рейтингу, а не його відносне збільшення на 10%. Формули вище округлено для читабельності; програма рахує з повною точністю, тому сума видимих округлених чисел може трохи відрізнятися від підсумку.</p>
    </div>
  </section>
}
