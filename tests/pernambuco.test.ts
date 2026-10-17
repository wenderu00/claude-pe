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
  expect(pernambuco.palette.ok).toBe(TOKENS.dark['--color-feedback-success-default'])
  expect(pernambuco.palette.warn).toBe(TOKENS.dark['--color-outline-warning'])
  expect(pernambuco.light?.fg).toBe(TOKENS.light['--color-text-default'])
  expect(pernambuco.light?.user).toBe(TOKENS.light['--color-text-primary'])
  expect(pernambuco.light?.muted).toBe(TOKENS.light['--color-text-secondary'])
  expect(pernambuco.light?.err).toBe(TOKENS.light['--color-text-danger'])
  expect(pernambuco.light?.ok).toBe(TOKENS.light['--color-text-success'])
  expect(pernambuco.light?.warn).toBe(TOKENS.light['--color-dark-yellow-default'])
})

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const TEXT = SLOTS.filter(slot => slot !== 'surface' && slot !== 'zebra')

test('pernambuco: no two text slots share a colour', () => {
  for (const palette of [pernambuco.palette, pernambuco.light!]) {
    const colors = TEXT.map(slot => palette[slot].toLowerCase())
    expect(new Set(colors).size).toBe(colors.length)
  }
})

test('pernambuco: text reads at 4.5:1, inline code on its band too', () => {
  for (const [palette, bg] of [[pernambuco.palette, '#000000'], [pernambuco.light!, '#ffffff']] as const) {
    for (const slot of TEXT) expect(contrast(palette[slot], bg)).toBeGreaterThanOrEqual(4.5)
    // Inline code is `search` text on `surface`; table text is `fg` on both bands.
    expect(contrast(palette.search, palette.surface)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(palette.fg, palette.surface)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(palette.fg, palette.zebra)).toBeGreaterThanOrEqual(4.5)
  }
})

test('pernambuco: the bands stand off the background, the header more than the stripes', () => {
  for (const [palette, bg] of [[pernambuco.palette, '#1e1e1e'], [pernambuco.light!, '#ffffff']] as const) {
    expect(contrast(palette.zebra, bg)).toBeGreaterThanOrEqual(1.15)
    expect(contrast(palette.surface, bg)).toBeGreaterThan(contrast(palette.zebra, bg))
  }
})

test('pernambuco: spinner and footer words are in Portuguese', () => {
  expect(pernambuco.label).toBe('Pernambuco')
  expect(pernambuco.spinner).toContain('Pensando')
  expect(pernambuco.done).toContain('Pronto')
})
