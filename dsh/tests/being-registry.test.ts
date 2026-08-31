import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { Being } from 'buddha-js'
import { BeingRegistry } from '../src/being-registry.js'

/**
 * BeingRegistry: one buddha-js Being per DSH session, persisted to disk,
 * honoring the "observation does not rebirth" discipline (see
 * task-2-brief.md and src/simulation/Being.ts in the root package).
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

  it('save() then peek() round-trips realm and incarnation', () => {
    const registry = new BeingRegistry(stateDir)
    const being = registry.peek('session-c')
    registry.save('session-c', being)

    const reloaded = registry.peek('session-c')
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

  it('across BUDDHA_INCARNATION_GAP_MS=0, acquire() settles a pending rebirth and saves it; the saved realm matches rebirth.toRealm', () => {
    const prevGap = process.env.BUDDHA_INCARNATION_GAP_MS
    process.env.BUDDHA_INCARNATION_GAP_MS = '0'
    try {
      const registry = new BeingRegistry(stateDir)
      const being = registry.peek('session-d')
      registry.save('session-d', being)

      const { being: settled, rebirth } = registry.acquire('session-d')

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

  it('across the same gap, peek() leaves the saved file byte-identical (no settlement, no write)', () => {
    const prevGap = process.env.BUDDHA_INCARNATION_GAP_MS
    process.env.BUDDHA_INCARNATION_GAP_MS = '0'
    try {
      const registry = new BeingRegistry(stateDir)
      const being = registry.peek('session-e')
      registry.save('session-e', being)

      const filePath = path.join(stateDir, 'beings', 'session-e.json')
      const before = fs.readFileSync(filePath, 'utf-8')

      const peeked = registry.peek('session-e')
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

  it('dispose() releases the being and forgets its persisted state', () => {
    const registry = new BeingRegistry(stateDir)
    const being = registry.peek('session-f')
    registry.save('session-f', being)
    const filePath = path.join(stateDir, 'beings', 'session-f.json')
    expect(fs.existsSync(filePath)).toBe(true)

    expect(() => registry.dispose('session-f')).not.toThrow()
    expect(fs.existsSync(filePath)).toBe(false)

    // Forgotten: peek() starts a brand-new session (incarnation 1, not settled).
    const fresh = registry.peek('session-f')
    expect(fresh.incarnation).toBe(1)
  })

  it('dispose() on a session with no saved state is a no-op', () => {
    const registry = new BeingRegistry(stateDir)
    expect(() => registry.dispose('never-saved')).not.toThrow()
  })
})
