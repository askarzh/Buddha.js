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

See the root [README's DeepSeek Harness Plugin
section](../README.md#deepseek-harness-plugin) for the failure-mode-to-
mechanism table, install instructions, and config keys.

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
