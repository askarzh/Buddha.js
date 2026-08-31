import { describe, it, expect } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { name, apply } from '../src/index.js'

describe('dsh-plugin-buddha mount', () => {
  it('applies against a bare Cordis Context with no injected services and disposes cleanly', async () => {
    const ctx = new Context()
    const fiber = ctx.plugin({ name, inject: [], apply })
    // A bare Context has none of `tools`/`commands`/`systemPrompt` (this
    // plugin's real `inject` list) registered. Loading with `inject: []`
    // here pins that `apply` itself never reaches for an uninjected
    // service at load time — it only mounts sub-plugins in later tasks,
    // which is where those services actually get touched.
    await expect(fiber).resolves.toBeDefined()
    await expect(fiber.dispose()).resolves.toBeUndefined()
  })
})
