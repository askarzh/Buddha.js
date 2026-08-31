import { createHash } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ContentBlock, ToolExecution, ToolExecutionResult, PostToolDecision } from '@deepseek-ai/dsh-tools'
import { PoisonArrow, type Being, type Intensity } from 'buddha-js'
import type { BeingRegistry } from './being-registry.js'
import type { Config } from './config.js'
import { pluginUserMessage } from './messages.js'

/** One tool, scoped to one agent — the unit the breaker tracks a streak for. */
export interface StreakKey {
  agentId: string
  tool: string
}

interface ToolStreak {
  count: number
  lastStepId: string
  lastArgsHash: string
}

/**
 * Poison Arrow circuit breaker: per-agent failure-streak bookkeeping for
 * `tools/post-execute`.
 *
 * One `BreakerState` exists per agent — created inside an agent-scoped
 * `ctx.effect` (see `stateFor` in `applyBreaker`) so it is disposed
 * automatically when the agent is, rather than leaking in a module-level
 * map keyed by an object that may be garbage-collected but whose entry
 * would otherwise never be swept.
 */
export class BreakerState {
  private readonly streaks = new Map<string, ToolStreak>()

  /**
   * Record one failed call of `tool`.
   *
   * - A call sharing `stepId` with the streak's most recently recorded
   *   failure counts once, no matter how many such calls arrive (N tool
   *   calls dispatched in parallel within a single step are one panic
   *   signal, not N).
   * - Otherwise, a call whose `argsHash` matches the most recently recorded
   *   failure's counts +2 — retrying the exact same broken call is a
   *   stronger signal than varying the arguments.
   * - Any other call counts +1.
   *
   * Returns the resulting streak count for `tool`.
   */
  recordFailure(tool: string, argsHash: string, stepId: string): number {
    const existing = this.streaks.get(tool)
    if (!existing) {
      this.streaks.set(tool, { count: 1, lastStepId: stepId, lastArgsHash: argsHash })
      return 1
    }
    if (existing.lastStepId === stepId) {
      // Same step already contributed to this streak: no further increment.
      return existing.count
    }
    existing.count += existing.lastArgsHash === argsHash ? 2 : 1
    existing.lastStepId = stepId
    existing.lastArgsHash = argsHash
    return existing.count
  }

  /** A successful call resets that tool's streak — the loop broke. */
  recordSuccess(tool: string): void {
    this.streaks.delete(tool)
  }

  /** A mutating call (e.g. an edit) is intervening progress: reset every streak. */
  recordMutatingCall(): void {
    this.streaks.clear()
  }

  streak(tool: string): number {
    return this.streaks.get(tool)?.count ?? 0
  }
}

/**
 * Recursively sort object keys so structurally-identical arguments hash
 * identically regardless of property insertion order.
 */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record).sort()
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** Stable JSON stringify + sha1, so identical arguments always hash identically. */
function hashArguments(args: unknown): string {
  return createHash('sha1').update(stableStringify(args)).digest('hex')
}

/**
 * TODO(Task 4): replace this per-agent monotonic counter with the real step
 * id sourced from `agent/pre-step`. Until that event is wired up, `stepId`
 * only advances when something explicitly calls `advanceStep()` (which
 * Task 4 will do from an `agent/pre-step` listener) — so calls that arrive
 * without an intervening `advanceStep()` (e.g. several tool calls
 * dispatched in parallel within one step) legitimately share a `stepId`,
 * which is exactly the grouping `BreakerState.recordFailure` needs.
 */
const stepCounters = new WeakMap<Agent, { current: number }>()

function stepCounterFor(agent: Agent): { current: number } {
  let counter = stepCounters.get(agent)
  if (!counter) {
    counter = { current: 0 }
    stepCounters.set(agent, counter)
  }
  return counter
}

/** The current step id for `agent` — see the TODO above `stepCounters`. */
export function currentStepId(agent: Agent): string {
  return String(stepCounterFor(agent).current)
}

/** Advance `agent`'s step counter. Task 4 calls this from `agent/pre-step`. */
export function advanceStep(agent: Agent): void {
  stepCounterFor(agent).current += 1
}

function sessionIdOf(agent: Agent): string {
  return agent.id
}

/**
 * Render the four-step Poison Arrow cessation protocol (recognize →
 * investigate → release → practice) as plain text for injection into what
 * the model sees.
 */
function renderPoisonArrow(exec: ToolExecution, result: ToolExecutionResult, streak: number, being: Being): string {
  const failureMessage = result.isError ? result.error.message : 'unknown failure'
  const suffering = `repeatedly calling "${exec.name}" and hitting the same failure (${streak} times in a row): ${failureMessage}`
  const arrow = new PoisonArrow(suffering)

  const lines = [
    `Poison Arrow circuit breaker: "${exec.name}" has failed ${streak} times in a row for this ${being.realm} being. Before retrying again, walk through cessation:`,
    '',
  ]
  for (let i = 0; i < 4; i++) {
    const step = arrow.step()
    lines.push(`[${step.stage}] (${step.truth})`)
    lines.push(`  Insight: ${step.insight}`)
    lines.push(`  Guidance: ${step.guidance}`)
    lines.push('')
  }
  return lines.join('\n').trim()
}

/**
 * Mount the Poison Arrow circuit breaker on `tools/post-execute`.
 *
 * A waterfall listener: it ALWAYS delegates to `next()` first and returns
 * the downstream decision, augmented — never a fabricated fresh decision,
 * which would silently disable other plugins on the same waterfall.
 */
export function applyBreaker(ctx: Context, deps: { registry: BeingRegistry; config: Config['breaker'] }): void {
  const { registry, config } = deps
  const states = new WeakMap<Agent, BreakerState>()

  function stateFor(agent: Agent): BreakerState {
    let state = states.get(agent)
    if (!state) {
      state = new BreakerState()
      states.set(agent, state)
      // Agent-scoped effect: torn down (and the entry forgotten) when the
      // agent's own context unwinds, per BreakerState's "disposed with the
      // agent" contract.
      agent.ctx.effect(() => () => {
        states.delete(agent)
      })
    }
    return state
  }

  ctx.on('tools/post-execute', async function (exec, result, next) {
    const decision = await next() // ALWAYS delegate first

    if (!config.enabled || !exec.agent) return decision
    if (exec.rootCallId !== exec.callId) return decision // Code-Mode sub-dispatch: ignore

    const agent = exec.agent
    const state = stateFor(agent)

    if (config.mutatingTools.includes(exec.name) && !result.isError) {
      state.recordMutatingCall()
    }
    if (!result.isError) {
      state.recordSuccess(exec.name)
      return decision
    }

    const streak = state.recordFailure(exec.name, hashArguments(exec.arguments), currentStepId(agent))
    if (streak < config.threshold) return decision

    const { being } = registry.acquire(sessionIdOf(agent))
    being.act(`blind retry of ${exec.name}`, Math.min(10, 3 + streak) as Intensity, 'aversion')
    registry.save(sessionIdOf(agent), being)

    const protocol = renderPoisonArrow(exec, result, streak, being)
    const notice = pluginUserMessage(protocol)

    if (streak >= 2 * config.threshold && decision.kind === 'accept') {
      const feedback: ContentBlock[] = [{ type: 'text', text: protocol }]
      return {
        kind: 'block',
        feedback,
        additionalContexts: [...(decision.additionalContexts ?? []), notice],
      }
    }
    return { ...decision, additionalContexts: [...(decision.additionalContexts ?? []), notice] }
  })
}
