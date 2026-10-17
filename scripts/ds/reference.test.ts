import { test } from 'node:test'
import assert from 'node:assert/strict'

import { renderComponent, renderIndex, renderTokens, storiesFor } from './reference.ts'
import type { StorybookIndex } from './reference.ts'
import type { ComponentDoc } from './components.ts'

const SB = 'https://ligadigital.pe.gov.br/storybook/index.html'

const INDEX: StorybookIndex = {
  v: 5,
  entries: {
    'componentes-button--docs': { id: 'componentes-button--docs', title: 'Componentes/Button', name: 'Docs', type: 'docs' },
    'componentes-button--default': { id: 'componentes-button--default', title: 'Componentes/Button', name: 'Default', type: 'story' },
    'componentes-button--button-link': { id: 'componentes-button--button-link', title: 'Componentes/Button', name: 'Button Link', type: 'story' },
    'componentes-breadcrumb--docs': { id: 'componentes-breadcrumb--docs', title: 'Componentes/Breadcrumb', name: 'Docs', type: 'docs' },
    'componentes-stepper--docs': { id: 'componentes-stepper--docs', title: 'Componentes/Stepper', name: 'Docs', type: 'docs' },
    'obsoleto-inputmask--docs': { id: 'obsoleto-inputmask--docs', title: 'Obsoleto/InputMask', name: 'Docs', type: 'docs' },
    'estilos-tipografia--docs': { id: 'estilos-tipografia--docs', title: 'Estilos/Tipografia', name: 'Docs', type: 'docs' },
  },
}

test('maps a component to its docs page and stories', () => {
  const s = storiesFor(INDEX, 'Button')
  assert.equal(s?.docsUrl, `${SB}?path=/docs/componentes-button--docs`)
  assert.deepEqual(s?.stories, [
    { name: 'Default', url: `${SB}?path=/story/componentes-button--default` },
    { name: 'Button Link', url: `${SB}?path=/story/componentes-button--button-link` },
  ])
  assert.equal(s?.obsolete, false)
})

test('matches names without regard to case', () => {
  assert.equal(storiesFor(INDEX, 'BreadCrumb')?.docsUrl, `${SB}?path=/docs/componentes-breadcrumb--docs`)
})

test('a part of a component maps to the component story', () => {
  assert.equal(storiesFor(INDEX, 'StepperHeader')?.docsUrl, `${SB}?path=/docs/componentes-stepper--docs`)
})

test('marks components under Obsoleto', () => {
  assert.equal(storiesFor(INDEX, 'InputMask')?.obsolete, true)
})

test('no story: undefined', () => {
  assert.equal(storiesFor(INDEX, 'FileInput'), undefined)
})

const BUTTON: ComponentDoc = {
  name: 'Button',
  doc: '',
  bases: [{ name: 'ButtonProps', module: 'primereact/button', omit: ['content'] }],
  props: [
    { name: 'tonal', type: 'boolean', optional: true, doc: 'Fundo suave.', deprecated: false },
    { name: 'size', type: "'sm' | 'lg'", optional: false, doc: '', deprecated: true },
  ],
}
const VERSIONS = { components: '1.1.40', styles: '1.1.21' }

test('component page: import, base, props table, stories', () => {
  const md = renderComponent(BUTTON, storiesFor(INDEX, 'Button'), VERSIONS)
  assert.match(md, /^# Button\n/)
  assert.match(md, /`@uigovpe\/components@1\.1\.40`/)
  assert.match(md, /import \{ Button \} from '@uigovpe\/components'/)
  assert.match(md, /`ButtonProps` de `primereact\/button`, exceto `content`/)
  assert.match(md, /\| `tonal` \| `boolean` \| não \| Fundo suave\. \|/)
  assert.match(md, /\| `size` \| `'sm' \\\| 'lg'` \| sim \| \*\*Obsoleta\.\*\* \|/)
  assert.match(md, /\[Docs\]\(https:\/\/ligadigital\.pe\.gov\.br\/storybook\/index\.html\?path=\/docs\/componentes-button--docs\)/)
  assert.match(md, /\[Button Link\]\(/)
})

test('obsolete component page says so first', () => {
  const md = renderComponent({ ...BUTTON, name: 'InputMask' }, storiesFor(INDEX, 'InputMask'), VERSIONS)
  assert.match(md, /^# InputMask\n\n> \*\*Obsoleto\.\*\*/)
})

test('component with no own props and no base', () => {
  const md = renderComponent({ name: 'Toast', doc: '', bases: [], props: [] }, undefined, VERSIONS)
  assert.match(md, /Sem props tipadas/)
  assert.doesNotMatch(md, /## Storybook/)
})

test('index lists every component with a link to its page', () => {
  const md = renderIndex([BUTTON, { name: 'Toast', doc: 'Avisos.', bases: [], props: [] }], VERSIONS)
  assert.match(md, /\| \[Button\]\(Button\.md\) \|/)
  assert.match(md, /\| \[Toast\]\(Toast\.md\) \| Avisos\. \|/)
})

test('tokens page: one row per token with light and dark values', () => {
  const md = renderTokens({ light: { '--color-text-primary': '#0034b7' }, dark: { '--color-text-primary': '#337fff' } }, VERSIONS)
  assert.match(md, /`@uigovpe\/styles@1\.1\.21`/)
  assert.match(md, /\| `var\(--color-text-primary\)` \| `#0034b7` \| `#337fff` \|/)
})
