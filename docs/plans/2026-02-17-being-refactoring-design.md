# Design: Being.ts Refactoring — Extract Serialization

**Date:** 2026-02-17
**Status:** Approved

## Summary

Extract the serialization logic (~175 lines, 35% of file) from `Being.ts` into a standalone `BeingSerializer` module with pure functions. Being retains its public API (`toJSON`/`fromJSON`) but delegates to the serializer. This separates behavioral concerns from persistence concerns.

## What Changes

### New file: `src/simulation/BeingSerializer.ts`

Two pure functions:

```ts
function serializeBeing(being: Being): BeingData
function deserializeBeing(data: BeingData): Being
```

Contains all serialization/deserialization logic currently in `Being.toJSON()` and `Being.fromJSON()`.

### Modified file: `src/simulation/Being.ts`

- `toJSON()` becomes a one-liner delegating to `serializeBeing(this)`
- `fromJSON()` becomes a one-liner delegating to `deserializeBeing(data)`
- Being retains `Serializable<BeingData>` interface — public API unchanged
- Being exposes `_restoreState()` method for deserialization access:

```ts
/** @internal Used by BeingSerializer for deserialization */
_restoreState(state: {
  mindfulnessLevel: Intensity;
  karmicStream: Karma[];
  experienceHistory: ProcessedExperience[];
}): void
```

### New file: `tests/simulation/BeingSerializer.test.ts`

Tests the serializer functions directly. Existing `Being.persistence.test.ts` stays as integration tests.

## What Doesn't Change

- Public API of `Being` — `toJSON()`, `fromJSON()`, all other methods
- All existing tests pass unchanged
- `BeingData`, `PathData`, `MindData`, etc. types stay in `src/utils/types.ts`
- `BeingSerializer` is NOT exported publicly — internal implementation detail
- No changes to aliases, README, or CLAUDE.md (internal refactor)
