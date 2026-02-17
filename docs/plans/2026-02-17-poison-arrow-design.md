# Design: "Poison Arrow" Simulation — PoisonArrow Class

**Date:** 2026-02-17
**Status:** Approved

## Summary

Add a `PoisonArrow` class to `src/simulation/` that provides a simplified, step-by-step cessation path. Based on the Cula-Malunkyovada Sutta (MN 63): a man struck by a poisoned arrow should remove it immediately rather than asking who shot it. This class embodies that pragmatism — input suffering, step through four stages to cessation, no deep configuration required.

## Location

`src/simulation/PoisonArrow.ts` — alongside `Being.ts`. Does NOT extend `Phenomenon` (this is a simulation utility, not a conditioned phenomenon).

## Types

Added to `src/utils/types.ts`:

```ts
type CessationStage = 'recognize' | 'investigate' | 'release' | 'practice';

interface CessationStep {
  stage: CessationStage;
  truth: 'dukkha' | 'samudaya' | 'nirodha' | 'magga';
  insight: string;
  guidance: string;
}
```

## Class API

```ts
class PoisonArrow {
  constructor(suffering: string)

  step(): CessationStep                    // advance to next stage, throws if complete
  getCurrentStage(): CessationStage | null // null before first step
  isComplete(): boolean                    // true after all 4 steps
  getSteps(): readonly CessationStep[]     // history of steps taken
  getSummary(): string                     // text summary of the cessation path
}
```

## Internal Flow

1. `step()` 1 — **recognize** (dukkha): acknowledge the suffering as described
2. `step()` 2 — **investigate** (samudaya): identify craving/resistance as the cause
3. `step()` 3 — **release** (nirodha): cessation is possible by letting go
4. `step()` 4 — **practice** (magga): concrete guidance for the path forward
5. Further `step()` calls throw — the arrow is already removed

## Wiring

- Exported from `src/simulation/index.ts`
- English alias `QuickCessation` added to `src/utils/aliases.ts`
- Tests in `tests/simulation/PoisonArrow.test.ts`
