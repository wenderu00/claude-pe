import type { EventName, Hook, MatchedHook } from 'claude-code'

// The engine takes one hook per event and matcher from a plugin, and this plugin is four
// parts that hook some of the same events. Each part exports its hook for such an event as
// a function declaration typed here, and the plugin's register calls them by name, one
// inside the next: a part's `next` is the part after it, and the last part's is the engine's.
// Each call sits in a `guard`, so one part that fails does not take the others with it.

type AnyHook = (...args: never[]) => unknown

type NextOf<H extends AnyHook> = Parameters<H>[2] extends (e: infer E) => infer R ? (e: E) => R : never

export type PartEvent<N extends EventName> = Parameters<Hook<N>>[1]
export type PartNext<N extends EventName> = NextOf<Hook<N>>
export type PartResult<N extends EventName> = Promise<Awaited<ReturnType<Hook<N>>>>

// The engine's rule for a plugin's hook that fails, kept for each part: the part is passed
// over, and its last `next` result stands, or the part beneath runs in its place.
export function guard<E, R>(beneath: (e: E) => Promise<R>): { next: (e: E) => Promise<R>; recover: (e: E) => Promise<R> } {
  let last: Promise<R> | undefined
  return {
    next: e => (last = beneath(e)),
    recover: e => last ?? beneath(e),
  }
}

type AbovePromptHook = MatchedHook<'ui.render', { component: 'AbovePrompt' }>

export type AbovePromptEvent = Parameters<AbovePromptHook>[1]
export type AbovePromptNext = NextOf<AbovePromptHook>
export type AbovePromptResult = Promise<Awaited<ReturnType<AbovePromptHook>>>
