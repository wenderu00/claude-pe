import { expect, test } from 'claude-code/testing'

import { TOKENS } from '../hooks/pe/ds.generated'
import { DEFAULT_PREFS } from '../hooks/command'
import type { Skin } from '../hooks/skin'
import { SKINS } from '../hooks/themes'
import pernambuco from '../hooks/themes/pernambuco'
import { pernambucoLook } from '../hooks/filetree/look'
import { contrast } from './contrast'

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

// The filetree with the pernambuco skin: dark and light terminals.
const LOOKS = [[pernambucoLook(false), '#1e1e1e', pernambuco.palette], [pernambucoLook(true), '#ffffff', pernambuco.light!]] as const
const TOKEN_VALUES = new Set([...Object.values(TOKENS.dark), ...Object.values(TOKENS.light)].map(v => v.toLowerCase()))

test('filetree look: file categories and activity tones are Liga Digital tokens, or the skin grey for other files', () => {
  for (const [look, , palette] of LOOKS) {
    expect(look.categories.other).toBe(palette.muted)
    for (const c of [look.categories.code, look.categories.config, look.categories.docs]) expect(TOKEN_VALUES.has(c.toLowerCase())).toBe(true)
    expect(look.categories.code).not.toBe(look.theme.accent)
    expect(look.categories.config).not.toBe(look.theme.accent)
    for (const tone of Object.values(look.tones)) for (const c of [...tone.bright, ...tone.dim, tone.solid]) expect(TOKEN_VALUES.has(c.toLowerCase())).toBe(true)
  }
})

test('filetree look: file icons stand at 3:1 off the background, and the two blues and two greys stay apart', () => {
  for (const [look, bg] of LOOKS) {
    for (const c of Object.values(look.categories)) expect(contrast(c, bg)).toBeGreaterThanOrEqual(3)
    expect(contrast(look.categories.code, look.categories.config)).toBeGreaterThanOrEqual(1.3)
    expect(contrast(look.categories.docs, look.categories.other)).toBeGreaterThanOrEqual(1.3)
  }
})

test('filetree look: file icons never take the git colours or the folder colour', () => {
  for (const [look] of LOOKS) {
    const colors = [...Object.values(look.git), look.add, look.del, look.theme.urgent, look.theme.accent]
    for (const c of colors) expect(c).toMatch(HEX)
    const git = new Set(colors.map(c => c!.toLowerCase()))
    for (const c of Object.values(look.categories)) expect(git.has(c.toLowerCase())).toBe(false)
  }
})

test('filetree look: writes shimmer yellow, reads blue, commits green, failures red, and each bright shade reads at 3:1', () => {
  for (const [look, bg] of LOOKS) {
    expect(look.tones.purple).toEqual(look.tones.blue)
    expect(look.tones.teal).toEqual(look.tones.green)
    const solids = ['orange', 'blue', 'green', 'red'].map(k => look.tones[k]!.solid)
    expect(new Set(solids).size).toBe(4)
    for (const tone of Object.values(look.tones)) {
      expect(contrast(tone.solid, bg)).toBeGreaterThanOrEqual(3)
      for (const c of tone.bright) expect(contrast(c, bg)).toBeGreaterThanOrEqual(3)
    }
  }
})
