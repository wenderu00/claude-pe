import { expect, test } from 'claude-code/testing'

import { TOKENS } from '../hooks/pe/ds.generated'
import { DEFAULT_PREFS } from '../hooks/command'
import type { Skin } from '../hooks/skin'
import { SKINS } from '../hooks/themes'
import pernambuco from '../hooks/themes/pernambuco'

const HEX = /^#[0-9a-f]{6}$/i
const SLOTS = ['read', 'write', 'run', 'search', 'web', 'mcp', 'other', 'user', 'fg', 'muted', 'surface', 'zebra', 'ok', 'err', 'warn'] as const

test('pernambuco is the only skin and the default', () => {
  expect(SKINS.map((s: Skin) => s.name)).toEqual(['pernambuco'])
  expect(DEFAULT_PREFS.skin).toBe('pernambuco')
})

test('pernambuco: every slot is a color, for dark and for light terminals', () => {
  for (const slot of SLOTS) {
    expect(pernambuco.palette[slot]).toMatch(HEX)
    expect(pernambuco.light?.[slot]).toMatch(HEX)
  }
})

test('pernambuco: text and status colors are the Liga Digital tokens', () => {
  expect(pernambuco.palette.fg).toBe(TOKENS.dark['--color-text-default'])
  expect(pernambuco.palette.user).toBe(TOKENS.dark['--color-text-primary'])
  expect(pernambuco.palette.err).toBe(TOKENS.dark['--color-text-danger'])
  expect(pernambuco.palette.ok).toBe(TOKENS.dark['--color-text-success'])
  expect(pernambuco.light?.fg).toBe(TOKENS.light['--color-text-default'])
  expect(pernambuco.light?.user).toBe(TOKENS.light['--color-text-primary'])
  expect(pernambuco.light?.muted).toBe(TOKENS.light['--color-text-secondary'])
  expect(pernambuco.light?.err).toBe(TOKENS.light['--color-text-danger'])
  expect(pernambuco.light?.ok).toBe(TOKENS.light['--color-text-success'])
  expect(pernambuco.light?.warn).toBe(TOKENS.light['--color-text-warning'])
})

test('pernambuco: each tool kind has its own color', () => {
  for (const palette of [pernambuco.palette, pernambuco.light!]) {
    const kinds = [palette.read, palette.write, palette.run, palette.search, palette.web, palette.mcp]
    expect(new Set(kinds).size).toBe(kinds.length)
  }
})

test('pernambuco: spinner and footer words are in Portuguese', () => {
  expect(pernambuco.label).toBe('Pernambuco')
  expect(pernambuco.spinner).toContain('Pensando')
  expect(pernambuco.done).toContain('Pronto')
})
