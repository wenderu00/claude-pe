import { expect, test } from 'claude-code/testing'

import { DS_VERSIONS } from '../../hooks/pe/ds.generated'
import { adviceFor, isNewer, issuesIn, uigovpeVersion } from '../../hooks/pe/rules'

test('rules: a value import from a wrapped primereact module names the @uigovpe component', () => {
  expect(issuesIn('src/a.tsx', "import { Button } from 'primereact/button'")).toEqual([
    { kind: 'primereact', module: 'primereact/button', components: ['Button'] },
  ])
  expect(issuesIn('src/a.ts', 'import * as dd from "primereact/dropdown";')).toEqual([
    { kind: 'primereact', module: 'primereact/dropdown', components: ['Dropdown'] },
  ])
})

test('rules: type imports and modules @uigovpe does not wrap are fine', () => {
  expect(issuesIn('src/a.tsx', "import type { DropdownChangeEvent } from 'primereact/dropdown'")).toEqual([])
  expect(issuesIn('src/a.tsx', "import { type DropdownChangeEvent } from 'primereact/dropdown'")).toEqual([])
  expect(issuesIn('src/a.tsx', "import { PrimeReactProvider } from 'primereact/api'")).toEqual([])
})

test('rules: a mixed import with one value is flagged', () => {
  expect(issuesIn('src/a.tsx', "import { type DropdownProps, Dropdown } from 'primereact/dropdown'")).toHaveLength(1)
})

test('rules: a hex color in a CSS value is flagged, with the token of the same value', () => {
  const [issue] = issuesIn('src/a.css', '.titulo { color: #0034b7; }')
  expect(issue?.kind).toBe('hex')
  expect(issue?.kind === 'hex' ? issue.tokens : []).toContain('--color-text-primary')
})

test('rules: a hex color with no token is flagged without a token', () => {
  expect(issuesIn('src/a.scss', '.x { background: #123456 }')).toEqual([{ kind: 'hex', hex: '#123456', tokens: [] }])
})

test('rules: an id selector is not a color', () => {
  expect(issuesIn('src/a.css', 'a#add:hover { color: var(--color-text-link) }')).toEqual([])
})

test('rules: in TSX only a color-like key with a hex is flagged, not an anchor', () => {
  expect(issuesIn('src/a.tsx', "<div style={{ backgroundColor: '#fff' }} />")).toEqual([{ kind: 'hex', hex: '#fff', tokens: [] }])
  expect(issuesIn('src/a.tsx', '<path fill="#ac1010" />')).toHaveLength(1)
  expect(issuesIn('src/a.tsx', '<a href="#add">topo</a>')).toEqual([])
})

test('rules: SVG files, tests and other file types are not checked', () => {
  expect(issuesIn('public/logo.svg', '<path fill="#0034b7"/>')).toEqual([])
  expect(issuesIn('src/a.test.tsx', "const c = { color: '#fff' }")).toEqual([])
  expect(issuesIn('README.md', "import { Button } from 'primereact/button'")).toEqual([])
})

test('rules: each issue once per edit', () => {
  expect(issuesIn('src/a.css', '.a { color: #123456 } .b { color: #123456 }')).toHaveLength(1)
})

test('rules: the @uigovpe/components range of a package.json', () => {
  expect(uigovpeVersion(JSON.stringify({ dependencies: { '@uigovpe/components': '^1.2.0' } }))).toBe('^1.2.0')
  expect(uigovpeVersion(JSON.stringify({ devDependencies: { '@uigovpe/components': '1.1.40' } }))).toBe('1.1.40')
  expect(uigovpeVersion(JSON.stringify({ dependencies: { react: '19' } }))).toBeNull()
  expect(uigovpeVersion('not json')).toBeNull()
})

test('rules: a range is newer when its lowest version is past the documented one', () => {
  expect(isNewer('^1.2.0', '1.1.40')).toBe(true)
  expect(isNewer('~1.1.41', '1.1.40')).toBe(true)
  expect(isNewer('^1.1.40', '1.1.40')).toBe(false)
  expect(isNewer('1.0.9', '1.1.40')).toBe(false)
  expect(isNewer('latest', '1.1.40')).toBe(false)
})

test('rules: the advice names the file, each issue, and the version when newer', () => {
  const text = adviceFor(
    'src/a.tsx',
    [
      { kind: 'primereact', module: 'primereact/button', components: ['Button'] },
      { kind: 'hex', hex: '#0034b7', tokens: ['--color-text-primary'] },
    ],
    '^1.2.0',
  )
  expect(text).toContain('src/a.tsx')
  expect(text).toContain('`Button` de `@uigovpe/components`')
  expect(text).toContain('`var(--color-text-primary)`')
  expect(text).toContain(`^1.2.0`)
  expect(text).toContain(DS_VERSIONS.components)
})
