# Persistence Layer Design

**Date:** 2026-02-17
**Status:** Approved
**Scope:** `Being.toJSON()/fromJSON()` and `KarmicStore.toJSON()/fromJSON()`

## Goal

Expose serialization primitives so library consumers can save/restore Being and KarmicStore state using their own storage (localStorage, file, DB).

## Approach

`Serializable<TData>` interface with `toJSON()` instance method and `static fromJSON()` on `Being` and `KarmicStore`. Returns plain typed objects compatible with `JSON.stringify`/`JSON.parse`.

## Non-Serializable State Strategy

| State | Strategy |
|-------|----------|
| `KarmicStore.listeners` | Dropped. Consumers re-register after restore. |
| `KarmicStore.ripeningTimers` | Dropped. Auto-ripening restarts on construction. |
| `KarmicStore.checkInterval` | Dropped. Restarts when `startAutoRipening()` called. |
| `RipeningCondition.check` | Named condition registry. Serialize name, look up function on restore. |
| `Phenomenon.conditions` (object refs) | Reconstructed from parent container's graph. |

## Condition Registry

`KarmicStore` gets a `conditionRegistry: Map<string, () => boolean>` and a `registerCondition(name, fn)` method. `RipeningCondition` gains an optional `name?: string` field.

On serialize: save `{ type, name, description, weight }` — drop `check`.
On restore: look up `name` in registry to reconstruct `check`. Conditions without a name (pure `time`/`random`) are rebuilt from seed timing data.

## Data Shape Types

```ts
interface Serializable<TData> {
  toJSON(): TData;
}

interface KarmicStoreData {
  seeds: KarmicSeedData[];
  config: KarmicStoreConfig;
}

interface KarmicSeedData {
  // All KarmicSeed fields except ripeningConditions.check
  // Conditions stored as: { type, name?, description, weight }
}

interface BeingData {
  mindfulnessLevel: Intensity;
  karmicStream: KarmaData[];
  experienceHistory: ProcessedExperience[];
  aggregates: AggregatesSnapshot;
  path: PathData;
  mind: MindData;
  dependentOrigination: NidanaChainData;
}
```

## Public API

```ts
// KarmicStore
const json = store.toJSON();
const restored = KarmicStore.fromJSON(json);
restored.registerCondition('is-mindful', fn);

// Being
const json = being.toJSON();
const restored = Being.fromJSON(json);

// JSON.stringify compatible (toJSON called automatically)
const str = JSON.stringify(being);
const data = JSON.parse(str);
const restored = Being.fromJSON(data);
```

## Files Changed

| File | Change |
|------|--------|
| `src/utils/types.ts` | Add `Serializable<T>` interface + data shape types |
| `src/karma/KarmicEventSystem.ts` | Add `name?` to `RipeningCondition`, condition registry, `toJSON()`/`fromJSON()` |
| `src/simulation/Being.ts` | Implement `toJSON()`/`fromJSON()` |
| `src/index.ts` | Export new types |
| `tests/karma/KarmicStore.persistence.test.ts` | KarmicStore serialization tests |
| `tests/simulation/Being.persistence.test.ts` | Being serialization tests |

## Philosophical Grounding

The alaya-vijnana (storehouse consciousness) is described in Yogacara sources as a "universal database" containing seeds as "zipped files" that can be "unzipped" when conditions arise. `toJSON()` maps to compressing seeds into latent form; `fromJSON()` maps to reconstituting the causal continuum from stored potentials. The condition registry reflects how seeds require external conditions to ripen — conditions are not intrinsic to the seed data but arise from the environment.
