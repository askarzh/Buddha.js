import { describe, it, expect, vi, afterEach } from 'vitest'
import { reportSwallowed } from '../src/errors.js'

describe('reportSwallowed', () => {
  afterEach(() => vi.restoreAllMocks())

  it('names the site and the error on stderr', () => {
    const written: string[] = []
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      written.push(String(chunk))
      return true
    })

    reportSwallowed('realms: child run', new Error('socket hang up'))

    expect(written.join('')).toContain('realms: child run')
    expect(written.join('')).toContain('socket hang up')
  })

  it('never throws, whatever it is handed', () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    expect(() => reportSwallowed('x', { toString() { throw new Error('nope') } })).not.toThrow()
  })
})
