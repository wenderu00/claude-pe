import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const GOV_PKG = JSON.stringify({ dependencies: { '@uigovpe/components': '^1.1.40', next: '16' } })
const NEWER_PKG = JSON.stringify({ dependencies: { '@uigovpe/components': '^1.3.0' } })
const OTHER_PKG = JSON.stringify({ dependencies: { react: '19' } })

// A project on disk and the edit tools, answered as the engine answers them.
function project(on: On, files: Record<string, string>) {
  on('fs.read', (_$, e) => {
    // The engine hands a Windows host its drive letter: C:/app/package.json.
    const path = String((e as { path: string }).path).replace(/\\/g, '/').replace(/^[A-Za-z]:/, '')
    if (path in files) return { value: files[path] } as never
    throw new Error(`ENOENT: ${path}`)
  })
  on('tool.call', { tool: 'Edit' }, () => ({ result: { ok: true } }) as never)
  on('tool.call', { tool: 'Write' }, () => ({ result: { ok: true } }) as never)
}

const edit = (on: unknown, $: { tool: { call: (e: never) => Promise<unknown> } }, file_path: string, new_string: string) =>
  $.tool.call({ tool: 'Edit', file_path, old_string: 'x', new_string } as never) as Promise<{ context?: string[] }>

test('an edit in an @uigovpe project that imports primereact tells Claude what to use', async ($, on) => {
  project(on, { '/app/package.json': GOV_PKG })
  const r = await edit(on, $, '/app/src/page.tsx', "import { Button } from 'primereact/button'")
  expect(r.context?.join('\n')).toContain('`Button` de `@uigovpe/components`')
})

test('the package.json is found from a nested folder', async ($, on) => {
  project(on, { '/app/package.json': GOV_PKG })
  const r = await edit(on, $, '/app/src/app/admin/page.tsx', "import { Dropdown } from 'primereact/dropdown'")
  expect(r.context?.join('\n')).toContain('`Dropdown`')
})

test('a Write of CSS with a literal color names the token', async ($, on) => {
  project(on, { '/app/package.json': GOV_PKG })
  const r = (await $.tool.call({ tool: 'Write', file_path: '/app/src/a.css', content: '.t { color: #0034b7 }' } as never)) as { context?: string[] }
  expect(r.context?.join('\n')).toContain('`var(--color-text-primary)`')
})

test('a project without @uigovpe gets nothing', async ($, on) => {
  project(on, { '/app/package.json': OTHER_PKG })
  const r = await edit(on, $, '/app/src/page.tsx', "import { Button } from 'primereact/button'")
  expect(r.context ?? []).toEqual([])
})

test('a clean edit gets nothing', async ($, on) => {
  project(on, { '/app/package.json': GOV_PKG })
  const r = await edit(on, $, '/app/src/page.tsx', "import { Button } from '@uigovpe/components'")
  expect(r.context ?? []).toEqual([])
})

test('a failed edit gets nothing', async ($, on) => {
  on('fs.read', () => ({ value: GOV_PKG }) as never)
  on('tool.call', { tool: 'Edit' }, () => ({ result: 'old_string not found', isError: true }) as never)
  const r = await edit(on, $, '/app/src/page.tsx', "import { Button } from 'primereact/button'")
  expect(r.context ?? []).toEqual([])
})

test('a newer @uigovpe is noted once a session, on the first edit that has an issue', async ($, on) => {
  project(on, { '/app/package.json': NEWER_PKG })
  const first = await edit(on, $, '/app/src/a.tsx', "import { Button } from 'primereact/button'")
  const second = await edit(on, $, '/app/src/b.tsx', "import { Button } from 'primereact/button'")
  expect(first.context?.join('\n')).toContain('^1.3.0')
  expect(second.context?.join('\n')).not.toContain('^1.3.0')
})
