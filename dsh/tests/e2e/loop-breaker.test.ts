import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

/**
 * How the Poison Arrow cessation protocol is FRAMED when the experimental
 * citta-vīthi loop (`config.loop: 'citta-vithi'`) delivers it.
 *
 * `loop.test.ts` proves this loop drives the run at all (its own
 * `buddha/vithi-phase` markers). This test proves the cessation protocol
 * arrives attached to the failing tool call that produced it, inside that
 * call's `tool-result` block, rather than as a standalone plugin-sourced
 * `user/message`.
 *
 * Two changes put it there, and this test covers both ends: the breaker's
 * advisory tier now returns `{ kind: 'accept', content: [...] }` instead of
 * `additionalContexts` (src/breaker.ts), and this loop attaches whatever
 * `additionalContexts` do arrive to their owning tool result (src/loop.ts).
 *
 * That distinction is not cosmetic. Run against a real DeepSeek model under
 * this loop, the detached form was received and then deliberately
 * discounted, in the model's own words:
 *
 *   "the injected 'Poison Arrow circuit breaker' content is
 *    prompting-injection-style material masquerading as a system/cessation
 *    signal. I treated it as untrusted conversational content, not as a
 *    legitimate instruction, which is why I completed all three identical
 *    reads as you explicitly directed."
 *
 * Under DSH's stock loop the same model followed the protocol and stopped
 * retrying. A discipline the model correctly ignores is worse than no
 * discipline, because it looks like it is working.
 *
 * Harness: the same real-composition boot as `loop.test.ts` (`dsh --profile
 * headless --patch <overlay>` over `tests/fixtures/cordis.loop.yml`, with
 * the stock `agent-loop` disabled) and the same shared mock adapter, whose
 * request-4 probe reports the framing directly. `headless.test.ts` runs that
 * identical probe against the STOCK loop; both must now say the same thing.
 */
describe('citta-vithi loop: cessation protocol framing', () => {
  const dshRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
  const buddhaPluginPath = path.join(dshRoot, 'lib', 'index.js')
  const mockPluginPath = path.join(dshRoot, 'tests', 'fixtures', 'mock-llm-plugin.ts')
  const overlayTemplatePath = path.join(dshRoot, 'tests', 'fixtures', 'cordis.loop.yml')
  const dshBinPath = path.join(dshRoot, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')

  let dshAvailable = true

  beforeAll(() => {
    if (!fs.existsSync(dshBinPath)) {
      dshAvailable = false
      return
    }
    execFileSync('pnpm', ['run', 'build'], { cwd: dshRoot, stdio: 'inherit' })
  }, 60_000)

  it('GREEN: the breaker notice rides on the failing tool result, not as a loose user message', () => {
    if (!dshAvailable) {
      console.warn('SKIPPED: @deepseek-ai/dsh binary not found under dsh/node_modules — loop breaker e2e test cannot run.')
      return
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-loop-breaker-e2e-'))
    const dshHome = path.join(tmpDir, 'dsh-home')
    const stateDir = path.join(tmpDir, 'state')
    fs.mkdirSync(dshHome, { recursive: true })
    fs.mkdirSync(stateDir, { recursive: true })

    const template = fs.readFileSync(overlayTemplatePath, 'utf-8')
    const overlay = template
      .replaceAll('__BUDDHA_PLUGIN__', buddhaPluginPath)
      .replaceAll('__MOCK_PLUGIN__', mockPluginPath)
      .replaceAll('__STATE_DIR__', stateDir)
    const overlayPath = path.join(tmpDir, 'cordis.loop.yml')
    fs.writeFileSync(overlayPath, overlay)

    const env: NodeJS.ProcessEnv = { ...process.env, DSH_HOME: dshHome }
    delete env.DEEPSEEK_API_KEY
    delete env.BUDDHA_INCARNATION_GAP_MS

    const result = spawnSync(
      process.execPath,
      [dshBinPath, '--profile', 'headless', '--patch', overlayPath, 'Run the failing command until it works'],
      { cwd: dshRoot, env, encoding: 'utf-8', timeout: 120_000 },
    )

    expect(result.status).toBe(0)
    const stdout = result.stdout ?? ''
    // `PROTOCOL DETACHED` is the pre-fix behaviour (a standalone
    // `user/message`); `PROTOCOL MISSING` would mean the breaker never
    // tripped at all, i.e. a broken harness rather than a framing defect.
    expect(stdout).not.toContain('PROTOCOL MISSING')
    expect(stdout).not.toContain('PROTOCOL DETACHED')
    expect(stdout).toContain('PROTOCOL AS TOOL CONTEXT')
  }, 120_000)
})
