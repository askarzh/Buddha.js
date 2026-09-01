import type { Context } from '@deepseek-ai/cordis'
import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import { PoisonArrow } from 'buddha-js'
import type { Being } from 'buddha-js'
import type { BeingRegistry } from './being-registry.js'
import { reportSwallowed } from './errors.js'
import type { KoanSessions } from './koans.js'
import type { VithiHandle } from './vithi.js'

/**
 * Four human slash commands (`/sit`, `/koan`, `/status`, `/rebirth`) that
 * dispatch straight to a handler — no model round trip, per dsh's
 * `ctx.commands` contract (`CommandDefinition.handler` "executes against
 * the receiving agent without sending the command to the model").
 *
 * `/status` is read-only (v0.3 rule, restated in the plan's Global
 * Constraints): it only ever calls `registry.peek()`, which loads-or-creates
 * but NEVER settles a pending rebirth and NEVER writes to disk. `/rebirth` is
 * the mutating counterpart: `registry.acquire()` first (settling any pending
 * rebirth), and only when nothing was pending does it force a fresh
 * `being.rebirth()` — either way the resulting NEW being is persisted under
 * the same session id.
 */

function sessionIdOf(invocation: CommandInvocation): string {
  return invocation.agent.id
}

/**
 * Render the four-step Poison Arrow cessation protocol for `/sit`.
 *
 * A bare `/sit` used to walk the whole protocol against the placeholder
 * "unnamed suffering", printing it four times. The protocol's first step is
 * to NAME the suffering, so an unnamed one is a contradiction: it reads as
 * ceremony, and there is nothing to investigate at step two. Instead, fall
 * back to what this session actually struggled with — the most recent
 * unwholesome seed, which is what the breaker plants on a blind retry — and
 * when the session has no such trouble, ask for a name instead of inventing
 * one.
 */
function renderSit(rawInput: string, being: Being): CommandResult {
  const named = rawInput.trim()
  const suffering = named || mostRecentStruggle(being)
  if (!suffering) {
    return {
      kind: 'success',
      text:
        'Nothing in this session has gone wrong yet, so there is nothing to name.\n' +
        'Name it yourself to sit with it: /sit <what hurts>  (e.g. /sit the migration keeps failing)',
    }
  }

  const arrow = new PoisonArrow(suffering)
  for (let i = 0; i < 4; i++) {
    arrow.step()
  }
  const inferred = named ? '' : `(no suffering named — sitting with this session's most recent one)\n\n`
  return { kind: 'success', text: inferred + arrow.getSummary() }
}

/**
 * The description of this being's most recent unwholesome seed, or undefined
 * when it has none. Read-only, like everything `/sit` and `/status` do.
 */
function mostRecentStruggle(being: Being): string | undefined {
  const unwholesome = being.karmicStore
    .getSeeds()
    .filter((seed) => seed.quality === 'unwholesome')
    .sort((a, b) => a.createdAt - b.createdAt)
  return unwholesome.at(-1)?.description
}

/** Format a koan for the terminal. */
function formatKoan(koan: { id: string; title: string; case: string; source: string; hint?: string }): string {
  const hint = koan.hint ? `\nHint: ${koan.hint}` : ''
  return `[${koan.id}] ${koan.title}\n\n${koan.case}\n\n(source: ${koan.source})${hint}`
}

/**
 * `/koan compose <title> | <case>` — a koan written for the situation at
 * hand rather than drawn from the canon. Composed koans are presented and
 * then let go; they never join the collection, and they have no answer.
 */
function renderComposedKoan(argument: string, sessionId: string, koans: KoanSessions): CommandResult {
  const [title, ...rest] = argument.split('|')
  const body = rest.join('|').trim()
  if (body === '' || title.trim() === '') {
    return { kind: 'error', text: 'Usage: /koan compose <title> | <case>' }
  }
  const generator = koans.forSession(sessionId)
  try {
    const koan = generator.present({
      id: 'composed',
      title: title.trim(),
      case: body,
      source: 'composed by the harness',
    })
    koans.rememberPresented(sessionId, koan.id)
    return { kind: 'success', text: formatKoan(koan) }
  } catch (error) {
    reportSwallowed('commands: /koan compose', error)
    return { kind: 'error', text: `Could not compose that koan: ${(error as Error).message}` }
  }
}

/**
 * `/koan respond <text>` — record a response to the koan this session was
 * last shown. Recorded, never graded: the journal names the trap the words
 * fell into and nothing else. There is no right answer to report back.
 */
function renderKoanResponse(argument: string, sessionId: string, koans: KoanSessions): CommandResult {
  const response = argument.trim()
  if (response === '') {
    return { kind: 'error', text: 'Usage: /koan respond <your response>' }
  }
  const koanId = koans.lastPresented(sessionId)
  if (koanId === undefined) {
    return { kind: 'error', text: 'No koan has been presented in this session yet. Try /koan first.' }
  }
  const generator = koans.forSession(sessionId)
  try {
    const entry = generator.recordResponse(koanId, response)
    const traps = entry.traps.length > 0 ? entry.traps.join(', ') : 'none detected'
    const recurring = generator.getRecurringTrap()
    const returning = recurring ? `\nThe shape you keep returning to: ${recurring}.` : ''
    return {
      kind: 'success',
      text:
        `Recorded against [${koanId}]. Traps in these words: ${traps}.${returning}\n` +
        '(A trap is not a verdict. The koan has no answer to be right about.)',
    }
  } catch (error) {
    reportSwallowed('commands: /koan respond', error)
    return { kind: 'error', text: `Could not record that response: ${(error as Error).message}` }
  }
}

/** `/koan journal` — this session's recorded traps, and the one that recurs. */
function renderKoanJournal(sessionId: string, koans: KoanSessions): CommandResult {
  const generator = koans.forSession(sessionId)
  const entries = generator.getTrapJournal()
  if (entries.length === 0) {
    return {
      kind: 'success',
      text: 'No responses recorded in this session yet. Record one with /koan respond <text>.',
    }
  }
  const lines = entries.map(
    (entry) => `[${entry.koanId}] ${entry.traps.length > 0 ? entry.traps.join(', ') : 'no trap detected'}`,
  )
  const recurring = generator.getRecurringTrap()
  lines.push('', recurring ? `Recurring trap: ${recurring}` : 'No trap has recurred yet.')
  return { kind: 'success', text: lines.join('\n') }
}

/** Present a koan by id (or a random one), or report the known ids on a bad id. */
function renderKoan(rawInput: string, sessionId: string, koans: KoanSessions): CommandResult {
  const requested = rawInput.trim()
  for (const [word, render] of [
    ['compose', renderComposedKoan],
    ['respond', renderKoanResponse],
  ] as const) {
    if (requested === word || requested.startsWith(`${word} `)) {
      return render(requested.slice(word.length).trim(), sessionId, koans)
    }
  }
  if (requested === 'journal') {
    return renderKoanJournal(sessionId, koans)
  }

  const id = requested === '' ? undefined : requested
  const generator = koans.forSession(sessionId)
  try {
    const koan = generator.present(id)
    koans.rememberPresented(sessionId, koan.id)
    return { kind: 'success', text: formatKoan(koan) }
  } catch (error) {
    // The common case is a bad/unknown id, so the user-facing message stays
    // exactly that. But a fault here could also be the generator itself
    // breaking, which that message would misreport as "unknown id" — trace
    // it to stderr for the rare case that isn't.
    reportSwallowed('commands: /koan', error)
    const known = generator
      .getCollection()
      .map((koan) => koan.id)
      .join(', ')
    return { kind: 'error', text: `Unknown koan id "${id}". Known: ${known}` }
  }
}

/** Render the current session being's status. Read-only: never settles, never saves. */
function renderStatus(registry: BeingRegistry, vithi: VithiHandle, invocation: CommandInvocation): string {
  const being = registry.peek(sessionIdOf(invocation))
  const seedStats = being.getSeedStats()
  const lastVithi = vithi.getLastVithi(invocation.agent)

  const lines = [
    being.getSummary(),
    '',
    `REALM: ${being.realm} (incarnation ${being.incarnation})`,
    // Named for their store so the numbers are traceable: `getSummary()`
    // above counts ACTIVE seeds, these count seeds by every state, so the two
    // legitimately differ.
    `KARMIC SEEDS (store): ${JSON.stringify(seedStats.byState)}`,
    `KARMIC BALANCE (store, potency-weighted): ${JSON.stringify(seedStats.balance)}`,
  ]
  if (lastVithi) {
    lines.push(
      `LAST VĪTHI: ${lastVithi.quality} (${lastVithi.moments.length} moments, karmic impact: ${lastVithi.karmicImpact})`
    )
  }
  return lines.join('\n')
}

/**
 * Mount `/sit`, `/koan`, `/status`, `/rebirth`.
 *
 * Unlike `applyBreaker`/`applyKarma`/`applyVithi` (which only touch `ctx.on`,
 * a core service present on every context), registering commands genuinely
 * needs `ctx.commands` — reading it eagerly would break even when this
 * plugin's own `inject` list declares `'commands'`, because `index.ts`'s
 * `apply()` is itself invoked with `inject: []` overridden in
 * `tests/mount.test.ts` against a bare `Context` that never provides the
 * service (Cordis's `ctx.get('commands', ...)` throws "cannot get property
 * ... without inject" in that case — accessing `ctx.commands` directly is
 * not merely `undefined`, it throws). So registration is deferred behind
 * `ctx.inject(['commands'], callback)` (shorthand for `ctx.plugin({inject:
 * ['commands'], apply: callback})`, same idiom the brief documents for
 * Task 9's `ctx.agents` access): the callback only runs once `commands` is
 * actually provided, and simply never runs against a context (real or
 * bare-for-testing) that never provides it — matching the "never touches an
 * uninjected service" contract `mount.test.ts` pins, without needing this
 * whole plugin's own `apply()` to block on it. The registration disposers
 * are owned by the fiber `ctx.inject` creates.
 *
 * Returns that fiber (also a `PromiseLike<Fiber>`, resolving once loading
 * settles) so a test can `await` past the async service-availability check
 * before asserting on what got registered; `index.ts`'s real call site
 * ignores the return value.
 */
export function applyCommands(
  ctx: Context,
  deps: { registry: BeingRegistry; vithi: VithiHandle; koans: KoanSessions },
) {
  const { registry, vithi, koans } = deps

  return ctx.inject(['commands'], (ctx) => {
    registerDefinitions(ctx, registry, vithi, koans)
  })
}

function registerDefinitions(
  ctx: Context,
  registry: BeingRegistry,
  vithi: VithiHandle,
  koans: KoanSessions,
): void {
  ctx.commands.register({
    name: 'sit',
    description: 'Quick relief: walk the four-step Poison Arrow cessation protocol for a named suffering.',
    handler(invocation: CommandInvocation): CommandResult {
      return renderSit(invocation.rawInput, registry.peek(sessionIdOf(invocation)))
    },
  })

  ctx.commands.register({
    name: 'koan',
    description:
      'Present a Zen koan (optionally by id), compose one for the situation at hand ' +
      '(/koan compose <title> | <case>), record a response (/koan respond <text>), ' +
      "or read this session's trap journal (/koan journal).",
    handler(invocation: CommandInvocation): CommandResult {
      return renderKoan(invocation.rawInput, sessionIdOf(invocation), koans)
    },
  })

  ctx.commands.register({
    name: 'status',
    description: "Show this session's being: state summary, realm, and karmic seeds. Read-only.",
    handler(invocation: CommandInvocation): CommandResult {
      return { kind: 'success', text: renderStatus(registry, vithi, invocation) }
    },
  })

  ctx.commands.register({
    name: 'rebirth',
    description: 'Force this session into its next rebirth, settling any pending rebirth first.',
    handler(invocation: CommandInvocation): CommandResult {
      const sessionId = sessionIdOf(invocation)
      const acquired = registry.acquire(sessionId)
      const rebirth = acquired.rebirth ?? acquired.being.rebirth()
      // DELIBERATELY a direct write, never `scheduler.mark()`: a human typed
      // `/rebirth` and expects the new incarnation to be durable the moment
      // the command returns, not at the next turn boundary. Pinned by
      // tests/commands.test.ts ("/rebirth writes through immediately").
      registry.save(sessionId, rebirth.being)

      const shaping = rebirth.shapingSeed ? ` — shaped by: ${rebirth.shapingSeed.description}` : ''
      return { kind: 'success', text: `${rebirth.fromRealm} → ${rebirth.toRealm}${shaping}` }
    },
  })
}
