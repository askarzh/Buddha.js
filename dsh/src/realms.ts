import type { Context } from '@deepseek-ai/cordis'
import type {
  ResolvedSubagentStartRequest,
  SubagentRun,
  SubagentStartRequest,
  SubagentStopReason,
} from '@deepseek-ai/dsh-subagent'
import type { ToolRestriction } from '@deepseek-ai/dsh-tools'
import { Being, REALM_CLASSES, type Intensity } from 'buddha-js'
import type { BeingRegistry } from './being-registry.js'
import type { SaveScheduler } from './persistence.js'

/** The three personas this provider maps to — a subset of buddha-js's six-realm `Realm` type. */
export type SubagentRealm = 'deva' | 'asura' | 'human'

/**
 * Finite tool allowlists for deva (read-only architect) and asura
 * (read + bash adversarial auditor). Human has no allowlist — every tool
 * stays visible, matching the "human implementer" persona's full access.
 */
const ALLOWED_TOOLS: Record<'deva' | 'asura', readonly string[]> = {
  deva: ['read', 'glob', 'grep', 'read_image'],
  asura: ['read', 'glob', 'grep', 'read_image', 'bash'],
}

/**
 * Persona prompt sections and tool filters for the three realms a subagent
 * can be spawned into. Each `toolFilter` is a name predicate (matching the
 * task interface) used both for direct unit inspection and to build the
 * `ToolRestriction` handed to the `spawn` provider (see `combineToolFilter`).
 *
 * - **deva** (architect): divine comfort dulls the urgency that drives
 *   careful work — restricted to read-only tools so the deva child can only
 *   observe and plan, never act unilaterally.
 * - **asura** (adversarial auditor): rivalry and envy of the devas run
 *   aversion-toned reactions hotter — channeled into an adversarial,
 *   skeptical audit stance, with read tools plus `bash` to actually probe
 *   claims (never `write`/`edit` — an auditor does not fix what it finds).
 * - **human** (implementer): the baseline, neutral realm — full tool access,
 *   balancing the deva's caution and the asura's suspicion into actual work.
 */
export const REALM_PERSONAS: Record<SubagentRealm, { text: string; toolFilter: (name: string) => boolean }> = {
  deva: {
    text:
      'You are a deva architect: born into heavenly comfort, tasked with seeing the whole design clearly ' +
      'before anything is built. Read, survey, and plan — do not touch the filesystem or run commands. ' +
      "Caveat: a deva's comfort dulls urgency — do not let ease substitute for rigor. Produce a clear plan, " +
      'not a vague gesture at one.',
    toolFilter: (name) => (ALLOWED_TOOLS.deva as readonly string[]).includes(name),
  },
  asura: {
    text:
      'You are an asura, an adversarial auditor: rivalrous, skeptical, and unwilling to take a claim at face ' +
      'value. Read the work and use commands to actually verify it — run tests, reproduce failures, check ' +
      'assumptions. Do not edit or write; your role is to find what is wrong, not to fix it. Caveat: rivalry ' +
      'and envy run your reactions hot — stay rigorous, not merely contrarian.',
    toolFilter: (name) => (ALLOWED_TOOLS.asura as readonly string[]).includes(name),
  },
  human: {
    text:
      'You are a human implementer: the baseline, ordinary birth, neutral on every hook. Full tool access — ' +
      'do the actual work: read, write, edit, run commands. Caveat: balance is the whole discipline here — ' +
      "neither a deva's detachment nor an asura's suspicion, just grounded, careful implementation.",
    toolFilter: () => true,
  },
}

/** Unknown or absent persona names fall back to 'human' — the neutral, default birth. */
export function toRealm(persona: string | undefined): SubagentRealm {
  return persona === 'deva' || persona === 'asura' ? persona : 'human'
}

/**
 * Warn when a delegation lands in 'human' by fallback rather than by request.
 *
 * `dsh-tool-subagent` takes its persona from the TOOL ENTRY'S CONFIG
 * (`persona: config.persona`), never from the model's arguments — so an
 * operator who mounts this provider without also pinning a persona gets a
 * silent degradation into 'human', which is FULL tool access: exactly the
 * opposite of what a realm allowlist is for. A live trial hit this and read
 * as working, because the child role-played the persona named in its prompt
 * while actually holding every tool. Say it out loud instead.
 *
 * Written straight to stderr rather than through `ctx.logger`: at dsh
 * 0.1.1-rc.2 nothing registers a logger exporter, so `ctx.logger(...).warn()`
 * is discarded before it reaches any stream (cordis drops a record when no
 * exporter accepts its level). A misconfiguration that hands a child full tool
 * access has to be visible, so it goes where it will actually be seen. Warned
 * once per process — the persona comes from static config, so every later
 * delegation would repeat the same line.
 */
let warnedFallbackPersona = false

function warnFallbackPersona(persona: string | undefined): void {
  if (warnedFallbackPersona) return
  warnedFallbackPersona = true
  const named = persona === undefined ? 'no persona' : `unknown persona "${persona}"`
  process.stderr.write(
    `buddha-realms: ${named} on this delegation — the child is born 'human', which grants FULL tool access. ` +
      "Personas come from the subagent tool entry's own config " +
      '(`config: { provider: buddha-realms, persona: deva }`), not from the model — ' +
      'mount one tool entry per realm to get the deva/asura tool filters.\n',
  )
}

/** Test seam: reset the once-per-process latch above. */
export function resetPersonaWarning(): void {
  warnedFallbackPersona = false
}

/**
 * Combine the caller's existing `ToolRestriction` (if any) with the realm's
 * allowlist. Human adds no restriction of its own (existing restriction, if
 * any, passes through unchanged). Deva/asura narrow to their allowlist,
 * intersected with any allowlist the caller already had; any pre-existing
 * `deny` list is preserved (redundant against the narrowed allowlist, but
 * harmless to carry forward).
 */
function combineToolFilter(existing: ToolRestriction | undefined, realm: SubagentRealm): ToolRestriction | undefined {
  if (realm === 'human') return existing

  const allowlist = ALLOWED_TOOLS[realm]
  const allow = existing?.allow ? existing.allow.filter((name) => allowlist.includes(name)) : [...allowlist]
  return existing?.deny && existing.deny.length > 0 ? { allow, deny: existing.deny } : { allow }
}

/**
 * Construct the child's Being: a new instance of the chosen realm's class
 * (buddha-js's `REALM_CLASSES`, per the anattā discipline — the child gets a
 * fresh, empty karmic continuum of its own, not the parent's). Starting
 * faculties are conditioned by the parent's inherited karmic balance,
 * mirroring `Being.rebirth()`'s vipāka rule (spec §4) through the PUBLIC
 * surface only (`karmicStore.getKarmicBalance()`, `path.getAllFactors()`,
 * `PathFactor.practice()`) — `Being.applyStartingFaculties` itself is
 * private and not part of this plugin's dependency surface.
 */
function transmigrateChild(parentBeing: Being, realm: SubagentRealm): Being {
  const child = new REALM_CLASSES[realm]()

  const balance = parentBeing.karmicStore.getKarmicBalance()
  const totalPotency = balance.wholesome + balance.unwholesome + balance.neutral
  const share = totalPotency === 0 ? 0 : balance.wholesome / totalPotency

  for (const factor of child.path.getAllFactors()) {
    const effort = Math.min(10, Math.max(0, Math.round(share * 10))) as Intensity
    if (effort > 0) {
      factor.practice(effort)
    }
  }

  return child
}

/**
 * Plant the child run's outcome back into the PARENT being as vipāka: a
 * completed run is a wholesome act (non-delusion — the delegation bore
 * fruit), anything else (aborted/error/max-tokens/refusal) is an
 * unwholesome one (delusion — the delegation did not resolve cleanly).
 * Settles any pending rebirth first (subagent start is a mutating path,
 * per the v0.3 access discipline), and persists the result.
 */
function plantVipaka(
  registry: BeingRegistry,
  scheduler: SaveScheduler,
  parentSessionId: string,
  realm: SubagentRealm,
  stopReason: SubagentStopReason
): void {
  const { being } = registry.acquire(parentSessionId)
  if (stopReason === 'completed') {
    being.act(`${realm} subagent completed`, 6, 'non-delusion')
  } else {
    being.act(`${realm} subagent ended: ${stopReason}`, 6, 'delusion')
  }
  // Marked, not written: this is the PARENT's being, whose turn write happens
  // at `agent/turn-stopping` (or at session end). The child's own save below
  // stays direct — see `startRealmChild`.
  scheduler.mark(parentSessionId, being)
}

/**
 * Handle one delegated start: map the request's persona to a realm, seed a
 * fresh child Being from the parent's karmic balance, rewrite the request
 * with the realm's persona text and tool filter, and forward it to the
 * stock in-process `spawn` provider (`@deepseek-ai/dsh-subagent-spawn-in-process`).
 * `ctx.subagents.start('spawn', ...)` itself fails loud (throws) when no
 * `spawn` provider is registered in this composition — no silent
 * degradation.
 *
 * The child's ephemeral Being is persisted under the published run's own
 * session id (`run.id`) only so `discard()` has something to clean up; once
 * the run settles, the parent gains its vipāka act and the child's being
 * (and any file it was given) is discarded — it leaves no trace, matching
 * `BeingRegistry.discard`'s ephemeral-being contract.
 */
async function startRealmChild(
  ctx: Context,
  registry: BeingRegistry,
  scheduler: SaveScheduler,
  request: ResolvedSubagentStartRequest
): Promise<SubagentRun> {
  const realm = toRealm(request.persona)
  if (request.persona !== realm) warnFallbackPersona(request.persona)
  const persona = REALM_PERSONAS[realm]
  const parentSessionId = request.parent.id

  const { being: parentBeing } = registry.acquire(parentSessionId)
  const child = transmigrateChild(parentBeing, realm)

  const { descriptor: _descriptor, ...rest } = request
  const rewritten: SubagentStartRequest = {
    ...rest,
    persona: persona.text,
    toolFilter: combineToolFilter(request.toolFilter, realm),
  }

  const run = await ctx.subagents.start('spawn', rewritten)

  const childSessionId = String(run.id)
  // DELIBERATELY a direct write, never `scheduler.mark()`: the child being
  // must exist on disk before the run starts, so the `discard()` below has a
  // file to remove when the run settles. Deferring it to a flush would leave
  // an orphan file written after the discard. Pinned by
  // tests/realms.test.ts ("the child being file is written directly").
  registry.save(childSessionId, child)

  run.result
    .then((result) => {
      plantVipaka(registry, scheduler, parentSessionId, realm, result.stopReason)
    })
    .finally(() => {
      registry.discard(childSessionId)
    })
    .catch(() => {
      // Best-effort vipāka/cleanup: a rejection here is an infrastructure
      // fault the seam itself would already have surfaced to `run.result`'s
      // other consumers; this listener must not throw unhandled.
    })

  return run
}

/**
 * Mount the `buddha-realms` subagent provider.
 *
 * Like `applyCommands`'s `ctx.commands` registration, this genuinely needs
 * `ctx.subagents` — reading it eagerly would break `tests/mount.test.ts`'s
 * bare `Context`. Registration is deferred behind `ctx.inject(['subagents'],
 * ...)`, which only runs its callback once the `subagents` service is
 * actually provided, and never runs at all against a context that never
 * provides it. Returns the `ctx.inject` fiber so a test can `await` past
 * the async service-availability check.
 */
export function applyRealms(ctx: Context, deps: { registry: BeingRegistry; scheduler: SaveScheduler }) {
  const { registry, scheduler } = deps

  return ctx.inject(['subagents'], (ctx) => {
    ctx.subagents.registerProvider({
      name: 'buddha-realms',
      capabilities: { outputSchema: false, depthLimit: true, toolFilter: true, persona: true },
      inheritsParentContext: false,
      async start(request: ResolvedSubagentStartRequest): Promise<SubagentRun> {
        return startRealmChild(ctx, registry, scheduler, request)
      },
    })
  })
}
