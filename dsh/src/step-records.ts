import type { Agent } from '@deepseek-ai/dsh-agent'

/**
 * One agent's most recently entered step, as observed from the real
 * `agent/pre-step` waterfall (see `applyVithi` in vithi.ts).
 */
export interface StepRecord {
  readonly turn: number
  readonly step: number
  readonly phase: string
  readonly stepId: string
}

/**
 * Per-agent table of "what step is this agent currently in", sourced from
 * `agent/pre-step`. This is the single source of truth other sub-plugins
 * read from instead of maintaining their own step-tracking scaffolding —
 * in particular `breaker.ts`'s `currentStepId()`, which used to run a
 * temporary per-agent monotonic counter that this module replaced
 * until the real citta-vīthi step annotations (`applyVithi`) existed to
 * populate this table for real.
 *
 * `stepId` combines turn and step (`"<turn>:<step>"`) so it stays unique
 * across turns, not just within one — two different turns' step 0 must
 * never collide.
 */
export class StepRecords {
  private readonly records = new WeakMap<Agent, StepRecord>()

  /** Record that `agent` entered a new step. Returns the resulting record. */
  advance(agent: Agent, info: { phase: string; turn: number; step: number }): StepRecord {
    const record: StepRecord = { ...info, stepId: `${info.turn}:${info.step}` }
    this.records.set(agent, record)
    return record
  }

  /** The most recently recorded step for `agent`, if any. */
  current(agent: Agent): StepRecord | undefined {
    return this.records.get(agent)
  }

  /**
   * The current step id for `agent`. Before the first `agent/pre-step` has
   * been observed for this agent (e.g. a unit test dispatching directly
   * against `tools/post-execute`/`tools/result`), a stable sentinel is
   * returned so calls made before any recorded step still group together.
   */
  currentStepId(agent: Agent): string {
    return this.records.get(agent)?.stepId ?? 'pre-step'
  }
}

/**
 * Module-level shared instance. `applyKarma`, `applyVithi`, and `applyBreaker`
 * are all mounted against the same DSH plugin process, so one shared table
 * (keyed by `Agent`, which is itself already a per-process live handle) is
 * the correct scope — no per-registry or per-config partitioning is needed.
 */
export const stepRecords = new StepRecords()
