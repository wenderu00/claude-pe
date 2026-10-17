import { expect, test } from 'claude-code/testing'

import { applyTaskCall, flowOf } from '../../hooks/progress/tasks'
import type { TaskItem } from '../../types'

const create = (list: TaskItem[], id: string, subject: string, activeForm?: string) =>
  applyTaskCall(list, { tool: 'TaskCreate', input: { subject, description: '', activeForm }, result: { task: { id, subject } } })
const status = (list: TaskItem[], taskId: string, s: string) =>
  applyTaskCall(list, { tool: 'TaskUpdate', input: { taskId, status: s }, result: { success: true, taskId, updatedFields: ['status'] } })

test('tasks: no task, no bar', () => {
  expect(flowOf([])).toBeNull()
})

test('tasks: created tasks count, the one in progress names the bar', () => {
  let list = create([], '1', 'Ler o layout', 'Lendo o layout')
  list = create(list, '2', 'Trocar o botão')
  list = status(list, '1', 'in_progress')
  expect(flowOf(list)).toMatchObject({ title: 'Lendo o layout', total: 2, done: 0, running: 1, isFinished: false })

  list = status(list, '1', 'completed')
  list = status(list, '2', 'in_progress')
  expect(flowOf(list)).toMatchObject({ title: 'Trocar o botão', total: 2, done: 1, running: 1, isFinished: false })
})

test('tasks: all completed finishes the flow', () => {
  let list = create([], '1', 'Uma')
  list = status(list, '1', 'completed')
  expect(flowOf(list)).toMatchObject({ total: 1, done: 1, isFinished: true })
})

test('tasks: a deleted task leaves the count', () => {
  let list = create([], '1', 'Uma')
  list = create(list, '2', 'Outra')
  list = status(list, '2', 'deleted')
  expect(flowOf(list)).toMatchObject({ total: 1 })
})

test('tasks: a task created after a finished list starts a new list', () => {
  let list = create([], '1', 'Uma')
  list = status(list, '1', 'completed')
  list = create(list, '2', 'Nova')
  expect(flowOf(list)).toMatchObject({ total: 1, done: 0, isFinished: false })
})

test('tasks: TodoWrite replaces the list', () => {
  const todos = [
    { content: 'A', status: 'completed', activeForm: 'Fazendo A' },
    { content: 'B', status: 'in_progress', activeForm: 'Fazendo B' },
    { content: 'C', status: 'pending', activeForm: 'Fazendo C' },
  ]
  const list = applyTaskCall(create([], '9', 'Velha'), { tool: 'TodoWrite', input: { todos }, result: { oldTodos: [], newTodos: todos } })
  expect(flowOf(list)).toMatchObject({ title: 'Fazendo B', total: 3, done: 1, running: 1 })
})

test('tasks: TaskList replaces the list and keeps the words a task was created with', () => {
  const list = applyTaskCall(create([], '1', 'Uma', 'Fazendo uma'), {
    tool: 'TaskList',
    input: {},
    result: { tasks: [{ id: '1', subject: 'Uma', status: 'in_progress', blockedBy: [] }, { id: '2', subject: 'Duas', status: 'pending', blockedBy: [] }] },
  })
  expect(flowOf(list)).toMatchObject({ title: 'Fazendo uma', total: 2, running: 1 })
})

test('tasks: a malformed result changes nothing', () => {
  const list = create([], '1', 'Uma')
  expect(applyTaskCall(list, { tool: 'TaskCreate', input: {}, result: 'oops' })).toEqual(list)
  expect(applyTaskCall(list, { tool: 'TodoWrite', input: {}, result: null })).toEqual(list)
})
