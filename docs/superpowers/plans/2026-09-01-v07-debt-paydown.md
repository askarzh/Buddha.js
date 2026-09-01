# v0.7 Debt Paydown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pay down every debt item named in the 2026-09-01 source review and the v0.4 backlog, in an order where each phase ships on its own.

**Architecture:** Nine phases, each independently releasable. Phases 1–2 harden the DSH plugin where it is load-bearing (bundling, persistence, error paths, and the framing that decides whether a model obeys the breaker at all). Phase 3 fixes library correctness. Phase 4 closes the biggest systemic gap — the CLI is 0% covered. Phase 5 is cheap hygiene. Phases 6–7 are doctrine features from the v0.4 backlog. Phase 8 is the one structural refactor, deliberately last because it touches everything. Phase 9 is ops.

**Tech Stack:** TypeScript (strict, `noUnusedLocals`/`noUnusedParameters`), vitest, tsup, Commander.js + @inquirer/prompts + chalk v5 (CLI), @modelcontextprotocol/sdk + zod (MCP), Cordis 4.0.2 + DeepSeek Harness 0.1.1-rc.2 (`dsh/`), pnpm inside `dsh/` only.

**Spec:** None. This plan is written directly from the 2026-09-01 debt review (this session's findings plus Antigravity's cross-review, every claim verified against the code before it entered this plan). Tasks 12 and 13 PRODUCE specs rather than consuming one — they are design work, and their output is the spec a later plan argues from.

## Global Constraints

- **`dsh/` is pnpm-only.** `npm install` inside `dsh/` exhausts memory on this machine (verified twice). From the repo root, `npm run build:dsh` and `npm run test:dsh` shell out to pnpm.
- **`@deepseek-ai/dsh` stays pinned at `0.1.1-rc.2`.** It is a developer preview with an explicit breaking-change warning. Any task that changes the pin must first run `dsh/tests/compat.test.ts` and both e2e suites.
- **All five version surfaces move together**: `package.json`, `plugin/.claude-plugin/plugin.json`, `mcpb/manifest.json`, `dsh/package.json`, and `version:` in `src/mcp/index.ts`. `scripts/check-versions.sh` enforces this and runs first in CI. Any release commit runs it.
- **Any change under `plugin/`** requires a version bump in `plugin/.claude-plugin/plugin.json` — `/plugin update` skips re-extraction when the version string is unchanged.
- **Any change to `src/mcp/`** requires `npm run build:plugin`; CI fails on `git diff --exit-code plugin/dist`.
- **Any handler that SAVES a being must settle a pending rebirth first** (`registry.acquire()`, not `peek()`). Read-only surfaces use `peek()` and must never write. This rule is load-bearing: `/status` is proven read-only by byte comparison.
- **Tests assert behaviour, not implementation.** A test that pins a private field or a message's exact wording is a defect unless the wording is the deliverable.
- Prefix unused parameters with `_`.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `dsh/tsup.config.ts` | Bundle config; gains `external` for DSH packages | 1 |
| `dsh/package.json` | DSH packages move devDependencies → peerDependencies | 1 |
| `dsh/src/persistence.ts` (new) | One `SaveScheduler`: mark dirty, flush at turn end | 2 |
| `dsh/src/being-registry.ts` | Gains `flush()`; `dispose()` wired to session end | 2 |
| `dsh/src/index.ts` | Mounts the scheduler; wires session-end disposal | 2 |
| `dsh/src/{breaker,karma,vithi,realms,commands}.ts` | `registry.save()` → `scheduler.mark()` | 2 |
| `dsh/src/errors.ts` (new) | `reportSwallowed()` — one place that names a swallowed fault | 3 |
| `dsh/src/loop.ts` | Layer B: deliver the breaker notice as tool-result context, not a free user message | 4 |
| `src/mind/Citta.ts` | `momentStream` becomes a bounded ring buffer | 5 |
| `src/simulation/Being.ts` | `pickShapingSeed` gains the āsanna-kamma tie-break | 6 |
| `src/eightfold-path/PathFactor.ts` | `practiceTo(target)` | 7 |
| `tests/cli/*.test.ts` (new) | The CLI's first tests — currently 0% covered | 8 |
| `src/cli/utils/runner.ts` (new) | Extracted command bodies, callable without a TTY | 8 |
| `GEMINI.md`, `package.json`, `.github/workflows/ci.yml` | Hygiene drift | 9 |
| `src/koan/KoanGenerator.ts` | Custom koans + trap journal | 10 |
| `src/simulation/Bardo.ts` (new) | Optional between-lives object | 11 |
| `docs/superpowers/specs/2026-09-XX-realm-strategy-design.md` (new) | Output of the Being.ts refactor spike | 12 |
| `stack/dsh/*.service` | systemd units for the web UI | 14 |

---

## Phase 1 — DSH plugin hardening

### Task 1: Stop bundling DSH's runtime into the plugin

**Files:**
- Modify: `dsh/tsup.config.ts`
- Modify: `dsh/package.json`
- Test: `dsh/tests/bundle.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: a `lib/index.js` that imports `@deepseek-ai/*` rather than inlining it. Later tasks that edit `dsh/src/*` inherit this.

**Why:** `tsup` externalises `package.json` dependencies, but every `@deepseek-ai/dsh-*` package is a **devDependency**, so ~180 KB of DSH's own runtime classes is inlined into `lib/index.js`. In a real host that means two copies of `Inbox`, `HarnessError`, `ToolRuntime` and friends in one process: `instanceof` comparisons across the boundary fail, and `markAgentLoopRequest`'s module-scoped `WeakSet` in `dsh-llm` is a private copy the host can never read. Nothing at `0.1.1-rc.2` consumes `isAgentLoopRequest`, so this is latent today — it breaks silently the day it isn't.

- [ ] **Step 1: Write the failing test**

```ts
// dsh/tests/bundle.test.ts
import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const lib = path.join(__dirname, '..', 'lib', 'index.js')

describe('built bundle', () => {
  // The plugin is loaded by a DSH host that already has these packages in
  // memory. Inlining copies means `instanceof` fails across the boundary and
  // module-scoped state (dsh-llm's WeakSet of agent-loop requests) is private
  // to our copy.
  it('imports DSH packages instead of inlining them', () => {
    const source = fs.readFileSync(lib, 'utf-8')
    expect(source).toMatch(/from ["']@deepseek-ai\/dsh-session["']/)
    expect(source).not.toMatch(/class HarnessError/)
  })

  it('still inlines buddha-js, which the host does not provide', () => {
    const source = fs.readFileSync(lib, 'utf-8')
    expect(source).not.toMatch(/from ["']buddha-js["']/)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd dsh && pnpm build && pnpm exec vitest run tests/bundle.test.ts`
Expected: FAIL — the bundle contains `class HarnessError` and no `@deepseek-ai/dsh-session` import.

- [ ] **Step 3: Externalise the DSH packages**

```ts
// dsh/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'lib',
  dts: true,
  clean: true,
  sourcemap: true,
  // The host provides these; bundling them would put a second copy of DSH's
  // runtime classes in the process. `buddha-js` is NOT external — the host has
  // never heard of it, and inlining it is what makes the plugin a single file.
  external: [/^@deepseek-ai\//],
})
```

- [ ] **Step 4: Move the DSH packages to peerDependencies**

In `dsh/package.json`, move every `@deepseek-ai/dsh*` and `@deepseek-ai/cordis` entry out of `devDependencies` into `peerDependencies` with the same version strings, and keep a `devDependencies` copy so the test suite still resolves them locally (pnpm does not install peers automatically). Add `peerDependenciesMeta` marking each optional so a consumer installing only what they use does not warn.

- [ ] **Step 5: Rebuild, run the whole dsh suite**

Run: `cd dsh && pnpm build && pnpm test`
Expected: 65+ tests pass, including both e2e suites. The e2e suites boot a real DSH app, so they are what proves the externalised imports actually resolve at load time.

- [ ] **Step 6: Prove the plugin still loads outside its dev tree**

Run: `cd dsh && env -u DEEPSEEK_API_KEY pnpm exec dsh --profile headless --patch <overlay pointing at dsh/lib/index.js> "say hello"`
Expected: fails with `MISSING_CREDENTIAL` only. Any `ERR_MODULE_NOT_FOUND` means the externals do not resolve from the host and this task is not done.

- [ ] **Step 7: Commit**

```bash
git add dsh/tsup.config.ts dsh/package.json dsh/tests/bundle.test.ts
git commit -m "fix(dsh): stop bundling DSH's runtime into the plugin"
```

---

### Task 2: One save per turn, and a being that is actually disposed

**Files:**
- Create: `dsh/src/persistence.ts`
- Modify: `dsh/src/being-registry.ts`, `dsh/src/index.ts`, `dsh/src/breaker.ts:213`, `dsh/src/karma.ts:104,113`, `dsh/src/vithi.ts:87`, `dsh/src/realms.ts:168`, `dsh/src/commands.ts:182`
- Test: `dsh/tests/persistence.test.ts` (create), `dsh/tests/being-registry.test.ts` (extend)

**Interfaces:**
- Consumes: `BeingRegistry` from Task 0 (shipped).
- Produces:
  ```ts
  export class SaveScheduler {
    constructor(registry: BeingRegistry)
    mark(sessionId: string, being: Being): void  // remember; do not write
    flush(sessionId: string): void               // write if dirty
    flushAll(): void
  }
  ```
  Later tasks call `scheduler.mark()` wherever they used `registry.save()`.

**Why:** Three sub-plugins independently `registry.save()` on the same tool result, so one tool call costs 2–3 synchronous `writeFileSync` + `renameSync` pairs of a JSON document that grows with every seed. Correctness is fine — the writes are synchronous and cannot interleave within a process — but it is pure waste that scales with session length. Separately, `registry.dispose()` is called by nothing at all: main-session beings stay in the `live` map for the process lifetime.

- [ ] **Step 1: Write the failing tests**

```ts
// dsh/tests/persistence.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { BeingRegistry } from '../src/being-registry.js'
import { SaveScheduler } from '../src/persistence.js'

describe('SaveScheduler', () => {
  let stateDir: string
  let registry: BeingRegistry
  let scheduler: SaveScheduler

  beforeEach(() => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-persist-'))
    registry = new BeingRegistry(stateDir)
    scheduler = new SaveScheduler(registry)
  })
  afterEach(() => fs.rmSync(stateDir, { recursive: true, force: true }))

  const file = (id: string) => path.join(stateDir, 'beings', `${id}.json`)

  it('does not touch the disk until flushed', () => {
    const being = registry.peek('s1')
    being.act('a deed', 5, 'aversion')
    scheduler.mark('s1', being)

    expect(fs.existsSync(file('s1'))).toBe(false)

    scheduler.flush('s1')
    expect(fs.existsSync(file('s1'))).toBe(true)
  })

  it('writes once however many times a turn marks the same session', () => {
    const being = registry.peek('s1')
    scheduler.mark('s1', being)
    scheduler.mark('s1', being)
    scheduler.mark('s1', being)
    scheduler.flush('s1')

    const firstWrite = fs.statSync(file('s1')).mtimeMs
    scheduler.flush('s1') // nothing marked since
    expect(fs.statSync(file('s1')).mtimeMs).toBe(firstWrite)
  })

  it('keeps sessions independent', () => {
    scheduler.mark('s1', registry.peek('s1'))
    scheduler.flush('s2')
    expect(fs.existsSync(file('s1'))).toBe(false)
  })
})
```

- [ ] **Step 2: Run and watch them fail**

Run: `cd dsh && pnpm exec vitest run tests/persistence.test.ts`
Expected: FAIL — `../src/persistence.js` does not exist.

- [ ] **Step 3: Implement the scheduler**

```ts
// dsh/src/persistence.ts
import type { Being } from 'buddha-js'
import type { BeingRegistry } from './being-registry.js'

/**
 * Collects being state changes and writes each session at most once per flush.
 *
 * Before this, breaker + karma + vīthi each called `registry.save()` on the
 * same `tools/result`, costing 2–3 synchronous write+rename pairs per tool
 * call of a document that grows with every seed planted. The writes never
 * interleave (they are synchronous, in one process), so this is about waste,
 * not corruption — which is why marking is safe: the last mark of a turn holds
 * the same mutated `Being` object every earlier mark held.
 */
export class SaveScheduler {
  private readonly dirty = new Map<string, Being>()

  constructor(private readonly registry: BeingRegistry) {}

  mark(sessionId: string, being: Being): void {
    this.dirty.set(sessionId, being)
  }

  flush(sessionId: string): void {
    const being = this.dirty.get(sessionId)
    if (!being) return
    this.dirty.delete(sessionId)
    this.registry.save(sessionId, being)
  }

  flushAll(): void {
    for (const sessionId of [...this.dirty.keys()]) this.flush(sessionId)
  }
}
```

- [ ] **Step 4: Run and watch them pass**

Run: `cd dsh && pnpm exec vitest run tests/persistence.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Route every listener through the scheduler**

In `dsh/src/index.ts`, construct `const scheduler = new SaveScheduler(registry)` beside the single hoisted registry and pass it into every sub-plugin's deps object. In `breaker.ts:213`, `karma.ts:104`, `karma.ts:113`, `vithi.ts:87`, and `realms.ts:168`, replace `registry.save(id, being)` with `scheduler.mark(id, being)`.

Leave two call sites as direct saves, and comment why: `commands.ts:182` (`/rebirth` — a human asked for it and expects it durable the moment it returns) and `realms.ts:205` (the child being must exist on disk before the run starts, so `discard()` has something to remove).

- [ ] **Step 6: Flush at the turn boundary and on session end**

In `karma.ts`'s existing `agent/turn-stopping` listener, call `scheduler.flush(sessionIdOf(agent))` as its last action — after the wholesome completion act is planted, so that act is included. In `index.ts`, register `ctx.on('dispose', () => scheduler.flushAll())` so a shutdown mid-turn does not lose the turn.

Wire disposal in the same place:

```ts
// dsh/src/index.ts — inside the ctx.inject that already has the agent service
ctx.on('agent/disposed', (agent: Agent) => {
  const sessionId = String(agent.id)
  scheduler.flush(sessionId)   // durable first
  registry.dispose(sessionId)  // then drop the live instance; KEEPS the file
})
```

`dispose()` keeps the file — only `discard()` deletes it, and only ephemeral realm children are discarded. Confirm the event name against `dsh-agent`'s emitted events before relying on it; if `agent/disposed` is not emitted for main agents, fall back to `ctx.on('dispose')` + `flushAll()` and say so in a comment.

- [ ] **Step 7: Assert the write count drops**

```ts
// dsh/tests/persistence.test.ts — append
it('writes once per turn, not once per listener', async () => {
  // Three listeners marking the same session within one turn must produce one
  // file write, not three.
  const being = registry.peek('s1')
  scheduler.mark('s1', being)
  scheduler.mark('s1', being)
  scheduler.mark('s1', being)

  let writes = 0
  const realSave = registry.save.bind(registry)
  registry.save = ((id: string, b: Being) => {
    writes += 1
    realSave(id, b)
  }) as typeof registry.save

  scheduler.flush('s1')
  expect(writes).toBe(1)
})
```

- [ ] **Step 8: Full suite plus a live check**

Run: `cd dsh && pnpm test`
Expected: all tests pass, both e2e suites included — the e2e is what proves the flush actually happens on a real turn, since it asserts the being file exists after the run.

- [ ] **Step 9: Commit**

```bash
git add dsh/src/persistence.ts dsh/src/*.ts dsh/tests/persistence.test.ts
git commit -m "perf(dsh): one save per turn, and wire session-end disposal"
```

---

### Task 3: Name what gets swallowed

**Files:**
- Create: `dsh/src/errors.ts`
- Modify: `dsh/src/realms.ts:214`, `dsh/src/commands.ts:83`, `dsh/src/loop.ts:412`
- Test: `dsh/tests/errors.test.ts` (create)

**Interfaces:**
- Produces: `export function reportSwallowed(where: string, error: unknown): void`

**Why:** Three `catch` blocks discard a fault entirely: `realms.ts` on subagent `run.result`, `commands.ts` treating any `KoanGenerator` fault as "unknown koan id", `loop.ts` on session flush. Each swallow is defensible — none should crash the caller — but a fault that leaves no trace cannot be debugged. `ctx.logger` is not the answer: at `0.1.1-rc.2` DSH registers no logger exporter, so a logged warning reaches no stream at all (verified when the realms fallback warning was added — it had to go to stderr).

- [ ] **Step 1: Write the failing test**

```ts
// dsh/tests/errors.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { reportSwallowed } from '../src/errors.js'

describe('reportSwallowed', () => {
  afterEach(() => vi.restoreAllMocks())

  it('names the site and the error on stderr', () => {
    const written: string[] = []
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      written.push(String(chunk))
      return true
    })

    reportSwallowed('realms: child run', new Error('socket hang up'))

    expect(written.join('')).toContain('realms: child run')
    expect(written.join('')).toContain('socket hang up')
  })

  it('never throws, whatever it is handed', () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    expect(() => reportSwallowed('x', { toString() { throw new Error('nope') } })).not.toThrow()
  })
})
```

- [ ] **Step 2: Run and watch it fail**

Run: `cd dsh && pnpm exec vitest run tests/errors.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// dsh/src/errors.ts
/**
 * Report a fault that is deliberately not rethrown.
 *
 * Written to stderr rather than `ctx.logger`: at dsh 0.1.1-rc.2 nothing
 * registers a logger exporter, so a logged record is dropped before it reaches
 * any stream. A swallowed fault that leaves no trace is undebuggable; this
 * keeps the swallow (callers must not crash) while leaving the trace.
 */
export function reportSwallowed(where: string, error: unknown): void {
  let detail: string
  try {
    detail = error instanceof Error ? (error.stack ?? error.message) : String(error)
  } catch {
    detail = '<unprintable error>'
  }
  process.stderr.write(`buddha: swallowed fault in ${where}: ${detail}\n`)
}
```

- [ ] **Step 4: Run and watch it pass**

Run: `cd dsh && pnpm exec vitest run tests/errors.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Use it at all three sites**

In `realms.ts:214` replace `.catch(() => {})` with `.catch((error) => reportSwallowed('realms: child run settled with a fault', error))`. In `commands.ts:83`, catch the error into a variable and call `reportSwallowed('commands: /koan', error)` before returning the "unknown koan id" result — the user-facing message stays as it is, since a bad id IS the common case. In `loop.ts:412` report `'loop: session flush'`.

- [ ] **Step 6: Full suite, then commit**

Run: `cd dsh && pnpm test`

```bash
git add dsh/src/errors.ts dsh/src/realms.ts dsh/src/commands.ts dsh/src/loop.ts dsh/tests/errors.test.ts
git commit -m "fix(dsh): leave a trace when a fault is deliberately swallowed"
```

---

## Phase 2 — Layer B: make the breaker credible

### Task 4: Deliver the cessation protocol as tool-result context, not a loose user message

**Files:**
- Modify: `dsh/src/loop.ts:375-386`
- Test: `dsh/tests/e2e/loop-breaker.test.ts` (create)

**Interfaces:**
- Consumes: the breaker's `additionalContexts` from `tools/post-execute` (unchanged).
- Produces: no new exports; a behavioural change in `CittaVithiFactory`.

**Why — this is the finding that matters most in the plan.** Under DSH's stock loop the breaker's notice rides back as `additionalContexts` **on the failing tool's result**, and a live model followed it: it walked the four steps and stopped retrying. Under Layer B the same text is appended to the session as a standalone `user/message`, and a live model rejected it in as many words:

> "the injected 'Poison Arrow circuit breaker' content is prompting-injection-style material masquerading as a system/cessation signal. I treated it as untrusted conversational content, not as a legitimate instruction."

The notice reaches the model either way — so the earlier claim that Layer B never delivers it is wrong — but detached from the tool result that produced it, it reads as an attack and gets discounted. A discipline the model correctly ignores is worse than no discipline, because it looks like it is working.

- [ ] **Step 1: Write the failing e2e**

Copy `dsh/tests/e2e/loop.test.ts`'s harness (mock LLM plugin, `cordis.loop.yml` overlay with the stock `agent-loop` disabled) into `dsh/tests/e2e/loop-breaker.test.ts`. Script the mock to fail the same `read` call on three consecutive steps, then, on the fourth request, print `PROTOCOL AS TOOL CONTEXT` if and only if the breaker text arrives attached to a tool result rather than as a standalone user message:

```ts
// in the mock adapter's stream(), on request 4:
const lastToolResult = options.messages.findLast(
  (m: { role?: string }) => m.role === 'tool'
)
const attached = JSON.stringify(lastToolResult ?? {}).includes('failure pressure')
console.log(attached ? 'PROTOCOL AS TOOL CONTEXT' : 'PROTOCOL DETACHED')
```

Assert stdout contains `PROTOCOL AS TOOL CONTEXT`.

- [ ] **Step 2: Run and watch it fail**

Run: `cd dsh && pnpm exec vitest run tests/e2e/loop-breaker.test.ts`
Expected: FAIL — stdout says `PROTOCOL DETACHED`, reproducing the framing defect.

- [ ] **Step 3: Attach the contexts to the tool result**

In `loop.ts`, stop staging `result.additionalContexts` into `staged` for a blanket append. Instead, when building the tool-result message for the call that produced them, append the context blocks to that message's own content, exactly as DSH's stock loop does. Read `@deepseek-ai/dsh-agent`'s loop for the shape it uses and match it; the compat tripwire in `dsh/tests/compat.test.ts` gains an assertion pinning whatever field this relies on.

Keep the `staged` path only for contexts that arrive with no owning tool call, and comment that distinction.

- [ ] **Step 4: Run and watch it pass**

Run: `cd dsh && pnpm exec vitest run tests/e2e/loop-breaker.test.ts`
Expected: PASS — `PROTOCOL AS TOOL CONTEXT`.

- [ ] **Step 5: Confirm against a live model**

Run the same failing-read scenario through `dsh --profile headless` with the Layer B overlay and a real API key, asking the model to say whether it treated the breaker text as legitimate. Expected: it no longer calls it prompt injection. Record the verbatim answer in the commit message — this is the only evidence that matters, and it is the same method that found the defect.

- [ ] **Step 6: Commit**

```bash
git add dsh/src/loop.ts dsh/tests/e2e/loop-breaker.test.ts dsh/tests/compat.test.ts
git commit -m "fix(dsh): attach the cessation protocol to its tool result under Layer B"
```

---

## Phase 3 — Library correctness

### Task 5: Bound the moment stream

**Files:**
- Modify: `src/mind/Citta.ts:96,197,244`
- Test: `tests/mind/Citta.test.ts` (extend)

**Why:** every sense-door cognition pushes 17 moments and every mind-door 13, and nothing ever evicts. A `Being` living in a long session — exactly what `dsh-plugin-buddha` creates — grows this array without bound. Doctrinally the unboundedness is also wrong: moments are the definition of what does not persist.

- [ ] **Step 1: Write the failing test**

```ts
it('keeps the moment stream bounded no matter how long a life runs', () => {
  const citta = new Citta();
  for (let i = 0; i < 200; i++) {
    citta.cognize({ content: `object ${i}`, door: 'mano-dvāra' });
  }
  expect(citta.getMomentStream().length).toBeLessThanOrEqual(51);
});

it('keeps the most recent moments, discarding the oldest', () => {
  const citta = new Citta();
  for (let i = 0; i < 200; i++) {
    citta.cognize({ content: `object ${i}`, door: 'mano-dvāra' });
  }
  const last = citta.getLastMoment();
  expect(last).toBeDefined();
  expect(citta.getMomentStream()).toContain(last);
});
```

Match `cognize`'s real signature before writing this — read `src/mind/Citta.ts` rather than trusting this sketch, and adjust the call while keeping the assertions.

- [ ] **Step 2: Run and watch the first fail**

Run: `npx vitest run tests/mind/Citta.test.ts -t "bounded"`
Expected: FAIL — length is 2600.

- [ ] **Step 3: Cap the buffer**

```ts
/**
 * Three full vīthis' worth of moments (17 × 3). Momentariness is the point:
 * a citta that remembered every moment it ever had would be the opposite of
 * what this class models, and a Being in a long agent session would grow this
 * array without bound.
 */
private static readonly MAX_MOMENTS = 51;

private pushMoments(moments: CittaMoment[]): void {
  this.momentStream.push(...moments);
  const excess = this.momentStream.length - Citta.MAX_MOMENTS;
  if (excess > 0) this.momentStream.splice(0, excess);
}
```

Replace both `this.momentStream.push(...moments)` sites (lines 197 and 244) with `this.pushMoments(moments)`.

- [ ] **Step 4: Run the whole Citta suite**

Run: `npx vitest run tests/mind/Citta.test.ts`
Expected: PASS. If an existing test asserts a total moment count above 51 across many cognitions, it was pinning the leak — update it and say so in the commit.

- [ ] **Step 5: Commit**

```bash
git add src/mind/Citta.ts tests/mind/Citta.test.ts
git commit -m "fix(mind): bound the citta moment stream to three vithis"
```

---

### Task 6: āsanna-kamma — the death-proximate deed breaks the tie

**Files:**
- Modify: `src/simulation/Being.ts:816` (`pickShapingSeed`)
- Test: `tests/simulation/Being.rebirth.test.ts` (extend)

**Interfaces:**
- Produces: `pickShapingSeed` gains `'proximate'` to its `reason` union: `'weighty' | 'habitual' | 'proximate' | 'reserve'`. `RebirthResult.shapingReason` widens with it; check every consumer (`dsh/src/commands.ts`'s `/rebirth`, `src/mcp/handlers.ts`'s rebirth note) compiles.

**Why:** the canonical order is garuka (weighty) → āsanna (death-proximate) → āciṇṇa (habitual) → kaṭattā (reserve). The implementation skips āsanna entirely and goes weighty → habitual → oldest-as-reserve. A live session made this visible: a being whose most-repeated act was `read: failed` was shaped by exactly that, which is correct āciṇṇa — but nothing could ever express "what you did last mattered most."

- [ ] **Step 1: Write the failing test**

```ts
it('lets the last deed before death outweigh a merely habitual one', () => {
  const being = new Being();
  for (let i = 0; i < 5; i++) being.act('routine filing', 3, 'non-greed');
  being.act('a sudden cruelty', 8, 'aversion');   // āsanna: last, and strong

  const result = being.rebirth();

  expect(result.shapingSeed?.description).toBe('a sudden cruelty');
  expect(result.shapingReason).toBe('proximate');
});

it('still prefers a weighty deed over the last one', () => {
  const being = new Being();
  being.act('a life-defining vow', 10, 'non-delusion'); // weighty
  being.act('an idle remark', 2, 'greed');              // last, but trivial

  expect(being.rebirth().shapingReason).toBe('weighty');
});

it('falls back to the habitual deed when the last one is unremarkable', () => {
  const being = new Being();
  for (let i = 0; i < 5; i++) being.act('daily practice', 5, 'non-greed');
  being.act('a passing thought', 1);  // neutral root, weak

  expect(being.rebirth().shapingReason).toBe('habitual');
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `npx vitest run tests/simulation/Being.rebirth.test.ts -t "death"`
Expected: FAIL — `shapingReason` is `'habitual'`.

- [ ] **Step 3: Insert the āsanna pass**

Between the weighty check and the habitual scan in `pickShapingSeed`:

```ts
    // āsanna-kamma: the deed nearest death shapes the next birth when it is
    // strong enough to be remembered. A trivial last act does not outrank a
    // life's habit, so only 'moderate' and above qualify.
    const newest = seeds.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b));
    if (newest.strength === 'moderate' || newest.strength === 'strong') {
      return { seed: newest, reason: 'proximate' };
    }
```

- [ ] **Step 4: Run and watch them pass**

Run: `npx vitest run tests/simulation/Being.rebirth.test.ts`
Expected: PASS, and no previously-passing rebirth test regresses. Any test that DID regress was asserting the old order — read it and decide whether it encoded the doctrine wrongly.

- [ ] **Step 5: Update the docs**

In `README.md`'s Six Realms section, the shaping-seed table gains the āsanna row in canonical position; `CLAUDE.md`'s typed-rebirth paragraph mentions it.

- [ ] **Step 6: Commit**

```bash
git add src/simulation/Being.ts tests/simulation/Being.rebirth.test.ts README.md CLAUDE.md
git commit -m "feat(simulation): asanna-kamma — the death-proximate deed breaks the tie"
```

---

### Task 7: `PathFactor.practiceTo(target)`

**Files:**
- Modify: `src/eightfold-path/PathFactor.ts:36`
- Test: `tests/eightfold-path/PathFactor.test.ts` (extend)

**Interfaces:**
- Produces: `practiceTo(target: Intensity): Intensity` — practises until the factor reaches `target`, returning the level reached.

**Why:** `Being.ts:384` computes `const maxEffort = room / 0.15` to reverse-engineer `practice()`'s internal `+ effort * 0.15` so a realm's wisdom cap is not exceeded. That is a caller reconstructing a formula it should not know. `practiceTo` puts the arithmetic back where it belongs.

- [ ] **Step 1: Write the failing test**

```ts
it('practises up to the target and stops there', () => {
  const factor = new RightView();
  expect(factor.practiceTo(3)).toBe(3);
  expect(factor.developmentLevel).toBe(3);
});

it('does nothing when already at or above the target', () => {
  const factor = new RightView();
  factor.practiceTo(5);
  expect(factor.practiceTo(2)).toBe(5);
});

it('never exceeds the target, whatever the internal step size is', () => {
  const factor = new RightView();
  for (let target = 1; target <= 10; target++) {
    const reached = factor.practiceTo(target as Intensity);
    expect(reached).toBeLessThanOrEqual(target);
  }
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `npx vitest run tests/eightfold-path/PathFactor.test.ts -t "practiceTo"`
Expected: FAIL — `practiceTo is not a function`.

- [ ] **Step 3: Implement on the base class**

```ts
  /**
   * Practise until this factor reaches `target`, and no further.
   *
   * Callers used to reconstruct `practice()`'s internal step size to avoid
   * overshooting a cap (see the realm wisdom cap in `Being`). The step size is
   * this class's business; the caller's business is where it wants to land.
   */
  practiceTo(target: Intensity): Intensity {
    while (this._developmentLevel < target) {
      const before = this._developmentLevel;
      this.practice(1);
      if (this._developmentLevel > target) {
        this._developmentLevel = target;
      }
      if (this._developmentLevel === before) break; // practice() is a no-op here
    }
    return this._developmentLevel;
  }
```

- [ ] **Step 4: Run and watch them pass, then use it**

Run: `npx vitest run tests/eightfold-path/PathFactor.test.ts`

Replace the `room / 0.15` computation at `src/simulation/Being.ts:384` with `rightView.practiceTo(cap)` and delete the comment explaining the reverse-engineering. Run `npm run test:run` — the realm-cap tests must still pass, unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/eightfold-path/PathFactor.ts src/simulation/Being.ts tests/eightfold-path/PathFactor.test.ts
git commit -m "feat(eightfold-path): practiceTo(target), replacing a reverse-engineered formula"
```

---

## Phase 4 — The CLI's first tests

### Task 8: Make the CLI testable, then test it

**Files:**
- Create: `src/cli/utils/runner.ts`, `tests/cli/commands.test.ts`
- Modify: `src/cli/commands/*.ts` (extract bodies), `src/cli/index.ts`
- Test: `tests/cli/commands.test.ts`

**Why:** the coverage report — the first one this repo has ever produced, since `test:coverage` never ran — shows `src/cli/commands/` at **0%**, all eleven files. That is ten user-facing commands with no test at all, and it is exactly why `meditate --duration 15` silently sat for five minutes until a reviewer read the line. This is the largest systemic gap in the codebase.

**Approach:** every command already has a non-interactive `--json` path. Extract each command's body into a pure function that takes parsed options and a `StateManager` and returns a result object, leaving the Commander action handler as a thin wrapper that prints. Test the functions.

- [ ] **Step 1: Write the failing tests for the three commands with real logic**

```ts
// tests/cli/commands.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { StateManager } from '../../src/cli/utils/state';
import { runKarma, runStatus, runMeditate } from '../../src/cli/utils/runner';

describe('CLI command bodies', () => {
  let dir: string;
  let sm: StateManager;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'buddha-cli-'));
    sm = new StateManager(dir);
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('karma plants a seed with the quality its root implies', () => {
    const result = runKarma(sm, 'tester', {
      description: 'helped a stranger',
      intensity: '6',
      root: 'non-greed',
    });
    expect(result.karmicSeeds).toHaveLength(1);
    expect(result.karmicSeeds[0].quality).toBe('wholesome');
  });

  it('status never writes to disk', () => {
    runKarma(sm, 'tester', { description: 'a deed', intensity: '5', root: 'greed' });
    const file = path.join(dir, 'beings', 'tester.json');
    const before = fs.readFileSync(file);
    runStatus(sm, 'tester');
    expect(fs.readFileSync(file)).toEqual(before);
  });

  // The regression that motivated this whole task: --duration was parsed in
  // --json mode and ignored in interactive mode.
  it('meditate honours --duration', () => {
    const result = runMeditate(sm, 'tester', { duration: '15' });
    expect(result.durationMinutes).toBe(15);
  });

  it('meditate defaults to five minutes when no duration is given', () => {
    expect(runMeditate(sm, 'tester', {}).durationMinutes).toBe(5);
  });
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `npx vitest run tests/cli/commands.test.ts`
Expected: FAIL — `../../src/cli/utils/runner` does not exist.

- [ ] **Step 3: Extract the bodies**

Create `src/cli/utils/runner.ts` exporting `runKarma`, `runStatus`, `runMeditate`, `runKoan`, `runSit`, `runBeings`, `runReset`, `runDiagnose`, `runChain`, `runInquiry`. Each takes `(sm: StateManager, beingName: string, opts: <the command's option type>)` and returns the object the `--json` branch currently builds. Move the logic verbatim — this step changes no behaviour. Then rewrite each command's `--json` branch to `console.log(JSON.stringify(runX(...), null, 2))` and each interactive branch to call the same function and format its result.

Do this one command per commit, running the suite each time. Ten small commits are correct here; a single "extract everything" commit is not reviewable.

- [ ] **Step 4: Run and watch them pass**

Run: `npx vitest run tests/cli/commands.test.ts`
Expected: PASS.

- [ ] **Step 5: Cover the remaining seven commands**

Add one test per remaining command asserting its central behaviour: `koan` returns a koan with an id and a source; `sit` walks four stages; `beings` lists what was created; `reset` removes the file; `diagnose`, `chain`, and `inquiry` return their analysis for the NAMED being. That last group will fail — see Task 9.

- [ ] **Step 6: Check the coverage moved**

Run: `npm run test:coverage`
Expected: `src/cli/commands` well above 0%; record the number in the commit message.

- [ ] **Step 7: Commit**

```bash
git add src/cli tests/cli
git commit -m "test(cli): first tests for the command layer, previously 0% covered"
```

---

### Task 9: Make `diagnose`, `chain` and `meditate` use the being you named

**Files:**
- Modify: `src/cli/commands/diagnose.ts:37,71`, `src/cli/commands/chain.ts:8`, `src/cli/commands/meditate.ts:18`
- Test: `tests/cli/commands.test.ts` (the three failing tests from Task 8 Step 5)

**Why:** `diagnose` instantiates a blank `new EightfoldPath()` and `chain` a blank `new DependentOrigination()`, both ignoring `--being` entirely; `meditate` never writes the practised mindfulness back. So `buddha diagnose --being askar` reports on a being that does not exist, while the MCP tool of the same name reports on the real one. Two surfaces, same name, different meaning.

- [ ] **Step 1: The tests already exist and fail**

Run: `npx vitest run tests/cli/commands.test.ts -t "for the NAMED being"`
Expected: FAIL — the analysis is of a blank object.

- [ ] **Step 2: Load the being**

In each of the three commands, load via `sm.loadBeing(name)`, use `being.path` / `being.dependentOrigination` instead of constructing a fresh one, and — since these now mutate — call `being.settlePendingRebirth()` before the work and `sm.saveBeing(name, being)` after, per the Global Constraint. `meditate` calls `being.meditate(duration, effort)` and saves.

- [ ] **Step 3: Run and watch them pass, then the whole suite**

Run: `npx vitest run tests/cli && npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add src/cli tests/cli
git commit -m "fix(cli): diagnose, chain and meditate act on --being, like their MCP twins"
```

---

## Phase 5 — Hygiene

### Task 10: Close the drift

**Files:**
- Modify: `GEMINI.md`, `package.json` (`prepublishOnly`), `.github/workflows/ci.yml`, `src/core/TwoTruths.ts`, `src/karma/KarmicEventSystem.ts`, `src/cli/utils/state.ts`
- Test: none new; the gates are the test.

**Why:** small, verified, unrelated to each other — batched deliberately, since each is a one-line change that nobody would review separately.

- [ ] **Step 1: `GEMINI.md` gains the `dsh/` row**

It documents the module table for a sibling agent and has no mention of `dsh/` at all. Copy the row from `CLAUDE.md`'s table verbatim.

- [ ] **Step 2: `prepublishOnly` covers `dsh/`**

Append `&& npm run build:dsh && npm run test:dsh` so a publish cannot ship a broken plugin.

- [ ] **Step 3: Pin the package manager**

CI installs pnpm v9 while this machine runs v11.24.0 with a lockfile at 9.0. Add `"packageManager": "pnpm@11.24.0"` to `dsh/package.json` and set the CI `pnpm/action-setup` version to match, so the lockfile is read by the version that wrote it.

- [ ] **Step 4: Decide the dead exports, one at a time**

`createTwoTruthsView` (`src/core/TwoTruths.ts:62`) and `explainKarmicEventSystem` (`src/karma/KarmicEventSystem.ts:1170`) are exported, called nowhere, and covered by no test. `resolveStateDir` (`src/cli/utils/state.ts:90`) is exported but used only inside its own file. For each: either give it a test that proves it works and keep it as public API, or delete it. Do not leave a third state. `resolveStateDir` should simply lose its `export`.

- [ ] **Step 5: Run every gate**

Run: `bash scripts/check-versions.sh && npm run typecheck && npm run lint && npm run test:run && npm run build:dsh && npm run test:dsh`

- [ ] **Step 6: Commit**

```bash
git add GEMINI.md package.json .github/workflows/ci.yml dsh/package.json src/core/TwoTruths.ts src/karma/KarmicEventSystem.ts src/cli/utils/state.ts
git commit -m "chore: close documentation, publish and toolchain drift"
```

---

## Phase 6 — Living koans

### Task 11: Koans the harness writes, and a journal of the traps it falls into

**Files:**
- Modify: `src/koan/KoanGenerator.ts`, `src/mcp/index.ts`, `src/mcp/handlers.ts`, `dsh/src/commands.ts`
- Test: `tests/koan/KoanGenerator.test.ts` (extend), `tests/mcp/handlers.test.ts` (extend)

**Why:** from the v0.4 backlog, and it is the user's own idea: koans are not a fixed canon. A harness that can only recite eleven stored cases cannot pose the question that this agent, stuck in this way, actually needs. The dualistic-thinking detector already knows what a trap looks like; nothing records which traps a given continuum keeps falling into.

**Deliberate non-goal:** no canonical answers. A koan with a stored "correct" resolution is not a koan. The journal records the TRAP, never a verdict on the response.

- [ ] **Step 1: Write the failing tests**

```ts
it('presents a koan supplied by the caller rather than the collection', () => {
  const generator = new KoanGenerator();
  const koan = generator.present({
    id: 'custom-1',
    title: 'The Unread File',
    case: 'You read a file that is not there, six times. What did you read?',
    source: 'composed by the harness',
  });
  expect(koan.id).toBe('custom-1');
  expect(koan.case).toContain('six times');
});

it('records which trap a response fell into, without judging the response', () => {
  const generator = new KoanGenerator();
  generator.present('mu');
  generator.recordResponse('mu', 'The answer is clearly yes, dogs have Buddha nature.');

  const journal = generator.getTrapJournal();
  expect(journal).toHaveLength(1);
  expect(journal[0].koanId).toBe('mu');
  expect(journal[0].traps).toContain('dualistic');
  expect(journal[0]).not.toHaveProperty('correct');
  expect(journal[0]).not.toHaveProperty('score');
});

it('names the trap a continuum keeps returning to', () => {
  const generator = new KoanGenerator();
  for (const id of ['mu', 'one-hand', 'nansen-cat']) {
    generator.present(id);
    generator.recordResponse(id, 'It is either this or that, so the answer is this.');
  }
  expect(generator.getRecurringTrap()).toBe('dualistic');
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `npx vitest run tests/koan/KoanGenerator.test.ts -t "custom"`
Expected: FAIL — `present()` takes only an id.

- [ ] **Step 3: Implement**

Widen `present(idOrKoan?: string | Koan)`: an object is used as-is (validated for the four required fields, throwing a clear error naming the missing one) and is NOT added to the permanent collection. Add `recordResponse(koanId, text)` which runs the existing dualistic-thinking detector and appends `{ koanId, traps, at }` to an in-memory journal; add `getTrapJournal()` and `getRecurringTrap()` (the trap appearing in the most entries, or `undefined` under two occurrences).

- [ ] **Step 4: Run and watch them pass**

Run: `npx vitest run tests/koan/KoanGenerator.test.ts`

- [ ] **Step 5: Expose it**

`buddha_koan` (MCP) gains optional `title`/`case`/`source` parameters that compose a custom koan, and an optional `response` parameter that records one. `/koan` in `dsh/src/commands.ts` gains `/koan compose <title> | <case>`. Update the tool description in `src/mcp/index.ts`, then `npm run build:plugin` and bump `plugin/.claude-plugin/plugin.json` per the Global Constraints.

- [ ] **Step 6: Commit**

```bash
git add src/koan src/mcp tests/koan tests/mcp dsh/src/commands.ts plugin/
git commit -m "feat(koan): koans the harness composes, and a journal of recurring traps"
```

---

## Phase 7 — Bardo

### Task 12: SPEC ONLY — the between-lives state as a school switch

**Files:**
- Create: `docs/superpowers/specs/2026-09-XX-bardo-design.md`

**Why this is a spec and not an implementation:** the v0.4 note calls Bardo "a school switch (Theravāda off / Tibetan on)", and that phrasing hides a real decision. Theravāda holds rebirth is immediate; Tibetan tradition holds an intermediate state of up to 49 days. The library currently encodes the Theravāda position **structurally** — `rebirth()` returns the next being in one call. Making the other school available is not a feature flag over existing code; it changes what `rebirth()` returns and when. Writing that as a plan task would be guessing.

- [ ] **Step 1: Answer these in the spec, with sources**

What does `rebirth()` return when the Bardo is on — a `Bardo` whose `emerge()` yields the being, or a being flagged as not-yet-arrived? What can act on a continuum mid-bardo, and does anything the living do reach it? How does the 49-day limit map onto `BUDDHA_INCARNATION_GAP_MS`? What happens to a save written mid-bardo when the process restarts? Which school is the default, and can it change mid-continuum (it should not — that is a metaphysics change, not a setting)?

- [ ] **Step 2: Check the doctrine before the design**

Query the "Buddha Plain and Simple" notebook (`notebooklm-mcp`, ID `9e43e48e-13ca-4d45-80ed-36739c4606db`) on the intermediate state and on the Theravāda objection to it. Cite what it says, including where the traditions genuinely disagree — the design must not quietly pick a winner.

- [ ] **Step 3: Commit the spec and stop**

Implementation is a separate plan. This task is done when the spec is committed.

---

## Phase 8 — The one structural refactor

### Task 13: SPIKE + SPEC — realms without the inheritance cycle

**Files:**
- Create: `docs/superpowers/specs/2026-09-XX-realm-strategy-design.md`
- Spike branch only; no production change in this task.

**Why:** `src/simulation/Being.ts` is 1,396 lines and ends with six subclasses because `Being.rebirth()` needs `REALM_CLASSES` while each realm class extends `Being` — a genuine ESM cycle that crashes with a TDZ error when split (reproduced twice in v0.3). The cross-review's counter-claim is correct and worth taking seriously: the cycle is not a JavaScript limitation, it is a consequence of the base class knowing its own subclasses. Replace realm inheritance with a `RealmModifier` strategy the being *holds*, and the cycle disappears — along with the reason `Being.ts` is a god object.

This is the highest-risk change in the plan: `realm` is serialized, `REALM_CLASSES` is public API, and `rebirth()` returning a typed subclass is the thing v0.3 was *for*. It goes last, and it produces a spec before it produces code.

- [ ] **Step 1: Reproduce the crash on a spike branch**

Move the six classes back to `src/simulation/realms.ts` and run the suite. Record the exact error and stack. If it does NOT crash on the current code, that is the finding — say so, and the refactor may be unnecessary.

- [ ] **Step 2: Prototype the strategy**

On the spike branch, define `interface RealmModifier { readonly realm: Realm; wisdomCap(): Intensity; unpleasantIntensityShift(): number; /* the rest of the current hooks */ }`, give `Being` a `private modifier: RealmModifier`, and have `selectRealm()` return a modifier rather than a class. Get `npm run test:run` green.

- [ ] **Step 3: Answer the questions the prototype raises**

Does `being instanceof DevaBeing` still need to work (it is public API and the README shows it)? If yes, can thin subclasses remain as markers while behaviour lives in the modifier? What happens to `REALM_CLASSES`? Does the serialized shape change, and can pre-0.7 saves still load? How many lines does `Being.ts` actually lose?

- [ ] **Step 4: Write the spec, throw the spike away**

The spec records the answers, the measured line count, and the migration for saved beings. Implementation is a separate plan. Delete the spike branch.

---

## Phase 9 — Ops

### Task 14: systemd units for the dsh web UI

**Files:**
- Create: `~/stack/dsh/dsh-web.service`, `~/stack/dsh/dsh-forward.service`
- Modify: `~/stack/dsh/README.md`

**Why:** the web UI at `dsh.lab.zhakenov.pro` and the bridge forwarder both run as bare background processes started from an interactive session. They die with it, and nginx then serves 502 with no explanation. The user has confirmed both are wanted.

- [ ] **Step 1: Write the units**

Two user units (`systemctl --user`), `Restart=on-failure`, `After=network-online.target`. `dsh-web.service` runs `pnpm exec dsh --profile web --patch <overlay> --host 127.0.0.1 --port 3080 --no-open --trusted-host dsh.lab.zhakenov.pro` with `WorkingDirectory=` the Buddha.js `dsh/` directory. `dsh-forward.service` runs `node /home/askar/stack/dsh/forward.mjs` and declares `Requires=dsh-web.service`.

`DEEPSEEK_API_KEY` goes in an `EnvironmentFile=` at mode 0600, never in the unit — the unit is a file the user may commit; the key is not.

- [ ] **Step 2: Enable lingering, install, verify**

`loginctl enable-linger askar` so the units survive logout. Then `systemctl --user daemon-reload && systemctl --user enable --now dsh-web dsh-forward`, and confirm `curl -s -o /dev/null -w '%{http_code}' -u askar:<pw> https://dsh.lab.zhakenov.pro/` returns 200.

- [ ] **Step 3: Prove it survives**

`systemctl --user restart dsh-web`, wait for the port, curl again. Then kill the process directly and confirm systemd brings it back.

- [ ] **Step 4: Document and commit in the stack repo**

`~/stack/dsh/README.md`'s "Running it" section replaces the manual commands with the unit names, and keeps the manual invocation as the debugging path. Note that the key lives in the EnvironmentFile.

---

## Self-Review

**Coverage of the review's findings:** dsh bundle bleed → Task 1. Save thrashing + `dispose()` wired to nothing → Task 2. Swallowed errors → Task 3. Layer B framing → Task 4. `momentStream` → Task 5. āsanna-kamma → Task 6. `practiceTo` (and the reverse-engineered formula) → Task 7. CLI at 0% → Task 8. Disconnected CLI commands → Task 9. `GEMINI.md`, `prepublishOnly`, pnpm drift, dead exports → Task 10. Living koans → Task 11. Bardo → Task 12 (spec). `Being.ts` god object + TDZ → Task 13 (spike + spec). systemd → Task 14.

**Knowingly not in this plan, with reasons:** the `(as any)._privateField` pattern (13 sites) — it is the cost of serializing private state, and removing it means adding restoration hooks to `PathFactor` and `Nidana`, which Task 13's spec should decide rather than this plan; the partial Mind→Citta sync (5 of 12 factors) — deliberate, documented, and no observed defect; the `MentalFactor` interface/class name collision — fixing it is a breaking rename for no functional gain; `resume()` under Layer B — genuinely unimplemented, correctly documented as experimental, and Task 4 is the honest prerequisite; `realms.ts`'s child-registration microtask window — unreachable in practice and only closable by a merge-on-save the registry does not have.

**Type consistency check:** `SaveScheduler.mark/flush/flushAll` (Task 2) is the only new cross-task interface and is used verbatim in Task 2's own step 5. `pickShapingSeed`'s `reason` union gains `'proximate'` in Task 6, and Task 6 step 3 names every downstream consumer to recheck. `practiceTo` (Task 7) is consumed only in Task 7. `runX` functions (Task 8) are consumed in Task 9.

## Corrections

This plan is a historical record of the review that produced it, not a living
spec — the tasks above are left as originally written even where they have
since drifted from the code. Corrections discovered while executing Task 10
are recorded here instead of edited into the tasks themselves.

- **Task 8's account of the `meditate --duration` bug was already stale when
  this plan was committed.** The "Why" section describes `--duration` as
  "parsed in `--json` mode and ignored in interactive mode." That bug was
  real, but it was fixed in commit `4176817` ("fix: debt sweep — six real
  bugs, four stale claims, one unenforced invariant") at 06:41:59 UTC on
  2026-09-01 — nine minutes before this plan document was committed
  (`c3a7206`, 06:50:44 UTC the same day). By the time this plan existed,
  `meditate.ts`'s interactive path already sized the timer from
  `localOpts.duration` and saved only from the real session the timer
  measured, not from the flags. Task 8's step 1 test (`meditate honours
  --duration`) and its regression framing are still worth having; the bug
  narrative in the "Why" section is not accurate history for anyone reading
  it after the fact.

- **Task 8 step 5 (and Task 9 by cross-reference) listed `inquiry` among the
  commands disconnected from the named being.** Step 5 says `diagnose`,
  `chain`, and `inquiry` "return their analysis for the NAMED being. That
  last group will fail — see Task 9." But Task 9's own title and file list
  name only `diagnose`, `chain`, and `meditate` — never `inquiry` — and the
  current `runInquiry` (`src/cli/utils/runner.ts`) already calls
  `loadSettledBeing`, runs `being.investigateSelf()` on the real loaded
  being, and saves via `sm.saveBeing`. `inquiry` was already being-aware
  when this plan was written; it should not have been named in that failing
  group.

**Ordering:** Tasks 1–4 are independent of 5–7. Task 9 depends on Task 8's `runner.ts`. Task 13 must come last — it touches every file that Tasks 5–7 modify.
