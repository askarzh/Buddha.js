import { KoanGenerator } from 'buddha-js'

/**
 * Koan state with a real lifetime.
 *
 * `/koan` used to construct a `new KoanGenerator()` per invocation, so the
 * trap journal could never hold more than one entry — and "which trap does
 * this continuum keep falling into" is a question about accumulation over
 * time. A journal that resets on every call answers nothing.
 *
 * DECIDED: the journal is PER SESSION, not per plugin instance. A trap
 * journal belongs to a continuum, and this plugin already keys everything
 * else — beings, save scheduling, vīthi records — by session id. One
 * journal shared across every agent on the process would report "this
 * continuum keeps grasping" about a trap some other agent fell into.
 *
 * Like `BeingRegistry` and `SaveScheduler`, ONE instance is hoisted in
 * `apply()` and threaded into `applyCommands`, rather than being a
 * module-level global: it is then injectable in tests and dies with the
 * plugin. Nothing here is written to disk — persisting the journal into
 * `BeingData` is a serialization-format decision deferred out of this task —
 * so a journal lives exactly as long as the session's agent does.
 */
export class KoanSessions {
  private readonly sessions = new Map<string, { generator: KoanGenerator; lastKoanId?: string }>()

  private entry(sessionId: string): { generator: KoanGenerator; lastKoanId?: string } {
    let entry = this.sessions.get(sessionId)
    if (!entry) {
      entry = { generator: new KoanGenerator() }
      this.sessions.set(sessionId, entry)
    }
    return entry
  }

  /** This session's generator, carrying its own trap journal. */
  forSession(sessionId: string): KoanGenerator {
    return this.entry(sessionId).generator
  }

  /** Remember what was last put in front of this session, so `/koan respond` has a subject. */
  rememberPresented(sessionId: string, koanId: string): void {
    this.entry(sessionId).lastKoanId = koanId
  }

  /** The id of the koan last presented to this session, or undefined. */
  lastPresented(sessionId: string): string | undefined {
    return this.sessions.get(sessionId)?.lastKoanId
  }

  /**
   * Drop this session's journal. Called from the `agent/disposed` handler in
   * `index.ts`, which fires for main agents and ephemeral realm children
   * alike — otherwise the map would grow for the life of the process.
   */
  forget(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  /** Number of sessions currently holding a journal. Test seam. */
  get size(): number {
    return this.sessions.size
  }
}
