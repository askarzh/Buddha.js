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

Since `rebirth()` now returns a new object, callers change: MCP/CLI handlers re-save the NEW being under the same name (the being's name is storage-level, not identity-level — doctrinally apt). The auto-gap path in deserialization ALSO transmigrates: a load that crosses the gap performs the full flow, so the wheel turns even without an explicit call.

### 3. Realm selector (canonical mapping)

From the shaping seed (or defaults when the store is empty):

| Shaping seed | Target realm |
|---|---|
| unwholesome, root greed | `preta` |
| unwholesome, root aversion | `naraka` |
| unwholesome, root delusion | `animal` |
| wholesome, strength weighty or strong | `deva` |
| wholesome, strength moderate/weak, **and** unwholesome balance ≥ 40% of total | `asura` (power tainted by envy/rivalry) |
| wholesome, strength moderate/weak | `human` |
| no shaping seed / neutral | `human` |

### 4. Starting faculties as vipāka

At construction after transmigration (not in the constructors themselves — a plain `new HumanBeing()` stays pristine):
- starting `mindfulnessLevel` = clamp(round(wholesomeBalanceShare × 4), 0..4) — past practice conditions the new birth's faculties without copying them;
- each path factor's starting `developmentLevel` = clamp(round(wholesomeBalanceShare × 3), 0..3), applied via `practice()`-equivalent internal seeding;
- where `wholesomeBalanceShare = wholesome / (wholesome + unwholesome)` from `getKarmicBalance()` of the inherited store (0 when the store is empty).
Caps (4 and 3) keep rebirth a real reset: a saint's continuum starts ahead, but nobody is born liberated.

### 5. Serialization

`BeingData.realm?: Realm` (optional; missing → `'human'`). `deserializeBeing` becomes a factory: instantiate the class matching `realm`, then restore as today. Round-trip preserves the realm; legacy saves load as `Being` (human-equivalent). The gap-advance transmigration at load persists its result on the next save (same last-write-wins semantics as v0.2's counter).

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
