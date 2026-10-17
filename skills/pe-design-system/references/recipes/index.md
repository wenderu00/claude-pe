# Receitas

Telas inteiras feitas com os componentes da Liga Digital, para um projeto Next.js (App Router)
como o do `/pe-scaffold`. Cada receita traz os arquivos completos, com o caminho no projeto
(```` ```tsx file=<caminho> ````). Os exemplos juntos formam um sistema pequeno de certidões;
troque os nomes pelos da sua feature.

Os arquivos das receitas compilam e renderizam juntos com as versões de `ds.config.json`
(`npm run check-recipes` no repositório do pe-devkit).

| Receita | Use quando |
|---|---|
| [shell.md](shell.md) | O projeto ainda não tem `app/navigation.ts`. Cria a área pública e/ou o backoffice e o mapa de páginas. Sempre a primeira. |
| [form.md](form.md) | Uma tela que envia dados: pedir um serviço, cadastrar, editar. |
| [list-detail.md](list-detail.md) | Uma lista de registros com filtro e paginação, e a página de cada registro. |
| [wizard.md](wizard.md) | Um pedido longo em passos, com confirmação no fim. |

Regras que valem para todas:

- Os dados passam por um seam em `lib/<feature>.ts`: funções `async` com dados de exemplo. A
  equipe troca o corpo delas pela API real; as páginas não mudam.
- A validação usa `zod`, numa Server Action. Os erros vão no `supportText` do campo.
- Toda página nova entra em `app/navigation.ts`. A página de detalhe não entra: o usuário
  chega nela pela lista.
- Espaços com os tokens `var(--spacing-<n>)` (2 a 80), cores com os tokens de `tokens.md`.
