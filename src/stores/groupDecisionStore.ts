import { create } from 'zustand'

export interface Expert { id: string; name: string }
export interface Proposal {
  id: string
  title: string
  acceptable: boolean
  selected: boolean
  votes: Record<string, number>
  duration: number
  owner: string
  dependsOn: string[]
}
export interface Cause { id: string; title: string; proposals: Proposal[] }
export interface PlannedTask extends Proposal { cause: string; code: string }

export function scoreProposal(proposal: Proposal, experts: Expert[]) {
  const votes = experts.map(expert => proposal.votes[expert.id])
    .filter(value => Number.isFinite(value) && value >= 1 && value <= 5)
  return {
    count: votes.length,
    average: votes.length === experts.length && votes.length > 0
      ? votes.reduce((sum, value) => sum + value, 0) / votes.length : null,
  }
}

export function getTasks(causes: Cause[]): PlannedTask[] {
  return causes.flatMap(cause => cause.proposals.filter(p => p.selected && p.acceptable)
    .map(proposal => ({ ...proposal, cause: cause.title })))
    .map((proposal, index) => ({ ...proposal, code: `T${index + 1}` }))
}

/** Earliest-start schedule for a directed acyclic graph; durations use working days. */
export function calculatePlan(tasks: PlannedTask[]) {
  const byId = new Map(tasks.map(task => [task.id, task]))
  const timings: Record<string, { start: number; finish: number; slack: number }> = {}
  const order: string[] = []
  const pending = new Set(tasks.map(task => task.id))
  if (tasks.some(task => !Number.isFinite(task.duration) || task.duration <= 0)) {
    return { error: 'Тривалість кожної дії має бути більшою за 0.', timings, order, duration: 0 }
  }
  if (tasks.some(task => task.dependsOn.some(id => !byId.has(id)))) {
    return { error: 'У плані є залежність від дії, яку не вибрано.', timings, order, duration: 0 }
  }
  while (pending.size) {
    const ready = tasks.filter(task => pending.has(task.id) && task.dependsOn.every(id => id in timings))
    if (!ready.length) return {
      error: 'У залежностях є цикл. Приберіть замкнений ланцюжок, щоб розрахувати план.',
      timings: {}, order: [], duration: 0,
    }
    for (const task of ready) {
      const start = Math.max(0, ...task.dependsOn.map(id => timings[id].finish))
      timings[task.id] = { start, finish: start + task.duration, slack: 0 }
      order.push(task.id)
      pending.delete(task.id)
    }
  }
  const duration = Math.max(0, ...Object.values(timings).map(timing => timing.finish))
  const latestStarts: Record<string, number> = {}
  for (const id of [...order].reverse()) {
    const successors = tasks.filter(task => task.dependsOn.includes(id))
    const latestFinish = successors.length ? Math.min(...successors.map(task => latestStarts[task.id])) : duration
    latestStarts[id] = latestFinish - byId.get(id)!.duration
    timings[id].slack = Math.max(0, latestStarts[id] - timings[id].start)
  }
  return { error: null, timings, order, duration }
}

const proposal = (id: string, title: string, extra: Partial<Proposal> = {}): Proposal => ({
  id, title, acceptable: true, selected: false, votes: {}, duration: 1, owner: '', dependsOn: [], ...extra,
})
const initialCauses: Cause[] = [
  { id: 'c1', title: 'Незрозумілий розподіл відповідальності', proposals: [
    proposal('p1', 'Узгодити ролі та відповідальних', { selected: true, duration: 2, owner: 'Олена', votes: { e1: 5, e2: 4, e3: 5 } }),
    proposal('p2', 'Запровадити короткі щоденні зустрічі команди', { duration: 1, owner: 'Марія', votes: { e1: 3, e2: 4, e3: 3 } }),
    proposal('p3', 'Описати зони відповідальності у спільному довіднику', { duration: 2, owner: 'Олена', votes: { e1: 4, e2: 4, e3: 5 } }),
    proposal('p4', 'Призначити резервного виконавця для ключових завдань', { duration: 1, owner: 'Андрій', votes: { e1: 4, e2: 3, e3: 4 } }),
    proposal('p5', 'Погоджувати кожне завдання лише з керівником', { acceptable: false, duration: 1, owner: 'Олена', votes: { e1: 2, e2: 1, e3: 2 } }),
  ] },
  { id: 'c2', title: 'Завдання надходять через різні канали', proposals: [
    proposal('p6', 'Створити єдину дошку завдань', { selected: true, duration: 3, owner: 'Андрій', dependsOn: ['p1'], votes: { e1: 5, e2: 5, e3: 4 } }),
    proposal('p7', 'Збирати всі запити електронною поштою', { acceptable: false, duration: 1, owner: 'Марія', votes: { e1: 2, e2: 2, e3: 3 } }),
    proposal('p8', 'Створити форму подання нового запиту', { duration: 2, owner: 'Андрій', votes: { e1: 4, e2: 5, e3: 4 } }),
    proposal('p9', 'Затвердити єдиний шаблон опису завдання', { duration: 1, owner: 'Олена', votes: { e1: 4, e2: 4, e3: 4 } }),
    proposal('p10', 'Призначити координатора вхідних запитів', { duration: 1, owner: 'Марія', votes: { e1: 3, e2: 4, e3: 4 } }),
  ] },
  { id: 'c3', title: 'Команда пізно помічає затримки', proposals: [
    proposal('p11', 'Налаштувати сповіщення про строки на дошці завдань', { selected: true, duration: 1, owner: 'Марія', dependsOn: ['p6'], votes: { e1: 4, e2: 5, e3: 5 } }),
    proposal('p12', 'Переглядати прогрес щотижня', { duration: 1, owner: 'Олена', votes: { e1: 4, e2: 4, e3: 4 } }),
    proposal('p13', 'Відстежувати час перебування завдань у кожному статусі', { duration: 2, owner: 'Андрій', votes: { e1: 4, e2: 5, e3: 4 } }),
    proposal('p14', 'Узгодити порядок повідомлення про блокування', { duration: 1, owner: 'Марія', votes: { e1: 5, e2: 4, e3: 4 } }),
    proposal('p15', 'Збирати погодинні звіти від кожного виконавця', { acceptable: false, duration: 2, owner: 'Олена', votes: { e1: 1, e2: 2, e3: 1 } }),
  ] },
  { id: 'c4', title: 'Забагато одночасних завдань і суперечливі пріоритети', proposals: [
    proposal('p16', 'Узгодити пріоритети та ліміти одночасної роботи', { selected: true, duration: 2, owner: 'Олена', dependsOn: ['p1'], votes: { e1: 5, e2: 4, e3: 5 } }),
    proposal('p17', 'Виділити окремий час для термінових запитів', { duration: 1, owner: 'Марія', votes: { e1: 4, e2: 3, e3: 4 } }),
    proposal('p18', 'Щотижня переглядати чергу завдань із замовниками', { duration: 1, owner: 'Олена', votes: { e1: 4, e2: 4, e3: 5 } }),
    proposal('p19', 'Планувати навантаження з резервом на непередбачені роботи', { duration: 2, owner: 'Андрій', votes: { e1: 4, e2: 5, e3: 4 } }),
    proposal('p20', 'Виконувати всі нові запити негайно', { acceptable: false, duration: 1, owner: 'Марія', votes: { e1: 1, e2: 1, e3: 2 } }),
  ] },
  { id: 'c5', title: 'Команда не має спільних навичок роботи за новим процесом', proposals: [
    proposal('p21', 'Провести навчання роботі з дошкою та правилами пріоритетів', { selected: true, duration: 2, owner: 'Андрій', dependsOn: ['p6', 'p16'], votes: { e1: 5, e2: 5, e3: 4 } }),
    proposal('p22', 'Провести спільний пілот і розібрати його результати', { selected: true, duration: 1, owner: 'Марія', dependsOn: ['p11', 'p21'], votes: { e1: 5, e2: 4, e3: 5 } }),
    proposal('p23', 'Підготувати коротку інструкцію з прикладами', { duration: 2, owner: 'Олена', votes: { e1: 4, e2: 4, e3: 5 } }),
    proposal('p24', 'Запровадити наставництво для нових учасників', { duration: 3, owner: 'Андрій', votes: { e1: 4, e2: 3, e3: 4 } }),
    proposal('p25', 'Залишити освоєння процесу виключно на самостійне вивчення', { acceptable: false, duration: 1, owner: 'Олена', votes: { e1: 2, e2: 2, e3: 1 } }),
  ] },
]

function cleanDependencies(causes: Cause[]) {
  const selected = new Set(getTasks(causes).map(task => task.id))
  return causes.map(cause => ({ ...cause, proposals: cause.proposals.map(p => ({
    ...p, dependsOn: p.dependsOn.filter(id => selected.has(id)),
  })) }))
}

interface GroupDecisionState {
  problem: string
  experts: Expert[]
  causes: Cause[]
  setProblem: (problem: string) => void
  addExpert: () => void
  renameExpert: (id: string, name: string) => void
  removeExpert: (id: string) => void
  addCause: () => void
  renameCause: (id: string, title: string) => void
  removeCause: (id: string) => void
  addProposal: (causeId: string) => void
  updateProposal: (id: string, patch: Partial<Omit<Proposal, 'id' | 'votes'>>) => void
  removeProposal: (id: string) => void
  vote: (proposalId: string, expertId: string, value: number) => void
}

export const useGroupDecisionStore = create<GroupDecisionState>(set => ({
  problem: 'Команда регулярно завершує завдання із запізненням',
  experts: [{ id: 'e1', name: 'Олена' }, { id: 'e2', name: 'Андрій' }, { id: 'e3', name: 'Марія' }],
  causes: initialCauses,
  setProblem: problem => set({ problem }),
  addExpert: () => set(s => ({ experts: [...s.experts, { id: crypto.randomUUID(), name: `Учасник ${s.experts.length + 1}` }] })),
  renameExpert: (id, name) => set(s => ({ experts: s.experts.map(e => e.id === id ? { ...e, name } : e) })),
  removeExpert: id => set(s => s.experts.length <= 1 ? s : ({
    experts: s.experts.filter(e => e.id !== id),
    causes: s.causes.map(c => ({ ...c, proposals: c.proposals.map(p => ({
      ...p, votes: Object.fromEntries(Object.entries(p.votes).filter(([expertId]) => expertId !== id)),
    })) })),
  })),
  addCause: () => set(s => ({ causes: [...s.causes, { id: crypto.randomUUID(), title: '', proposals: [] }] })),
  renameCause: (id, title) => set(s => ({ causes: s.causes.map(c => c.id === id ? { ...c, title } : c) })),
  removeCause: id => set(s => ({ causes: cleanDependencies(s.causes.filter(c => c.id !== id)) })),
  addProposal: causeId => set(s => ({ causes: s.causes.map(c => c.id === causeId
    ? { ...c, proposals: [...c.proposals, proposal(crypto.randomUUID(), '')] } : c) })),
  updateProposal: (id, patch) => set(s => ({ causes: cleanDependencies(s.causes.map(c => ({ ...c,
    proposals: c.proposals.map(p => p.id === id ? {
      ...p, ...patch, selected: patch.acceptable === false ? false : patch.selected ?? p.selected,
    } : p),
  }))) })),
  removeProposal: id => set(s => ({ causes: cleanDependencies(s.causes.map(c => ({
    ...c, proposals: c.proposals.filter(p => p.id !== id),
  }))) })),
  vote: (proposalId, expertId, value) => set(s => {
    if (!s.experts.some(e => e.id === expertId) || !Number.isInteger(value) || value < 0 || value > 5) return s
    return { causes: s.causes.map(c => ({ ...c, proposals: c.proposals.map(p => p.id === proposalId
      ? { ...p, votes: { ...p.votes, [expertId]: value } } : p) })) }
  }),
}))
