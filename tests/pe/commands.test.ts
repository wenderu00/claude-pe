import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import { DS_VERSIONS } from '../../hooks/pe/ds.generated'

const run = async ($: Engine, command: string, args: string) =>
  (await $.command.run({ command, args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } } as never)) as { text?: string }

test('/pe-component with no name lists the components', async $ => {
  const { text } = await run($, 'pe-component', '')
  expect(text).toContain('Button')
  expect(text).toContain('GovBar')
  expect(text).toContain('/pe-component <Nome>')
})

test('/pe-component names the import and the Storybook page, and gives the link when the browser does not open', async $ => {
  const { text } = await run($, 'pe-component', 'button')
  expect(text).toContain("import { Button } from '@uigovpe/components'")
  expect(text).toContain('https://ligadigital.pe.gov.br/storybook/index.html?path=/docs/componentes-button--docs')
  expect(text).toContain('references/components/Button.md')
})

test('/pe-component says when a component is obsolete', async $ => {
  const { text } = await run($, 'pe-component', 'InputMask')
  expect(text).toContain('Obsoleto')
})

test('/pe-component suggests names for one it does not know', async $ => {
  const { text } = await run($, 'pe-component', 'InputTex')
  expect(text).toContain('InputText')
  expect(text).toContain('InputTextarea')
  expect((await run($, 'pe-component', 'zzz')).text).toContain('não existe')
})

// A host for /pe-scaffold: what ran, where, and what was written.
function host(on: On, opts: { exists?: boolean; failCreate?: boolean } = {}) {
  const ran: { argv: string[]; cwd?: string }[] = []
  const written: Record<string, string> = {}
  on('session.cwd', () => ({ value: '/work' }) as never)
  on('fs.exists', () => ({ value: opts.exists === true }) as never)
  on('fs.write', (_$, e) => {
    const { path, text } = e as { path: string; text: string }
    written[path.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '')] = text
    return { value: undefined } as never
  })
  on('process.run', (_$, e) => {
    const { argv, init } = e as { argv: string[]; init?: { cwd?: string } }
    ran.push({ argv: [...argv], cwd: init?.cwd?.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '') })
    const failed = opts.failCreate && argv.includes('create-next-app@16.4.2')
    return { value: { exitCode: failed ? 1 : 0, stdout: '', stderr: failed ? 'npm ERR! network' : '' } } as never
  })
  return { ran, written }
}

test('/pe-scaffold creates the app, installs the pinned @uigovpe and writes the layout and page', async ($, on) => {
  const { ran, written } = host(on)
  const { text } = await run($, 'pe-scaffold', 'portal')
  expect(ran.map(r => r.argv[0] === 'npx' ? 'create' : r.argv.slice(0, 2).join(' '))).toEqual(['create', 'npm install'])
  expect(ran[0]?.cwd).toBe('/work')
  expect(ran[1]?.cwd).toBe('/work/portal')
  expect(ran[1]?.argv).toContain(`@uigovpe/components@${DS_VERSIONS.components}`)
  expect(Object.keys(written).sort()).toEqual(['/work/portal/app/layout.tsx', '/work/portal/app/page.tsx'])
  expect(written['/work/portal/app/page.tsx']).toContain('<GovBar')
  expect(text).toContain('cd portal')
  expect(text).toContain('npm run dev')
})

test('/pe-scaffold refuses a bad name and an existing folder, and runs nothing', async ($, on) => {
  const { ran } = host(on, { exists: true })
  expect((await run($, 'pe-scaffold', '../fora')).text).toContain('Nome inválido')
  expect((await run($, 'pe-scaffold', '')).text).toContain('/pe-scaffold <pasta>')
  expect((await run($, 'pe-scaffold', 'portal')).text).toContain('já existe')
  expect(ran).toEqual([])
})

test('/pe-scaffold stops at a failed step and shows its error', async ($, on) => {
  const { ran, written } = host(on, { failCreate: true })
  const { text } = await run($, 'pe-scaffold', 'portal')
  expect(text).toContain('npm ERR! network')
  expect(ran).toHaveLength(1)
  expect(written).toEqual({})
})
