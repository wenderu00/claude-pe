import { COMPONENTS, DS_VERSIONS } from './ds.generated'

// The @uigovpe components as /pe-component shows them.

export type Component = (typeof COMPONENTS)[number]

const lower = (s: string) => s.toLowerCase()

// The same name ignoring case, else the one component whose name starts with it.
export function findComponent(name: string): Component | undefined {
  const wanted = lower(name)
  const exact = COMPONENTS.find(c => lower(c.name) === wanted)
  if (exact) return exact
  const starts = COMPONENTS.filter(c => lower(c.name).startsWith(wanted))
  return starts.length === 1 ? starts[0] : undefined
}

export function suggestionsFor(name: string): string[] {
  const wanted = lower(name)
  return COMPONENTS.filter(c => lower(c.name).includes(wanted)).map(c => c.name).slice(0, 8)
}

export function listText(): string {
  return [
    `Componentes de @uigovpe/components ${DS_VERSIONS.components} (${COMPONENTS.length}):`,
    COMPONENTS.map(c => (c.obsolete ? `${c.name} (obsoleto)` : c.name)).join(', '),
    '',
    'Use /pe-component <Nome> para ver o import e abrir a história no Storybook.',
  ].join('\n')
}

export function notFoundText(name: string): string {
  const near = suggestionsFor(name)
  return near.length > 0
    ? `O componente "${name}" não existe. Talvez: ${near.join(', ')}.`
    : `O componente "${name}" não existe. /pe-component sem nome lista todos.`
}

export function componentText(c: Component): string {
  const lines = [`${c.name}${c.obsolete ? ' — Obsoleto: não use em código novo.' : ''}`, '', `import { ${c.name} } from '@uigovpe/components'`, '']
  lines.push(`Props: skill pe-design-system, references/components/${c.name}.md`)
  if (c.docsUrl) lines.push(`Storybook: ${c.docsUrl}`)
  return lines.join('\n')
}
