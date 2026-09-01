import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { CallId } from '@deepseek-ai/dsh-llm'
import type { ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import { name, apply, Config } from '../src/index.js'

describe('dsh-plugin-buddha mount', () => {
  it('applies against a bare Cordis Context with no injected services and disposes cleanly', async () => {
    const ctx = new Context()
    const fiber = ctx.plugin({ name, inject: [], apply })
    // A bare Context has none of `tools`/`commands`/`systemPrompt` (this
    // plugin's real `inject` list) registered. Loading with `inject: []`
    // here pins that `apply` itself never reaches for an uninjected
    // service at load time — it only mounts sub-plugins in later tasks,
    // which is where those services actually get touched.
    await expect(fiber).resolves.toBeDefined()
    await expect(fiber.dispose()).resolves.toBeUndefined()
  })

  describe('save scheduling and session-end disposal', () => {
    function fakeAgent(id: string): Agent {
      return { id, ctx: new Context() } as unknown as Agent
    }

    function fakeExec(agent: Agent): ToolExecution {
      const callId = 'call-1' as unknown as CallId
      return {
        callId,
        rootCallId: callId,
        name: 'bash',
        arguments: {},
        agent,
        token: {} as never,
        signal: new AbortController().signal,
      } as unknown as ToolExecution
    }

    const ok: ToolExecutionResult = { isError: false, value: {}, content: [] }

    async function mount(stateDir: string) {
      const ctx = new Context()
      // `apply` normalizes through `Config(config)` itself, so a partial
      // config is fine at runtime; the cast is only to satisfy the full-shape
      // parameter type.
      const fiber = ctx.plugin({ name, inject: [], apply }, { stateDir } as Partial<Config> as Config)
      await fiber
      return { ctx, fiber }
    }

    it("flushes and disposes the session's being on agent/disposed", async () => {
      const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-mount-'))
      try {
        const { ctx } = await mount(stateDir)
        const agent = fakeAgent('session-disposed')
        const file = path.join(stateDir, 'beings', 'session-disposed.json')

        // Karma + vīthi both mark this being; neither writes.
        await ctx.emit('tools/result', fakeExec(agent), ok)
        expect(fs.existsSync(file)).toBe(false)

        // `agent/disposed`'s real payload shape (verified against
        // @deepseek-ai/dsh-agent's AgentRegistry.emitDisposed): `{ agent }`.
        await ctx.emit('agent/disposed', { agent })
        expect(fs.existsSync(file)).toBe(true)
      } finally {
        fs.rmSync(stateDir, { recursive: true, force: true })
      }
    })

    it('flushes every dirty session when the plugin itself is torn down', async () => {
      const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-mount-'))
      try {
        const { ctx, fiber } = await mount(stateDir)
        await ctx.emit('tools/result', fakeExec(fakeAgent('session-a')), ok)
        await ctx.emit('tools/result', fakeExec(fakeAgent('session-b')), ok)
        // Nothing written yet: the beings dir is only created by a real save.
        expect(fs.existsSync(path.join(stateDir, 'beings'))).toBe(false)

        // A shutdown mid-turn must not lose the turn.
        await fiber.dispose()
        expect(fs.existsSync(path.join(stateDir, 'beings', 'session-a.json'))).toBe(true)
        expect(fs.existsSync(path.join(stateDir, 'beings', 'session-b.json'))).toBe(true)
      } finally {
        fs.rmSync(stateDir, { recursive: true, force: true })
      }
    })
  })
})
