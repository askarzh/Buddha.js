# v0.3 Typed Rebirth / Six Realms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebirth as typed transmigration: a new object of a realm-specific class, carrying only the karmic continuum — realm selected canonically from the shaping seed, faculties derived as vipāka, observation never rebirths.

**Architecture:** Six realm classes extend `Being`, overriding only protected modifier hooks (all behavior stays in `Being`). `rebirth()` returns a NEW being (`RebirthResult.being`); gap-loads set a transient `pendingRebirth` flag settled by the first mutating handler. Serialization gains a `realm` discriminator + factory + faculty clamping.

**Tech Stack:** TypeScript strict, Vitest, existing v0.2 machinery (shaping seed, incarnation windows, `getKarmicBalance`).

**Spec:** docs/superpowers/specs/2026-08-30-v03-typed-rebirth-design.md — binding authority (as amended per the 2026-08-30 cross-review). Task 0 pre-fixes are ALREADY SHIPPED (v0.2.1, PR #9) — do not re-plan them.

## Global Constraints

- `npm run typecheck`, `npm run lint`, `npm run test:run` green after every task (291 baseline).
- Realm modifiers are SOFT: no method removed or disabled in any realm; hooks have neutral defaults on `Being`.
- Only the `KarmicStore` + incarnation counter pass through transmigration — the anattā test (fresh path/mind/history objects) is mandatory.
- Read-only operations (MCP `getStatus`/`chain`, CLI `status`) NEVER transmigrate and NEVER write. Mutating handlers settle `pendingRebirth` first, then operate, then save the (possibly new) being.
- Spec constants verbatim: deva meditation ×0.5 + vitality 10; asura meditation ×0.75 + aversion bias; animal `wisdomCap` 4; preta unwholesome reaction intensities +2; naraka unpleasant valence intensity +2 and meditation ×0.75; faculties caps mindfulness ≤ 4, path factors ≤ 3; asura threshold `unwholesomeShare >= 0.4` over full potency volume incl. neutral.
- Version unification in the final task: package.json, MCP `serverInfo`, `mcpb/manifest.json`, and `plugin/.claude-plugin/plugin.json` ALL become **0.4.0** (plugin may only move forward; a `CHANGELOG.md` is introduced covering 0.2.x→0.4.0 including the `receiveKarmicResults` breaking change).
- MCP tool count stays 16. Plugin bundle rebuilt whenever `src/` changes and committed in the same task (CI drift + isolated smoke guards exist).
- Conventional commits, English docs, no push during tasks.

---

### Task 1: Realm types, modifier hooks, six classes

**Files:**
- Create: `src/simulation/realms.ts`
- Modify: `src/simulation/Being.ts`, `src/utils/types.ts` (add `Realm`), `src/index.ts` (exports)
- Test: `tests/simulation/realms.test.ts` (new)

**Interfaces (Produces):**
- `type Realm = 'human' | 'deva' | 'asura' | 'animal' | 'preta' | 'naraka'` in types.ts.
- On `Being` (protected hooks, neutral defaults; public getter):
```ts
get realm(): Realm { return 'human'; }
protected meditationGainFactor(): number { return 1; }
protected wisdomCap(): Intensity { return 10; }
protected unwholesomeReactionBoost(): number { return 0; }   // added to unwholesome factor intensities in experience reactions
protected unpleasantIntensityShift(): number { return 0; }   // added to intensity of unpleasant-valence experiences
```
- Hook consultation points inside `Being` (read the current code, wire minimally): `meditate()` multiplies effort-driven gains (path factor practice increments AND mindfulness gain) by `meditationGainFactor()`; `rightView` development is clamped to `wisdomCap()` wherever path factors are practiced (apply the clamp inside `meditate`'s practice calls and `practiceFactor`-style paths that Being drives — implement as a post-practice clamp on `rightView` in Being, not by editing `PathFactor`); `experience()` applies `unpleasantIntensityShift()` to unpleasant-valence inputs and passes `unwholesomeReactionBoost()` into the mental-formations reaction step (transcribe the actual call shape from `FiveAggregates.processExperience` / `SamskaraAggregate.react` — if `react` cannot accept a boost without signature change, apply the boost by post-activating the factors on `Being.mind` instead; document the choice).
- `src/simulation/realms.ts`: the six classes, each ONLY overriding hooks + `realm`:
```ts
export class HumanBeing extends Being {}
export class DevaBeing extends Being {
  get realm(): Realm { return 'deva'; }
  protected meditationGainFactor(): number { return 0.5; } // pamāda: divine comfort dulls urgency (saṃvega)
  // constructor: vitality 10 — transcribe the Rupa vitality setter from src/five-aggregates/Rupa.ts
}
export class AsuraBeing extends Being {
  get realm(): Realm { return 'asura'; }
  protected meditationGainFactor(): number { return 0.75; }
  protected unwholesomeReactionBoost(): number { return 1; } // rivalry bias toward aversion
}
export class AnimalBeing extends Being {
  get realm(): Realm { return 'animal'; }
  protected wisdomCap(): Intensity { return 4; }
}
export class PretaBeing extends Being {
  get realm(): Realm { return 'preta'; }
  protected unwholesomeReactionBoost(): number { return 2; } // insatiable craving amplifies reactions
}
export class NarakaBeing extends Being {
  get realm(): Realm { return 'naraka'; }
  protected meditationGainFactor(): number { return 0.75; }
  protected unpleasantIntensityShift(): number { return 2; }
}
export const REALM_CLASSES: Record<Realm, new () => Being> = { human: HumanBeing, ... };
```

- [ ] **Step 1: Failing tests** — per realm, one focused hook test:
```ts
it('deva meditation gains are halved vs human', () => {
  const human = new HumanBeing(); const deva = new DevaBeing();
  human.meditate(600, 8); deva.meditate(600, 8);
  expect(deva.getState().pathProgress).toBeLessThan(human.getState().pathProgress);
});
it('animal wisdom is capped at 4', () => {
  const animal = new AnimalBeing();
  for (let i = 0; i < 30; i++) animal.meditate(600, 10);
  expect(animal.path.rightView.developmentLevel).toBeLessThanOrEqual(4);
});
it('preta reactions run hotter on unpleasant experience', () => { /* compare a mind factor intensity vs HumanBeing after identical experience({valence:'unpleasant'...}) */ });
it('naraka intensifies unpleasant experiences', () => { /* feeling intensity shifted +2 vs human for identical input */ });
it('base Being and HumanBeing behave identically', () => { /* meditate + experience parity */ });
```
(Note: `meditate` currently develops effort/mindfulness/concentration but NOT rightView — the wisdom-cap test must drive rightView through whatever path Being offers; if none exists, apply the clamp at `getState`/serialization level is NOT acceptable — instead clamp inside the same code path v0.2 uses to seed faculties and inside any practice call that touches rightView, and write the test against that real path. State clearly in the report which path drives rightView.)
- [ ] **Step 2:** RED → **Step 3:** implement → **Step 4:** full suite + typecheck + lint → **Step 5: Commit** `feat(simulation): realm classes with soft modifier hooks`

---

### Task 2: selectRealm, transmigrate, vipāka faculties, typed rebirth()

**Files:**
- Modify: `src/simulation/Being.ts`, `src/simulation/realms.ts` (selector may live here), `src/index.ts`
- Test: `tests/simulation/transmigration.test.ts` (new)

**Interfaces (Produces):**
- `selectRealm(shaping: KarmicSeed | null, balance: ReturnType<KarmicStore['getKarmicBalance']>): Realm` — transcribe the spec §3 pseudocode EXACTLY (neutral/no-seed → human; unwholesome by root greed→preta/aversion→naraka/else animal; wholesome weighty|strong → deva; else asura iff `unwholesome/(wholesome+unwholesome+neutral) >= 0.4` with 0-guard; else human).
- `RebirthResult` gains `fromRealm: Realm; toRealm: Realm; being: Being` (existing fields unchanged).
- `Being.rebirth(): RebirthResult` new flow: increment + ahosi sweep + pick shaping seed (all existing v0.2 logic untouched) → `selectRealm` → construct `new REALM_CLASSES[toRealm]()` → transfer ONLY `{ karmicStore, incarnation }` (reuse the `_restoreState`/(as any) assignment pattern; re-register + rebind conditions on the new being against ITS store reference) → apply starting faculties → `this.dispose()` (old being detached; its karmicStore reference nulled or left — must not share the store object with the new being's mutations: the store OBJECT passes to the new being; the old being must not retain a usable reference — set old's store field to a fresh empty store) → return result.
- Starting faculties (vipāka, spec §4): `share = wholesome/(wholesome+unwholesome+neutral)` potency-weighted, 0 on zero total; starting mindfulness `clamp(round(share*4),0..4)`; each path factor seeded to `clamp(round(share*3),0..3)` (use the same internal seeding mechanism v0.2's serializer uses for development levels).

- [ ] **Step 1: Failing tests** — selector: one test per spec-table row (7 rows; plant a dominating seed shape directly via `karmicStore.plantSeed` where needed); anattā:
```ts
it('transmigration passes ONLY the karmic continuum', () => {
  const b = new HumanBeing();
  b.act('greedy grab', 9, 'greed'); b.meditate(600, 8);
  const oldStore = b.karmicStore; const oldPath = b.path;
  const r = b.rebirth();
  expect(r.being).not.toBe(b);
  expect(r.being.karmicStore).toBe(oldStore);        // the continuum passes by identity
  expect(r.being.path).not.toBe(oldPath);            // everything else is a fresh arising
  expect(r.being.getExperienceHistory(Infinity)).toHaveLength(0);
  expect(b.karmicStore).not.toBe(oldStore);          // the dead being is detached
});
it('greedy shaping seed leads to the preta realm', () => { /* act with greed repeatedly → rebirth → r.toRealm === 'preta' && r.being instanceof PretaBeing */ });
it('faculties are vipāka-derived and capped', () => { /* wholesome-heavy store → mindfulness in 1..4; empty store → zeros */ });
```
- [ ] **Step 2:** RED → **Step 3:** implement → **Step 4:** sweep `grep -rn "\.rebirth()" src/ tests/` — every caller updated to consume `RebirthResult.being` where it matters (existing incarnation tests keep passing by construction or get updated with a note) → **Step 5:** full suite + typecheck + lint → **Step 6: Commit** `feat(simulation)!: typed rebirth — transmigration into realm classes with vipāka faculties`

---

### Task 3: pendingRebirth guard + realm serialization

**Files:**
- Modify: `src/simulation/Being.ts`, `src/simulation/BeingSerializer.ts`, `src/utils/types.ts`
- Test: `tests/simulation/transmigration.test.ts`, `tests/simulation/Being.persistence.test.ts`

**Interfaces (Produces):**
- `BeingData.realm?: Realm` (optional; missing → human). `deserializeBeing` factory: instantiate `REALM_CLASSES[data.realm ?? 'human']`, restore as today, then CLAMP restored faculties to the instance's caps (rightView → `wisdomCap()`; use a small protected `clampFacultiesToRealm()` called at the end of restore).
- Gap-load (existing v0.2 logic): additionally sets `being.pendingRebirth = true` (public readonly-ish getter + internal setter; TRANSIENT — never serialized).
- `Being.settlePendingRebirth(): RebirthResult | null` — if flag set: clear it, run `rebirth()`, return result; else null. (Handlers call this; keeps the policy in one place.)

- [ ] **Step 1: Failing tests** — realm round-trip (`DevaBeing` → toJSON has `realm: 'deva'` → fromJSON returns `instanceof DevaBeing`); legacy load → human + no pendingRebirth (reuse the existing legacy test pattern); gap-load (`BUDDHA_INCARNATION_GAP_MS=0`) → `pendingRebirth === true`, realm UNCHANGED, and a second fromJSON of the same data yields the same result (idempotent observation); clamping (hand-craft an `animal` save with rightView 9 → loads clamped ≤ 4); `settlePendingRebirth` returns a result once then null.
- [ ] **Step 2:** RED → **Step 3:** implement → **Step 4:** full suite + typecheck + lint → **Step 5: Commit** `feat(simulation): realm serialization factory and observation-does-not-rebirth guard`

---

### Task 4: MCP + CLI wiring

**Files:**
- Modify: `src/mcp/handlers.ts`, `src/mcp/index.ts`, `src/cli/commands/status.ts` (realm in output), CLI mutating commands (karma/meditate/inquiry — settle first)
- Test: `tests/mcp/handlers.test.ts`

**Interfaces (Produces):**
- `rebirthBeing(sm, name)`: loads, calls `being.rebirth()`, **saves `result.being`**, returns `{ incarnation, expiredSeeds, shapingSeed, fromRealm, toRealm }` + a one-line realm description (NEVER serialize the live Being into the response).
- Mutating handlers (`act`, `experienceSensory`, `ripenKarma`, `meditate`, `cognizeObject`, plus CLI karma/meditate/inquiry): after `loadExistingBeing`, call `settlePendingRebirth()`; if it fired, continue operating on `result.being` and save THAT object; response gains an optional `rebirth` note when it fired (so the agent sees "your being was reborn as a preta since last session").
- Read-only (`getStatus`, `chain`): no settle, no save; `getStatus`/`getSeedStats` output gains `realm`.
- `buddha_status` and `buddha_rebirth` tool descriptions updated (realm semantics); tool count remains 16.

- [ ] **Step 1: Failing tests** — `rebirthBeing` persists the NEW object (reload → `realm` matches `toRealm`); status is read-only (gap-crossed being: two consecutive `getStatus` calls return identical realm and the file's mtime/content unchanged); a mutating call after a gap settles + persists (reload shows new realm) and its response carries the rebirth note.
- [ ] **Step 2:** RED → **Step 3:** implement → **Step 4:** `npm run build:plugin` + commit fresh bundle; isolated smoke still 16 tools; full suite + typecheck + lint → **Step 5: Commit** `feat(mcp): realm-aware rebirth and pending-rebirth settlement in mutating handlers`

---

### Task 5: Docs, skills, unified 0.4.0 version, CHANGELOG

**Files:**
- Modify: README.md (Six Realms section: selector table, anattā framing, realm modifiers), CLAUDE.md (realms + version), plugin skills (status/karma/cognize realm notes; rebirth semantics in buddha.md), `package.json`, `src/mcp/index.ts` serverInfo, `mcpb/manifest.json`, `plugin/.claude-plugin/plugin.json` — ALL to `0.4.0`
- Create: `CHANGELOG.md` (0.2.0: doctrinal fixes + breaking act(); 0.3.0-internal: depth engine + breaking receiveKarmicResults; 0.4.0: typed rebirth + realms; note version unification)
- Test: greps only

- [ ] **Step 1:** Write everything; every realm claim transcribed from the shipped code (modifier numbers, selector rows). **Step 2:** Verify — `grep -rn "0\.3\.1\|0\.2\.0" package.json plugin mcpb src/mcp/index.ts` shows no stale versions; rebuild plugin bundle if serverInfo changed (it did — version string) + commit fresh; suite green. **Step 3: Commit** `chore: unify all surfaces at 0.4.0 with CHANGELOG; six-realms docs and skills`

---

### Task 6: Verification sweep (no fixes)

- [ ] Suite/typecheck/lint; all 5 builds; both bundles isolated-smoke at 16 tools; `git diff --exit-code plugin/dist`.
- [ ] E2E stdio scenario with temp state dir: create → act greed ×3 (intensity 8) → rebirth → expect `toRealm: 'preta'` → status shows realm preta → meditate + wholesome acts → rebirth → expect climb out of preta (human or better) → set `BUDDHA_INCARNATION_GAP_MS=0` env for the server, restart server process, status twice (realm stable, no writes), then one act → response carries the rebirth note. Paste transcript.
- [ ] Map spec §§1-6 + amendments to commits; report gaps, don't fix.

---

## Self-review notes (author)

- The wisdom-cap consultation point is the riskiest unknown (meditate doesn't currently develop rightView) — Task 1 explicitly requires the implementer to identify the real driving path and test against it, reporting the choice.
- The store-identity handoff in Task 2 (old being detached with a fresh empty store) prevents the classic aliasing bug; the anattā test pins it by identity.
- Task 4's "response carries a rebirth note" is additive to existing response shapes — no schema change, tool count stays 16.
