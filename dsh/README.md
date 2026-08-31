# dsh-plugin-buddha

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/dsh) Cordis plugin
that brings [buddha-js](..)'s Poison Arrow circuit breaker and karma
tracking to DSH agents.

This package is a scaffold: `apply()` is currently a no-op. Later tasks in
the v0.5 phase mount the actual sub-plugins (circuit breaker, karma
tracking, `citta-vithi` loop).

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
pnpm build   # tsup -> lib/ (CJS-free ESM, with .d.ts)
pnpm test    # vitest run
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
