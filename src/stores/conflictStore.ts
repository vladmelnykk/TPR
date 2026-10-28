import { create } from 'zustand'

export interface ConflictCriterion { id: string; name: string; direction: 'min' | 'max'; weight: number; unit: string }
export interface ConflictAlternative { id: string; name: string; values: Record<string, number | null> }
export interface ConflictModel { goal: string; criteria: ConflictCriterion[]; alternatives: ConflictAlternative[] }

export function calculateConflict(model: ConflictModel) {
  const errors: string[] = []
  const { criteria, alternatives } = model
  if (!criteria.some(c => c.direction === 'min') || !criteria.some(c => c.direction === 'max')) errors.push('Додайте хоча б один показник до кожної групи.')
  if (alternatives.length < 2) errors.push('Для порівняння потрібні щонайменше дві альтернативи.')
  if (criteria.some(c => !Number.isFinite(c.weight) || c.weight < 0)) errors.push('Ваги мають бути невід’ємними скінченними числами.')
  for (const direction of ['min', 'max'] as const) {
    if (!criteria.some(c => c.direction === direction && c.weight > 0)) errors.push(`У групі «${direction === 'max' ? 'Збільшувати' : 'Зменшувати'}» потрібна хоча б одна додатна вага.`)
  }
  if (alternatives.some(a => criteria.some(c => a.values[c.id] === null || a.values[c.id] === undefined || !Number.isFinite(a.values[c.id]) || a.values[c.id]! <= 0))) errors.push('Заповніть усі клітинки додатними числами: нормування передбачає ділення, тому нуль і від’ємні значення не допускаються.')
  const weightSum = criteria.reduce((sum, c) => sum + c.weight, 0)
  if (!Number.isFinite(weightSum)) errors.push('Сума ваг завелика для розрахунку.')
  if (errors.length) return { errors, weightSum, references: {} as Record<string, number>, rows: [] as ConflictRow[] }
  const references = Object.fromEntries(criteria.map(c => [c.id, (c.direction === 'max' ? Math.max : Math.min)(...alternatives.map(a => a.values[c.id]!))]))
  const rows = alternatives.map(a => {
    const normalized = Object.fromEntries(criteria.map(c => [c.id, c.direction === 'max' ? a.values[c.id]! / references[c.id] : references[c.id] / a.values[c.id]!]))
    const weighted = Object.fromEntries(criteria.map(c => [c.id, normalized[c.id] * c.weight]))
    const benefit = criteria.filter(c => c.direction === 'max').reduce((sum, c) => sum + weighted[c.id], 0)
    const denominator = criteria.filter(c => c.direction === 'min').reduce((sum, c) => sum + weighted[c.id], 0)
    return { id: a.id, name: a.name, normalized, weighted, benefit, denominator, score: benefit / denominator, best: false }
  })
  if (rows.some(r => !Number.isFinite(r.score) || r.denominator <= 0)) return { errors: ['Значення надто малі або великі для стійкого ділення. Змініть масштаб вхідних показників або ваг.'], weightSum, references, rows: [] as ConflictRow[] }
  const best = Math.max(...rows.map(r => r.score))
  rows.forEach(row => { row.best = Math.abs(row.score - best) <= 1e-9 * Math.max(1, Math.abs(best)) })
  return { errors, weightSum, references, rows }
}
export interface ConflictRow { id: string; name: string; normalized: Record<string, number>; weighted: Record<string, number>; benefit: number; denominator: number; score: number; best: boolean }

export function conflictExample(): ConflictModel {
  return {
    goal: 'Обрати варіант підсилювача за групами конфліктних показників',
    criteria: [
      { id: 'cost', name: 'Вартість', direction: 'min', weight: 0.2, unit: 'ум. од.' },
      { id: 'current', name: 'Показник струму', direction: 'min', weight: 0.2, unit: '' },
      { id: 'distortion', name: 'Показник гармонік', direction: 'min', weight: 0.2, unit: '' },
      { id: 'reliability', name: 'Показник надійності', direction: 'max', weight: 0.25, unit: '' },
      { id: 'power', name: 'Показник потужності', direction: 'max', weight: 0.15, unit: '' },
    ],
    alternatives: [
      { id: 'a', name: 'Підсилювач А', values: { cost: 1.1, current: 0.030, distortion: 0.909, reliability: 0.907, power: 1.818 } },
      { id: 'b', name: 'Підсилювач Б', values: { cost: 1.08, current: 0.062, distortion: 0.277, reliability: 0.924, power: 1.851 } },
      { id: 'c', name: 'Підсилювач В', values: { cost: 1.07, current: 0.099, distortion: 0.934, reliability: 0.933, power: 0.934 } },
    ],
  }
}

// Supply current and output power for the three ICs, in the order УН5, УН8, УН4.
export const AMPLIFIER_VARIANTS = [
  [30.50,1.98,14.80,2.20,10.12,0.90],[29.80,2.20,15.20,2,10,1.20],[29.60,1.90,14.50,1.97,9.50,1.50],
  [28,1.50,14.60,1.87,10.60,1.40],[30.15,2.18,15.34,2.60,9.87,1.57],[28.70,1.76,15,2,9.18,1.36],
  [29.57,1.98,15.18,1.95,9.64,1.76],[30,2,15.60,2.97,9.27,1.42],[32.15,2.18,15.25,1.53,10.80,1.12],
  [29.80,1.76,14.34,1.97,9.85,1.08],[30.18,2.12,15.21,2.06,10.16,1],[30,2.05,15.06,2,9.87,1.12],
  [30.15,1.98,15.18,1.97,9.64,1.50],[28.60,2.19,14.96,2.12,10.08,1.57],[29.16,2.21,15.10,2,10.60,1.36],
  [30,2.07,15.06,2.12,10,1],[32.19,1.98,15.19,1.97,10.02,1.16],[30.18,1.72,14.36,2.08,9.76,1],
  [29.64,2,15.19,2.11,9.88,1.12],[27.32,1.76,15.33,2.02,10.06,1.21],[29,1.82,14.45,1.98,10.98,1.36],
  [30,2,15.17,2,10.02,1.06],[29.65,2,15,2.17,9.76,0.86],[31.16,2.05,14.86,1.99,9.98,1.02],[27,1.89,15.08,2,10,1.14],
]
export function amplifierModel(variant: number, hours: number, otherCost: number, elementCount: number): ConflictModel {
  const values = AMPLIFIER_VARIANTS[variant - 1]
  if (!values || !Number.isFinite(hours) || hours < 0 || !Number.isFinite(otherCost) || otherCost < 0 || !Number.isInteger(elementCount) || elementCount < 1) throw new Error('Перевірте номер варіанта, час, додаткову вартість та кількість елементів.')
  const reliability = Math.exp(-1e-7 * elementCount * hours)
  if (reliability === 0) throw new Error('Завеликий час або кількість елементів: надійність округлюється до нуля.')
  return {
    goal: `Обрати підсилювач потужністю від 1 Вт — варіант ${variant}`,
    criteria: [
      { id: 'cost', name: 'Сумарна вартість C', direction: 'min', weight: 0.25, unit: 'ум. од.' },
      { id: 'current', name: 'Показник струму 1 / (I × C)', direction: 'min', weight: 0.25, unit: '1/(мА·ум. од.)' },
      { id: 'reliability', name: 'Показник надійності P / C', direction: 'max', weight: 0.30, unit: '1/ум. од.' },
      { id: 'power', name: 'Показник потужності N / C', direction: 'max', weight: 0.20, unit: 'Вт/ум. од.' },
    ],
    alternatives: ['К174УН5','К174УН8','К174УН4'].flatMap((name, i) => {
      if (values[i*2+1] < 1) return []
      const cost = [3.12,3.10,3.11][i] + otherCost
      return [{ id: `ic-${i}`, name, values: { cost, current: 1 / (values[i*2] * cost), reliability: reliability / cost, power: values[i*2+1] / cost } }]
    }),
  }
}

export const PERSONAL_AMPLIFIER_SETUP = { variant: 3, hours: 10000, otherCost: 0, elementCount: 1 } as const
export function personalConflictExample(): ConflictModel {
  const { variant, hours, otherCost, elementCount } = PERSONAL_AMPLIFIER_SETUP
  return amplifierModel(variant, hours, otherCost, elementCount)
}

export function emptyConflict(): ConflictModel {
  return { goal: '', criteria: [
    { id: 'min', name: '', direction: 'min', weight: 0.5, unit: '' },
    { id: 'max', name: '', direction: 'max', weight: 0.5, unit: '' },
  ], alternatives: [{ id: 'a', name: '', values: { min: null, max: null } }, { id: 'b', name: '', values: { min: null, max: null } }] }
}
interface ConflictState extends ConflictModel {
  load: (model: ConflictModel) => void
  setGoal: (goal: string) => void
  addAlternative: () => void
  removeAlternative: (id: string) => void
  renameAlternative: (id: string, name: string) => void
  addCriterion: (direction: 'min' | 'max') => void
  removeCriterion: (id: string) => void
  updateCriterion: (id: string, patch: Partial<Omit<ConflictCriterion,'id'>>) => void
  setValue: (alternativeId: string, criterionId: string, value: number | null) => void
}
export const useConflictStore = create<ConflictState>(set => ({
  ...personalConflictExample(),
  load: model => set(model),
  setGoal: goal => set({ goal }),
  addAlternative: () => set(s => ({ alternatives: [...s.alternatives, { id: crypto.randomUUID(), name: '', values: Object.fromEntries(s.criteria.map(c => [c.id,null])) }] })),
  removeAlternative: id => set(s => s.alternatives.length > 2 ? { alternatives: s.alternatives.filter(a => a.id !== id) } : s),
  renameAlternative: (id, name) => set(s => ({ alternatives: s.alternatives.map(a => a.id === id ? { ...a,name } : a) })),
  addCriterion: direction => set(s => {
    const id = crypto.randomUUID()
    return { criteria: [...s.criteria, { id,name:'',direction,weight:0,unit:'' }], alternatives: s.alternatives.map(a => ({ ...a,values:{...a.values,[id]:null} })) }
  }),
  removeCriterion: id => set(s => ({ criteria: s.criteria.filter(c => c.id !== id), alternatives: s.alternatives.map(a => ({ ...a,values:Object.fromEntries(Object.entries(a.values).filter(([key]) => key !== id)) })) })),
  updateCriterion: (id, patch) => set(s => ({ criteria: s.criteria.map(c => c.id === id ? { ...c,...patch } : c) })),
  setValue: (aid, cid, value) => set(s => ({ alternatives: s.alternatives.map(a => a.id === aid ? { ...a,values:{...a.values,[cid]:value} } : a) })),
}))
