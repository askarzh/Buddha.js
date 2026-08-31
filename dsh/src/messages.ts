import { randomUUID } from 'node:crypto'

/**
 * Plugin-sourced message construction.
 *
 * dsh identifies every message with a branded `MessageId` and mints it the
 * same way everywhere: `MessageId(crypto.randomUUID())`, then freezes the
 * message before publication. That pattern is transcribed here from
 * `@deepseek-ai/dsh-llm`'s `MessageId`/`createUserMessage`/`freezeMessage`
 * (see `workspaceContextMessage()` in the installed
 * `@deepseek-ai/dsh-agent-instructions` plugin, which builds exactly the
 * `{ id, role: 'user', content: [...], source: { kind: 'plugin', plugin } }`
 * shape this module produces) rather than imported at runtime: dsh-llm is a
 * devDependency of this package (needed only for its types and by tests),
 * not a declared runtime `dependency` — taking a hard runtime dependency on
 * it here would silently change that contract without anyone noticing a
 * `package.json` diff.
 */

/** Stable identity carried by one message, branded like dsh-llm's own `MessageId`. */
export type MessageId = string & { readonly __brand: 'MessageId' }

/**
 * Brand a message identifier. No validation is performed — mirrors
 * `MessageId(id)` in `@deepseek-ai/dsh-llm`.
 */
export function MessageId(id: string): MessageId {
  return id as MessageId
}

export interface PluginTextContent {
  readonly type: 'text'
  readonly text: string
}

/** Where a plugin-sourced message came from: this plugin, by name. */
export interface PluginMessageSource {
  readonly kind: 'plugin'
  readonly plugin: string
}

/** A user-role message this plugin injects into what the model sees. */
export interface PluginUserMessage {
  readonly id: MessageId
  readonly role: 'user'
  readonly content: readonly PluginTextContent[]
  readonly source: PluginMessageSource
}

/** This plugin's `name` export (duplicated here to avoid a cycle with `index.ts`). */
const PLUGIN_NAME = 'dsh-plugin-buddha'

/**
 * Build one immutable, plugin-sourced `UserMessage` carrying `text`, with a
 * fresh `MessageId` and `source: { kind: 'plugin', plugin: 'dsh-plugin-buddha' }`
 * — the shape dsh's `additionalContexts` expects for context this plugin
 * injects into the model-facing transcript (e.g. the Poison Arrow cessation
 * protocol).
 */
export function pluginUserMessage(text: string): PluginUserMessage {
  return Object.freeze({
    id: MessageId(randomUUID()),
    role: 'user' as const,
    content: Object.freeze([Object.freeze({ type: 'text' as const, text })]),
    source: Object.freeze({ kind: 'plugin' as const, plugin: PLUGIN_NAME }),
  })
}
