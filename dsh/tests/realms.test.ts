import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ResolvedSubagentStartRequest, SubagentProvider, SubagentRun, SubagentStartRequest } from '@deepseek-ai/dsh-subagent'
import { BeingRegistry } from '../src/being-registry.js'
import { applyRealms, REALM_PERSONAS } from '../src/realms.js'

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

  beforeEach(async () => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-realms-'))
    registry = new BeingRegistry(stateDir)
    ctx = new Context()
    captured = undefined
    spawnCalls = []
    spawnResult = { output: [], stopReason: 'completed' }
    childRunId = 'child-session-1'

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
          result: Promise.resolve(spawnResult as never),
          async dispose() {},
        }
        return run
      },
    }
    ctx.provide('subagents', fakeSubagents as never)
    await applyRealms(ctx, { registry })
  })

  afterEach(() => {
    fs.rmSync(stateDir, { recursive: true, force: true })
  })

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

  it('discards the ephemeral child being after the run settles, never persisting a file for it', async () => {
    const parent = fakeAgent('parent-session-discard')
    const request = fakeRequest('deva', parent)
    await captured!.start(request)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const childFile = path.join(stateDir, 'beings', `${childRunId}.json`)
    expect(fs.existsSync(childFile)).toBe(false)
  })
})
