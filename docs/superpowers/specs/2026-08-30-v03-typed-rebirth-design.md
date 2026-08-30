# v0.3 "Typed Rebirth / Six Realms" Design

**Status:** Direction and all four open design questions approved by Askar on 2026-08-30 (soft realm modifiers; karma-derived starting faculties; typed rebirth replaces in-place rebirth; bardo deferred to v0.4).
**Origin:** Askar's insight — rebirth in a typed language should not be object-to-object of the same class: the next arising may be a completely different class, with rebirth as a generic method transmigrating into another type.
**Doctrinal basis:** Verified against the notebook sources on 2026-08-30 (conversation with the video source «Буддизм: Религия, философия или психология?» included). Verbatim verdict: modeling rebirth as instantiating a NEW object of a potentially DIFFERENT realm class, passing ONLY the karmic continuum as constructor input, is "doctrinally spot-on" — no soul object migrates; the terminal death-consciousness (cuti-citta) conditions the initialization of the new stream (paṭisandhi-citta). The candle-flame simile (Milinda Pañha): the new flame is neither the same nor entirely other. Realm selection by dominant root is canonical: greed → preta, hatred → naraka, delusion → animal; wholesome karma → human/deva; the human birth is the "precious" one (balanced between pleasure and pain — the only realm where practice thrives); deva luxury canonically dulls practice (pamāda, weakened saṃvega). Schools split on the intermediate state (Theravāda: none, cuti→paṭisandhi in the next moment; Sarvāstivāda/Tibetan: bardo up to 49 days) — that split is the v0.4 "school switch".

## Problem

v0.2's `rebirth()` increments a counter on the same object. Doctrinally, rebirth is transmigration without a transmigrator: nothing persists but the karmic stream, and the next arising can be a different kind of being entirely. The type system can say this precisely — and currently doesn't.

## Goals

1. Rebirth constructs a **new object of a realm-specific class**; the dying being is disposed; **only the `KarmicStore` (plus the incarnation counter) passes** — the strongest anattā statement the library can make.
2. The **shaping seed selects the realm** by the canonical poison/quality mapping.
3. Realms shape life **softly** (modifiers, never removed capabilities) — every MCP tool keeps working in every realm.
4. Starting faculties of the new birth are **vipāka**: derived from the inherited karmic balance, not copied from the previous life.
5. Zero breakage: legacy saves (no realm) load as human; all 281 tests stay green; MCP tool count unchanged (16) — only response shapes grow.

**Non-goals (v0.4+):** Bardo intermediate state (school switch); asura-specific mechanics beyond the selector; realm-specific new tools.

## Task 0 — pre-fixes (from the 2026-08-30 Antigravity/Gemini cross-review, each verified against source)

Fixed before any v0.3 feature work, in one small task:
1. `KarmicEventSystem.ts:~485` — `isPartial` computed before `timesRipened` increment (always true; currently dead field — fix and add a consumer-facing test).
2. Proper per-slug rebind for `habitual-accumulation` after restore (replaces the v0.2 store-wide fallback; register `habitual-accumulation:<slug>` names from restored seeds' tags).
3. `Citta.getActiveCetasikaNames()` returns alias duplicates (greed + lobha are one object under two keys) — dedupe by object identity.
4. `Being.slugOf` can return `undefined` when the description equals a structural tag — fall back to a safe slug.
5. `Citta.assessKarmicImpact` gates `'strong'` on wisdom only, so unwholesome karma can never be strong — canonically weighty unwholesome karma exists; gate on javana intensity/roots as well.
6. Kusala cognize seeds always get root `'non-delusion'` — derive from the dominant wholesome cetasika (mindfulness/wisdom → non-delusion stays the default, but do not hardcode when non-greed/non-aversion analogues are active).
7. CLI `status --json` parity: add `seeds` + `incarnation` (matches MCP `getStatus`).

## Design

### 1. Realm classes

`Realm = 'human' | 'deva' | 'asura' | 'animal' | 'preta' | 'naraka'`.

Six classes extend `Being`; `Being` itself remains concrete and human-equivalent (legacy compatibility):

```ts
class HumanBeing  extends Being {}                    // no modifiers — the precious birth
class DevaBeing   extends Being { /* meditation gain ×0.5 (pamāda); vitality 10 */ }
class AsuraBeing  extends Being { /* meditation gain ×0.75; reactions bias toward aversion */ }
class AnimalBeing extends Being { /* wisdom (rightView) development capped at 4 */ }
class PretaBeing  extends Being { /* craving reactions amplified: unwholesome factor intensities +2 */ }
class NarakaBeing extends Being { /* experiences: unpleasant valence intensified +2; meditation gain ×0.75 */ }
```

Modifiers are implemented as **protected hook methods on `Being`** (e.g., `meditationGainFactor(): number`, `wisdomCap(): Intensity`, `reactionBias(...)`) with neutral defaults, overridden per realm — no method is removed or disabled anywhere. `Being.realm: Realm` getter returns `'human'` on the base class and the specific realm on subclasses.

### 2. Transmigration — the generic method

```ts
interface KarmicInheritance {
  store: KarmicStore;      // the ONLY thing that passes (santāna)
  incarnation: number;     // already incremented
}

function transmigrate<TNext extends Being>(
  inheritance: KarmicInheritance,
  NextForm: new () => TNext
): TNext
```

The new object receives NOTHING from the old one except the inheritance: no path levels, no mind factors, no experience history, no aggregates state. `rebirth()` becomes:

1. Increment incarnation; ahosi sweep (v0.2 logic unchanged).
2. Pick the shaping seed among survivors (v0.2 logic unchanged).
3. **Select the target realm** from the shaping seed (§3).
4. `transmigrate(inheritance, RealmClass)` → new being; apply **starting faculties** (§4); dispose the old being.
5. Return `RebirthResult` extended with `{ fromRealm, toRealm, being }`.

Since `rebirth()` now returns a new object, callers change (explicit sweep, verified against current code):
- MCP `rebirthBeing` (src/mcp/handlers.ts ~:91-96) must save `result.being`, not the loaded (now-dead) object, and the tool response must render a summary + selected fields — never `JSON.stringify` the whole live Being.
- Any other handler that mutates after a pending rebirth (see below) saves the new object it operated on.
- CLI commands and tests that call `rebirth()` update to consume the returned being.

**Observation does not rebirth (re-entrancy guard, approved 2026-08-30).** A gap-crossing load does NOT transmigrate: as in v0.2, it only advances the incarnation counter (lazy ahosi stays in the ripening pass) and sets a transient, non-persisted `pendingRebirth` flag on the loaded being. Read-only operations (`status`, `chain`, inquiry views) see the advanced counter but never change the realm and never write — repeated stale reads are idempotent. The realm transition executes at the FIRST MUTATING operation after the gap: mutating MCP/CLI handlers check `being.pendingRebirth` after load, call `rebirth()` first (obtaining the new realm-classed being), then perform the requested operation on it and save — one write, by an operation that writes anyway. The wheel is turned by karma, not by looking at it.

### 3. Realm selector (canonical mapping)

Explicit resolution order (edge cases resolved per the 2026-08-30 cross-review):

```ts
function selectRealm(shaping: KarmicSeed | null, balance: KarmicBalance): Realm {
  if (!shaping || shaping.quality === 'neutral') return 'human';
  if (shaping.quality === 'unwholesome') {
    switch (shaping.root) {                       // canonical poison → lower realm
      case 'greed':    return 'preta';
      case 'aversion': return 'naraka';
      default:         return 'animal';           // delusion and any unmapped root
    }
  }
  // wholesome:
  if (shaping.strength === 'weighty' || shaping.strength === 'strong') return 'deva';
  const totalPotency = balance.wholesome + balance.unwholesome + balance.neutral;
  const unwholesomeShare = totalPotency === 0 ? 0 : balance.unwholesome / totalPotency;
  return unwholesomeShare >= 0.4 ? 'asura' : 'human'; // power tainted by rivalry/envy
}
```

The 40% denominator explicitly includes neutral potency (full `getKarmicBalance()` volume), so a mostly-neutral continuum does not read as asura-grade rivalry.

### 4. Starting faculties as vipāka

At construction after transmigration (not in the constructors themselves — a plain `new HumanBeing()` stays pristine):
- starting `mindfulnessLevel` = clamp(round(wholesomeBalanceShare × 4), 0..4) — past practice conditions the new birth's faculties without copying them;
- each path factor's starting `developmentLevel` = clamp(round(wholesomeBalanceShare × 3), 0..3), applied via `practice()`-equivalent internal seeding;
- where `wholesomeBalanceShare = wholesomePotency / (wholesomePotency + unwholesomePotency + neutralPotency)` from `getKarmicBalance()` of the inherited store, and 0 when the total potency is 0 (explicit zero-division guard; potency-weighted and including neutral volume, so one weak wholesome seed among many neutral ones does not read as a saintly continuum — amended per the 2026-08-30 cross-review).
Caps (4 and 3) keep rebirth a real reset: a saint's continuum starts ahead, but nobody is born liberated.

### 5. Serialization

`BeingData.realm?: Realm` (optional; missing → `'human'`). `deserializeBeing` becomes a factory: instantiate the class matching `realm`, then restore as today — and **clamp restored faculties to the realm's caps** (e.g., an `animal` save with `rightView` above `wisdomCap()` — tampered or produced by an older version — is clamped on load, keeping the invariant unconditional). Round-trip preserves the realm; legacy saves load as `Being` (human-equivalent). Gap-advance at load changes only the counter + `pendingRebirth` flag (§2); the realm transition is persisted by the first mutating operation.

### 6. Surfaces

- `buddha_rebirth` response gains `fromRealm`/`toRealm` + a one-line realm description; `buddha_status` gains `realm` (top-level next to incarnation in the seeds section).
- Tool count stays 16; schemas unchanged except response docs.
- Plugin: status/karma/cognize skill notes about realms; a realm line in `/buddha`; version bump.
- README: "Six Realms" subsection with the selector table and the anattā framing (nothing transmigrates but karma — enforced by the type system).

### 7. Testing

- Selector: one test per table row (plant a dominant seed, rebirth, assert realm).
- Anattā enforcement: after transmigration, the new being's path/mind/history are NOT the old ones (fresh objects; only store identity passes); old being's store reference is detached.
- Modifier hooks: deva meditation gain halved vs human; animal wisdom capped; preta reaction amplification (one focused test per realm).
- Faculties: wholesome-heavy continuum → starting mindfulness ≤ 4 and > 0; empty store → all zeros.
- Serialization: realm round-trip; legacy load → human; gap-load transmigration end-to-end with `BUDDHA_INCARNATION_GAP_MS=0`.
- All existing 281 tests green; `rebirth()` caller updates covered by the MCP/CLI handler tests.

### 8. Risks

| Risk | Mitigation |
|---|---|
| `rebirth()` returning a new object breaks in-repo callers | Sweep is small (MCP handler, CLI reset?, tests); handlers re-save under the same name |
| Realm class explosion duplicating Being logic | All behavior stays in `Being`; realm classes ONLY override modifier hooks |
| Modifier hooks leak into unrelated flows | Hooks have neutral defaults; only `meditate`/`experience`/`practice` consult them |
| Punitive loop (naraka → more aversion → naraka) | Wholesome acts and meditation remain fully available in every realm (soft modifiers); the whyNot guidance in skills points the way out — as the doctrine intends |
