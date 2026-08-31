import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import type { Intensity } from 'buddha-js'
import type { BeingRegistry } from './being-registry.js'
import { stepRecords } from './step-records.js'

/**
 * Per-agent karma bookkeeping: a consecutive-failure streak per tool (for
 * scaling the unpleasant intensity of repeated failures), and which turns
 * have seen at least one failing tool result (for `agent/turn-stopping`'s
 * "clean turn" check). Lives inside an agent-scoped `ctx.effect`, same
 * lifecycle discipline as `BreakerState` in `breaker.ts`.
 */
class KarmaState {
  private readonly failureStreaks = new Map<string, number>()
  private readonly erroredTurns = new Set<number>()

  /** Record one failed call of `tool`. Returns the resulting streak count. */
  recordFailure(tool: string, turn: number): number {
    this.erroredTurns.add(turn)
    const next = (this.failureStreaks.get(tool) ?? 0) + 1
    this.failureStreaks.set(tool, next)
    return next
  }

  /** A successful call resets that tool's streak. */
  recordSuccess(tool: string): void {
    this.failureStreaks.delete(tool)
  }

  /** Whether `turn` saw at least one failing tool result. */
  turnHadError(turn: number): boolean {
    return this.erroredTurns.has(turn)
  }

  /** Forget bookkeeping for a turn once it has closed. */
  forgetTurn(turn: number): void {
    this.erroredTurns.delete(turn)
  }
}

function sessionIdOf(agent: Agent): string {
  return agent.id
}

/**
 * Mount karma tracking: `tools/result` (emit, observe-only) turns every
 * tool outcome into a `Being.experience()`, scaling a failure's unpleasant
 * intensity by that tool's consecutive-failure streak; `agent/turn-stopping`
 * (serial) plants a wholesome `act()` when the closing turn saw no tool
 * failures.
 *
 * Deliberately shallow (metaphor-honest, per the design spec): this is
 * telemetry of the agent's conduct planted as karma, not a context-
 * management system.
 */
export function applyKarma(ctx: Context, deps: { registry: BeingRegistry }): void {
  const { registry } = deps
  const states = new WeakMap<Agent, KarmaState>()

  function stateFor(agent: Agent): KarmaState {
    let state = states.get(agent)
    if (!state) {
      state = new KarmaState()
      states.set(agent, state)
      // Agent-scoped effect: torn down (and the entry forgotten) when the
      // agent's own context unwinds — matches BreakerState's lifecycle.
      agent.ctx.effect(() => () => {
        states.delete(agent)
      })
    }
    return state
  }

  ctx.on('tools/result', (exec: Readonly<ToolExecution>, result: Readonly<ToolExecutionResult>) => {
    if (!exec.agent) return
    if (exec.rootCallId !== exec.callId) return // Code-Mode sub-dispatch: ignore, like the breaker

    const agent = exec.agent
    const state = stateFor(agent)
    const turn = stepRecords.current(agent)?.turn ?? 0

    const { being } = registry.acquire(sessionIdOf(agent))

    if (result.isError) {
      const streak = state.recordFailure(exec.name, turn)
      being.experience({
        senseBase: 'body',
        object: exec.name,
        intensity: Math.min(10, 4 + streak) as Intensity,
        valence: 'unpleasant',
      })
    } else {
      state.recordSuccess(exec.name)
      being.experience({
        senseBase: 'body',
        object: exec.name,
        intensity: 4,
        valence: 'pleasant',
      })
    }

    registry.save(sessionIdOf(agent), being)
  })

  ctx.on('agent/turn-stopping', ({ agent, turn }: { agent: Agent; turn: number }) => {
    const state = stateFor(agent)

    if (!state.turnHadError(turn)) {
      const { being } = registry.acquire(sessionIdOf(agent))
      being.act('completed turn', 6, 'non-delusion')
      registry.save(sessionIdOf(agent), being)
    }

    state.forgetTurn(turn)
  })
}
