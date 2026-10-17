import { expect, test } from 'claude-code/testing'

import { fileCategory } from '../../hooks/filetree/icons'
import { emptyTree, toNodes, visibleRows } from '../../hooks/filetree/tree'

type Kind = 'file' | 'dir'

// A tree under /r from a folder → children listing, with the given folders open.
function treeOf(dirs: Record<string, [string, Kind][]>, open: string[], extra: { query?: string; showHidden?: boolean } = {}) {
  const t = emptyTree('/r')
  t.nodes = Object.entries(dirs).flatMap(([dir, kids]) => toNodes(dir, kids.map(([name, kind]) => ({ name, kind, mtimeMs: 0, size: 1, isLink: false }))))
  t.expanded = open
  if (extra.query !== undefined) t.query = extra.query
  if (extra.showHidden !== undefined) t.showHidden = extra.showHidden
  return t
}

const drawn = (t: ReturnType<typeof treeOf>) => visibleRows(t).map(r => `${r.lines}${r.node.name}`)

test('tree lines: siblings get ├─, the last one └─, and the top level has no lines', () => {
  const t = treeOf({ '/r': [['src', 'dir'], ['README.md', 'file']], '/r/src': [['a.ts', 'file'], ['b.ts', 'file'], ['c.ts', 'file']] }, ['/r/src'])
  expect(drawn(t)).toEqual(['src', '├─a.ts', '├─b.ts', '└─c.ts', 'README.md'])
})

test('tree lines: a folder that is not the last child carries │ down to its children, a last one carries blanks', () => {
  const t = treeOf(
    {
      '/r': [['hooks', 'dir']],
      '/r/hooks': [['filetree', 'dir'], ['pe', 'dir'], ['blocks.ts', 'file']],
      '/r/hooks/filetree': [['git.ts', 'file'], ['icons.ts', 'file']],
      '/r/hooks/pe': [['rules.ts', 'file']],
    },
    ['/r/hooks', '/r/hooks/filetree'],
  )
  expect(drawn(t)).toEqual(['hooks', '├─filetree', '│ ├─git.ts', '│ └─icons.ts', '├─pe', '└─blocks.ts'])
  const last = treeOf(
    { '/r': [['hooks', 'dir']], '/r/hooks': [['lib', 'dir'], ['pe', 'dir']], '/r/hooks/pe': [['rules.ts', 'file']] },
    ['/r/hooks', '/r/hooks/pe'],
  )
  expect(drawn(last)).toEqual(['hooks', '├─lib', '└─pe', '  └─rules.ts'])
})

test('tree lines: a search that hides the last child puts └─ on the last child it shows', () => {
  const t = treeOf({ '/r': [['src', 'dir']], '/r/src': [['alpha.ts', 'file'], ['beta.ts', 'file'], ['zeta.md', 'file']] }, [], { query: '.ts' })
  expect(drawn(t)).toEqual(['src', '├─alpha.ts', '└─beta.ts'])
})

test('tree lines: hidden files left out of the tree do not count as the last child', () => {
  // Folders sort first, so the hidden file is the last child.
  const t = treeOf({ '/r': [['src', 'dir']], '/r/src': [['lib', 'dir'], ['.zz', 'file']] }, ['/r/src'], { showHidden: false })
  expect(drawn(t)).toEqual(['src', '└─lib'])
})

test('file category: code, config, docs and everything else', () => {
  for (const name of ['x.tsx', 'a.py', 'main.go', 'style.css', 'run.sh']) expect(fileCategory(name)).toBe('code')
  for (const name of ['package.json', 'tsconfig.json', 'x.yaml', 'Cargo.toml', 'Dockerfile', '.gitignore', 'yarn.lock']) expect(fileCategory(name)).toBe('config')
  for (const name of ['README.md', 'LICENSE', 'notes.txt', 'guide.pdf', 'data.csv']) expect(fileCategory(name)).toBe('docs')
  for (const name of ['logo.png', 'archive.zip', 'noext', 'clip.mp4']) expect(fileCategory(name)).toBe('other')
})

test('file category: dotfiles with a second dot, variant Dockerfiles, .d.ts, Makefile and upper-case extensions', () => {
  for (const name of ['.env', '.env.local', '.env.production', 'Dockerfile.dev', 'Makefile']) expect(fileCategory(name)).toBe('config')
  for (const name of ['types.d.ts', 'MAIN.PY']) expect(fileCategory(name)).toBe('code')
  expect(fileCategory('NOTES.MD')).toBe('docs')
})

test('file category: names that are also object properties are plain files', () => {
  for (const name of ['constructor', '__proto__', 'toString']) expect(fileCategory(name)).toBe('other')
  expect(fileCategory('x.constructor')).toBe('other')
  expect(fileCategory('x.hasOwnProperty')).toBe('other')
})
