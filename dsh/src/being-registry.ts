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
 */
export class BeingRegistry {
  constructor(private stateDir: string) {}

  /**
   * Read-only access: loads (or creates) the being for a session. NEVER
   * settles a pending rebirth and NEVER writes to disk — safe to call from
   * status/inspection paths without side effects.
   */
  peek(sessionId: string): Being {
    return this.load(sessionId)
  }

  /**
   * Mutating access: loads the being, settles any pending rebirth (which
   * replaces it with the newly-arisen `RebirthResult.being` and persists
   * that new being immediately), and returns the live being plus an
   * optional rebirth note.
   */
  acquire(sessionId: string): { being: Being; rebirth: RebirthResult | null } {
    const loaded = this.load(sessionId)
    const rebirth = loaded.settlePendingRebirth()
    if (!rebirth) {
      return { being: loaded, rebirth: null }
    }
    this.save(sessionId, rebirth.being)
    return { being: rebirth.being, rebirth }
  }

  /** Atomic write: serialize to `<file>.tmp`, then rename over the target. */
  save(sessionId: string, being: Being): void {
    fs.mkdirSync(this.beingsDir(), { recursive: true })
    const filePath = this.filePath(sessionId)
    const tmpPath = `${filePath}.tmp`
    fs.writeFileSync(tmpPath, JSON.stringify(being.toJSON(), null, 2))
    fs.renameSync(tmpPath, filePath)
  }

  /** Release the being's resources and forget its persisted session state. */
  dispose(sessionId: string): void {
    const filePath = this.filePath(sessionId)
    if (!fs.existsSync(filePath)) {
      return
    }
    const data: BeingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const being = Being.fromJSON(data)
    being.dispose()
    fs.unlinkSync(filePath)
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
