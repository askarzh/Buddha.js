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
 *
 * Flush points (see `index.ts` / `karma.ts`):
 * - `agent/turn-stopping`, as karma's LAST action so the wholesome
 *   "completed turn" act is included in the write;
 * - `agent/disposed`, before `registry.dispose()` drops the live instance;
 * - the plugin's own teardown effect, so a shutdown mid-turn is not lost.
 */
export class SaveScheduler {
  private readonly dirty = new Map<string, Being>()

  constructor(private readonly registry: BeingRegistry) {}

  /** Remember that `sessionId`'s being has changed. Does NOT write. */
  mark(sessionId: string, being: Being): void {
    this.dirty.set(sessionId, being)
  }

  /** Write `sessionId` if it has been marked since the last flush. */
  flush(sessionId: string): void {
    const being = this.dirty.get(sessionId)
    if (!being) return
    this.dirty.delete(sessionId)
    this.registry.save(sessionId, being)
  }

  /** Write every marked session. */
  flushAll(): void {
    for (const sessionId of [...this.dirty.keys()]) this.flush(sessionId)
  }
}
