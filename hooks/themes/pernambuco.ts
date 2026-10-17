import { TOKENS } from '../pe/ds.generated'
import type { Palette, Skin } from '../skin'

// The Liga Digital color tokens (@uigovpe/styles). Text, status and surfaces use the
// semantic tokens; the tool kinds, which the design system has no names for, use its
// primitive scale: light shades on a dark terminal, strong ones on a light terminal.
// No two slots that show as text share a colour, and each one reads at 4.5:1 or more.
const token = (scheme: 'light' | 'dark', name: string): string => {
  const value = TOKENS[scheme][name]
  if (value === undefined) throw new Error(`pernambuco skin: no token ${name} in the ${scheme} theme`)
  return value
}

const dark = (name: string) => token('dark', name)
const light = (name: string) => token('light', name)

// Halfway between two tokens, for the one shade the dark theme lacks: a grey that is
// dimmer than the text but still reads (placeholder #ced2d7 is too bright, disabled too dim).
const mix = (a: string, b: string): string =>
  `#${[1, 3, 5].map(i => Math.round((parseInt(a.slice(i, i + 2), 16) + parseInt(b.slice(i, i + 2), 16)) / 2).toString(16).padStart(2, '0')).join('')}`

const palette: Palette = {
  read: dark('--color-light-blue-softer'),
  write: dark('--color-light-yellow-default'),
  run: dark('--color-light-green-soft'),
  search: dark('--color-light-red-softer'),
  web: dark('--color-light-green-softer'),
  mcp: dark('--color-light-yellow-softer'),
  other: dark('--color-light-gray-soft'),
  user: dark('--color-text-primary'),
  fg: dark('--color-text-default'),
  muted: mix(dark('--color-text-placeholder'), dark('--color-text-disabled')),
  surface: dark('--color-dark-gray-softer'),
  zebra: dark('--color-dark-gray-soft'),
  ok: dark('--color-feedback-success-default'),
  err: dark('--color-text-danger'),
  warn: dark('--color-outline-warning'),
}

const lightPalette: Palette = {
  read: light('--color-dark-blue-softer'),
  write: light('--color-dark-yellow-strong'),
  run: light('--color-light-green-default'),
  search: light('--color-dark-red-default'),
  web: light('--color-dark-green-softer'),
  mcp: light('--color-dark-blue-soft'),
  other: light('--color-dark-gray-softer'),
  user: light('--color-text-primary'),
  fg: light('--color-text-default'),
  muted: light('--color-text-secondary'),
  surface: light('--color-light-gray-soft'),
  zebra: light('--color-light-gray-softer'),
  ok: light('--color-text-success'),
  err: light('--color-text-danger'),
  warn: light('--color-dark-yellow-default'),
}

const skin: Skin = {
  name: 'pernambuco',
  label: 'Pernambuco',
  palette,
  light: lightPalette,
  spinner: ['Pensando', 'Trabalhando', 'Compondo', 'Analisando', 'Ponderando'],
  done: ['Pronto', 'Concluído', 'Feito'],
}

export default skin
