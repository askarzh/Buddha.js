# Changelog

All notable changes to this project are documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

Prior to 0.4.0, `package.json`, the MCP server's `serverInfo.version`, the
Claude Code plugin manifest, and the MCPB manifest had drifted out of sync
(0.1.0 / 0.1.0 / 0.3.3 / 0.2.0 respectively) as each surface was bumped
independently across releases. From 0.4.0 on, all four are unified and bumped
together on every release.

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
- `dsh/`'s own `typecheck` script (`tsc --noEmit -p .`), wired into `pnpm
  test` via `pretest` so a real type-checking gate can't silently rot again.

### Changed

- **Unified versioning** now spans five surfaces instead of four:
  `package.json`, the MCP server's `serverInfo.version`, the Claude Code
  plugin manifest, the MCPB manifest, and `dsh/package.json` are all bumped
  together on every release from 0.5.0 on.

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
