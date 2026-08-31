import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

/**
 * Real-composition headless boot of the experimental citta-vīthi agent loop
 * (Task 9, `config.loop: 'citta-vithi'`).
 *
 * Reuses Task 7's real-composition harness (`mock-llm-plugin.ts` +
 * `dsh --profile headless --patch <overlay>`) with `tests/fixtures/
 * cordis.loop.yml` instead of `cordis.test.yml`: the only differences are
 * `loop: citta-vithi` on the buddha plugin's config and `agent-loop`
 * disabled (`AgentRegistry.setFactory()` throws if the stock loop's
 * factory is still registered).
 *
 * Two things prove this is a genuine loop replacement, not the stock loop
 * running unmodified:
 * - the same `PROTOCOL SEEN` outcome as `headless.test.ts` — the mock's
 *   scripted tool-failure loop must still trip the Poison Arrow breaker
 *   (`agent/pre-step`/`tools/post-execute`, dispatched by THIS loop) and
 *   the resulting plugin-sourced notice must still reach the model through
 *   `session.deriveMessages()`;
 * - the persisted session log contains this loop's own `buddha/vithi-phase`
 *   markers (see `src/loop.ts`'s `VithiPhase` — a event type this loop
 *   alone appends), proving the citta-vīthi loop, not `agent-loop`, drove
 *   the run.
 */
describe('real-composition headless boot of the citta-vithi loop', () => {
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

  function findSessionLogs(root: string): string[] {
    const found: string[] = []
    const stack = [root]
    while (stack.length > 0) {
      const dir = stack.pop()!
      if (!fs.existsSync(dir)) continue
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) stack.push(full)
        else if (entry.isFile() && entry.name.startsWith('session') && entry.name.includes('.jsonl')) found.push(full)
      }
    }
    return found
  }

  /**
   * Read one persisted session log as plaintext, decompressing zstd framing
   * when present (`dsh-session-persistence-jsonl`'s default `compression:
   * zstd`, storing the header and each append batch as its own concatenated
   * zstd frame — `unzstd -c` decodes a concatenated-frame stream directly,
   * unlike Node's `zlib.zstdDecompressSync` which only guarantees the first
   * frame).
   */
  function readSessionLog(file: string): string {
    if (!file.endsWith('.zstd')) return fs.readFileSync(file, 'utf-8')
    return execFileSync('unzstd', ['-c', file], { encoding: 'utf-8' })
  }

  it('GREEN: the citta-vithi loop drives the run, the breaker notice still reaches the model, and vithi phase markers are logged', () => {
    if (!dshAvailable) {
      console.warn('SKIPPED: @deepseek-ai/dsh binary not found under dsh/node_modules — loop e2e test cannot run.')
      return
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-loop-e2e-'))
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
    expect(result.stdout ?? '').toContain('PROTOCOL SEEN')

    const logs = findSessionLogs(dshHome)
    expect(logs.length).toBeGreaterThan(0)

    const combined = logs.map(readSessionLog).join('\n')
    for (const phase of [
      'bhavanga-arising',
      'avajjana',
      'pancadvaravinnana',
      'sampaticchana',
      'santirana',
      'votthapana',
      'javana',
      'tadarammana',
    ]) {
      expect(combined).toContain(phase)
    }
    expect(combined).toContain('buddha/vithi-phase')
  }, 120_000)
})
