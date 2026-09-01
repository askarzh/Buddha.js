# Changelog

All notable changes to this project are documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

Prior to 0.4.0, `package.json`, the MCP server's `serverInfo.version`, the
Claude Code plugin manifest, and the MCPB manifest had drifted out of sync
(0.1.0 / 0.1.0 / 0.3.3 / 0.2.0 respectively) as each surface was bumped
independently across releases. From 0.4.0 on, all four are unified and bumped
together on every release.

## [0.7.0]

A debt-paydown release. The DSH plugin's circuit breaker becomes something a
model actually obeys, the CLI gets its first tests, and koans stop being a
fixed canon.

### Added

- **Koans the harness composes.** `KoanGenerator.present()` now accepts a koan
  object as well as an id. A composed koan is validated (id, title, case,
  source — the error names the missing field) and presented, but never joins
  the built-in collection. A harness that can only recite eleven stored cases
  cannot pose the question this agent, stuck in this way, actually needs.
- **A journal of recurring traps.** `recordResponse(koanId, text)` runs the
  existing dualistic-thinking detector and appends `{ koanId, traps, at }` to
  an in-memory journal; `getTrapJournal()` reads it and `getRecurringTrap()`
  names the trap appearing in the most entries (undefined under two
  occurrences). The journal records the TRAP, never a verdict on the response:
  there is no `correct`, no `score`, no pass/fail. A koan with a stored
  resolution is not a koan.
- `buddha_koan` (MCP) gains `title`/`case`/`source`/`hint` to compose a koan,
  `response` to record one, and `journal: true` to read the journal and the
  recurring trap. Still 16 tools.
- `/koan compose <title> | <case>` in the DSH plugin. A malformed compose
  reports usage rather than the "unknown koan id" message, which stays exactly
  as it was for the common case of a bad id.
- **`PathFactor.practice(effort, max?)` and `practiceTo(target)`** — the
  wisdom-cap computation in `Being.meditate()` had been open-coded; a factor
  can now be walked toward a target without a call site doing the arithmetic.
- **First tests for the CLI.** Command logic moved into a testable
  `src/cli/runner.ts` (100% line coverage) behind unchanged wrappers;
  behaviour preservation was proven byte-for-byte across 26 invocations of the
  built `dist/cli.mjs`.
- `scripts/check-versions.sh`, run first in CI: all five version surfaces
  (`package.json`, the plugin manifest, the MCPB manifest, `dsh/package.json`
  and the MCP `serverInfo`) must carry the same version.

### Changed

- **The DSH breaker now has three tiers: advise → withhold → refuse.** The
  advisory notice is delivered inside the tool result rather than as a loose
  user message; block withholds the crossing call's output; past the boundary
  a pre-execute deny refuses the call before it runs, so a doomed
  side-effecting call is no longer executed and then discarded. Each tier
  leads with a clause naming itself, derived from the outgoing decision so the
  text and the decision cannot disagree. `breaker.blockMultiplier` (default
  1.5) replaces the hard-coded `2 * threshold`.
- Recovery is by relief, not reset: a success on any tool clears that tool's
  streak and relieves every other tool to below the block boundary, so a
  read-only persona whose only tool is denied can still recover.
- **āsanna-kamma** — the death-proximate deed now breaks the rebirth tie, but
  only when the newest seed is not another instance of the dominant habit.
- `Citta`'s moment stream is bounded (51 moments) while `getTotalMoments()`
  keeps its documented meaning via a lifetime counter, so a long agent session
  is not misreported.
- `diagnose`, `chain` and `meditate` in the CLI now act on the being you named
  with `--being`; interactive `meditate` persists the real session, with
  effort derived from the timer's measured mindfulness ratio.
- The DSH plugin no longer bundles DSH's own runtime: `lib/index.js` is
  34.85 KB against a 181.51 KB baseline.
- Swallowed faults in `dsh/src` are traced to stderr by name rather than
  vanishing.

### Fixed

- One save per turn, and a being that is actually disposed: writes are batched
  per turn (with deliberate exemptions for `/rebirth` and for subagent vipāka,
  which settle outside any turn), and discarding an ephemeral child forgets
  its pending write so the file is not recreated after deletion.

### Note

The advisory tier is informational on models that reason about provenance. We
measured this three times against a live model: an advisory notice is
discounted as injected content regardless of how it is delivered. Enforcement
comes from the withhold and refuse tiers, which the same model obeys and
describes as a hard guard.

## [0.6.0]

One act, one record. Plus fixes found by running the plugin against a live
model rather than a mock.

### Removed (breaking)

- **The legacy `Karma` stream is gone.** Since 0.2.0, `Being.act()` wrote the
  deed twice — once as a `Karma` in `karmicStream`, once as a seed in
  `karmicStore` — and `receiveKarmicResults()` ripened both. A single
  `act('one deed', 5, 'aversion')` therefore produced two fruits and two
  entries in the experience history. One intention does not bear two fruits
  because the bookkeeping was written twice.

  The seed store is strictly richer — it has ripening conditions, timing
  windows, potency, ahosi expiry and the shaping of the next realm — so the
  stream was removed rather than the store:

  - `Being.getKarmicStream()` — removed. Use `being.karmicStore.getSeeds()`.
  - `KarmicResultsReport.results` — removed. Use `seedVipakas`, which the
    report already carried.
  - `BeingData.karmicStream` — no longer written. Saves made before 0.6.0 still
    load: the field is now optional and deliberately **ignored**, since
    restoring it would re-create the duplication. It disappears on the next
    save.
  - `BeingState.pendingKarma` now counts active seeds (it counted unmanifested
    stream entries), and the state summary line reads "Unripened karmic seeds".
  - The CLI's `karma --json` reports `karmicSeeds` where it reported
    `karmicStream`; `buddha_karma_ripen` (MCP) no longer returns `results`.

### Fixed

- **`/sit` no longer walks the protocol against nothing.** A bare `/sit`
  rendered the four steps for the placeholder "unnamed suffering", printing it
  four times — ceremony, when naming the suffering *is* the first step. It now
  sits with the session's most recent unwholesome seed (saying that it inferred
  it), and when the session has had no trouble at all it asks for a name
  instead of inventing one.
- **`/status`'s two karma counts no longer read as a contradiction.** The state
  summary reports the `Karma` stream while the seed block reports the
  `KarmicStore`; shown together as "Pending karmic seeds: 4" beside
  "KARMIC SEEDS: {active: 19}" they looked like one number disagreeing with
  itself. The summary line is now "Unripened karma in the stream", and the seed
  lines name their store.
- **`buddha-realms` says so when a delegation falls back to the human realm.**
  `dsh-tool-subagent` takes its persona from the tool entry's config, never
  from the model's arguments, so mounting the provider without pinning one
  silently produced `human` children — full tool access, the opposite of what a
  realm allowlist is for. Warned once per process, and the wiring is now
  documented (one tool entry per realm).
- **The Poison Arrow notice describes its number honestly.** It claimed a tool
  "has failed N times in a row" when N is a weighted pressure (an identical
  retry adds 2), and a live model spent a third of its report arguing the
  counter was broken.

### Changed

- All five version surfaces to **0.6.0**, including `dsh/package.json` — which
  had been deliberately held at 0.5.1 and now rejoins the unified line.

## [0.5.0]

DeepSeek Harness (Cordis) plugin: `dsh/`.

### Added

- **`dsh/` package** (`dsh-plugin-buddha`), a standalone
  [Cordis](https://github.com/deepseek-ai/dsh) plugin — own `package.json`,
  tests, and pnpm-only toolchain — bringing buddha-js to
  [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/dsh) agent
  sessions. `apply()` hoists one shared `BeingRegistry` (a buddha-js
  `Being` per DSH session, persisted to `<stateDir>/beings/<sessionId>.json`)
  and mounts five sub-plugins on top of it: a Poison Arrow circuit breaker
  for blind tool-retry loops, karma tracking that turns tool outcomes into
  `Being.experience()`/`act()` telemetry, a Layer A citta-vīthi observer
  that records step identity and runs one `Being.cognize()` per step,
  six-realm subagent personas (`deva`/`asura`/`human`) with per-realm tool
  allowlists on a `buddha-realms` provider, and four slash commands
  (`/sit`, `/koan`, `/status`, `/rebirth`). See the README's
  [DeepSeek Harness Plugin](README.md#deepseek-harness-plugin) section for
  the full failure-mode-to-mechanism mapping, install instructions, and
  config keys.
- `dsh/`'s own `typecheck` script (`tsc -p tsconfig.check.json`, a check-only
  config covering `src` **and** `tests` — the build `tsconfig.json` is
  `src`-only), wired into `pnpm test` via `pretest` so a real type-checking
  gate can't silently rot again, and so the type-level `satisfies` pins in
  `tests/compat.test.ts` are actually enforced.

### Changed

- **Unified versioning** now spans five surfaces instead of four:
  `package.json`, the MCP server's `serverInfo.version`, the Claude Code
  plugin manifest, the MCPB manifest, and `dsh/package.json` are all bumped
  together on every release from 0.5.0 on. (One deliberate exception in this
  release: `dsh/package.json` sits at **0.5.1**, not 0.5.0 — its content
  changed after the 0.5.0 unification commit, so it was patch-bumped on
  purpose. Do not "fix" it back down to 0.5.0; the next release brings all
  five surfaces level again.)

## [0.4.0]

Typed rebirth: transmigration into six realm classes.

### Added

- **Six realm classes** (`HumanBeing`, `DevaBeing`, `AsuraBeing`,
  `AnimalBeing`, `PretaBeing`, `NarakaBeing`), each extending `Being` and
  overriding only its `realm` getter and soft-modifier hooks
  (`meditationGainFactor`, `wisdomCap`, `unwholesomeReactionBoost`,
  `unpleasantIntensityShift`) — realms bias outcomes, they never disable
  part of the Being API.
- **`selectRealm`**, a realm selector driven by the karmic seed that shapes
  a rebirth (its dominant unwholesome root, or wholesome weight/strength)
  and, for the remaining wholesome-but-unweighted case, the inherited
  continuum's unwholesome share of total potency.
- **Vipāka starting faculties**: a freshly-transmigrated being's starting
  mindfulness and path-factor levels are derived from the potency-weighted
  wholesome share of the karmic balance it inherits — never copied from the
  being that transmigrated into it — and `rightView` is additionally capped
  by the new realm's `wisdomCap()`. Rebirth is a real reset; nobody is born
  liberated.
- **Observation-does-not-rebirth guard**: loading a being across the
  incarnation gap only sets `pendingRebirth`, it never enacts `rebirth()`
  itself. Every mutating MCP handler (`buddha_experience`, `buddha_act`,
  `buddha_karma_ripen`, `buddha_cognize`, `buddha_meditate`,
  `buddha_diagnose`, `buddha_inquiry`) settles a pending rebirth before
  doing its own work, persists the resulting new being, and attaches a
  `rebirth` note to its result. Read-only tools (`buddha_status`,
  `buddha_chain`) never settle one.
- Realm is now surfaced in `Being.getSeedStats()` (and so in
  `buddha_status`'s `seeds` block) and in `RebirthResult`
  (`fromRealm`/`toRealm`).

### Changed

- **BREAKING:** `Being.rebirth()` now returns a `RebirthResult` whose
  `being` field is a **new** `Being` instance (of the selected realm's
  class) instead of mutating the calling being in place. Only the karmic
  continuum (the `karmicStore` object and the incremented incarnation
  counter) passes to it; path levels, mind state, and experience history do
  not transfer. The dying being is detached from the continuum and must not
  be used again — callers must switch to `RebirthResult.being`.
- **Behavior change:** `Being.meditate()` now also develops `rightView`
  (Right View) for every being, alongside the path factors it already
  developed. This is a necessary consequence of the realm wisdom-cap hook:
  `wisdomCap()` only has an effect if something grows `rightView`, and
  nothing previously did — the deepest meditation-insight tier (which reads
  `rightView.developmentLevel`) was unreachable before this change.
  Consumers will see new insight text at high practice levels that was
  previously impossible to reach.

### Fixed

- `settlePendingRebirth()` no longer double-advances the incarnation counter on top of the gap-load's own +1, which was silently exhausting next-life seeds unripened on a caller's first mutating call after a gap.

## [0.3.0] (internal — never published separately; merged as PRs #8/#9)

The karmic seed/depth engine underlying 0.4.0's rebirth work. Not tagged or
released on its own; folded into this changelog for a complete history.

### Added

- Karmic seed ledger (`KarmicStore`) with conditional ripening and `whyNot`
  explanations for seeds that did not ripen, plus a `force` flag to ripen
  everything eligible deterministically.
- `Being.cognize()`: runs a full citta-vīthi (cognitive process moment
  stream) and plants karmic seeds from its javana moments, with seed timing
  derived from javana position (1st → `immediate`, 2nd-6th →
  `distant-future`, 7th → `next-life`).
- Incarnations and `Being.rebirth()` (pre-0.4.0 in-place form), with
  ahosi-kamma (timed-out) seed expiry on the transition.
- 16 MCP tools total (`buddha_cognize` and `buddha_rebirth` added to the
  original 14).
- v0.2.1 cross-review fixes: `isPartial` correctness, per-slug ripening
  condition rebind, alias dedupe, slug fallback, strong akusala/kusala root
  handling, CLI seed stats.

### Changed

- **BREAKING:** `Being.receiveKarmicResults()` now returns
  `{ results, seedVipakas, whyNot }` instead of a bare `KarmicResult[]`.

## [0.2.0]

Doctrinal correctness fixes.

### Changed

- **BREAKING:** `Being.act(description, intensity, root?)` — the `quality`
  parameter was removed; karmic quality is now derived from `root`.
- Nirodha is now modeled as unconditioned (asaṅkhata) — it no longer arises
  or ceases like a conditioned `Phenomenon`.
- Feeling valence is now orthogonal to intensity (five aggregates).
- Dependent origination implements a real cessation cascade; breaking the
  chain is now effective.
- The MCP server rejects unknown being names instead of silently
  auto-creating them.

## [0.1.0]

Initial CLI, MCP server, and Claude Code plugin.
