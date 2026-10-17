import { expect, test } from 'claude-code/testing'

import { guard } from '../hooks/parts'

test('guard: next runs the part beneath', async () => {
  const g = guard(async (e: number) => e * 2)
  expect(await g.next(4)).toBe(8)
})

test('guard: a part that failed before next is passed over, the part beneath runs in its place', async () => {
  let runs = 0
  const g = guard(async (e: number) => {
    runs++
    return e + 1
  })
  expect(await g.recover(1)).toBe(2)
  expect(runs).toBe(1)
})

test('guard: a part that failed after next keeps its last next result, the part beneath does not run again', async () => {
  let runs = 0
  const g = guard(async (e: number) => {
    runs++
    return e * 10
  })
  await g.next(1)
  await g.next(2)
  expect(await g.recover(3)).toBe(20)
  expect(runs).toBe(2)
})

test('guard: tells a failure from beneath apart from the part’s own', async () => {
  const boom = new Error('engine')
  const g = guard(async () => {
    throw boom
  })
  await g.next(1).catch(() => undefined)
  expect(g.isFrom(boom)).toBe(true)
  expect(g.isFrom(new Error('part'))).toBe(false)
})
