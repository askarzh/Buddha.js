import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import type { PostToolDecision } from '@deepseek-ai/dsh-tools'

const require = createRequire(import.meta.url)

/**
 * Compatibility tripwire.
 *
 * dsh (`@deepseek-ai/dsh` and friends) is pre-1.0 and its README says plainly
 * "THERE WILL BE COMPATIBILITY-BREAKING CHANGES". Every assertion below pins
 * a runtime or type-level contract this plugin's design relies on. When one
 * of these fails, it means an upstream dsh release moved the ground under
 * this plugin and the later tasks (Poison Arrow breaker, karma tracking,
 * citta-vithi loop) need to be re-checked before continuing — not just this
 * test fixed in isolation.
 */
describe('dsh compatibility tripwire', () => {
  it('AgentRegistry.prototype.setFactory exists (spec: agent factory registration)', async () => {
    const { AgentRegistry } = await import('@deepseek-ai/dsh-agent')
    expect(typeof AgentRegistry.prototype.setFactory).toBe('function')
  })

  it('SubagentRuntime.prototype.registerProvider/getProvider/start exist (spec: subagent provider registration and dispatch)', async () => {
    const { SubagentRuntime } = await import('@deepseek-ai/dsh-subagent')
    expect(typeof SubagentRuntime.prototype.registerProvider).toBe('function')
    expect(typeof SubagentRuntime.prototype.getProvider).toBe('function')
    expect(typeof SubagentRuntime.prototype.start).toBe('function')
  })

  it('LlmAdapter is abstract with a stream method (spec: pluggable model backend)', async () => {
    const { LlmAdapter } = await import('@deepseek-ai/dsh-llm')
    // `abstract` is a TypeScript-only, erased-at-runtime contract: the
    // compiled class is a normal constructible function and `stream` is
    // NOT present on its runtime prototype (subclasses supply it). So the
    // "abstract with a stream method" contract can only be pinned by
    // reading the declaration file directly, not by probing the runtime.
    expect(typeof LlmAdapter).toBe('function')
    const pkgPath = require.resolve('@deepseek-ai/dsh-llm/package.json')
    const dtsPath = pkgPath.replace(/package\.json$/, 'lib/types/index.d.ts')
    const dts = readFileSync(dtsPath, 'utf-8')
    expect(dts).toMatch(/export declare abstract class LlmAdapter\b/)
    expect(dts).toMatch(/abstract stream\(options: GenerateOptions\): AsyncIterable<StreamChunk>;/)
  })

  it('dsh-base cordis.patch.yml still wires agent-loop, agent-default-model, llm-deepseek (spec: stock plugin ids this plugin overlays alongside)', () => {
    const patchPath = require.resolve('@deepseek-ai/dsh-base/cordis.patch.yml')
    const patch = readFileSync(patchPath, 'utf-8')
    expect(patch).toMatch(/- id:\s*agent-loop\b/)
    expect(patch).toMatch(/- id:\s*agent-default-model\b/)
    expect(patch).toMatch(/- id:\s*llm-deepseek\b/)
  })

  it('dsh-subagent-spawn-in-process defaults providerName to "spawn" (spec: default subagent provider name assumed by overlay wiring)', () => {
    const libPath = require.resolve('@deepseek-ai/dsh-subagent-spawn-in-process')
    const lib = readFileSync(libPath, 'utf-8')
    expect(lib).toMatch(/providerName:\s*z\.string\(\)\.default\(["']spawn["']\)/)
  })

  it('PostToolDecision keeps its three arms (spec: Poison Arrow breaker decides accept/accept-with-value/block)', () => {
    // Type-level only: this compiles iff PostToolDecision still has exactly
    // these three discriminated-union shapes. `vitest run` uses esbuild,
    // which strips types without checking them, so a shape change here is
    // only caught by a real type-checker. That is `pnpm typecheck` /
    // `pretest` (`tsc -p tsconfig.check.json`), whose `include` covers `src`
    // AND `tests` — the build `tsconfig.json` and `pnpm build`'s dts step
    // both cover `src/` only, so neither would ever see this file.
    const accept = { kind: 'accept', content: [] } satisfies PostToolDecision
    const acceptValue = { kind: 'accept', value: 1 } satisfies PostToolDecision
    const block = { kind: 'block', feedback: [] } satisfies PostToolDecision
    expect(accept.kind).toBe('accept')
    expect(acceptValue.kind).toBe('accept')
    expect(block.kind).toBe('block')
  })

  it('the accept arm can REPLACE the tool result content (spec: the breaker delivers the advisory cessation protocol on the failing tool result)', () => {
    // Load-bearing since Task 4b: below `threshold * blockMultiplier` the Poison Arrow
    // breaker no longer ships the protocol as `additionalContexts` (a
    // free-floating user-role message live models discount as injected
    // content, under BOTH loops). It returns
    // `{ kind: 'accept', content: [...original blocks, ...protocol] }`, so
    // the notice arrives as the failing tool's own result — the same
    // provenance the `block` arm gets through `feedback`, and the reason the
    // block arm is obeyed.
    //
    // Three things must hold, pinned here:
    // 1. the accept arm still accepts a `content` replacement (type-level);
    // 2. `content` and `value` stay mutually exclusive, so the breaker's
    //    value-replacement fallback to `additionalContexts` stays necessary;
    // 3. `postExecute` still HONOURS an accepted `content` replacement
    //    rather than discarding it — the runtime half, which no type can
    //    express and which esbuild-stripped types would never catch.
    const replaced = { kind: 'accept', content: [{ type: 'text', text: 'x' }] } satisfies PostToolDecision
    expect(replaced.content).toHaveLength(1)

    const dtsPath = require.resolve('@deepseek-ai/dsh-tools/package.json').replace(/package\.json$/, 'lib/types/index.d.ts')
    const dts = readFileSync(dtsPath, 'utf-8')
    expect(dts).toMatch(/kind: 'accept';\s*content\?: ContentBlock\[\];\s*value\?: never;/)
    expect(dts).toMatch(/kind: 'accept';\s*value: JsonValue;\s*content\?: never;/)

    const libPath = require.resolve('@deepseek-ai/dsh-tools')
    const lib = readFileSync(libPath, 'utf-8')
    expect(lib).toMatch(/decision\.content !== void 0 \? \{ content: decision\.content \} : \{\}/)
  })

  it('createToolResultMessage nests EVERY given block inside one tool-result block (spec: the citta-vithi loop attaches breaker context to its owning tool result)', async () => {
    // `src/loop.ts` delivers a tool call's `additionalContexts` — the Poison
    // Arrow cessation protocol above all — by appending their content blocks
    // to the `content` of the SAME tool result, so the model reads them in
    // the tool channel that produced them instead of as a loose user turn it
    // is right to distrust (see the framing note in `loop.ts`, and
    // `tests/e2e/loop-breaker.test.ts`).
    //
    // That depends on three things staying true, all pinned here: `content`
    // is an ARRAY of arbitrary content blocks (not a single block, and not
    // narrowed to one element); every element survives into the produced
    // message; and they land nested inside the single `tool-result` block,
    // correlated to `toolCallId`, rather than as sibling top-level blocks.
    const { createToolResultMessage, CallId } = await import('@deepseek-ai/dsh-llm')
    const message = createToolResultMessage({
      callId: CallId('compat-call'),
      content: [
        { type: 'text', text: 'tool output' },
        { type: 'text', text: 'attached context' },
      ],
      isError: true,
    })
    expect(message.role).toBe('user')
    expect(message.content).toHaveLength(1)
    const block = message.content[0]
    expect(block.type).toBe('tool-result')
    if (block.type !== 'tool-result') throw new Error('unreachable: asserted above')
    expect(block.toolCallId).toBe('compat-call')
    expect(block.isError).toBe(true)
    expect(block.content).toEqual([
      { type: 'text', text: 'tool output' },
      { type: 'text', text: 'attached context' },
    ])
  })
})
