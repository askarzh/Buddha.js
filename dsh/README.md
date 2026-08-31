# dsh-plugin-buddha

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/dsh) Cordis plugin
that brings [buddha-js](..)'s Poison Arrow circuit breaker, karma tracking,
citta-vīthi step observation, and six-realm subagent personas to DSH agents.

`apply()` (`src/index.ts`) hoists one shared `BeingRegistry` — one buddha-js
`Being` per DSH session, persisted to `<stateDir>/beings/<sessionId>.json` —
and mounts five sub-plugins on top of it:

| Sub-plugin | File | Mounts on |
|---|---|---|
| Poison Arrow circuit breaker | `src/breaker.ts` | `tools/post-execute` |
| Karma tracking | `src/karma.ts` | `tools/result`, `agent/turn-stopping` |
| Layer A citta-vīthi step observer | `src/vithi.ts`, `src/step-records.ts` | `agent/pre-step`, `tools/result` |
| Six-realm subagent personas | `src/realms.ts` | `ctx.subagents` (`buddha-realms` provider) |
| Slash commands (`/sit` `/koan` `/status` `/rebirth`) | `src/commands.ts` | `ctx.commands` |
| Layer B citta-vīthi loop (**experimental, opt-in**) | `src/loop.ts` | `ctx.agents.setFactory()` |

See the root [README's DeepSeek Harness Plugin
section](../README.md#deepseek-harness-plugin) for the failure-mode-to-
mechanism table, install instructions, and config keys.

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

```bash
cd dsh
pnpm install
```

## Scripts

```bash
pnpm build      # tsup -> lib/ (CJS-free ESM, with .d.ts)
pnpm typecheck  # tsc --noEmit -p . — a full type-check tsup's dts build does not do
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
so replace `<ABSOLUTE PATH>` before use):

```bash
cd dsh
pnpm dsh web --patch ./cordis.dev.yml
```
