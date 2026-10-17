import { DS_VERSIONS, TOKENS, WRAPPED_PRIMEREACT } from './ds.generated'

// What the Liga Digital rules see in code Claude just wrote: a primereact component used
// where @uigovpe has its own, and a literal color where a token says the same thing.

export type Issue =
  | { kind: 'primereact'; module: string; components: readonly string[] }
  | { kind: 'hex'; hex: string; tokens: string[] }

const SCRIPT = /\.(tsx?|jsx?|mjs|cjs)$/i
const STYLE = /\.(css|scss|sass|less)$/i
const MARKUP = /\.(tsx|jsx)$/i
const NOT_CHECKED = /\.(test|spec|stories)\.[a-z]+$/i

const IMPORT = /import\s+([^'";]*?)\s+from\s+['"](primereact\/[\w-]+)['"]/g
const HEX = '#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\\b'
// A CSS declaration: a name, its colon and a value that ends the declaration with ; or }.
// A selector such as `a:hover #x {` ends with { and is not one.
const CSS_DECL = /[-\w$]+\s*:\s*([^;{}]*)(?=[;}])/g
const HEX_IN = new RegExp(HEX, 'gi')
// url(#id) and url(file#id) name a fragment, not a color.
const URL = /url\([^)]*\)/gi
// A color-like prop or style key with a quoted hex: `color: '#fff'`, `fill="#fff"`.
const KEY_HEX = new RegExp(`\\b(?:color|background(?:Color)?|border(?:Top|Right|Bottom|Left)?(?:Color)?|fill|stroke|outline(?:Color)?|boxShadow|textShadow)\\s*[:=]\\s*\\{?\\s*(['"\`])(${HEX})\\1`, 'gi')

// An import that brings in at least one value: not `import type`, and not only `type` names.
function bringsValues(clause: string): boolean {
  const c = clause.trim()
  if (/^type\s/.test(c)) return false
  const braces = /\{([^}]*)\}/.exec(c)
  const outside = c.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim()
  if (outside) return true
  const names = (braces?.[1] ?? '').split(',').map(n => n.trim()).filter(Boolean)
  return names.some(n => !/^type\s/.test(n))
}

// Semantic tokens first, then the scale; the text tokens before surfaces and outlines.
const RANK = ['--color-text-', '--color-surface-', '--color-outline-', '--color-feedback-', '--color-background-']
const rank = (name: string): number => {
  const i = RANK.findIndex(p => name.startsWith(p))
  return i < 0 ? RANK.length : i
}

const full = (hex: string): string => {
  const h = hex.toLowerCase()
  return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h
}

function tokensFor(hex: string): string[] {
  const value = full(hex)
  return Object.entries(TOKENS.light)
    .filter(([, v]) => v.toLowerCase() === value)
    .map(([name]) => name)
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .slice(0, 4)
}

// The issues in `text`, the code inserted into the file at `path`, each once.
export function issuesIn(path: string, text: string): Issue[] {
  if (NOT_CHECKED.test(path) || /\.svg$/i.test(path)) return []
  const out: Issue[] = []
  const seen = new Set<string>()
  const add = (key: string, issue: Issue) => {
    if (seen.has(key)) return
    seen.add(key)
    out.push(issue)
  }
  if (SCRIPT.test(path)) {
    for (const m of text.matchAll(IMPORT)) {
      const module = m[2]!
      const components = WRAPPED_PRIMEREACT[module]
      if (components && bringsValues(m[1]!)) add(module, { kind: 'primereact', module, components })
    }
  }
  const hexes = STYLE.test(path)
    ? [...text.matchAll(CSS_DECL)].flatMap(m => [...m[1]!.replace(URL, '').matchAll(HEX_IN)].map(h => h[0]))
    : MARKUP.test(path)
      ? [...text.matchAll(KEY_HEX)].map(m => m[2]!)
      : []
  for (const hex of hexes) add(hex.toLowerCase(), { kind: 'hex', hex, tokens: tokensFor(hex) })
  return out
}

// The @uigovpe/components range a package.json asks for, or null.
export function uigovpeVersion(packageJson: string): string | null {
  try {
    const pkg = JSON.parse(packageJson) as Record<string, Record<string, unknown> | undefined>
    const range = pkg.dependencies?.['@uigovpe/components'] ?? pkg.devDependencies?.['@uigovpe/components']
    return typeof range === 'string' ? range : null
  } catch {
    return null
  }
}

const versionOf = (v: string): number[] | null => {
  const m = /(\d+)\.(\d+)\.(\d+)/.exec(v)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

// Whether the lowest version `range` allows is past `documented`. A range with an upper
// bound or alternatives has no lowest version this can read: never newer.
export function isNewer(range: string, documented: string): boolean {
  if (/[<|]/.test(range)) return false
  const a = versionOf(range)
  const b = versionOf(documented)
  if (!a || !b) return false
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i]! > b[i]!
  return false
}

// What Claude reads after the edit: one line per issue, and the version note when newer.
export function adviceFor(path: string, issues: Issue[], newerRange?: string): string {
  const lines = [`pe-devkit (Liga Digital), na edição de ${path}:`]
  for (const issue of issues) {
    if (issue.kind === 'primereact') {
      const names = issue.components.map(c => `\`${c}\``).join(' ou ')
      lines.push(`- \`${issue.module}\` importado como valor. Use ${names} de \`@uigovpe/components\`, que estende o do PrimeReact com o visual do governo. Tipos podem vir com \`import type\`.`)
    } else {
      const tokens = issue.tokens.length ? ` Mesmo valor: ${issue.tokens.map(t => `\`var(${t})\``).join(', ')}.` : ''
      lines.push(`- Cor literal \`${issue.hex}\`. Use um token de cor pelo significado (skill pe-design-system, references/tokens.md).${tokens}`)
    }
  }
  if (newerRange) {
    lines.push(`- O projeto pede @uigovpe/components ${newerRange}, e a referência da skill é da ${DS_VERSIONS.components}. Confirme as props no Storybook antes de usar.`)
  }
  return lines.join('\n')
}
