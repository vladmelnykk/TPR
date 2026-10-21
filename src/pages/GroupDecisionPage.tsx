import DecisionNetwork from '../components/DecisionNetwork'
import { getTasks, scoreProposal, useGroupDecisionStore } from '../stores/groupDecisionStore'

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100'
const buttonClass = 'rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600'
const removeClass = 'rounded-lg px-2 py-1 text-sm text-red-500 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-950'

export default function GroupDecisionPage() {
  const store = useGroupDecisionStore()
  const { problem, experts, causes } = store
  const tasks = getTasks(causes)
  const uncovered = causes.filter(cause => !cause.proposals.some(p => p.acceptable && p.selected))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Групове прийняття рішень</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">Перетворіть спільне обговорення проблеми на план дій: визначте причини, запропонуйте рішення, порівняйте думки учасників та узгодьте порядок виконання.</p>
      </div>
      <details className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <summary className="cursor-pointer px-5 py-4 font-semibold text-indigo-700 dark:text-indigo-300">Як користуватися та що означають результати</summary>
        <div className="space-y-4 border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600 dark:border-gray-800 dark:text-gray-300">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Сформулюйте проблему: що відбувається, кого це стосується та який результат хочете отримати.</li>
            <li>Додайте учасників обговорення. Кожен пропонує причини проблеми й способи їх усунення. Для ґрунтовного аналізу орієнтуйтеся на 10–12 причин та 10–12 пропозицій для кожної; почати можна з меншої кількості.</li>
            <li>Спочатку генеруйте ідеї без критики. Використовуйте аналогії з іншими ситуаціями, щоб знайти додаткові способи дії. Потім узгодьте обмеження: бюджет, час, ресурси — і позначте прийнятні пропозиції.</li>
            <li>Внесіть оцінки учасників від 1 до 5 за спільно узгодженим питанням: «Наскільки ця дія допоможе усунути причину в межах наших обмежень?». 1 — найменша перевага, 5 — найбільша; «—» означає, що оцінки ще немає.</li>
            <li>Порівняйте середні оцінки в межах кожної причини й позначте дії «До плану». Для кожної причини можна вибрати кілька дій. Остаточний відбір залишається за групою.</li>
            <li>У плані вкажіть відповідальних, тривалість у робочих днях та попередні дії. Графік і розклад перерахуються автоматично.</li>
          </ol>
          <p><strong>Середня оцінка</strong> — сума оцінок, поділена на кількість учасників; усі голоси рівнозначні. Вона з’являється після оцінювання всіма учасниками. Найвища оцінка підсвічується лише серед прийнятних пропозицій однієї причини; за рівності підсвічуються всі лідери. Це модель переваг групи, а не ймовірність успіху чи показник згоди між учасниками.</p>
          <p><strong>Мережевий графік</strong> показує залежності між вибраними діями. Тривалість плану — найраніше можливе завершення всіх дій за заданих залежностей. Критичні дії не мають резерву часу. Цикл залежностей робить розклад неможливим: його потрібно усунути.</p>
          <p className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">Початкові дані — приклад. Замініть їх власними. Працюйте разом на одному екрані або внесіть зібрані оцінки: спільного доступу через мережу немає. Дані зберігаються до перезавантаження сторінки.</p>
        </div>
      </details>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">1. Проблема та учасники</h2>
        <label className="block space-y-2 text-sm font-medium">Опис проблеми<textarea value={problem} onChange={e => store.setProblem(e.target.value)} rows={3} placeholder="Опишіть проблему та бажаний результат" className={`${inputClass} mt-2 resize-y`} /></label>
        <div className="flex flex-wrap gap-3">{experts.map((expert, i) => <div key={expert.id} className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
          <input aria-label={`Ім’я учасника ${i + 1}`} value={expert.name} onChange={e => store.renameExpert(expert.id, e.target.value)} className={`${inputClass} max-w-44`} />
          <button disabled={experts.length <= 1} aria-label={`Видалити учасника ${i + 1}`} onClick={() => store.removeExpert(expert.id)} className={removeClass}>✕</button>
        </div>)}</div>
        <button onClick={store.addExpert} className={buttonClass}>+ Учасник</button>
        {!problem.trim() && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">Опишіть проблему, щоб учасники оцінювали пропозиції в одному контексті.</p>}
      </section>

      <section className="space-y-4">
        <div><h2 className="text-lg font-semibold">2. Причини, пропозиції та відбір</h2><p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Для кожної причини зберіть ідеї, перевірте прийнятність і порівняйте оцінки. Пропозиції з найвищим середнім балом позначені як лідери.</p></div>
        {causes.map((cause, causeIndex) => {
          const scores = cause.proposals.map(p => scoreProposal(p, experts))
          const best = Math.max(-Infinity, ...cause.proposals.flatMap((p, i) => p.acceptable && scores[i].average !== null ? [scores[i].average!] : []))
          return <article key={cause.id} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3"><label className="min-w-0 flex-1 text-sm font-semibold">Причина {causeIndex + 1}<input value={cause.title} onChange={e => store.renameCause(cause.id, e.target.value)} placeholder="Що спричиняє проблему?" className={`${inputClass} mt-2`} /></label><button aria-label={`Видалити причину ${causeIndex + 1}`} onClick={() => store.removeCause(cause.id)} className={removeClass}>✕</button></div>
            {cause.proposals.length > 0 ? <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700"><table className="w-full text-sm text-left">
              <caption className="sr-only">Пропозиції для причини {causeIndex + 1}. Оцінки учасників від 1 до 5.</caption>
              <thead className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"><tr><th className="min-w-64 px-3 py-2">Пропозиція</th><th className="px-3 py-2">Прийнятна</th>{experts.map((expert, i) => <th key={expert.id} className="min-w-24 px-3 py-2">{expert.name || `Учасник ${i + 1}`}</th>)}<th className="px-3 py-2">Середня</th><th className="whitespace-nowrap px-3 py-2">До плану</th><th className="px-3 py-2"><span className="sr-only">Видалення</span></th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{cause.proposals.map((proposal, proposalIndex) => {
                const score = scores[proposalIndex], leader = proposal.acceptable && score.average !== null && Math.abs(score.average - best) < 1e-8
                const label = `${causeIndex + 1}.${proposalIndex + 1}`
                return <tr key={proposal.id} className={leader ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : ''}>
                  <td className="p-2"><input aria-label={`Пропозиція ${label}`} value={proposal.title} onChange={e => store.updateProposal(proposal.id, { title: e.target.value })} placeholder="Як усунути цю причину?" className={inputClass} /></td>
                  <td className="px-3 py-2 text-center"><input type="checkbox" aria-label={`Прийнятність пропозиції ${label}`} checked={proposal.acceptable} onChange={e => store.updateProposal(proposal.id, { acceptable: e.target.checked })} className="size-4 accent-indigo-500" /></td>
                  {experts.map((expert, i) => <td key={expert.id} className="p-2"><select aria-label={`Оцінка пропозиції ${label}, ${expert.name || `учасник ${i + 1}`}`} value={proposal.votes[expert.id] ?? 0} onChange={e => store.vote(proposal.id, expert.id, Number(e.target.value))} className={inputClass}><option value={0}>—</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></td>)}
                  <td className="px-3 py-2 whitespace-nowrap"><span className={leader ? 'font-bold text-indigo-700 dark:text-indigo-300' : ''}>{score.average === null ? '—' : score.average.toFixed(2)}</span><div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{leader ? 'Лідер · ' : ''}{score.count}/{experts.length} оцінок</div></td>
                  <td className="px-3 py-2 text-center"><input type="checkbox" aria-label={`До плану: пропозиція ${label}`} checked={proposal.selected} disabled={!proposal.selected && (!proposal.acceptable || !proposal.title.trim() || !cause.title.trim())} onChange={e => store.updateProposal(proposal.id, { selected: e.target.checked })} className="size-4 accent-indigo-500 disabled:opacity-30" /></td>
                  <td className="p-2"><button aria-label={`Видалити пропозицію ${label}`} onClick={() => store.removeProposal(proposal.id)} className={removeClass}>✕</button></td>
                </tr>
              })}</tbody>
            </table></div> : <p className="text-sm text-gray-500 dark:text-gray-400">Додайте способи усунення цієї причини.</p>}
            <button onClick={() => store.addProposal(cause.id)} className={buttonClass}>+ Пропозиція</button>
          </article>
        })}
        {!causes.length && <p className="text-sm text-gray-500 dark:text-gray-400">Додайте першу причину проблеми, а потім запропонуйте способи її усунення.</p>}
        <button onClick={store.addCause} className={buttonClass}>+ Причина</button>
      </section>

      <section className="space-y-4">
        <div><h2 className="text-lg font-semibold">3. План виконання</h2><p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Для вибраних дій задайте тривалість і попередників. Дія почнеться після завершення всіх своїх попередників. Після вилучення дії з плану її залежності також видаляються.</p></div>
        {uncovered.length > 0 && <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Без вибраних дій: {uncovered.map(c => c.title || 'Причина без назви').join('; ')}. Додайте дії, щоб охопити всі причини.</p>}
        <div className="grid gap-4 lg:grid-cols-2">{tasks.map(task => <article key={task.id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="font-semibold"><span className="text-indigo-600 dark:text-indigo-300">{task.code}</span> — {task.title || 'Дія без назви'}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Причина: {task.cause || 'Без назви'}</p>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Відповідальний<input className={`${inputClass} mt-1`} value={task.owner} placeholder="Ім’я або команда" onChange={e => store.updateProposal(task.id, { owner: e.target.value })} /></label><label className="text-sm">Тривалість, робочих днів<input className={`${inputClass} mt-1`} type="number" min="0.5" step="0.5" value={task.duration} onChange={e => { const value = Number(e.target.value); if (Number.isFinite(value)) store.updateProposal(task.id, { duration: value }) }} /></label></div>
          <fieldset><legend className="mb-2 text-sm font-medium">Почати після завершення</legend><div className="space-y-2">{tasks.filter(t => t.id !== task.id).map(previous => <label key={previous.id} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-indigo-500" checked={task.dependsOn.includes(previous.id)} onChange={e => store.updateProposal(task.id, { dependsOn: e.target.checked ? [...task.dependsOn, previous.id] : task.dependsOn.filter(id => id !== previous.id) })} /><span>{previous.code} — {previous.title || 'Дія без назви'}</span></label>)}{tasks.length === 1 && <p className="text-sm text-gray-500">Інших дій ще немає.</p>}</div></fieldset>
        </article>)}</div>
      </section>
      <section className="space-y-4"><h2 className="text-lg font-semibold">4. Мережевий графік та розклад</h2><DecisionNetwork tasks={tasks} /></section>
    </div>
  )
}
