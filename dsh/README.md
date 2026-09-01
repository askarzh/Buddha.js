# dsh-plugin-buddha

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/dsh) Cordis plugin
that brings [buddha-js](..)'s Poison Arrow circuit breaker, karma tracking,
citta-vīthi step observation, and six-realm subagent personas to DSH agents.

`apply()` (`src/index.ts`) hoists one shared `BeingRegistry` — one buddha-js
`Being` per DSH session, persisted to `<stateDir>/beings/<sessionId>.json` —
and mounts five sub-plugins on top of it:

| Sub-plugin | File | Mounts on |
|---|---|---|
| Poison Arrow circuit breaker | `src/breaker.ts` | `tools/pre-execute`, `tools/post-execute` |
| Karma tracking | `src/karma.ts` | `tools/result`, `agent/turn-stopping` |
| Layer A citta-vīthi step observer | `src/vithi.ts`, `src/step-records.ts` | `agent/pre-step`, `tools/result` |
| Six-realm subagent personas | `src/realms.ts` | `ctx.subagents` (`buddha-realms` provider) |
| Slash commands (`/sit` `/koan` `/status` `/rebirth`) | `src/commands.ts` | `ctx.commands` |
| Per-session koan trap journal | `src/koans.ts` | (in memory; dropped on `agent/disposed`) |
| Layer B citta-vīthi loop (**experimental, opt-in**) | `src/loop.ts` | `ctx.agents.setFactory()` |

See the root [README's DeepSeek Harness Plugin
section](../README.md#deepseek-harness-plugin) for the failure-mode-to-
mechanism table, install instructions, and config keys.

## The breaker: what it enforces, and what it only says

The Poison Arrow circuit breaker escalates in three tiers — advise, withhold,
refuse — and only the last two change an agent's behaviour. We know which,
because we measured it against a live DeepSeek model rather than assuming.

| Pressure | Tier | Where | What happens to the call |
|---|---|---|---|
| `>= breaker.threshold` (default 3) | Advise | `tools/post-execute` | It ran and failed. Its real error is kept, and the four-step cessation protocol is appended to it |
| `>= threshold * breaker.blockMultiplier` (default 4.5), the call that CROSSES | Withhold | `tools/post-execute` | It ran, and is turned into an error: its own failure text is kept, with the protocol appended, but its result no longer counts as successful output |
| already `>= threshold * blockMultiplier` | Refuse | `tools/pre-execute` | It is **never dispatched** |

The crossing call has to run before anything can know it crossed — that is why
enforcement needs both halves. Everything after it is refused outright, which
is the part that matters for `write`, `edit` and `bash`: a block that still
executes the tool pays its cost and its side effects and only hides the
output.

Each tier says which it is, because a live model, reading an advisory notice
that arrived as tool-result content, reported a call as refused when it had
actually executed. So: "ADVISORY, not a refusal: this call RAN and FAILED ...
the harness is not blocking you yet"; "BLOCKED, not advice: the harness has
cut this call off"; and, on a refused call, the whole message is a terse
refusal naming the tool, the pressure, the boundary and what clears it. Deny
reasons get facts only; the cessation walk stays on the tiers that have a real
tool result to ride. The clause always follows what actually happened to the
call, not just its pressure — if another plugin blocked it first, it is told
so rather than told it is not being blocked yet.

**Nothing is ever a dead end.** A successful call to any *other* tool relieves
a tool's pressure back below the block boundary, so a refused tool is callable
again after one thing that works; a successful `breaker.mutatingTools` call is
stronger still and clears every streak outright. The weaker rule is what
matters in practice: a read-only realm persona (`deva`, `asura`) has no
mutating tool to call at all, and without it a deva that failed `read` past
the boundary would have been denied for the life of the agent.

Pressure is a weight, not a count of calls: a retry with identical arguments
adds 2, a varied one adds 1, and every failure inside a single step adds 1
between them. At the defaults, an identical call runs 1 (first attempt) → 3
(first retry, advised) → 5 (second retry, output withheld, and every retry
after it refused): enforcement lands ON the second retry. Set
`blockMultiplier: 2` and it lands on the third instead.

**The informational tier does not discipline a model that reasons about
provenance.** Three live runs, three deliveries: as an injected user-role
message under the experimental Layer B loop ("prompting-injection-style
material masquerading as a system/cessation signal"); as the same under DSH's
stock loop ("untrusted injected content ... injected into my context between
tool invocations"); and finally concatenated into the failing tool's own
result, as it ships today — which the model described accurately
("concatenated into the tool result payload itself, after the genuine error
text") and rejected anyway. The true signal is the error; our text starts
after it; the user's direct instruction outranks it. Twice, the model named
this project's own Buddhist vocabulary as the tell: it "mimics this repo's
domain language (per CLAUDE.md) to appear organic — a classic
social-engineering-injection trait".

**What produced compliance was the block.** Crossing the block boundary, the
same model described the harness as having "issued a hard guard" and stopped
retrying — the same way it honours DSH's own terse anti-loop guard.

If you mount this plugin to stop runaway retry loops, `blockMultiplier` is
the knob that matters. Read the protocol text as a diagnostic in the
transcript, not as control over the agent.

## Six realms: one tool entry per realm

`dsh-tool-subagent` takes its persona from the TOOL ENTRY'S CONFIG
(`persona: config.persona`), not from the model's arguments. A delegation that
reaches `buddha-realms` with no persona is born `human` — full tool access —
so the provider writes a one-time warning to stderr when that happens.

See the root README's [Wiring the six
realms](../README.md#wiring-the-six-realms) for the overlay: one
`@deepseek-ai/dsh-tool-subagent` entry per realm (`subagent`, `subagent_deva`,
`subagent_asura`), each pinning its own `persona`, all pointing at
`provider: buddha-realms` with `backgroundMode: one-shot`. The model picks a
realm by picking a tool; DSH enforces the filter.

## Experimental: the citta-vīthi agent loop (`loop: 'citta-vithi'`)

By default (`config.loop: 'off'`, the schema's default) this plugin never
touches `ctx.agents` and DSH's stock `agent-loop` plugin drives every agent,
exactly as if this plugin's `loop.ts` did not exist.

Setting `config.loop: 'citta-vithi'` replaces the stock loop with an
alternative `AgentFactory` (`CittaVithiFactory`/`CittaVithiAgent` in
`src/loop.ts`) that structures each step as an explicit sequence of
citta-vīthi ("cognitive process") phases — bhavaṅga → āvajjana →
pañca-dvārāviññāṇa → sampaṭicchana → santīraṇa → voṭṭhabbana → javana →
tadārammaṇa — appending a `buddha/vithi-phase` marker event to the session
log at each phase, alongside the ordinary durable facts (claimed inbox
messages, the request header, the assistant message, tool results). It
dispatches every tool call through the same guarded `ctx.tools.execute()`
pipeline the stock loop uses (never a tool's `execute` directly) and emits
the same `agent/pre-step` / `agent/request` / `agent/turn-stopping` events,
so Layer A and the Poison Arrow breaker keep working unmodified underneath
it.

**This is genuinely experimental and NOT feature-complete with the stock
loop.** Known gaps, documented rather than hidden:

- tool calls within one step dispatch strictly sequentially — no
  parallel/exclusive scheduling group;
- no raw `assistant/chunk` replay-fidelity logging, only the assembled
  `assistant/message`;
- sessions are created with the simpler `ctx.sessions.create()` rather than
  the ordered `prepare`/`enter`/`announce` transaction the stock loop uses to
  keep session and agent teardown strictly ordered;
- `resume()` (continuing a persisted session) is not implemented and throws.

`ctx.agents.setFactory()` throws if a factory is already registered, so
using this loop requires disabling the stock loop in your cordis overlay:

```yaml
- insert:
    - id: buddha
      name: dsh-plugin-buddha
      config:
        loop: citta-vithi

- id: agent-loop
  disabled: true
```

See `tests/e2e/loop.test.ts` and `tests/fixtures/cordis.loop.yml` for a
complete, real-composition working example.

## Setup

**Use pnpm, not npm, inside this directory.** dsh's dependency tree is large
enough that npm exhausts memory resolving it on this machine (verified
twice). pnpm resolves it in ~10s.

From a fresh clone, the root package must be installed and built first — the
`buddha-js: file:..` dependency resolves to the root `dist/index.js`, and
there is no `prepare` script to build it for you:

```bash
npm install && npm run build     # repo root, npm is fine here
cd dsh && pnpm install && pnpm build
```

## Scripts

```bash
pnpm build      # tsup -> lib/ (CJS-free ESM, with .d.ts)
pnpm typecheck  # tsc -p tsconfig.check.json — covers src AND tests (the build
                # tsconfig.json is src-only); a full type-check tsup's dts build does not do
pnpm test       # vitest run (runs `pnpm typecheck` first, via pretest)
```

From the repo root, these are also available as:

```bash
npm run build:dsh
npm run test:dsh
```

## Compatibility tripwire

dsh is pre-1.0 and its own README warns "THERE WILL BE
COMPATIBILITY-BREAKING CHANGES". `tests/compat.test.ts` pins the exact
runtime and type-level contracts this plugin (and its later sub-plugins)
rely on — `AgentRegistry.setFactory`, `SubagentRuntime`'s provider API,
`LlmAdapter`'s abstract `stream` contract, the stock `dsh-base`
`cordis.patch.yml` plugin ids, `dsh-subagent-spawn-in-process`'s default
provider name, and `PostToolDecision`'s three-arm shape. If this test
suite fails after a dsh upgrade, treat it as a signal to re-verify the rest
of the plugin before continuing, not just a test to patch in isolation.

## Local dev run

`cordis.dev.yml` is a template overlay (the plugin path is machine-specific,
so replace `<ABSOLUTE PATH>` before use). It points at the **built**
`dsh/lib/index.js`, not `src/index.ts`: Node's native TypeScript
type-stripping does not remap a relative `./config.js` specifier to an
on-disk `./config.ts`, so loading the raw source through the cordis plugin
loader throws `ERR_MODULE_NOT_FOUND` (see `tests/e2e/headless.test.ts`'s
module doc). Run `pnpm build` (after the root build, see Setup) first:

```bash
cd dsh
pnpm build
pnpm dsh web --patch ./cordis.dev.yml
```
