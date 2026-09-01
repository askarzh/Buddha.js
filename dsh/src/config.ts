import z from '@deepseek-ai/schemastery'

/**
 * Poison Arrow circuit breaker config (implemented in `src/breaker.ts`):
 * when `enabled`, a per-agent, per-tool consecutive-failure streak escalates
 * through three tiers: at `threshold` the informational cessation protocol is
 * attached to the failing tool's own result; the call that CROSSES
 * `threshold * blockMultiplier` is blocked at `tools/post-execute` (it ran,
 * its output is withheld); and every call made while the streak is already
 * past that boundary is denied at `tools/pre-execute` — never dispatched,
 * which is the only tier that actually spares a side-effecting tool.
 *
 * No tier is a dead end. A successful call to any tool clears that tool's own
 * streak and relieves every other tool's pressure back below the block
 * boundary; a successful call to a tool named in `mutatingTools` is stronger
 * still and clears every streak outright. The weaker, cross-tool rule is what
 * keeps a refusal recoverable for an agent that cannot reach the stronger one
 * — a read-only realm persona (`deva`, `asura`) has no mutating tool at all.
 *
 * `blockMultiplier` exists because we measured which tier actually changes
 * behaviour. Three live DeepSeek runs read the advisory notice, reasoned
 * about its provenance, and declined it — twice naming this project's own
 * Buddhist vocabulary as evidence of social engineering — while obeying the
 * block, which they described as the harness issuing a hard guard. So the
 * advisory tier is informational and enforcement is the block arm, and how
 * soon enforcement arrives is an operator's call: the answer is
 * model-dependent, and an operator who trusts their model can set `2` to
 * restore the old boundary. At the default `threshold: 3` and
 * `blockMultiplier: 1.5`, identical retries run pressure 1 -> 3 (advisory)
 * -> 5 (blocked): two retries before enforcement, where 2x allowed three.
 */
export interface BreakerConfig {
  enabled: boolean
  threshold: number
  blockMultiplier: number
  mutatingTools: string[]
}

/**
 * Configuration for `dsh-plugin-buddha`.
 *
 * - `stateDir`: where Being state is persisted. `''` (the default) resolves
 *   to `<os.homedir()>/.buddha/dsh` at apply time.
 * - `breaker`: the Poison Arrow circuit breaker (consecutive-failure loop
 *   guard), implemented in `src/breaker.ts`.
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
      blockMultiplier: z.number().default(1.5),
      mutatingTools: z.array(z.string()).default(['write', 'edit', 'str_replace_editor']),
    })
    .default({ enabled: true, threshold: 3, blockMultiplier: 1.5, mutatingTools: ['write', 'edit', 'str_replace_editor'] }),
  loop: z.union([z.const('off'), z.const('citta-vithi')]).default('off'),
})
