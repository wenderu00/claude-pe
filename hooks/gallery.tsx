import type { RenderElement } from 'claude-code'

import type { Table } from './markdown'
import {
  askBand,
  codeCard,
  desktopSpinnerRow,
  diffCard,
  footerRow,
  groupRow,
  promptRow,
  replyRows,
  spinnerRow,
  terminalCard,
  toolRow,
  usageBand,
} from './rows'
import type { Look } from './rows'
import { codeRows } from './code-rows'
import { shellRows } from './shell-rows'

// Every element the skin draws, numbered, from the same builders the transcript uses, so
// a note on #4 is a note on the real thing.

const done = { isRunning: false, isErrored: false, isInterrupted: false }

const TABLE: Table = {
  kind: 'table',
  header: ['Skin', 'Accent', 'Time'],
  align: ['left', 'left', 'right'],
  rows: [
    ['noir', '#f5f5f5', '41s'],
    ['tokyo-night', '#7aa2f7', '2.1s'],
    ['dracula', '#bd93f9', '340ms'],
  ],
}

const SHELL_FOLD = { stdout: { head: 8, tail: 4 }, stderr: { head: 8, tail: 4 } }

const CODE = ['// Rate limit per route, keyed by user', 'export function limit(route: string, perMinute = 60) {', '  return (used: number) => used < perMinute', '}'].join('\n')

const DIFF = {
  path: '/work/apps/hub/src/server.ts',
  isNewFile: false,
  hunks: [{ oldStart: 12, newStart: 12, lines: [' const app = fastify()', '-app.listen(7447)', '+app.register(rateLimit, { max: 60 })', '+app.listen(7447)'] }],
}

export function galleryPane(look: Look, columns: number) {
  const { Box, Text } = look.ui
  const { palette } = look.skin
  const svg = look.svg
  let number = 0
  const section = (title: string, ...items: RenderElement[]) => {
    number += 1

    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text color={palette.muted} bold>{`${number}  ${title}`}</Text>
        {items}
      </Box>
    )
  }
  const width = Math.max(40, columns - 4)

  return (
    <Box flexDirection="column">
      {section('Seu prompt', promptRow(look, 'add rate limiting to the hub api'))}
      {section(
        'Linhas de ferramenta: concluída, rodando, com falha',
        toolRow(look, { tool: 'Bash', input: {}, ...done }, 'run', 'pnpm test --filter hub', { ms: 2140 }),
        toolRow(look, { tool: 'Read', input: {}, ...done, isRunning: true }, 'read', 'docs/protocols.md', {}),
        toolRow(look, { tool: 'Edit', input: {}, ...done, isErrored: true }, 'write', 'apps/hub/src/server.ts', {}),
      )}
      {section('Grupo recolhido de leituras e buscas', groupRow(look, [{ tool: 'Read', input: {}, ...done }, { tool: 'Read', input: {}, ...done }, { tool: 'Grep', input: {}, ...done }]))}
      {svg === undefined
        ? section('Cartão de diff da edição', <Text color={palette.muted}>Desktop only; the terminal keeps Claude Code's diff.</Text>)
        : section('Cartão de diff da edição', diffCard(look, svg, DIFF, 'apps/hub/src/server.ts', width))}
      {svg === undefined
        ? section(
            'Cartão de saída do shell: ok, falha com stderr, recolhido',
            shellRows(look, 'pnpm test --filter hub', { stdout: 'Test Files  12 passed (12)\n     Tests  148 passed (148)', stderr: '', interrupted: false }, false, SHELL_FOLD),
            shellRows(look, 'pnpm tsc', { stdout: 'src/server.ts', stderr: 'error TS2322: Type string is not assignable to number', interrupted: false, exitCode: 2 }, true, SHELL_FOLD),
            shellRows(look, 'seq 40', { stdout: Array.from({ length: 40 }, (_, i) => String(i + 1)).join('\n'), stderr: '', interrupted: false }, false, SHELL_FOLD),
          )
        : section(
            'Cartão de saída do shell: ok, falha',
            terminalCard(look, svg, { stdout: 'Test Files  12 passed (12)\n     Tests  148 passed (148)', stderr: '', interrupted: false }, false, width),
            terminalCard(look, svg, { stdout: '', stderr: 'error TS2322: Type string is not assignable to number', interrupted: false }, true, width, 'copy-output-failed'),
          )}
      {svg === undefined
        ? section('Bloco de código, destacado', codeRows(look, 'ts', CODE))
        : section('Cartão de bloco de código', codeCard(look, 'ts', CODE, svg, width))}
      {section('Tabela', replyRows(look, [TABLE], width, svg))}
      {svg === undefined
        ? section('Indicador de progresso', spinnerRow(look, look.skin.spinner[0] ?? 'Working', 3, 12_000))
        : section(
            'Spinner: thinking, tool running, writing, waiting',
            desktopSpinnerRow(look, svg, 'thinking', 'Thinking'),
            desktopSpinnerRow(look, svg, 'tool-use', 'Rodando pnpm test'),
            desktopSpinnerRow(look, svg, 'responding', 'Escrevendo a resposta'),
            desktopSpinnerRow(look, svg, 'requesting', 'Esperando o modelo'),
          )}
      {section(
        'Faixa acima do prompt: normal, e depois sugerindo compactar',
        usageBand(look, [{ label: 'contexto', percent: 42 }, { label: '5h', percent: 18 }], look.prefs.compact, () => undefined),
        usageBand(look, [{ label: 'contexto', percent: 85 }, { label: '5h', percent: 61 }], look.prefs.compact, () => undefined),
      )}
      {section('Faixa acima de uma pergunta', askBand(look, ['Approach', 'Store']))}
      {section('Rodapé do turno (terminal)', footerRow(look, look.skin.done[0] ?? 'Pronto', 41_000, { tools: 6, added: 18, removed: 3 }))}
    </Box>
  )
}
