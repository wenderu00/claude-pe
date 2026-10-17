import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const PLUGIN = 'pe-devkit'
const band = { hasSurvey: false, isWorking: false, maxRows: 4, bodyColumns: 100, scroll: { offset: 0, bodyRows: 4 }, view: {} }

// What Claude Code draws above the prompt when no part draws there.
const floor = (on: On) => on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Text', props: {}, children: ['stock row'] }))

// The task tools, answered as the engine answers them.
function taskEngine(on: On) {
  floor(on)
  let next = 0
  on('tool.call', { tool: 'TaskCreate' }, (_$, e) => ({ result: { task: { id: String(++next), subject: e.subject } } }) as never)
  on('tool.call', { tool: 'TaskUpdate' }, (_$, e) => ({ result: { success: true, taskId: e.taskId, updatedFields: ['status'] } }) as never)
}

const create = ($: Engine, subject: string, extra: Record<string, unknown> = {}) =>
  $.tool.call({ tool: 'TaskCreate', subject, description: subject, ...extra } as never)
const setStatus = ($: Engine, taskId: string, status: string) => $.tool.call({ tool: 'TaskUpdate', taskId, status } as never)

async function terminalBand($: Engine) {
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: band })
  const label = (await ui.findAll({ type: 'Text', text: /^(Tarefas \d+\/\d+|Concluído)$/ })).map(t => t.text)
  const title = (await ui.findAll({ type: 'Text', text: /Lendo|Trocando|Uma/ })).map(t => t.text)
  await ui.unmount()
  return { label, title }
}

test('the bar follows Claude’s task list: count, the task in progress, then done', async ($, on) => {
  taskEngine(on)
  await create($, 'Ler o layout', { activeForm: 'Lendo o layout' })
  await create($, 'Trocar o botão', { activeForm: 'Trocando o botão' })
  await setStatus($, '1', 'in_progress')
  expect(await terminalBand($)).toEqual({ label: ['Tarefas 0/2'], title: ['Lendo o layout'] })

  await setStatus($, '1', 'completed')
  await setStatus($, '2', 'in_progress')
  expect((await terminalBand($)).label).toEqual(['Tarefas 1/2'])

  await setStatus($, '2', 'completed')
  expect((await terminalBand($)).label).toEqual(['Concluído'])
})

test('no task, no bar', async ($, on) => {
  floor(on)
  expect(await terminalBand($)).toEqual({ label: [], title: [] })
})

test('a subagent’s own tasks do not move the bar', async ($, on) => {
  taskEngine(on)
  await create($, 'Uma')
  await create($, 'Do subagente', { agentId: 'a1' })
  expect((await terminalBand($)).label).toEqual(['Tarefas 0/1'])
})

test('a failed task call does not move the bar', async ($, on) => {
  floor(on)
  on('tool.call', { tool: 'TaskCreate' }, () => ({ result: 'falhou', isError: true }) as never)
  await create($, 'Uma')
  expect((await terminalBand($)).label).toEqual([])
})

test('dismissed, the bar comes back with the next task change', async ($, on) => {
  taskEngine(on)
  await create($, 'Uma')
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: band })
  await ui.press({ key: 'progress-dismiss' })
  await ui.unmount()
  expect((await terminalBand($)).label).toEqual([])

  await setStatus($, '1', 'in_progress')
  expect((await terminalBand($)).label).toEqual(['Tarefas 0/1'])
})

test('desktop: the bar is one Svg with the count in its text', async ($, on) => {
  taskEngine(on)
  await create($, 'Uma')
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: band })
  const svg = await ui.find({ type: 'Svg' })
  expect(String(svg?.props.alt)).toContain('Tarefas 0/1')
  await ui.unmount()
})

// The Pernambuco flag: blue over white, the red cross, the rainbow arc and the yellow star.
const BLUE = '#2348D0'
const WHITE = '#FFFFFF'
const FLAG = [BLUE, WHITE, '#D7262B', '#F5C400', '#1F9E46']

async function halfDone($: Engine) {
  await create($, 'Uma')
  await create($, 'Duas')
  await setStatus($, '1', 'completed')
}

test('terminal: the done part of the bar is the flag, blue over white, with the star at its head', async ($, on) => {
  taskEngine(on)
  await halfDone($)
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: band })
  const fill = await ui.findAll({ type: 'Text', text: /^▀+$/ })
  expect(fill).toHaveLength(1)
  expect(fill[0]?.props.color).toBe(BLUE)
  expect(fill[0]?.props.backgroundColor).toBe(WHITE)
  const star = await ui.findAll({ type: 'Text', text: '★' })
  expect(star).toHaveLength(1)
  expect(star[0]?.props.color).toBe('#F5C400')
  await ui.unmount()
})

test('terminal: with nothing done, the bar has no flag and no star', async ($, on) => {
  taskEngine(on)
  await create($, 'Uma')
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: band })
  expect(await ui.findAll({ type: 'Text', text: /▀/ })).toHaveLength(0)
  expect(await ui.findAll({ type: 'Text', text: /★/ })).toHaveLength(0)
  await ui.unmount()
})

test('desktop: the done part of the bar is drawn in all the flag colours', async ($, on) => {
  taskEngine(on)
  await halfDone($)
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: band })
  const source = String((await ui.find({ type: 'Svg' }))?.props.source)
  const flag = /<g class="flag">([\s\S]*?)<\/g>/.exec(source)?.[1] ?? ''
  for (const c of FLAG) expect(flag).toContain(c)
  await ui.unmount()
})

test('two task calls at once both count', async ($, on) => {
  taskEngine(on)
  await Promise.all([create($, 'Uma'), create($, 'Duas')])
  expect((await terminalBand($)).label).toEqual(['Tarefas 0/2'])
})
