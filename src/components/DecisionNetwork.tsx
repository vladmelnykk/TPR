import { calculatePlan } from '../stores/groupDecisionStore'
import type { PlannedTask } from '../stores/groupDecisionStore'

export default function DecisionNetwork({ tasks }: { tasks: PlannedTask[] }) {
  const plan = calculatePlan(tasks)
  if (plan.error) return <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{plan.error}</p>
  if (!tasks.length) return <p className="text-sm text-gray-500 dark:text-gray-400">Виберіть прийнятні пропозиції вище, щоб побудувати план.</p>

  const levels: Record<string, number> = {}
  for (const id of plan.order) {
    const task = tasks.find(t => t.id === id)!
    levels[id] = Math.max(-1, ...task.dependsOn.map(dep => levels[dep])) + 1
  }
  const slots: Record<number, number> = {}
  const positions = Object.fromEntries(plan.order.map(id => {
    const level = levels[id]
    const slot = slots[level] ?? 0
    slots[level] = slot + 1
    return [id, { x: 24 + level * 220, y: 24 + slot * 100 }]
  }))
  const width = Math.max(640, (Math.max(...Object.values(levels)) + 1) * 220 + 24)
  const height = Math.max(150, Math.max(...Object.values(slots)) * 100 + 24)
  const critical = tasks.filter(task => plan.timings[task.id].slack < 1e-8)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Вибрано дій', String(tasks.length)],
          ['Тривалість плану', `${plan.duration} роб. дн.`],
          ['Без резерву часу', String(critical.length)],
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p><p className="mt-1 text-xl font-bold text-indigo-700 dark:text-indigo-300">{value}</p>
        </div>)}
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <svg width={width} height={height} role="img" aria-label="Мережевий графік вибраних дій: стрілки позначають залежності, фіолетові вузли — критичні дії">
          <defs><marker id="network-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 Z" fill="currentColor" /></marker></defs>
          {tasks.flatMap(task => task.dependsOn.map(dep => {
            const from = positions[dep], to = positions[task.id]
            return <path key={`${dep}-${task.id}`} d={`M${from.x + 160},${from.y + 30} C${from.x + 190},${from.y + 30} ${to.x - 30},${to.y + 30} ${to.x},${to.y + 30}`} fill="none" stroke="currentColor" strokeWidth="2" markerEnd="url(#network-arrow)" className="text-gray-400 dark:text-gray-500" />
          }))}
          {tasks.map(task => {
            const { x, y } = positions[task.id]
            const timing = plan.timings[task.id]
            return <g key={task.id}>
              <title>{task.code}: {task.title || 'Дія без назви'}. Початок: {timing.start}, завершення: {timing.finish}, резерв: {timing.slack} робочих днів.</title>
              <rect x={x} y={y} width="160" height="60" rx="12" strokeWidth="2" className={timing.slack < 1e-8 ? 'fill-indigo-50 stroke-indigo-500 dark:fill-indigo-950 dark:stroke-indigo-400' : 'fill-gray-50 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600'} />
              <text x={x + 80} y={y + 24} textAnchor="middle" className="fill-gray-900 dark:fill-gray-100 text-sm font-semibold">{task.code} · {task.duration} роб. дн.</text>
              <text x={x + 80} y={y + 45} textAnchor="middle" className="fill-gray-600 dark:fill-gray-400 text-xs">День {timing.start} → {timing.finish}</text>
            </g>
          })}
        </svg>
      </div>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        Стрілка T1 → T2 означає, що T2 починається після завершення T1. Незалежні дії можуть
        виконуватися паралельно. Фіолетові вузли — критичні дії без резерву часу: їхня затримка
        подовжує весь план. Можливі кілька критичних шляхів. Розташування вузлів показує порядок, а не масштаб часу.
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Розклад і резерв часу вибраних дій</caption>
          <thead className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"><tr>{['Дія', 'Початок, день', 'Завершення, день', 'Резерв, дн.'].map(label => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{plan.order.map(id => {
            const task = tasks.find(t => t.id === id)!, timing = plan.timings[id]
            return <tr key={id}><td className="px-4 py-3"><span className="font-semibold">{task.code}</span> — {task.title || 'Дія без назви'}</td><td className="px-4 py-3">{timing.start}</td><td className="px-4 py-3">{timing.finish}</td><td className="px-4 py-3">{Number(timing.slack.toFixed(6))}</td></tr>
          })}</tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">День 0 — умовний початок плану. Резерв — допустима затримка дії без перенесення завершення всього плану. Розрахунок враховує залежності та тривалість, але не враховує зайнятість відповідальних, вихідні й календарні дати.</p>
    </div>
  )
}
