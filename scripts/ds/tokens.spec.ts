import { test } from 'node:test'
import assert from 'node:assert/strict'

import { extractTokens } from './tokens.ts'

const CSS = `
:root {
  --color-light-blue-default: #0034b7;
  --color-light-gray-strong: #28272c;
  --color-light-gray-softest: #f8fafc;
  --size-16: 16px;
}
:root {
  --color-text-default: var(--color-light-gray-strong);
  --color-text-primary: var(--color-light-blue-default);
  --color-text-plain: var(--color-text-default);
  --color-missing: var(--color-nowhere);
}
.dark {
  --color-text-default: var(--color-light-gray-softest);
}
.reset-dark {
  --color-text-default: #ff0000;
}
.theme-primary {
  --color-text-default: #00ff00;
}
@media (max-width: 600px) {
  :root { --color-text-primary: #123456; }
}
.button { color: var(--color-text-default); }
`

test('reads :root as light, resolving var() chains', () => {
  const { light } = extractTokens(CSS)
  assert.equal(light['--color-text-default'], '#28272c')
  assert.equal(light['--color-text-primary'], '#0034b7')
  assert.equal(light['--color-text-plain'], '#28272c')
})

test('dark overrides light and inherits the rest', () => {
  const { dark } = extractTokens(CSS)
  assert.equal(dark['--color-text-default'], '#f8fafc')
  assert.equal(dark['--color-text-primary'], '#0034b7')
})

test('a var() chain resolves in the scope that reads it', () => {
  // --color-text-plain points at --color-text-default, which .dark changes.
  const { dark } = extractTokens(CSS)
  assert.equal(dark['--color-text-plain'], '#f8fafc')
})

test('ignores .reset-dark, other classes and :root inside @media', () => {
  const { light, dark } = extractTokens(CSS)
  assert.notEqual(light['--color-text-default'], '#00ff00')
  assert.notEqual(dark['--color-text-default'], '#ff0000')
  assert.equal(light['--color-text-primary'], '#0034b7')
})

test('keeps only --color-* tokens', () => {
  const { light } = extractTokens(CSS)
  assert.equal(light['--size-16'], undefined)
})

test('drops tokens that do not resolve', () => {
  const { light } = extractTokens(CSS)
  assert.equal('--color-missing' in light, false)
})
