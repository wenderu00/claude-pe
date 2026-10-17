import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import './hooks-loader.ts'
import { fences } from './recipes.ts'

const { issuesIn } = await import('../../hooks/pe/rules.ts')

const RECIPES = join(import.meta.dirname, '..', '..', 'skills', 'pe-design-system', 'references', 'recipes')
const recipes = (existsSync(RECIPES) ? readdirSync(RECIPES) : [])
  .filter(f => f.endsWith('.md') && f !== 'index.md')
  .map(f => ({ name: f, fences: fences(readFileSync(join(RECIPES, f), 'utf8')) }))

const SAMPLE = [
  '# Receita',
  '',
  '```tsx file=app/(publico)/page.tsx',
  "export default function Page() { return null }",
  '```',
  '',
  '```bash',
  'npm install zod',
  '```',
  '',
  '```ts',
  "export const x = 1",
  '```',
].join('\n')

test('reads each fence with its language, its file and its code', () => {
  assert.deepEqual(fences(SAMPLE), [
    { lang: 'tsx', file: 'app/(publico)/page.tsx', code: 'export default function Page() { return null }\n' },
    { lang: 'bash', file: null, code: 'npm install zod\n' },
    { lang: 'ts', file: null, code: 'export const x = 1\n' },
  ])
})

test('a fence inside a longer fence is part of its code', () => {
  const md = ['````md', '```tsx file=a.tsx', 'x', '```', '````'].join('\n')
  assert.deepEqual(fences(md), [{ lang: 'md', file: null, code: '```tsx file=a.tsx\nx\n```\n' }])
})

test('the recipes are there: shell, form, list + detail, wizard', () => {
  assert.deepEqual(recipes.map(r => r.name).sort(), ['form.md', 'list-detail.md', 'shell.md', 'wizard.md'])
})

test('each recipe has complete files to copy', () => {
  for (const r of recipes) assert.ok(r.fences.some(f => f.file !== null), `${r.name} has no fence with file=`)
})

test('no two recipes write the same file', () => {
  const seen = new Map<string, string>()
  for (const r of recipes) {
    for (const f of r.fences) {
      if (f.file === null) continue
      assert.equal(seen.get(f.file), undefined, `${f.file} is in ${seen.get(f.file)} and in ${r.name}`)
      seen.set(f.file, r.name)
    }
  }
})

test('recipe code follows the Liga Digital rules: no primereact component, no literal color', () => {
  for (const r of recipes) {
    for (const f of r.fences) {
      if (!/^(tsx?|css)$/.test(f.lang)) continue
      const path = f.file ?? `exemplo.${f.lang}`
      assert.deepEqual(issuesIn(path, f.code), [], `${r.name}: ${path}`)
    }
  }
})
