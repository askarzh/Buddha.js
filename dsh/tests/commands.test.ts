import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { CommandDefinition, CommandInvocation } from '@deepseek-ai/dsh-commands'
import { BeingRegistry } from '../src/being-registry.js'
import { SaveScheduler } from '../src/persistence.js'
import { applyVithi } from '../src/vithi.js'
import { applyCommands } from '../src/commands.js'

/**
 * The four human slash commands (`/sit`, `/koan`, `/status`, `/rebirth`).
 *
 * Per the brief: "call each registered definition's handler(invocation)
 * directly with a fake invocation" — so `ctx.commands` is faked here (only
 * `.register` is ever read by `applyCommands`), capturing each
 * `CommandDefinition` into a map keyed by name, and each test invokes
 * `definition.handler(invocation)` directly rather than going through a real
 * `CommandRuntime`/dispatch pipeline.
 */

/**
 * Fakes `ctx.commands` (only `.register` is ever read by `applyCommands`)
 * against a bare `Context`, mounts `applyVithi` + `applyCommands` on it for
 * `registry`, and returns the captured definitions by name — same "fake the
 * one service surface actually read, dispatch through a bare Context" style
 * as `breaker.test.ts`/`vithi.test.ts`.
 *
 * `applyCommands` registers behind `ctx.inject(['commands'], ...)` (see its
 * doc comment in `src/commands.ts`), which only runs its callback once the
 * `commands` service is genuinely resolvable through Cordis's own service
 * store — a plain `(ctx as any).commands = {...}` property assignment does
 * NOT satisfy that (Cordis's reflect layer proxies property reads for
 * declared services and throws "cannot get property ... without inject" when
 * one was never provided). `ctx.provide('commands', fakeCommands)` registers
 * it for real, exactly as the genuine `dsh-commands` plugin's `apply()` does,
 * so `ctx.inject(['commands'], ...)`'s callback fires synchronously here.
 * `applyCommands` returns the `ctx.inject` fiber (also a `PromiseLike`) for
 * exactly this reason — `await`ing it settles once registration has run.
 */
async function mountCommands(registry: BeingRegistry): Promise<Map<string, CommandDefinition>> {
  const ctx = new Context()
  const vithi = applyVithi(ctx, { registry, scheduler: new SaveScheduler(registry) })
  const defs = new Map<string, CommandDefinition>()
  const fakeCommandsService = {
    register(definition: CommandDefinition) {
      defs.set(definition.name, definition)
      return () => defs.delete(definition.name)
    },
  }
  ctx.provide('commands', fakeCommandsService as never)
  await applyCommands(ctx, { registry, vithi })
  return defs
}

describe('/sit /koan /status /rebirth commands', () => {
  let stateDir: string
  let registry: BeingRegistry
  let defs: Map<string, CommandDefinition>

  beforeEach(async () => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-commands-'))
    registry = new BeingRegistry(stateDir)
    defs = await mountCommands(registry)
  })

  afterEach(() => {
    fs.rmSync(stateDir, { recursive: true, force: true })
  })

  function fakeAgent(id = 'session-a'): Agent {
    return { id, ctx: new Context() } as unknown as Agent
  }

  function fakeInvocation(agent: Agent, rawInput = ''): CommandInvocation {
    return {
      commandId: 'cmd-1' as unknown as CommandInvocation['commandId'],
      agent,
      rawInput,
      attachments: [],
      signal: new AbortController().signal,
    }
  }

  function definition(name: string): CommandDefinition {
    const def = defs.get(name)
    if (!def) throw new Error(`command "${name}" was not registered`)
    return def
  }

  it('registers exactly sit, koan, status, rebirth', () => {
    expect([...defs.keys()].sort()).toEqual(['koan', 'rebirth', 'sit', 'status'])
  })

  describe('/sit', () => {
    it('walks the four-step Poison Arrow protocol for the named suffering', async () => {
      const result = await definition('sit').handler(fakeInvocation(fakeAgent(), 'my code keeps failing'))

      expect(result.kind).toBe('success')
      const text = (result as { text?: string }).text ?? ''
      expect(text).toContain('my code keeps failing')
      expect(text).toContain('recognize')
      expect(text).toContain('investigate')
      expect(text).toContain('release')
      expect(text).toContain('practice')
    })

    // A bare /sit used to walk the protocol against the placeholder "unnamed
    // suffering" — ceremony with nothing to investigate, since naming the
    // suffering IS the first step.
    it('asks for a name when rawInput is blank and the session has no trouble to point at', async () => {
      const result = await definition('sit').handler(fakeInvocation(fakeAgent(), '   '))

      expect(result.kind).toBe('success')
      const text = (result as { text?: string }).text ?? ''
      expect(text).toContain('/sit <what hurts>')
      expect(text).not.toContain('unnamed suffering')
      expect(text).not.toContain('recognize') // no hollow protocol walk
    })

    it("sits with the session's most recent unwholesome seed when rawInput is blank", async () => {
      const agent = fakeAgent()
      const being = registry.peek(agent.id)
      being.act('an older stumble', 5, 'aversion')
      being.act('blind retry of read', 6, 'aversion')
      registry.save(agent.id, being)

      const result = await definition('sit').handler(fakeInvocation(agent, ''))

      const text = (result as { text?: string }).text ?? ''
      expect(text).toContain('blind retry of read') // the most recent one, not the older
      expect(text).not.toContain('an older stumble')
      expect(text).toContain('no suffering named') // says it inferred rather than pretending
      expect(text).toContain('recognize')
    })
  })

  describe('/koan', () => {
    it('presents a koan by id', async () => {
      const result = await definition('koan').handler(fakeInvocation(fakeAgent(), 'mu'))

      expect(result.kind).toBe('success')
      expect((result as { text?: string }).text).toContain('[mu]')
    })

    it('presents a random koan when no id is given', async () => {
      const result = await definition('koan').handler(fakeInvocation(fakeAgent(), ''))

      expect(result.kind).toBe('success')
      expect((result as { text?: string }).text).toMatch(/^\[[a-z-]+\]/)
    })

    it('composes a koan for the situation at hand', async () => {
      const result = await definition('koan').handler(
        fakeInvocation(fakeAgent(), 'compose The Unread File | You read a file that is not there, six times. What did you read?'),
      )

      expect(result.kind).toBe('success')
      const text = (result as { text: string }).text
      expect(text).toContain('The Unread File')
      expect(text).toContain('six times')
    })

    it('reports usage rather than "unknown id" for a malformed compose', async () => {
      const result = await definition('koan').handler(fakeInvocation(fakeAgent(), 'compose No Separator Here'))

      expect(result.kind).toBe('error')
      const text = (result as { text: string }).text
      expect(text).toContain('Usage: /koan compose')
      expect(text).not.toContain('Unknown koan id')
    })

    it('returns kind: error with text listing known ids for an unknown id', async () => {
      const result = await definition('koan').handler(fakeInvocation(fakeAgent(), 'not-a-real-koan'))

      expect(result.kind).toBe('error')
      const text = (result as { text: string }).text
      expect(text).toBeTruthy()
      expect(text).toContain('not-a-real-koan')
      expect(text).toContain('mu')
    })
  })

  describe('/status', () => {
    it('reports the summary, realm, and seed stats without writing a file', async () => {
      const agent = fakeAgent('session-status')
      const filePath = path.join(stateDir, 'beings', 'session-status.json')

      const result = await definition('status').handler(fakeInvocation(agent, ''))

      expect(result.kind).toBe('success')
      const text = (result as { text?: string }).text ?? ''
      expect(text).toContain('BEING STATE SUMMARY')
      expect(text).toContain('REALM: human')
      expect(fs.existsSync(filePath)).toBe(false)
    })

    it('never settles a pending rebirth: the file stays byte-identical across repeated calls', async () => {
      const agent = fakeAgent('session-status-stable')
      // Prime a saved being on disk first, mimicking a real session that has
      // already been persisted by another sub-plugin (karma/vithi).
      const priming = registry.acquire('session-status-stable')
      registry.save('session-status-stable', priming.being)
      const filePath = path.join(stateDir, 'beings', 'session-status-stable.json')
      const before = fs.readFileSync(filePath, 'utf-8')

      await definition('status').handler(fakeInvocation(agent, ''))
      await definition('status').handler(fakeInvocation(agent, ''))

      const after = fs.readFileSync(filePath, 'utf-8')
      expect(after).toBe(before)
    })
  })

  describe('/rebirth', () => {
    it('forces a rebirth and persists the NEW being under the same session id', async () => {
      const agent = fakeAgent('session-rebirth')
      const sessionId = 'session-rebirth'

      // Plant enough greed to make the karmic balance/realm selection
      // deterministic-ish; the assertion below only checks the mechanics
      // (a rebirth happened and was persisted), not which realm resulted.
      const { being } = registry.acquire(sessionId)
      being.act('grasping', 8, 'greed')
      being.act('grasping again', 8, 'greed')
      being.act('grasping a third time', 8, 'greed')
      registry.save(sessionId, being)
      const incarnationBefore = being.incarnation

      const result = await definition('rebirth').handler(fakeInvocation(agent, ''))

      expect(result.kind).toBe('success')
      const text = (result as { text?: string }).text ?? ''
      expect(text).toContain('→')

      const filePath = path.join(stateDir, 'beings', `${sessionId}.json`)
      const persisted = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      expect(persisted.incarnation).toBe(incarnationBefore + 1)

      // The registry's live cache for this session must now be the NEW being.
      const reread = registry.peek(sessionId)
      expect(reread.incarnation).toBe(incarnationBefore + 1)
    })

    it('writes through immediately, never deferring to the SaveScheduler', async () => {
      // PIN: `/rebirth` is one of only two deliberate direct `registry.save()`
      // sites left after the save-scheduler refactor (the other is the child
      // being in realms.ts). A human typed the command and expects the new
      // incarnation durable the moment it returns — a later refactor must not
      // quietly batch this into the turn-boundary flush. Nothing here stops a
      // turn or flushes anything, so the file can only exist if the handler
      // wrote it synchronously.
      const sessionId = 'session-rebirth-direct'
      const filePath = path.join(stateDir, 'beings', `${sessionId}.json`)
      expect(fs.existsSync(filePath)).toBe(false)

      await definition('rebirth').handler(fakeInvocation(fakeAgent(sessionId), ''))

      expect(fs.existsSync(filePath)).toBe(true)
    })

    it('settles a pending rebirth instead of double-advancing when one is already due', async () => {
      const sessionId = 'session-rebirth-pending'
      const original = process.env.BUDDHA_INCARNATION_GAP_MS
      process.env.BUDDHA_INCARNATION_GAP_MS = '0'
      try {
        const primed = registry.acquire(sessionId)
        registry.save(sessionId, primed.being)

        // Fresh registry against the same stateDir, exactly like
        // being-registry.test.ts's gap tests: this is what makes
        // `peek()`/`acquire()` actually reload from disk (rather than reuse
        // the still-live in-memory instance) and detect `pendingRebirth`.
        const reloadedRegistry = new BeingRegistry(stateDir)
        const peeked = reloadedRegistry.peek(sessionId)
        expect(peeked.pendingRebirth).toBe(true)
        // The gap-load itself already advances `_incarnation` by 1 (see
        // Being.settlePendingRebirth()'s doc comment: this keeps the NET
        // change across load+settle at exactly +1, not +2) — so the pending
        // being's incarnation number here already reflects that bump, before
        // any settlement has actually happened.
        const incarnationAtLoad = peeked.incarnation

        const reloadedDefs = await mountCommands(reloadedRegistry)
        const rebirthDef = reloadedDefs.get('rebirth')
        if (!rebirthDef) throw new Error('rebirth command was not registered')
        const result = await rebirthDef.handler(fakeInvocation(fakeAgent(sessionId), ''))

        expect(result.kind).toBe('success')
        const settled = reloadedRegistry.peek(sessionId)
        expect(settled.pendingRebirth).toBe(false)
        // Settling the already-due rebirth must NOT also force a second one:
        // the incarnation stays exactly what the gap-load already bumped it
        // to, never +1 beyond that (which would be a double-advance).
        expect(settled.incarnation).toBe(incarnationAtLoad)
      } finally {
        if (original === undefined) delete process.env.BUDDHA_INCARNATION_GAP_MS
        else process.env.BUDDHA_INCARNATION_GAP_MS = original
      }
    })
  })
})
