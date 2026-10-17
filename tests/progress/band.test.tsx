import { expect, mock, test } from 'claude-code/testing'
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

const RED = '#D7262B'
const YELLOW = '#F5C400'

type Mounted = Awaited<ReturnType<Engine['ui']['mount']>>

// The colours of the half-block cells: each one is a pixel above (color) and one below (backgroundColor).
const pixelColours = async (ui: Mounted) =>
  new Set((await ui.findAll({ type: 'Text', text: /^[▀▄]+$/ })).flatMap(t => [t.props.color, t.props.backgroundColor]).filter(Boolean))

// The emblem: the star above the arc, the sun inside it, the cross on the white.
async function emblem(ui: Mounted) {
  const one = async (glyph: RegExp) => (await ui.findAll({ type: 'Text', text: glyph })).map(t => t.props.color)
  return { star: await one(/^★$/), sun: await one(/^✹$/), cross: await one(/^✝$/) }
}

const terminal = ($: Engine) => $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: band })

test('terminal: a full bar is the whole flag, with the star, the arc, the sun and the cross', async ($, on) => {
  taskEngine(on)
  await create($, 'Uma')
  await create($, 'Duas')
  await setStatus($, '1', 'completed')
  await setStatus($, '2', 'completed')
  const ui = await terminal($)
  expect(await emblem(ui)).toEqual({ star: [YELLOW], sun: [YELLOW], cross: [RED] })
  const colours = await pixelColours(ui)
  for (const c of FLAG) expect(colours.has(c)).toBe(true)
  await ui.unmount()
})

test('terminal: a bar filled short of the middle shows blue over white, but not the emblem yet', async ($, on) => {
  taskEngine(on)
  for (const s of ['Uma', 'Duas', 'Três', 'Quatro']) await create($, s)
  await setStatus($, '1', 'completed')
  const ui = await terminal($)
  expect(await emblem(ui)).toEqual({ star: [], sun: [], cross: [] })
  const colours = await pixelColours(ui)
  expect(colours.has(BLUE)).toBe(true)
  expect(colours.has(WHITE)).toBe(true)
  await ui.unmount()
})

test('terminal: with nothing done, the bar has no flag', async ($, on) => {
  taskEngine(on)
  await create($, 'Uma')
  const ui = await terminal($)
  expect((await pixelColours(ui)).size).toBe(0)
  expect(await emblem(ui)).toEqual({ star: [], sun: [], cross: [] })
  await ui.unmount()
})

// Workers, as the engine starts and ends them.
function crewEngine(on: On) {
  mock.clock(on)
  on('ui.open', () => ({ value: { isPlaced: true } }))
  let n = 0
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: `a${++n}` }))
  on('turn.complete', () => ({ text: '' }) as never)
}

const spawn = ($: Engine, description: string) =>
  $.agent.spawn({ tool_use_id: description, prompt: 'p', description, subagentType: 'Explore', provider: 'engine', parentModel: 'claude-sonnet-5-5', background: false, fork: false } as never)
const end = ($: Engine, agentId: string) => ($.turn.complete as (e: unknown) => Promise<unknown>)({ agentId, reason: 'answer', answer: 'ok' })

async function crewBand($: Engine) {
  const ui = await terminal($)
  const label = (await ui.findAll({ type: 'Text', text: /^(Agentes \d+\/\d+|Tarefas \d+\/\d+|Concluído)$/ })).map(t => t.text)
  const title = (await ui.findAll({ type: 'Text', text: /^Agente / })).map(t => t.text)
  await ui.unmount()
  return { label, title }
}

test('with no task list, the bar follows the session’s agents', async ($, on) => {
  floor(on)
  crewEngine(on)
  await spawn($, 'Agente um')
  await spawn($, 'Agente dois')
  await spawn($, 'Agente três')
  await end($, 'a1')
  expect(await crewBand($)).toEqual({ label: ['Agentes 1/3'], title: ['Agente dois'] })

  await end($, 'a2')
  await end($, 'a3')
  expect((await crewBand($)).label).toEqual(['Concluído'])
})

test('a task list wins over the agents', async ($, on) => {
  taskEngine(on)
  crewEngine(on)
  await spawn($, 'Agente um')
  await create($, 'Uma')
  expect((await crewBand($)).label).toEqual(['Tarefas 0/1'])
})

test('dismissed, the agents bar comes back with the next agent', async ($, on) => {
  floor(on)
  crewEngine(on)
  await spawn($, 'Agente um')
  const ui = await terminal($)
  await ui.press({ key: 'progress-dismiss' })
  await ui.unmount()
  expect((await crewBand($)).label).toEqual([])

  await spawn($, 'Agente dois')
  expect((await crewBand($)).label).toEqual(['Agentes 0/2'])
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
