# Being.ts Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract serialization logic from Being.ts into a standalone BeingSerializer module, reducing Being.ts by ~35% while preserving the public API.

**Architecture:** Create `BeingSerializer.ts` with pure `serializeBeing()` and `deserializeBeing()` functions. Being.toJSON/fromJSON delegate to them. Being gains a `_restoreState()` method so the serializer can set private state without `as any` hacks. All existing tests must pass unchanged — they are the safety net for this refactoring.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Add `_restoreState()` method to Being

This gives the serializer a controlled entry point for setting private state during deserialization.

**Files:**
- Modify: `src/simulation/Being.ts`
- Test: `tests/simulation/Being.test.ts` (existing — verify still passes)

**Step 1: Add the `_restoreState()` method to Being**

Add the following method to the `Being` class, after the `getKarmicStream()` method (after line 293):

```ts
  /**
   * @internal Used by BeingSerializer for deserialization.
   * Not part of the public API.
   */
  _restoreState(state: {
    mindfulnessLevel: Intensity;
    karmicStream: Karma[];
    experienceHistory: ProcessedExperience[];
  }): void {
    this._mindfulnessLevel = state.mindfulnessLevel;
    this.karmicStream = state.karmicStream;
    this.experienceHistory = state.experienceHistory;
  }
```

**Step 2: Run all tests to verify nothing broke**

Run: `npx vitest run`
Expected: ALL 190 tests PASS

**Step 3: Commit**

```bash
git add src/simulation/Being.ts
git commit -m "refactor: add _restoreState() method to Being for serializer access"
```

---

### Task 2: Create BeingSerializer and extract serialization logic

Extract the bodies of `Being.toJSON()` and `Being.fromJSON()` into standalone functions. Then slim Being's methods to one-liner delegates.

**Files:**
- Create: `src/simulation/BeingSerializer.ts`
- Modify: `src/simulation/Being.ts`
- Test: `tests/simulation/Being.persistence.test.ts` (existing — verify still passes)

**Step 1: Create `src/simulation/BeingSerializer.ts`**

This file contains the full serialization/deserialization logic extracted from Being. The functions access Being's public properties directly and use `_restoreState()` for private state.

```ts
/**
 * BeingSerializer — Serialization logic for the Being class
 *
 * Extracted from Being.ts to separate behavioral concerns from
 * persistence concerns. These are internal functions, not part
 * of the public API.
 */

import { Being } from './Being';
import { Karma } from '../karma/Karma';
import { Intention } from '../karma/Intention';
import {
  BeingData,
  PathData,
  MindData,
  NidanaChainData,
  KarmaData,
  UnwholesomeRoot,
  WholesomeRoot,
  SenseBase,
} from '../utils/types';
import { ProcessedExperience, SensoryInput } from '../five-aggregates/FiveAggregates';

/**
 * Serialize a Being to a plain JSON-compatible object.
 */
export function serializeBeing(being: Being): BeingData {
  const pathFactors = being.path.getAllFactors();
  const path: PathData = {
    factors: pathFactors.map(f => ({
      name: f.name,
      developmentLevel: f.developmentLevel,
      isActive: f.isActive,
      hasArisen: f.hasArisen,
      hasCeased: f.hasCeased,
    })),
  };

  const mindFactorKeys = [
    'contact', 'feeling', 'perception', 'intention', 'attention',
    'greed', 'aversion', 'delusion',
    'mindfulness', 'equanimity', 'compassion', 'wisdom',
  ];
  const mindFactors: MindData['factors'] = [];
  for (const key of mindFactorKeys) {
    const factor = being.mind.getFactor(key);
    if (factor) {
      mindFactors.push({
        key,
        name: factor.name,
        sanskritName: factor.sanskritName,
        quality: factor.quality,
        intensity: factor.intensity,
        isActive: factor.isActive,
      });
    }
  }
  const mindState = being.mind.getState();
  const mind: MindData = {
    factors: mindFactors,
    clarity: mindState.clarity,
    stability: mindState.stability,
  };

  const chainState = being.dependentOrigination.getChainState();
  const dependentOrigination: NidanaChainData = {
    links: chainState.map(l => ({
      position: l.position,
      name: l.name,
      hasArisen: l.hasArisen,
      hasCeased: false,
      isBroken: l.isBroken,
    })),
  };

  const karmicStream: KarmaData[] = being.getKarmicStream().map(k => ({
    id: k.id,
    description: k.intention.description,
    quality: k.quality,
    intensity: k.intensity,
    root: k.intention.root,
    isCompleted: k.isCompleted,
    hasManifested: k.hasManifested,
  }));

  const snapshot = being.aggregates.getSnapshot();

  return {
    mindfulnessLevel: being.mindfulnessLevel,
    karmicStream,
    experienceHistory: being.getExperienceHistory(Infinity).map(e => ({
      input: { senseBase: e.input.senseBase, object: e.input.object, intensity: e.input.intensity },
      label: e.label,
      feelingTone: e.feelingTone,
      reactions: [...e.reactions],
      timestamp: e.timestamp,
    })),
    aggregates: {
      form: { ...snapshot.form } as Record<string, unknown>,
      feeling: { ...snapshot.feeling } as Record<string, unknown>,
      perception: { ...snapshot.perception } as Record<string, unknown>,
      mentalFormations: {
        dominantQuality: snapshot.mentalFormations.dominantQuality,
        overallIntensity: snapshot.mentalFormations.overallIntensity,
        activeFactors: snapshot.mentalFormations.activeFactors.map(f => ({
          name: f.name,
          quality: f.quality,
          intensity: f.intensity,
          active: f.active,
        })),
      } as Record<string, unknown>,
      consciousness: {
        activeTypes: Array.from(snapshot.consciousness.activeTypes),
        primaryFocus: snapshot.consciousness.primaryFocus,
        clarity: snapshot.consciousness.clarity,
      } as Record<string, unknown>,
    },
    path,
    mind,
    dependentOrigination,
  };
}

/**
 * Restore a Being from serialized data.
 */
export function deserializeBeing(data: BeingData): Being {
  const being = new Being();

  // Restore path factor development levels
  const factorMap = new Map(being.path.getAllFactors().map(f => [f.name, f]));
  for (const fd of data.path.factors) {
    const factor = factorMap.get(fd.name);
    if (factor) {
      factor.reset();
      if (fd.hasArisen || fd.isActive) {
        factor.activate();
      }
      (factor as any)._developmentLevel = fd.developmentLevel;
      (factor as any)._hasArisen = fd.hasArisen;
      (factor as any)._hasCeased = fd.hasCeased;
    }
  }

  // Restore mind factors
  for (const mf of data.mind.factors) {
    const factor = being.mind.getFactor(mf.key);
    if (factor) {
      if (mf.isActive) {
        factor.activate(mf.intensity);
      } else {
        factor.deactivate();
      }
    }
  }
  being.mind.setClarity(data.mind.clarity);
  being.mind.setStability(data.mind.stability);

  // Restore dependent origination
  const links = being.dependentOrigination.links;
  for (const ld of data.dependentOrigination.links) {
    const link = links[ld.position - 1];
    if (link) {
      link.restoreLink();
      if (ld.hasArisen) (link as any)._hasArisen = true;
      if (ld.hasCeased) (link as any)._hasCeased = true;
      if (ld.isBroken) (link as any)._isBroken = true;
    }
  }

  // Restore private state via _restoreState
  const karmicStream = data.karmicStream.map(kd => {
    const intention = new Intention(
      kd.description,
      kd.intensity,
      kd.root === 'neutral' ? undefined : kd.root as UnwholesomeRoot | WholesomeRoot
    );
    const karma = new Karma(intention, kd.intensity);
    if (kd.isCompleted) karma.complete();
    if (kd.hasManifested) karma.manifest();
    return karma;
  });

  const experienceHistory: ProcessedExperience[] = data.experienceHistory.map(e => ({
    input: {
      senseBase: e.input.senseBase as SenseBase,
      object: e.input.object,
      intensity: e.input.intensity,
    } as SensoryInput,
    label: e.label,
    feelingTone: e.feelingTone,
    reactions: [...e.reactions],
    timestamp: e.timestamp,
  }));

  being._restoreState({
    mindfulnessLevel: data.mindfulnessLevel,
    karmicStream,
    experienceHistory,
  });

  return being;
}
```

**Important note about `getExperienceHistory`:** The current Being.getExperienceHistory() takes a `count` parameter defaulting to 10. The serializer needs ALL experiences. Pass `Infinity` to get the full array (the method uses `.slice(-count)` which returns everything when count exceeds length). Alternatively, if this doesn't work, the implementer should check how many experiences exist and pass that count. The key point: the serializer must capture the FULL experience history, not just the last 10.

**Step 2: Slim down Being.toJSON() and Being.fromJSON()**

In `src/simulation/Being.ts`:

Add import at the top:
```ts
import { serializeBeing, deserializeBeing } from './BeingSerializer';
```

Replace the `toJSON()` method body (lines 298-393) with:
```ts
  toJSON(): BeingData {
    return serializeBeing(this);
  }
```

Replace the `fromJSON()` method body (lines 398-473) with:
```ts
  static fromJSON(data: BeingData): Being {
    return deserializeBeing(data);
  }
```

Remove any imports that are now only used by the serializer (like `Intention`, `Karma`'s direct usage in fromJSON). **Be careful**: `Karma` and `Intention` are still used in `Being.act()` and `Being.receiveKarmicResults()`, so check before removing.

**Step 3: Run ALL existing tests**

Run: `npx vitest run`
Expected: ALL 190 tests PASS — this is the critical safety check. Every existing test in Being.test.ts and Being.persistence.test.ts must pass without modification.

**Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/simulation/BeingSerializer.ts src/simulation/Being.ts
git commit -m "refactor: extract serialization from Being into BeingSerializer"
```

---

### Task 3: Add BeingSerializer unit tests

Write direct tests for the serializer functions, independent of Being.toJSON/fromJSON.

**Files:**
- Create: `tests/simulation/BeingSerializer.test.ts`

**Step 1: Write the tests**

```ts
import { describe, it, expect } from 'vitest';
import { Being } from '../../src/simulation/Being';
import { serializeBeing, deserializeBeing } from '../../src/simulation/BeingSerializer';

describe('BeingSerializer', () => {
  describe('serializeBeing()', () => {
    it('should serialize a fresh being', () => {
      const being = new Being();
      const data = serializeBeing(being);

      expect(data.mindfulnessLevel).toBe(0);
      expect(data.karmicStream).toEqual([]);
      expect(data.experienceHistory).toEqual([]);
      expect(data.path.factors).toHaveLength(8);
      expect(data.mind).toBeDefined();
      expect(data.dependentOrigination.links).toHaveLength(12);
    });

    it('should capture full experience history', () => {
      const being = new Being();
      for (let i = 0; i < 15; i++) {
        being.experience({ senseBase: 'eye', object: `item-${i}`, intensity: 5 });
      }

      const data = serializeBeing(being);
      expect(data.experienceHistory).toHaveLength(15);
    });

    it('should produce same output as Being.toJSON()', () => {
      const being = new Being();
      being.meditate(10, 7);
      being.act('help', 'wholesome', 5, 'non-greed');
      being.experience({ senseBase: 'ear', object: 'music', intensity: 6 });

      const fromMethod = being.toJSON();
      const fromSerializer = serializeBeing(being);

      expect(fromSerializer).toEqual(fromMethod);
    });
  });

  describe('deserializeBeing()', () => {
    it('should restore a being from serialized data', () => {
      const being = new Being();
      being.meditate(10, 8);
      being.act('donate', 'wholesome', 7, 'non-greed');

      const data = serializeBeing(being);
      const restored = deserializeBeing(data);

      expect(restored.mindfulnessLevel).toBe(being.mindfulnessLevel);
      expect(restored.getKarmicStream()).toHaveLength(1);
    });

    it('should produce same result as Being.fromJSON()', () => {
      const being = new Being();
      being.meditate(10, 6);
      being.experience({ senseBase: 'mind', object: 'thought', intensity: 3 });

      const data = serializeBeing(being);
      const fromMethod = Being.fromJSON(data);
      const fromSerializer = deserializeBeing(data);

      expect(fromSerializer.mindfulnessLevel).toBe(fromMethod.mindfulnessLevel);
      expect(fromSerializer.getKarmicStream()).toHaveLength(fromMethod.getKarmicStream().length);
      expect(fromSerializer.path.getOverallDevelopment()).toBeCloseTo(fromMethod.path.getOverallDevelopment(), 1);
    });

    it('should allow continued practice after restore', () => {
      const being = new Being();
      being.meditate(10, 5);

      const data = serializeBeing(being);
      const restored = deserializeBeing(data);

      const result = restored.meditate(10, 7);
      expect(result.mindfulnessLevel).toBeGreaterThanOrEqual(being.mindfulnessLevel);
    });
  });
});
```

**Step 2: Run the new tests**

Run: `npx vitest run tests/simulation/BeingSerializer.test.ts`
Expected: ALL PASS

**Step 3: Run full suite**

Run: `npx vitest run`
Expected: ALL tests PASS (190 existing + new serializer tests)

**Step 4: Commit**

```bash
git add tests/simulation/BeingSerializer.test.ts
git commit -m "test: add BeingSerializer unit tests"
```

---

### Task 4: Update TODO.md

**Files:**
- Modify: `TODO.md`

**Step 1: Mark the refactoring TODO as complete**

Change:
```
- [ ] **Refactoring**: Simplify `Being.ts` to be more compositional and less monolithic.
```
To:
```
- [x] **Refactoring**: Simplify `Being.ts` to be more compositional and less monolithic.
```

**Step 2: Commit**

```bash
git add TODO.md
git commit -m "docs: mark Being refactoring as complete in TODO"
```
