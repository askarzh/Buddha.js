import * as os from 'node:os'
import * as path from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { Config } from './config.js'
import { BeingRegistry } from './being-registry.js'
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

  // Poison Arrow circuit breaker: registers a `tools/post-execute` waterfall
  // listener. `ctx.on` is a passive registration — it never dereferences
  // `ctx.tools`, so this stays safe even when `apply()` is loaded against a
  // bare Context with an overridden `inject: []` (see tests/mount.test.ts);
  // the listener only actually fires once a real `ToolRuntime` dispatches
  // through it, which requires this plugin's own declared `inject` above.
  applyBreaker(ctx, { registry, config: resolved.breaker })

  // Karma from tool outcomes: `tools/result` experiences + `agent/turn-
  // stopping` wholesome act on a clean turn.
  applyKarma(ctx, { registry })

  // Layer A citta-vīthi: pure observation of `agent/pre-step` (step/turn
  // records other sub-plugins read from) + one `being.cognize()` per step.
  // Never a loop replacement — that is Layer B, opt-in, a later task.
  // Its handle is captured (not discarded) — `/status` below reads
  // `getLastVithi()` from it.
  const vithi = applyVithi(ctx, { registry })

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
