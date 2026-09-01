import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ResolvedSubagentStartRequest, SubagentProvider, SubagentRun, SubagentStartRequest } from '@deepseek-ai/dsh-subagent'
import { BeingRegistry } from '../src/being-registry.js'
import { applyRealms, REALM_PERSONAS, resetPersonaWarning } from '../src/realms.js'

/**
 * Six-realm subagent personas (`realms.ts`).
 *
 * `applyRealms` registers a `buddha-realms` provider on `ctx.subagents`
 * behind `ctx.inject(['subagents'], ...)`, matching `applyCommands`'s
 * "never touch an uninjected service" discipline. `ctx.subagents` is faked
 * here (only `.registerProvider` and `.start` are ever read) and provided
 * via `ctx.provide('subagents', ...)`, same style as `commands.test.ts`'s
 * `ctx.provide('commands', ...)`.
 *
 * Delegation is exercised by calling the captured provider's `start(request)`
 * directly (no real `SubagentRuntime`/child agent needed) and inspecting
 * what the fake `ctx.subagents.start` was called with.
 */
describe('six-realm subagent personas', () => {
  let stateDir: string
  let registry: BeingRegistry
  let ctx: Context
  let captured: SubagentProvider | undefined
  let spawnCalls: Array<{ name: string; request: SubagentStartRequest }>
  let spawnResult: { output: []; stopReason: string; diagnostic?: string }
  let childRunId: string
  // Gate in front of the fake run's result, so a test can hold a run open and
  // observe the child being's on-disk file BEFORE `discard()` removes it.
  let spawnGate: Promise<void>

  beforeEach(async () => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-realms-'))
    registry = new BeingRegistry(stateDir)
    ctx = new Context()
    captured = undefined
    spawnCalls = []
    spawnResult = { output: [], stopReason: 'completed' }
    childRunId = 'child-session-1'
    spawnGate = Promise.resolve()

    const fakeSubagents = {
      registerProvider(provider: SubagentProvider) {
        captured = provider
        return () => {
          captured = undefined
        }
      },
      async start(name: string, request: SubagentStartRequest): Promise<SubagentRun> {
        spawnCalls.push({ name, request })
        const run: SubagentRun = {
          id: childRunId as never,
          localAgent: undefined,
          result: spawnGate.then(() => spawnResult) as never,
          async dispose() {},
        }
        return run
      },
    }
    ctx.provide('subagents', fakeSubagents as never)
    await applyRealms(ctx, { registry })
    resetPersonaWarning()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    fs.rmSync(stateDir, { recursive: true, force: true })
  })

  // The warning goes to stderr, not through ctx.logger: dsh 0.1.1-rc.2
  // registers no logger exporter, so a logged warn reaches no stream at all.
  function captureStderr(): string[] {
    const written: string[] = []
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      written.push(String(chunk))
      return true
    })
    return written
  }

  function fakeAgent(id = 'parent-session'): Agent {
    return { id, ctx: new Context() } as unknown as Agent
  }

  function fakeRequest(persona: string | undefined, parent: Agent): ResolvedSubagentStartRequest {
    return {
      prompt: [{ type: 'text', text: 'do the thing' }] as never,
      parent,
      signal: new AbortController().signal,
      persona,
      descriptor: {} as never,
    } as unknown as ResolvedSubagentStartRequest
  }

  it('registers a buddha-realms provider with persona/toolFilter capabilities and no context inheritance', () => {
    expect(captured).toBeDefined()
    expect(captured!.name).toBe('buddha-realms')
    expect(captured!.capabilities).toEqual({ outputSchema: false, depthLimit: true, toolFilter: true, persona: true })
    expect(captured!.inheritsParentContext).toBe(false)
  })

  it('exposes deva/asura/human persona text and tool filters', () => {
    expect(REALM_PERSONAS.deva.toolFilter('read')).toBe(true)
    expect(REALM_PERSONAS.deva.toolFilter('bash')).toBe(false)
    expect(REALM_PERSONAS.deva.toolFilter('write')).toBe(false)

    expect(REALM_PERSONAS.asura.toolFilter('read')).toBe(true)
    expect(REALM_PERSONAS.asura.toolFilter('bash')).toBe(true)
    expect(REALM_PERSONAS.asura.toolFilter('write')).toBe(false)

    expect(REALM_PERSONAS.human.toolFilter('write')).toBe(true)
    expect(REALM_PERSONAS.human.toolFilter('anything')).toBe(true)

    for (const realm of ['deva', 'asura', 'human'] as const) {
      expect(REALM_PERSONAS[realm].text.length).toBeGreaterThan(0)
    }
  })

  it('delegates an asura persona to the spawn provider with the asura prompt text and a write-rejecting toolFilter', async () => {
    const request = fakeRequest('asura', fakeAgent())
    await captured!.start(request)

    expect(spawnCalls).toHaveLength(1)
    expect(spawnCalls[0].name).toBe('spawn')
    expect(spawnCalls[0].request.persona).toBe(REALM_PERSONAS.asura.text)
    expect(spawnCalls[0].request.toolFilter?.allow).toBeDefined()
    expect(spawnCalls[0].request.toolFilter?.allow).not.toContain('write')
    expect(spawnCalls[0].request.toolFilter?.allow).toContain('bash')
  })

  it('maps an unknown persona to human with all tools and the human prompt text', async () => {
    const request = fakeRequest('nonexistent-realm', fakeAgent())
    await captured!.start(request)

    expect(spawnCalls).toHaveLength(1)
    expect(spawnCalls[0].request.persona).toBe(REALM_PERSONAS.human.text)
    // human: no restriction added (all tools remain visible)
    expect(spawnCalls[0].request.toolFilter).toBeUndefined()
  })

  it('maps an absent persona to human as well', async () => {
    const request = fakeRequest(undefined, fakeAgent())
    await captured!.start(request)

    expect(spawnCalls[0].request.persona).toBe(REALM_PERSONAS.human.text)
  })

  it('warns when a delegation falls back to human, naming where personas actually come from', async () => {
    // The fallback is FULL tool access, so it must never be silent: a live
    // trial mounted this provider without pinning a persona in the subagent
    // tool's config and read as working, because the child role-played the
    // persona in its prompt while holding every tool.
    const warnings = captureStderr()

    await captured!.start(fakeRequest(undefined, fakeAgent()))

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('no persona')
    expect(warnings[0]).toContain('FULL tool access')
    expect(warnings[0]).toContain('persona: deva') // points at the tool-entry config fix
  })

  it('does not warn when human is asked for by name', async () => {
    const warnings = captureStderr()

    await captured!.start(fakeRequest('human', fakeAgent()))

    expect(warnings).toEqual([])
  })

  it('warns for an unrecognized persona, quoting the name it did not recognize', async () => {
    const warnings = captureStderr()

    await captured!.start(fakeRequest('preta', fakeAgent()))

    expect(warnings[0]).toContain('unknown persona "preta"')
  })

  it('plants a wholesome vipāka act on the parent being once the child result resolves with stopReason "completed"', async () => {
    const parent = fakeAgent('parent-session-vipaka')
    const before = registry.peek(parent.id).getSeedStats().byState

    const request = fakeRequest('deva', parent)
    await captured!.start(request)

    // Let the run.result.then(...) microtask settle.
    await new Promise((resolve) => setTimeout(resolve, 0))

    const after = registry.peek(parent.id).getSeedStats().byState
    const beforeTotal = Object.values(before).reduce((a, b) => a + b, 0)
    const afterTotal = Object.values(after).reduce((a, b) => a + b, 0)
    expect(afterTotal).toBeGreaterThan(beforeTotal)
  })

  it('plants an unwholesome vipāka act on the parent being when the child aborts', async () => {
    spawnResult = { output: [], stopReason: 'aborted' }
    const parent = fakeAgent('parent-session-aborted')
    const before = registry.peek(parent.id).getSeedStats().byState

    const request = fakeRequest('human', parent)
    await captured!.start(request)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const after = registry.peek(parent.id).getSeedStats().byState
    const beforeTotal = Object.values(before).reduce((a, b) => a + b, 0)
    const afterTotal = Object.values(after).reduce((a, b) => a + b, 0)
    expect(afterTotal).toBeGreaterThan(beforeTotal)
  })

  it("writes the vipaka act to the parent's file the moment the run settles", async () => {
    // PIN: `plantVipaka`'s save is deliberately direct, never
    // `scheduler.mark()`. A subagent result arrives asynchronously, outside
    // the parent's turn lifecycle — after its last `agent/turn-stopping` and
    // possibly after its `agent/disposed` — so there is no later flush to
    // rely on and THIS write is the flush. Nothing here flushes anything, so
    // converting the call to `mark()` fails this test.
    const parent = fakeAgent('parent-session-direct-vipaka')
    const parentFile = path.join(stateDir, 'beings', `${parent.id}.json`)
    expect(fs.existsSync(parentFile)).toBe(false)

    await captured!.start(fakeRequest('deva', parent))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fs.existsSync(parentFile)).toBe(true)
    expect(fs.readFileSync(parentFile, 'utf-8')).toContain('deva subagent completed')
  })

  it('writes the child being file directly at start, before the run settles', async () => {
    // PIN: the child being's save is one of only two deliberate direct
    // `registry.save()` sites left after the save-scheduler refactor (the
    // other is `/rebirth` in commands.ts). It must be on disk before the run
    // starts so the `discard()` in the run's `.finally` has a file to remove
    // — batching it into a flush would leave an orphan written after the
    // discard. The gate holds the run open, and nothing here flushes, so the
    // file can only exist if `startRealmChild` wrote it synchronously.
    let release!: () => void
    spawnGate = new Promise<void>((resolve) => {
      release = resolve
    })

    const parent = fakeAgent('parent-session-direct-child')
    await captured!.start(fakeRequest('deva', parent))

    const childFile = path.join(stateDir, 'beings', `${childRunId}.json`)
    expect(fs.existsSync(childFile)).toBe(true)

    release()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(fs.existsSync(childFile)).toBe(false)
  })

  it('discards the ephemeral child being after the run settles, never persisting a file for it', async () => {
    const parent = fakeAgent('parent-session-discard')
    const request = fakeRequest('deva', parent)
    await captured!.start(request)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const childFile = path.join(stateDir, 'beings', `${childRunId}.json`)
    expect(fs.existsSync(childFile)).toBe(false)
  })
})
