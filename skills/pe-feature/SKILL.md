---
name: pe-feature
description: Use when the user runs /pe-feature or asks to add a page, screen or feature to an existing @uigovpe (Liga Digital) Next.js project, one increment at a time — maps the request to recipes (shell, form, list + detail, wizard), builds one increment with Claude's task list, and checks it with npm run build and the browser.
argument-hint: <o que a feature faz>
---

# /pe-feature: uma parte nova do sistema por vez

Pedido: $ARGUMENTS

Cada `/pe-feature` acrescenta **um incremento** ao sistema: uma receita, uma rota e um seam de
dados, conferidos no fim. As receitas estão na skill `pe-design-system`, em
`references/recipes/` (comece por `index.md`). Leia a receita antes de escrever o código e
siga os arquivos dela; troque só os nomes, os campos e os textos.

## 1. Ler o sistema

- `package.json` precisa ter `@uigovpe/components`. Se não tem, pare e indique `/pe-scaffold`.
- `app/navigation.ts` é o mapa do sistema: quais páginas existem, em que área. Leia antes de
  tudo. Se não existe, este incremento começa pela receita `shell.md`.
- Veja as rotas em `app/` e os seams em `lib/`. Use o seam da feature se ele já existe.

## 2. Dividir o pedido

Um incremento = uma receita + uma rota (com o detalhe, se é lista) + o seam.

- Se o pedido tem mais de um incremento, mostre a lista numerada e construa **só o primeiro**.
  O usuário chama `/pe-feature` de novo para o próximo.
- Se o pedido não diz a área (pública, para o cidadão, ou backoffice, para o servidor),
  pergunte.
- Se nenhuma receita serve, diga isso e pergunte antes de inventar um padrão.

## 3. Criar as tarefas, antes de qualquer código

O desenvolvimento roda na lista de tarefas do Claude. Use `TaskCreate`/`TaskUpdate` (ou
`TodoWrite`, se é a ferramenta que você tem). A barra de progresso do pe-devkit (a bandeira de
Pernambuco) segue essa lista.

Crie só as tarefas que valem para este incremento, nesta ordem:

1. `Shell <área> e app/navigation.ts` — só quando falta a área. Receita `shell.md`. Na área
   pública, apague `app/page.tsx` do scaffold.
2. `Instalar zod` — só quando a receita pede e o `package.json` não tem. Pergunte antes.
3. `Seam lib/<feature>.ts`
4. `Página <rota>` — uma tarefa por página da receita (lista e detalhe são duas).
5. `Rota em app/navigation.ts`
6. `npm run build`
7. `Conferir no navegador`

Uma tarefa por vez em andamento (`in_progress`). Marque `completed` só depois que ela está
feita e conferida. Não crie tarefas para os outros incrementos da lista.

## 4. Construir

- Siga a receita: os mesmos componentes, a mesma divisão em arquivos (servidor, cliente,
  `actions.ts`, `esquema.ts`), os erros em `supportText`.
- Componentes e props: `references/components/<Nome>.md`. Cores e espaços só com tokens.
- Depois de cada edição, o pe-devkit pode mandar uma nota sobre `primereact` direto ou cor
  literal. Corrija antes de seguir.

## 5. Conferir

- `npm run build` tem que passar. Se falha, ache a causa e corrija; não esconda o erro (nada de
  `// @ts-ignore`, `any` novo ou `export const dynamic` para calar o build). Rode de novo.
- Com o app rodando (`npm run dev`), abra a rota nova com `mcp__pe-devkit__browser_open` e leia
  com `terminal-browser action -- snapshot`. Confira que a página mostra o que a receita diz e
  que a rota aparece na página inicial (pública) ou no menu (backoffice). No fim, rode
  `terminal-browser action done`.
- Se o navegador não abre, deixe a tarefa `Conferir no navegador` sem `completed` e diga ao
  usuário que a tela não foi conferida. Nunca diga que conferiu o que não viu.

## 6. Relatar

Curto:

- os arquivos criados e mudados;
- a rota nova e onde ela aparece;
- as funções do seam que a equipe precisa trocar pela API real;
- o próximo incremento da lista, se há, como um `/pe-feature <...>` pronto para copiar.
