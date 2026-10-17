import type { ComponentDoc } from './components.ts'
import type { Tokens } from './tokens.ts'

export const STORYBOOK = 'https://ligadigital.pe.gov.br/storybook/index.html'

export type StorybookEntry = { id: string; title: string; name: string; type: 'docs' | 'story' }
export type StorybookIndex = { v: number; entries: Record<string, StorybookEntry> }
export type Stories = { docsUrl: string; stories: { name: string; url: string }[]; obsolete: boolean }
export type Versions = { components: string; styles: string }

const SECTIONS = ['Componentes', 'Obsoleto', 'Context', 'Templates']

const header = (pkg: string, version: string): string =>
  `> Gerado de \`${pkg}@${version}\` por \`npm run sync-ds\`. Não edite à mão.`

const cell = (s: string): string => s.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ')

// The Storybook page of a component: the same name ignoring case, or the longest
// story name the component name starts with (StepperHeader is in Stepper).
export function storiesFor(index: StorybookIndex, component: string): Stories | undefined {
  const entries = Object.values(index.entries).filter(e => SECTIONS.includes(e.title.split('/')[0]!))
  const nameOf = (e: StorybookEntry) => e.title.split('/').slice(1).join('/').toLowerCase()
  const wanted = component.toLowerCase()
  let match = entries.filter(e => nameOf(e) === wanted)
  if (match.length === 0) {
    const prefix = entries
      .map(nameOf)
      .filter(n => n.length > 0 && wanted.startsWith(n))
      .sort((a, b) => b.length - a.length)[0]
    if (prefix) match = entries.filter(e => nameOf(e) === prefix)
  }
  const docs = match.find(e => e.type === 'docs')
  if (!docs) return undefined
  return {
    docsUrl: `${STORYBOOK}?path=/docs/${docs.id}`,
    stories: match.filter(e => e.type === 'story').map(e => ({ name: e.name, url: `${STORYBOOK}?path=/story/${e.id}` })),
    obsolete: docs.title.startsWith('Obsoleto/'),
  }
}

export function renderComponent(doc: ComponentDoc, stories: Stories | undefined, versions: Versions): string {
  const out: string[] = [`# ${doc.name}`, '']
  if (stories?.obsolete) out.push('> **Obsoleto.** Não use em código novo. Veja no Storybook o que o substitui.', '')
  out.push(header('@uigovpe/components', versions.components), '')
  if (doc.doc) out.push(doc.doc, '')
  out.push('```tsx', `import { ${doc.name} } from '@uigovpe/components'`, '```', '')
  for (const b of doc.bases) {
    const except = b.omit?.length ? `, exceto ${b.omit.map(k => `\`${k}\``).join(', ')}` : ''
    out.push(`**Estende** \`${b.name}\` de \`${b.module}\`${except}. As props de lá também valem.`, '')
  }
  if (doc.props.length > 0) {
    out.push('## Props próprias', '', '| Prop | Tipo | Obrigatória | Descrição |', '|---|---|---|---|')
    for (const p of doc.props) {
      const text = [p.deprecated ? '**Obsoleta.**' : '', cell(p.doc)].filter(Boolean).join(' ')
      out.push(`| \`${p.name}\` | \`${cell(p.type)}\` | ${p.optional ? 'não' : 'sim'} | ${text} |`)
    }
    out.push('')
  } else if (doc.bases.length === 0) {
    out.push('Sem props tipadas no pacote. Veja o Storybook.', '')
  }
  if (stories) {
    out.push('## Storybook', '', `- [Docs](${stories.docsUrl})`)
    for (const s of stories.stories) out.push(`- [${s.name}](${s.url})`)
    out.push('')
  }
  return out.join('\n')
}

export function renderIndex(docs: ComponentDoc[], versions: Versions): string {
  const out = [
    '# Componentes',
    '',
    header('@uigovpe/components', versions.components),
    '',
    '| Componente | Descrição |',
    '|---|---|',
    ...docs.map(d => `| [${d.name}](${d.name}.md) | ${cell(d.doc)} |`),
    '',
  ]
  return out.join('\n')
}

export function renderTokens(tokens: Tokens, versions: Versions): string {
  const names = [...new Set([...Object.keys(tokens.light), ...Object.keys(tokens.dark)])].sort()
  const out = [
    '# Tokens de cor',
    '',
    header('@uigovpe/styles', versions.styles),
    '',
    'Claro vale em `:root`. Escuro vale dentro de `.dark`.',
    '',
    '| Token | Claro | Escuro |',
    '|---|---|---|',
    ...names.map(n => `| \`var(${n})\` | \`${tokens.light[n] ?? '—'}\` | \`${tokens.dark[n] ?? '—'}\` |`),
    '',
  ]
  return out.join('\n')
}
