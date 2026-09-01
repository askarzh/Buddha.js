# Realm Strategy — Design Spec (v0.7 debt paydown, task 13)

**Status:** spike complete, recommendation below.
**Date:** 2026-09-01
**Scope:** `src/simulation/Being.ts`, `src/simulation/realms.ts`, `src/simulation/BeingSerializer.ts`.

---

## 1. Decision

**Adopt the `RealmModifier` strategy — but adopt it for the reason the spike found, not the
reason the cross-review gave.**

The cross-review's claim was that realm inheritance causes the ESM cycle and that a strategy
would "eliminate the cycle and the god object together". The spike confirms half of that and
refutes the other half:

- **Confirmed:** the cycle is not a JavaScript limitation. It is an import-direction problem,
  and it is fixable.
- **Refuted:** the strategy is not what fixes it. *Inverting the import edge* (a registry in
  `Being.ts` that `realms.ts` populates) is what fixes it. The strategy pattern is orthogonal
  to the cycle.
- **Refuted:** the god object does not go away. `Being.ts` loses **149 of 1422 lines (10.5%)**.
  The remaining 1273-line file is still a god object; the realm classes were never the bulk.

What the strategy *does* buy, and the only thing that justifies it, is that it makes realm
behaviour **independent of whether the realm classes were ever loaded**. Without it, a
registry-only fix is correct when `realms.ts` has been evaluated and silently wrong when it
has not. That is the argument for doing it. It is a real argument, but it is a correctness /
robustness argument, not a line-count argument, and the spec should be honest that the
headline motivation ("kill the god object") does not survive measurement.

**Recommended sequencing:** this is a *low-urgency* change. It is safe, fully test-covered, and
API-compatible — but it does not solve the problem it was proposed to solve. If v0.7 has to
choose, the 1122-line `Being` class body is the real debt and this refactor barely touches it.

---

## 2. Measurement 1 — the crash is real, on today's code

Naive split performed: the six realm classes, `REALM_CLASSES`, `REALM_DESCRIPTIONS` and
`selectRealm` (source lines 1246–1422 of `Being.ts`) moved verbatim into `realms.ts`;
`Being.ts` given `import { REALM_CLASSES, selectRealm } from './realms'`.

`npm run typecheck` **passes**. `npm run test:run`:

```
Test Files  10 failed | 15 passed (25)
     Tests  202 passed (202)

TypeError: Class extends value undefined is not a constructor or null
 ❯ src/simulation/realms.ts:28:33
     28| export class HumanBeing extends Being {}
       |                                 ^
 ❯ src/simulation/BeingSerializer.ts:1:1
```

Failed suites: `tests/cli/commands.test.ts`, `tests/cli/state.test.ts`,
`tests/mcp/handlers.test.ts`, `tests/simulation/Being.cognize.test.ts`,
`Being.incarnation`, `Being.persistence`, `Being.test`, `BeingSerializer`, `realms`,
`transmigration`. All ten fail at *collection*, before any test body runs.

**The constraint that shaped v0.3 still holds.** The historical note in `realms.ts` is accurate.

### 2a. But the cycle is not the one the comment describes

The comment says `Being.ts` ↔ `realms.ts`. The stack says the cycle is entered through
**`BeingSerializer.ts`**:

```
tests → src/simulation/Being.ts  (begins evaluating)
      → src/simulation/BeingSerializer.ts   (Being.ts line 22)
      → src/simulation/realms.ts            (BeingSerializer line 9, REALM_CLASSES)
      → src/simulation/Being.ts             (already in-flight; `Being` binding in TDZ)
      → `class HumanBeing extends Being` → TypeError
```

This matters: **even if `Being.rebirth()` did not need `REALM_CLASSES` at all**, the split
would still crash, because `BeingSerializer` needs `REALM_CLASSES` to reconstruct the right
class and `Being.ts` imports `BeingSerializer`. Removing `REALM_CLASSES` from `rebirth()`
alone is not a fix.

### 2b. The failure is entry-order-dependent

Added `tests/simulation/zz-order.test.ts` importing `realms.ts` **before** `Being.ts`:

```ts
import { DevaBeing } from '../../src/simulation/realms';
import { Being } from '../../src/simulation/Being';
// → 1 passed
```

realms-first: the cycle resolves (`Being.ts` re-enters `realms.ts` while it is in-flight, but
only reads `REALM_CLASSES` from *inside function bodies*, never at module-eval time).
Being-first: TDZ crash. A library cannot control which module a consumer touches first, so
order-dependence is not a fix — but it explains why the failure looked non-deterministic to
whoever hit it twice in v0.3.

### 2c. The shipped package never had the problem

With the naive split still applied, `npm run build` succeeds and **both bundles work**:

```
node -e "const m=require('./dist/index.js'); new m.DevaBeing()"     → deva, instanceof Being: true
node  --input-type=module … import('./dist/index.mjs')              → naraka, instanceof Being: true
```

`package.json` declares a single entry (`main`/`module`/`types` → `dist/index.*`) with **no
`exports` subpaths**, and tsup bundles the whole source graph into one module scope, so the
cross-file cycle does not exist in the artifact consumers install. **The crash is confined to
the unbundled source graph as loaded by Vitest**, and it bites only because 13 internal source
and test files deep-import `src/simulation/Being` directly.

That is worth stating plainly: this is a **test-harness-visible defect, not a user-visible
one**. It constrains our file layout; it has never broken a consumer.

---

## 3. Measurement 2 — the strategy prototype

### What the hooks actually are

Read from source (`Being.ts` lines 256–325 and 1269–1358), not guessed. Five override points,
not two:

| Hook | Neutral | Deva | Asura | Animal | Preta | Naraka |
|---|---|---|---|---|---|---|
| `get realm()` | `'human'` | `'deva'` | `'asura'` | `'animal'` | `'preta'` | `'naraka'` |
| `meditationGainFactor()` | `1` | `0.5` | `0.75` | — | — | `0.75` |
| `wisdomCap()` | `10` | — | — | `4` | — | — |
| `unwholesomeReactionBoost()` | `0` | — | `1` | — | `2` | — |
| `unpleasantIntensityShift()` | `0` | — | — | — | — | `2` |
| **constructor side effect** | none | `form.update({vitality: 10})` | — | — | — | — |

The sixth row is the one a naive `RealmModifier` interface misses: `DevaBeing` has a
**constructor body**, not just hook overrides. `clampFacultiesToRealm()` is a sixth protected
member but it is *not* a per-realm override — it is shared machinery that reads `wisdomCap()`,
and it stays on `Being` unchanged.

### The prototype, as built

Three files:

1. **`src/simulation/RealmModifier.ts` (new, 93 lines).** Imports only `../utils/types` and
   `../karma/KarmicEventSystem` — **nothing from the simulation graph**, so nothing that
   imports it can cycle with `Being.ts`. Contains:
   - `interface RealmModifier` — `realm`, the four soft modifiers as *data* (not methods),
     `initialVitality?` for the deva constructor effect, and `description` (absorbing
     `REALM_DESCRIPTIONS`, which was already a transcription of the class doc comments).
   - `REALM_MODIFIERS: Record<Realm, RealmModifier>`.
   - `selectRealm()` moved here verbatim. **`selectRealm` never referenced `Being`** — it takes
     a `KarmicSeed` and a balance. It did not belong in `Being.ts` at all.

2. **`Being.ts`.** `constructor(realm: Realm = 'human')` stores `protected readonly modifier`;
   the five hooks become one-line reads off it; the deva vitality effect becomes a conditional
   at the end of the constructor. `rebirth()` calls `makeRealmBeing(toRealm)` instead of
   `new REALM_CLASSES[toRealm]()`. A ~15-line registry is appended:

   ```ts
   const REALM_REGISTRY: Partial<Record<Realm, new () => Being>> = {};
   export function registerRealmClass(realm: Realm, ctor: new () => Being): void { … }
   export function makeRealmBeing(realm: Realm): Being {
     const Ctor = REALM_REGISTRY[realm];
     return Ctor ? new Ctor() : new Being(realm);   // ← correct either way
   }
   ```

3. **`realms.ts` (32 lines).** Six thin marker subclasses (`class DevaBeing extends Being {
   constructor() { super('deva'); } }`), `REALM_CLASSES`, a re-export of
   `selectRealm`/`REALM_DESCRIPTIONS`, and a loop calling `registerRealmClass`. `BeingSerializer`
   drops its `./realms` import in favour of `makeRealmBeing` from `./Being`.

**No module in `Being.ts`'s transitive import graph reaches `realms.ts`.** The cycle is gone
by construction, in every entry order.

### Result

```
npm run typecheck   → clean
npm run test:run    → Test Files 25 passed (25) | Tests 436 passed (436)
npm run build       → CJS + ESM + DTS success
cd dsh && pnpm test → Test Files 14 passed (14) | Tests 112 passed (112)
```

**Zero test edits were required.** `tests/simulation/realms.test.ts` (13 tests, including
`new REALM_CLASSES.deva().realm === 'deva'`) and `tests/simulation/transmigration.test.ts:304`
(`fromJSON` round-trips to `instanceof DevaBeing`) both pass unmodified.

### What fought back

- **`REALM_DESCRIPTIONS`' import site.** `src/mcp/handlers.ts` imported it from
  `'../simulation/Being'`, not from `'../simulation/realms'`. One-line change. Nothing else
  in the repo imports the realm symbols from `Being.ts` directly.
- **Deva's constructor.** Not expressible as a pure modifier read; needed the `initialVitality`
  escape hatch. If a future realm needs richer construction the interface has to grow an
  `applyInitialState(being)` callback — at which point the modifier is a subclass wearing a
  different hat. Flagged in §7.
- **Nothing else.** The refactor was mechanical.

---

## 4. Measurements the decision turns on

### 4a. How many lines does `Being.ts` lose? — **149. That is the whole story.**

| | before | after |
|---|---|---|
| `src/simulation/Being.ts` | **1422** | **1273** (−149, −10.5%) |
| `src/simulation/realms.ts` | 30 (barrel) | 32 |
| `src/simulation/RealmModifier.ts` | — | 93 |
| `src/simulation/BeingSerializer.ts` | 246 | 244 |
| **total** | **1698** | **1642** (−56, −3.3%) |

`git diff --stat`: 4 files, **63 insertions, 211 deletions**, plus one new 93-line file.

The `Being` *class body* is source lines 122–1244 — **1122 lines, of which the realm block was
none**. The realm classes sat *after* the class, in the same file. Moving them out shrinks the
*file* by a tenth and shrinks the *class* by zero. **This refactor does not address the god
object.** Any argument for it that leans on "1400 lines" is measuring the wrong thing.

Note also that ~120 of the 149 removed lines are the doc comments and the two long
cycle-explanation blocks — genuinely obsolete after the fix, but not complexity that moved
anywhere.

### 4b. Does `being instanceof DevaBeing` need to keep working?

**Yes, and it does.** It is public API on three counts:
- `tests/simulation/transmigration.test.ts:304` asserts the serializer round-trips to
  `instanceof DevaBeing`.
- `README.md:1189` documents `result.being.constructor.name` → `"DevaBeing"`.
- `README.md:1202–1207` names all six classes in the Six Realms table.

Thin marker subclasses preserve all three, verified green. **But the guarantee weakens in a way
worth writing down:** after this change `new Being('deva')` is a legal, fully-deva-behaving
object that is *not* `instanceof DevaBeing`. `instanceof` stops being a sound test for "is this
being a deva". The sound test becomes `being.realm === 'deva'`, which was always available and
is what `getSeedStats()`, the serializer and the MCP handlers already use. Recommend
documenting `.realm` as the supported check and marking the classes as identity markers.

Second, narrower weakening: in the deep-import path where `realms.ts` was never evaluated,
`makeRealmBeing` returns a base `Being`, so `constructor.name` is `"Being"`, not `"DevaBeing"`.
Behaviour is identical; only the label differs. This cannot occur through the published entry
point (the barrel loads `realms.ts`), only in internal deep-import code.

### 4c. What happens to `REALM_CLASSES`?

**It survives, exported from `realms.ts`, same type (`Record<Realm, new () => Being>`), same
values.** Two of its three uses go away:

| use site | before | after |
|---|---|---|
| `Being.rebirth()` (Being.ts:936) | `new REALM_CLASSES[toRealm]()` | `makeRealmBeing(toRealm)` |
| `deserializeBeing()` (BeingSerializer.ts:130) | `new REALM_CLASSES[data.realm ?? 'human']()` | `makeRealmBeing(data.realm ?? 'human')` |
| `dsh/src/realms.ts:138` | `new REALM_CLASSES[realm]()` | **unchanged** |

### 4d. What does `dsh/` depend on?

Checked. `dsh/src/realms.ts:9` imports `{ Being, REALM_CLASSES, type Intensity }` from
`'buddha-js'` and uses `new REALM_CLASSES[realm]()` in `transmigrateChild()` (line 138). It
does **no** `instanceof` checks and imports **no** realm subclass by name. `dsh/tests/realms.test.ts`
likewise. `dsh` consumes the built `dist/`, where the cycle never existed.

**`dsh` requires no change and 112/112 of its tests pass against the prototype's build.** Its
only requirement is that `REALM_CLASSES` stay exported with a nullary constructor signature —
which the design preserves. (`dsh` would arguably be *better* served by `makeRealmBeing`, but
that is a follow-up, not a dependency.)

### 4e. Does the serialized shape change? Can old saves load?

**No change, and yes.** `serializeBeing()` writes `realm: being.realm` — a `Realm` string
literal, unchanged, because `get realm()` returns `this.modifier.realm` which is the same six
values. `BeingData` is untouched. Round-trip verified by the unmodified persistence and
transmigration suites.

**Migration: none required.** Concretely:

| save written by | `realm` field | loads after refactor as |
|---|---|---|
| pre-0.3 (no typed rebirth) | absent | `makeRealmBeing('human')` → `HumanBeing`, human modifier — same as today's `REALM_CLASSES['human']` default |
| 0.3–0.7 | `"deva"` etc. | `makeRealmBeing('deva')` → `DevaBeing`, deva modifier |
| after refactor | `"deva"` etc. | identical |

Forward compatibility holds too: a file saved after the refactor loads on a pre-refactor build,
because the bytes are the same. **This refactor is save-format-invisible in both directions.**
The existing `?? 'human'` legacy default and the `clampFacultiesToRealm()` call at the end of
`_restoreState()` both keep working untouched (the clamp now reads `modifier.wisdomCap`).

---

## 5. Alternatives considered

### A. Leave it alone (status quo)
`realms.ts` stays a barrel; the classes stay at the bottom of `Being.ts`.
**Cost:** the file keeps a 20-line apology comment and a 177-line tail that logically belongs
elsewhere. **Benefit:** zero risk; the defect is invisible to consumers (§2c).
**Rejected — weakly.** This is the honest runner-up. If v0.7 is short on budget, do this.

### B. Reorder the barrel (`export * from './realms'` before `'./Being'`)
Verified to work (§2b) — realms-first evaluation resolves the cycle.
**Rejected.** It is a load-order coincidence, not an invariant. Any of the 13 files that
deep-import `src/simulation/Being` re-breaks it, silently, at collection time, with a stack that
points at `extends`. Unmaintainable.

### C. Registry only — invert the import edge, keep the behavioural subclasses
Add `registerRealmClass`/`makeRealmBeing` to `Being.ts`, move the six *behavioural* subclasses
(hooks and all) to `realms.ts`, have them self-register. No `RealmModifier`.
**This achieves the identical 149-line reduction** — the line saving comes entirely from moving
the classes, not from the strategy.
**Rejected, narrowly.** Its fallback is unsound: with no modifier, `makeRealmBeing` can only
fall back to `new Being()`, which is a **human**. A deva save deep-loaded before `realms.ts`
evaluates would silently come back with human meditation gain. The strategy's fallback
(`new Being(realm)`) is behaviourally correct. **This is the single technical reason to prefer
the strategy over C, and it should be stated as such rather than dressed up as decoupling.**

### D. Lazy/dynamic import of `realms.ts` inside `rebirth()`
**Rejected.** ESM `import()` is async; `rebirth()` and `deserializeBeing()` are synchronous and
their signatures are public API. Would work in CJS only.

### E. Full strategy with the subclasses deleted
Drop `HumanBeing`…`NarakaBeing` entirely; `REALM_CLASSES` becomes `makeRealmBeing`.
**Rejected for v0.7.** Breaks `instanceof DevaBeing` (a documented, tested guarantee),
`constructor.name` in the README, and `REALM_CLASSES` in `dsh`. Reconsider at a major version;
the marker subclasses cost 6 lines and buy full compatibility.

---

## 6. Migration plan (if adopted)

1. Add `src/simulation/RealmModifier.ts` (interface, `REALM_MODIFIERS`, `REALM_DESCRIPTIONS`,
   `selectRealm` moved verbatim).
2. `Being.ts`: `constructor(realm: Realm = 'human')`, `protected readonly modifier`, five hooks
   become modifier reads, deva vitality via `initialVitality`, `rebirth()` → `makeRealmBeing`,
   append the registry. Delete lines 1246–1422.
3. `realms.ts`: six marker subclasses + `REALM_CLASSES` + self-registration + re-exports.
4. `BeingSerializer.ts`: `makeRealmBeing(data.realm ?? 'human')`; drop the `./realms` import.
5. `src/mcp/handlers.ts`: import `REALM_DESCRIPTIONS` from `../simulation/RealmModifier`.
6. `src/simulation/index.ts`: add `export * from './RealmModifier'`; the existing
   `export * from './realms'` keeps the marker classes on the public surface.
7. No test changes. No save migration. No `dsh` change. No `CHANGELOG` breaking-change entry —
   the only additive public API is `RealmModifier`, `REALM_MODIFIERS`, `makeRealmBeing`, and the
   optional `Being` constructor argument.
8. Rewrite the two cycle-explanation comment blocks: they document a constraint that will no
   longer exist. Replace with a short note on *why* `Being.ts` must never import `realms.ts`
   (that is the invariant the registry protects), and add a regression test that deep-imports
   `Being.ts` alone and round-trips a non-human save.

Step 8's regression test is the load-bearing one. Without it nothing stops a future edit from
adding `import { … } from './realms'` to `Being.ts` and quietly restoring the crash.

## 7. What would make this design wrong

- **A realm that needs to override a *method*, not a scalar.** The whole soft-modifier
  discipline (documented in `realms.ts`'s header: "never a public method") assumes realm
  differences are numbers. `DevaBeing`'s constructor already strains it; `initialVitality` is a
  patch, not a principle. If a realm ever needs different `experience()` *logic*, the modifier
  interface grows callbacks and becomes a subclass with extra steps — at which point the
  inheritance we removed was the right shape and this spec was wrong.
- **`instanceof` turning out to be load-bearing somewhere unmeasured.** The audit covered this
  repo and `dsh/`. A downstream consumer branching on `instanceof DevaBeing` will keep working,
  but one branching on it *for a being it constructed as `new Being('deva')`* will not.
- **If the god object is the actual goal.** Then this is the wrong task: it returns 10.5% of the
  file and 0% of the class. Splitting `Being`'s 1122-line body — cognition, karma, meditation,
  serialization glue, self-inquiry — is a different, larger, and more valuable spike.
- **If nobody ever splits `Being.ts` again.** The entire cycle problem only exists because we
  want the file smaller. If the file stays as it is, alternative A costs nothing and this
  design's only remaining benefit is deleting an obsolete comment.

## 8. Spike hygiene

All prototype code was reverted. `git status --short` is clean of source edits; the only
committed artefact of this task is this document. The reproduction is fully specified in §2
and §3 and can be rebuilt from this spec in about twenty minutes.

**Process note for the plan owner:** `.superpowers/sdd/2026-09-01-v07-debt-paydown/task-13-brief.md`
does not exist. This spike was run from the dispatch prompt alone. That is the ninth item in
this plan named in a brief or prompt that turned out not to exist on disk.
