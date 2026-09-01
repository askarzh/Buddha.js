import { createHash, randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ToolExecution, ToolExecutionResult, PostToolDecision } from '@deepseek-ai/dsh-tools'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { PoisonArrow, type Being, type Intensity } from 'buddha-js'
import type { BeingRegistry } from './being-registry.js'
import type { SaveScheduler } from './persistence.js'
import type { Config } from './config.js'
import { pluginUserMessage } from './messages.js'
import { stepRecords } from './step-records.js'

/**
 * Element type of `PostToolDecision`'s `additionalContexts` array, derived
 * from `PostToolDecision` itself rather than importing dsh-llm's
 * `UserMessage` type directly (dsh-tools does not re-export it, and
 * dsh-session — where it actually lives — is not a declared dependency here).
 */
type AdditionalContext = NonNullable<Extract<PostToolDecision, { kind: 'block' }>['additionalContexts']>[number]

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

/**
 * Stable JSON stringify + sha1, so identical arguments always hash identically.
 *
 * `stableStringify` recurses without a cycle guard. Arguments arrive as parsed
 * JSON and so cannot contain cycles, but this hash runs inside the
 * `tools/post-execute` waterfall: if another plugin ever hands over a mutated,
 * self-referencing object, a RangeError here would take down tool dispatch for
 * a bookkeeping detail. Fall back to a hash that never groups two calls
 * together rather than throwing.
 */
function hashArguments(args: unknown): string {
  try {
    return createHash('sha1').update(stableStringify(args)).digest('hex')
  } catch {
    return `unhashable-${randomUUID()}`
  }
}

/**
 * The current step id for `agent`, sourced from the real `agent/pre-step`
 * step records (`applyVithi` in vithi.ts populates them). Calls that arrive
 * without an intervening `agent/pre-step` (e.g. several tool calls
 * dispatched in parallel within one step) legitimately share a `stepId`,
 * which is exactly the grouping `BreakerState.recordFailure` needs.
 */
export function currentStepId(agent: Agent): string {
  return stepRecords.currentStepId(agent)
}

function sessionIdOf(agent: Agent): string {
  return agent.id
}

/**
 * Render the four-step Poison Arrow cessation protocol (recognize →
 * investigate → release → practice) as plain text for injection into what
 * the model sees.
 */
function renderPoisonArrow(
  exec: ToolExecution,
  result: ToolExecutionResult,
  streak: number,
  threshold: number,
  being: Being,
): string {
  const failureMessage = result.isError ? result.error.message : 'unknown failure'
  const suffering = `repeatedly calling "${exec.name}" and hitting the same failure (pressure ${streak}): ${failureMessage}`
  const arrow = new PoisonArrow(suffering)

  const lines = [
    `Poison Arrow circuit breaker: "${exec.name}" is failing repeatedly for this ${being.realm} being. Failure pressure is ${streak}, past the threshold of ${threshold} (a retry with identical arguments adds 2, a varied one adds 1, and all failures within one step add 1 between them — so this is a weight, not a count of calls). Before retrying again, walk through cessation:`,
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
 * Wrap the rendered protocol as one plugin-sourced context message.
 *
 * `pluginUserMessage()` brands its `id` locally (see messages.ts) rather than
 * importing dsh-llm's real `MessageId` brand, to avoid taking a runtime
 * dependency on dsh-llm just for a value we already construct by hand. The
 * two brands are nominally distinct but structurally identical strings, so
 * this is the narrowest cast that bridges them for the type dsh's
 * `additionalContexts` actually expects.
 *
 * One caller remains: the fallback for a downstream `accept` that replaces
 * the result VALUE, where dsh-tools forbids carrying `content` as well and
 * the tool result therefore cannot hold the protocol at all. Every other
 * delivery — advisory and block alike — rides the tool result itself.
 */
function noticeFor(protocol: string): AdditionalContext {
  return pluginUserMessage(protocol) as unknown as AdditionalContext
}

/**
 * Mount the Poison Arrow circuit breaker on `tools/post-execute`.
 *
 * A waterfall listener: it ALWAYS delegates to `next()` first and returns
 * the downstream decision, augmented — never a fabricated fresh decision,
 * which would silently disable other plugins on the same waterfall.
 */
export function applyBreaker(ctx: Context, deps: { registry: BeingRegistry; scheduler: SaveScheduler; config: Config['breaker'] }): void {
  const { registry, scheduler, config } = deps
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
    // Marked, not written: karma and vīthi mutate the SAME being object on
    // this same tool result. The turn's single write happens at
    // `agent/turn-stopping` (karma.ts) or at session end (index.ts).
    scheduler.mark(sessionIdOf(agent), being)

    const protocol = renderPoisonArrow(exec, result, streak, config.threshold, being)

    // ENFORCEMENT TIER (streak >= threshold * blockMultiplier).
    //
    // This arm is the one that actually stops a looping agent, and we know
    // that by measurement rather than by hope: live DeepSeek runs obeyed the
    // block — describing the harness as having "issued a hard guard" — and
    // declined the advisory notice below in every framing we tried. So the
    // boundary is deliberately early (1.5x by default: two retries, not
    // three) and configurable, since which model needs which is not
    // something this plugin can know.
    //
    // `feedback` ONLY: the block's content IS the tool result the model
    // reads, so a second copy in `additionalContexts` would re-introduce
    // exactly the free-floating user-role message the advisory tier stopped
    // sending. One delivery, one provenance.
    if (streak >= config.threshold * config.blockMultiplier && decision.kind === 'accept') {
      const feedback: ContentBlock[] = [{ type: 'text', text: protocol }]
      const blocked: PostToolDecision = {
        kind: 'block',
        feedback,
        ...(decision.additionalContexts === undefined ? {} : { additionalContexts: decision.additionalContexts }),
      }
      return blocked
    }

    // ADVISORY TIER (threshold <= streak < threshold * blockMultiplier).
    //
    // INFORMATIONAL, and honestly so. Three live DeepSeek runs read this
    // notice and declined it — as a standalone `user/message` under both
    // loops, and again once it was concatenated into the tool result itself,
    // which the model correctly described and still rejected: the true
    // signal is the error, our text starts after it, and (twice) our
    // Buddhist vocabulary "mimics this repo's domain language ... to appear
    // organic — a classic social-engineering-injection trait". A direct user
    // instruction outranks it. What produced compliance was the block arm
    // above. This tier tells the model what the harness has noticed; it does
    // not discipline it, and the README says so in as many words.
    //
    // The protocol is delivered as part of the failing call's OWN result
    // content, via the accept arm's `content` replacement — the same channel
    // the block arm above already uses through `feedback`, and the reason
    // that arm is obeyed. It is NOT sent as `additionalContexts`.
    //
    // Why (measured, not assumed): `additionalContexts` is delivered by BOTH
    // loops — the stock `agent-loop` splices it into its next-step inbox and
    // appends it as a standalone `user/message`; this plugin's Layer B loop
    // attaches it to the tool result (src/loop.ts) — but as a free-floating
    // user-role message it reads to a model as text of unknown provenance in
    // the user's voice. Live DeepSeek runs at this tier, under EITHER loop,
    // said so and refused it: "prompting-injection-style material
    // masquerading as a system/cessation signal", "injected into my context
    // between tool invocations ... treated as untrusted injected content".
    // The same model at the block tier, where the protocol arrives as the
    // tool's own result, followed it. Provenance, not wording, is what the
    // model was reasoning about, so the advisory tier now uses the same
    // provenance.
    //
    // The original blocks are preserved ahead of it: the model still needs to
    // read the actual error it is retrying into. `decision.content` wins over
    // `result.content` when a downstream listener replaced it — that
    // replacement is what the model would otherwise have seen, and the
    // waterfall's earlier decision is not ours to discard.
    const protocolBlock: ContentBlock = { type: 'text', text: protocol }

    if (decision.kind === 'block') {
      // A downstream listener already blocked this call. Its `feedback` IS
      // the model-facing result content, so the protocol rides there —
      // preserving the block, which is a stronger verdict than ours.
      return { ...decision, feedback: [...decision.feedback, protocolBlock] }
    }

    if (Object.hasOwn(decision, 'value')) {
      // A downstream `accept` that replaces the result VALUE: dsh-tools
      // throws if one decision carries both `value` and `content`
      // (`postExecute()`), so the content channel is unavailable and the
      // notice would otherwise vanish. Fall back to `additionalContexts` —
      // the only remaining delivery — rather than dropping the protocol or
      // overriding another plugin's decision. (Unreachable today: this arm
      // only runs on `result.isError`, and dsh-tools separately rejects
      // replacing the value of a failed result. Kept as an honest fallback,
      // not dead-code theatre: the union permits it, so the code answers it.)
      return { ...decision, additionalContexts: [...(decision.additionalContexts ?? []), noticeFor(protocol)] }
    }

    const base = decision.content ?? result.content
    // Rebuilt field by field rather than spread: `PostToolDecision`'s two
    // accept arms make `content` and `value` mutually exclusive, and the
    // value arm is already returned above, but `Object.hasOwn` does not
    // narrow the union for the compiler.
    const augmented: PostToolDecision = {
      kind: 'accept',
      content: [...base, protocolBlock],
      ...(decision.additionalContexts === undefined ? {} : { additionalContexts: decision.additionalContexts }),
    }
    return augmented
  })
}
