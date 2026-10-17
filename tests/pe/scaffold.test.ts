import { expect, test } from 'claude-code/testing'

import { DS_VERSIONS } from '../../hooks/pe/ds.generated'
import { CREATE_NEXT_APP, installArgs, isValidName, scaffoldFiles } from '../../hooks/pe/scaffold'

test('scaffold: the folder name is a plain npm package name', () => {
  expect(isValidName('portal-servicos')).toBe(true)
  expect(isValidName('app_pe2')).toBe(true)
  expect(isValidName('')).toBe(false)
  expect(isValidName('../fora')).toBe(false)
  expect(isValidName('Com Espaço')).toBe(false)
  expect(isValidName('-x')).toBe(false)
})

test('scaffold: create-next-app is pinned and asks nothing', () => {
  const argv = CREATE_NEXT_APP('portal')
  expect(argv[0]).toBe('npx')
  expect(argv).toContain('create-next-app@16.4.2')
  for (const flag of ['--ts', '--app', '--no-tailwind', '--use-npm', '--empty', '--yes', '--skip-install', '--no-agent-feedback']) expect(argv).toContain(flag)
  expect(argv).toContain('portal')
})

test('scaffold: the install pins the documented @uigovpe versions', () => {
  expect(installArgs()).toEqual(['npm', 'install', `@uigovpe/components@${DS_VERSIONS.components}`, `@uigovpe/styles@${DS_VERSIONS.styles}`])
})

test('scaffold: the layout loads the styles and wraps the app in UiProvider, as the package README says', () => {
  const files = scaffoldFiles('portal')
  // The published @uigovpe files carry their own 'use client': the server layout may import them.
  expect(Object.keys(files).sort()).toEqual(['app/layout.tsx', 'app/page.tsx'])
  expect(files['app/layout.tsx']).toContain("import '@uigovpe/styles'")
  expect(files['app/layout.tsx']).toContain('<html lang="pt-BR">')
  expect(files['app/layout.tsx']).toContain('<UiProvider>{children}</UiProvider>')
})

test('scaffold: the page starts with the GovBar and uses tokens, not colors', () => {
  const page = scaffoldFiles('portal')['app/page.tsx']!
  expect(page).toContain('<GovBar')
  expect(page).toContain("from '@uigovpe/components'")
  expect(page).toContain('var(--spacing-')
  expect(page).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  expect(page).toContain('portal')
  expect(page).not.toContain("'use client'")
})
