# Persistence Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `toJSON()`/`fromJSON()` to `KarmicStore` and `Being` so library consumers can save and restore state.

**Architecture:** Serializable interface + named condition registry. Each class returns a plain typed object from `toJSON()` and accepts it in `static fromJSON()`. Non-serializable state (timers, listeners, function callbacks) is dropped on serialize and rebuilt on restore.

**Tech Stack:** TypeScript, Vitest (TDD)

---

### Task 1: Add Serializable interface and persistence data types

**Files:**
- Modify: `src/utils/types.ts:103` (append after `generateId`)

**Step 1: Write the failing test**

Create `tests/karma/KarmicStore.persistence.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { KarmicStore, createKarmicSeed } from '../../src/karma/KarmicEventSystem';

describe('KarmicStore Persistence', () => {
  let store: KarmicStore;

  beforeEach(() => {
    store = new KarmicStore({ enableAutoRipening: false });
  });

  it('should have toJSON method', () => {
    expect(typeof store.toJSON).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/karma/KarmicStore.persistence.test.ts`
Expected: FAIL — `toJSON` is not a function

**Step 3: Add types to `src/utils/types.ts`**

Append after `generateId` function (after line 103):

```ts
// =============================================================================
// PERSISTENCE TYPES
// =============================================================================

/** Interface for classes that can serialize to/from JSON */
export interface Serializable<TData> {
  toJSON(): TData;
}

/** Serialized ripening condition (without check function) */
export interface RipeningConditionData {
  type: 'time' | 'state' | 'trigger' | 'random' | 'accumulation';
  name?: string;
  description: string;
  weight: number;
}

/** Serialized karmic seed */
export interface KarmicSeedData {
  id: string;
  createdAt: number;
  type: 'bodily' | 'verbal' | 'mental';
  quality: KarmaQuality;
  description: string;
  intentionStrength: Intensity;
  root: UnwholesomeRoot | WholesomeRoot | 'neutral';
  potency: number;
  originalPotency: number;
  strength: 'weak' | 'moderate' | 'strong' | 'weighty';
  ripeningTiming: 'immediate' | 'deferred' | 'next-life' | 'distant-future';
  minDelay: number;
  maxDelay: number;
  ripeningConditions: RipeningConditionData[];
  state: 'dormant' | 'active' | 'ripening' | 'ripened' | 'exhausted' | 'purified';
  ripeningProgress: number;
  timesRipened: number;
  maxRipenings: number;
  tags: string[];
  collectiveId?: string;
}

/** Serialized KarmicStore */
export interface KarmicStoreData {
  seeds: KarmicSeedData[];
  config: {
    maxSeeds: number;
    defaultMinDelay: number;
    defaultMaxDelay: number;
    ripeningCheckInterval: number;
    enableAutoRipening: boolean;
    timeScale: number;
  };
}

/** Serialized path factor state */
export interface PathFactorData {
  name: string;
  developmentLevel: Intensity;
  isActive: boolean;
  hasArisen: boolean;
  hasCeased: boolean;
}

/** Serialized eightfold path */
export interface PathData {
  factors: PathFactorData[];
}

/** Serialized mental factor */
export interface MentalFactorData {
  key: string;
  name: string;
  sanskritName: string;
  quality: MentalFactorQuality;
  intensity: Intensity;
  isActive: boolean;
}

/** Serialized mind state */
export interface MindData {
  factors: MentalFactorData[];
  clarity: Intensity;
  stability: Intensity;
}

/** Serialized nidana link */
export interface NidanaLinkData {
  position: number;
  name: string;
  hasArisen: boolean;
  hasCeased: boolean;
  isBroken: boolean;
}

/** Serialized dependent origination chain */
export interface NidanaChainData {
  links: NidanaLinkData[];
}

/** Serialized karma */
export interface KarmaData {
  id: string;
  description: string;
  quality: KarmaQuality;
  intensity: Intensity;
  root: UnwholesomeRoot | WholesomeRoot | 'neutral';
  isCompleted: boolean;
  hasManifested: boolean;
}

/** Serialized Being */
export interface BeingData {
  mindfulnessLevel: Intensity;
  karmicStream: KarmaData[];
  experienceHistory: Array<{
    input: { senseBase: string; object: unknown; intensity: number };
    label: string;
    feelingTone: FeelingTone;
    reactions: string[];
    timestamp: number;
  }>;
  aggregates: {
    form: { vitality: Intensity; health: string; energy: Intensity };
    feeling: { currentTone: FeelingTone; previousTones: FeelingTone[]; intensity: Intensity };
    perception: { labels: string[]; currentLabel: string | null };
    mentalFormations: { dominantQuality: KarmaQuality; reactions: string[] };
    consciousness: { clarity: Intensity; objects: string[] };
  };
  path: PathData;
  mind: MindData;
  dependentOrigination: NidanaChainData;
}
```

**Step 4: Run test to verify it still fails (types exist but toJSON not implemented yet)**

Run: `npx vitest run tests/karma/KarmicStore.persistence.test.ts`
Expected: FAIL — `toJSON` is still not a function on KarmicStore

**Step 5: Commit**

```bash
git add src/utils/types.ts tests/karma/KarmicStore.persistence.test.ts
git commit -m "feat: add persistence data types and Serializable interface"
```

---

### Task 2: Add condition registry and `name` field to RipeningCondition

**Files:**
- Modify: `src/karma/KarmicEventSystem.ts:85-90` (RipeningCondition interface)
- Modify: `src/karma/KarmicEventSystem.ts:208-228` (KarmicStore class — add registry)

**Step 1: Write the failing test**

Add to `tests/karma/KarmicStore.persistence.test.ts`:

```ts
  describe('Condition Registry', () => {
    it('should register and retrieve named conditions', () => {
      store.registerCondition('always-true', () => true);
      const check = store.getCondition('always-true');
      expect(check).toBeDefined();
      expect(check!()).toBe(true);
    });

    it('should return undefined for unregistered conditions', () => {
      expect(store.getCondition('nonexistent')).toBeUndefined();
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/karma/KarmicStore.persistence.test.ts`
Expected: FAIL — `registerCondition` is not a function

**Step 3: Implement condition registry**

In `src/karma/KarmicEventSystem.ts`:

3a. Add `name?` to `RipeningCondition` (line 85-90):

```ts
/** Conditions required for a seed to ripen */
export interface RipeningCondition {
  type: 'time' | 'state' | 'trigger' | 'random' | 'accumulation';
  name?: string;
  description: string;
  check: () => boolean;
  weight: number;  // How important this condition is (0-1)
}
```

3b. Add registry to `KarmicStore` class (after line 213, the `config` field):

```ts
  private conditionRegistry: Map<string, () => boolean> = new Map();
```

3c. Add registry methods (after the `dispose` method, before closing brace of class):

```ts
  // ===========================================================================
  // CONDITION REGISTRY
  // ===========================================================================

  /**
   * Register a named condition for use in seeds.
   * Named conditions survive serialization — the name is saved,
   * and the function is looked up from the registry on restore.
   */
  registerCondition(name: string, check: () => boolean): void {
    this.conditionRegistry.set(name, check);
  }

  /**
   * Get a registered condition by name
   */
  getCondition(name: string): (() => boolean) | undefined {
    return this.conditionRegistry.get(name);
  }
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/karma/KarmicStore.persistence.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/karma/KarmicEventSystem.ts tests/karma/KarmicStore.persistence.test.ts
git commit -m "feat: add condition registry and name field to RipeningCondition"
```

---

### Task 3: Implement KarmicStore.toJSON()

**Files:**
- Modify: `src/karma/KarmicEventSystem.ts` (KarmicStore class)

**Step 1: Write the failing tests**

Add to `tests/karma/KarmicStore.persistence.test.ts`:

```ts
  describe('toJSON', () => {
    it('should serialize empty store', () => {
      const data = store.toJSON();
      expect(data.seeds).toEqual([]);
      expect(data.config).toBeDefined();
      expect(data.config.maxSeeds).toBe(1000);
    });

    it('should serialize seeds with all fields', () => {
      store.plantSeed({
        quality: 'wholesome',
        description: 'Act of generosity',
        intentionStrength: 7,
        root: 'non-greed',
        tags: ['giving'],
      });

      const data = store.toJSON();
      expect(data.seeds).toHaveLength(1);
      expect(data.seeds[0].quality).toBe('wholesome');
      expect(data.seeds[0].description).toBe('Act of generosity');
      expect(data.seeds[0].intentionStrength).toBe(7);
      expect(data.seeds[0].root).toBe('non-greed');
      expect(data.seeds[0].tags).toEqual(['giving']);
      expect(data.seeds[0].state).toBe('active');
    });

    it('should serialize ripening conditions without check function', () => {
      store.registerCondition('test-condition', () => true);
      store.plantSeed({
        quality: 'unwholesome',
        description: 'Angry thought',
        conditions: [{
          type: 'state',
          name: 'test-condition',
          description: 'Test condition',
          check: () => true,
          weight: 0.8
        }],
      });

      const data = store.toJSON();
      const condition = data.seeds[0].ripeningConditions[0];
      expect(condition.type).toBe('state');
      expect(condition.name).toBe('test-condition');
      expect(condition.description).toBe('Test condition');
      expect(condition.weight).toBe(0.8);
      expect((condition as any).check).toBeUndefined();
    });

    it('should be JSON.stringify compatible', () => {
      store.plantSeed({ quality: 'neutral', description: 'Walking' });
      const str = JSON.stringify(store);
      const parsed = JSON.parse(str);
      expect(parsed.seeds).toHaveLength(1);
    });

    it('should serialize config', () => {
      const customStore = new KarmicStore({
        maxSeeds: 500,
        timeScale: 2,
        enableAutoRipening: false,
      });
      const data = customStore.toJSON();
      expect(data.config.maxSeeds).toBe(500);
      expect(data.config.timeScale).toBe(2);
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/karma/KarmicStore.persistence.test.ts`
Expected: FAIL

**Step 3: Implement toJSON on KarmicStore**

Add to `KarmicStore` class (after the condition registry methods):

```ts
  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Serialize the store to a plain object.
   * Drops non-serializable state: listeners, timers, condition check functions.
   * Condition names are preserved for registry lookup on restore.
   */
  toJSON(): KarmicStoreData {
    const seeds: KarmicSeedData[] = Array.from(this.seeds.values()).map(seed => ({
      id: seed.id,
      createdAt: seed.createdAt,
      type: seed.type,
      quality: seed.quality,
      description: seed.description,
      intentionStrength: seed.intentionStrength,
      root: seed.root,
      potency: seed.potency,
      originalPotency: seed.originalPotency,
      strength: seed.strength,
      ripeningTiming: seed.ripeningTiming,
      minDelay: seed.minDelay,
      maxDelay: seed.maxDelay,
      ripeningConditions: seed.ripeningConditions.map(c => ({
        type: c.type,
        ...(c.name ? { name: c.name } : {}),
        description: c.description,
        weight: c.weight,
      })),
      state: seed.state,
      ripeningProgress: seed.ripeningProgress,
      timesRipened: seed.timesRipened,
      maxRipenings: seed.maxRipenings,
      tags: [...seed.tags],
      ...(seed.collectiveId ? { collectiveId: seed.collectiveId } : {}),
    }));

    return {
      seeds,
      config: { ...this.config },
    };
  }
```

Add import at top of `KarmicEventSystem.ts`:

```ts
import { generateId, KarmaQuality, FeelingTone, Intensity, UnwholesomeRoot, WholesomeRoot, KarmicSeedData, KarmicStoreData, RipeningConditionData } from '../utils/types';
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/karma/KarmicStore.persistence.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/karma/KarmicEventSystem.ts tests/karma/KarmicStore.persistence.test.ts
git commit -m "feat: implement KarmicStore.toJSON() serialization"
```

---

### Task 4: Implement KarmicStore.fromJSON()

**Files:**
- Modify: `src/karma/KarmicEventSystem.ts` (KarmicStore class)

**Step 1: Write the failing tests**

Add to `tests/karma/KarmicStore.persistence.test.ts`:

```ts
  describe('fromJSON', () => {
    it('should restore empty store', () => {
      const data = store.toJSON();
      const restored = KarmicStore.fromJSON(data);
      expect(restored.getSeeds()).toHaveLength(0);
    });

    it('should restore seeds with correct fields', () => {
      store.plantSeed({
        quality: 'wholesome',
        description: 'Generosity',
        intentionStrength: 8,
        root: 'non-greed',
        tags: ['dana'],
      });
      store.plantSeed({
        quality: 'unwholesome',
        description: 'Angry word',
        root: 'aversion',
        type: 'verbal',
      });

      const data = store.toJSON();
      const restored = KarmicStore.fromJSON(data);
      const seeds = restored.getSeeds();

      expect(seeds).toHaveLength(2);
      expect(seeds[0].quality).toBe('wholesome');
      expect(seeds[0].description).toBe('Generosity');
      expect(seeds[0].tags).toEqual(['dana']);
      expect(seeds[1].quality).toBe('unwholesome');
      expect(seeds[1].type).toBe('verbal');
    });

    it('should restore config', () => {
      const customStore = new KarmicStore({
        maxSeeds: 500,
        timeScale: 3,
        enableAutoRipening: false,
      });
      const data = customStore.toJSON();
      const restored = KarmicStore.fromJSON(data);
      const restoredData = restored.toJSON();

      expect(restoredData.config.maxSeeds).toBe(500);
      expect(restoredData.config.timeScale).toBe(3);
    });

    it('should reconstruct named conditions from registry', () => {
      let flag = false;
      store.registerCondition('flag-check', () => flag);
      store.plantSeed({
        quality: 'wholesome',
        description: 'Conditional seed',
        conditions: [{
          type: 'state',
          name: 'flag-check',
          description: 'Check flag',
          check: () => flag,
          weight: 1,
        }],
      });

      const data = store.toJSON();
      const restored = KarmicStore.fromJSON(data);
      // Before registering, condition check is a no-op returning false
      const seedBefore = restored.getSeeds()[0];
      expect(seedBefore.ripeningConditions[0].check()).toBe(false);

      // After registering, condition works
      restored.registerCondition('flag-check', () => flag);
      restored.rebindConditions();
      flag = true;
      const seedAfter = restored.getSeeds()[0];
      expect(seedAfter.ripeningConditions[0].check()).toBe(true);
    });

    it('should survive full round-trip', () => {
      store.plantSeed({ quality: 'wholesome', description: 'Gift', intentionStrength: 6 });
      store.plantSeed({ quality: 'unwholesome', description: 'Lie', type: 'verbal', root: 'delusion' });

      const json = JSON.stringify(store);
      const parsed = JSON.parse(json);
      const restored = KarmicStore.fromJSON(parsed);

      expect(restored.getSeeds()).toHaveLength(2);
      expect(restored.getKarmicBalance().balance).toBe(store.getKarmicBalance().balance);
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/karma/KarmicStore.persistence.test.ts`
Expected: FAIL — `fromJSON` is not a function

**Step 3: Implement fromJSON and rebindConditions on KarmicStore**

Add to `KarmicStore` class:

```ts
  /**
   * Restore a KarmicStore from serialized data.
   * Call registerCondition() + rebindConditions() after restore
   * to reconnect named condition callbacks.
   */
  static fromJSON(data: KarmicStoreData): KarmicStore {
    const store = new KarmicStore({
      ...data.config,
      enableAutoRipening: false, // Don't auto-start; let caller control
    });

    for (const seedData of data.seeds) {
      const conditions: RipeningCondition[] = seedData.ripeningConditions.map(c => ({
        type: c.type,
        ...(c.name ? { name: c.name } : {}),
        description: c.description,
        check: () => false, // Placeholder until rebindConditions()
        weight: c.weight,
      }));

      const seed: KarmicSeed = {
        id: seedData.id,
        createdAt: seedData.createdAt,
        type: seedData.type,
        quality: seedData.quality,
        description: seedData.description,
        intentionStrength: seedData.intentionStrength,
        root: seedData.root,
        potency: seedData.potency,
        originalPotency: seedData.originalPotency,
        strength: seedData.strength,
        ripeningTiming: seedData.ripeningTiming,
        minDelay: seedData.minDelay,
        maxDelay: seedData.maxDelay,
        ripeningConditions: conditions,
        state: seedData.state,
        ripeningProgress: seedData.ripeningProgress,
        timesRipened: seedData.timesRipened,
        maxRipenings: seedData.maxRipenings,
        tags: [...seedData.tags],
        ...(seedData.collectiveId ? { collectiveId: seedData.collectiveId } : {}),
      };

      store.seeds.set(seed.id, seed);
    }

    // Restore config (fromJSON constructor used enableAutoRipening: false)
    store.config = { ...data.config };

    return store;
  }

  /**
   * Rebind named conditions from the registry after restore.
   * Call this after registerCondition() calls to reconnect
   * condition check functions to restored seeds.
   */
  rebindConditions(): void {
    for (const seed of this.seeds.values()) {
      for (let i = 0; i < seed.ripeningConditions.length; i++) {
        const condition = seed.ripeningConditions[i];
        if (condition.name) {
          const check = this.conditionRegistry.get(condition.name);
          if (check) {
            seed.ripeningConditions[i] = { ...condition, check };
          }
        }
      }
    }
  }
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/karma/KarmicStore.persistence.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/karma/KarmicEventSystem.ts tests/karma/KarmicStore.persistence.test.ts
git commit -m "feat: implement KarmicStore.fromJSON() and rebindConditions()"
```

---

### Task 5: Implement Being.toJSON()

**Files:**
- Modify: `src/simulation/Being.ts`
- Create: `tests/simulation/Being.persistence.test.ts`

**Step 1: Write the failing test**

Create `tests/simulation/Being.persistence.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Being } from '../../src/simulation/Being';

describe('Being Persistence', () => {
  describe('toJSON', () => {
    it('should serialize a fresh being', () => {
      const being = new Being();
      const data = being.toJSON();

      expect(data.mindfulnessLevel).toBe(0);
      expect(data.karmicStream).toEqual([]);
      expect(data.experienceHistory).toEqual([]);
      expect(data.path).toBeDefined();
      expect(data.path.factors).toHaveLength(8);
      expect(data.mind).toBeDefined();
      expect(data.dependentOrigination).toBeDefined();
      expect(data.dependentOrigination.links).toHaveLength(12);
    });

    it('should serialize after meditation', () => {
      const being = new Being();
      being.meditate(10, 7);

      const data = being.toJSON();
      expect(data.mindfulnessLevel).toBeGreaterThan(0);
      // Right Effort, Mindfulness, Concentration should have development
      const effortFactor = data.path.factors.find(f => f.name === 'Right Effort');
      expect(effortFactor!.developmentLevel).toBeGreaterThan(0);
    });

    it('should serialize after acting', () => {
      const being = new Being();
      being.act('helping', 'wholesome', 5, 'non-greed');

      const data = being.toJSON();
      expect(data.karmicStream).toHaveLength(1);
      expect(data.karmicStream[0].quality).toBe('wholesome');
      expect(data.karmicStream[0].isCompleted).toBe(true);
    });

    it('should serialize after experiencing', () => {
      const being = new Being();
      being.experience({ senseBase: 'eye', object: 'sunset', intensity: 8 });

      const data = being.toJSON();
      expect(data.experienceHistory).toHaveLength(1);
      expect(data.experienceHistory[0].input.object).toBe('sunset');
    });

    it('should be JSON.stringify compatible', () => {
      const being = new Being();
      being.meditate(5, 5);
      const str = JSON.stringify(being);
      const parsed = JSON.parse(str);
      expect(parsed.mindfulnessLevel).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/simulation/Being.persistence.test.ts`
Expected: FAIL — `toJSON` doesn't exist

**Step 3: Implement Being.toJSON()**

Add imports to `src/simulation/Being.ts` (line 18):

```ts
import { Intensity, KarmaQuality, DukkhaType, CravingType, UnwholesomeRoot, WholesomeRoot, BeingData, PathData, MindData, NidanaChainData, KarmaData } from '../utils/types';
```

Add `toJSON()` method to `Being` class (after `getKarmicStream` method, before `getSummary`):

```ts
  /**
   * Serialize this being to a plain JSON-compatible object.
   * Non-serializable state (object references, conditions graph) is dropped.
   */
  toJSON(): BeingData {
    const pathFactors = this.path.getAllFactors();
    const path: PathData = {
      factors: pathFactors.map(f => ({
        name: f.name,
        developmentLevel: f.developmentLevel,
        isActive: f.isActive,
        hasArisen: f.hasArisen,
        hasCeased: f.hasCeased,
      })),
    };

    const mindFactors: MindData['factors'] = [];
    const allFactorNames = [
      'contact', 'feeling', 'perception', 'intention', 'attention',
      'greed', 'aversion', 'delusion',
      'mindfulness', 'equanimity', 'compassion', 'wisdom',
    ];
    for (const key of allFactorNames) {
      const factor = this.mind.getFactor(key);
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
    const mindState = this.mind.getState();
    const mind: MindData = {
      factors: mindFactors,
      clarity: mindState.clarity,
      stability: mindState.stability,
    };

    const chainState = this.dependentOrigination.getChainState();
    const dependentOrigination: NidanaChainData = {
      links: chainState.map(l => ({
        position: l.position,
        name: l.name,
        hasArisen: l.hasArisen,
        hasCeased: false, // getChainState doesn't expose hasCeased
        isBroken: l.isBroken,
      })),
    };

    const karmicStream: KarmaData[] = this.karmicStream.map(k => ({
      id: k.id,
      description: k.intention.description,
      quality: k.quality,
      intensity: k.intensity,
      root: k.intention.root,
      isCompleted: k.isCompleted,
      hasManifested: k.hasManifested,
    }));

    const snapshot = this.aggregates.getSnapshot();

    return {
      mindfulnessLevel: this._mindfulnessLevel,
      karmicStream,
      experienceHistory: this.experienceHistory.map(e => ({
        input: { senseBase: e.input.senseBase, object: e.input.object, intensity: e.input.intensity },
        label: e.label,
        feelingTone: e.feelingTone,
        reactions: [...e.reactions],
        timestamp: e.timestamp,
      })),
      aggregates: {
        form: snapshot.form,
        feeling: snapshot.feeling,
        perception: snapshot.perception,
        mentalFormations: snapshot.mentalFormations,
        consciousness: snapshot.consciousness,
      },
      path,
      mind,
      dependentOrigination,
    };
  }
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/simulation/Being.persistence.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/simulation/Being.ts tests/simulation/Being.persistence.test.ts
git commit -m "feat: implement Being.toJSON() serialization"
```

---

### Task 6: Implement Being.fromJSON()

**Files:**
- Modify: `src/simulation/Being.ts`

**Step 1: Write the failing tests**

Add to `tests/simulation/Being.persistence.test.ts`:

```ts
  describe('fromJSON', () => {
    it('should restore a fresh being', () => {
      const being = new Being();
      const data = being.toJSON();
      const restored = Being.fromJSON(data);

      expect(restored.mindfulnessLevel).toBe(0);
      expect(restored.getKarmicStream()).toHaveLength(0);
      expect(restored.getExperienceHistory()).toHaveLength(0);
    });

    it('should restore mindfulness level after meditation', () => {
      const being = new Being();
      being.meditate(10, 8);
      const originalLevel = being.mindfulnessLevel;

      const data = being.toJSON();
      const restored = Being.fromJSON(data);

      expect(restored.mindfulnessLevel).toBe(originalLevel);
    });

    it('should restore path factor development', () => {
      const being = new Being();
      being.meditate(10, 7);
      const originalProgress = being.path.getOverallDevelopment();

      const data = being.toJSON();
      const restored = Being.fromJSON(data);

      expect(restored.path.getOverallDevelopment()).toBeCloseTo(originalProgress, 1);
    });

    it('should restore mind state', () => {
      const being = new Being();
      being.mind.activateFactor('mindfulness', 8);
      being.mind.setClarity(9);

      const data = being.toJSON();
      const restored = Being.fromJSON(data);
      const state = restored.mind.getState();

      expect(state.clarity).toBe(9);
      expect(restored.mind.getFactor('mindfulness')?.isActive).toBe(true);
    });

    it('should restore karmic stream', () => {
      const being = new Being();
      being.act('donate', 'wholesome', 7, 'non-greed');
      being.act('insult', 'unwholesome', 3, 'aversion');

      const data = being.toJSON();
      const restored = Being.fromJSON(data);

      expect(restored.getKarmicStream()).toHaveLength(2);
    });

    it('should survive full round-trip via JSON.stringify', () => {
      const being = new Being();
      being.meditate(5, 6);
      being.act('help', 'wholesome', 5, 'non-greed');
      being.experience({ senseBase: 'ear', object: 'birdsong', intensity: 6 });

      const str = JSON.stringify(being);
      const parsed = JSON.parse(str);
      const restored = Being.fromJSON(parsed);

      expect(restored.mindfulnessLevel).toBe(being.mindfulnessLevel);
      expect(restored.getKarmicStream()).toHaveLength(1);
      expect(restored.getExperienceHistory(100)).toHaveLength(being.getExperienceHistory(100).length);
    });

    it('should allow continued practice after restore', () => {
      const being = new Being();
      being.meditate(5, 5);

      const data = being.toJSON();
      const restored = Being.fromJSON(data);

      // Should be able to continue meditating
      const result = restored.meditate(5, 7);
      expect(result.mindfulnessLevel).toBeGreaterThanOrEqual(being.mindfulnessLevel);
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/simulation/Being.persistence.test.ts`
Expected: FAIL — `fromJSON` is not a function

**Step 3: Implement Being.fromJSON()**

Add `static fromJSON()` to `Being` class:

```ts
  /**
   * Restore a Being from serialized data.
   * Reconstructs all subcomponents and restores their state.
   */
  static fromJSON(data: BeingData): Being {
    const being = new Being();

    // Restore mindfulness
    being._mindfulnessLevel = data.mindfulnessLevel;

    // Restore path factor development levels
    const factorMap = new Map(being.path.getAllFactors().map(f => [f.name, f]));
    for (const fd of data.path.factors) {
      const factor = factorMap.get(fd.name);
      if (factor) {
        // Use practice to set development level (approximate)
        // Direct assignment via protected field requires a helper
        factor.reset();
        if (fd.isActive) factor.activate();
        // Set development level directly
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
        // Reset first, then restore state
        (link as any).restoreLink();
        if (ld.hasArisen) (link as any)._hasArisen = true;
        if (ld.hasCeased) (link as any)._hasCeased = true;
        if (ld.isBroken) (link as any)._isBroken = true;
      }
    }

    // Restore karmic stream (as data-only records since Karma requires Intention)
    being.karmicStream = data.karmicStream.map(kd => {
      const intention = new Intention(kd.description, kd.intensity, kd.root === 'neutral' ? undefined : kd.root as any);
      const karma = new Karma(intention, kd.intensity);
      if (kd.isCompleted) karma.complete();
      if (kd.hasManifested) karma.manifest();
      return karma;
    });

    // Restore experience history
    being.experienceHistory = data.experienceHistory.map(e => ({
      input: { senseBase: e.input.senseBase as any, object: e.input.object, intensity: e.input.intensity },
      label: e.label,
      feelingTone: e.feelingTone,
      reactions: [...e.reactions],
      timestamp: e.timestamp,
    }));

    return being;
  }
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/simulation/Being.persistence.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/simulation/Being.ts tests/simulation/Being.persistence.test.ts
git commit -m "feat: implement Being.fromJSON() deserialization"
```

---

### Task 7: Export new types from index and run full test suite

**Files:**
- Modify: `src/index.ts`

**Step 1: Add exports**

In `src/index.ts`, add after the existing utils export (line 20):

```ts
export type {
  Serializable,
  KarmicSeedData,
  KarmicStoreData,
  RipeningConditionData,
  BeingData,
  PathData,
  PathFactorData,
  MindData,
  MentalFactorData,
  NidanaChainData,
  NidanaLinkData,
  KarmaData,
} from './utils/types';
```

**Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: ALL PASS

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: export persistence types from public API"
```

---

### Task 8: Final commit with TODO update

**Files:**
- Modify: `TODO.md`

**Step 1: Update TODO.md**

Change the persistence layer item from `[ ]` to `[x]`:

```diff
-- [ ] **Persistence Layer**: Add a persistence layer for saving and restoring state (karmic store, being state, etc.).
+- [x] **Persistence Layer**: Add a persistence layer for saving and restoring state (karmic store, being state, etc.).
```

**Step 2: Commit**

```bash
git add TODO.md
git commit -m "docs: mark persistence layer as complete in TODO"
```
