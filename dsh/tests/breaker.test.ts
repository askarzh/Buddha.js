import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { CallId } from '@deepseek-ai/dsh-llm'
import type {
  ToolExecution,
  ToolExecutionResult,
  ToolExecutionToken,
  PostToolDecision,
  PreToolDecision,
  JsonValue,
} from '@deepseek-ai/dsh-tools'
import { BeingRegistry } from '../src/being-registry.js'
import { SaveScheduler } from '../src/persistence.js'
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
  let scheduler: SaveScheduler
  let ctx: Context
  let breakerConfig: Config['breaker']
  let callCounter: number

  beforeEach(() => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-breaker-'))
    registry = new BeingRegistry(stateDir)
    scheduler = new SaveScheduler(registry)
    ctx = new Context()
    breakerConfig = { enabled: true, threshold: 3, blockMultiplier: 1.5, mutatingTools: ['write', 'edit', 'str_replace_editor'] }
    applyBreaker(ctx, { registry, scheduler, config: breakerConfig })
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

  /**
   * All model-facing text a decision carries on the tool result itself —
   * the accept arm's replacement `content`, or the block arm's `feedback`.
   * This, not `additionalContexts`, is where the advisory tier now delivers
   * the cessation protocol (see the ADVISORY TIER comment in src/breaker.ts).
   */
  function resultText(decision: PostToolDecision): string {
    const blocks = decision.kind === 'block' ? decision.feedback : (decision.content ?? [])
    return blocks.map((block) => (block.type === 'text' ? block.text : '')).join('\n')
  }

  /** Whether the cessation protocol reached the model on the tool result. */
  function trippedOnResult(decision: PostToolDecision): boolean {
    return resultText(decision).includes('Poison Arrow circuit breaker')
  }

  async function dispatch(
    exec: ToolExecution,
    result: ToolExecutionResult,
    next: () => Promise<PostToolDecision> = accept()
  ): Promise<PostToolDecision> {
    return ctx.waterfall('tools/post-execute', exec, result, next)
  }

  /** Run the `tools/pre-execute` waterfall — the gate that refuses a call outright. */
  async function preDispatch(
    exec: ToolExecution,
    next: () => Promise<PreToolDecision> = async () => ({ kind: 'allow' }),
  ): Promise<PreToolDecision> {
    return ctx.waterfall('tools/pre-execute', exec, next)
  }

  /** Drive `count` failures of one tool with identical arguments, one per step. */
  async function pressureUp(agent: Agent, tool: string, count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      advanceStep(agent)
      await dispatch(fakeExec(agent, tool, { cmd: 'same' }), failure())
    }
  }

  it('(a) three failures on the same tool with different args trips on the third call, delivering all four stage names ON THE TOOL RESULT', async () => {
    const agent = fakeAgent()
    let last: PostToolDecision | undefined
    for (let i = 0; i < 3; i++) {
      advanceStep(agent)
      last = await dispatch(fakeExec(agent, 'bash', { cmd: `echo ${i}` }), failure())
    }

    expect(last!.kind).toBe('accept')
    const text = resultText(last!)
    expect(text).toContain('recognize')
    expect(text).toContain('investigate')
    expect(text).toContain('release')
    expect(text).toContain('practice')
    // ONE delivery, not two: at the advisory tier the protocol rides the
    // result's own content, so nothing is duplicated into the free-floating
    // `additionalContexts` channel a model reads as unattributed user text.
    expect(last!.additionalContexts ?? []).toHaveLength(0)
  })

  it('(a2) the advisory notice PRESERVES the original error content ahead of the protocol', async () => {
    const agent = fakeAgent()
    const errored: ToolExecutionResult = {
      isError: true,
      error: { message: 'ENOENT: no such file' },
      content: [{ type: 'text', text: 'ENOENT: no such file' }],
    }

    let last: PostToolDecision | undefined
    for (let i = 0; i < 3; i++) {
      advanceStep(agent)
      // A downstream listener that accepts without replacing content, so the
      // breaker falls back to the result's own blocks.
      last = await dispatch(fakeExec(agent, 'bash', { cmd: `echo ${i}` }), errored, async () => ({ kind: 'accept' }))
    }

    const blocks = (last as { kind: 'accept'; content?: { type: string; text?: string }[] }).content!
    expect(blocks[0]).toEqual({ type: 'text', text: 'ENOENT: no such file' })
    expect(blocks).toHaveLength(2)
    expect(trippedOnResult(last!)).toBe(true)
  })

  it('(b) identical args reach the threshold on the second failure', async () => {
    const agent = fakeAgent()

    advanceStep(agent)
    const first = await dispatch(fakeExec(agent, 'bash', { cmd: 'flaky' }), failure())
    expect(trippedOnResult(first)).toBe(false)

    advanceStep(agent)
    const second = await dispatch(fakeExec(agent, 'bash', { cmd: 'flaky' }), failure())
    expect(trippedOnResult(second)).toBe(true)
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
    expect(trippedOnResult(last)).toBe(false)
    expect(last.additionalContexts ?? []).toHaveLength(0)
  })

  it('(d) three failures within one step count once (no trigger)', async () => {
    const agent = fakeAgent()
    advanceStep(agent) // one shared step for all three "parallel" calls

    let last: PostToolDecision | undefined
    for (let i = 0; i < 3; i++) {
      last = await dispatch(fakeExec(agent, 'bash', { i }), failure())
    }

    expect(trippedOnResult(last!)).toBe(false)
    expect(last!.additionalContexts ?? []).toHaveLength(0)
  })

  it('(e) at threshold * blockMultiplier the decision is block with feedback, and NOTHING is duplicated into additionalContexts', async () => {
    const agent = fakeAgent()

    // Varied arguments: +1 per failure. Default 3 * 1.5 = 4.5, so failure 5
    // is the first to enforce; failures 3 and 4 are advisory.
    const decisions: PostToolDecision[] = []
    for (let i = 0; i < 5; i++) {
      advanceStep(agent)
      decisions.push(await dispatch(fakeExec(agent, 'bash', { i }), failure()))
    }

    expect(decisions[2]!.kind).toBe('accept')
    expect(decisions[3]!.kind).toBe('accept')

    const last = decisions[4]!
    expect(last.kind).toBe('block')
    expect((last as { kind: 'block'; feedback: unknown[] }).feedback.length).toBeGreaterThan(0)
    expect(trippedOnResult(last)).toBe(true)
    // One delivery: the block's `feedback` IS the tool result the model
    // reads, so no second free-floating copy is sent alongside it.
    expect(last.additionalContexts ?? []).toHaveLength(0)
  })

  it('(e2) identical retries reach enforcement one retry sooner at 1.5x than at 2x', async () => {
    // Identical arguments add +2, so pressure runs 1 -> 3 -> 5. At the
    // default 1.5x (4.5) the third call is blocked; at 2x (6) it is not.
    async function pressureRun(config: Config['breaker']): Promise<PostToolDecision[]> {
      const runCtx = new Context()
      const runRegistry = new BeingRegistry(stateDir)
      applyBreaker(runCtx, { registry: runRegistry, scheduler: new SaveScheduler(runRegistry), config })
      const agent = fakeAgent(`session-${config.blockMultiplier}`)
      const out: PostToolDecision[] = []
      for (let i = 0; i < 3; i++) {
        advanceStep(agent)
        out.push(
          await runCtx.waterfall('tools/post-execute', fakeExec(agent, 'bash', { cmd: 'same' }), failure(), accept()),
        )
      }
      return out
    }

    const atDefault = await pressureRun({ ...breakerConfig, blockMultiplier: 1.5 })
    expect(atDefault[1]!.kind).toBe('accept') // pressure 3: advisory
    expect(trippedOnResult(atDefault[1]!)).toBe(true)
    expect(atDefault[2]!.kind).toBe('block') // pressure 5 >= 4.5: enforced

    const atTwo = await pressureRun({ ...breakerConfig, blockMultiplier: 2 })
    expect(atTwo[2]!.kind).toBe('accept') // pressure 5 < 6: still advisory
    expect(trippedOnResult(atTwo[2]!)).toBe(true)
  })

  it('(t1) the ADVISORY tier says the call ran and failed, and never claims a refusal', async () => {
    const agent = fakeAgent()
    let last: PostToolDecision | undefined
    for (let i = 0; i < 3; i++) {
      advanceStep(agent)
      last = await dispatch(fakeExec(agent, 'bash', { i }), failure())
    }

    // The wording IS the deliverable: a live model read an advisory notice as
    // "refused/blocked before the read ran" when the call had in fact
    // executed, because both tiers arrive as tool-result content. Each tier
    // now names itself, so both clauses are pinned here.
    expect(last!.kind).toBe('accept')
    const text = resultText(last!)
    expect(text).toContain('ADVISORY, not a refusal')
    expect(text).toContain('this call RAN and FAILED')
    expect(text).not.toContain('BLOCKED, not advice')
    expect(text).not.toContain('cut this call off')
  })

  it('(t2) the BLOCK tier says the output is withheld, and never claims it is only advice', async () => {
    const agent = fakeAgent()
    let last: PostToolDecision | undefined
    for (let i = 0; i < 5; i++) {
      advanceStep(agent)
      last = await dispatch(fakeExec(agent, 'bash', { i }), failure())
    }

    expect(last!.kind).toBe('block')
    const text = resultText(last!)
    expect(text).toContain('BLOCKED, not advice')
    expect(text).toContain('cut this call off')
    expect(text).not.toContain('ADVISORY, not a refusal')
    expect(text).not.toContain('the harness is not blocking you yet')
    // Both tiers still walk the same four cessation stages.
    for (const stage of ['recognize', 'investigate', 'release', 'practice']) {
      expect(text).toContain(stage)
    }
  })

  it('(f) the downstream decision is preserved: its additionalContexts and its replaced content both survive', async () => {
    const agent = fakeAgent()
    const downstreamContext = { id: 'downstream-x', role: 'user', content: [], source: { kind: 'user' } }

    let last: PostToolDecision | undefined
    for (let i = 0; i < 3; i++) {
      advanceStep(agent)
      const next =
        i === 2
          ? async (): Promise<PostToolDecision> => ({
              kind: 'accept',
              content: [{ type: 'text', text: 'downstream replacement' }],
              additionalContexts: [downstreamContext as never],
            })
          : accept()
      last = await dispatch(fakeExec(agent, 'bash', { i }), failure(), next)
    }

    // Context another plugin attached is carried through untouched — and the
    // breaker adds nothing of its own to that channel any more.
    expect(last!.additionalContexts).toHaveLength(1)
    expect(last!.additionalContexts![0]).toBe(downstreamContext)
    // A downstream CONTENT replacement is what the model would have seen, so
    // it is what the protocol is appended to — not the raw result blocks.
    const blocks = (last as { kind: 'accept'; content?: { type: string; text?: string }[] }).content!
    expect(blocks[0]).toEqual({ type: 'text', text: 'downstream replacement' })
    expect(trippedOnResult(last!)).toBe(true)
  })

  it('(f2) a downstream BLOCK is preserved: the protocol is appended to its feedback, not converted to an accept', async () => {
    const agent = fakeAgent()

    let last: PostToolDecision | undefined
    for (let i = 0; i < 3; i++) {
      advanceStep(agent)
      const next =
        i === 2
          ? async (): Promise<PostToolDecision> => ({ kind: 'block', feedback: [{ type: 'text', text: 'downstream veto' }] })
          : accept()
      last = await dispatch(fakeExec(agent, 'bash', { i }), failure(), next)
    }

    expect(last!.kind).toBe('block')
    const feedback = (last as { kind: 'block'; feedback: { type: string; text?: string }[] }).feedback
    expect(feedback[0]).toEqual({ type: 'text', text: 'downstream veto' })
    expect(trippedOnResult(last!)).toBe(true)
    expect(last!.additionalContexts ?? []).toHaveLength(0)
  })

  it('(p1) a call whose streak is ALREADY past the boundary is denied before it runs', async () => {
    const agent = fakeAgent()
    // Identical retries: pressure 1 -> 3 -> 5, and 5 >= 3 * 1.5.
    await pressureUp(agent, 'bash', 3)

    const decision = await preDispatch(fakeExec(agent, 'bash', { cmd: 'same' }))

    expect(decision.kind).toBe('deny')
    const reason = (decision as { kind: 'deny'; reason: string }).reason
    // Every clause of the refusal has to be checkable by the model.
    expect(reason).toContain('"bash"')
    expect(reason).toContain('REFUSED before dispatch')
    expect(reason).toContain('this call did not run')
    expect(reason).toContain('Failure pressure 5')
    expect(reason).toContain('block boundary of 4.5')
    expect(reason).toContain('write, edit, str_replace_editor')
    // The deny reason is not the place for the cessation liturgy.
    expect(reason).not.toContain('recognize')
    expect(reason).not.toContain('Insight:')
  })

  it('(p2) below the boundary the call is allowed through untouched', async () => {
    const agent = fakeAgent()
    // Pressure 3: advisory tier, not enforcement.
    await pressureUp(agent, 'bash', 2)

    const decision = await preDispatch(fakeExec(agent, 'bash', { cmd: 'same' }))
    expect(decision.kind).toBe('allow')

    // And an untouched tool is never affected by another tool's streak.
    await pressureUp(agent, 'bash', 1)
    expect((await preDispatch(fakeExec(agent, 'bash', { cmd: 'same' }))).kind).toBe('deny')
    expect((await preDispatch(fakeExec(agent, 'read', { file: 'x' }))).kind).toBe('allow')
  })

  it('(p3) a foreign deny or ask is never overridden', async () => {
    const agent = fakeAgent()
    await pressureUp(agent, 'bash', 3)

    const foreignDeny = await preDispatch(fakeExec(agent, 'bash', { cmd: 'same' }), async () => ({
      kind: 'deny',
      reason: 'downstream policy',
    }))
    expect(foreignDeny).toEqual({ kind: 'deny', reason: 'downstream policy' })

    // An `ask` is an approval about to be offered to the operator; turning it
    // into a deny would cancel that choice.
    const foreignAsk = await preDispatch(fakeExec(agent, 'bash', { cmd: 'same' }), async () => ({
      kind: 'ask',
      reason: 'needs approval',
    }))
    expect(foreignAsk).toEqual({ kind: 'ask', reason: 'needs approval' })
  })

  it('(p4) the deny LIFTS after a successful mutating call — it is not a trap', async () => {
    const agent = fakeAgent()
    await pressureUp(agent, 'bash', 3)
    expect((await preDispatch(fakeExec(agent, 'bash', { cmd: 'same' }))).kind).toBe('deny')

    // Real progress: a successful `edit` (a configured mutating tool).
    advanceStep(agent)
    await dispatch(fakeExec(agent, 'edit', {}), success())

    expect((await preDispatch(fakeExec(agent, 'bash', { cmd: 'same' }))).kind).toBe('allow')
  })

  it('(p5) our own denial is not re-counted as a failure when it flows back through post-execute', async () => {
    const agent = fakeAgent()
    await pressureUp(agent, 'bash', 3)

    // dsh-tools materializes a deny as a failed result and still runs
    // post-execute over it; the breaker must leave that alone.
    const exec = fakeExec(agent, 'bash', { cmd: 'same' })
    const denial = await preDispatch(exec)
    expect(denial.kind).toBe('deny')

    advanceStep(agent)
    const downstream: PostToolDecision = { kind: 'accept', content: [{ type: 'text', text: 'Error: refused' }] }
    const after = await dispatch(exec, failure('refused'), async () => downstream)
    // Passed straight through: no protocol appended over the deny reason.
    expect(after).toBe(downstream)

    // And the pressure did not grow for a call that never ran: one more real
    // failure would have taken 5 -> 7 had the denial been counted.
    advanceStep(agent)
    const next = await dispatch(fakeExec(agent, 'bash', { cmd: 'same' }), failure())
    expect(resultText(next)).toContain('Failure pressure is 7')
  })

  it('(g) sub-dispatch calls (rootCallId !== callId) never count toward the streak', async () => {
    const agent = fakeAgent()

    for (let i = 0; i < 6; i++) {
      advanceStep(agent)
      const exec = fakeExec(agent, 'bash', { i }, { rootCallId: 'root-fixed-and-never-equal-to-callid' })
      const decision = await dispatch(exec, failure())
      expect(trippedOnResult(decision)).toBe(false)
      expect(decision.additionalContexts ?? []).toHaveLength(0)
    }
  })

  it('(h) enabled:false passes the downstream decision through untouched', async () => {
    const disabledCtx = new Context()
    const disabledRegistry = new BeingRegistry(stateDir)
    applyBreaker(disabledCtx, {
      registry: disabledRegistry,
      scheduler: new SaveScheduler(disabledRegistry),
      config: { ...breakerConfig, enabled: false },
    })

    const agent = fakeAgent()
    const downstream: PostToolDecision = { kind: 'accept', content: [] }
    const next = async (): Promise<PostToolDecision> => downstream

    const decision = await disabledCtx.waterfall('tools/post-execute', fakeExec(agent, 'bash', {}), failure(), next)

    expect(decision).toBe(downstream)
  })
})
