// Lis: the pe-devkit mascot, a pixel figure with streaked hair and the Pernambuco
// flag on the chest. Rows of characters keyed into LIS_PALETTE; `.` is empty.

export const LIS_PALETTE = {
  h: '#5C3A1E', // hair
  r: '#D7262B', // flag red, hair streak
  y: '#F5C400', // flag yellow, star, hair streak
  g: '#1F9E46', // flag green
  b: '#2348D0', // body, hair streak
  o: '#142C8F', // body shade
  s: '#C8926A', // face
  k: '#1F1E1D', // eyes
} as const

// Desktop: the head, body and back arm on the 30×28 grid of the pane's mascots,
// drawn from (3, 4). The legs and the front arm are drawn apart, so they can move.
export const LIS_BODY = [
  '........hhhhhhhh........',
  '......hhrrhhhhhhyyhh....',
  '.....hrrbbhhhhhhhhyyhh..',
  '....hrrbbhhhsssshhhhyyh.',
  '...hrrbbhhssssssssshhyyh',
  '...hrbbhhssssssssssshyyh',
  '..hrbbhhskkssssssskkshyh',
  '..hrbbhhskkssssssskkshyh',
  '..hrbbhhskkssssssskkshyh',
  '..hhbhhsssssssssssshhyh.',
  'bbbbbbssssssssssssbb....',
  'bbbbbbbbbbbyybbbbbbb....',
  'bbbbbbbbbbrrrrbbbbbb....',
  'oooobbbbbryyyyrbbbbb....',
  '....bbbbrygyygyrbbbb....',
  '....bbbbbbbbbbbbbbbb....',
  '....bbbbbbbbbbbbbbbb....',
  '....oooooooooooooooo....',
]

// Terminal: the whole figure in 16×12 pixels, two to a character cell.
export const LIS_TERMINAL = [
  '....hhhhhhhh....',
  '..hhrrhhhhyyhh..',
  '.hrrbhhhhhhhyyh.',
  'hrbbhsssssshhyyh',
  'hrbhskssssskshyh',
  'hbhhskssssskshhh',
  'bbbssssssssssbbb',
  'bbbbbbbyybbbbbbb',
  '...bbbrrrrbbb...',
  '...bbryyyyrbb...',
  '...brygyygyrb...',
  '...b.b....b.b...',
]

export type Cell = { ch: string; fg?: string; bg?: string }

// Two pixel rows to one row of cells: `▀` coloured by the top pixel over the
// bottom one as background, `▄` where only the bottom pixel is set.
export const halfBlocks = (rows: string[], palette: Record<string, string>): Cell[][] => {
  const cells: Cell[][] = []
  for (let i = 0; i < rows.length; i += 2) {
    const top = rows[i] ?? ''
    const bottom = rows[i + 1] ?? ''
    cells.push(
      [...top].map((ch, x) => {
        const fg = palette[ch]
        const bg = palette[bottom[x] ?? '.']
        if (fg && bg) return { ch: '▀', fg, bg }
        if (fg) return { ch: '▀', fg }
        if (bg) return { ch: '▄', fg: bg }
        return { ch: ' ' }
      }),
    )
  }
  return cells
}
