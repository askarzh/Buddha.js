import type { Context } from '@deepseek-ai/cordis'
import { Config } from './config.js'

export { Config }

export const name = 'dsh-plugin-buddha'

// 'subagents' and 'llm' are injected by the sub-plugins that need them, not
// by this root plugin, so they are deliberately absent from `inject` here.
export const inject = ['tools', 'commands', 'systemPrompt']

export function apply(_ctx: Context, _config: Config) {
  // Mounts sub-plugins (Poison Arrow circuit breaker, karma tracking,
  // citta-vithi loop) in later tasks. Intentionally a no-op for now: the
  // mount test (tests/mount.test.ts) pins that loading this plugin against a
  // bare Cordis Context never touches an uninjected service.
}
