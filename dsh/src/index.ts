import * as os from 'node:os'
import * as path from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { Config } from './config.js'
import { BeingRegistry } from './being-registry.js'
import { applyBreaker } from './breaker.js'

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
  const registry = new BeingRegistry(stateDir)

  // Poison Arrow circuit breaker: registers a `tools/post-execute` waterfall
  // listener. `ctx.on` is a passive registration — it never dereferences
  // `ctx.tools`, so this stays safe even when `apply()` is loaded against a
  // bare Context with an overridden `inject: []` (see tests/mount.test.ts);
  // the listener only actually fires once a real `ToolRuntime` dispatches
  // through it, which requires this plugin's own declared `inject` above.
  applyBreaker(ctx, { registry, config: resolved.breaker })

  // Karma tracking and the citta-vithi loop overlay mount here in later
  // tasks.
}
