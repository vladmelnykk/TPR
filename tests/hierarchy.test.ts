import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeMatrix, createHierarchyExample, equalMatrix, evaluateHierarchy, useHierarchyStore } from '../src/stores/hierarchyStore.ts'
import type { HierarchyNode } from '../src/stores/hierarchyStore.ts'

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`)
function verifyShape(node: HierarchyNode, alternativesCount: number) {
  const size = node.children.length || alternativesCount
  assert.equal(node.matrix.length, size)
  node.matrix.forEach((row, i) => {
    assert.equal(row.length, size)
    close(row[i], 1)
    row.forEach((value, j) => close(value * node.matrix[j][i], 1))
  })
  node.children.forEach(child => verifyShape(child, alternativesCount))
}

test('власний вектор узгодженої матриці відновлює відомі ваги', () => {
  const weights = [0.6, 0.3, 0.1]
  const analysis = analyzeMatrix(weights.map(w => weights.map(other => w / other)))
  analysis.weights.forEach((w, i) => close(w, weights[i]))
  close(analysis.lambda, 3)
  close(analysis.ci, 0)
  close(analysis.cr, 0)
})

test('рівні оцінки дають рівні пріоритети, включно з одним і двома елементами', () => {
  for (const n of [1, 2, 3, 9]) {
    const result = analyzeMatrix(equalMatrix(n))
    result.weights.forEach(w => close(w, 1 / n))
    close(result.cr, 0)
  }
})

test('суперечливий цикл переваг виявляється як неузгоджений', () => {
  const result = analyzeMatrix([[1, 9, 1/9], [1/9, 1, 9], [9, 1/9, 1]])
  assert.ok(result.cr > 0.1)
  assert.equal(result.consistent, false)
  for (const invalid of [[], [[1, 2]], [[1, 0], [1, 1]], [[NaN]]]) assert.throws(() => analyzeMatrix(invalid))
})

test('один рівень: точне поєднання локальних оцінок із вагами критеріїв', () => {
  const model = createHierarchyExample(false)
  const result = evaluateHierarchy(model.root, model.alternatives)
  const location = analyzeMatrix(model.root.children[0].matrix).weights
  const reputation = analyzeMatrix(model.root.children[1].matrix).weights
  result.scores.forEach((score, i) => close(score, location[i] / 6 + reputation[i] * 5 / 6))
  close(result.scores.reduce((a, b) => a + b, 0), 1)
  assert.equal(result.ranking[0].id, 'a')
  assert.equal(result.inconsistent.length, 0)
})

test('два рівні: глобальна вага є добутком ваг на шляху', () => {
  const model = createHierarchyExample(true)
  const result = evaluateHierarchy(model.root, model.alternatives)
  close(result.contributions[0].weight, 0.5 / 6)
  close(result.contributions[2].weight, 0.5 * 0.75)
  close(result.contributions.reduce((sum, c) => sum + c.weight, 0), 1)
  close(result.scores.reduce((a, b) => a + b, 0), 1)
  assert.equal(result.nodes.length, 7)
  result.scores.forEach((score, i) => close(score, result.contributions.reduce((sum, c) => sum + c.values[i], 0)))
})

test('редагування автоматично змінює обернену клітинку та захищає діагональ', () => {
  const initial = useHierarchyStore.getState()
  try {
    initial.setComparison('root', 0, 1, 7)
    close(useHierarchyStore.getState().root.matrix[1][0], 1 / 7)
    initial.setComparison('root', 0, 0, 9)
    initial.setComparison('root', 0, 1, 0)
    close(useHierarchyStore.getState().root.matrix[0][0], 1)
    close(useHierarchyStore.getState().root.matrix[0][1], 7)
  } finally { useHierarchyStore.setState(initial) }
})

test('додавання підкритерію переносить оцінки, зміна альтернатив оновлює всі кінцеві матриці', () => {
  const initial = useHierarchyStore.getState()
  try {
    const before = initial.root.children[0].matrix
    initial.addCriterion('single-location')
    let state = useHierarchyStore.getState()
    assert.deepEqual(state.root.children[0].children[0].matrix, before)
    initial.addCriterion('single-location')
    initial.addAlternative()
    state = useHierarchyStore.getState()
    verifyShape(state.root, 4)
    initial.removeAlternative('b')
    state = useHierarchyStore.getState()
    verifyShape(state.root, 3)
    assert.deepEqual(state.alternatives.map(a => a.id).slice(0, 2), ['a', 'c'])
    close(evaluateHierarchy(state.root, state.alternatives).scores.reduce((a, b) => a + b, 0), 1)
  } finally { useHierarchyStore.setState(initial) }
})

test('видалення гілок і ліміти розміру зберігають придатну до розрахунку ієрархію', () => {
  const initial = useHierarchyStore.getState()
  try {
    initial.loadExample(true)
    initial.removeCriterion('martin')
    initial.removeCriterion('jane')
    let state = useHierarchyStore.getState()
    verifyShape(state.root, 3)
    assert.equal(evaluateHierarchy(state.root, state.alternatives).ranking.filter(a => a.best).length, 3)
    for (let i = 0; i < 12; i++) { initial.addAlternative(); initial.addCriterion('root') }
    state = useHierarchyStore.getState()
    assert.equal(state.alternatives.length, 9)
    assert.equal(state.root.children.length, 9)
    verifyShape(state.root, 9)
    for (const a of state.alternatives) initial.removeAlternative(a.id)
    state = useHierarchyStore.getState()
    assert.equal(state.alternatives.length, 2)
    verifyShape(state.root, 2)
  } finally { useHierarchyStore.setState(initial) }
})
