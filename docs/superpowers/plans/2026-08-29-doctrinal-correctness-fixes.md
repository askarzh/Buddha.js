# Doctrinal Correctness Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the eight correctness defects found in the 2026-08-29 audit that make the simulation contradict the Buddhist doctrine it models, each fix verified against the "Buddha Plain and Simple" NotebookLM sources.

**Architecture:** Surgical fixes to existing classes — no restructuring. One new small core file (`src/core/Unconditioned.ts`); everything else edits classes in place, following existing patterns (Phenomenon lifecycle hooks, Zod schemas in `src/mcp/index.ts`, StateManager persistence).

**Tech Stack:** TypeScript strict, Vitest, tsup, @modelcontextprotocol/sdk + zod (MCP), Commander (CLI).

**Spec:** No separate spec file. The requirements are the audit findings + doctrinal verdicts recorded in this plan's task preambles (each task states the verified doctrine it implements). Doctrinal source: NotebookLM notebook `9e43e48e-13ca-4d45-80ed-36739c4606db`, queried 2026-08-29.

## Global Constraints

- `npm run typecheck` and `npm run test:run` must pass after every task (219 existing tests + new ones).
- TypeScript strict mode; prefix unused params with `_`.
- No new runtime dependencies.
- Breaking API changes are allowed (v0.1.0, unpublished) but must update every caller in `src/`, `tests/`, and `README.md` in the same task.
- Commit after every task with a conventional-commit message.

---

### Task 1: Vedana valence orthogonal to intensity

**Doctrine (verified):** Hedonic tone (pleasant/unpleasant/neutral) is independent of intensity; an intense unpleasant feeling is *more painful*, never pleasant. Current code passes `input.intensity` as `pleasantness`, so intense pain classifies as pleasant and triggers greed instead of aversion.

**Files:**
- Modify: `src/five-aggregates/FiveAggregates.ts` (SensoryInput interface ~line 22, processExperience ~line 133)
- Modify: `src/five-aggregates/VedanaAggregate.ts` (feel ~line 68)
- Modify: `src/simulation/Being.ts` (receiveKarmicResults ~line 147)
- Modify: `src/mcp/index.ts` (buddha_experience schema), `src/mcp/handlers.ts` (experienceSensory)
- Modify: `README.md` quick-start (also fix the wrong `experience.feeling` field — real name is `feelingTone`)
- Test: `tests/five-aggregates/FiveAggregates.test.ts`, `tests/simulation/Being.test.ts`

**Interfaces:**
- Produces: `SensoryInput` gains `valence?: FeelingTone` (default `'neutral'`); `VedanaAggregate.feel(input: { senseBase: SenseBase; valence: FeelingTone; intensity: number }): FeelingTone`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/five-aggregates/FiveAggregates.test.ts (add)
it('classifies intense unpleasant input as unpleasant', () => {
  const agg = new FiveAggregates();
  const exp = agg.processExperience({
    senseBase: 'body', object: 'sharp pain', intensity: 9, valence: 'unpleasant',
  });
  expect(exp.feelingTone).toBe('unpleasant');
});

it('defaults valence to neutral when omitted', () => {
  const agg = new FiveAggregates();
  const exp = agg.processExperience({ senseBase: 'eye', object: 'wall', intensity: 8 });
  expect(exp.feelingTone).toBe('neutral');
});
```

```ts
// tests/simulation/Being.test.ts (add)
it('experiences unwholesome karmic results as unpleasant', () => {
  const being = new Being();
  being.act('harsh speech', 7, 'aversion');
  being.receiveKarmicResults();
  const last = being.getExperienceHistory(1)[0];
  expect(last.feelingTone).toBe('unpleasant');
});
```
Note: this Being test uses the Task 4 `act(description, intensity, root)` signature. If executing Task 1 before Task 4, write it with the current signature `being.act('harsh speech', 'unwholesome', 7, 'aversion')` and update it in Task 4.

- [ ] **Step 2: Run tests to verify they fail** — `npx vitest run tests/five-aggregates tests/simulation` → new tests FAIL (valence not a field / tone comes out 'pleasant').

- [ ] **Step 3: Implement**

`src/five-aggregates/FiveAggregates.ts`:
```ts
import { SenseBase, FeelingTone, Intensity } from '../utils/types';

export interface SensoryInput {
  senseBase: SenseBase;
  object: unknown;
  intensity: number; // 1-10 magnitude of the experience
  /** Hedonic tone of the contact. Orthogonal to intensity. Default: 'neutral'. */
  valence?: FeelingTone;
}
```
In `processExperience`, replace the feeling step:
```ts
    // 4. Feeling determines the hedonic tone (valence), with its own magnitude
    const feelingTone = this.feeling.feel({
      senseBase: input.senseBase,
      valence: input.valence ?? 'neutral',
      intensity: input.intensity
    });
```

`src/five-aggregates/VedanaAggregate.ts` — replace `feel`:
```ts
  /**
   * Register a feeling. Tone (valence) and intensity are orthogonal:
   * intense pain is MORE unpleasant, not pleasant.
   */
  feel(input: { senseBase: SenseBase; valence: FeelingTone; intensity: number }): FeelingTone {
    const clamped = Math.min(10, Math.max(0, Math.round(input.intensity))) as Intensity;
    this.update({
      tone: input.valence,
      source: input.senseBase,
      intensity: clamped
    });
    return input.valence;
  }
```

`src/simulation/Being.ts` `receiveKarmicResults` — map result quality to valence:
```ts
          this.experience({
            senseBase: 'mind',
            object: result.description,
            intensity: result.intensity,
            valence: result.experienceQuality
          });
```
(`KarmicResult.experienceQuality` is already `'pleasant' | 'unpleasant' | 'neutral'` — verify in `src/karma/KarmicResult.ts`; if the field name differs, use the actual field.)

`src/mcp/index.ts` — add to the `buddha_experience` schema object:
```ts
    valence: z.enum(['pleasant', 'unpleasant', 'neutral']).optional()
      .describe('Hedonic tone of the experience (default: neutral). Independent of intensity.'),
```
and pass it through the handler call. `src/mcp/handlers.ts` `experienceSensory` input type becomes `{ senseBase: SenseBase; object: unknown; intensity: Intensity; valence?: FeelingTone }`.

`README.md` — in the quick start, change `experience.feeling` to `experience.feelingTone` and add `valence: 'pleasant'` to the example input.

- [ ] **Step 4: Fix fallout.** Search remaining callers of the old `feel({ pleasantness })` shape: `grep -rn "pleasantness" src/ tests/`. Update each to the new shape. Run `npm run typecheck`; fix any missed call sites (some existing tests assert intensity-derived tones — update their expectations to explicit valence).

- [ ] **Step 5: Run full suite** — `npm run test:run` and `npm run typecheck` → all PASS.

- [ ] **Step 6: Commit** — `git commit -m "fix(five-aggregates): make feeling valence orthogonal to intensity"`

---

### Task 2: Cessation propagation and working chain-breaking

**Doctrine (verified):** The cessation sequence ("with the cessation of this, that ceases") is the essential soteriological half of dependent origination; breaking a link must stop subsequent links. Today `breakChainAt(8)` before arising does nothing (arise ignores `_isBroken`) and cessation never cascades.

**Files:**
- Modify: `src/dependent-origination/Nidana.ts` (arise guard, onCease, breakLink ~lines 75-92)
- Test: `tests/dependent-origination/DependentOrigination.test.ts`

**Interfaces:**
- Produces: `Nidana.arise()` returns `false` when `_isBroken`; `Nidana` cessation cascades forward via `onCease`; `breakLink()` returns `true` whenever the link transitions to broken (arisen or not).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/dependent-origination/DependentOrigination.test.ts (add)
describe('cessation (patiloma)', () => {
  it('a pre-broken link stops the arising sequence at that point', () => {
    const chain = new DependentOrigination();
    chain.reset();
    chain.breakChainAt(8); // Tanha (craving)
    chain.runFullSequence();
    expect(chain.craving.hasArisen).toBe(false);
    expect(chain.clinging.hasArisen).toBe(false);
    expect(chain.agingDeath.hasArisen).toBe(false);
    expect(chain.feeling.hasArisen).toBe(true); // links before the break still arise
  });

  it('breaking an arisen link cascades cessation through all subsequent links', () => {
    const chain = new DependentOrigination();
    chain.reset();
    chain.runFullSequence();
    expect(chain.agingDeath.hasArisen).toBe(true);
    chain.breakChainAt(8);
    expect(chain.craving.hasCeased).toBe(true);
    expect(chain.clinging.hasCeased).toBe(true);
    expect(chain.agingDeath.hasCeased).toBe(true);
    expect(chain.contact.hasCeased).toBe(false); // upstream links unaffected
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/dependent-origination` → both FAIL.

- [ ] **Step 3: Implement** in `src/dependent-origination/Nidana.ts`:

```ts
  /**
   * A broken link cannot arise: "when this does not exist, that does not come to be."
   */
  arise(): boolean {
    if (this._isBroken) return false;
    return super.arise();
  }

  /**
   * "With the cessation of this, that ceases" — cessation cascades forward.
   */
  protected onCease(): void {
    if (this.nextLink && this.nextLink.isPresent) {
      this.nextLink.cease();
    }
  }

  /**
   * Breaking this link stops the chain: an arisen link ceases (cascading
   * forward); an un-arisen link is blocked from ever arising.
   */
  breakLink(): boolean {
    if (this._isBroken) return false;
    this._isBroken = true;
    if (this.isPresent) {
      this.cease();
    }
    return true;
  }
```
(The existing `onArise` forward-propagation stays as is.)

- [ ] **Step 4: Update `breakChainAt` reason strings if needed.** In `DependentOrigination.ts:150-165` the `success` flag now reflects the new `breakLink` semantics (false only when already broken) — verify the existing test at ~line 66 still passes; adjust its expectation only if it asserted the old broken-twice behavior.

- [ ] **Step 5: Run full suite** — `npm run test:run`, `npm run typecheck` → PASS.

- [ ] **Step 6: Commit** — `git commit -m "fix(dependent-origination): implement cessation cascade and make chain-breaking effective"`

---

### Task 3: Un-deadlock the Eightfold Path

**Doctrine (verified):** The eight factors develop *together, mutually supporting* — explicitly not sequential prerequisites. The mutual-condition graph is doctrinally right; treating those conditions as arising *prerequisites* (all-must-be-arisen) creates a permanent deadlock where no factor can ever arise.

**Files:**
- Modify: `src/eightfold-path/PathFactor.ts` (add conditionsMet override, ~line 60)
- Test: `tests/eightfold-path/EightfoldPath.test.ts`

**Interfaces:**
- Produces: `PathFactor.activate()` actually arises the factor; `hasArisen` becomes `true` for practiced factors (affects `PathFactorData.hasArisen` in serialized beings).

- [ ] **Step 1: Write the failing test**

```ts
// tests/eightfold-path/EightfoldPath.test.ts (add)
it('factors arise when activated (mutual support is not a prerequisite gate)', () => {
  const path = new EightfoldPath();
  path.activateAll();
  for (const f of path.getAllFactors()) {
    expect(f.hasArisen).toBe(true);
  }
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/eightfold-path` → FAIL (`hasArisen` false).

- [ ] **Step 3: Implement** in `src/eightfold-path/PathFactor.ts`:

```ts
  /**
   * Path factors develop together in mutual support, not in sequence:
   * the interdependence conditions model reinforcement, never prerequisites.
   * A factor arises the moment it is cultivated. (Gethin, Foundations ch. 3)
   */
  protected conditionsMet(): boolean {
    return true;
  }
```

- [ ] **Step 4: Run full suite** — `npm run test:run`, `npm run typecheck`. Existing serializer tests asserting `hasArisen: false` for practiced factors will now fail — update those fixtures to the correct `true`.

- [ ] **Step 5: Commit** — `git commit -m "fix(eightfold-path): let factors arise; mutual support is reinforcement, not a gate"`

---

### Task 4: Karma quality derives from root (remove the lying parameter)

**Doctrine (verified):** Moral quality *cannot* be assigned independently of the roots — deriving quality from the root is correct. The bug is the API: `Being.act` accepts a `quality` argument (also exposed as an MCP tool param) and silently discards it.

**Files:**
- Modify: `src/simulation/Being.ts` (act ~line 121)
- Modify: `src/mcp/index.ts` (buddha_act schema ~line 131), `src/mcp/handlers.ts` (act ~line 43)
- Modify: `src/cli/commands/karma.ts` (jsonMode + interactiveMode)
- Test: `tests/simulation/Being.test.ts`, `tests/mcp/handlers.test.ts`

**Interfaces:**
- Produces: `Being.act(description: string, intensity: Intensity, root?: UnwholesomeRoot | WholesomeRoot): Karma` — quality comes from `Intention.determineQuality(root)` (already implemented); no root → `'neutral'`.
- MCP `buddha_act` inputs: `name`, `description`, `intensity`, `root` (no `quality`). Tool description gains: "Karmic quality (wholesome/unwholesome) is determined by the root; omit root for a neutral act."

- [ ] **Step 1: Write the failing tests**

```ts
// tests/simulation/Being.test.ts (add / replace the old quality-param test)
it('derives karma quality from the root', () => {
  const being = new Being();
  expect(being.act('donate', 5, 'non-greed').quality).toBe('wholesome');
  expect(being.act('steal', 5, 'greed').quality).toBe('unwholesome');
  expect(being.act('walk', 5).quality).toBe('neutral');
});
```

- [ ] **Step 2: Run to verify failure** — signature mismatch compile error counts as the failure.

- [ ] **Step 3: Implement**

`src/simulation/Being.ts`:
```ts
  /**
   * Perform an intentional action (creates karma).
   * Quality is determined by the root motivation — "greed is a root of the
   * unwholesome... non-greed is a root of the wholesome" (M. I.46-47) — and
   * cannot be assigned independently of it.
   */
  act(
    description: string,
    intensity: Intensity,
    root?: UnwholesomeRoot | WholesomeRoot
  ): Karma {
    const intention = new Intention(description, intensity, root);
    const karma = new Karma(intention, intensity);
    karma.complete();
    this.karmicStream.push(karma);
    return karma;
  }
```
Remove the now-unused `KarmaQuality` import if nothing else uses it.

`src/mcp/handlers.ts` — drop the `quality` param from `act(...)` and its call. `src/mcp/index.ts` — remove `quality: karmaQualitySchema` from the `buddha_act` schema and the destructure/call; extend the tool description as specified above.

`src/cli/commands/karma.ts`:
- `jsonMode`: act when `description && intensity && root` are present (drop `quality` from the condition). If `localOpts.quality` is also given and contradicts the derived quality, print an error JSON `{ error: "Quality '<q>' contradicts root '<r>' — quality is determined by the root" }` and `process.exitCode = 1` instead of acting.
- `interactiveMode`: keep the quality `select` (it drives which root list to show) but call `being.act(description, intensity, root)`.

- [ ] **Step 4: Fix fallout** — `grep -rn "\.act(" src/ tests/ README.md plugin/` and update every call to the new 3-arg signature (README karma examples included).

- [ ] **Step 5: Run full suite** — `npm run test:run`, `npm run typecheck` → PASS.

- [ ] **Step 6: Commit** — `git commit -m "fix(karma)!: derive karma quality from root; remove discarded quality parameter"`

---

### Task 5: Nirodha as unconditioned (asankhata)

**Doctrine (verified):** Nirvana is the one unconditioned dharma: anicca and dukkha apply only to conditioned phenomena (*sabbe sankhara anicca/dukkha*); only anatta applies to all dhammas (*sabbe dhamma anatta*). Modeling Nirodha as a conditioned `Phenomenon` (impermanent, unsatisfactory) is "a fundamental error."

**Files:**
- Create: `src/core/Unconditioned.ts`
- Modify: `src/core/index.ts`, `src/index.ts` (export), `src/four-noble-truths/Nirodha.ts` (extends), `src/four-noble-truths/FourNobleTruths.ts` (~lines 90-93 condition wiring)
- Test: `tests/four-noble-truths/Nirodha.test.ts`

**Interfaces:**
- Produces: `export interface AsankhataMarks { readonly impermanence: false; readonly unsatisfactoriness: false; readonly notSelf: true }` and `export abstract class UnconditionedDharma implements AsankhataMarks, TwoTruthsExaminable` with `readonly id: string`, abstract `name`/`sanskritName`, and abstract `getConventionalTruth()`/`getUltimateTruth()`. No arise/cease/conditions API.

- [ ] **Step 1: Write the failing test**

```ts
// tests/four-noble-truths/Nirodha.test.ts (add)
it('is unconditioned: not impermanent, not unsatisfactory, still not-self', () => {
  const nirodha = new Nirodha();
  expect(nirodha.impermanence).toBe(false);
  expect(nirodha.unsatisfactoriness).toBe(false);
  expect(nirodha.notSelf).toBe(true);
  expect('arise' in nirodha).toBe(false);
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/four-noble-truths` → FAIL.

- [ ] **Step 3: Implement**

`src/core/Unconditioned.ts`:
```ts
/**
 * The Unconditioned (Asankhata)
 *
 * "Sabbe sankhara anicca, sabbe sankhara dukkha, sabbe DHAMMA anatta" —
 * impermanence and unsatisfactoriness mark only conditioned phenomena;
 * not-self marks all dharmas without exception. Nirvana is the one
 * unconditioned dharma: it does not arise from conditions and does not cease.
 */

import { TwoTruthsExaminable, ConventionalTruth, UltimateTruth } from './TwoTruths';
import { generateId } from '../utils/types';

/** Marks of the unconditioned: beyond anicca and dukkha, still anatta. */
export interface AsankhataMarks {
  readonly impermanence: false;
  readonly unsatisfactoriness: false;
  readonly notSelf: true;
}

/**
 * Base class for unconditioned dharmas. Deliberately has NO conditions,
 * arising, or cessation — that is the point.
 */
export abstract class UnconditionedDharma implements AsankhataMarks, TwoTruthsExaminable {
  readonly impermanence: false = false;
  readonly unsatisfactoriness: false = false;
  readonly notSelf: true = true;

  readonly id: string;
  abstract readonly name: string;
  abstract readonly sanskritName: string;

  constructor() {
    this.id = generateId();
  }

  abstract getConventionalTruth(): ConventionalTruth;
  abstract getUltimateTruth(): UltimateTruth;
}
```

`src/four-noble-truths/Nirodha.ts` — change the import and extends clause:
```ts
import { UnconditionedDharma } from '../core/Unconditioned';
// ...
export class Nirodha extends UnconditionedDharma {
```
Everything else in the class stays (it never used arise/cease).

`src/four-noble-truths/FourNobleTruths.ts` — delete the `thirdTruth.addCondition(...)` wiring (~line 93): realization of cessation depends on the path, but nirodha itself is unconditioned. Keep a one-line comment: `// Nirodha is asankhata — it has no conditions; the PATH conditions its realization, not it.` Remove any other `thirdTruth.arise()`/`hasArisen` usages surfaced by typecheck.

`src/core/index.ts` and `src/index.ts` — export `UnconditionedDharma` and `AsankhataMarks`.

- [ ] **Step 4: Run typecheck and chase fallout** — `npm run typecheck`; fix every place that treated `Nirodha` as `Phenomenon` (serializer, tests, docs examples found via `grep -rn "thirdTruth\|Nirodha" src/ tests/`).

- [ ] **Step 5: Run full suite** — `npm run test:run` → PASS.

- [ ] **Step 6: Commit** — `git commit -m "fix(core)!: model Nirodha as unconditioned (asankhata), not a conditioned Phenomenon"`

---

### Task 6: Honest diagnostics (empty-input progress, allTruthsUnderstood)

**Rationale (audit findings 7 & 8):** `Nirodha.assessProgress` scores an *empty* analysis as 10/10 ("Advanced practice"), and `FourNobleTruths.allTruthsUnderstood()` checks only the first truth.

**Files:**
- Modify: `src/four-noble-truths/Nirodha.ts` (assessProgress ~line 87)
- Modify: `src/four-noble-truths/FourNobleTruths.ts` (allTruthsUnderstood ~line 200)
- Test: `tests/four-noble-truths/Nirodha.test.ts`, `tests/four-noble-truths/FourNobleTruths.test.ts`

**Interfaces:**
- Consumes: `CauseAnalysis` from `src/four-noble-truths/Samudaya.ts` (`cravingsPresent`, `rootCauses`, `intensity`, `primaryDriver`), `Dukkha.isFullyUnderstood()`, `Magga.getPath(): IEightfoldPath | undefined`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/four-noble-truths/Nirodha.test.ts (add)
it('reports zero progress for an empty analysis instead of near-liberation', () => {
  const nirodha = new Nirodha();
  const assessment = nirodha.isPossible({
    cravingsPresent: [], rootCauses: [], intensity: 0, primaryDriver: null,
  });
  expect(assessment.progressLevel).toBe(0);
});
```

```ts
// tests/four-noble-truths/FourNobleTruths.test.ts (add)
it('allTruthsUnderstood requires a developed path, not just the first truth', () => {
  const path = new EightfoldPath();
  const truths = new FourNobleTruths(path);
  // First truth alone must not be sufficient
  truths.dukkha.analyze(['dukkha-dukkha', 'viparinama-dukkha', 'sankhara-dukkha']);
  expect(truths.allTruthsUnderstood()).toBe(false);
});
```
(Check how `Dukkha.isFullyUnderstood()` becomes true — read `src/four-noble-truths/Dukkha.ts:115` first and set the test up so the first truth IS fully understood while the path is undeveloped; adapt the `analyze` call to whatever that requires.)

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement**

`Nirodha.assessProgress` — add a guard at the top:
```ts
  private assessProgress(analysis: CauseAnalysis): number {
    // An empty analysis is absence of evidence, not evidence of liberation.
    if (analysis.cravingsPresent.length === 0 && analysis.rootCauses.length === 0) {
      return 0;
    }
    // ... existing scoring unchanged
```

`FourNobleTruths.allTruthsUnderstood`:
```ts
  /**
   * All four truths understood: dukkha fully comprehended (1st truth's task)
   * and the path substantially developed (4th truth's task). The 2nd and 3rd
   * truths' tasks (abandoning, realizing) are reflected in path development.
   */
  allTruthsUnderstood(): boolean {
    const path = this.fourthTruth.getPath();
    return this.firstTruth.isFullyUnderstood()
      && path !== undefined
      && path.getOverallDevelopment() >= 8;
  }
```

- [ ] **Step 4: Run full suite** — `npm run test:run`, `npm run typecheck` → PASS.

- [ ] **Step 5: Commit** — `git commit -m "fix(four-noble-truths): honest progress scoring and full-truths check"`

---

### Task 7: MCP stops silently creating beings on typos

**Rationale (audit):** `StateManager.loadBeing` returns a fresh `Being` for any unknown name, so a typo'd `name` in any MCP tool silently forks a new persisted being; an agent cannot detect the mistake and `buddha_create_being` is meaningless. CLI keeps its auto-create convenience; MCP becomes strict.

**Files:**
- Modify: `src/cli/utils/state.ts` (StateManager)
- Modify: `src/mcp/handlers.ts` (all being-loading handlers)
- Test: `tests/cli/state.test.ts`, `tests/mcp/handlers.test.ts`

**Interfaces:**
- Produces: `StateManager.hasBeing(name: string): boolean`; `StateManager.loadExistingBeing(name: string): Being` (throws `Error` with message `Being not found: "<name>". Create it with buddha_create_being or list existing beings with buddha_list_beings.` when the file is absent). `loadBeing` keeps its auto-create behavior for the CLI.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/mcp/handlers.test.ts (add — follow the existing mkdtempSync temp-dir pattern)
it('getStatus throws for a nonexistent being instead of creating one', () => {
  expect(() => getStatus(sm, 'no-such-being')).toThrow(/Being not found/);
  expect(sm.listBeings()).not.toContain('no-such-being');
});

it('act throws for a nonexistent being', () => {
  expect(() => act(sm, 'no-such-being', 'walk', 3)).toThrow(/Being not found/);
});
```

```ts
// tests/cli/state.test.ts (add)
it('hasBeing reflects persisted files', () => {
  expect(sm.hasBeing('nobody')).toBe(false);
  sm.saveBeing('somebody', new Being());
  expect(sm.hasBeing('somebody')).toBe(true);
});
```

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement**

`src/cli/utils/state.ts` — add to `StateManager`:
```ts
  hasBeing(name: string): boolean {
    return fs.existsSync(this.beingPath(name));
  }

  /** Load a being that must already exist (used by the MCP server). */
  loadExistingBeing(name: string): Being {
    if (!this.hasBeing(name)) {
      throw new Error(
        `Being not found: "${name}". Create it with buddha_create_being or list existing beings with buddha_list_beings.`
      );
    }
    return this.loadBeing(name);
  }
```

`src/mcp/handlers.ts` — replace `sm.loadBeing(name)` with `sm.loadExistingBeing(name)` in `getStatus`, `experienceSensory`, `act`, `ripenKarma`, `meditate`, `diagnose`, `inquiry`, `chain`. (`createBeing` unchanged.) The MCP tool try/catch wrappers already turn the throw into an `isError: true` response with the actionable message.

- [ ] **Step 4: Persist contemplative mutations while here** — `diagnose` and `inquiry` mutate sub-objects but never save (CLI's inquiry does). Add `sm.saveBeing(name, being);` before the return in both handlers (`chain` is read-only; leave it).

- [ ] **Step 5: Run full suite** — `npm run test:run`, `npm run typecheck` → PASS.

- [ ] **Step 6: Commit** — `git commit -m "fix(mcp): reject unknown being names and persist diagnose/inquiry mutations"`

---

### Task 8: Verification sweep

**Files:** none new — verification only.

- [ ] **Step 1:** `npm run typecheck && npm run test:run` → all green.
- [ ] **Step 2:** `npm run build && npm run build:cli && npm run build:mcp` → all succeed.
- [ ] **Step 3:** MCP smoke test (initialize → tools/list → `buddha_create_being` → `buddha_act` without `quality` → `buddha_status` on a typo'd name must return the "Being not found" error):
```bash
printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' \
 '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"buddha_create_being","arguments":{"name":"t1"}}}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"buddha_act","arguments":{"name":"t1","description":"give alms","intensity":5,"root":"non-greed"}}}' \
 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"buddha_status","arguments":{"name":"typo"}}}' \
 | BUDDHA_STATE_DIR=$(mktemp -d) node dist/mcp.mjs
```
- [ ] **Step 4:** Re-read the audit's five doctrinal claims against the diff — each maps to a merged task (valence→1, cessation→2, path→3, roots→4, asankhata→5).
- [ ] **Step 5:** Commit any stragglers; do not push/PR without the user's go-ahead.

---

## Roadmap (separate future plans — do NOT implement from this document)

1. **Release hygiene:** LICENSE file (MIT), `prepublishOnly` chaining all three builds, `author`/`repository`/`engines` in package.json, README MCP-server section with Claude Desktop config, ESLint config, `npm audit fix`, CI workflow.
2. **Plugin rebuild:** bundle the MCP server into the Claude Code plugin via an `mcpServers` block using `${CLAUDE_PLUGIN_ROOT}`, add `.claude-plugin/marketplace.json`, rewrite the eight skills against the real tool surface (fix the wrong enum/ID/default values), ship built `dist/mcp.mjs`.
3. **Claude Desktop MCPB:** package `buddha-mcp` as a one-click `.mcpb` bundle.
4. **Depth release (v0.2):** wire `Citta` and `KarmicEventSystem` into `Being`; drive the dependent-origination chain from `Being.experience`; atomic writes + concurrency safety for `~/.buddha`.
