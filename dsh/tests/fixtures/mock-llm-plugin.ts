import type { Context } from '@deepseek-ai/cordis'
import { CallId, LlmAdapter } from '@deepseek-ai/dsh-llm'
import type { GenerateOptions, StreamChunk } from '@deepseek-ai/dsh-llm'

/**
 * Mock LLM adapter fixture for `tests/e2e/headless.test.ts`.
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
 *   scan `options.messages` for a plugin-sourced message (`source.kind ===
 *   'plugin'`, stamped by `pluginUserMessage()` in `src/messages.ts`) whose
 *   text contains "recognize" — the first word of Poison Arrow's
 *   "recognize" cessation stage rendered by `renderPoisonArrow()` in
 *   `src/breaker.ts`. Emit `PROTOCOL SEEN` if found, `PROTOCOL MISSING`
 *   otherwise, then finish with `reason: { kind: 'stop' }` so the headless
 *   runner treats the turn as complete and prints this text to stdout.
 */
export const name = 'mock-llm-plugin'
export const inject = ['llm']

/** Path the mock's tool call reads; deliberately absent. */
export const FIXTURE_MISSING_PATH = 'dsh-headless-fixture-missing-file-does-not-exist.txt'

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
    const sawProtocol = options.messages.some(
      (message) =>
        message.source.kind === 'plugin' &&
        message.content.some((block) => block.type === 'text' && block.text.includes('recognize')),
    )
    const text = sawProtocol ? 'PROTOCOL SEEN' : 'PROTOCOL MISSING'

    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text }
    yield { type: 'block-end', index: 0, block: { type: 'text', text } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

export function apply(ctx: Context): void {
  ctx.llm.registerAdapter(['mock'], new MockAdapter())
}
