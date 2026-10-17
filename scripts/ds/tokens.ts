import postcss from 'postcss'

export type Tokens = { light: Record<string, string>; dark: Record<string, string> }

type Decls = Record<string, string>

const VAR = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/

// The custom properties declared directly on a top-level rule with exactly this selector.
function declsOf(root: postcss.Root, selector: string): Decls {
  const out: Decls = {}
  root.each(node => {
    if (node.type !== 'rule' || node.selector.trim() !== selector) return
    node.each(d => {
      if (d.type === 'decl' && d.prop.startsWith('--')) out[d.prop] = d.value.trim()
    })
  })
  return out
}

function resolve(name: string, scope: Decls, seen: Set<string> = new Set()): string | undefined {
  if (seen.has(name)) return undefined
  const raw = scope[name]
  if (raw === undefined) return undefined
  const m = VAR.exec(raw)
  if (!m) return raw
  seen.add(name)
  const inner = resolve(m[1]!, scope, seen) ?? m[2]?.trim()
  return inner === undefined ? undefined : raw.replace(m[0], inner)
}

function resolveAll(scope: Decls): Record<string, string> {
  const out: Record<string, string> = {}
  for (const name of Object.keys(scope).sort()) {
    if (!name.startsWith('--color-')) continue
    const value = resolve(name, scope)
    if (value !== undefined && !VAR.test(value)) out[name] = value
  }
  return out
}

// `:root` is the light theme; `.dark` sits on top of it.
export function extractTokens(css: string): Tokens {
  const root = postcss.parse(css)
  const light = declsOf(root, ':root')
  const dark = { ...light, ...declsOf(root, '.dark') }
  return { light: resolveAll(light), dark: resolveAll(dark) }
}
