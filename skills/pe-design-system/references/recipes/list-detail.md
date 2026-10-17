# Receita: lista e detalhe

Uma lista de registros com filtro e paginação, e uma página para cada registro. É a tela
mais comum do backoffice, mas serve também na área pública (por exemplo, "meus pedidos").

## As peças

| Arquivo | O que faz |
|---|---|
| `lib/<feature>.ts` | O seam de dados: `listar...()` e `buscar...(id)`, com dados de exemplo. Se a feature já tem o arquivo, acrescente as funções nele. |
| `<rota>/page.tsx` | A lista, no servidor: busca os dados e passa para a tabela. |
| `<rota>/tabela.tsx` | O componente cliente: `Table`, `Column`, `Filter`. Fica no cliente porque as colunas recebem funções (`body`), e uma página do servidor não passa função para um componente cliente. |
| `<rota>/[id]/page.tsx` | O detalhe, no servidor. Um id que não existe dá `notFound()`. |

Componentes: [Table](../components/Table.md) e [Column](../components/Column.md) (a paginação é
a do próprio `Table`, com `paginator`), [Filter](../components/Filter.md), [Tag](../components/Tag.md),
[Card](../components/Card.md), [TextLink](../components/TextLink.md).

- `Filter` com `type="checkbox"` chama `onChange` com as opções marcadas quando o usuário clica
  em "Aplicar", e com `[]` em "Limpar".
- A lista sem registros mostra `emptyMessage`. Escreva o que o usuário pode fazer.

## Exemplo: solicitações no backoffice

```ts file=lib/solicitacoes.ts
// O seam de dados das solicitações. Troque o corpo das funções pela chamada à API real.

export type Situacao = 'recebida' | 'em-analise' | 'concluida'

export type Solicitacao = {
  id: string
  protocolo: string
  nome: string
  servico: string
  situacao: Situacao
  recebidaEm: string
}

export const SITUACOES: { label: string; value: Situacao }[] = [
  { label: 'Recebida', value: 'recebida' },
  { label: 'Em análise', value: 'em-analise' },
  { label: 'Concluída', value: 'concluida' },
]

const EXEMPLOS: Solicitacao[] = [
  { id: '1', protocolo: 'CERT-102938', nome: 'Maria das Graças Lima', servico: 'Certidão de nascimento', situacao: 'recebida', recebidaEm: '2026-10-01' },
  { id: '2', protocolo: 'CERT-102951', nome: 'João Batista Souza', servico: 'Certidão de casamento', situacao: 'em-analise', recebidaEm: '2026-10-02' },
  { id: '3', protocolo: 'CERT-103004', nome: 'Ana Paula Ferreira', servico: 'Certidão de nascimento', situacao: 'concluida', recebidaEm: '2026-10-03' },
  { id: '4', protocolo: 'CERT-103117', nome: 'Carlos Eduardo Alves', servico: 'Certidão de óbito', situacao: 'recebida', recebidaEm: '2026-10-06' },
  { id: '5', protocolo: 'CERT-103202', nome: 'Fernanda Rocha', servico: 'Certidão de casamento', situacao: 'concluida', recebidaEm: '2026-10-08' },
  { id: '6', protocolo: 'CERT-103245', nome: 'José Ricardo Melo', servico: 'Certidão de nascimento', situacao: 'em-analise', recebidaEm: '2026-10-09' },
]

export async function listarSolicitacoes(): Promise<Solicitacao[]> {
  return EXEMPLOS
}

export async function buscarSolicitacao(id: string): Promise<Solicitacao | undefined> {
  return EXEMPLOS.find(s => s.id === id)
}
```

```tsx file=app/backoffice/solicitacoes/page.tsx
import { Typography } from '@uigovpe/components'

import { listarSolicitacoes } from '@/lib/solicitacoes'
import { TabelaSolicitacoes } from './tabela'

export default async function Solicitacoes() {
  const solicitacoes = await listarSolicitacoes()
  return (
    <>
      <Typography variant="h1">Solicitações</Typography>
      <TabelaSolicitacoes solicitacoes={solicitacoes} />
    </>
  )
}
```

```tsx file=app/backoffice/solicitacoes/tabela.tsx
'use client'

import { useState } from 'react'
import { Column, Filter, Table, Tag, TextLink, type FilterOption } from '@uigovpe/components'

import { SITUACOES, type Situacao, type Solicitacao } from '@/lib/solicitacoes'

const COR: Record<Situacao, 'info' | 'warning' | 'success'> = {
  recebida: 'info',
  'em-analise': 'warning',
  concluida: 'success',
}

const rotulo = (situacao: Situacao) => SITUACOES.find(s => s.value === situacao)?.label ?? situacao

export function TabelaSolicitacoes({ solicitacoes }: { solicitacoes: Solicitacao[] }) {
  const [marcadas, setMarcadas] = useState<FilterOption[]>([])
  const visiveis = marcadas.length === 0 ? solicitacoes : solicitacoes.filter(s => marcadas.some(m => m.value === s.situacao))

  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-16)' }}>
      <div>
        <Filter label="Situação" type="checkbox" values={SITUACOES} value={marcadas} onChange={setMarcadas} />
      </div>
      <Table value={visiveis} dataKey="id" paginator rows={5} emptyMessage="Nenhuma solicitação com esta situação. Limpe o filtro para ver todas.">
        <Column
          field="protocolo"
          header="Protocolo"
          body={(s: Solicitacao) => <TextLink href={`/backoffice/solicitacoes/${s.id}`}>{s.protocolo}</TextLink>}
        />
        <Column field="nome" header="Nome" />
        <Column field="servico" header="Serviço" />
        <Column field="situacao" header="Situação" body={(s: Solicitacao) => <Tag value={rotulo(s.situacao)} severity={COR[s.situacao]} />} />
        <Column field="recebidaEm" header="Recebida em" body={(s: Solicitacao) => new Date(`${s.recebidaEm}T12:00:00`).toLocaleDateString('pt-BR')} />
      </Table>
    </div>
  )
}
```

```tsx file=app/backoffice/solicitacoes/[id]/page.tsx
import { Fragment } from 'react'
import { notFound } from 'next/navigation'
import { Card, TextLink, Typography } from '@uigovpe/components'

import { buscarSolicitacao, SITUACOES } from '@/lib/solicitacoes'

export default async function Solicitacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const solicitacao = await buscarSolicitacao(id)
  if (!solicitacao) notFound()

  const campos: [string, string][] = [
    ['Nome', solicitacao.nome],
    ['Serviço', solicitacao.servico],
    ['Situação', SITUACOES.find(s => s.value === solicitacao.situacao)?.label ?? solicitacao.situacao],
    ['Recebida em', new Date(`${solicitacao.recebidaEm}T12:00:00`).toLocaleDateString('pt-BR')],
  ]

  return (
    <>
      <Typography variant="h1">Solicitação {solicitacao.protocolo}</Typography>
      <Card elevation="low">
        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 'var(--spacing-8) var(--spacing-24)', margin: 0 }}>
          {campos.map(([nome, valor]) => (
            <Fragment key={nome}>
              <dt>
                <Typography variant="span" fontWeight="bold">
                  {nome}
                </Typography>
              </dt>
              <dd style={{ margin: 0 }}>
                <Typography variant="span">{valor}</Typography>
              </dd>
            </Fragment>
          ))}
        </dl>
      </Card>
      <TextLink href="/backoffice/solicitacoes">Voltar para a lista</TextLink>
    </>
  )
}
```

Depois, ponha a rota da lista em `app/navigation.ts` (veja `shell.md`). O detalhe não entra
no menu: o usuário chega nele pela lista.
