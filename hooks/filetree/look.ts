import type { Theme } from '../../types'
import { forTheme } from '../light'
import { TOKENS } from '../pe/ds.generated'
import pernambuco from '../themes/pernambuco'
import { LIGHT_TONES, TONES } from './git'
import { type Category, GIT_COLOR, LIGHT_GIT_COLOR } from './icons'

export type Tone = { bright: string[]; dim: string[]; solid: string }

// Every colour the tree draws with, for one skin on one background.
export type Look = {
  theme: Theme
  git: Record<string, string>
  add: string
  del: string
  hover: string
  tones: Record<string, Tone>
  categories: Record<Category, string>
}

function faint(hex: string): string {
  const v = parseInt(hex.slice(1), 16)
  const ch = (shift: number) => Math.round(0x26 + (((v >> shift) & 255) - 0x26) * 0.3)
  return `#${[16, 8, 0].map(x => ch(x).toString(16).padStart(2, '0')).join('')}`
}

// The tree without a skin: `theme` is the Omarchy theme or the built-in dark or light one.
export function defaultLook(theme: Theme, light: boolean): Look {
  return {
    theme,
    git: light ? LIGHT_GIT_COLOR : GIT_COLOR,
    add: light ? '#14532d' : '#98c379',
    del: light ? '#7f1d1d' : '#e06c75',
    hover: light ? '#f0f2f5' : faint(theme.selection),
    tones: light ? LIGHT_TONES : TONES,
    categories: { code: theme.muted, config: theme.muted, docs: theme.muted, other: theme.muted },
  }
}

// The primitive scales are the same in both Liga Digital themes.
const ds = (name: string): string => {
  const value = TOKENS.dark[`--color-${name}`]
  if (value === undefined) throw new Error(`filetree look: no token --color-${name}`)
  return value
}
const scale = (bright: string[], dim: string[], solid: string): Tone => ({ bright: bright.map(ds), dim: dim.map(ds), solid: ds(solid) })

// Bright shades run from the edge of the shimmer to its peak; each reads at 3:1 or more.
const DARK_TONES = {
  yellow: scale(['light-yellow-default', 'light-yellow-soft', 'light-yellow-softer', 'light-yellow-softest'], ['dark-yellow-strong', 'dark-yellow-default', 'dark-yellow-softer', 'dark-yellow-softest'], 'light-yellow-soft'),
  blue: scale(['light-blue-soft', 'light-blue-softer', 'light-blue-softest', 'light-gray-softest'], ['dark-blue-softer', 'dark-blue-softest', 'light-blue-soft', 'light-blue-softer'], 'light-blue-softer'),
  green: scale(['dark-green-default', 'light-green-soft', 'light-green-softer', 'light-green-softest'], ['light-green-default', 'dark-green-soft', 'dark-green-softer', 'dark-green-default'], 'light-green-soft'),
  red: scale(['light-red-soft', 'dark-red-softest', 'light-red-softer', 'light-red-softest'], ['dark-red-default', 'light-red-strong', 'light-red-default', 'light-red-soft'], 'dark-red-softest'),
  gray: scale(['light-gray-soft', 'light-gray-softer', 'light-gray-softest', 'light-gray-softest'], ['dark-gray-softer', 'dark-gray-softest', 'light-gray-default', 'light-gray-soft'], 'light-gray-soft'),
}

const LIGHT_DS_TONES = {
  yellow: scale(['dark-yellow-softer', 'dark-yellow-default', 'dark-yellow-strong', 'dark-yellow-strong'], ['dark-yellow-softest', 'light-yellow-strong', 'dark-yellow-softer', 'dark-yellow-default'], 'dark-yellow-default'),
  blue: scale(['dark-blue-softest', 'dark-blue-softer', 'light-blue-default', 'light-blue-strong'], ['light-blue-soft', 'dark-blue-softest', 'dark-blue-softer', 'light-blue-default'], 'dark-blue-softer'),
  green: scale(['dark-green-soft', 'light-green-default', 'light-green-strong', 'dark-green-strong'], ['dark-green-softest', 'dark-green-default', 'dark-green-softer', 'dark-green-soft'], 'light-green-default'),
  red: scale(['light-red-default', 'light-red-strong', 'dark-red-default', 'dark-red-strong'], ['dark-red-softest', 'light-red-soft', 'light-red-default', 'light-red-strong'], 'light-red-default'),
  gray: scale(['light-gray-default', 'dark-gray-softer', 'dark-gray-soft', 'dark-gray-default'], ['light-gray-soft', 'dark-gray-softest', 'light-gray-default', 'dark-gray-softer'], 'light-gray-default'),
}

// The design system has five hues, so the tree's seven activity tones share them:
// writes yellow, reads and fetches blue, commits and pushes green, failures red.
function byActivity(hues: typeof DARK_TONES): Record<string, Tone> {
  return { orange: hues.yellow, purple: hues.blue, blue: hues.blue, green: hues.green, teal: hues.green, red: hues.red, cyan: hues.gray }
}

// The tree with the pernambuco skin: chrome and git from the skin's palette, file
// categories in blue and grey only, since green, yellow and red mean git status.
export function pernambucoLook(light: boolean): Look {
  const p = forTheme(pernambuco, light).palette
  return {
    theme: { fg: p.fg, accent: p.user, muted: p.muted, urgent: p.err, selection: p.surface, bg: '' },
    git: { A: p.ok, '?': p.ok, R: p.user, C: p.user, M: p.warn, T: p.warn },
    add: p.ok,
    del: p.err,
    hover: p.zebra,
    tones: byActivity(light ? LIGHT_DS_TONES : DARK_TONES),
    categories: light
      ? { code: ds('dark-blue-softest'), config: ds('light-blue-soft'), docs: ds('dark-gray-soft'), other: p.muted }
      : { code: ds('light-blue-softer'), config: ds('light-blue-softest'), docs: ds('light-gray-soft'), other: p.muted },
  }
}
