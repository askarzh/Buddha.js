import type { Context } from '@deepseek-ai/cordis'
import { CallId, LlmAdapter } from '@deepseek-ai/dsh-llm'
import type { ContentBlock, GenerateOptions, Message, StreamChunk } from '@deepseek-ai/dsh-llm'

/**
 * Mock LLM adapter fixture shared by every e2e suite: `headless.test.ts`
 * (stock `agent-loop`), `loop.test.ts` and `loop-breaker.test.ts` (the
 * experimental citta-vīthi loop). One probe, so the two loops are held to
 * the same standard and cannot drift apart unnoticed.
 *
 * A real-composition proof needs a real model round trip through the
 * breaker, so this plugin registers a scripted `LlmAdapter` under the
 * `mock` provider route instead of stubbing the breaker itself.
 *
 * Script:
 * - Requests 1-3: emit a tool call to `read` with a missing `file_path`
 *   (`FIXTURE_MISSING_PATH`, resolved relative to the headless run's cwd so
 *   it is guaranteed absent). `read` on a missing path throws `FS_NOT_FOUND`
 *   inside the tool handler, which `dsh-tools` wraps as an `isError: true`
 *   result — genuine tool failures the breaker's `tools/post-execute`
 *   streak counter actually sees. (A `bash "exit 1"` was considered and
 *   rejected: `dsh-tool-bash` deliberately reports a nonzero exit as
 *   model-facing text, not an `isError` result — "non-zero exits are
 *   reported, not errored" per its own renderResult() comment — so it would
 *   never trip the breaker.)
 * - Request 4 (after three failures, the breaker's default `threshold`):
 *   report HOW the Poison Arrow cessation protocol arrived, not merely
 *   whether it did. The marker searched for is "recognize", the first of
 *   Poison Arrow's four cessation stages rendered by `renderPoisonArrow()`
 *   in `src/breaker.ts`.
 *
 *   - `PROTOCOL AS TOOL CONTEXT` — the protocol is nested in a `tool-result`
 *     block, i.e. it IS the failing call's own result. This is the only
 *     accepted outcome: live models obey the protocol at this provenance.
 *   - `PROTOCOL DETACHED` — it arrived only as a standalone plugin-sourced
 *     `user/message` (`source.kind === 'plugin'`, stamped by
 *     `pluginUserMessage()` in `src/messages.ts`). Live DeepSeek runs at the
 *     advisory tier, under BOTH the stock loop and this plugin's Layer B
 *     loop, called exactly this "prompting-injection-style material" and
 *     "untrusted injected content", and refused it while completing every
 *     retry. A discipline the model correctly ignores is worse than none.
 *   - `PROTOCOL MISSING` — it never reached the model at all (the breaker's
 *     `enabled: false` RED case in `tests/e2e/headless.test.ts`).
 *
 *   Then finish with `reason: { kind: 'stop' }` so the headless runner treats
 *   the turn as complete and prints this text to stdout.
 */
export const name = 'mock-llm-plugin'
export const inject = ['llm']

/** Path the mock's tool call reads; deliberately absent. */
export const FIXTURE_MISSING_PATH = 'dsh-headless-fixture-missing-file-does-not-exist.txt'

/** First cessation stage rendered by `renderPoisonArrow()` (see `src/breaker.ts`). */
const PROTOCOL_MARKER = 'recognize'

const FAILURE_ROUNDS = 3

class MockAdapter extends LlmAdapter {
  private requestCount = 0

  providerInfo() {
    return { id: 'mock', name: 'Mock' }
  }

  async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requestCount += 1

    if (this.requestCount <= FAILURE_ROUNDS) {
      yield* this.toolCallTurn()
      return
    }

    yield* this.protocolCheckTurn(options)
  }

  private async *toolCallTurn(): AsyncIterable<StreamChunk> {
    const id = CallId(`mock-call-${this.requestCount}`)
    const args = JSON.stringify({ file_path: FIXTURE_MISSING_PATH })

    yield { type: 'block-start', index: 0, blockType: 'tool-call' }
    yield { type: 'tool-call-delta', index: 0, id, name: 'read', argumentsDelta: args }
    yield { type: 'block-end', index: 0, block: { type: 'tool-call', id, name: 'read', arguments: args } }
    yield { type: 'finish', reason: { kind: 'tool-calls' } }
  }

  private async *protocolCheckTurn(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const messages = options.messages as readonly Message[]

    // A tool result is a USER-role message whose single content block is a
    // `tool-result` (see `createToolResultMessage` in `@deepseek-ai/dsh-llm`
    // — dsh's provider-neutral vocabulary has no `'tool'` role), so the
    // protocol delivered as result content sits NESTED one level down.
    const carries = (blocks: readonly ContentBlock[]): boolean =>
      blocks.some((block) => block.type === 'text' && block.text.includes(PROTOCOL_MARKER))
    const attached = messages.some((message) =>
      message.content.some((block) => block.type === 'tool-result' && carries(block.content)),
    )
    const detached = messages.some((message) => message.source.kind === 'plugin' && carries(message.content))

    const text = attached ? 'PROTOCOL AS TOOL CONTEXT' : detached ? 'PROTOCOL DETACHED' : 'PROTOCOL MISSING'

    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text }
    yield { type: 'block-end', index: 0, block: { type: 'text', text } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

export function apply(ctx: Context): void {
  ctx.llm.registerAdapter(['mock'], new MockAdapter())
}
