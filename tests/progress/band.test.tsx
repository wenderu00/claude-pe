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

const desktopBar = async ($: Engine) => {
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: band })
  const svg = await ui.find({ type: 'Svg' })
  await ui.unmount()
  return { source: String(svg?.props.source), height: svg?.props.height }
}

type Rect = { x: number; y: number; w: number; h: number; fill: string }
const rectsOf = (svg: string): Rect[] =>
  [...svg.matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)" fill="(#[0-9A-F]{6})"\/>/gi)].map(m => ({
    x: Number(m[1]), y: Number(m[2]), w: Number(m[3]), h: Number(m[4]), fill: m[5]!.toUpperCase(),
  }))
const emblemOf = (source: string) => /<g class="emblem"[^>]*>([\s\S]*?)<\/g>/.exec(source)?.[1] ?? ''
// The star's points, from its path.
const starOf = (emblem: string) => {
  const d = /<path d="([^"]+)" fill="#F5C400"\/>/.exec(emblem)?.[1] ?? ''
  const nums = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(m => Number(m[0]))
  return nums.flatMap((n, i) => (i % 2 ? [] : [{ x: n, y: nums[i + 1]! }]))
}
// The flag's blue band is 11 of the bar's 16 pixels.
const HORIZON = 11

test('desktop: the emblem is the flag’s: the star above the arc, the sun inside it, the cross on the white', async ($, on) => {
  taskEngine(on)
  await halfDone($)
  await setStatus($, '2', 'completed')
  const emblem = emblemOf((await desktopBar($)).source)
  const rects = rectsOf(emblem)
  const arc = rects.filter(r => r.y + r.h <= HORIZON && (r.fill === RED || r.fill === '#1F9E46'))
  expect(arc.length).toBeGreaterThan(0)
  const arcTop = Math.min(...arc.map(r => r.y))
  const star = starOf(emblem)
  expect(star.length).toBe(10)
  expect(Math.max(...star.map(p => p.y))).toBeLessThanOrEqual(arcTop)

  const middle = star.reduce((s, p) => s + p.x, 0) / star.length
  const sun = rects.filter(r => r.fill === YELLOW && r.y + r.h === HORIZON && r.x < middle && r.x + r.w > middle)
  expect(sun.length).toBe(1)
  expect(rects.some(r => r.fill === RED && r.y >= HORIZON)).toBe(true)
})

test('desktop: the emblem sits in the middle of the bar and shows once the bar is filled past it', async ($, on) => {
  taskEngine(on)
  for (const s of ['Uma', 'Duas', 'Três', 'Quatro']) await create($, s)
  await setStatus($, '1', 'completed')
  const shown = (source: string) => {
    const clip = Number(/<clipPath id="e"><rect width="([\d.]+)"/.exec(source)?.[1] ?? NaN)
    const star = starOf(emblemOf(source))
    return clip >= Math.max(...star.map(p => p.x))
  }
  expect(shown((await desktopBar($)).source)).toBe(false)
  for (const id of ['2', '3', '4']) await setStatus($, id, 'completed')
  expect(shown((await desktopBar($)).source)).toBe(true)
})

test('desktop: Lis walks on top of the bar, at the edge of what is done', async ($, on) => {
  taskEngine(on)
  await create($, 'Uma')
  await create($, 'Duas')
  const at = async () => {
    const { source, height } = await desktopBar($)
    const [, bx, by] = /<g transform="translate\(([\d.]+),([\d.]+)\)">/.exec(source) ?? []
    const [, lx, ly, s] = /<g transform="translate\(([\d.]+),([\d.]+)\) scale\(([\d.]+)\)"/.exec(source) ?? []
    return { height, barX: Number(bx), barTop: Number(by), x: Number(lx), feet: Number(ly) + 26 * Number(s) }
  }
  const none = await at()
  await setStatus($, '1', 'completed')
  const half = await at()
  await setStatus($, '2', 'completed')
  const full = await at()

  expect(none.height).toBe(44)
  expect(half.x).toBeGreaterThan(none.x)
  expect(full.x).toBeGreaterThan(half.x)
  for (const p of [none, half, full]) {
    expect(p.x).toBeGreaterThanOrEqual(p.barX)
    expect(p.feet).toBeLessThanOrEqual(p.barTop + 0.01)
  }
})

test('two task calls at once both count', async ($, on) => {
  taskEngine(on)
  await Promise.all([create($, 'Uma'), create($, 'Duas')])
  expect((await terminalBand($)).label).toEqual(['Tarefas 0/2'])
})
