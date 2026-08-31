import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { Being } from 'buddha-js'
import { BeingRegistry } from '../src/being-registry.js'

/**
 * BeingRegistry: one buddha-js Being per DSH session, persisted to disk,
 * honoring the "observation does not rebirth" discipline (see
 * task-2-brief.md and src/simulation/Being.ts in the root package).
 *
 * The registry tracks the live instance it hands out per session in an
 * in-memory map (populated by peek()/acquire()/save()). peek()/acquire()
 * reuse that instance rather than re-reading disk on every call — so tests
 * that need to observe a fresh on-disk load (e.g. incarnation-gap
 * detection) use a SECOND `BeingRegistry` instance against the same
 * `stateDir`, simulating a new process picking the session back up.
 */
describe('BeingRegistry', () => {
  let stateDir: string

  beforeEach(() => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-being-registry-'))
  })

  afterEach(() => {
    fs.rmSync(stateDir, { recursive: true, force: true })
  })

  it('peek() creates a fresh human being and never writes a file', () => {
    const registry = new BeingRegistry(stateDir)
    const being = registry.peek('session-a')

    expect(being).toBeInstanceOf(Being)
    expect(being.realm).toBe('human')
    expect(fs.existsSync(path.join(stateDir, 'beings', 'session-a.json'))).toBe(false)
  })

  it('acquire() on a fresh being returns rebirth: null', () => {
    const registry = new BeingRegistry(stateDir)
    const { being, rebirth } = registry.acquire('session-b')

    expect(being).toBeInstanceOf(Being)
    expect(rebirth).toBeNull()
  })

  it('save() then peek() (fresh registry, same stateDir) round-trips realm and incarnation', () => {
    const registry = new BeingRegistry(stateDir)
    const being = registry.peek('session-c')
    registry.save('session-c', being)

    // A fresh registry instance has no live cache: this peek() must
    // actually deserialize the saved file, proving the round trip.
    const reloadedRegistry = new BeingRegistry(stateDir)
    const reloaded = reloadedRegistry.peek('session-c')
    expect(reloaded.realm).toBe(being.realm)
    expect(reloaded.incarnation).toBe(being.incarnation)
  })

  it('save() is atomic: writes via a .tmp file then renames', () => {
    const registry = new BeingRegistry(stateDir)
    const being = registry.peek('session-atomic')
    registry.save('session-atomic', being)

    const finalPath = path.join(stateDir, 'beings', 'session-atomic.json')
    const tmpPath = `${finalPath}.tmp`
    expect(fs.existsSync(finalPath)).toBe(true)
    expect(fs.existsSync(tmpPath)).toBe(false)
  })

  it('save() cleans up the leftover .tmp file when the write fails', () => {
    const registry = new BeingRegistry(stateDir)
    const being = registry.peek('session-fail')

    // Force the rename step to fail without mocking `fs` (ESM export
    // properties aren't configurable, so `vi.spyOn(fs, 'renameSync')`
    // throws "Cannot redefine property"): pre-create a DIRECTORY at the
    // final path. `fs.renameSync(tmpFile, existingDir)` fails with EISDIR
    // on Linux, exercising the same catch/rethrow-and-cleanup path a real
    // write failure (e.g. disk full, permission denied) would.
    const finalPath = path.join(stateDir, 'beings', 'session-fail.json')
    fs.mkdirSync(finalPath, { recursive: true })

    expect(() => registry.save('session-fail', being)).toThrow()

    const tmpPath = `${finalPath}.tmp`
    expect(fs.existsSync(tmpPath)).toBe(false)
    // The pre-created directory is untouched (save() never got to rename).
    expect(fs.statSync(finalPath).isDirectory()).toBe(true)
  })

  it('across BUDDHA_INCARNATION_GAP_MS=0, acquire() (fresh registry, after reload) settles a pending rebirth and saves it; the saved realm matches rebirth.toRealm', () => {
    const prevGap = process.env.BUDDHA_INCARNATION_GAP_MS
    process.env.BUDDHA_INCARNATION_GAP_MS = '0'
    try {
      const registry = new BeingRegistry(stateDir)
      const being = registry.peek('session-d')
      registry.save('session-d', being)

      // Simulate a new process/session picking the being back up after the
      // gap: a fresh registry instance, so acquire() actually reloads from
      // disk (rather than reusing the still-live in-memory instance).
      const reloadedRegistry = new BeingRegistry(stateDir)
      const { being: settled, rebirth } = reloadedRegistry.acquire('session-d')

      expect(rebirth).not.toBeNull()
      expect(settled.realm).toBe(rebirth!.toRealm)

      const filePath = path.join(stateDir, 'beings', 'session-d.json')
      const saved = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      expect(saved.realm).toBe(rebirth!.toRealm)
    } finally {
      if (prevGap === undefined) {
        delete process.env.BUDDHA_INCARNATION_GAP_MS
      } else {
        process.env.BUDDHA_INCARNATION_GAP_MS = prevGap
      }
    }
  })

  it('across the same gap, peek() (fresh registry, after reload) leaves the saved file byte-identical (no settlement, no write)', () => {
    const prevGap = process.env.BUDDHA_INCARNATION_GAP_MS
    process.env.BUDDHA_INCARNATION_GAP_MS = '0'
    try {
      const registry = new BeingRegistry(stateDir)
      const being = registry.peek('session-e')
      registry.save('session-e', being)

      const filePath = path.join(stateDir, 'beings', 'session-e.json')
      const before = fs.readFileSync(filePath, 'utf-8')

      const reloadedRegistry = new BeingRegistry(stateDir)
      const peeked = reloadedRegistry.peek('session-e')
      expect(peeked.pendingRebirth).toBe(true)

      const after = fs.readFileSync(filePath, 'utf-8')
      expect(after).toBe(before)
    } finally {
      if (prevGap === undefined) {
        delete process.env.BUDDHA_INCARNATION_GAP_MS
      } else {
        process.env.BUDDHA_INCARNATION_GAP_MS = prevGap
      }
    }
  })

  it('dispose() disposes the SAME live instance acquire() returned', () => {
    const registry = new BeingRegistry(stateDir)
    const { being } = registry.acquire('session-identity')
    const disposeSpy = vi.spyOn(being, 'dispose')

    registry.dispose('session-identity')

    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })

  it('dispose() keeps the persisted file: a subsequent peek() resumes the same incarnation/realm', () => {
    const registry = new BeingRegistry(stateDir)
    const being = registry.peek('session-f')
    registry.save('session-f', being)
    const filePath = path.join(stateDir, 'beings', 'session-f.json')
    expect(fs.existsSync(filePath)).toBe(true)

    expect(() => registry.dispose('session-f')).not.toThrow()
    expect(fs.existsSync(filePath)).toBe(true)

    // Forgotten in memory, but resumed from disk: same persisted state.
    const resumed = registry.peek('session-f')
    expect(resumed.incarnation).toBe(being.incarnation)
    expect(resumed.realm).toBe(being.realm)
  })

  it('dispose() with nothing live in memory is a no-op', () => {
    const registry = new BeingRegistry(stateDir)
    expect(() => registry.dispose('never-touched')).not.toThrow()
  })

  it('discard() disposes, removes the persisted file, and a subsequent peek() starts fresh', () => {
    const registry = new BeingRegistry(stateDir)
    const being = registry.peek('session-g')
    registry.save('session-g', being)
    const filePath = path.join(stateDir, 'beings', 'session-g.json')
    expect(fs.existsSync(filePath)).toBe(true)

    const disposeSpy = vi.spyOn(being, 'dispose')
    expect(() => registry.discard('session-g')).not.toThrow()

    expect(disposeSpy).toHaveBeenCalledTimes(1)
    expect(fs.existsSync(filePath)).toBe(false)

    const fresh = registry.peek('session-g')
    expect(fresh.incarnation).toBe(1)
  })

  it('discard() on a session with no saved state is a no-op', () => {
    const registry = new BeingRegistry(stateDir)
    expect(() => registry.discard('never-saved')).not.toThrow()
  })
})
