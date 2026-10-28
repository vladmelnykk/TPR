import test from 'node:test'
import assert from 'node:assert/strict'
import { amplifierModel, calculateConflict, personalConflictExample, conflictExample, emptyConflict, useConflictStore } from '../src/stores/conflictStore.ts'

const close = (a: number,b: number) => assert.ok(Math.abs(a-b)<1e-10, `${a} != ${b}`)

test('нормування та згортка прикладу відтворюють формулу без округлення проміжних чисел', () => {
  const model=conflictExample(), result=calculateConflict(model)
  assert.deepEqual(result.errors,[])
  assert.equal(result.references.cost,1.07)
  assert.equal(result.references.power,1.851)
  const a=result.rows[0], c=result.rows[2]
  close(a.normalized.cost,1.07/1.1)
  close(a.normalized.power,1.818/1.851)
  close(a.denominator,0.2*(1.07/1.1+1+0.277/0.909))
  close(a.benefit,0.25*0.907/0.933+0.15*1.818/1.851)
  close(c.score,(0.25+0.15*0.934/1.851)/(0.2+0.2*0.030/0.099+0.2*0.277/0.934))
  assert.equal(c.best,true)
  assert.ok(result.rows.every(r=>Object.values(r.normalized).every(v=>v>0&&v<=1)))
})

test('однакові альтернативи мають однаковий найкращий результат', () => {
  const model=conflictExample()
  model.alternatives=model.alternatives.map(a=>({...a,values:{...model.alternatives[0].values}}))
  const result=calculateConflict(model)
  assert.equal(result.rows.filter(r=>r.best).length,3)
  result.rows.forEach(row=>close(row.score,0.4/0.6))
})

test('спільне масштабування ваг не змінює E, зміна відносної ваги груп впливає на нього', () => {
  const model=conflictExample(), before=calculateConflict(model)
  const scaled=calculateConflict({...model,criteria:model.criteria.map(c=>({...c,weight:c.weight*2}))})
  scaled.rows.forEach((row,i)=>close(row.score,before.rows[i].score))
  const benefits=calculateConflict({...model,criteria:model.criteria.map(c=>({...c,weight:c.direction==='max'?c.weight*2:c.weight}))})
  benefits.rows.forEach((row,i)=>close(row.score,before.rows[i].score*2))
})

test('нуль, від’ємне число, нескінченність і порожня клітинка блокують розрахунок', () => {
  for (const value of [0,-1,NaN,Infinity,null]) {
    const model=conflictExample();model.alternatives[0].values.cost=value
    assert.ok(calculateConflict(model).errors.length>0)
    assert.equal(calculateConflict(model).rows.length,0)
  }
})

test('відсутня група, від’ємна вага та нульова сумарна вага групи виявляються', () => {
  const model=conflictExample()
  assert.ok(calculateConflict({...model,criteria:model.criteria.filter(c=>c.direction==='max')}).errors.length)
  assert.ok(calculateConflict({...model,criteria:model.criteria.map(c=>({...c,weight: c.direction==='min'?0:c.weight}))}).errors.length)
  assert.ok(calculateConflict({...model,criteria:model.criteria.map(c=>({...c,weight:-1}))}).errors.length)
  assert.ok(calculateConflict(emptyConflict()).errors.length)
})

test('властивість обраної схеми: покращення min-показника може зменшити E', () => {
  const model=conflictExample();const before=calculateConflict(model).rows[0].score
  model.alternatives[0].values.cost=1.08
  assert.ok(calculateConflict(model).rows[0].score<before)
})

test('25 наборів підсилювачів створюють чотири показники за заданими формулами', () => {
  for(let variant=1;variant<=25;variant++) assert.deepEqual(calculateConflict(amplifierModel(variant,10000,1,4)).errors,[])
  const model=amplifierModel(1,10000,1,4), first=model.alternatives[0].values
  assert.equal(model.alternatives.length,2)
  assert.ok(!model.alternatives.some(a=>a.name==='К174УН4'))
  assert.equal(amplifierModel(25,10000,1,4).alternatives.length,3)
  close(first.cost!,4.12)
  close(first.current!,1/(30.5*4.12))
  close(first.reliability!,Math.exp(-1e-7*4*10000)/4.12)
  close(first.power!,1.98/4.12)
  for(const args of [[0,1,0,1],[26,1,0,1],[1,-1,0,1],[1,1,-1,1],[1,1,0,0],[1,1,0,1.5]]) assert.throws(()=>amplifierModel(...args as [number,number,number,number]))
})

test('редагування синхронно додає та прибирає стовпці в обох наборах даних', () => {
  const initial=useConflictStore.getState()
  try {
    initial.addCriterion('max')
    let s=useConflictStore.getState(), id=s.criteria[s.criteria.length-1].id
    assert.ok(s.alternatives.every(a=>a.values[id]===null))
    initial.setValue(initial.alternatives[0].id,id,5)
    assert.equal(useConflictStore.getState().alternatives[0].values[id],5)
    initial.removeCriterion(id)
    s=useConflictStore.getState()
    assert.ok(s.alternatives.every(a=>!(id in a.values)))
    initial.addAlternative()
    s=useConflictStore.getState()
    assert.equal(Object.keys(s.alternatives[s.alternatives.length-1].values).length,s.criteria.length)
    initial.load(emptyConflict())
    s=useConflictStore.getState()
    assert.equal(s.goal,'')
    assert.equal(s.alternatives.length,2)
    initial.load(conflictExample())
    assert.equal(calculateConflict(useConflictStore.getState()).rows.length,3)
  } finally {useConflictStore.setState(initial)}
})


test('персональний приклад відповідає третьому варіанту характеристик', () => {
  const model = personalConflictExample()
  assert.equal(model.alternatives.length, 3)
  assert.match(model.goal, /варіант 3/)
  const expected = [[3.12, 29.6, 1.9], [3.10, 14.5, 1.97], [3.11, 9.5, 1.5]]
  model.alternatives.forEach((a, i) => {
    const [cost, current, power] = expected[i]
    close(a.values.cost!, cost)
    close(a.values.current!, 1 / (current * cost))
    close(a.values.power!, power / cost)
    close(a.values.reliability!, Math.exp(-0.001) / cost)
  })
  const result = calculateConflict(model)
  assert.deepEqual(result.errors, [])
  assert.equal(result.rows.find(row => row.best)!.name, 'К174УН4')
  close(result.rows[2].score, 1.3695734611508499)
})
