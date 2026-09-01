# Bardo (antarābhava) Design — the between-lives state as a school commitment

**Status:** Design spec only. No implementation, no tests, no production code. A later plan may argue from this document; nothing here is approved for build.
**Date:** 2026-09-01
**Origin:** v0.3 spec's deferred item, restated in the v0.7 debt-paydown plan (Phase 7, Task 12). The v0.4 backlog note calls this "a school switch (Theravāda off / Tibetan on)". That phrasing is wrong, and correcting it is most of this document's work.
**Doctrinal verification:** **NOT verified against the notebook sources.** See §1.

---

## 0. The thing the backlog note got wrong

"A school switch" implies a boolean over existing code: same call, same return, different flavour text. It is not.

The library encodes the Theravāda position **structurally**, not as a setting:

```ts
// src/simulation/Being.ts:904
rebirth(): RebirthResult {
  ...
  const next = new REALM_CLASSES[toRealm]();
  ...
  return { incarnation, expiredSeeds, shapingSeed, fromRealm, toRealm, being: next };
}
```

One call in, the next being out. `toRealm` is decided inside that call. `being` is a live, fully-constructed arising. There is no point in the signature where a continuum exists without a realm — which is *precisely* what an intermediate state is. Turning the Tibetan position on does not toggle a branch; it removes the guarantee that `rebirth()` hands back a being at all, and every one of the seven call sites is built on that guarantee.

So this is a change to the return type of the library's most load-bearing method, a change to the on-disk format, and a change to what a mutating handler is allowed to assume. It is a metaphysics commitment, and the spec treats it as one.

---

## 1. Doctrine — what was checked, and what was not

**The notebook was unavailable.** The `notebooklm-mcp` / `gemini-notebook-mcp` server for the "Buddha Plain and Simple" notebook (`9e43e48e-13ca-4d45-80ed-36739c4606db`) returned `Authentication expired`; `refresh_auth` reported the on-disk tokens stale; `nlm login` failed with `No supported browser found` in this environment. **No source citations from the notebook appear in this document, and none should be added by anyone reading it who did not run the query themselves.**

### 1.1 What the repository has already verified (in-repo citation, 2026-08-30)

`docs/superpowers/specs/2026-08-30-v03-typed-rebirth-design.md` records a notebook session that *was* run and *did* touch this question. Verbatim from that spec's "Doctrinal basis":

> Schools split on the intermediate state (Theravāda: none, cuti→paṭisandhi in the next moment; Sarvāstivāda/Tibetan: bardo up to 49 days) — that split is the v0.4 "school switch".

and, on the model the current code implements:

> the terminal death-consciousness (cuti-citta) conditions the initialization of the new stream (paṭisandhi-citta). The candle-flame simile (Milinda Pañha): the new flame is neither the same nor entirely other.

That is the *only* sourced doctrinal claim available to this spec. It establishes that the split exists and names both sides. It does **not** establish the arguments either side makes, what reaches a being mid-bardo, or whether karma accrues there.

### 1.2 Unverified background (general knowledge, flagged as such)

Everything in this subsection is the author's general knowledge, **not** sourced from the project's notebook, and must be re-checked before implementation. It is included because a design that pretends the traditions agree would be worse than one that marks its uncertainty.

- **Theravāda position.** Rebirth-linking consciousness (paṭisandhi-citta) arises in the mind-moment immediately after the death-consciousness (cuti-citta). There is no interval, therefore no entity to occupy one. The Abhidhamma objection to an intermediate state is structural rather than scriptural: a being that exists between lives is *itself* a birth, which would require its own intermediate state, and — worse for the tradition — a something that persists across the gap looks exactly like the self (attā) that the whole analysis denies.
- **Sarvāstivāda / Tibetan position.** An intermediate being (antarābhava, gandharva) exists between death and conception. The *Bardo Thödol* structures the interval as seven weeks — up to 49 days — with recognition of the luminosity at each stage offering liberation, and failing that, progressively coarser visions that end in a womb-entry.
- **Where they genuinely disagree over the same text.** The canonical *antarāparinibbāyī* (a non-returner who attains final nibbāna "in the interval") is read by the intermediate-state traditions as direct evidence of an interval, and by Theravāda as meaning "early in the next life, before the midpoint of that lifespan". Both readings are internally consistent. **The library must not resolve this.**
- **What the living do.** This is the one place the traditions come *closer*, not further apart: Theravāda accepts dedication/rejoicing in merit toward the departed (paṭṭidāna / puñña-anumodanā) — notably toward petas — even while denying there is an interval to dedicate *into*; the Tibetan traditions have the *Bardo Thödol* read aloud to guide the deceased through the stages. So "the living can act toward a departed continuum" is not itself the point of disagreement; *what the action reaches* is.
- **Whether karma accrues in the bardo.** Unverified and genuinely contested even within the intermediate-state traditions. This spec therefore takes the conservative reading (§4.2): the bardo continuum performs no new intentional acts. If a source says otherwise, §4.2 is the first thing to revisit.

### 1.3 Consequence for the design

Because the traditions genuinely disagree, and because this library's *entire* karma vocabulary is Theravāda Abhidhamma (garuka / āsanna / āciṇṇa / kaṭattā ordering in `pickShapingSeed()`; diṭṭhadhamma / upapajja / aparāpariya seed timing in `evaluateSeedWindow()`; ahosi-kamma expiry at the transition), the design must:

1. keep Theravāda as the default (§5), because that is what the rest of the engine already speaks;
2. make the school a **property of a continuum**, not of a process or an environment (§5), so no output ever presents one school's answer as the settled one;
3. state the disagreement in the output of any bardo-mode operation, rather than silently rendering the Tibetan sequence as "how rebirth works".

---

## 2. Ground truth — the code as it actually is

Verified by reading, 2026-09-01, at `worktree-v07-debt`, **commit `3e79fea`**, package version `0.7.0`. Line numbers are as of that commit.

**Caveat:** a concurrent Task 13 spike (the realm-strategy refactor, `src/simulation/RealmModifier.ts`) was in the working tree while this was written and has already replaced `new REALM_CLASSES[toRealm]()` with a `makeRealmBeing(toRealm)` factory. That changes *how* the new being is constructed, not *whether* one is returned, so no decision in this document depends on it — but §2's construction detail and its line numbers will drift. Re-read before planning.

| Fact | Location |
|---|---|
| `RebirthResult { incarnation, expiredSeeds, shapingSeed, fromRealm, toRealm, being }` | `src/simulation/Being.ts:62–83` |
| `rebirth()` increments `_incarnation`, sweeps ahosi seeds, picks the shaping seed, calls `selectRealm()`, constructs `new REALM_CLASSES[toRealm]()`, transfers the `KarmicStore` **by object identity**, applies starting faculties as vipāka, detaches the dying being with a fresh empty store and calls `dispose()` | `src/simulation/Being.ts:904–962` |
| `pickShapingSeed()` — canonical order weighty → proximate → habitual → reserve | `src/simulation/Being.ts:805–860` |
| `selectRealm(shaping, balance)` — pure function, module-level export | `src/simulation/Being.ts:1399–1422` |
| `settlePendingRebirth()` — decrements `_incarnation` by 1 to undo the load-time advance, then delegates to `rebirth()`; net +1 across load+settle | `src/simulation/Being.ts:988–996` |
| Gap detection: `BUDDHA_INCARNATION_GAP_MS`, default `21600000` (6h); `elapsed >= gapMs` sets `incarnation += 1` **and** `pendingRebirth = true`; legacy saves with no `lastActiveAt` never trigger it | `src/simulation/BeingSerializer.ts` (gap block) |
| `BeingData` — flat object; optional `karmicStore`, `incarnation`, `lastActiveAt`, `realm` for legacy tolerance; deprecated `karmicStream` still declared and ignored | `src/utils/types.ts:305–339` |
| `Realm = 'human' \| 'deva' \| 'asura' \| 'animal' \| 'preta' \| 'naraka'` | `src/utils/types.ts:37` |

### 2.1 The call sites, verified

The brief named three. There are effectively **four groups**, and one of the three was described inaccurately.

1. **MCP `buddha_rebirth`** — `src/mcp/handlers.ts:122` (`rebirthBeing`) and `src/mcp/index.ts:208`. Calls `being.settlePendingRebirth() ?? being.rebirth()`, saves `result.being`, then **strips** `being` from the result before returning (`const { being: _being, ...summary }`) and substitutes a realm description. This is the only surface that deliberately never leaks a live `Being`.
2. **MCP mutating handlers** — `src/mcp/handlers.ts:21–48`, the `settleRebirth()` / `withRebirthNote()` pair, used by `act`, `experience`, `cognize`, `meditate`, `karma_ripen`, `diagnose`, `inquiry`, `sit`, `contemplate`. Each one *assumes a live being comes back* and immediately does work on it.
3. **CLI** — **there is no `buddha rebirth` command.** `ls src/cli/commands/` yields `beings, chain, diagnose, inquiry, karma, koan, meditate, reset, sit, status`. The CLI touches rebirth only through `loadSettledBeing()` in `src/cli/utils/runner.ts:56–71`, which settles and persists immediately (with a documented rationale about failure atomicity), and through the `insight(...)` notices printed in `karma.ts:30` and `inquiry.ts:20`. **The CLI has no way to *drive* a rebirth — it can only discover one.** That matters in §6.3.
4. **dsh plugin** — `dsh/src/being-registry.ts:55` (`acquire()` returns `{ being, rebirth }`), `dsh/src/commands.ts:285` (`/rebirth`), and `dsh/src/realms.ts` (`plantVipaka`, `transmigrateChild`). `peek()` is explicitly read-only and never settles; `acquire()` is the mutating path and is called from **every turn's karma telemetry**, unattended.

---

## 3. Decision — what `rebirth()` returns

### 3.1 The decision

`rebirth()` returns a **discriminated union**, and under the bardo it returns **no being and no destination realm**:

```ts
export type TransitionResult = ImmediateRebirth | BardoEntry;

/** Theravāda: cuti → paṭisandhi with no interval. Structurally today's RebirthResult. */
export interface ImmediateRebirth {
  kind: 'rebirth';
  incarnation: number;
  expiredSeeds: number;
  shapingSeed: { id: string; description: string; reason: 'weighty' | 'proximate' | 'habitual' | 'reserve' } | null;
  fromRealm: Realm;
  toRealm: Realm;
  being: Being;
}

/** Sarvāstivāda/Tibetan: the continuum has left a realm and not yet entered one. */
export interface BardoEntry {
  kind: 'bardo';
  incarnation: number;          // already advanced; the bardo belongs to the NEW incarnation
  expiredSeeds: number;         // ahosi sweep happens at death, not at emergence
  fromRealm: Realm;
  bardo: Bardo;
  // NO toRealm — not yet determined.
  // NO being   — nothing has arisen.
  // NO shapingSeed — the seed is re-picked at emerge(), because the store may change.
}

/** Retained as an alias so the exported name does not vanish from the API. */
export type RebirthResult = ImmediateRebirth;
```

`Bardo` exposes:

```ts
class Bardo {
  readonly fromRealm: Realm;
  readonly incarnation: number;
  readonly stage: number;        // 1..stages
  readonly stages: number;       // 7 by default
  readonly karmicStore: KarmicStore;  // the continuum, by identity — the same object rebirth() would have passed on

  advance(): 'continuing' | 'due';   // one stage; 'due' at the final stage
  emerge(): ImmediateRebirth;        // picks the shaping seed NOW, selects the realm, constructs the being
  dedicate(from: Being, description: string, intensity: Intensity): void;  // §4.3
  recognize(): boolean;              // §4.4
  toJSON(): BardoData;
}
```

The key property: **`selectRealm()` runs at `emerge()`, not at death.** If it ran at death and the bardo merely delayed delivery, the bardo would be latency with no meaning — see §8, falsification criterion 4.

### 3.2 Why not the alternatives

**Rejected: `RebirthResult.being` is always a `Being`, flagged `notYetArrived`.**
This is the option the brief offered as the alternative, and it is the one the v0.3 design was specifically built to prevent. A `Being` instance that exists between lives is an object that persists across the transition carrying identity — the ātman `rebirth()` goes out of its way to refute by disposing the dying being and passing only the store. Worse, a `Being` has a `realm` (its class), so constructing one *is* selecting the destination: the flag would be a lie, because the realm would already be fixed at death and nothing mid-bardo could change it. That collapses into §8's criterion 4 on day one.

**Rejected: two methods — `die(): Bardo` under Tibetan, `rebirth()` under Theravāda.**
Callers cannot know at compile time which school a continuum they just loaded belongs to (§5 makes school a per-continuum property, precisely so an environment variable cannot retro-convert saved beings). A caller would have to branch on `being.school` and call a different method — the union does the same job with one entry point and forces the branch through the type system instead of documentation.

**Rejected: keep the signature, make the bardo internal, resolve it lazily.**
i.e. `rebirth()` still returns a being, but that being's methods throw until the bardo elapses. This preserves every call site and breaks nothing at compile time — which is exactly the problem. Seven call sites would keep saving and reading a being that is doctrinally not there, and the failure would surface at runtime in production paths (dsh's per-turn telemetry) rather than in the type checker.

**Consequence, accepted deliberately:** adding the union is a **compile break** for `result.being` and `result.toRealm` at every call site, in both schools. That is the intended migration lever: a call site that does not narrow on `kind` does not build. See §6.

---

## 4. What can act on a continuum mid-bardo

### 4.1 What a `Bardo` is not

A `Bardo` is **not** a `Being` and must not implement any part of the Being API. It has no `path`, no `mind`, no `aggregates`, no `dependentOrigination`, no experience history — those were disposed with the dying being, and reconstituting them is the persisting-self error again. It therefore cannot `act()`, `cognize()`, `experience()`, `meditate()`, `diagnose()`, or `sit()`.

It holds exactly one thing: the `KarmicStore`, by object identity — the same continuum `rebirth()` would have handed to the new being.

### 4.2 Does karma accrue in the bardo?

**Decision: no new intentional acts are performed by the bardo continuum.** Seed *ripening* is likewise suspended: `receiveKarmicResults()` has no being to receive vipāka.

Rationale, and its weakness: the sources available here do not settle it (§1.2), and the intermediate-state traditions are not unanimous. The conservative reading keeps the bardo from becoming a second, faculty-less playable state — which would double the library's surface for a state nobody can practice in. **If a source establishes that the antarābhava being acts, this decision is the first to revisit,** and the change is contained: `Bardo` would gain the act path and §4.1's "not a Being" line would need re-argument.

**The ahosi sweep stays at death, not at emergence.** A seed whose window lapsed at the transition is defunct at the transition; deferring the sweep to `emerge()` would let a bardo of seven stages keep expired seeds alive for the whole interval. `expiredSeeds` is therefore reported in `BardoEntry`, at death.

### 4.3 What the living can do — merit dedication

This is the genuinely hard question and the spec does not resolve it in the library's favour.

`Bardo.dedicate(from: Being, description, intensity)` plants a **wholesome seed** into the bardo's store, tagged `dedicated-by:<name>` and `dedication`, before the shaping seed is picked at `emerge()`. Because `pickShapingSeed()` runs at emergence and `selectRealm()` reads both the shaping seed and the karmic balance, a dedication **can change the destination realm.** That is the whole point: without it, the bardo cannot alter an outcome and fails §8 criterion 4.

Three problems, stated rather than hidden:

1. **It is a cross-continuum write.** Every other write in this library is a being writing to its own store. `dedicate()` lets continuum A mutate continuum B's ledger. In the MCP/CLI/dsh setting "another being" is another save file, so this is the first operation that needs to name *two* continua. The storage decision in §7 (one file, one continuum) makes this awkward on purpose — a dedication is a foreign write and should feel like one.
2. **It is doctrinally asymmetric.** Merit transfer is accepted in both traditions (§1.2), but what it *reaches* is exactly what they disagree about. A Theravāda continuum has no interval to dedicate into, so `dedicate()` exists only in bardo mode — and the library must say so in the output rather than implying dedication is a general mechanic.
3. **It is the obvious griefing / self-dealing surface.** Nothing stops a caller dedicating from a throwaway being to guarantee a deva birth. Mitigation, if implemented: dedication seeds carry at most `intensity` drawn from the dedicator's *own* store (a being cannot dedicate merit it does not have — the act should debit, or at minimum be capped by, the dedicator's wholesome potency), and dedications are always listed in the emergence report. This mitigation is **not designed here**; it is a prerequisite for shipping `dedicate()`.

**Recommendation:** `dedicate()` ships *with* the bardo or the bardo does not ship. It is not a follow-up.

### 4.4 Recognition

`Bardo.recognize()` models the *Bardo Thödol*'s actual claim — that recognition of the luminosity at a stage liberates — and it is the one thing that happens *inside* the interval rather than being done to it from outside. Sketch: once per stage, `recognize()` succeeds with a probability conditioned by the continuum's inherited wholesome share (the same `share` figure `applyStartingFaculties()` computes), and on success the bardo resolves toward `human` (the precious birth) or, at the strongest, does not resolve into a realm at all.

**Deliberately underspecified.** "Liberation" has no representation in this library — there is no cessation-of-the-continuum state, and `emerge()` must return an `ImmediateRebirth`, which requires a realm. Adding a "no further birth" terminal would be a bigger change than the bardo itself. Until that exists, `recognize()` can only bias the realm, which is a thin reading of the doctrine and should be labelled as one in any output.

---

## 5. Default school, and why it cannot change mid-continuum

### 5.1 Default: Theravāda

Because:
- it is what the code already encodes structurally, so the default preserves every existing save and every existing caller;
- the *rest* of the karma engine is Theravāda Abhidhamma throughout (§1.3) — garuka/āsanna/āciṇṇa/kaṭattā, the three seed-timing windows, ahosi expiry. Defaulting to a Tibetan bardo on top of a Theravāda kamma-timing engine would be the same "quietly picking a winner" failure the brief warns against, in the other direction and less visibly;
- the bardo's cost falls on unattended surfaces (§6.4), and a default should not degrade the surface nobody is watching.

### 5.2 Immutable per continuum

`school: 'theravada' | 'tibetan'` is fixed when a continuum is **created** and stored in the save. It cannot be changed for an existing continuum — not by an environment variable, not by a flag, not by an MCP argument.

`BUDDHA_SCHOOL` (or a `--school` flag on `buddha reset` / `buddha_create_being`) supplies the school for **newly created** continua only. **A load whose stored `school` differs from the ambient setting keeps the stored school**, and should say so once. Without that rule, setting `BUDDHA_SCHOOL=tibetan` would silently retro-convert every being on disk — a metaphysics change applied by an environment variable, to data the user did not touch.

Three reasons it must be immutable:

1. **Seed windows are defined against the transition boundary.** `evaluateSeedWindow()` compares `this._incarnation` against `incarnation:<n>` tags; an `upapajja` (next-life) seed is eligible at exactly `plantedAt + 1`. If the shape of the boundary changes midway, "incarnation N+1" denotes two different events at two points in one continuum's history, and a seed planted before the switch is being judged by a rule that did not exist when it was planted.
2. **Switching to Theravāda mid-bardo orphans the bardo.** There is no lawful destination for an open interval in a school that has no intervals: forcing an immediate `emerge()` enacts a rebirth as a side effect of a *setting change*, which violates "observation does not rebirth" in spirit and in a nastier way than a plain load ever could.
3. **It is a claim about what happens at death, not a preference about output.** Every other configurable in this library (`BUDDHA_STATE_DIR`, `--json`, `--being`) concerns where data lives or how it is rendered. This one concerns what is true. Making it a runtime setting would misfile it.

`BeingData.school` and `BardoData.school` are optional for legacy tolerance; missing means `'theravada'`, which is what every existing save in fact is.

---

## 6. Migration — every caller, named

The `TransitionResult` union breaks `.being` and `.toRealm` at compile time in **both** schools. That is intended. Each site below must narrow.

### 6.1 MCP `buddha_rebirth` (`handlers.ts:122`, `index.ts:208`)

Under Theravāda: unchanged behaviour, plus `kind: 'rebirth'` in the payload.

Under Tibetan, `buddha_rebirth` becomes the **driver of the interval** rather than a single event:
- called on a living continuum → death; persists a `BardoData`; returns `{ kind: 'bardo', fromRealm, stage: 1, stages: 7 }`, with no `toRealm`;
- called on a mid-bardo continuum → `bardo.advance()`; persists; returns the new stage;
- called at the final stage (or with an explicit `force: true`) → `bardo.emerge()`; persists the new being; returns the familiar `kind: 'rebirth'` payload including `toRealm` and the realm description.

Tool count stays at 16. No `buddha_bardo` tool: a second tool would let a caller drive an interval without ever having entered one.

`rebirthBeing()`'s existing discipline — **never return a live `Being`** — extends to the `Bardo`: `BardoEntry.bardo` is stripped from the payload exactly as `being` is today.

### 6.2 MCP mutating handlers (`settleRebirth()`, `handlers.ts:21–48`)

The sharpest consequence, and it must not be papered over: **under Tibetan, a mutating tool called on a mid-bardo continuum has no being to run on.** `act`, `cognize`, `meditate`, `experience`, `karma_ripen`, `sit`, `contemplate` all break.

Three options were considered:

| Option | Verdict |
|---|---|
| **(a) Fail loud** — return an `isError` result naming the stage and telling the caller to call `buddha_rebirth` to advance | **Chosen** |
| (b) Auto-emerge, then do the work | Rejected: makes every mutating tool a silent metaphysical event. This is the same class of error `settlePendingRebirth()` was introduced to prevent — a rebirth as a side effect of something the user asked for other reasons. |
| (c) Queue the act and apply it after emergence | Rejected: an act performed by nobody, replayed onto a being that did not exist when it was intended. Intention (cetanā) is the whole definition of karma here; a queued act has no intender. |

**The cost of (a), stated plainly:** under Tibetan, an agent idle past the gap finds its next `buddha_act` failing until it walks up to seven bardo stages, each requiring a separate `buddha_rebirth` call. That is a real usability regression, and it is the single strongest argument for §5.1's default.

Read-only paths are unaffected and keep their existing discipline verbatim: `buddha_status` on a mid-bardo continuum reports `{ state: 'bardo', fromRealm, stage, of }` **and advances nothing**. "Observation does not rebirth" extends verbatim to "observation does not emerge."

### 6.3 CLI (`src/cli/utils/runner.ts:56`, `karma.ts`, `inquiry.ts`)

Correcting the brief: **there is no `buddha rebirth` command to update.** `loadSettledBeing()` gains a bardo branch and returns a union; the mutating commands print the stage and exit non-zero per §6.2(a); `buddha status` prints the bardo read-only.

But that leaves the CLI with **no way to advance or emerge** — it can only discover a bardo and then refuse to work. So enabling the Tibetan school requires *adding* a `buddha rebirth` command (advance / emerge / `--force`), which is new surface, not a migration. Any implementation plan must budget for it as new work.

### 6.4 dsh plugin (`being-registry.ts:55`, `commands.ts:285`, `realms.ts`)

`BeingRegistry.acquire()` currently promises `{ being: Being; rebirth: RebirthResult | null }`. Under Tibetan it cannot promise a being, so it returns a union — and the callers that break are the worst possible ones: `plantVipaka()` and the per-turn karma telemetry run **unattended, on every turn, outside any user's turn lifecycle**. Under §6.2(a) they would start failing silently in the background, which is worse than failing loudly in a tool response.

`peek()` is unaffected — it already never settles.

**Recommendation: dsh pins `theravada` for the beings it creates, regardless of the ambient default,** and records the pin explicitly in `BeingRegistry` rather than inheriting it. Rationale: dsh's entire value is invisible background telemetry, and a state in which the continuum is periodically unwritable defeats it. If someone later wants a bardo in dsh, they must first design what a background turn does when the continuum is between lives — that is a separate spec.

### 6.5 Saved beings

No migration is required for existing files. `BeingData` gains optional `school` (missing ⇒ `'theravada'`), and the container gains an optional discriminant (§7) whose absence means `'being'`. Every save written by 0.7.0 and earlier loads unchanged and behaves identically, because Theravāda *is* the current behaviour.

---

## 7. Persistence — where a bardo lives

`BeingData` describes a `Being`. A bardo has no being. Three options:

**Rejected: `BeingData.bardo?: BardoData`, with the dying being's fields still written.**
The loader would reconstruct a `Being` and hang a bardo off it — resurrecting on load precisely the object `rebirth()` disposes. It also makes the illegal state representable: a live being *and* an open interval in one record.

**Rejected: a sidecar file `<name>.bardo.json`.**
Two files for one continuum. Every `loadBeing()` becomes a two-file read, every save a two-file transaction, and a crash between the two writes splits the continuum — one file saying alive, the other saying between lives, with no way to tell which is later. The atomic `.tmp` + rename discipline in `BeingRegistry.save()` and the CLI's `StateManager` protects one file at a time, not two.

**Chosen: one file, one shape, discriminated at the top level.**

```ts
export type ContinuumData =
  | ({ kind?: 'being' } & BeingData)     // kind absent ⇒ 'being' (every legacy save)
  | ({ kind: 'bardo' } & BardoData);

export interface BardoData {
  kind: 'bardo';
  school: 'tibetan';          // a theravada continuum can never be in this state
  incarnation: number;
  fromRealm: Realm;
  stage: number;
  stages: number;
  enteredAt: number;
  lastActiveAt: number;       // same role as BeingData's — drives stage ticks (§9)
  karmicStore: KarmicStoreData;
  dedications: Array<{ from: string; description: string; at: number }>;
  recognitionAttempts: number;
  // NO path, NO mind, NO aggregates, NO experienceHistory, NO dependentOrigination.
}
```

The absences are the point: `BardoData` is the strongest statement the file format can make that **nothing but the continuum crossed.** If a future change adds `path` to `BardoData`, the design has failed (§8).

**Loader consequence, and the migration lever.** `StateManager.loadBeing()` can no longer promise a `Being`. It splits:
- `loadContinuum(name): Being | Bardo` — the new general entry point;
- `loadBeing(name): Being` — retained, and **throws** when the continuum is mid-bardo.

Retaining the throwing `loadBeing()` is deliberate: any call site not yet migrated fails loud rather than silently constructing a fresh being over a live bardo and overwriting it on the next save. That failure mode — a bardo destroyed by an un-migrated reader — is the one this design most needs to make impossible.

---

## 8. The clocks — 49 days vs. `BUDDHA_INCARNATION_GAP_MS`

Two quantities that are *not* the same thing:

- `BUDDHA_INCARNATION_GAP_MS` (default 6h) measures **idle time between saves**. It is a *death detector*: "a life ended while you were away." It says nothing about how long anything lasts.
- The 49 days is the **duration of the interval itself**, beginning after death.

**Rejected: a real wall clock, `BUDDHA_BARDO_MS`, default 49 days.**
Untestable without mocking, unusable in practice (a user who triggers a bardo waits seven weeks), and — the real objection — it makes the interval's length independent of whether anyone is present. That contradicts the convention the library already established with the gap: in this library, time is measured in the user's absences. A bardo that elapses while nobody looks is a bardo nobody experiences.

**Rejected: `49 × gapMs`.**
294 hours at the default, and it couples two unrelated quantities, so changing the death threshold silently changes the interval length.

**Chosen: the bardo is measured in seven *stages*, not in days, and a stage ticks on each further gap crossing.**

- Cross the gap once → death → `BardoEntry`, stage 1.
- Cross the gap again (another idle period) → stage 2. And so on.
- At stage 7 the bardo is `due`; the next `buddha_rebirth` (or a `--force`) emerges it.
- `BUDDHA_BARDO_STAGES`, default `7`, exists so tests can set `1` — the same role `BUDDHA_INCARNATION_GAP_MS=0` already plays.

The mapping to doctrine is the *Bardo Thödol*'s own structure: seven weeks of seven days. One gap crossing stands for one week. The 49 days survives as `7 stages × 7` only rhetorically; the number that matters in code is 7.

**The design's weakest joint, named:** under Tibetan, `BUDDHA_INCARNATION_GAP_MS` means two different things at two different times in one continuum's life — a *death detector* while alive, a *stage tick* while dead. One environment variable, two semantics, switched by the continuum's state. That is a genuine smell. The alternative (a second variable, `BUDDHA_BARDO_STAGE_MS`) is cleaner conceptually but gives users two idle thresholds to reason about and creates an incoherent window where one has elapsed and the other has not. The overload is chosen as the lesser cost, but it is a cost, and it is the first thing to reconsider if the bardo feels arbitrary in use.

---

## 9. What would make this design wrong

Falsifiable, in priority order. Each is a reason to stop.

1. **The bardo cannot change the outcome.** If `Bardo.emerge()` reliably produces the same realm the immediate path would have — because nothing mid-bardo touches the store — then the bardo is latency with a ceremony attached. **This is the core criterion.** It is why `selectRealm()` runs at `emerge()` and not at death (§3.1), and why §4.3 says `dedicate()` ships with the bardo or the bardo does not ship. A first implementation must include a test that a dedication mid-bardo demonstrably changes `toRealm`. If that test cannot be written, do not ship.
2. **Error-on-mutate drives everyone to Theravāda.** If the §6.2(a) behaviour makes the Tibetan mode unusable in practice — the likely outcome for dsh (§6.4) and plausible for MCP — then Tibetan mode is dead code with a maintenance cost and a second on-disk shape. Ship-gate: at least one surface must be usable, end to end, in Tibetan mode by someone who is not the author.
3. **Stages read as arbitrary.** Nobody experiences seven distinct idle gaps in sequence; in practice a user returns once, days later, having crossed the threshold once. If so, the seven stages are theater, and the honest design is a single opaque interval with an explicit `emerge()` and no stage counter at all. Watch for: users who only ever see stage 1 and then force emergence.
4. **`BardoData` grows a faculty.** If a later change adds `path`, `mind`, or `experienceHistory` to `BardoData`, the between-lives entity has become a being, and the whole §3.2 argument against `notYetArrived` now applies to what was built instead. Treat any such addition as a design failure, not a feature.
5. **Doctrine contradicts §4.2.** If the sources establish that the antarābhava being performs intentional acts, the "bardo continuum does not act" decision is wrong and §4.1's "not a Being" boundary needs re-argument from scratch.
6. **The school leaks.** If any code path lets an environment variable or flag change an *existing* continuum's school, §5.2 has been violated and the retro-conversion hazard is live. This is checkable with one test: set `BUDDHA_SCHOOL=tibetan`, load a being saved as theravada, assert it is still theravada.

---

## 10. Open questions for the implementation plan

1. **`dedicate()`'s debit rule** (§4.3) is unspecified. Does dedicating merit reduce the dedicator's wholesome potency? Both traditions have positions on whether merit is diminished by sharing; the notebook was not reachable to check. Design this before writing `dedicate()`.
2. **`recognize()`'s payoff** (§4.4) is thin because the library has no liberation terminal. Either accept the thin reading and label it, or scope "a continuum that does not take rebirth" as a separate spec first.
3. **A new CLI `rebirth` command** (§6.3) is required work, not migration.
4. **Whether Tibetan mode ships at all.** This spec designs it; it does not argue that it should exist. Given §9 criteria 1 and 2, a defensible outcome of the next planning session is "documented, not built" — the value of this document is that the decision is now visible instead of hidden inside the word "switch".

---

## 11. Summary of decisions

| # | Decision |
|---|---|
| 1 | `rebirth()` returns `TransitionResult = ImmediateRebirth \| BardoEntry`, discriminated on `kind`. `RebirthResult` survives as an alias for `ImmediateRebirth`. |
| 2 | `BardoEntry` carries **no** `being` and **no** `toRealm`. The realm is selected at `emerge()`, not at death. |
| 3 | `Bardo` is not a `Being` and implements no part of the Being API. No acts, no ripening, no faculties. |
| 4 | The ahosi sweep stays at death; `expiredSeeds` is reported in `BardoEntry`. |
| 5 | The living reach a bardo only through `dedicate()`, which is a cross-continuum write, ships with the bardo or not at all, and needs a debit rule first. |
| 6 | Default school is **Theravāda**, matching both the current structure and the rest of the karma engine's vocabulary. |
| 7 | School is fixed per continuum at creation, stored in the save, and **never** changed by an environment variable or flag on an existing continuum. |
| 8 | One file per continuum, top-level discriminated `ContinuumData`. `BardoData` carries the store and nothing else. |
| 9 | `StateManager.loadBeing()` is retained and **throws** mid-bardo; `loadContinuum()` is the new entry point. |
| 10 | The 49 days maps to **7 stages**, one per gap crossing, via `BUDDHA_BARDO_STAGES` (default 7). Not a wall clock. |
| 11 | Mutating handlers **fail loud** on a mid-bardo continuum. Observation does not emerge. |
| 12 | dsh pins Theravāda explicitly. |
| 13 | Doctrine is **unverified** — the notebook was unreachable. No claim in §1.2 may be treated as sourced. |
