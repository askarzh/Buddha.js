# v0.2 "Depth" Design: Wiring Citta and the Karmic Seed Engine into Being

**Status:** Approved by Askar on 2026-08-30 (direction, lives-mapping, conditions set, and ripen semantics each confirmed explicitly).
**Doctrinal basis:** Verified against the "Buddha Plain and Simple" NotebookLM sources on 2026-08-30 (conversation `45d68c3e`): (1) the citta-vīthi is a finer-grained description of the same process the suttas describe as the five aggregates — modeling them as disconnected parallel mechanisms is doctrinally incorrect; (2) karma is generated exclusively at the javana moments via cetanā; the 1st javana ripens only in this life (diṭṭhadhammavedanīya), the 7th in the next life (upapajjavedanīya), the 2nd–6th in any future life (aparāpariyavedanīya), each becoming defunct (ahosi) if its window passes; (3) ripening (vipāka) is conditional and delayed, weakened or counteracted by later wholesome action, with priority classes garuka (weighty) → āsanna (proximate) → āciṇṇa (habitual) → kaṭattā (reserve).

## Problem

The two most novel subsystems in the library — `Citta` (17-moment cognitive process, 52 cetasikas) and `KarmicEventSystem` (seeds with potency, delayed conditional ripening, purification) — have no callers. `Being` uses a shallow immediate-karma model: `receiveKarmicResults()` ripens everything instantly and unconditionally, so the simulation is uninteresting after one call, and the vīthi — canonically *the* generator of karma — generates nothing.

## Goals

1. Make karma conditional, delayed, and practice-sensitive (the KarmicStore becomes Being's karmic ledger).
2. Expose the vīthi as an observable *and generative* surface: `Being.cognize()` shows the moment stream and plants seeds from its javanas.
3. A Being lives across sessions: seeds planted today ripen in later incarnations, under conditions the user influences through practice.
4. Zero breakage of the existing API, tests (241), persisted beings, and MCP tool behavior (except where explicitly extended).

**Non-goals (deferred to v0.3+):** unifying `experience()` with the vīthi (requires the tests/mind/ foundation this phase creates); serializing Citta internals; collective karma; auto-ripening timers.

## Design

### 1. New Being members

```ts
readonly karmicStore: KarmicStore;   // constructed with { enableAutoRipening: false } — never a timer
private _incarnation = 1;            // canonical "life" counter
private _lastActiveAt: number;       // ms epoch, updated on every state-mutating call
cognize(content: string, senseBase?: SenseBase): CognitionResult;
rebirth(): RebirthResult;
dispose(): void;                     // defensive: stops any store timers
```

`experience()`, `act()`, `meditate()`, `faceSuffering()`, `investigateSelf()` keep their exact current signatures and observable behavior (existing tests are the contract).

### 2. Karma flow — two levels of description, one karma

**Sutta level — `act()` (unchanged signature).** Continues to append to `karmicStream` (pinned by `Being.persistence.test.ts:30`: exactly 1 entry per act) **and additionally** plants one seed in `karmicStore`:
- `quality`: derived from `root` via the same rule as `Intention` (never accepted from a caller — the KarmicStore adapter enforces this; `CreateSeedOptions.quality` is filled internally).
- `strength`: intensity 0–3 → `weak`, 4–7 → `moderate`, 8–10 → `strong`. (`weighty`/garuka is reserved for future explicit weighty acts.)
- `ripeningTiming`: `deferred`; `tags`: `[root, 'act']` plus a normalized description slug for habitual accumulation.

**Abhidhamma level — `cognize(content, senseBase?)`.** Steps:
1. **Cetasika sync (drift fix):** copy the current intensities of `mindfulness`, `wisdom`, `greed`, `aversion`, `delusion` from `Mind` into `Citta` via `activateCetasika`/`deactivateCetasika` (the five English alias keys exist in Citta's map). Consequence: `meditate()` genuinely changes javana quality.
2. Build `Ārammaṇa` from `content` + `senseBase`; `senseBase === 'mind'` or omitted → `processMentalObject`, else `processSenseObject` with the matching door.
3. Return `CognitionResult { moments, quality, karmicImpact, seedsPlanted }` for display.
4. **Seed planting from javanas** — collapse the 7 javana moments into at most 3 seeds (one per canonical timing category, so a vīthi cannot spam the store):
   - javana 1 (potency 1) → one seed, `ripeningTiming: 'immediate'` (diṭṭhadhamma: ripens only in the *current* incarnation, else ahosi), `strength: weak`;
   - javanas 2–6 (potency 2 each) → one seed, `ripeningTiming: 'distant-future'` (aparāpariya: any incarnation from the next onward, no expiry), `strength` from summed potency: `moderate`;
   - javana 7 (potency 1) → one seed, `ripeningTiming: 'next-life'` (upapajja: ripens only in incarnation `planted + 1`, else ahosi), `strength: weak`.
   - Seed `quality` = the vīthi's javana quality (kusala → wholesome, akusala → unwholesome); `root` = dominant active root cetasika, or the wholesome counterpart (`non-delusion` when wisdom/mindfulness drove kusala).
5. Persisting the incarnation window: each seed records `incarnationAtPlanting` in `tags` (`incarnation:<n>`), since `KarmicSeed` has no custom field; eligibility checks parse it.

**Citta is NOT serialized.** Between vīthis it is always back in bhavaṅga, and its relevant cetasikas are re-synced from `Mind` on every `cognize()` — its state is derived, so persistence would only preserve the unbounded `momentStream` (explicitly not wanted). `Being` constructs a fresh `Citta` per instance.

### 3. Ripening — `receiveKarmicResults(force = false)`

- Legacy path unchanged: pending `karmicStream` entries still manifest exactly as today (test contract).
- Store path, default (`force: false`): incarnation-window filter first (see §4), then `processRipeningQueue()` — time-gated, condition-gated, probabilistic. When nothing ripens, the return includes `whyNot`: per-seed unmet conditions ("mindfulness 2/5", "needs 3 similar acts, has 1") so the MCP tool can explain instead of returning an empty array.
- `force: true`: `forceRipen` every eligible (window-passing) active seed — deterministic path for demos/debugging.
- Ripened vipākas feed back through `this.experience({ valence: vipaka.quality→tone, intensity, ... })` exactly like the legacy path.

**Named ripening conditions** (minimal set), registered in the Being constructor and re-registered + `rebindConditions()` after `fromJSON`:
- `mindfulness-support` (weight 0.5): wholesome seeds ripen more readily as `mindfulnessLevel` rises (check: `mindfulnessLevel >= 5`).
- `habitual-accumulation` (weight 0.5): āciṇṇa — a seed with ≥ 3 same-tag active-or-ripened siblings passes.
- Base potency probability is KarmicStore's built-in behavior (kept).

**Store bug fixed in-scope:** `ripenSeed` currently overwrites the `exhausted` state with `ripened` after the final ripening (KarmicEventSystem.ts:468-500), so spent seeds still count toward `getKarmicBalance()`. Fix + regression test.

### 4. Incarnations and rebirth

- **Automatic:** on any load (`fromJSON`) where `now − lastActiveAt > INCARNATION_GAP_MS` (default 6h; override via `BUDDHA_INCARNATION_GAP_MS` for tests/impatient users), increment `incarnation` once. Works identically for MCP, CLI, and Desktop; does not tick per tool call.
- **Explicit:** `rebirth()` — increments `incarnation`, sweeps ahosi (marks as `exhausted` every `immediate` seed from past incarnations and every `next-life` seed whose window `planted+1` has passed), and returns a `RebirthResult` naming the seed that "shapes" the new birth by canonical priority: `weighty` strength first (garuka), else the seed with the largest same-tag accumulation (āciṇṇa), else the oldest active seed (kaṭattā). Purely descriptive in v0.2 — it does not mutate aggregates.
- Eligibility windows enforced at ripening time (§3): `immediate` ripens only while `incarnation === planted`; `next-life` only while `incarnation === planted + 1`; `distant-future` from `planted + 1` onward.

### 5. Serialization

`BeingData` gains three optional fields (legacy saves load with defaults — precedent: the `valence` field):

```ts
karmicStore?: KarmicStoreData;  // existing type; store.toJSON() already strips condition fns
incarnation?: number;           // default 1
lastActiveAt?: number;          // default Date.now() at load
```

Restore order in `deserializeBeing`: construct Being → `KarmicStore.fromJSON(data.karmicStore)` with `enableAutoRipening` forced false regardless of persisted config → assign → register named conditions → `rebindConditions()`. `Being._restoreState` extended accordingly.

### 6. MCP / plugin surface

- New tools: `buddha_cognize(name, content, senseBase?)` — returns the moment stream (staged, human-readable) + seeds planted; `buddha_rebirth(name)` — explicit rebirth with the shaping-seed report.
- `buddha_karma_ripen(name, force?)` — force flag; default response includes `whyNot` when nothing ripens.
- `buddha_status` — adds a `seeds` section: balance, counts by state and timing category, current incarnation.
- Plugin: update `karma`/`status` skills, add a `cognize` skill, list 16 tools in the command doc, **bump plugin version** (rule in CLAUDE.md), rebuild bundle (`build:plugin`), README/CLAUDE.md tool counts 14 → 16.

### 7. Testing strategy

Order matters — the pin tests come first, before any src change:
1. **New `tests/mind/Citta.test.ts` (currently zero coverage):** vīthi shapes (17 sense / 13 mental moments), stage order, javana potencies `1,2,2,2,2,2,1`, cetasika alias identity (`greed` and `lobha` are the same object), javana quality rules (mindfulness/wisdom ⇒ kusala precedence).
2. Store integration: act() dual-write; quality-from-root enforced at the adapter; seed counts per cognize (≤ 3); incarnation windows with `BUDDHA_INCARNATION_GAP_MS=0`-style injected time; ahosi sweep; ripen force vs conditional; `whyNot` content; the exhausted-state bug regression.
3. Serialization: round-trip with a populated store; legacy save without the new fields; conditions rebound after restore (a seed with `mindfulness-support` can ripen post-restore once mindfulness is raised).
4. All 241 existing tests unchanged and green; `getState()` gains additive fields only (update the shape assertion if it uses strict equality — additive, documented).

### 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Seed spam from repeated cognize | ≤ 3 seeds per vīthi; store's `maxSeeds` pruning stays |
| Timer leaks in MCP/CLI | `enableAutoRipening` forced false at construction AND restore; `dispose()` defensive |
| Mind↔Citta drift | one-way sync at cognize-time; Citta state is derived, never persisted |
| Legacy saves | all new BeingData fields optional with safe defaults + dedicated test |
| `pendingKarma` semantics change | unchanged — counts `karmicStream` only; seed stats are a new additive field |
| Randomness in tests | conditional-ripening tests use `force`, condition-only assertions, or seeded potency 100 |
