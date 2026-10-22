import { useState } from 'react'
import type { Alternative, HierarchyNode } from '../stores/hierarchyStore'
import type { analyzeMatrix, evaluateHierarchy } from '../stores/hierarchyStore'

const number = (value: number, digits = 2) => value.toLocaleString('uk-UA', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const percent = (value: number, digits = 2) => `${number(value * 100, digits)}%`
const points = (value: number, digits = 2) => `${number(value * 100, digits)} п.п.`
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
  const initial = 1 / size
  const firstProducts = matrix.map(row => row.reduce((sum, value) => sum + value * initial, 0))
  const firstTotal = firstProducts.reduce((sum, value) => sum + value, 0)
  const finalProducts = matrix.map(row => row.reduce((sum, value, i) => sum + value * analysis.weights[i], 0))
  const finalTotal = finalProducts.reduce((sum, value) => sum + value, 0)
  const ratio = size === 2 ? matrix[0][1] : 1
  const parts = ratio >= 1 ? [ratio, 1] : [1, 1 / ratio]
  const partsTotal = parts[0] + parts[1]

  return <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-sm leading-relaxed dark:border-indigo-900 dark:bg-indigo-950/20">
    <h4 className="font-semibold">Як із порівнянь отримано локальні ваги</h4>
    <p>Ви вводите лише переваги в матриці. Ваги програма розраховує автоматично за всіма порівняннями цієї матриці. Їхня сума — 100%.</p>
    {size === 1 ? <p>У цій групі лише один елемент, тому вся вага належить йому: <strong>100%</strong>.</p> : size === 2 ? <>
      <p>Порівняння задає співвідношення «{labels[0]}» до «{labels[1]}» як <strong>{number(parts[0], 0)} : {number(parts[1], 0)}</strong>. Усього {number(partsTotal, 0)} частин; кожна вага — частка відповідного елемента в цій сумі.</p>
      <div className="grid gap-3 sm:grid-cols-2">{labels.map((label, i) => <div key={i} className="rounded-lg bg-white p-3 dark:bg-gray-900"><p className="font-medium">{label}</p><p className="mt-1 tabular-nums">{number(parts[i], 0)} / {number(partsTotal, 0)} × 100% = <strong>{percent(analysis.weights[i])}</strong></p></div>)}</div>
    </> : <>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Спочатку кожному елементу надається однакова вага: 1 / {size} = {number(initial, 6)}.</li>
        <li>Для кожного рядка його оцінки множаться на поточні ваги відповідних стовпців і додаються.</li>
        <li>Кожна отримана сума ділиться на загальну суму всіх рядків. Так ваги знову сумуються до 100%.</li>
        <li>Кроки 2–3 повторюються, доки зміна кожної ваги не стане меншою за 10⁻¹². Це степеневий метод обчислення головного власного вектора.</li>
      </ol>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700"><table className="w-full text-left text-sm"><caption className="sr-only">Від першого наближення до розрахованих локальних ваг</caption><thead className="bg-white dark:bg-gray-900"><tr>{['Елемент', 'Перша сума рядка', 'Вага після першого кроку', 'Підсумкова вага'].map(label => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}</tr></thead><tbody>{labels.map((label, i) => <tr key={i} className="border-t border-gray-200 dark:border-gray-800"><th className="px-3 py-2 font-normal">{label}</th><td className="px-3 py-2 tabular-nums">{number(firstProducts[i], 6)}</td><td className="px-3 py-2 tabular-nums">{percent(firstProducts[i] / firstTotal)}</td><td className="px-3 py-2 font-semibold tabular-nums">{percent(analysis.weights[i])}</td></tr>)}</tbody></table></div>
      <p>Наприклад, перша сума для «{labels[0]}»: ({matrix[0].map(value => number(value, 4)).join(' + ')}) × {number(initial, 6)} ≈ {number(firstProducts[0], 6)}. Сума всіх рядків — {number(firstTotal, 6)}. Це лише перший крок, а не остаточні ваги.</p>
      <details><summary className="cursor-pointer font-medium text-indigo-700 dark:text-indigo-300">Числова перевірка підсумкових ваг</summary><div className="mt-3 space-y-3"><p>Після збіжності повторне множення й нормування відтворює той самий вектор. Нижче для кожного рядка показано обчислення з отриманими вагами. Числа у формулах округлено.</p>{labels.map((label, i) => <div key={i} className="rounded-lg bg-white p-3 dark:bg-gray-900"><p className="font-medium">{label}</p><p className="mt-1 break-words tabular-nums">{matrix[i].map((value, j) => `${number(value, 4)} × ${number(analysis.weights[j], 6)}`).join(' + ')} ≈ {number(finalProducts[i], 6)}</p><p className="mt-1 tabular-nums">{number(finalProducts[i], 6)} / {number(finalTotal, 6)} × 100% ≈ <strong>{percent(analysis.weights[i])}</strong></p></div>)}</div></details>
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

    <div className="space-y-3"><h3 className="font-semibold">Що означають числа в підсумковій таблиці</h3><p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">Число в клітинці — внесок одного критерію в рейтинг альтернативи, у відсоткових пунктах. Під ним показано множення: <strong>частка критерію в рішенні × оцінка альтернативи за цим критерієм</strong>. Оцінка альтернативи отримується з її матриці порівнянь.</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700"><table className="w-full text-left text-sm"><caption className="sr-only">Внески критеріїв із поясненням множників для кожної альтернативи</caption><thead className="bg-gray-100 dark:bg-gray-800"><tr><th className="min-w-64 px-4 py-3">Критерій оцінювання</th><th className="min-w-36 px-4 py-3">Частка в рішенні</th>{alternatives.map(a => <th key={a.id} className="min-w-48 px-4 py-3">{a.name || 'Без назви'}<span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">Внесок у рейтинг</span></th>)}</tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">{result.contributions.map(leaf => <tr key={leaf.id}><td className="px-4 py-3"><p>{leaf.path || 'Без окремих критеріїв'}</p><a href={`#criterion-${leaf.id}`} onClick={() => revealComparisons(leaf.id)} className={`${linkClass} mt-1 block text-xs`}>До порівнянь альтернатив</a></td><td className="px-4 py-3 tabular-nums">{percent(leaf.weight)}</td>{leaf.values.map((value, i) => <td key={i} className="px-4 py-3"><p className="font-semibold tabular-nums">{points(value)}</p><p className="mt-1 text-xs tabular-nums text-gray-600 dark:text-gray-400">{percent(leaf.weight)} × {percent(leaf.localScores[i])}</p></td>)}</tr>)}</tbody><tfoot className="bg-indigo-50 font-semibold dark:bg-indigo-950/40"><tr><td className="px-4 py-3">Рейтинг = сума внесків ↓</td><td className="px-4 py-3">100%</td>{result.scores.map((value, i) => <td key={i} className="px-4 py-3 tabular-nums">{percent(value)}</td>)}</tr></tfoot></table></div>
    </div>

    <div id="score-explanation" className="scroll-mt-6 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 sm:p-5 dark:border-indigo-900 dark:bg-indigo-950/20">
      <h3 className="font-semibold">Розрахунок результату на конкретному прикладі</h3>
      <label className="block text-sm font-medium">Розібрати рейтинг альтернативи<select value={chosen.id} onChange={e => setChosenId(e.target.value)} className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 sm:max-w-sm dark:border-gray-600 dark:bg-gray-900">{alternatives.map(a => <option key={a.id} value={a.id}>{a.name || 'Без назви'}</option>)}</select></label>
      <ol className="space-y-3">{result.contributions.map((leaf, i) => <li key={leaf.id} className="rounded-lg bg-white p-3 dark:bg-gray-900"><p className="text-sm font-medium">{i + 1}. {leaf.path || 'Порівняння щодо мети'}</p><p className="mt-2 text-sm leading-relaxed">Частка критерію: {paths.get(leaf.id)!.length > 1 && <>{factorText(leaf.id)} ≈ </>}<strong>{percent(leaf.weight)}</strong>. Оцінка «{chosen.name || 'Без назви'}» за цим критерієм: <strong>{percent(leaf.localScores[chosenIndex])}</strong>.</p><p className="mt-2 text-sm tabular-nums">{percent(leaf.weight, 4)} × {percent(leaf.localScores[chosenIndex], 4)} ≈ <strong>{points(leaf.values[chosenIndex], 4)}</strong></p><a href={`#criterion-${leaf.id}`} onClick={() => revealComparisons(leaf.id)} className={`${linkClass} mt-2 inline-block text-xs`}>Переглянути вихідні порівняння</a></li>)}</ol>
      <div className="border-t border-indigo-200 pt-4 dark:border-indigo-900"><p className="text-sm text-gray-600 dark:text-gray-400">Додаємо внески всіх кінцевих критеріїв:</p><p className="mt-2 break-words text-base font-semibold tabular-nums text-indigo-800 dark:text-indigo-200">{result.contributions.map(leaf => points(leaf.values[chosenIndex], 4)).join(' + ')} ≈ {percent(result.scores[chosenIndex])}</p></div>
      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Наприклад, 20% × 50% = 0,20 × 0,50 = 0,10: внесок становить 10 відсоткових пунктів. Формули вище округлено для читабельності; програма рахує з повною точністю, тому сума видимих округлених чисел може трохи відрізнятися від підсумку.</p>
    </div>
  </section>
}
