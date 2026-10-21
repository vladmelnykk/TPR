import { COMPARISON_SCALE, analyzeMatrix, evaluateHierarchy, useHierarchyStore } from '../stores/hierarchyStore'
import type { Alternative, HierarchyNode } from '../stores/hierarchyStore'

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'
const buttonClass = 'rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-40'
const pct = (value: number) => `${(value * 100).toFixed(2)}%`
const scaleLabel = (value: number) => value < 1 ? `1/${Math.round(1 / value)}` : String(value)

function ComparisonMatrix({ node, alternatives }: { node: HierarchyNode; alternatives: Alternative[] }) {
  const setComparison = useHierarchyStore(s => s.setComparison)
  const labels = node.children.length ? node.children.map(child => child.name || 'Критерій без назви') : alternatives.map(a => a.name || 'Альтернатива без назви')
  const analysis = analyzeMatrix(node.matrix)
  return <div className="space-y-3">
    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{node.children.length
      ? 'Порівняйте важливість дочірніх критеріїв щодо цього вузла.'
      : 'Порівняйте, яка альтернатива краще відповідає цьому критерію.'} Значення показує перевагу рядка над стовпцем. Редагуйте верхню половину матриці; зворотні оцінки обчислюються автоматично.</p>
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm text-left"><caption className="sr-only">Парні порівняння: {node.name}</caption>
        <thead className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"><tr><th className="min-w-40 px-3 py-2">Рядок / стовпець</th>{labels.map((label, i) => <th key={i} className="min-w-28 max-w-48 px-3 py-2 font-medium">{label}</th>)}<th className="px-3 py-2">Вага</th></tr></thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{node.matrix.map((row, i) => <tr key={i}><th className="px-3 py-2 font-medium">{labels[i]}</th>{row.map((value, j) => <td key={j} className="px-3 py-2 text-center">{i < j
          ? <select aria-label={`${node.name}: ${labels[i]} проти ${labels[j]}`} value={value} onChange={e => setComparison(node.id, i, j, Number(e.target.value))} className={`${inputClass} min-w-20`}>{COMPARISON_SCALE.map(v => <option key={v} value={v}>{scaleLabel(v)}</option>)}</select>
          : <span className="text-gray-500 dark:text-gray-400">{scaleLabel(value)}</span>}</td>)}<td className="px-3 py-2 font-semibold text-indigo-700 dark:text-indigo-300">{pct(analysis.weights[i])}</td></tr>)}</tbody>
      </table>
    </div>
    <p className={`rounded-lg px-3 py-2 text-sm ${analysis.consistent ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`} role={analysis.consistent ? undefined : 'status'}>
      {node.matrix.length <= 2 ? 'Для 1–2 елементів перевірка узгодженості не потрібна.' : `CR = ${pct(analysis.cr)}. ${analysis.consistent ? 'Оцінки достатньо узгоджені (≤ 10%).' : 'Перегляньте оцінки: CR перевищує 10%. Рейтинг поки попередній.'}`}
      <span className="ml-2 text-xs">λmax = {analysis.lambda.toFixed(4)} · CI = {analysis.ci.toFixed(4)}</span>
    </p>
  </div>
}

function CriterionEditor({ node, alternatives, depth = 0 }: { node: HierarchyNode; alternatives: Alternative[]; depth?: number }) {
  const { renameNode, addCriterion, removeCriterion } = useHierarchyStore()
  return <article className="min-w-0 space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    <div className="flex flex-wrap items-center gap-3">{depth === 0 ? <h3 className="flex-1 font-semibold">Критерії щодо мети</h3> : <>
      <label className="min-w-0 flex-1 text-sm font-semibold">{node.children.length ? 'Група критеріїв' : 'Критерій'}<input aria-label={`Назва критерію ${node.name}`} value={node.name} onChange={e => renameNode(node.id, e.target.value)} className={`${inputClass} mt-1`} /></label>
      <button onClick={() => removeCriterion(node.id)} aria-label={`Видалити критерій ${node.name}`} className="rounded-lg px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">✕</button>
    </>}</div>
    <details open={depth === 0}><summary className="cursor-pointer font-medium text-indigo-700 dark:text-indigo-300">{node.children.length ? `Порівняння критеріїв (${node.children.length})` : 'Порівняння альтернатив'}</summary><div className="mt-4"><ComparisonMatrix node={node} alternatives={alternatives} /></div></details>
    <button disabled={node.children.length >= 9} onClick={() => addCriterion(node.id)} className={buttonClass}>{depth === 0 ? '+ Критерій' : '+ Підкритерій'}</button>
    {!node.children.length && depth > 0 && <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Додавання підкритерію створить наступний рівень і перенесе поточні порівняння альтернатив до першого підкритерію. Наступні підкритерії починають із рівних оцінок.</p>}
    {node.children.length > 0 && <div className="space-y-4 border-l-2 border-indigo-100 pl-3 sm:pl-5 dark:border-indigo-900">{node.children.map(child => <CriterionEditor key={child.id} node={child} alternatives={alternatives} depth={depth + 1} />)}</div>}
  </article>
}

export default function HierarchyPage() {
  const { goal, root, alternatives, setGoal, addAlternative, renameAlternative, removeAlternative, loadExample } = useHierarchyStore()
  const result = evaluateHierarchy(root, alternatives)
  const leaves = result.contributions
  const winners = result.ranking.filter(item => item.best)
  return <div className="space-y-8">
    <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Аналіз ієрархій</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">Порівняйте варіанти за кількома критеріями, визначте їхню важливість та отримайте підсумковий рейтинг. Об’єднуйте критерії в групи або враховуйте різні точки зору на окремих рівнях.</p></div>
    <details className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"><summary className="cursor-pointer px-5 py-4 font-semibold text-indigo-700 dark:text-indigo-300">Як користуватися та що означають результати</summary>
      <div className="space-y-4 border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600 dark:border-gray-800 dark:text-gray-300">
        <ol className="list-decimal space-y-2 pl-5"><li>Опишіть мету та назвіть альтернативи — варіанти, між якими обираєте.</li><li>Додайте критерії оцінювання. Для кількох рівнів додайте підкритерії: наприклад, «Витрати» → «Вартість придбання» й «Обслуговування». Кожна група порівнює лише власних безпосередніх нащадків.</li><li>У матрицях порівняйте елементи попарно. 1 — рівнозначні; 3 — помірна перевага рядка; 5 — сильна; 7 — дуже сильна; 9 — найсильніша. 2, 4, 6, 8 — проміжні оцінки. 1/3 означає, що стовпець має помірну перевагу над рядком.</li><li>Для кожного кінцевого критерію порівняйте всі альтернативи. Оцінюйте перевагу, а не сирі показники: за критерієм «Витрати» дешевший варіант може мати більшу перевагу.</li><li>Перевірте CR у кожній матриці. Якщо він перевищує 10%, перегляньте суперечливі судження. Наприклад, A краще B, B краще C, але C значно краще A.</li><li>Порівняйте підсумкові пріоритети та внесок кожного критерію. Змініть важливість критеріїв і подивіться, чи зберігається лідер.</li></ol>
        <p><strong>Локальна вага</strong> — важливість елемента серед сусідів; їхні ваги сумуються до 100%. <strong>Глобальна вага</strong> — добуток локальних ваг уздовж шляху від мети. Вона визначає внесок критерію в загальний результат.</p>
        <p><strong>Підсумковий пріоритет</strong> = сума добутків глобальної ваги кожного кінцевого критерію на локальний пріоритет альтернативи за ним. Сума пріоритетів альтернатив — 100%. Це відносна перевага в заданій моделі, а не ймовірність успіху. За рівності показуються всі лідери.</p>
        <p><strong>λmax</strong> — головне власне значення матриці, <strong>CI = (λmax − n)/(n − 1)</strong> — індекс неузгодженості, <strong>CR = CI/RI</strong> — його відношення до випадкового індексу для n елементів. Ваги обчислюються методом головного власного вектора. CR ≤ 10% — орієнтир узгодженості, а не доказ правильності вибору.</p>
        <p>Підтримується від 2 до 9 альтернатив та до 9 дочірніх критеріїв у кожній групі. Нові порівняння починаються з 1 — їх потрібно переглянути. Видалення групи прибирає її підкритерії; якщо нащадків не залишилося, вузол стає кінцевим критерієм. Порівняння єдиного кінцевого нащадка зберігаються, а для видаленої складної гілки встановлюються рівні оцінки.</p>
        <p className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">Приклади містять умовні судження про три університети. У прикладі з двома рівнями погляди двох учасників мають однакову вагу, а їхні пріоритети критеріїв різняться. Завантаження прикладу замінює поточні дані. Дані зберігаються до перезавантаження сторінки.</p>
        <p className="text-xs">Довідка щодо розрахунку ваг та CR: <a href="https://www.frontiersin.org/journals/environmental-science/articles/10.3389/fenvs.2022.1099996/full" target="_blank" rel="noreferrer" className="text-indigo-600 underline dark:text-indigo-300">AHP Analyser: методика та таблиця RI</a>.</p>
      </div>
    </details>
    <section className="space-y-4"><h2 className="text-lg font-semibold">1. Мета та альтернативи</h2>
      <div className="flex flex-wrap gap-3"><button onClick={() => loadExample(false)} className={buttonClass}>Приклад: один рівень</button><button onClick={() => loadExample(true)} className={buttonClass}>Приклад: два рівні</button></div><p className="text-xs text-gray-500 dark:text-gray-400">Приклад замінить поточну мету, ієрархію та оцінки.</p>
      <label className="block text-sm font-medium">Мета рішення<input value={goal} onChange={e => setGoal(e.target.value)} className={`${inputClass} mt-2`} placeholder="Що потрібно обрати?" /></label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{alternatives.map((a, i) => <div key={a.id} className="flex items-end gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"><label className="min-w-0 flex-1 text-sm">Альтернатива {i + 1}<input value={a.name} onChange={e => renameAlternative(a.id, e.target.value)} className={`${inputClass} mt-1`} /></label><button disabled={alternatives.length <= 2} onClick={() => removeAlternative(a.id)} aria-label={`Видалити альтернативу ${i + 1}`} className="rounded-lg px-2 py-2 text-red-500 disabled:opacity-30">✕</button></div>)}</div>
      <button onClick={addAlternative} disabled={alternatives.length >= 9} className={buttonClass}>+ Альтернатива</button>
    </section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">2. Ієрархія та парні порівняння</h2><p className="text-sm text-gray-600 dark:text-gray-400">Вкладені картки показують рівні ієрархії. Розкрийте «Порівняння альтернатив» у кожному кінцевому критерії, щоб змінити оцінки.</p><CriterionEditor node={root} alternatives={alternatives} /></section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">3. Підсумковий рейтинг</h2>
      {result.inconsistent.length > 0 && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Рейтинг попередній: перегляньте неузгоджені матриці — {result.inconsistent.map(item => item.node.id === 'root' ? 'Критерії щодо мети' : item.path || item.node.name || 'Без назви').join(', ')}.</p>}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40"><p className="text-sm text-gray-600 dark:text-gray-400">{winners.length > 1 ? 'Однаковий найвищий пріоритет' : 'Найвищий пріоритет'}</p><p className="mt-1 text-lg font-bold text-indigo-700 dark:text-indigo-300">{winners.map(item => item.name || 'Без назви').join(', ')} · {pct(winners[0].score)}</p><p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Мета: {goal || 'Не вказана'}. Результат залежить від обраної ієрархії та ваших оцінок.</p></div>
      <div className="space-y-3">{result.ranking.map(item => <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"><div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-medium">{item.name || 'Без назви'}{item.best ? ' · Лідер' : ''}</span><span className="font-semibold">{pct(item.score)}</span></div><div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className={item.best ? 'h-full rounded-full bg-indigo-500' : 'h-full rounded-full bg-indigo-300 dark:bg-indigo-700'} style={{ width: pct(item.score) }} /></div></div>)}</div>
    </section>
    <section className="space-y-4"><h2 className="text-lg font-semibold">4. Ваги та внесок критеріїв</h2><p className="text-sm text-gray-600 dark:text-gray-400">Глобальні ваги кінцевих критеріїв сумуються до 100%. Кожна клітинка внеску — глобальна вага × локальний пріоритет альтернативи. Сума внесків у стовпці дає її підсумковий рейтинг.</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700"><table className="w-full text-left text-sm"><caption className="sr-only">Локальні та глобальні ваги всіх вузлів ієрархії</caption><thead className="bg-gray-100 dark:bg-gray-800"><tr>{['Критерій / група', 'Локальна вага', 'Глобальна вага'].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">{result.nodes.filter(item => item.node.id !== 'root').map(item => <tr key={item.node.id}><td className="px-4 py-3">{item.path || item.node.name || 'Без назви'}</td><td className="px-4 py-3">{pct(item.localWeight)}</td><td className="px-4 py-3">{pct(item.globalWeight)}</td></tr>)}</tbody></table></div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700"><table className="w-full text-left text-sm"><caption className="sr-only">Внески кінцевих критеріїв у рейтинг альтернатив</caption><thead className="bg-gray-100 dark:bg-gray-800"><tr><th className="min-w-60 px-4 py-3">Кінцевий критерій</th><th className="px-4 py-3">Глобальна вага</th>{alternatives.map(a => <th key={a.id} className="min-w-32 px-4 py-3">{a.name || 'Без назви'}</th>)}</tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">{leaves.map(leaf => <tr key={leaf.id}><td className="px-4 py-3">{leaf.path || 'Без окремих критеріїв'}</td><td className="px-4 py-3">{pct(leaf.weight)}</td>{leaf.values.map((value, i) => <td key={i} className="px-4 py-3" title={`Локальний пріоритет: ${pct(leaf.localScores[i])}`}>{pct(value)}</td>)}</tr>)}</tbody><tfoot className="bg-indigo-50 font-semibold dark:bg-indigo-950/40"><tr><td className="px-4 py-3">Підсумковий пріоритет</td><td className="px-4 py-3">100%</td>{result.scores.map((value, i) => <td key={i} className="px-4 py-3">{pct(value)}</td>)}</tr></tfoot></table></div>
    </section>
  </div>
}
