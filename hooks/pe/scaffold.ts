import { DS_VERSIONS } from './ds.generated'

// What /pe-scaffold makes: a Next.js App Router project with TypeScript, set up for the
// Liga Digital as the @uigovpe/components README says. The published @uigovpe files start
// with 'use client', so the server layout and page import them as they are.

// A lowercase npm package name, which is also the folder name.
export const isValidName = (name: string): boolean => /^[a-z0-9][a-z0-9._-]{0,213}$/.test(name)

export const CREATE_NEXT_APP = (name: string): string[] => [
  'npx',
  '--yes',
  'create-next-app@16.4.2',
  name,
  '--ts',
  '--app',
  '--eslint',
  '--no-tailwind',
  '--no-src-dir',
  '--import-alias',
  '@/*',
  '--use-npm',
  '--empty',
  '--yes',
  '--skip-install',
  '--no-agent-feedback',
]

export const installArgs = (): string[] => [
  'npm',
  'install',
  `@uigovpe/components@${DS_VERSIONS.components}`,
  `@uigovpe/styles@${DS_VERSIONS.styles}`,
]

export function scaffoldFiles(name: string): Record<string, string> {
  return {
    'app/layout.tsx': `import type { Metadata } from 'next'
import { UiProvider } from '@uigovpe/components'
import '@uigovpe/styles'

export const metadata: Metadata = {
  title: '${name}',
  description: 'Serviço digital do Governo de Pernambuco',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <UiProvider>{children}</UiProvider>
      </body>
    </html>
  )
}
`,
    'app/page.tsx': `import { Button, GovBar, Typography } from '@uigovpe/components'

export default function Home() {
  return (
    <>
      <GovBar showThemeController showFontSizeController />
      <main style={{ padding: 'var(--spacing-24)', display: 'grid', gap: 'var(--spacing-16)' }}>
        <Typography variant="h1">${name}</Typography>
        <Typography variant="p">Projeto criado com o pe-devkit sobre a Liga Digital.</Typography>
        <div>
          <Button label="Começar" />
        </div>
      </main>
    </>
  )
}
`,
  }
}
