import type { Context } from '@deepseek-ai/cordis'
import type { Agent, PreStepDecision } from '@deepseek-ai/dsh-agent'
import type { ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import type { CognitionResult } from 'buddha-js'
import type { BeingRegistry } from './being-registry.js'
import { stepRecords } from './step-records.js'

function sessionIdOf(agent: Agent): string {
  return agent.id
}

export interface VithiHandle {
  /**
   * The most recent `CognitionResult` produced for `agent` by this
   * `applyVithi` mount's `tools/result` listener, for `/status` to read.
   * `undefined` before any step has cognized for this agent.
   */
  getLastVithi(agent: Agent): CognitionResult | undefined
}

/**
 * Layer A citta-vīthi: pure observation of the sanctioned `agent/pre-step`
 * waterfall plus a `Being.cognize()` call per step — never a loop
 * replacement (that is Layer B, opt-in via `loop: 'citta-vithi'`).
 *
 * - `agent/pre-step`: delegates to `next()` FIRST and returns that decision
 *   unchanged (pure passthrough — this listener never rejects a step or
 *   substitutes messages), then records the step in the shared
 *   `stepRecords` table (see `step-records.ts`) so `breaker.ts` and
 *   `karma.ts` read real step/turn identity instead of their own
 *   scaffolding.
 * - `tools/result`: runs one `being.cognize()` per step — the FIRST tool
 *   result observed in a given step triggers it; later tool results in the
 *   same step (e.g. several tool calls dispatched in parallel) are deduped
 *   against it, matching the breaker's "N parallel calls are one signal"
 *   discipline.
 *
 * Returns a `VithiHandle` exposing `getLastVithi` for `/status`.
 */
export function applyVithi(ctx: Context, deps: { registry: BeingRegistry }): VithiHandle {
  const { registry } = deps
  const cognizedSteps = new WeakMap<Agent, string>()
  const lastVithi = new WeakMap<Agent, CognitionResult>()
  const cleanedUp = new WeakSet<Agent>()

  function ensureCleanup(agent: Agent): void {
    if (cleanedUp.has(agent)) return
    cleanedUp.add(agent)
    // Agent-scoped effect: torn down (and the entries forgotten) when the
    // agent's own context unwinds — matches BreakerState/KarmaState's
    // lifecycle discipline.
    agent.ctx.effect(() => () => {
      cognizedSteps.delete(agent)
      lastVithi.delete(agent)
      cleanedUp.delete(agent)
    })
  }

  ctx.on(
    'agent/pre-step',
    async function (
      this: unknown,
      payload: { agent: Agent; messages: unknown[]; turn: number; step: number; signal: AbortSignal },
      next: () => Promise<PreStepDecision>
    ): Promise<PreStepDecision> {
      const decision = await next() // ALWAYS delegate first — pure observation
      stepRecords.advance(payload.agent, { phase: 'āvajjana', turn: payload.turn, step: payload.step })
      return decision
    }
  )

  ctx.on('tools/result', (exec: Readonly<ToolExecution>, result: Readonly<ToolExecutionResult>) => {
    if (!exec.agent) return
    if (exec.rootCallId !== exec.callId) return // Code-Mode sub-dispatch: ignore, like the breaker

    const agent = exec.agent
    ensureCleanup(agent)

    const stepId = stepRecords.currentStepId(agent)
    if (cognizedSteps.get(agent) === stepId) return // already cognized this step
    cognizedSteps.set(agent, stepId)

    const { being } = registry.acquire(sessionIdOf(agent))
    const content = `${exec.name}: ${result.isError ? 'failed' : 'ok'}`
    const vithi = being.cognize(content, 'mind')
    lastVithi.set(agent, vithi)
    registry.save(sessionIdOf(agent), being)
  })

  return {
    getLastVithi(agent: Agent): CognitionResult | undefined {
      return lastVithi.get(agent)
    },
  }
}
