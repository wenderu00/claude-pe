# pe-devkit

> **Projeto comunitário, não oficial.** Não tem relação com o Governo de Pernambuco nem com a
> Secretaria de Administração. A fonte oficial do design system é a
> [Liga Digital](https://ligadigital.pe.gov.br/storybook/).

Um mod do Claude Code para devs que constroem serviços do Governo de Pernambuco:

- **Visual de Pernambuco.** A skin `pernambuco` usa as cores dos tokens da Liga Digital
  (`@uigovpe/styles`), no terminal claro e no escuro.
- **Progresso.** Uma barra acima do prompt segue a lista de tarefas do Claude; sem lista de
  tarefas, ela segue os subagentes da sessão ("Agentes 1/3"). No terminal, a barra é a
  bandeira de Pernambuco inteira em 3 linhas (azul, a estrela, o arco-íris, o sol e a cruz
  sobre o branco), e o progresso revela a bandeira da esquerda para a direita. No app desktop,
  a parte feita é azul sobre branco, e o emblema (a estrela, o arco-íris, o sol e a cruz) aparece
  no meio da barra quando o progresso passa por ele. O painel
  `/agents-info` mostra os subagentes, com modelo, contexto, custo e tempo. Um agente que
  termina mostra a bandeira na sua barra; enquanto roda, a barra mostra o contexto, em cinza.
  A mascote Lis, em
  pixel art com a bandeira de Pernambuco no peito, anda em cima da barra, na ponta do progresso, e no painel (no app desktop) e
  fica no topo do painel no terminal. O mascote da tela inicial do Claude Code não muda: a API
  de mods não deixa desenhar ali.
- **Árvore de arquivos** na barra lateral, com git status e o que o Claude lê e escreve.
- **Navegador no terminal** ([terminal-browser](https://github.com/zenbu-labs/terminal-browser)),
  para ver o Storybook e o app que você está construindo.
- **Design system no Claude.** A skill `pe-design-system` traz os 51 componentes de
  `@uigovpe/components` com as props e os links do Storybook. Depois de cada edição num
  projeto `@uigovpe`, o Claude recebe um aviso se usou `primereact` direto ou uma cor literal.
- **`/pe-scaffold`** cria um projeto Next.js já configurado. **`/pe-component`** mostra um
  componente e abre a história dele.
- **Construir aos poucos.** **`/pe-feature`** acrescenta uma parte nova ao sistema por vez
  (uma tela, a rota e os dados de exemplo), a partir de receitas da Liga Digital: shell público
  e backoffice com menu, formulário, lista com detalhe e formulário em passos. O trabalho segue
  a lista de tarefas do Claude (e a barra da bandeira), e termina com `npm run build` e a tela
  conferida no navegador.

## Requisitos

| | |
|---|---|
| Claude Code | 2.1.302 ou mais novo (os testes do plugin rodam nesta versão; o mod usa *function hooks*, uma API em *early access* que pode mudar). Se os mods não carregarem, o README do terminal-browser pede `"env": { "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1" }` em `~/.claude/settings.json`. |
| Terminal | kitty ou ghostty, para o navegador no terminal. O resto do mod funciona em qualquer terminal. |
| terminal-browser | `curl -fsSL https://terminal-browser.sh/install \| bash` ou `brew install terminal-browser` |
| Árvore de arquivos | layout em tela cheia (`/tui fullscreen`) e um terminal com 110 colunas ou mais |

### Plataformas

| Plataforma | Situação |
|---|---|
| macOS | suportado |
| Linux | suportado |
| Windows | só pelo **WSL**, com o Claude Code, o terminal-browser e o kitty **dentro** do WSL (o kitty abre pelo WSLg). O app Desktop no Windows não carrega mods em sessões WSL. |

No Windows, `scripts/spike-wsl.sh` instala o kitty, o Claude Code e o terminal-browser no
Ubuntu do WSL:

```bash
wsl -d Ubuntu -- bash /mnt/c/<caminho>/claude-pe/scripts/spike-wsl.sh
```

## Instalação

No Claude Code:

```
/plugin install pe-devkit --marketplace wenderu00/claude-pe
```

Responda `y` para adicionar o marketplace e escolha o escopo. Depois reinicie o Claude Code.

## Uso

| Comando | O que faz |
|---|---|
| `/skin` | Abre as configurações da skin. `/skin off` volta ao visual do Claude Code. `/skin list` mostra tudo. |
| `/filetree [caminho]` | Mostra a árvore de arquivos. |
| `/agents-info` | Mostra ou esconde o painel de subagentes. |
| `/browser [url]` | Abre o navegador do terminal. |
| `/pe-component [Nome]` | Import, props e a história do componente no Storybook. Sem nome, lista todos. |
| `/pe-scaffold <pasta>` | Cria um projeto Next.js (App Router, TypeScript) com `@uigovpe/components`, `@uigovpe/styles`, o `UiProvider` e a `GovBar`. |
| `/pe-feature <o que a feature faz>` | Num projeto `@uigovpe`, acrescenta um incremento: escolhe a receita, cria as tarefas, constrói, põe a rota em `app/navigation.ts` e confere. Um pedido grande vira uma lista; só o primeiro item é feito. |

Os comandos do `/skin` (`rail`, `tables`, `calm`…) ficam com os nomes originais do
[claude-skins](https://github.com/hellosverre/claude-skins).

### O aviso depois das edições

Num projeto cujo `package.json` tem `@uigovpe/components`, depois de cada `Edit` ou `Write` do
Claude, o mod confere o código novo e manda ao Claude (só a ele) uma nota quando:

- importa um componente de um módulo `primereact/*` que o `@uigovpe` já envolve
  (`import type` pode);
- usa uma cor literal em CSS, ou numa prop de cor em TSX. Se a cor é igual a um token, a nota
  diz qual (`var(--color-text-primary)`, por exemplo);
- o projeto pede uma versão de `@uigovpe/components` mais nova que a documentada pela skill.

O aviso não bloqueia a edição.

### Configuração

Em `/config`, na seção do pe-devkit: abrir o painel de agentes sozinho, o que brilha na
árvore, ícones, seguir o Claude, abrir a árvore no início, a coluna da direita, dicas, com que
programa abrir e editar arquivos, e se o Claude tem a ferramenta de navegador.

### A árvore de arquivos

A árvore desenha linhas (`├─`, `└─`, `│`) entre as pastas e os arquivos. No modo de ícones
`simples`, cada arquivo tem um `●` com a cor da categoria: código, config, docs ou outros.
As categorias só usam azul e cinza, porque verde, amarelo e vermelho são do git status.

Com a skin `pernambuco`, a árvore usa as cores da Liga Digital, no terminal claro e no escuro,
mesmo com um tema do Omarchy. O brilho do que o Claude faz também: escrever é amarelo, ler é
azul, commit e push são verdes, erro é vermelho. Com outra skin ou com `/skin off`, a árvore
fica com as cores de antes.

Os ícones `nerd` precisam de uma Nerd Font no terminal. Sem ela, cada ícone aparece como `□`.
Nesse caso, use `auto` (o padrão) ou `simples`.

## Atualizar o design system

As versões documentadas ficam em `ds.config.json`. Para uma versão nova do `@uigovpe`:

```bash
# edite ds.config.json, depois:
npm install
npm run sync-ds
```

O script baixa os pacotes do npm (sem rodar scripts deles), lê os tokens de cor do CSS e as
props dos `.d.ts`, lê o índice do Storybook e escreve:

- `skills/pe-design-system/references/` (uma página por componente, o índice e os tokens);
- `hooks/pe/ds.generated.ts` (tokens, componentes e módulos `primereact` envolvidos).

Depois, confira as receitas (`skills/pe-design-system/references/recipes/`) com a versão nova:

```bash
npm run check-recipes
```

O script cria um projeto com os mesmos passos do `/pe-scaffold` em `.sync-ds/recipes`, escreve
nele cada bloco ```` ```tsx file=<caminho> ```` das receitas e roda `next build` (tipos e a
renderização de cada página no servidor). Precisa de rede.

O mod não contém código nem CSS do `@uigovpe`: só documentação e valores de token gerados dos
pacotes públicos. Os pacotes não declaram licença no npm.

## Desenvolvimento

```bash
npm install
npm run test:scripts   # testes do sync-ds e das receitas (Node)
npm run test:plugin    # testes do plugin (claude plugin test .)
npm run validate       # claude plugin validate .
claude --plugin-dir .  # uma sessão com o mod carregado desta pasta
```

O mod é um plugin só, feito de partes (`hooks/skins.tsx`, `hooks/progress`, `hooks/filetree`,
`hooks/browser`, `hooks/pe`). O Claude Code aceita um hook por evento em cada plugin, então os
eventos que mais de uma parte usa são ligados uma vez em `hooks/register.tsx`, que chama as
partes uma dentro da outra (`hooks/parts.ts`). Uma parte que falha é pulada, como o Claude Code
faz com o hook de um plugin, e as outras seguem.

## Créditos

Feito sobre o código de [claude-skins](https://github.com/hellosverre/claude-skins),
[savvy-progress](https://github.com/JohnnyVizz/claude-kit/tree/main/plugins/savvy-progress),
[claude-code-filetree](https://github.com/data-goblin/claude-code-filetree) e
[terminal-browser](https://github.com/zenbu-labs/terminal-browser), todos MIT. Veja
`THIRD_PARTY_NOTICES.md`.

Licença: MIT.
