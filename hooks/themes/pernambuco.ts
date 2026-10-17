import { TOKENS } from '../pe/ds.generated'
import type { Palette, Skin } from '../skin'

// The Liga Digital color tokens (@uigovpe/styles). Text, status and surfaces use the
// semantic tokens; the tool kinds, which the design system has no names for, use its
// primitive scale: light shades on a dark terminal, strong ones on a light terminal.
const token = (scheme: 'light' | 'dark', name: string): string => {
  const value = TOKENS[scheme][name]
  if (value === undefined) throw new Error(`pernambuco skin: no token ${name} in the ${scheme} theme`)
  return value
}

const dark = (name: string) => token('dark', name)
const light = (name: string) => token('light', name)

const palette: Palette = {
  read: dark('--color-light-blue-softer'),
  write: dark('--color-light-yellow-default'),
  run: dark('--color-light-green-soft'),
  search: dark('--color-light-blue-soft'),
  web: dark('--color-light-green-softer'),
  mcp: dark('--color-light-yellow-softer'),
  other: dark('--color-light-gray-soft'),
  user: dark('--color-text-primary'),
  fg: dark('--color-text-default'),
  muted: dark('--color-text-placeholder'),
  surface: dark('--color-dark-gray-default'),
  zebra: dark('--color-dark-gray-soft'),
  ok: dark('--color-text-success'),
  err: dark('--color-text-danger'),
  warn: dark('--color-text-warning'),
}

const lightPalette: Palette = {
  read: light('--color-light-blue-default'),
  write: light('--color-light-yellow-strong'),
  run: light('--color-light-green-default'),
  search: light('--color-light-blue-soft'),
  web: light('--color-light-green-strong'),
  mcp: light('--color-dark-yellow-default'),
  other: light('--color-light-gray-default'),
  user: light('--color-text-primary'),
  fg: light('--color-text-default'),
  muted: light('--color-text-secondary'),
  surface: light('--color-light-gray-softer'),
  zebra: light('--color-light-gray-softest'),
  ok: light('--color-text-success'),
  err: light('--color-text-danger'),
  warn: light('--color-text-warning'),
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
