import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import type { Being } from 'buddha-js'
import { BeingRegistry } from '../src/being-registry.js'
import { SaveScheduler } from '../src/persistence.js'

describe('SaveScheduler', () => {
  let stateDir: string
  let registry: BeingRegistry
  let scheduler: SaveScheduler

  beforeEach(() => {
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-persist-'))
    registry = new BeingRegistry(stateDir)
    scheduler = new SaveScheduler(registry)
  })
  afterEach(() => fs.rmSync(stateDir, { recursive: true, force: true }))

  const file = (id: string) => path.join(stateDir, 'beings', `${id}.json`)

  it('does not touch the disk until flushed', () => {
    const being = registry.peek('s1')
    being.act('a deed', 5, 'aversion')
    scheduler.mark('s1', being)

    expect(fs.existsSync(file('s1'))).toBe(false)

    scheduler.flush('s1')
    expect(fs.existsSync(file('s1'))).toBe(true)
  })

  it('writes once however many times a turn marks the same session', () => {
    const being = registry.peek('s1')
    scheduler.mark('s1', being)
    scheduler.mark('s1', being)
    scheduler.mark('s1', being)
    scheduler.flush('s1')

    const firstWrite = fs.statSync(file('s1')).mtimeMs
    scheduler.flush('s1') // nothing marked since
    expect(fs.statSync(file('s1')).mtimeMs).toBe(firstWrite)
  })

  it('keeps sessions independent', () => {
    scheduler.mark('s1', registry.peek('s1'))
    scheduler.flush('s2')
    expect(fs.existsSync(file('s1'))).toBe(false)
  })

  it('writes once per turn, not once per listener', () => {
    // Three listeners marking the same session within one turn must produce one
    // file write, not three.
    const being = registry.peek('s1')
    scheduler.mark('s1', being)
    scheduler.mark('s1', being)
    scheduler.mark('s1', being)

    let writes = 0
    const realSave = registry.save.bind(registry)
    registry.save = ((id: string, b: Being) => {
      writes += 1
      realSave(id, b)
    }) as typeof registry.save

    scheduler.flush('s1')
    expect(writes).toBe(1)
  })

  it('flushAll writes every marked session and leaves nothing dirty', () => {
    scheduler.mark('s1', registry.peek('s1'))
    scheduler.mark('s2', registry.peek('s2'))

    scheduler.flushAll()
    expect(fs.existsSync(file('s1'))).toBe(true)
    expect(fs.existsSync(file('s2'))).toBe(true)

    let writes = 0
    const realSave = registry.save.bind(registry)
    registry.save = ((id: string, b: Being) => {
      writes += 1
      realSave(id, b)
    }) as typeof registry.save
    scheduler.flushAll()
    expect(writes).toBe(0)
  })
})
