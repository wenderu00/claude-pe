import type { Register } from 'claude-code'

import { browserSessionStart, browserUiMessage, register as browser } from './browser/register'
import { filetreeSessionStart, filetreeToolCall, filetreeUiMessage, register as filetree } from './filetree/register'
import { guard } from './parts'
import { peSessionStart, register as pe } from './pe/register'
import type { AbovePromptEvent, PartEvent } from './parts'
import { progressAbovePrompt, progressSessionStart, progressTurnComplete, register as progress } from './progress/register'
import { register as skins, skinsAbovePrompt, skinsSessionStart, skinsToolCall, skinsTurnComplete } from './skins'

const reason = (error: unknown): string => (error instanceof Error ? error.message : String(error))

// One plugin, five parts. An event that more than one part hooks is hooked here once, with
// the parts' hooks called one inside the next, outermost first (see parts.ts).
export const register: Register = (on, options) => {
  progress(on, options)
  skins(on)
  filetree(on, options)
  browser(on, options)
  pe(on)

  // Adds `$.skins` and `$.browser` for other mods. Each method is a floor: a call is the
  // skins.markdown, browser.open or browser.close event, which the parts' hooks answer.
  on('engine.create', async ($, e, next) => {
    const built = await next(e)
    const servedByHooks = () => {
      throw new Error('the browser noun is served by its hooks')
    }
    return {
      ...built,
      skins: { markdown: async () => undefined },
      browser: { open: servedByHooks, close: servedByHooks },
    }
  })

  on('session.start', async ($, e, next) => {
    type E = PartEvent<'session.start'>
    const skipped = (part: string, error: unknown) => $.ui.log(`pe-devkit: ${part} session.start skipped: ${reason(error)}`)
    const toEngine = guard((x: E) => next(x))
    const toPe = guard(async (x: E) => {
      try {
        return await peSessionStart($, x, toEngine.next)
      } catch (error) {
        if (toEngine.isFrom(error)) throw error
        skipped('pe', error)
        return toEngine.recover(x)
      }
    })
    const toBrowser = guard(async (x: E) => {
      try {
        return await browserSessionStart($, x, toPe.next)
      } catch (error) {
        if (toPe.isFrom(error)) throw error
        skipped('browser', error)
        return toPe.recover(x)
      }
    })
    const toFiletree = guard(async (x: E) => {
      try {
        return await filetreeSessionStart($, x, toBrowser.next)
      } catch (error) {
        if (toBrowser.isFrom(error)) throw error
        skipped('filetree', error)
        return toBrowser.recover(x)
      }
    })
    const toSkins = guard(async (x: E) => {
      try {
        return await skinsSessionStart($, x, toFiletree.next)
      } catch (error) {
        if (toFiletree.isFrom(error)) throw error
        skipped('skins', error)
        return toFiletree.recover(x)
      }
    })
    try {
      return await progressSessionStart($, e, toSkins.next)
    } catch (error) {
      if (toSkins.isFrom(error)) throw error
      skipped('progress', error)
      return toSkins.recover(e)
    }
  })

  on('tool.call', async ($, e, next) => {
    type E = PartEvent<'tool.call'>
    const skipped = (part: string, error: unknown) => $.ui.log(`pe-devkit: ${part} tool.call skipped: ${reason(error)}`)
    const toEngine = guard((x: E) => next(x))
    const toFiletree = guard(async (x: E) => {
      try {
        return await filetreeToolCall($, x, toEngine.next)
      } catch (error) {
        if (toEngine.isFrom(error)) throw error
        skipped('filetree', error)
        return toEngine.recover(x)
      }
    })
    try {
      return await skinsToolCall($, e, toFiletree.next)
    } catch (error) {
      if (toFiletree.isFrom(error)) throw error
      skipped('skins', error)
      return toFiletree.recover(e)
    }
  })

  on('turn.complete', async ($, e, next) => {
    type E = PartEvent<'turn.complete'>
    const skipped = (part: string, error: unknown) => $.ui.log(`pe-devkit: ${part} turn.complete skipped: ${reason(error)}`)
    const toEngine = guard((x: E) => next(x))
    const toSkins = guard(async (x: E) => {
      try {
        return await skinsTurnComplete($, x, toEngine.next)
      } catch (error) {
        if (toEngine.isFrom(error)) throw error
        skipped('skins', error)
        return toEngine.recover(x)
      }
    })
    try {
      return await progressTurnComplete($, e, toSkins.next)
    } catch (error) {
      if (toSkins.isFrom(error)) throw error
      skipped('progress', error)
      return toSkins.recover(e)
    }
  })

  on('ui.message', async ($, e, next) => {
    type E = PartEvent<'ui.message'>
    const skipped = (part: string, error: unknown) => $.ui.log(`pe-devkit: ${part} ui.message skipped: ${reason(error)}`)
    const toEngine = guard((x: E) => next(x))
    const toBrowser = guard(async (x: E) => {
      try {
        return await browserUiMessage($, x, toEngine.next)
      } catch (error) {
        if (toEngine.isFrom(error)) throw error
        skipped('browser', error)
        return toEngine.recover(x)
      }
    })
    try {
      return await filetreeUiMessage($, e, toBrowser.next)
    } catch (error) {
      if (toBrowser.isFrom(error)) throw error
      skipped('filetree', error)
      return toBrowser.recover(e)
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const skipped = (part: string, error: unknown) => $.ui.log(`pe-devkit: ${part} AbovePrompt skipped: ${reason(error)}`)
    const toEngine = guard((x: AbovePromptEvent) => next(x))
    const toSkins = guard(async (x: AbovePromptEvent) => {
      try {
        return await skinsAbovePrompt($, x, toEngine.next)
      } catch (error) {
        if (toEngine.isFrom(error)) throw error
        skipped('skins', error)
        return toEngine.recover(x)
      }
    })
    try {
      return await progressAbovePrompt($, e, toSkins.next)
    } catch (error) {
      if (toSkins.isFrom(error)) throw error
      skipped('progress', error)
      return toSkins.recover(e)
    }
  })
}
