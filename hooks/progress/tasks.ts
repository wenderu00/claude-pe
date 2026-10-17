import type { AgentRun, Flow, TaskItem, TaskStatus } from '../../types'

// Claude's own task list, as the task tools report it: the source of the progress bar.

export type TaskCall = { tool: string; input: unknown; result: unknown }

const STATUSES: readonly string[] = ['pending', 'in_progress', 'completed']
const MAX_TASKS = 200
const MAX_TITLE = 120

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const text = (v: unknown): string => (typeof v === 'string' ? v.trim().slice(0, MAX_TITLE) : '')
const statusOf = (v: unknown): TaskStatus | undefined => (typeof v === 'string' && STATUSES.includes(v) ? (v as TaskStatus) : undefined)

function created(list: TaskItem[], input: unknown, result: unknown): TaskItem[] {
  const task = isRecord(result) && isRecord(result.task) ? result.task : undefined
  const id = task && typeof task.id === 'string' ? task.id : ''
  if (!id) return list
  const subject = text(task?.subject) || (isRecord(input) ? text(input.subject) : '')
  const item: TaskItem = { id, subject, active: isRecord(input) ? text(input.activeForm) : '', status: 'pending' }
  return [...list.filter(t => t.id !== id), item].slice(-MAX_TASKS)
}

function updated(list: TaskItem[], input: unknown): TaskItem[] {
  if (!isRecord(input) || typeof input.taskId !== 'string') return list
  if (input.status === 'deleted') return list.filter(t => t.id !== input.taskId)
  return list.map(t =>
    t.id !== input.taskId
      ? t
      : {
          ...t,
          subject: text(input.subject) || t.subject,
          active: text(input.activeForm) || t.active,
          status: statusOf(input.status) ?? t.status,
        },
  )
}

function fromTodos(list: TaskItem[], result: unknown): TaskItem[] {
  const todos = isRecord(result) && Array.isArray(result.newTodos) ? result.newTodos : undefined
  if (!todos) return list
  return todos.filter(isRecord).slice(0, MAX_TASKS).map((t, i) => ({
    id: `todo-${i}`,
    subject: text(t.content),
    active: text(t.activeForm),
    status: statusOf(t.status) ?? 'pending',
  }))
}

function fromList(list: TaskItem[], result: unknown): TaskItem[] {
  const tasks = isRecord(result) && Array.isArray(result.tasks) ? result.tasks : undefined
  if (!tasks) return list
  const known = new Map(list.map(t => [t.id, t]))
  return tasks
    .filter(isRecord)
    .filter(t => typeof t.id === 'string')
    .slice(0, MAX_TASKS)
    .map(t => ({
      id: t.id as string,
      subject: text(t.subject),
      active: known.get(t.id as string)?.active ?? '',
      status: statusOf(t.status) ?? 'pending',
    }))
}

// The list after one task tool call that succeeded.
export function applyTaskCall(list: TaskItem[], call: TaskCall): TaskItem[] {
  if (call.tool === 'TaskCreate') return created(list, call.input, call.result)
  if (call.tool === 'TaskUpdate') return updated(list, call.input)
  if (call.tool === 'TodoWrite') return fromTodos(list, call.result)
  if (call.tool === 'TaskList') return fromList(list, call.result)
  return list
}

// What the bar draws for the list; null while there is no task.
export function flowOf(list: TaskItem[]): Flow | null {
  if (list.length === 0) return null
  const done = list.filter(t => t.status === 'completed').length
  const current = list.find(t => t.status === 'in_progress') ?? list.find(t => t.status === 'pending') ?? list[list.length - 1]!
  return {
    title: current.active || current.subject,
    total: list.length,
    done,
    running: list.filter(t => t.status === 'in_progress').length,
    phase: 'delegate',
    isFinished: done === list.length,
    tasks: [],
  }
}

// What the bar draws for the session's agents when there is no task list; null while there is no agent.
export function crewFlow(list: AgentRun[]): Flow | null {
  if (list.length === 0) return null
  const running = list.filter(a => a.status === 'running')
  const current = running[0] ?? list[list.length - 1]!
  return {
    title: current.description || current.type,
    total: list.length,
    done: list.length - running.length,
    running: running.length,
    phase: 'agents',
    isFinished: running.length === 0,
    tasks: [],
  }
}
