# Receita: shell e navegação

A base de todo o sistema. Use uma vez por projeto, antes da primeira página nova.
Depois, cada página nova só entra em `app/navigation.ts`.

O sistema tem duas áreas, como o `template` do `LayoutProvider`:

| Área | Pasta | Moldura | Quem usa |
|---|---|---|---|
| Pública (`landingpage`) | `app/(publico)/` (o grupo não entra na URL) | `GovBar` em cima, conteúdo embaixo | o cidadão |
| Backoffice (`backoffice`) | `app/backoffice/` (URL `/backoffice/...`) | `GovBar`, `AdminSideBar`, `AdminUserBar`, `BreadCrumb` | o servidor |

Crie só a área que o sistema usa. A área backoffice segue o template oficial
[Templates/Backoffice](https://ligadigital.pe.gov.br/storybook/index.html?path=/docs/templates-backoffice--docs).

## `app/navigation.ts`: o mapa do sistema

Um arquivo só diz quais páginas existem. A página inicial pública lista `publico`, e a barra
lateral do backoffice mostra `backoffice` sem conversão (o tipo é o das `sections` do
`AdminSideBar`). Uma página que não está aqui o usuário não acha.

```ts file=app/navigation.ts
import type { SidebarSectionProps } from '@uigovpe/components'

// O mapa do sistema. Cada página nova entra aqui.

export type Servico = { href: string; titulo: string; descricao: string }

// Os serviços da área pública. A página inicial mostra um card para cada um.
export const publico: Servico[] = [
  {
    href: '/certidoes/nova',
    titulo: 'Solicitar certidão',
    descricao: 'Peça a certidão pela internet e receba a resposta por e-mail.',
  },
  {
    href: '/inscricao',
    titulo: 'Inscrição no programa',
    descricao: 'Faça a inscrição em três passos: seus dados, endereço e confirmação.',
  },
]

// As seções da barra lateral do backoffice (AdminSideBar). link é a URL da página.
export const backoffice: SidebarSectionProps[] = [
  {
    id: 'atendimento',
    title: 'Atendimento',
    icon: 'inbox',
    items: [{ id: 'solicitacoes', label: 'Solicitações', link: '/backoffice/solicitacoes' }],
  },
]
```

Para pôr uma página nova no mapa:

- **Pública:** um item novo em `publico`.
- **Backoffice:** um item novo em `items` da seção certa (ou uma seção nova). `icon` aceita os
  nomes do `IconName` (Material Symbols), por exemplo `inbox`, `description`, `person`.
  Um item com `subItems` abre um submenu.

## Área pública

O `app/layout.tsx` do `/pe-scaffold` fica como está (`UiProvider` e os estilos). A `GovBar` sai
de `app/page.tsx` e vai para o layout da área. **Apague `app/page.tsx`**: a página inicial
agora é `app/(publico)/page.tsx`, e as duas não podem existir juntas.

```tsx file=app/(publico)/layout.tsx
import { GovBar } from '@uigovpe/components'

export default function PublicoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <GovBar showThemeController showFontSizeController />
      <main style={{ padding: 'var(--spacing-24)', display: 'grid', gap: 'var(--spacing-24)' }}>{children}</main>
    </>
  )
}
```

```tsx file=app/(publico)/page.tsx
import { Card, TextLink, Typography } from '@uigovpe/components'

import { publico } from '@/app/navigation'

export default function Inicio() {
  return (
    <>
      <Typography variant="h1">Serviços</Typography>
      <div style={{ display: 'grid', gap: 'var(--spacing-16)', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))' }}>
        {publico.map(servico => (
          <Card key={servico.href} title={servico.titulo} elevation="low">
            <Typography variant="p">{servico.descricao}</Typography>
            <TextLink href={servico.href}>Acessar</TextLink>
          </Card>
        ))}
      </div>
    </>
  )
}
```

## Área backoffice

O layout é um componente cliente (`'use client'`), como no template oficial: a trilha
(`BreadCrumb`) usa o caminho atual.

- O projeto do `/pe-scaffold` (Next.js 16) usa Cache Components. Nele, `usePathname()` fora de
  `<Suspense>` faz o `npm run build` falhar numa rota dinâmica (`[id]`). Por isso só a barra do
  usuário e a trilha leem a URL, cada uma dentro de `<Suspense>`. Não chame `usePathname()` no
  corpo do layout.

- A `AdminSideBar` não recebe `onNavigate`: um clique no menu carrega a página inteira
  (`window.location.href`). Não troque por um menu próprio.
- `usuario` é fixo até o sistema ter login. Troque pelo usuário da sessão.
- Não use classes Tailwind do template oficial (`ml-[.62rem]`): o `/pe-scaffold` cria o projeto
  sem Tailwind.

```tsx file=app/backoffice/layout.tsx
'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  AdminSideBar,
  AdminUserBar,
  AppLayout,
  BreadCrumb,
  GovBar,
  Icon,
  LayoutProvider,
  type BreadcrumbProps,
  type MenuAction,
} from '@uigovpe/components'

import { backoffice } from '@/app/navigation'

// Quem está logado. Troque pelo usuário da sessão quando o sistema tiver login.
const usuario = { name: 'Servidor de Exemplo', profile: 'Atendimento' }

const acoes: MenuAction = [
  {
    label: 'Sair',
    icon: <Icon icon="logout" />,
    command: () => {
      window.location.href = '/'
    },
  },
]

// A trilha: o início do backoffice e o item do menu da página atual.
function trilha(caminho: string): BreadcrumbProps {
  const atual = backoffice.flatMap(secao => secao.items ?? []).find(item => item.link && caminho.startsWith(item.link))
  return {
    home: {
      label: 'Início',
      url: '/backoffice',
      template: (
        <Link href="/backoffice">
          <Icon icon="home" />
        </Link>
      ),
    },
    items: atual ? [{ label: atual.label, url: atual.link }] : [],
  }
}

// Só estas duas partes leem a URL; o layout as põe dentro de <Suspense>.
function BarraDoUsuario() {
  return <AdminUserBar user={usuario} menuActions={acoes} breadcrumb={trilha(usePathname())} />
}

function Trilha() {
  const { items, home } = trilha(usePathname())
  return <BreadCrumb model={items} home={home} />
}

export default function BackofficeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <LayoutProvider breakpoint={900} template="backoffice">
      <AppLayout>
        <GovBar />
        <AppLayout.MainLayout>
          <AdminSideBar theme="primary" title="Sistema" version="1.0.0" sections={backoffice} />
          <AppLayout.ContentSection>
            <Suspense fallback={<AdminUserBar user={usuario} menuActions={acoes} />}>
              <BarraDoUsuario />
            </Suspense>
            <AppLayout.MainContent>
              <AppLayout.BreadCrumbSection>
                <Suspense>
                  <Trilha />
                </Suspense>
              </AppLayout.BreadCrumbSection>
              <AppLayout.PageContent>{children}</AppLayout.PageContent>
            </AppLayout.MainContent>
          </AppLayout.ContentSection>
        </AppLayout.MainLayout>
      </AppLayout>
    </LayoutProvider>
  )
}
```

```tsx file=app/backoffice/page.tsx
import { Typography } from '@uigovpe/components'

export default function Painel() {
  return (
    <>
      <Typography variant="h1">Painel</Typography>
      <Typography variant="p">Escolha uma opção no menu ao lado.</Typography>
    </>
  )
}
```
