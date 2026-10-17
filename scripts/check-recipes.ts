// Builds the recipes of the pe-design-system skill: a project made with the same steps as
// /pe-scaffold, then each ```tsx file=<path> block of the recipes at its path, then next build
// (types, and the server render of each page). Needs the network, like sync-ds.
import { execSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import './ds/hooks-loader.ts'
import { fences } from './ds/recipes.ts'

const { CREATE_NEXT_APP, installArgs, scaffoldFiles } = await import('../hooks/pe/scaffold.ts')

const ROOT = join(import.meta.dirname, '..')
const WORK = join(ROOT, '.sync-ds')
const NAME = 'recipes'
const APP = join(WORK, NAME)
const RECIPES = join(ROOT, 'skills', 'pe-design-system', 'references', 'recipes')

// The arguments are fixed words with no spaces, so one command line for the shell is safe.
function run(argv: string[], cwd: string): void {
  const command = argv.join(' ')
  console.log(`$ ${command}`)
  execSync(command, { cwd, stdio: 'inherit' })
}

mkdirSync(WORK, { recursive: true })
rmSync(APP, { recursive: true, force: true })
run(CREATE_NEXT_APP(NAME), WORK)
run(installArgs(), APP)
for (const [rel, text] of Object.entries(scaffoldFiles(NAME))) writeFileSync(join(APP, rel), text)
run(['npm', 'install', 'zod'], APP)

// The shell recipe moves the scaffold's home page into the public area.
rmSync(join(APP, 'app', 'page.tsx'))
for (const f of readdirSync(RECIPES).filter(f => f.endsWith('.md'))) {
  for (const fence of fences(readFileSync(join(RECIPES, f), 'utf8'))) {
    if (fence.file === null) continue
    mkdirSync(dirname(join(APP, fence.file)), { recursive: true })
    writeFileSync(join(APP, fence.file), fence.code)
  }
}
run(['npx', 'next', 'build'], APP)
console.log('\nAs receitas compilam e renderizam.')
