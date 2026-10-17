# Receita: formulário em passos (wizard)

Um pedido longo, dividido em passos: dados pessoais, endereço, confirmação. É o formato comum
dos serviços públicos com muitos campos. Para um formulário de uma tela, use `form.md`.

Precisa do `zod` no projeto (`npm install zod`).

## Como funciona

- [StepperHeader](../components/StepperHeader.md) mostra os passos; [StepperBody](../components/StepperBody.md)
  mostra o passo atual (`render` do passo) e o rodapé com os botões. `currentStep` começa em 0.
- Cada passo tem o seu esquema `zod`. "Próximo" valida só o passo atual, no navegador. O
  esquema completo junta os passos, e a Server Action valida tudo de novo no envio.
- Os campos são controlados (`value` e `onChange`): um passo sai da tela quando o usuário
  avança, e os valores ficam no estado do assistente.
- O último passo (`isConclusion`) mostra o resumo e envia. O envio passa os valores para a
  Server Action em `<input type="hidden">`.
- "Próximo" (`type="button"`) e "Enviar" (`type="submit"`) ficam no mesmo lugar: dê `key`
  diferente a cada um. Sem isso, o clique em "Próximo" do penúltimo passo envia o formulário.
- O título da página já diz o nome do processo: não repita em `processName` do `StepperHeader`.

## Exemplo: inscrição no programa

```ts file=lib/inscricoes.ts
// O seam de dados das inscrições. Troque o corpo da função pela chamada à API real.

export type Inscricao = { nome: string; cpf: string; telefone: string; cep: string; cidade: string; endereco: string }

export async function criarInscricao(inscricao: Inscricao): Promise<{ protocolo: string }> {
  // Exemplo: só gera um protocolo.
  return { protocolo: `INSC-${inscricao.cpf.slice(0, 3)}${Date.now().toString().slice(-6)}` }
}
```

```ts file=app/(publico)/inscricao/esquema.ts
import { z } from 'zod'

export const passoDados = z.object({
  nome: z.string().trim().min(3, 'Escreva o nome completo.'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Escreva o CPF no formato 000.000.000-00.'),
  telefone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Escreva o telefone no formato (81) 90000-0000.'),
})

export const passoEndereco = z.object({
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'Escreva o CEP no formato 00000-000.'),
  cidade: z.string().trim().min(2, 'Escreva a cidade.'),
  endereco: z.string().trim().min(5, 'Escreva a rua e o número.'),
})

export const esquema = passoDados.extend(passoEndereco.shape)

export type Campo = keyof z.infer<typeof esquema>
export type Valores = Record<Campo, string>
export type Erros = Partial<Record<Campo, string[]>>

export type Estado = { erros?: Erros; protocolo?: string }
```

```ts file=app/(publico)/inscricao/actions.ts
'use server'

import { z } from 'zod'

import { criarInscricao } from '@/lib/inscricoes'
import { esquema, type Estado } from './esquema'

export async function inscrever(_anterior: Estado, dados: FormData): Promise<Estado> {
  const resultado = esquema.safeParse(Object.fromEntries(dados.entries()))
  if (!resultado.success) return { erros: z.flattenError(resultado.error).fieldErrors }
  const { protocolo } = await criarInscricao(resultado.data)
  return { protocolo }
}
```

```tsx file=app/(publico)/inscricao/assistente.tsx
'use client'

import { useActionState, useState } from 'react'
import { z } from 'zod'
import { Button, InputMasked, InputText, Message, StepperBody, StepperHeader, Typography, type Step } from '@uigovpe/components'

import { inscrever } from './actions'
import { passoDados, passoEndereco, type Campo, type Erros, type Estado, type Valores } from './esquema'

const VAZIO: Valores = { nome: '', cpf: '', telefone: '', cep: '', cidade: '', endereco: '' }
// O esquema de cada passo, na ordem dos passos (o último, a confirmação, não tem campos).
const ESQUEMAS: z.ZodType<Partial<Valores>>[] = [passoDados, passoEndereco]

export function AssistenteInscricao() {
  const [estado, enviar, enviando] = useActionState(inscrever, {} as Estado)
  const [passo, setPasso] = useState(0)
  const [valores, setValores] = useState(VAZIO)
  const [erros, setErros] = useState<Erros>({})

  if (estado.protocolo) {
    return <Message severity="success" text={`Inscrição feita. O protocolo é ${estado.protocolo}.`} />
  }

  const todosErros: Erros = { ...erros, ...estado.erros }
  // Os campos visíveis não têm name: os <input type="hidden"> levam todos os valores no envio.
  const campo = (nome: Campo) => ({
    value: valores[nome],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValores(v => ({ ...v, [nome]: e.target.value })),
    invalid: !!todosErros[nome],
    supportText: todosErros[nome]?.[0],
  })

  const avancar = () => {
    const resultado = ESQUEMAS[passo]!.safeParse(valores)
    if (!resultado.success) return setErros(z.flattenError(resultado.error).fieldErrors)
    setErros({})
    setPasso(p => p + 1)
  }

  const passos: Step[] = [
    {
      label: 'Passo 1',
      title: 'Seus dados',
      isCompleted: passo > 0,
      render: () => (
        <div style={{ display: 'grid', gap: 'var(--spacing-16)' }}>
          <InputText label="Nome completo" {...campo('nome')} />
          <InputMasked label="CPF" mask="999.999.999-99" {...campo('cpf')} />
          <InputMasked label="Telefone" mask="(99) 99999-9999" {...campo('telefone')} />
        </div>
      ),
    },
    {
      label: 'Passo 2',
      title: 'Endereço',
      isCompleted: passo > 1,
      render: () => (
        <div style={{ display: 'grid', gap: 'var(--spacing-16)' }}>
          <InputMasked label="CEP" mask="99999-999" {...campo('cep')} />
          <InputText label="Cidade" {...campo('cidade')} />
          <InputText label="Rua e número" {...campo('endereco')} />
        </div>
      ),
    },
    {
      label: 'Passo 3',
      title: 'Confirmação',
      isConclusion: true,
      render: () => (
        <div style={{ display: 'grid', gap: 'var(--spacing-8)' }}>
          <Typography variant="p">Confira os dados antes de enviar.</Typography>
          <Typography variant="p">
            {valores.nome}, CPF {valores.cpf}, telefone {valores.telefone}
          </Typography>
          <Typography variant="p">
            {valores.endereco}, {valores.cidade}, CEP {valores.cep}
          </Typography>
          {estado.erros && <Message severity="error" text="Algum dado está errado. Volte e corrija os campos marcados." />}
        </div>
      ),
    },
  ]

  const ultimo = passo === passos.length - 1
  // Keys diferentes: sem elas, o React troca o type do mesmo <button> durante o clique em
  // "Próximo", e o navegador envia o formulário no passo errado.
  const rodape = (
    <div style={{ display: 'flex', gap: 'var(--spacing-8)' }}>
      {passo > 0 && <Button key="voltar" type="button" label="Voltar" outlined onClick={() => setPasso(p => p - 1)} />}
      {ultimo ? (
        <Button key="enviar" type="submit" label="Enviar inscrição" loading={enviando} />
      ) : (
        <Button key="proximo" type="button" label="Próximo" onClick={avancar} />
      )}
    </div>
  )

  return (
    <form action={enviar} noValidate style={{ display: 'grid', gap: 'var(--spacing-24)', maxWidth: '48rem' }}>
      {Object.entries(valores).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      <StepperHeader steps={passos} currentStep={passo} />
      <StepperBody steps={passos} currentStep={passo} footer={rodape} />
    </form>
  )
}
```

```tsx file=app/(publico)/inscricao/page.tsx
import { Typography } from '@uigovpe/components'

import { AssistenteInscricao } from './assistente'

export default function Inscricao() {
  return (
    <>
      <Typography variant="h1">Inscrição no programa</Typography>
      <AssistenteInscricao />
    </>
  )
}
```

Depois, ponha a rota em `app/navigation.ts` (veja `shell.md`).
