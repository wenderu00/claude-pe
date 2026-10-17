import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

const PLUGIN = 'pe-devkit'
const pane = { title: '', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} } as const
const MODEL = 'claude-sonnet-5-5'

// The Pernambuco flag: blue over white, with the yellow star.
const BLUE = '#2348D0'
const WHITE = '#FFFFFF'
const YELLOW = '#F5C400'
const RED = '#D7262B'

const worker = async ($: Engine, on: On) => {
  mock.clock(on)
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('agent.spawn', () => ({ model: MODEL, agentId: 'a1' }))
  on('turn.complete', () => ({ text: '' }) as never)
  await $.agent.spawn({ tool_use_id: 't1', prompt: 'p', description: 'Flag work', subagentType: 'Explore', provider: 'engine', parentModel: MODEL, background: false, fork: false } as never)
}

const finish = ($: Engine) => ($.turn.complete as (e: unknown) => Promise<unknown>)({ agentId: 'a1', reason: 'answer', answer: 'ok' })

// Half blocks over white: Lis beside the header is drawn in half blocks too, but never on white.
const flagFill = async (ui: Awaited<ReturnType<typeof mountPane>>) =>
  (await ui.findAll({ type: 'Text', text: /^▀+$/ })).filter(t => t.props.backgroundColor === WHITE)

const mountPane =($: Engine, surface: 'terminal' | 'desktop') =>
  $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'progress-agents', props: pane })

test('terminal: a finished agent’s bar is the whole flag: blue over white, the star, the sun and the cross', async ($, on) => {
  await worker($, on)
  await finish($)
  const ui = await mountPane($, 'terminal')
  expect((await flagFill(ui)).length).toBeGreaterThan(0)
  const colour = async (glyph: RegExp) => (await ui.findAll({ type: 'Text', text: glyph })).map(t => t.props.color)
  expect(await colour(/^★$/)).toEqual([YELLOW])
  expect(await colour(/^✹$/)).toEqual([YELLOW])
  expect(await colour(/^✝$/)).toEqual([RED])
  await ui.unmount()
})

test('terminal: a running agent with no steps keeps the grey context bar, not the flag', async ($, on) => {
  await worker($, on)
  const ui = await mountPane($, 'terminal')
  expect(await flagFill(ui)).toHaveLength(0)
  expect(await ui.findAll({ type: 'Text', text: /★/ })).toHaveLength(0)
  await ui.unmount()
})

test('desktop: a finished agent’s bar is the flag, blue over white', async ($, on) => {
  await worker($, on)
  await finish($)
  const ui = await mountPane($, 'desktop')
  const sources = (await ui.findAll({ type: 'Svg' })).map(s => String(s.props.source)).join('\n')
  const flag = /<g class="flag"[^>]*>([\s\S]*?)<\/g>/.exec(sources)?.[1] ?? ''
  expect(flag).toContain(BLUE)
  expect(flag).toContain(WHITE)
  await ui.unmount()
})

test('desktop: a running agent with no steps has no flag in its bar', async ($, on) => {
  await worker($, on)
  const ui = await mountPane($, 'desktop')
  const sources = (await ui.findAll({ type: 'Svg' })).map(s => String(s.props.source)).join('\n')
  expect(sources).not.toContain('class="flag"')
  await ui.unmount()
})
