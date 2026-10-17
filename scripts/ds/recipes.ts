// The code blocks of a recipe page. A block opened with ```tsx file=<path> is a whole file
// at that path of the project; scripts/check-recipes.ts type checks those files together.

export type Fence = { lang: string; file: string | null; code: string }

const OPEN = /^(`{3,})(\w*)(?:\s+file=(\S+))?\s*$/

export function fences(markdown: string): Fence[] {
  const found: Fence[] = []
  let open: { ticks: string; lang: string; file: string | null; lines: string[] } | null = null
  for (const line of markdown.split(/\r?\n/)) {
    if (open === null) {
      const m = OPEN.exec(line)
      if (m) open = { ticks: m[1]!, lang: m[2]!, file: m[3] ?? null, lines: [] }
    } else if (line.trimEnd() === open.ticks) {
      found.push({ lang: open.lang, file: open.file, code: open.lines.map(l => `${l}\n`).join('') })
      open = null
    } else {
      open.lines.push(line)
    }
  }
  return found
}
