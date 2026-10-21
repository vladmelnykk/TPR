import test from 'node:test'
import assert from 'node:assert/strict'
import { calculatePlan, getTasks, scoreProposal, useGroupDecisionStore } from '../src/stores/groupDecisionStore.ts'
import type { PlannedTask } from '../src/stores/groupDecisionStore.ts'

const task = (id: string, duration: number, dependsOn: string[] = []): PlannedTask => ({
  id, code: id, title: id, cause: 'Причина', duration, dependsOn,
  owner: '', votes: {}, acceptable: true, selected: true,
})

test('початковий приклад: 5 причин по 5 пропозицій і план із розгалуженням та об’єднанням', () => {
  const { causes, experts } = useGroupDecisionStore.getState()
  assert.equal(causes.length, 5)
  assert.ok(causes.every(cause => cause.proposals.length === 5))
  assert.ok(causes.flatMap(cause => cause.proposals).every(p => scoreProposal(p, experts).count === 3))
  const tasks = getTasks(causes)
  const plan = calculatePlan(tasks)
  assert.equal(tasks.length, 6)
  assert.equal(plan.error, null)
  assert.equal(plan.duration, 8)
  assert.deepEqual(plan.timings.p6, { start: 2, finish: 5, slack: 0 })
  assert.deepEqual(plan.timings.p16, { start: 2, finish: 4, slack: 1 })
  assert.deepEqual(plan.timings.p21, { start: 5, finish: 7, slack: 0 })
  assert.deepEqual(plan.timings.p22, { start: 7, finish: 8, slack: 0 })
  assert.equal(tasks.filter(task => task.dependsOn.includes('p1')).length, 2)
  assert.deepEqual(tasks.find(task => task.id === 'p21')!.dependsOn, ['p6', 'p16'])
})

test('паралельні гілки: злиття чекає на всіх попередників, коротша гілка має резерв', () => {
  const plan = calculatePlan([task('d', 2, ['b', 'c']), task('c', 1, ['a']), task('a', 2), task('b', 4, ['a'])])
  assert.equal(plan.error, null)
  assert.equal(plan.duration, 8)
  assert.deepEqual(plan.timings.d, { start: 6, finish: 8, slack: 0 })
  assert.deepEqual(plan.timings.c, { start: 2, finish: 3, slack: 3 })
})

test('незалежні дії та кілька критичних шляхів', () => {
  const plan = calculatePlan([task('a', 5), task('b', 5), task('c', 1)])
  assert.equal(plan.duration, 5)
  assert.equal(plan.timings.a.slack, 0)
  assert.equal(plan.timings.b.slack, 0)
  assert.equal(plan.timings.c.slack, 4)
})

test('цикл, відсутня залежність і некоректна тривалість не дають оманливого розкладу', () => {
  assert.match(calculatePlan([task('a', 1, ['b']), task('b', 1, ['a'])]).error!, /цикл/)
  assert.match(calculatePlan([task('a', 1, ['a'])]).error!, /цикл/)
  assert.match(calculatePlan([task('a', 1, ['missing'])]).error!, /не вибрано/)
  for (const duration of [0, -1, NaN, Infinity]) assert.ok(calculatePlan([task('a', duration)]).error)
})

test('порожній план та дробові робочі дні', () => {
  assert.equal(calculatePlan([]).duration, 0)
  assert.equal(calculatePlan([task('a', 0.5), task('b', 1.5, ['a'])]).duration, 2)
})

test('середня оцінка доступна лише після голосування всіх учасників', () => {
  const experts = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
  const proposal = task('p', 1)
  assert.deepEqual(scoreProposal({ ...proposal, votes: { a: 5, b: 0 } }, experts), { count: 1, average: null })
  assert.deepEqual(scoreProposal({ ...proposal, votes: { a: 5, b: 3 } }, experts), { count: 2, average: 4 })
  assert.equal(scoreProposal({ ...proposal, votes: { a: 5, b: NaN } }, experts).average, null)
})

test('відхилення або видалення дії очищує залежності; можна зняти вибір і повернути дію', () => {
  const initial = useGroupDecisionStore.getState()
  try {
    initial.updateProposal('p1', { acceptable: false })
    let tasks = getTasks(useGroupDecisionStore.getState().causes)
    assert.ok(!tasks.some(t => t.id === 'p1'))
    assert.deepEqual(tasks.find(t => t.id === 'p6')!.dependsOn, [])
    assert.equal(calculatePlan(tasks).duration, 6)
    initial.removeCause('c2')
    tasks = getTasks(useGroupDecisionStore.getState().causes)
    assert.deepEqual(tasks.find(t => t.id === 'p11')!.dependsOn, [])
    assert.equal(calculatePlan(tasks).duration, 5)
  } finally { useGroupDecisionStore.setState(initial) }
})

test('новий учасник вимагає нової оцінки; видалення учасника очищує голоси; останній залишається', () => {
  const initial = useGroupDecisionStore.getState()
  try {
    initial.addExpert()
    let state = useGroupDecisionStore.getState()
    assert.equal(scoreProposal(state.causes[0].proposals[0], state.experts).average, null)
    initial.removeExpert(state.experts[3].id)
    initial.removeExpert('e1')
    state = useGroupDecisionStore.getState()
    assert.equal(state.causes[0].proposals[0].votes.e1, undefined)
    assert.equal(scoreProposal(state.causes[0].proposals[0], state.experts).average, 4.5)
    initial.removeExpert('e2')
    initial.removeExpert('e3')
    assert.equal(useGroupDecisionStore.getState().experts.length, 1)
  } finally { useGroupDecisionStore.setState(initial) }
})
