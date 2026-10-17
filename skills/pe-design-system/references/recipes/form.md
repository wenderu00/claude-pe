# Receita: página de formulário

Um formulário de uma tela que envia dados: pedir um serviço, cadastrar, editar. Para um
formulário longo, em passos, use `wizard.md`.

Precisa do `zod` no projeto (`npm install zod`).

## As peças

| Arquivo | O que faz |
|---|---|
| `lib/<feature>.ts` | O seam de dados: funções `async` com dados de exemplo. A equipe troca o corpo delas pela API real; as páginas não mudam. Se a feature já tem o arquivo, acrescente as funções nele. |
| `<rota>/esquema.ts` | O esquema `zod` e o tipo do estado do formulário. Fica fora de `actions.ts` porque um arquivo `'use server'` só exporta funções `async`. |
| `<rota>/actions.ts` | A Server Action: valida com o esquema e chama o seam. A validação roda no servidor sempre. |
| `<rota>/formulario.tsx` | O componente cliente: `useActionState`, os campos, os erros. |
| `<rota>/page.tsx` | A página do servidor: título, texto e o formulário. |

Componentes: [InputText](../components/InputText.md), [InputMasked](../components/InputMasked.md)
(CPF, telefone, CEP; não use `InputMask`, que é obsoleto), [Dropdown](../components/Dropdown.md),
[Button](../components/Button.md), [Message](../components/Message.md).

## Os erros nos campos

Cada campo do `@uigovpe` tem `label` e `supportText`. O erro do campo vai em `supportText`, com
`invalid` (do PrimeReact) para a borda de erro. Não escreva `<label>` nem texto de erro próprio.

Depois do envio com erro, a Server Action devolve os valores digitados e o formulário os
mostra de novo com `defaultValue`. O `Dropdown` é controlado, então o valor dele vai para o
`FormData` num `<input type="hidden">`.

## Exemplo: solicitar certidão

```ts file=lib/certidoes.ts
// O seam de dados das certidões. Troque o corpo das funções pela chamada à API real.

export const TIPOS_CERTIDAO = ['nascimento', 'casamento', 'obito'] as const
export type TipoCertidao = (typeof TIPOS_CERTIDAO)[number]

export const OPCOES_TIPO: { label: string; value: TipoCertidao }[] = [
  { label: 'Nascimento', value: 'nascimento' },
  { label: 'Casamento', value: 'casamento' },
  { label: 'Óbito', value: 'obito' },
]

export type PedidoCertidao = { nome: string; cpf: string; email: string; tipo: TipoCertidao }

export async function criarPedido(pedido: PedidoCertidao): Promise<{ protocolo: string }> {
  // Exemplo: só gera um protocolo.
  return { protocolo: `CERT-${pedido.cpf.slice(0, 3)}${Date.now().toString().slice(-6)}` }
}
```

```ts file=app/(publico)/certidoes/nova/esquema.ts
import { z } from 'zod'

import { TIPOS_CERTIDAO } from '@/lib/certidoes'

export const esquema = z.object({
  nome: z.string().trim().min(3, 'Escreva o nome completo.'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Escreva o CPF no formato 000.000.000-00.'),
  email: z.email('Escreva um e-mail válido.'),
  tipo: z.enum(TIPOS_CERTIDAO, 'Escolha o tipo de certidão.'),
})

export type Campo = keyof z.infer<typeof esquema>

export type Estado = {
  erros?: Partial<Record<Campo, string[]>>
  valores?: Partial<Record<Campo, string>>
  protocolo?: string
}
```

```ts file=app/(publico)/certidoes/nova/actions.ts
'use server'

import { z } from 'zod'

import { criarPedido } from '@/lib/certidoes'
import { esquema, type Estado } from './esquema'

export async function solicitar(_anterior: Estado, dados: FormData): Promise<Estado> {
  const valores = Object.fromEntries(dados.entries()) as Record<string, string>
  const resultado = esquema.safeParse(valores)
  if (!resultado.success) return { erros: z.flattenError(resultado.error).fieldErrors, valores }
  const { protocolo } = await criarPedido(resultado.data)
  return { protocolo }
}
```

```tsx file=app/(publico)/certidoes/nova/formulario.tsx
'use client'

import { useActionState, useState } from 'react'
import { Button, Dropdown, InputMasked, InputText, Message } from '@uigovpe/components'

import { OPCOES_TIPO } from '@/lib/certidoes'
import { solicitar } from './actions'
import type { Campo, Estado } from './esquema'

export function FormularioCertidao() {
  const [estado, enviar, enviando] = useActionState(solicitar, {} as Estado)
  const [tipo, setTipo] = useState(estado.valores?.tipo ?? '')
  const erro = (campo: Campo) => estado.erros?.[campo]?.[0]

  if (estado.protocolo) {
    return <Message severity="success" text={`Pedido recebido. O protocolo é ${estado.protocolo}.`} />
  }

  return (
    <form action={enviar} noValidate style={{ display: 'grid', gap: 'var(--spacing-16)', maxWidth: '36rem' }}>
      <InputText label="Nome completo" name="nome" defaultValue={estado.valores?.nome} invalid={!!erro('nome')} supportText={erro('nome')} />
      <InputMasked label="CPF" name="cpf" mask="999.999.999-99" defaultValue={estado.valores?.cpf} invalid={!!erro('cpf')} supportText={erro('cpf')} />
      <InputText label="E-mail" name="email" type="email" defaultValue={estado.valores?.email} invalid={!!erro('email')} supportText={erro('email')} />
      <Dropdown
        label="Tipo de certidão"
        options={OPCOES_TIPO}
        value={tipo}
        onChange={e => setTipo(e.value)}
        placeholder="Escolha"
        invalid={!!erro('tipo')}
        supportText={erro('tipo')}
      />
      <input type="hidden" name="tipo" value={tipo} />
      <div>
        <Button type="submit" label="Solicitar" loading={enviando} />
      </div>
    </form>
  )
}
```

```tsx file=app/(publico)/certidoes/nova/page.tsx
import { Typography } from '@uigovpe/components'

import { FormularioCertidao } from './formulario'

export default function NovaCertidao() {
  return (
    <>
      <Typography variant="h1">Solicitar certidão</Typography>
      <Typography variant="p">Preencha os dados. A resposta chega no e-mail que você informar.</Typography>
      <FormularioCertidao />
    </>
  )
}
```

Depois, ponha a rota em `app/navigation.ts` (veja `shell.md`).
