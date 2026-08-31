import * as fs from 'node:fs'
import * as path from 'node:path'
import { Being } from 'buddha-js'
import type { BeingData, RebirthResult } from 'buddha-js'

/**
 * One buddha-js `Being` per DSH session, persisted to disk under
 * `<stateDir>/beings/<sessionId>.json`.
 *
 * Honors the core "observation does not rebirth" discipline (see
 * `Being.pendingRebirth` / `Being.settlePendingRebirth()` in
 * `src/simulation/Being.ts`): loading a save that has crossed the
 * `BUDDHA_INCARNATION_GAP_MS` gap only *detects* a due rebirth — it never
 * enacts it. `peek()` is the read-only path and therefore never settles or
 * writes; `acquire()` is the mutating path and settles + persists any
 * pending rebirth before handing back the live being.
 *
 * The registry tracks the live `Being` instance it has handed out for each
 * session in an in-memory map (populated by `peek()`/`acquire()`/`save()`).
 * That map is the source of truth for `dispose()`/`discard()` so they act
 * on the ACTUAL live object a caller has been using — never a fresh clone
 * reconstructed from disk — matching the "dispose the live being" contract
 * from the design spec (docs/superpowers/specs/2026-08-31-v05-dsh-plugin-design.md
 * §6) for both session-end disposal and ephemeral child-being discard.
 */
export class BeingRegistry {
  private readonly live = new Map<string, Being>()

  constructor(private stateDir: string) {}

  /**
   * Read-only access: loads (or creates) the being for a session. NEVER
   * settles a pending rebirth and NEVER writes to disk — safe to call from
   * status/inspection paths without side effects. Reuses the tracked live
   * instance if one has already been handed out for this session.
   */
  peek(sessionId: string): Being {
    const cached = this.live.get(sessionId)
    if (cached) {
      return cached
    }
    const being = this.load(sessionId)
    this.live.set(sessionId, being)
    return being
  }

  /**
   * Mutating access: loads (or reuses) the being, settles any pending
   * rebirth (which replaces it with the newly-arisen `RebirthResult.being`
   * and persists that new being immediately), and returns the live being
   * plus an optional rebirth note.
   */
  acquire(sessionId: string): { being: Being; rebirth: RebirthResult | null } {
    const being = this.peek(sessionId)
    const rebirth = being.settlePendingRebirth()
    if (!rebirth) {
      return { being, rebirth: null }
    }
    // The dying being is disposed internally by settlePendingRebirth() ->
    // rebirth(); track and persist the newly-arisen one in its place.
    this.save(sessionId, rebirth.being)
    return { being: rebirth.being, rebirth }
  }

  /**
   * Atomic write: serialize to `<file>.tmp`, then rename over the target.
   * On failure, cleans up the leftover `.tmp` file before rethrowing.
   * Also updates the tracked live instance for this session to `being`.
   */
  save(sessionId: string, being: Being): void {
    fs.mkdirSync(this.beingsDir(), { recursive: true })
    const filePath = this.filePath(sessionId)
    const tmpPath = `${filePath}.tmp`
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(being.toJSON(), null, 2))
      fs.renameSync(tmpPath, filePath)
    } catch (err) {
      fs.rmSync(tmpPath, { force: true })
      throw err
    }
    this.live.set(sessionId, being)
  }

  /**
   * Session-end disposal: release the tracked live being's resources and
   * forget it in memory. The persisted file is KEPT — this is the safe
   * default so a real session's karma/realm survives past disposal (e.g.
   * a subsequent `peek()`/`acquire()` resumes from the saved state).
   */
  dispose(sessionId: string): void {
    const being = this.live.get(sessionId)
    if (!being) {
      return
    }
    being.dispose()
    this.live.delete(sessionId)
  }

  /**
   * Ephemeral-being teardown: dispose the tracked live being (as `dispose()`
   * does) AND delete its persisted file — for child beings (e.g. subagent
   * beings spawned for the lifetime of a subagent run) that must leave no
   * trace once the run ends. Never use this for a main session's being.
   */
  discard(sessionId: string): void {
    this.dispose(sessionId)
    const filePath = this.filePath(sessionId)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  private load(sessionId: string): Being {
    const filePath = this.filePath(sessionId)
    if (!fs.existsSync(filePath)) {
      return new Being()
    }
    const data: BeingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return Being.fromJSON(data)
  }

  private beingsDir(): string {
    return path.join(this.stateDir, 'beings')
  }

  private filePath(sessionId: string): string {
    return path.join(this.beingsDir(), `${sessionId}.json`)
  }
}
