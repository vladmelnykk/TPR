import { create } from 'zustand'

export interface Alternative { id: string; name: string }
export interface HierarchyNode { id: string; name: string; children: HierarchyNode[]; matrix: number[][] }
export const COMPARISON_SCALE = [1/9, 1/8, 1/7, 1/6, 1/5, 1/4, 1/3, 1/2, 1, 2, 3, 4, 5, 6, 7, 8, 9]
export const equalMatrix = (size: number): number[][] => Array.from({ length: size }, () => Array(size).fill(1))

/** Principal right eigenvector by power iteration; RI values for sizes 1–9. */
export function analyzeMatrix(matrix: number[][]) {
  const n = matrix.length
  if (!n || n > 9 || matrix.some(row => row.length !== n || row.some(v => !Number.isFinite(v) || v <= 0))) {
    throw new Error('Матриця повинна бути додатною, квадратною та мати від 1 до 9 елементів.')
  }
  let weights = Array(n).fill(1 / n) as number[]
  let converged = false
  for (let step = 0; step < 10000; step++) {
    const next = matrix.map(row => row.reduce((sum, value, j) => sum + value * weights[j], 0))
    const total = next.reduce((a, b) => a + b, 0)
    const normalized = next.map(value => value / total)
    const delta = Math.max(...normalized.map((value, i) => Math.abs(value - weights[i])))
    weights = normalized
    if (delta < 1e-12) { converged = true; break }
  }
  if (!converged) throw new Error('Не вдалося отримати збіжний вектор ваг.')
  const lambda = matrix.reduce((sum, row, i) => sum + row.reduce((s, value, j) => s + value * weights[j], 0) / weights[i], 0) / n
  const ci = n <= 2 ? 0 : Math.max(0, (lambda - n) / (n - 1))
  const ri = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45][n]
  const cr = n <= 2 ? 0 : ci / ri
  return { weights, lambda, ci, cr, consistent: cr <= 0.1 }
}

export function evaluateHierarchy(root: HierarchyNode, alternatives: Alternative[]) {
  const scores = alternatives.map(() => 0)
  const nodes: { node: HierarchyNode; path: string; localWeight: number; globalWeight: number; analysis: ReturnType<typeof analyzeMatrix> }[] = []
  const contributions: { id: string; name: string; path: string; weight: number; localScores: number[]; values: number[] }[] = []
  function visit(node: HierarchyNode, localWeight: number, globalWeight: number, path: string) {
    const analysis = analyzeMatrix(node.matrix)
    nodes.push({ node, path, localWeight, globalWeight, analysis })
    if (node.children.length) {
      node.children.forEach((child, i) => visit(child, analysis.weights[i], globalWeight * analysis.weights[i], path ? `${path} / ${child.name}` : child.name))
    } else {
      const values = analysis.weights.map(weight => weight * globalWeight)
      values.forEach((value, i) => { scores[i] += value })
      contributions.push({ id: node.id, name: node.name, path, weight: globalWeight, localScores: analysis.weights, values })
    }
  }
  visit(root, 1, 1, '')
  const best = Math.max(...scores)
  const ranking = alternatives.map((alternative, i) => ({ ...alternative, score: scores[i], index: i, best: Math.abs(scores[i] - best) < 1e-9 }))
    .sort((a, b) => b.score - a.score)
  return { scores, ranking, nodes, contributions, inconsistent: nodes.filter(item => !item.analysis.consistent) }
}

const locationMatrix = [[1, 1/2, 1/5], [2, 1, 1/2], [5, 2, 1]]
const reputationMatrix = [[1, 2, 3], [1/2, 1, 2], [1/3, 1/2, 1]]
export function createHierarchyExample(multi: boolean) {
  const criteria = (prefix: string): HierarchyNode[] => [
    { id: `${prefix}-location`, name: 'Зручність розташування', children: [], matrix: locationMatrix.map(row => [...row]) },
    { id: `${prefix}-reputation`, name: 'Академічна репутація', children: [], matrix: reputationMatrix.map(row => [...row]) },
  ]
  return {
    goal: 'Обрати університет для навчання',
    alternatives: [{ id: 'a', name: 'Університет А' }, { id: 'b', name: 'Університет Б' }, { id: 'c', name: 'Університет В' }],
    root: multi ? { id: 'root', name: 'Мета', matrix: equalMatrix(2), children: [
      { id: 'martin', name: 'Погляд Мартіна', matrix: [[1, 1/5], [5, 1]], children: criteria('martin') },
      { id: 'jane', name: 'Погляд Джейн', matrix: [[1, 3], [1/3, 1]], children: criteria('jane') },
    ] } : { id: 'root', name: 'Мета', matrix: [[1, 1/5], [5, 1]], children: criteria('single') },
  }
}

function mapNode(node: HierarchyNode, id: string, update: (node: HierarchyNode) => HierarchyNode): HierarchyNode {
  return node.id === id ? update(node) : { ...node, children: node.children.map(child => mapNode(child, id, update)) }
}
function mapLeaves(node: HierarchyNode, update: (matrix: number[][]) => number[][]): HierarchyNode {
  return node.children.length ? { ...node, children: node.children.map(child => mapLeaves(child, update)) } : { ...node, matrix: update(node.matrix) }
}
const removeMatrixIndex = (matrix: number[][], index: number) => matrix.filter((_, i) => i !== index).map(row => row.filter((_, j) => j !== index))
const expandMatrix = (matrix: number[][]) => [...matrix.map(row => [...row, 1]), Array(matrix.length + 1).fill(1)] as number[][]

interface HierarchyState {
  goal: string
  alternatives: Alternative[]
  root: HierarchyNode
  setGoal: (goal: string) => void
  loadExample: (multi: boolean) => void
  renameNode: (id: string, name: string) => void
  addCriterion: (parentId: string) => void
  removeCriterion: (id: string) => void
  setComparison: (nodeId: string, row: number, col: number, value: number) => void
  addAlternative: () => void
  renameAlternative: (id: string, name: string) => void
  removeAlternative: (id: string) => void
}

export const useHierarchyStore = create<HierarchyState>(set => ({
  ...createHierarchyExample(false),
  setGoal: goal => set({ goal }),
  loadExample: multi => set(createHierarchyExample(multi)),
  renameNode: (id, name) => set(s => ({ root: mapNode(s.root, id, node => ({ ...node, name })) })),
  addCriterion: parentId => set(s => ({ root: mapNode(s.root, parentId, node => {
    if (node.children.length >= 9) return node
    const child: HierarchyNode = { id: crypto.randomUUID(), name: 'Новий критерій', children: [], matrix: node.children.length ? equalMatrix(s.alternatives.length) : node.matrix.map(row => [...row]) }
    return { ...node, children: [...node.children, child], matrix: node.children.length ? expandMatrix(node.matrix) : equalMatrix(1) }
  }) })),
  removeCriterion: id => set(s => {
    function remove(node: HierarchyNode): HierarchyNode {
      const index = node.children.findIndex(child => child.id === id)
      if (index >= 0) {
        if (node.children.length === 1) return { ...node, children: [], matrix: node.children[0].matrix.length === s.alternatives.length && !node.children[0].children.length ? node.children[0].matrix : equalMatrix(s.alternatives.length) }
        return { ...node, children: node.children.filter(child => child.id !== id), matrix: removeMatrixIndex(node.matrix, index) }
      }
      return { ...node, children: node.children.map(remove) }
    }
    return { root: remove(s.root) }
  }),
  setComparison: (nodeId, row, col, value) => set(s => {
    if (!COMPARISON_SCALE.some(v => Math.abs(v - value) < 1e-10) || row === col) return s
    return { root: mapNode(s.root, nodeId, node => {
      if (!node.matrix[row] || node.matrix[row][col] === undefined || !node.matrix[col]) return node
      const matrix = node.matrix.map(r => [...r])
      matrix[row][col] = value
      matrix[col][row] = 1 / value
      return { ...node, matrix }
    }) }
  }),
  addAlternative: () => set(s => s.alternatives.length >= 9 ? s : ({
    alternatives: [...s.alternatives, { id: crypto.randomUUID(), name: `Альтернатива ${s.alternatives.length + 1}` }],
    root: mapLeaves(s.root, expandMatrix),
  })),
  renameAlternative: (id, name) => set(s => ({ alternatives: s.alternatives.map(a => a.id === id ? { ...a, name } : a) })),
  removeAlternative: id => set(s => {
    const index = s.alternatives.findIndex(a => a.id === id)
    if (s.alternatives.length <= 2 || index < 0) return s
    return { alternatives: s.alternatives.filter(a => a.id !== id), root: mapLeaves(s.root, matrix => removeMatrixIndex(matrix, index)) }
  }),
}))
