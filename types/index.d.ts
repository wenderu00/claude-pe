// The skin (hooks/skins.tsx).
// Every colour a skin names. `fg` is body text, `muted` secondary text, `surface` the
// band behind a table header, `zebra` every other table row.
export type SkinSlot =
  | 'read'
  | 'write'
  | 'run'
  | 'search'
  | 'web'
  | 'mcp'
  | 'other'
  | 'user'
  | 'fg'
  | 'muted'
  | 'surface'
  | 'zebra'
  | 'ok'
  | 'err'
  | 'warn'

// What /skin and the settings pane change. `skin` is a skin's name, or 'off'.
export type Prefs = {
  skin: string
  icons: 'unicode' | 'ascii'
  // Which side the outline around a typed prompt sits on; 'right' matches the desktop app.
  // 'plain' drops the outline for a leading marker.
  prompt: 'left' | 'right' | 'plain'
  // Whose words the spinner and the turn footer show: 'claude' keeps Claude Code's own,
  // whatever the skin says; 'skin' draws the skin's.
  words: 'claude' | 'skin'
  rail: boolean
  // 'text' keeps the skin but draws tables and code as text the desktop can select.
  tables: 'on' | 'text' | 'off'
  shimmer: boolean
  band: boolean
  // When each plan limit resets, beside its meter in the band.
  countdown: boolean
  clipOutput: boolean
  markdown: boolean
  quiet: boolean
  charts: boolean
  // Display formulas as cards and inline TeX as Unicode.
  math: boolean
  // Tables and code in slash-command output drawn the way replies are.
  commands: boolean
  // Shell output as a card: the command, its exit status, stderr apart, long output folded.
  shell: boolean
  // Fenced code on the terminal and shell output in the skin's colours.
  highlight: boolean
  // The model-only note that charts and diagrams draw here.
  hints: boolean
  // Bare URLs as links: OSC 8 where the terminal draws it, anchors on the desktop.
  links: boolean
  // Copy buttons on tables, code, diagrams and whole replies.
  copy: boolean
  // Long code, tables and shell output folded behind a `▾ N more` control.
  fold: boolean
  // Runs of reads and searches drawn open, as if each had been expanded, not as one line.
  expand: boolean
  // The band's Compact button, and its nudge once the context is full enough to be worth it.
  compact: boolean
  // While /skin calm is on, the parts it changed as they were before it, for calm off to
  // put back; null while it is off.
  calm: CalmSnapshot | null
}

// The prefs /skin calm changes: no shimmer, no rail line above each tool row, quiet output.
export type CalmSnapshot = { shimmer: boolean; rail: boolean; quiet: boolean }

// A skin someone made in the settings pane or through their agent: a built-in skin
// with some slots and words changed.
export type CustomSkin = {
  name: string
  label: string
  base: string
  palette: Partial<Record<SkinSlot, string>>
  spinner: string[]
  done: string[]
}

// How full the context window is and how much of each plan limit is spent, in percent,
// as the band above the prompt shows them, and when each limit resets (epoch ms) where known.
export type UsageSnap = { context: number | null; limits: { label: string; percent: number; resetsAt?: number }[] }

// What one turn did, shown in its footer.
export type TurnStats = { tools: number; added: number; removed: number }

// What this turn did to a file: made it, or changed one that was there.
export type Touch = 'created' | 'edited'

// How a tool row stands: opened or closed by the person, or `auto`, open only when the
// call failed.
export type Disclosure = 'auto' | 'open' | 'closed'

// `$.skins.markdown`'s argument: where the tree draws, the markdown, the width in columns.
export type SkinsMarkdownArgs = { surface: 'terminal' | 'desktop' | 'vscode' | 'mobile'; text: string; columns: number }

declare module 'claude-code' {
  // What skins adds to `$` for other mods.
  interface EngineInterface {
    // What the browser part adds to `$` (hooks/browser).
    browser: Browser
    skins: {
      // Markdown drawn the way skins draws a reply in the person's skin: tables, code,
      // diagrams, math, alerts. Undefined when skins is off or the text holds nothing it
      // draws; throws on a malformed argument. No copy or fold controls.
      markdown: (args: SkinsMarkdownArgs) => Promise<RenderElement | undefined>
    }
    // What the skin-code mod adds, when it is installed (absent, or a call throws, when it
    // is not): skins leaves it the replies it draws.
    skinCode?: {
      draws: (args: { text: string }) => Promise<boolean>
    }
  }

  interface PluginState {
    'pe-devkit': {
      // The task bar and the agents panel (hooks/progress).
      progressFlow: Flow | null
      progressAgents: AgentRun[]
      progressPanel: Panel
      progressNow: number
      progressTasks: TaskItem[]
      // The file tree (hooks/filetree).
      filetreeTree: FileTree
      filetreeTheme: Theme
      filetreeActivity: Activity[]
      // The skin (hooks/skins.tsx).
      prefs: Prefs
      custom: Record<string, CustomSkin>
      startedAt: number
      frame: number
      turns: Record<string, TurnStats>
      duration: StateFamily<number>
      editing: SkinSlot
      usage: UsageSnap
      // The usage band's countdowns by limit label, as last drawn.
      countdowns: Record<string, string>
      isLight: boolean
      images: StateFamily<boolean>
      quiet: StateFamily<boolean>
      // A shell call's command, for its output card's header: ToolResult does not carry it.
      command: StateFamily<string>
      // Each tool row's chevron, and whether its opened answer shows past the fold.
      disclosure: StateFamily<Disclosure>
      showAll: StateFamily<boolean>
      // Files the turn created or edited, by absolute path, for their colour in rows and prose.
      touched: Record<string, Touch>
      // Per drawing, the keys of the blocks the person unfolded.
      folds: StateFamily<string[]>
      compacting: boolean
      pinned: boolean
      settle: number
      lastReply: string
    }
  }
}

// The task bar and the agents panel (hooks/progress).
// One task of Claude's task list, as the task tools report it.
export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskItem = { id: string; subject: string; active: string; status: TaskStatus }

export type Phase = 'plan' | 'design' | 'delegate' | 'review' | 'close'

export type PlannedTask = {
  title: string
  tier: string
  after: number[]
}

export type Flow = {
  title: string
  total: number
  done: number
  running: number
  phase: Phase
  isFinished: boolean
  tasks: PlannedTask[]
}

export type AgentStatus = 'running' | 'done' | 'failed'

export type AgentRun = {
  id: string
  agentId?: string
  type: string
  description: string
  model: string
  effort?: string
  status: AgentStatus
  startedAt: number
  endedAt?: number
  contextTokens: number
  contextMax: number
  tokens: number
  costUsd: number
  steps: number
  round: number
  /** Self-reported by the worker through the `step` tool. */
  stepDone?: number
  stepTotal?: number
  stepNote?: string
}

export type Panel = {
  isCompact: boolean
  isDoneCollapsed: boolean
  autoOpenedFor: string
}

// The file tree (hooks/filetree).
export type FileNode = {
  id: string
  parent: string
  name: string
  kind: 'dir' | 'file' | 'link'
  hidden: boolean
  mtime: number
  size: number
  loaded: boolean
}

export type Branch = {
  head: string
  upstream: string
  ahead: number
  behind: number
}

export type Activity = {
  id: number
  kind: string
  label: string
  state: 'running' | 'done' | 'failed'
  detail: string
  at: number
  tone: string
  nerd: string
  plain: string
}

export type FileTree = {
  root: string
  nodes: FileNode[]
  expanded: string[]
  cursor: string
  selected: string
  query: string
  showHidden: boolean
  showSize: boolean
  dirSizes: Record<string, number>
  git: Record<string, string>
  diff: Record<string, [number, number]>
  ignored: string[]
  untrackedDirs: string[]
  top: string
  prefix: string
  branch: Branch | null
  counts: Record<string, [number, number, number]>
  flash: string[]
  flashDim: string[]
  flashOn: boolean
  flashTones: Record<string, string>
  scroll: number | null
  preview: string
  previewTop: number
}

export type Theme = {
  fg: string
  accent: string
  muted: string
  urgent: string
  selection: string
  bg: string
}

// The browser pane (hooks/browser).
export type BrowserOpenInput = { url?: string }

export type BrowserOpenResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export type Browser = {
  open: (input: BrowserOpenInput) => Promise<BrowserOpenResult>
  close: (input?: Record<string, never>) => Promise<boolean>
}
