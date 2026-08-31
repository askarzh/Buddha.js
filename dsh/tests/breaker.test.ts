import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { CallId } from '@deepseek-ai/dsh-llm'
import type { ToolExecution, ToolExecutionResult, ToolExecutionToken, PostToolDecision, JsonValue } from '@deepseek-ai/dsh-tools'
import { BeingRegistry } from '../src/being-registry.js'
import { applyBreaker } from '../src/breaker.js'
import { stepRecords } from '../src/step-records.js'
import type { Config } from '../src/config.js'

/**
 * Poison Arrow circuit breaker (`tools/post-execute` waterfall).
 *
 * Tests call the listener via a bare `Context` (`ctx.on` registers it,
 * `ctx.waterfall('tools/post-execute', exec, result, next)` invokes it) with
 * fake `exec`/`agent` objects typed against `ToolExecution`/`Agent` — no real
 * `ToolRuntime` or agent loop is needed since the breaker only reaches for
 * `exec.agent.ctx.effect`, `exec.agent.id`, and the fields on `exec`/`result`
 * itself.
 *
 * `currentStepId` reads from `../src/step-records.js`'s shared `stepRecords`
 * table, the same one the real `agent/pre-step` listener (`applyVithi` in
 * `src/vithi.ts`) populates. Tests simulate step boundaries explicitly via
 * the local `advanceStep()` helper below, which records a new step for the
 * agent: calling it between calls puts them in different steps (sequential
 * retries); NOT calling it between calls puts them in the same step
 * (parallel calls within one step).
 */
describe('Poison Arrow circuit breaker', () => {
  let stateDir: string
  let registry: BeingRegistry
  let ctx: Context
  let breakerConfig: Config['breaker']
  let callCounter: number

  beforeEach(() => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-breaker-'))
    registry = new BeingRegistry(stateDir)
    ctx = new Context()
    breakerConfig = { enabled: true, threshold: 3, mutatingTools: ['write', 'edit', 'str_replace_editor'] }
    applyBreaker(ctx, { registry, config: breakerConfig })
    callCounter = 0
  })

  afterEach(() => {
    fs.rmSync(stateDir, { recursive: true, force: true })
  })

  function fakeAgent(id = 'session-a'): Agent {
    // Only `.id` and `.ctx` are ever read by the breaker; a real Cordis
    // Context is used for `.ctx` so `ctx.effect()` behaves like production.
    return { id, ctx: new Context() } as unknown as Agent
  }

  const stepCounters = new WeakMap<Agent, number>()

  /** Record a new step for `agent` in the shared `stepRecords` table. */
  function advanceStep(agent: Agent): void {
    const next = (stepCounters.get(agent) ?? 0) + 1
    stepCounters.set(agent, next)
    stepRecords.advance(agent, { phase: 'āvajjana', turn: 0, step: next })
  }

  function fakeExec(agent: Agent, name: string, args: unknown = {}, opts: { rootCallId?: string } = {}): ToolExecution {
    callCounter += 1
    const callId = `call-${callCounter}` as unknown as CallId
    return {
      callId,
      rootCallId: (opts.rootCallId ?? callId) as unknown as CallId,
      name,
      arguments: args,
      agent,
      token: {} as unknown as ToolExecutionToken,
      signal: new AbortController().signal,
    }
  }

  function failure(message = 'boom'): ToolExecutionResult {
    return { isError: true, error: { message }, content: [] }
  }

  function success(value: JsonValue = {}): ToolExecutionResult {
    return { isError: false, value, content: [] }
  }

  function accept(): () => Promise<PostToolDecision> {
    return async () => ({ kind: 'accept', content: [] })
  }

  async function dispatch(
    exec: ToolExecution,
    result: ToolExecutionResult,
    next: () => Promise<PostToolDecision> = accept()
  ): Promise<PostToolDecision> {
    return ctx.waterfall('tools/post-execute', exec, result, next)
  }

  it('(a) three failures on the same tool with different args trips on the third call, with one plugin-sourced notice containing all four stage names', async () => {
    const agent = fakeAgent()
    let last: PostToolDecision | undefined
    for (let i = 0; i < 3; i++) {
      advanceStep(agent)
      last = await dispatch(fakeExec(agent, 'bash', { cmd: `echo ${i}` }), failure())
    }

    expect(last!.additionalContexts).toHaveLength(1)
    const notice = last!.additionalContexts![0]
    expect(notice.source).toEqual({ kind: 'plugin', plugin: 'dsh-plugin-buddha' })
    const text = (notice.content[0] as { text: string }).text
    expect(text).toContain('recognize')
    expect(text).toContain('investigate')
    expect(text).toContain('release')
    expect(text).toContain('practice')
  })

  it('(b) identical args reach the threshold on the second failure', async () => {
    const agent = fakeAgent()

    advanceStep(agent)
    const first = await dispatch(fakeExec(agent, 'bash', { cmd: 'flaky' }), failure())
    expect(first.additionalContexts ?? []).toHaveLength(0)

    advanceStep(agent)
    const second = await dispatch(fakeExec(agent, 'bash', { cmd: 'flaky' }), failure())
    expect(second.additionalContexts).toHaveLength(1)
  })

  it('(c) a successful mutating call between failures resets the streak', async () => {
    const agent = fakeAgent()

    advanceStep(agent)
    await dispatch(fakeExec(agent, 'bash', { n: 1 }), failure())
    advanceStep(agent)
    await dispatch(fakeExec(agent, 'edit', {}), success())
    advanceStep(agent)
    await dispatch(fakeExec(agent, 'bash', { n: 2 }), failure())
    advanceStep(agent)
    const last = await dispatch(fakeExec(agent, 'bash', { n: 3 }), failure())

    // Post-reset streak is only 2 (below the threshold of 3): no trip.
    expect(last.additionalContexts ?? []).toHaveLength(0)
  })

  it('(d) three failures within one step count once (no trigger)', async () => {
    const agent = fakeAgent()
    advanceStep(agent) // one shared step for all three "parallel" calls

    let last: PostToolDecision | undefined
    for (let i = 0; i < 3; i++) {
      last = await dispatch(fakeExec(agent, 'bash', { i }), failure())
    }

    expect(last!.additionalContexts ?? []).toHaveLength(0)
  })

  it('(e) at 2x threshold the decision is block with feedback', async () => {
    const agent = fakeAgent()

    let last: PostToolDecision | undefined
    for (let i = 0; i < 6; i++) {
      advanceStep(agent)
      last = await dispatch(fakeExec(agent, 'bash', { i }), failure())
    }

    expect(last!.kind).toBe('block')
    expect((last as { kind: 'block'; feedback: unknown[] }).feedback.length).toBeGreaterThan(0)
  })

  it('(f) the downstream decision is preserved: additionalContexts:[X] yields [X, notice], never [notice]', async () => {
    const agent = fakeAgent()
    const downstreamContext = { id: 'downstream-x', role: 'user', content: [], source: { kind: 'user' } }

    let last: PostToolDecision | undefined
    for (let i = 0; i < 3; i++) {
      advanceStep(agent)
      const next =
        i === 2
          ? async (): Promise<PostToolDecision> => ({ kind: 'accept', additionalContexts: [downstreamContext as never] })
          : accept()
      last = await dispatch(fakeExec(agent, 'bash', { i }), failure(), next)
    }

    expect(last!.additionalContexts).toHaveLength(2)
    expect(last!.additionalContexts![0]).toBe(downstreamContext)
  })

  it('(g) sub-dispatch calls (rootCallId !== callId) never count toward the streak', async () => {
    const agent = fakeAgent()

    for (let i = 0; i < 6; i++) {
      advanceStep(agent)
      const exec = fakeExec(agent, 'bash', { i }, { rootCallId: 'root-fixed-and-never-equal-to-callid' })
      const decision = await dispatch(exec, failure())
      expect(decision.additionalContexts ?? []).toHaveLength(0)
    }
  })

  it('(h) enabled:false passes the downstream decision through untouched', async () => {
    const disabledCtx = new Context()
    const disabledRegistry = new BeingRegistry(stateDir)
    applyBreaker(disabledCtx, { registry: disabledRegistry, config: { ...breakerConfig, enabled: false } })

    const agent = fakeAgent()
    const downstream: PostToolDecision = { kind: 'accept', content: [] }
    const next = async (): Promise<PostToolDecision> => downstream

    const decision = await disabledCtx.waterfall('tools/post-execute', fakeExec(agent, 'bash', {}), failure(), next)

    expect(decision).toBe(downstream)
  })
})
