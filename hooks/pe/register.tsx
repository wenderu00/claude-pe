import type { EngineInterface, On } from 'claude-code'

import type { PartEvent, PartNext, PartResult } from '../parts'
import { componentText, findComponent, listText, notFoundText } from './catalog'
import { DS_VERSIONS } from './ds.generated'
import { adviceFor, isNewer, issuesIn, uigovpeVersion } from './rules'
import { CREATE_NEXT_APP, installArgs, isValidName, scaffoldFiles } from './scaffold'

const EDITS = /^(Edit|Write)$/
const MAX_DEPTH = 16

// Shown once per load: the project asks for a newer @uigovpe than the skill documents.
let versionNoted = false

const posix = (p: string): string => p.replace(/\\/g, '/')

// The @uigovpe/components range of the nearest package.json above `file`, or null when
// that package.json does not depend on it or there is none.
async function rangeFor($: EngineInterface, file: string): Promise<string | null> {
  let dir = posix(file).replace(/\/[^/]*$/, '')
  for (let i = 0; i < MAX_DEPTH && dir; i++) {
    let text: string | undefined
    try {
      text = await $.fs.read(`${dir}/package.json`)
    } catch {
      text = undefined
    }
    if (text !== undefined) return uigovpeVersion(text)
    const up = dir.replace(/\/[^/]*$/, '')
    if (up === dir) break
    dir = up
  }
  return null
}

const reason = (error: unknown): string => (error instanceof Error ? error.message : String(error))
const tail = (text: string): string => text.trim().split('\n').slice(-12).join('\n')

export async function peSessionStart($: EngineInterface, e: PartEvent<'session.start'>, next: PartNext<'session.start'>): PartResult<'session.start'> {
  const started = await next(e)
  await $.command.register({
    name: 'pe-component',
    description: 'Componente da Liga Digital: import, props e a história no Storybook; sem nome, lista todos',
    argumentHint: '[Nome]',
  })
  await $.command.register({
    name: 'pe-scaffold',
    description: 'Cria um projeto Next.js (App Router, TypeScript) com a Liga Digital (@uigovpe)',
    argumentHint: '<pasta>',
  })
  return started
}

// The steps of /pe-scaffold; the text says what was done, or where it stopped and why.
async function scaffold($: EngineInterface, name: string): Promise<string> {
  if (!name) return 'Use /pe-scaffold <pasta>: o nome da pasta do projeto novo, por exemplo /pe-scaffold portal-servicos.'
  if (!isValidName(name)) return `Nome inválido: "${name}". Use letras minúsculas, números, - . ou _, sem barras.`
  const cwd = (await $.session.cwd()).replace(/[\\/]+$/, '')
  const target = `${cwd}/${name}`
  if (await $.fs.exists(target)) return `A pasta ${target} já existe. Escolha outro nome.`

  const created = await $.process.run(CREATE_NEXT_APP(name), { cwd, timeoutMs: 300_000 })
  if (created.exitCode !== 0) return `create-next-app falhou (código ${created.exitCode}):\n${tail(created.stderr || created.stdout)}`
  const installed = await $.process.run(installArgs(), { cwd: target, timeoutMs: 600_000 })
  if (installed.exitCode !== 0) {
    return `O projeto foi criado em ${target}, mas npm install falhou (código ${installed.exitCode}):\n${tail(installed.stderr || installed.stdout)}`
  }
  for (const [rel, text] of Object.entries(scaffoldFiles(name))) await $.fs.write(`${target}/${rel}`, text)
  return [
    `Projeto criado em ${target}, com @uigovpe/components ${DS_VERSIONS.components} e @uigovpe/styles ${DS_VERSIONS.styles}.`,
    'app/layout.tsx carrega os estilos e o UiProvider; app/page.tsx começa com a GovBar.',
    '',
    `cd ${name} && npm run dev`,
  ].join('\n')
}

export const register = (on: On): void => {
  on('command.run', { command: 'pe-component' }, async ($, e) => {
    const name = (e.args ?? '').trim()
    if (!name) return { text: listText() }
    const c = findComponent(name)
    if (!c) return { text: notFoundText(name) }
    const text = componentText(c)
    if (!c.docsUrl) return { text }
    const opened = await $.browser.open({ url: c.docsUrl }).catch((error: unknown) => ({ ok: false as const, error: reason(error) }))
    return { text: opened.ok ? `${text}\n\nAberto no navegador do terminal.` : `${text}\n\nO navegador do terminal não abriu (${opened.error}). Abra o link acima.` }
  })

  on('command.run', { command: 'pe-scaffold' }, async ($, e) => ({ text: await scaffold($, (e.args ?? '').trim()) }))

  // After Claude writes code in an @uigovpe project: what in it goes against the
  // Liga Digital rules, as a note only Claude reads. The edit itself stands.
  on('tool.call', { tool: EDITS }, async ($, e, next) => {
    const result = await next(e)
    if (result.deny !== undefined || result.isError || (e.tool !== 'Edit' && e.tool !== 'Write')) return result
    const path = e.file_path
    const text = e.tool === 'Edit' ? e.new_string : e.content
    const issues = issuesIn(path, text)
    if (issues.length === 0) return result
    const range = await rangeFor($, path)
    if (range === null) return result
    const newer = !versionNoted && isNewer(range, DS_VERSIONS.components)
    if (newer) versionNoted = true
    return { ...result, context: [...(result.context ?? []), adviceFor(path, issues, newer ? range : undefined)] }
  })
}
