# Design: Meditation Timer

**Date:** 2026-02-17
**Status:** Approved

## Summary

Add a `MeditationTimer` class in a new `src/meditation/` module that tracks real-time meditation sessions. Users call `checkIn()` to record mindful moments; gaps between check-ins are distraction periods. An injectable `Clock` interface defaults to wall-clock time but supports manual clocks for testing and simulation. Supports optional interval bells via callback for CLI integration.

## Location

`src/meditation/MeditationTimer.ts` — new standalone module, no dependency on Being, Mind, or EightfoldPath.

## Types

Added to `src/utils/types.ts`:

```ts
interface Clock {
  now(): number;  // milliseconds since epoch
}

interface MeditationTimerOptions {
  duration: number;         // seconds
  intervalBell?: number;    // seconds between bells
  onBell?: () => void;      // callback when bell fires
  clock?: Clock;            // injectable, default: Date.now
}

interface MeditationSession {
  duration: number;
  checkIns: number[];       // relative to start, in seconds
  mindfulMoments: number;
  distractionPeriods: { start: number; end: number; duration: number }[];
  longestDistraction: number;
  mindfulnessRatio: number;
  quality: 'scattered' | 'intermittent' | 'sustained' | 'absorbed';
}
```

## Class API

```ts
class MeditationTimer {
  constructor(options: MeditationTimerOptions)
  start(): void
  checkIn(): void
  stop(): MeditationSession
  isRunning(): boolean
  getElapsedSeconds(): number
  getRemainingSeconds(): number
}
```

## Quality Thresholds

Derived from mindfulnessRatio (checkIns per expected interval, where expected = 1 per 30s):

- `< 0.25` → `'scattered'`
- `< 0.5` → `'intermittent'`
- `< 0.75` → `'sustained'`
- `>= 0.75` → `'absorbed'`

## Wiring

- Exported from `src/meditation/index.ts`
- Added to `src/index.ts` barrel export
- English alias `SittingTimer` in `src/utils/aliases.ts`
- Tests in `tests/meditation/MeditationTimer.test.ts` using manual clock
