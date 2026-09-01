import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const lib = path.join(__dirname, '..', 'lib', 'index.js')

describe('built bundle', () => {
  // The plugin is loaded by a DSH host that already has these packages in
  // memory. Inlining copies means `instanceof` fails across the boundary and
  // module-scoped state (dsh-llm's WeakSet of agent-loop requests) is private
  // to our copy.
  it('imports DSH packages instead of inlining them', () => {
    const source = fs.readFileSync(lib, 'utf-8')
    // `Inbox` is dsh-agent's class (src/loop.ts imports it as a value); the
    // only current dsh-session import is type-only (erased at compile time),
    // so dsh-agent is the runtime witness that externalisation is wired up.
    expect(source).toMatch(/from ["']@deepseek-ai\/dsh-agent["']/)
    expect(source).not.toMatch(/class HarnessError/)
  })

  it('still inlines buddha-js, which the host does not provide', () => {
    const source = fs.readFileSync(lib, 'utf-8')
    expect(source).not.toMatch(/from ["']buddha-js["']/)
  })
})
