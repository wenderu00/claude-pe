import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import { halfBlocks } from '../../hooks/progress/lis'

const PLUGIN = 'pe-devkit'
const pane = { title: '', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} } as const
const band = { hasSurvey: false, isWorking: false, maxRows: 4, bodyColumns: 100, scroll: { offset: 0, bodyRows: 4 }, view: {} }

// The Pernambuco flag on Lis's chest.
const FLAG = ['#D7262B', '#F5C400', '#1F9E46']

test('two pixel rows make one row of half-block cells', () => {
  expect(halfBlocks(['ab.', '.aa'], { a: '#111111', b: '#222222' })).toEqual([
    [{ ch: '▀', fg: '#111111' }, { ch: '▀', fg: '#222222', bg: '#111111' }, { ch: '▄', fg: '#111111' }],
  ])
})

test('an odd last pixel row draws as top halves', () => {
  expect(halfBlocks(['a.', '..', '.a'], { a: '#111111' })).toEqual([
    [{ ch: '▀', fg: '#111111' }, { ch: ' ' }],
    [{ ch: ' ' }, { ch: '▀', fg: '#111111' }],
  ])
})

test('terminal: Lis stands at the top of the agents pane, 6 rows of 16 cells, in the flag colours', async $ => {
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'progress-agents', props: pane })
  const rows = await ui.findAll({ type: 'Text', text: /^[▀▄ ]{16}$/ })
  expect(rows).toHaveLength(6)
  const colours = new Set((await ui.findAll({ type: 'Text', text: /^[▀▄]+$/ })).flatMap(t => [t.props.color, t.props.backgroundColor]))
  for (const c of FLAG) expect(colours.has(c)).toBe(true)
  await ui.unmount()
})

const taskEngine = (on: On) => {
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Text', props: {}, children: ['stock row'] }))
  on('tool.call', { tool: 'TaskCreate' }, (_$, e) => ({ result: { task: { id: '1', subject: e.subject } } }) as never)
}

test('desktop: the mascot at the end of the progress bar is Lis, in the flag colours', async ($: Engine, on) => {
  taskEngine(on)
  await $.tool.call({ tool: 'TaskCreate', subject: 'Uma', description: 'Uma' } as never)
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: band })
  const source = String((await ui.find({ type: 'Svg' }))?.props.source)
  for (const c of FLAG) expect(source).toContain(c)
  await ui.unmount()
})
