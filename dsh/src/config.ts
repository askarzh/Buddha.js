import z from '@deepseek-ai/schemastery'

/**
 * Poison Arrow circuit breaker config, reserved by this scaffold and
 * implemented in a later task: it guards against loops of mutating tool
 * calls (`mutatingTools`) by tripping after `threshold` calls without
 * intervening progress, when `enabled`.
 */
export interface BreakerConfig {
  enabled: boolean
  threshold: number
  mutatingTools: string[]
}

/**
 * Configuration for `dsh-plugin-buddha`.
 *
 * - `stateDir`: where Being state is persisted. `''` (the default) resolves
 *   to `<os.homedir()>/.buddha/dsh` at apply time (later task).
 * - `breaker`: the Poison Arrow circuit breaker (mutating-tool loop guard),
 *   implemented in a later task — this schema only reserves its shape.
 * - `loop`: which agent loop to run. `'off'` (default) leaves DSH's stock
 *   `agent-loop` plugin driving every agent, untouched. `'citta-vithi'`
 *   replaces it with the experimental citta-vīthi structured loop
 *   (`src/loop.ts`) — requires disabling the stock `agent-loop` plugin in
 *   the cordis overlay; see `dsh/README.md`'s "Experimental" section.
 */
export interface Config {
  stateDir: string
  breaker: BreakerConfig
  loop: 'off' | 'citta-vithi'
}

// schemastery's `Schema<S, T>.default(value: T)` requires the FULL output
// shape, not a partial — nested field defaults do not satisfy an outer
// `.default({})` at the type level, so the breaker default is spelled out
// in full here even though each field also carries its own default.
export const Config: z<Config> = z.object({
  stateDir: z.string().default(''),
  breaker: z
    .object({
      enabled: z.boolean().default(true),
      threshold: z.number().default(3),
      mutatingTools: z.array(z.string()).default(['write', 'edit', 'str_replace_editor']),
    })
    .default({ enabled: true, threshold: 3, mutatingTools: ['write', 'edit', 'str_replace_editor'] }),
  loop: z.union([z.const('off'), z.const('citta-vithi')]).default('off'),
})
