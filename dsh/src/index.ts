import * as os from 'node:os'
import * as path from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { Config } from './config.js'
import { BeingRegistry } from './being-registry.js'
import { SaveScheduler } from './persistence.js'
import { applyBreaker } from './breaker.js'
import { applyKarma } from './karma.js'
import { applyVithi } from './vithi.js'
import { applyCommands } from './commands.js'
import { applyRealms } from './realms.js'
import { applyLoop } from './loop.js'

export { Config }

export const name = 'dsh-plugin-buddha'

// 'subagents' and 'llm' are injected by the sub-plugins that need them, not
// by this root plugin, so they are deliberately absent from `inject` here.
export const inject = ['tools', 'commands', 'systemPrompt']

export function apply(ctx: Context, config?: Config) {
  // Normalize through the schema so this stays robust even when a caller
  // bypasses Cordis's own config validation (e.g. tests/mount.test.ts loads
  // this plugin with an inline `{ name, inject: [], apply }` object that
  // has no attached `Config` schema of its own, so `config` arrives as
  // `undefined`) — `Config()` fills in every field's declared default.
  const resolved = Config(config)

  // '' (the schema default) resolves to <os.homedir()>/.buddha/dsh, per
  // config.ts's documented contract.
  const stateDir = resolved.stateDir || path.join(os.homedir(), '.buddha', 'dsh')

  // ONE registry instance is threaded through every sub-plugin below. Two
  // registries over the same stateDir could hand out divergent `Being`
  // objects for the same session (each with its own in-memory `live` map),
  // so this must stay a single hoisted instance, never one constructed
  // per sub-plugin.
  const registry = new BeingRegistry(stateDir)

  // ONE scheduler over that registry, likewise threaded through every
  // sub-plugin. Breaker, karma and vīthi all mutate the same `Being` on the
  // same `tools/result`; before this each of them wrote the whole (growing)
  // JSON document itself, 2–3 write+rename pairs per tool call. They now
  // `mark()` and the turn's single write happens at the boundaries below.
  const scheduler = new SaveScheduler(registry)

  // Session end. `agent/disposed` is verified against the installed
  // @deepseek-ai/dsh-agent (lib/index.js `emitDisposed`, typed in
  // lib/types/runtime-types.d.ts): AgentRegistry emits it for EVERY announced
  // agent when its entry detaches — main agents and subagent children alike,
  // not children only — with the payload `{ agent }` (NOT a bare agent) and
  // the agent's own scope carrier, so an unscoped root listener like this one
  // receives all of them. Flush first so the file is durable, then drop the
  // live instance; `dispose()` KEEPS the file (only `discard()`, used for
  // ephemeral realm children in realms.ts, deletes it).
  ctx.on('agent/disposed', ({ agent }: { agent: Agent }) => {
    const sessionId = String(agent.id)
    scheduler.flush(sessionId)
    registry.dispose(sessionId)
  })

  // Plugin teardown / process shutdown. Cordis v4 has no public 'dispose'
  // event (its `Events` interface in @deepseek-ai/cordis/lib/types/events.d.ts
  // declares only the `internal/*` hooks), so the idiomatic equivalent is a
  // teardown effect — the same mechanism the sub-plugins already use for
  // agent-scoped cleanup. A shutdown mid-turn therefore still writes the turn.
  ctx.effect(() => () => {
    scheduler.flushAll()
  })

  // Poison Arrow circuit breaker: registers a `tools/post-execute` waterfall
  // listener. `ctx.on` is a passive registration — it never dereferences
  // `ctx.tools`, so this stays safe even when `apply()` is loaded against a
  // bare Context with an overridden `inject: []` (see tests/mount.test.ts);
  // the listener only actually fires once a real `ToolRuntime` dispatches
  // through it, which requires this plugin's own declared `inject` above.
  applyBreaker(ctx, { registry, scheduler, config: resolved.breaker })

  // Karma from tool outcomes: `tools/result` experiences + `agent/turn-
  // stopping` wholesome act on a clean turn.
  applyKarma(ctx, { registry, scheduler })

  // Layer A citta-vīthi: pure observation of `agent/pre-step` (step/turn
  // records other sub-plugins read from) + one `being.cognize()` per step.
  // Never a loop replacement — that is Layer B, opt-in below.
  // Its handle is captured (not discarded) — `/status` below reads
  // `getLastVithi()` from it.
  const vithi = applyVithi(ctx, { registry, scheduler })

  // The four human slash commands: `/sit`, `/koan`, `/status`, `/rebirth`.
  // Dispatch straight to a handler, no model round trip.
  applyCommands(ctx, { registry, vithi })

  // Six-realm subagent personas: a `buddha-realms` provider on
  // `ctx.subagents` mapping persona -> realm, delegating actual execution
  // to the stock in-process `spawn` provider.
  applyRealms(ctx, { registry })

  // Layer B (experimental, opt-in): replace DSH's stock agent loop with the
  // citta-vīthi structured loop. A no-op unless `config.loop ===
  // 'citta-vithi'` — the default ('off') leaves every existing test and
  // deployment completely unaffected.
  if (resolved.loop === 'citta-vithi') {
    applyLoop(ctx, { registry })
  }
}
