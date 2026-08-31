import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { CallId } from '@deepseek-ai/dsh-llm'
import type { ToolExecution, ToolExecutionResult, ToolExecutionToken } from '@deepseek-ai/dsh-tools'
import { BeingRegistry } from '../src/being-registry.js'
import { applyKarma } from '../src/karma.js'
import { stepRecords } from '../src/step-records.js'

/**
 * Karma from tool outcomes (`tools/result` emit + `agent/turn-stopping`
 * serial).
 *
 * Tests dispatch directly through a bare `Context` (`ctx.emit('tools/result',
 * exec, result)` / `ctx.serial('agent/turn-stopping', payload)`) with fake
 * `exec`/`agent` objects, same style as `breaker.test.ts`. Step/turn identity
 * comes from the shared `stepRecords` table (populated in production by
 * `applyVithi`'s `agent/pre-step` listener) — tests call `stepRecords.advance`
 * directly to simulate that.
 */
describe('karma from tool outcomes', () => {
  let stateDir: string
  let registry: BeingRegistry
  let ctx: Context
  let callCounter: number

  beforeEach(() => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-karma-'))
    registry = new BeingRegistry(stateDir)
    ctx = new Context()
    applyKarma(ctx, { registry })
    callCounter = 0
  })

  afterEach(() => {
    fs.rmSync(stateDir, { recursive: true, force: true })
  })

  function fakeAgent(id = 'session-a'): Agent {
    return { id, ctx: new Context() } as unknown as Agent
  }

  function fakeExec(agent: Agent, name: string, opts: { rootCallId?: string } = {}): ToolExecution {
    callCounter += 1
    const callId = `call-${callCounter}` as unknown as CallId
    return {
      callId,
      rootCallId: (opts.rootCallId ?? callId) as unknown as CallId,
      name,
      arguments: {},
      agent,
      token: {} as unknown as ToolExecutionToken,
      signal: new AbortController().signal,
    }
  }

  function failure(message = 'boom'): ToolExecutionResult {
    return { isError: true, error: { message }, content: [] }
  }

  function success(value: unknown = {}): ToolExecutionResult {
    return { isError: false, value, content: [] }
  }

  async function dispatchResult(exec: ToolExecution, result: ToolExecutionResult): Promise<void> {
    await ctx.emit('tools/result', exec, result)
  }

  async function stopTurn(agent: Agent, turn: number): Promise<void> {
    await ctx.serial('agent/turn-stopping', { agent, turn, signal: new AbortController().signal })
  }

  it('a failed tool result lowers feeling valence to unpleasant on the session being and persists', async () => {
    const agent = fakeAgent('session-fail')
    stepRecords.advance(agent, { phase: 'āvajjana', turn: 0, step: 0 })

    await dispatchResult(fakeExec(agent, 'bash'), failure())

    const being = registry.peek('session-fail')
    expect(being.aggregates.feeling.getCurrentTone()).toBe('unpleasant')

    // Persistence: a FRESH registry over the same stateDir must load the
    // same unpleasant experience from disk — `experienceHistory` is the
    // part of this reaction that Being's serializer actually round-trips
    // (the live `VedanaAggregate.currentTone` itself is derived, in-memory
    // state that a fresh Being reconstruction does not restore).
    const reloaded = new BeingRegistry(stateDir)
    const restored = reloaded.peek('session-fail').getExperienceHistory(1)[0]
    expect(restored?.feelingTone).toBe('unpleasant')
    expect(restored?.input.object).toBe('bash')
  })

  it('a successful tool result leaves feeling valence pleasant', async () => {
    const agent = fakeAgent('session-success')
    stepRecords.advance(agent, { phase: 'āvajjana', turn: 0, step: 0 })

    await dispatchResult(fakeExec(agent, 'bash'), success())

    expect(registry.peek('session-success').aggregates.feeling.getCurrentTone()).toBe('pleasant')
  })

  it('repeated failures of the same tool scale the unpleasant intensity upward with the streak', async () => {
    const agent = fakeAgent('session-streak')
    stepRecords.advance(agent, { phase: 'āvajjana', turn: 0, step: 0 })
    await dispatchResult(fakeExec(agent, 'bash'), failure())

    stepRecords.advance(agent, { phase: 'āvajjana', turn: 0, step: 1 })
    await dispatchResult(fakeExec(agent, 'bash'), failure())

    const state = registry.peek('session-streak').aggregates.feeling.getState()
    expect(state.currentTone).toBe('unpleasant')
    expect(state.intensity).toBeGreaterThan(4) // 4 + streak(2)
  })

  it('a clean turn (no failing tool results) plants a wholesome act on turn-stopping', async () => {
    const agent = fakeAgent('session-clean-turn')
    stepRecords.advance(agent, { phase: 'āvajjana', turn: 0, step: 0 })
    await dispatchResult(fakeExec(agent, 'bash'), success())

    await stopTurn(agent, 0)

    const wholesome = registry.peek('session-clean-turn').karmicStore.getSeeds({ quality: 'wholesome' })
    expect(wholesome.length).toBeGreaterThan(0)
    expect(wholesome.some((seed) => seed.description === 'completed turn')).toBe(true)
  })

  it('a turn with a failing tool result does NOT plant the wholesome "completed turn" act', async () => {
    const agent = fakeAgent('session-dirty-turn')
    stepRecords.advance(agent, { phase: 'āvajjana', turn: 0, step: 0 })
    await dispatchResult(fakeExec(agent, 'bash'), failure())

    await stopTurn(agent, 0)

    const wholesome = registry.peek('session-dirty-turn').karmicStore.getSeeds({ quality: 'wholesome' })
    expect(wholesome.some((seed) => seed.description === 'completed turn')).toBe(false)
  })

  it('a later CLEAN turn on the same agent plants the wholesome act even after an earlier dirty turn', async () => {
    const agent = fakeAgent('session-two-turns')

    stepRecords.advance(agent, { phase: 'āvajjana', turn: 0, step: 0 })
    await dispatchResult(fakeExec(agent, 'bash'), failure())
    await stopTurn(agent, 0)

    stepRecords.advance(agent, { phase: 'āvajjana', turn: 1, step: 0 })
    await dispatchResult(fakeExec(agent, 'bash'), success())
    await stopTurn(agent, 1)

    const wholesome = registry.peek('session-two-turns').karmicStore.getSeeds({ quality: 'wholesome' })
    expect(wholesome.some((seed) => seed.description === 'completed turn')).toBe(true)
  })

  it('sub-dispatch calls (rootCallId !== callId) are ignored', async () => {
    const agent = fakeAgent('session-subdispatch')
    stepRecords.advance(agent, { phase: 'āvajjana', turn: 0, step: 0 })

    await dispatchResult(fakeExec(agent, 'bash', { rootCallId: 'root-never-equal' }), failure())

    // No being was ever created/mutated for this session.
    const filePath = path.join(stateDir, 'beings', 'session-subdispatch.json')
    expect(fs.existsSync(filePath)).toBe(false)
  })
})
