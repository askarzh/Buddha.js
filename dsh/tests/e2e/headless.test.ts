import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

/**
 * Real-composition headless boot: proves the Poison Arrow protocol
 * genuinely reaches the model through a real `dsh --profile headless` boot,
 * not a unit-level simulation of the breaker.
 *
 * Composition: the stock `headless` profile (dsh-base + dsh-headless) is
 * patched with a `--patch` overlay (templated from
 * `tests/fixtures/cordis.test.yml`) that:
 * - mounts this package's plugin at `dsh/lib/index.js` (the tsup-bundled
 *   build, rebuilt fresh in `beforeAll`) — NOT `src/index.ts` directly. Node's
 *   native TypeScript type-stripping (`--experimental-strip-types`, default
 *   in this Node runtime) does not remap a relative `./config.js` specifier
 *   to an on-disk `./config.ts` file, so loading `src/index.ts` raw through
 *   the real cordis plugin loader throws `ERR_MODULE_NOT_FOUND` for every
 *   sub-plugin import in `src/index.ts`. tsup's bundle inlines every local
 *   import into one file, sidestepping that resolution gap entirely. (The
 *   `mock-llm-plugin.ts` fixture below has no local relative imports — only
 *   bare-specifier imports resolved through `node_modules` — so it loads
 *   fine directly as `.ts` source; verified by hand before writing this
 *   test.)
 * - mounts `tests/fixtures/mock-llm-plugin.ts`, whose `MockAdapter` is
 *   scripted to fail a tool 3 times then check whether the breaker's notice
 *   reached the model (see that file's own module doc for the full script
 *   and why `read` on a missing path was chosen over `bash "exit 1"`).
 * - routes `agent-default-model` at the mock provider and disables
 *   `llm-deepseek`, so the run never needs `DEEPSEEK_API_KEY` or touches
 *   the network.
 *
 * This test is its own RED/GREEN pair by construction: `runHeadless()`'s
 * `breakerOverride` parameter reproduces the RED state (`breaker.enabled:
 * false` -> the mock never finds the plugin-sourced notice -> stdout prints
 * `PROTOCOL MISSING`) documented in the RED test below and in the task
 * report; the default (undefined override, breaker enabled) is GREEN.
 */
describe('real-composition headless boot (Poison Arrow reaches the model)', () => {
  const dshRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
  const buddhaPluginPath = path.join(dshRoot, 'lib', 'index.js')
  const mockPluginPath = path.join(dshRoot, 'tests', 'fixtures', 'mock-llm-plugin.ts')
  const overlayTemplatePath = path.join(dshRoot, 'tests', 'fixtures', 'cordis.test.yml')
  const dshBinPath = path.join(dshRoot, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')

  let dshAvailable = true

  beforeAll(() => {
    if (!fs.existsSync(dshBinPath)) {
      dshAvailable = false
      return
    }
    // Rebuild the plugin bundle fresh (dsh/lib is gitignored build output;
    // see the module doc above for why the overlay must point at this
    // bundle, not raw src/index.ts).
    execFileSync('pnpm', ['run', 'build'], { cwd: dshRoot, stdio: 'inherit' })
  }, 60_000)

  /**
   * Write a templated `cordis.test.yml` overlay into a fresh temp dir with
   * absolute paths substituted, optionally overriding the breaker config
   * block (used by the RED test below), and boot `dsh --profile headless`
   * against it with `task`. Returns the exit code, stdout, and the tmp
   * `stateDir` the overlay pointed the plugin's `BeingRegistry` at.
   */
  function runHeadless(task: string, breakerOverride?: string): { code: number | null; stdout: string; stateDir: string } {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-headless-e2e-'))
    const dshHome = path.join(tmpDir, 'dsh-home')
    const stateDir = path.join(tmpDir, 'state')
    fs.mkdirSync(dshHome, { recursive: true })
    fs.mkdirSync(stateDir, { recursive: true })

    let template = fs.readFileSync(overlayTemplatePath, 'utf-8')
    if (breakerOverride) {
      // Splice a `breaker:` block (8-space indent, sibling of `stateDir:`
      // under buddha's `config:` mapping) right after the stateDir line,
      // BEFORE path substitution — so this never has to reason about
      // quoting/escaping in the substituted absolute paths.
      template = template.replace(
        '        stateDir: __STATE_DIR__\n',
        `        stateDir: __STATE_DIR__\n${breakerOverride}\n`,
      )
    }
    const overlay = template
      .replaceAll('__BUDDHA_PLUGIN__', buddhaPluginPath)
      .replaceAll('__MOCK_PLUGIN__', mockPluginPath)
      .replaceAll('__STATE_DIR__', stateDir)
    const overlayPath = path.join(tmpDir, 'cordis.test.yml')
    fs.writeFileSync(overlayPath, overlay)

    const env: NodeJS.ProcessEnv = { ...process.env, DSH_HOME: dshHome }
    delete env.DEEPSEEK_API_KEY
    delete env.BUDDHA_INCARNATION_GAP_MS

    const result = spawnSync(
      process.execPath,
      [dshBinPath, '--profile', 'headless', '--patch', overlayPath, task],
      { cwd: dshRoot, env, encoding: 'utf-8', timeout: 120_000 },
    )

    return { code: result.status, stdout: result.stdout ?? '', stateDir }
  }

  it('GREEN: the breaker notice reaches the mock model after repeated tool failures', () => {
    if (!dshAvailable) {
      console.warn('SKIPPED: @deepseek-ai/dsh binary not found under dsh/node_modules — headless e2e test cannot run.')
      return
    }

    const { code, stdout, stateDir } = runHeadless('Run the failing command until it works')

    expect(code).toBe(0)
    expect(stdout).toContain('PROTOCOL SEEN')

    // The being state file records the breaker's `blind retry of read` act
    // (see src/breaker.ts's `being.act(\`blind retry of ${exec.name}\`, ...)`
    // — `read` is the tool this mock drives; see mock-llm-plugin.ts's module
    // doc for why `bash "exit 1"` was rejected).
    const beingsDir = path.join(stateDir, 'beings')
    expect(fs.existsSync(beingsDir)).toBe(true)
    const files = fs.readdirSync(beingsDir).filter((name) => name.endsWith('.json'))
    expect(files.length).toBeGreaterThan(0)

    const being = JSON.parse(fs.readFileSync(path.join(beingsDir, files[0]!), 'utf-8'))
    const seeds: Array<{ description: string }> = being.karmicStore?.seeds ?? []
    expect(seeds.some((seed) => seed.description.includes('blind retry of read'))).toBe(true)
  }, 120_000)

  it('RED: without the breaker, the mock model never sees the protocol (proves this is a real signal, not a tautology)', () => {
    if (!dshAvailable) {
      console.warn('SKIPPED: @deepseek-ai/dsh binary not found under dsh/node_modules — headless e2e test cannot run.')
      return
    }

    const { code, stdout } = runHeadless(
      'Run the failing command until it works',
      '        breaker:\n          enabled: false\n          threshold: 3\n          mutatingTools: [write, edit, str_replace_editor]',
    )

    expect(code).toBe(0)
    expect(stdout).toContain('PROTOCOL MISSING')
  }, 120_000)
})
