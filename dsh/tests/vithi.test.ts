import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { Context } from '@deepseek-ai/cordis'
import type { Agent, PreStepDecision } from '@deepseek-ai/dsh-agent'
import type { CallId } from '@deepseek-ai/dsh-llm'
import type { ToolExecution, ToolExecutionResult, ToolExecutionToken, JsonValue } from '@deepseek-ai/dsh-tools'
import { BeingRegistry } from '../src/being-registry.js'
import { SaveScheduler } from '../src/persistence.js'
import { applyVithi, type VithiHandle } from '../src/vithi.js'

/**
 * Layer A citta-vīthi (`agent/pre-step` waterfall + `tools/result` emit).
 *
 * Tests dispatch directly through a bare `Context`, same style as
 * `breaker.test.ts`/`karma.test.ts`: `ctx.waterfall('agent/pre-step', ...)`
 * for the pre-step passthrough, `ctx.emit('tools/result', ...)` for the
 * per-step cognize call.
 */
describe('Layer A citta-vīthi', () => {
  let stateDir: string
  let registry: BeingRegistry
  let scheduler: SaveScheduler
  let ctx: Context
  let handle: VithiHandle
  let callCounter: number

  beforeEach(() => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-vithi-'))
    registry = new BeingRegistry(stateDir)
    scheduler = new SaveScheduler(registry)
    ctx = new Context()
    handle = applyVithi(ctx, { registry, scheduler })
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

  function success(value: JsonValue = {}): ToolExecutionResult {
    return { isError: false, value, content: [] }
  }

  function failure(message = 'boom'): ToolExecutionResult {
    return { isError: true, error: { message }, content: [] }
  }

  async function preStep(agent: Agent, turn: number, step: number, next: () => Promise<PreStepDecision>): Promise<PreStepDecision> {
    return ctx.waterfall(
      'agent/pre-step',
      { agent, messages: [], turn, step, signal: new AbortController().signal },
      next
    )
  }

  async function dispatchResult(exec: ToolExecution, result: ToolExecutionResult): Promise<void> {
    await ctx.emit('tools/result', exec, result)
  }

  it('the pre-step listener returns exactly the downstream decision object, unchanged', async () => {
    const agent = fakeAgent()
    const downstream: PreStepDecision = { kind: 'enter', messages: [] }
    const next = async (): Promise<PreStepDecision> => downstream

    const decision = await preStep(agent, 0, 0, next)

    expect(decision).toBe(downstream)
  })

  it('a rejected downstream decision is also passed through unchanged', async () => {
    const agent = fakeAgent()
    const downstream: PreStepDecision = { kind: 'reject' }
    const next = async (): Promise<PreStepDecision> => downstream

    const decision = await preStep(agent, 0, 0, next)

    expect(decision).toBe(downstream)
  })

  it('cognize is called once per step even with three tool results in that step', async () => {
    const agent = fakeAgent('session-dedupe')
    await preStep(agent, 0, 0, async () => ({ kind: 'enter', messages: [] }))

    await dispatchResult(fakeExec(agent, 'bash'), success())
    await dispatchResult(fakeExec(agent, 'grep'), success())
    await dispatchResult(fakeExec(agent, 'read'), failure())

    // All three tool results in step 0 collapse into ONE cognize() call: at
    // most 3 seeds planted per javana run (javanas 1, 2-6, 7), never 9.
    const seedsAfterStep0 = registry.peek('session-dedupe').karmicStore.getStatistics().totalSeeds
    expect(seedsAfterStep0).toBeLessThanOrEqual(3)

    // A later step's tool result DOES trigger a second cognize() call, so
    // the seed count grows again.
    await preStep(agent, 0, 1, async () => ({ kind: 'enter', messages: [] }))
    await dispatchResult(fakeExec(agent, 'bash'), success())

    const seedsAfterStep1 = registry.peek('session-dedupe').karmicStore.getStatistics().totalSeeds
    expect(seedsAfterStep1).toBeGreaterThan(seedsAfterStep0)
  })

  it('getLastVithi returns 13 moments (mind-door) with the seeds planted', async () => {
    const agent = fakeAgent('session-lastvithi')
    await preStep(agent, 0, 0, async () => ({ kind: 'enter', messages: [] }))

    await dispatchResult(fakeExec(agent, 'bash'), success())

    const vithi = handle.getLastVithi(agent)
    expect(vithi).toBeDefined()
    expect(vithi!.moments).toHaveLength(13) // mind-door (processMentalObject) vīthi
    expect(Array.isArray(vithi!.seedsPlanted)).toBe(true)
  })

  it('getLastVithi is undefined before any step has cognized for an agent', () => {
    const agent = fakeAgent('session-never-cognized')
    expect(handle.getLastVithi(agent)).toBeUndefined()
  })

  it('sub-dispatch tool results (rootCallId !== callId) never trigger a cognize call', async () => {
    const agent = fakeAgent('session-subdispatch')
    await preStep(agent, 0, 0, async () => ({ kind: 'enter', messages: [] }))

    await dispatchResult(fakeExec(agent, 'bash', { rootCallId: 'root-never-equal' }), success())

    expect(handle.getLastVithi(agent)).toBeUndefined()
  })
})
