---
name: pe-design-system
description: Use when building or changing front-end (React/Next.js) for the Governo de Pernambuco, or in any project that depends on @uigovpe/components or @uigovpe/styles (Liga Digital design system) — picks the right @uigovpe component, its props, and the color tokens instead of raw primereact or hex colors.
---

# Liga Digital (Governo de Pernambuco)

Projeto comunitário, **não oficial**. A fonte oficial é o Storybook:
https://ligadigital.pe.gov.br/storybook/

A referência desta skill é gerada de `@uigovpe/components@1.1.40` e `@uigovpe/styles@1.1.21`.
Se o `package.json` do projeto tem uma versão maior, confira a prop no Storybook antes de usar.

## Regras

1. **Use o componente `@uigovpe/components`, não o `primereact` direto.** Os componentes de lá
   estendem os do PrimeReact e aplicam o visual do governo. Importe do `primereact` só o que o
   `@uigovpe` não tem, como tipos de evento (`import type { DropdownChangeEvent } from 'primereact/dropdown'`).
2. **Use tokens, não cores literais.** Em CSS, `color: var(--color-text-primary)`, nunca `#0034b7`.
   Escolha o token pelo significado (texto, superfície, contorno, feedback), não pelo tom.
   Lista: `references/tokens.md`.
3. **Modo escuro é a classe `dark` no `<html>`.** O `UiProvider` aplica a classe a partir do
   `localStorage`. Não crie um tema escuro próprio.
4. **Toda página pública começa com a `GovBar`.**
5. **Não use componente marcado como Obsoleto** na referência (hoje: `InputMask`). O Storybook
   tem `InputMasked` na seção de componentes atuais.

## Setup em Next.js (App Router)

```bash
npm install @uigovpe/components @uigovpe/styles
```

`UiProvider` usa hooks do React, então fica num arquivo cliente:

```tsx
// app/providers.tsx
'use client'
import { UiProvider } from '@uigovpe/components'

export function Providers({ children }: { children: React.ReactNode }) {
  return <UiProvider>{children}</UiProvider>
}
```

```tsx
// app/layout.tsx
import '@uigovpe/styles'
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## Como achar um componente

1. Abra `references/components/index.md` e escolha pelo nome.
2. Abra `references/components/<Nome>.md`: import, de qual tipo PrimeReact ele herda, props
   próprias e links das histórias no Storybook.
3. Para as props herdadas, a documentação é a do PrimeReact para aquele componente.
4. `/pe-component <Nome>` abre a história no navegador do terminal.
