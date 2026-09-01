import type { Context } from '@deepseek-ai/cordis'
import { CallId, LlmAdapter } from '@deepseek-ai/dsh-llm'
import type { ContentBlock, GenerateOptions, Message, StreamChunk } from '@deepseek-ai/dsh-llm'

/**
 * Mock LLM adapter fixture for `tests/e2e/loop-breaker.test.ts`.
 *
 * A sibling of `mock-llm-plugin.ts` with the same fail-three-reads script,
 * but a different question at the end. `mock-llm-plugin.ts` asks *whether*
 * the Poison Arrow cessation protocol reached the model at all; this one
 * asks **how it was framed**:
 *
 * - attached — the protocol text sits inside the `tool-result` block of the
 *   failing `read` call that produced it, the way DSH delivers tool-owned
 *   context. A live model followed it. → `PROTOCOL AS TOOL CONTEXT`
 * - detached — the protocol text arrives as a standalone plugin-sourced
 *   `user/message` with no tool result of its own. A live DeepSeek run
 *   called exactly this "prompting-injection-style material masquerading as
 *   a system/cessation signal" and ignored it. → `PROTOCOL DETACHED`
 *
 * The marker string searched for is `Failure pressure`, from the first line
 * of `renderPoisonArrow()` in `src/breaker.ts`.
 */
export const name = 'mock-llm-breaker-plugin'
export const inject = ['llm']

/** Path the mock's tool call reads; deliberately absent. */
export const FIXTURE_MISSING_PATH = 'dsh-breaker-fixture-missing-file-does-not-exist.txt'

/** Marker from `renderPoisonArrow()`'s opening line (see `src/breaker.ts`). */
const PROTOCOL_MARKER = 'Failure pressure'

const FAILURE_ROUNDS = 3

/** Whether any block in this tree (tool-result blocks recursed into) carries the marker. */
function blocksCarryMarker(blocks: readonly ContentBlock[]): boolean {
  return blocks.some((block) => {
    if (block.type === 'text') return block.text.includes(PROTOCOL_MARKER)
    if (block.type === 'tool-result') return blocksCarryMarker(block.content)
    return false
  })
}

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

    yield* this.framingCheckTurn(options)
  }

  private async *toolCallTurn(): AsyncIterable<StreamChunk> {
    const id = CallId(`mock-call-${this.requestCount}`)
    const args = JSON.stringify({ file_path: FIXTURE_MISSING_PATH })

    yield { type: 'block-start', index: 0, blockType: 'tool-call' }
    yield { type: 'tool-call-delta', index: 0, id, name: 'read', argumentsDelta: args }
    yield { type: 'block-end', index: 0, block: { type: 'tool-call', id, name: 'read', arguments: args } }
    yield { type: 'finish', reason: { kind: 'tool-calls' } }
  }

  private async *framingCheckTurn(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const messages = options.messages as readonly Message[]

    // A tool result is a user-role message whose single block is a
    // `tool-result` (see `createToolResultMessage` in `@deepseek-ai/dsh-llm`
    // — there is no `'tool'` role in dsh's provider-neutral vocabulary).
    const lastToolResult = messages
      .filter((message) => message.content.some((block) => block.type === 'tool-result'))
      .at(-1)
    const attached = lastToolResult !== undefined && blocksCarryMarker(lastToolResult.content)

    const detached = messages.some(
      (message) =>
        message.source.kind === 'plugin' &&
        message.content.some((block) => block.type === 'text' && block.text.includes(PROTOCOL_MARKER)),
    )

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
