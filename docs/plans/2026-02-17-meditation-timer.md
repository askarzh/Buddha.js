# MeditationTimer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `MeditationTimer` class with injectable clock that tracks real-time meditation sessions, recording mindful check-ins vs distraction periods, with optional interval bell callbacks for CLI integration.

**Architecture:** New `src/meditation/` module with a standalone `MeditationTimer` class. Uses a `Clock` interface (default: `Date.now`) for time — tests inject a manual clock for synchronous testing. Types in `src/utils/types.ts`, exported from barrel files, aliased as `SittingTimer`.

**Tech Stack:** TypeScript (strict), Vitest for tests. Run tests with `npx vitest run`.

---

### Task 1: Add types to `src/utils/types.ts`

**Files:**
- Modify: `src/utils/types.ts`

**Step 1: Add types after the `CessationStep` interface**

Open `src/utils/types.ts`. After the `CessationStep` interface (around line 73), add:

```ts
// =============================================================================
// MEDITATION TIMER TYPES
// =============================================================================

/** Injectable clock interface for MeditationTimer */
export interface Clock {
  /** Returns current time in milliseconds since epoch */
  now(): number;
}

/** Options for creating a MeditationTimer */
export interface MeditationTimerOptions {
  /** Duration of the session in seconds */
  duration: number;
  /** Optional: seconds between interval bells */
  intervalBell?: number;
  /** Optional: callback when interval bell fires */
  onBell?: () => void;
  /** Optional: injectable clock (default: Date.now) */
  clock?: Clock;
}

/** A period of distraction (gap between check-ins) */
export interface DistractionPeriod {
  /** Seconds from session start when distraction began */
  start: number;
  /** Seconds from session start when distraction ended */
  end: number;
  /** Duration of distraction in seconds */
  duration: number;
}

/** Quality of meditation session */
export type MeditationQuality = 'scattered' | 'intermittent' | 'sustained' | 'absorbed';

/** Result of a completed meditation session */
export interface MeditationSession {
  /** Actual duration of the session in seconds */
  duration: number;
  /** Timestamps of each check-in (seconds from start) */
  checkIns: number[];
  /** Number of mindful moments (check-ins) */
  mindfulMoments: number;
  /** Gaps between check-ins exceeding the threshold */
  distractionPeriods: DistractionPeriod[];
  /** Longest gap without checking in (seconds) */
  longestDistraction: number;
  /** Ratio of mindful check-ins to expected intervals (0-1) */
  mindfulnessRatio: number;
  /** Qualitative assessment of the session */
  quality: MeditationQuality;
}
```

**Step 2: Run typecheck**

```bash
npm run typecheck
```
Expected: no errors.

**Step 3: Commit**

```bash
git add src/utils/types.ts
git commit -m "feat: add MeditationTimer types (Clock, MeditationSession, etc.)"
```

---

### Task 2: Write failing tests for `MeditationTimer`

**Files:**
- Create: `tests/meditation/MeditationTimer.test.ts`

**Step 1: Create the test file with a manual clock helper and all tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MeditationTimer } from '../../src/meditation/MeditationTimer';
import { Clock } from '../../src/utils/types';

/** Manual clock for deterministic testing */
function createManualClock(startMs = 0): Clock & { advance(seconds: number): void } {
  let current = startMs;
  return {
    now() { return current; },
    advance(seconds: number) { current += seconds * 1000; },
  };
}

describe('MeditationTimer', () => {
  let clock: ReturnType<typeof createManualClock>;
  let timer: MeditationTimer;

  beforeEach(() => {
    clock = createManualClock();
    timer = new MeditationTimer({ duration: 300, clock }); // 5 min session
  });

  describe('initial state', () => {
    it('should not be running before start', () => {
      expect(timer.isRunning()).toBe(false);
    });

    it('should report 0 elapsed seconds before start', () => {
      expect(timer.getElapsedSeconds()).toBe(0);
    });

    it('should report full duration as remaining before start', () => {
      expect(timer.getRemainingSeconds()).toBe(300);
    });
  });

  describe('start()', () => {
    it('should set running to true', () => {
      timer.start();
      expect(timer.isRunning()).toBe(true);
    });

    it('should throw if already running', () => {
      timer.start();
      expect(() => timer.start()).toThrow();
    });
  });

  describe('elapsed and remaining time', () => {
    it('should track elapsed seconds', () => {
      timer.start();
      clock.advance(60);
      expect(timer.getElapsedSeconds()).toBe(60);
    });

    it('should track remaining seconds', () => {
      timer.start();
      clock.advance(60);
      expect(timer.getRemainingSeconds()).toBe(240);
    });

    it('should not go below 0 remaining', () => {
      timer.start();
      clock.advance(999);
      expect(timer.getRemainingSeconds()).toBe(0);
    });
  });

  describe('checkIn()', () => {
    it('should throw if timer not running', () => {
      expect(() => timer.checkIn()).toThrow();
    });

    it('should record check-in times relative to start', () => {
      timer.start();
      clock.advance(30);
      timer.checkIn();
      clock.advance(60);
      timer.checkIn();

      const session = timer.stop();
      expect(session.checkIns).toEqual([30, 90]);
    });
  });

  describe('stop()', () => {
    it('should throw if timer not running', () => {
      expect(() => timer.stop()).toThrow();
    });

    it('should set running to false', () => {
      timer.start();
      timer.stop();
      expect(timer.isRunning()).toBe(false);
    });

    it('should return a MeditationSession', () => {
      timer.start();
      clock.advance(120);
      timer.checkIn();
      clock.advance(180);
      const session = timer.stop();

      expect(session.duration).toBe(300);
      expect(session.mindfulMoments).toBe(1);
      expect(session.checkIns).toEqual([120]);
    });
  });

  describe('session analysis — distraction periods', () => {
    it('should identify gaps between check-ins as distraction periods', () => {
      timer.start();
      clock.advance(30);
      timer.checkIn();
      // 90 second gap (distraction)
      clock.advance(90);
      timer.checkIn();
      clock.advance(30);
      timer.checkIn();
      clock.advance(150);
      const session = timer.stop();

      // Gap from 30s to 120s = 90s gap
      // Gap from 150s to 300s (end) = 150s gap
      expect(session.distractionPeriods.length).toBeGreaterThanOrEqual(1);
      expect(session.longestDistraction).toBeGreaterThan(0);
    });

    it('should report 0 longest distraction when checking in frequently', () => {
      timer.start();
      for (let i = 0; i < 10; i++) {
        clock.advance(25);
        timer.checkIn();
      }
      clock.advance(50);
      const session = timer.stop();

      // All gaps <= 30s, so no distraction periods above threshold
      // longestDistraction is the longest actual gap
      expect(session.longestDistraction).toBeLessThanOrEqual(50);
    });
  });

  describe('session analysis — mindfulness ratio and quality', () => {
    it('should return scattered quality when no check-ins', () => {
      timer.start();
      clock.advance(300);
      const session = timer.stop();

      expect(session.mindfulnessRatio).toBe(0);
      expect(session.quality).toBe('scattered');
    });

    it('should return absorbed quality with frequent check-ins', () => {
      timer.start();
      // Check in every 20 seconds for 5 minutes = 15 check-ins
      for (let i = 0; i < 15; i++) {
        clock.advance(20);
        timer.checkIn();
      }
      const session = timer.stop();

      expect(session.mindfulnessRatio).toBeGreaterThanOrEqual(0.75);
      expect(session.quality).toBe('absorbed');
    });

    it('should return intermittent quality with sparse check-ins', () => {
      timer.start();
      // Check in 3 times in 5 minutes (expected ~10)
      clock.advance(60);
      timer.checkIn();
      clock.advance(120);
      timer.checkIn();
      clock.advance(100);
      timer.checkIn();
      clock.advance(20);
      const session = timer.stop();

      expect(session.quality).toBe('intermittent');
    });
  });

  describe('interval bell', () => {
    it('should call onBell at each interval when checking in', () => {
      let bellCount = 0;
      const bellTimer = new MeditationTimer({
        duration: 300,
        intervalBell: 60,
        onBell: () => { bellCount++; },
        clock,
      });

      bellTimer.start();
      clock.advance(60);
      bellTimer.checkIn(); // triggers bell check at 60s
      clock.advance(60);
      bellTimer.checkIn(); // triggers bell check at 120s
      bellTimer.stop();

      expect(bellCount).toBe(2);
    });

    it('should not call onBell before interval elapses', () => {
      let bellCount = 0;
      const bellTimer = new MeditationTimer({
        duration: 300,
        intervalBell: 60,
        onBell: () => { bellCount++; },
        clock,
      });

      bellTimer.start();
      clock.advance(30);
      bellTimer.checkIn();
      bellTimer.stop();

      expect(bellCount).toBe(0);
    });
  });

  describe('early stop', () => {
    it('should use actual elapsed time as duration when stopped early', () => {
      timer.start();
      clock.advance(120);
      const session = timer.stop();

      expect(session.duration).toBe(120);
    });
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/meditation/MeditationTimer.test.ts
```
Expected: FAIL — "Cannot find module '../../src/meditation/MeditationTimer'"

**Step 3: Commit**

```bash
git add tests/meditation/MeditationTimer.test.ts
git commit -m "test: add failing tests for MeditationTimer"
```

---

### Task 3: Implement `MeditationTimer` class

**Files:**
- Create: `src/meditation/MeditationTimer.ts`

**Step 1: Create the implementation**

```ts
/**
 * MeditationTimer — Real-time Meditation Session Tracker
 *
 * Tracks meditation sessions by recording "mindful moments" (check-ins)
 * versus periods of distraction. Uses an injectable Clock interface
 * for testability — defaults to wall-clock time (Date.now).
 *
 * Based on the practice of sati (mindfulness): the quality of meditation
 * is measured not by absence of distraction, but by how quickly one
 * recognizes distraction and returns to presence.
 */

import {
  Clock,
  MeditationTimerOptions,
  MeditationSession,
  MeditationQuality,
  DistractionPeriod,
} from '../utils/types';

/** Default clock using Date.now */
const DEFAULT_CLOCK: Clock = { now: () => Date.now() };

/** Expected check-in interval in seconds (used for mindfulness ratio) */
const EXPECTED_INTERVAL = 30;

/** Threshold in seconds — gaps longer than this are distraction periods */
const DISTRACTION_THRESHOLD = 30;

export class MeditationTimer {
  private readonly duration: number;
  private readonly intervalBell: number | undefined;
  private readonly onBell: (() => void) | undefined;
  private readonly clock: Clock;

  private startTime: number | null = null;
  private checkInTimes: number[] = [];
  private running = false;
  private lastBellTime = 0;

  constructor(options: MeditationTimerOptions) {
    if (options.duration <= 0) {
      throw new Error('Duration must be positive.');
    }
    this.duration = options.duration;
    this.intervalBell = options.intervalBell;
    this.onBell = options.onBell;
    this.clock = options.clock ?? DEFAULT_CLOCK;
  }

  /**
   * Begin the meditation session.
   */
  start(): void {
    if (this.running) {
      throw new Error('Timer is already running.');
    }
    this.startTime = this.clock.now();
    this.checkInTimes = [];
    this.running = true;
    this.lastBellTime = 0;
  }

  /**
   * Record a mindful moment — "I am present."
   */
  checkIn(): void {
    if (!this.running || this.startTime === null) {
      throw new Error('Timer is not running. Call start() first.');
    }
    const elapsed = this.getElapsedSeconds();
    this.checkInTimes.push(elapsed);
    this.checkIntervalBell(elapsed);
  }

  /**
   * End the session and return the analysis.
   */
  stop(): MeditationSession {
    if (!this.running || this.startTime === null) {
      throw new Error('Timer is not running.');
    }

    const elapsed = this.getElapsedSeconds();
    this.running = false;

    const actualDuration = Math.min(elapsed, this.duration);
    const distractionPeriods = this.computeDistractionPeriods(actualDuration);
    const longestDistraction = this.computeLongestGap(actualDuration);
    const expectedCheckIns = Math.floor(actualDuration / EXPECTED_INTERVAL);
    const mindfulnessRatio = expectedCheckIns > 0
      ? Math.min(1, this.checkInTimes.length / expectedCheckIns)
      : 0;

    return {
      duration: actualDuration,
      checkIns: [...this.checkInTimes],
      mindfulMoments: this.checkInTimes.length,
      distractionPeriods,
      longestDistraction,
      mindfulnessRatio,
      quality: this.assessQuality(mindfulnessRatio),
    };
  }

  /**
   * Is the timer currently running?
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Seconds elapsed since start. Returns 0 if not started.
   */
  getElapsedSeconds(): number {
    if (this.startTime === null) return 0;
    return Math.round((this.clock.now() - this.startTime) / 1000);
  }

  /**
   * Seconds remaining in the session. Returns full duration if not started.
   */
  getRemainingSeconds(): number {
    return Math.max(0, this.duration - this.getElapsedSeconds());
  }

  private checkIntervalBell(elapsed: number): void {
    if (!this.intervalBell || !this.onBell) return;
    while (this.lastBellTime + this.intervalBell <= elapsed) {
      this.lastBellTime += this.intervalBell;
      this.onBell();
    }
  }

  private computeDistractionPeriods(totalDuration: number): DistractionPeriod[] {
    const periods: DistractionPeriod[] = [];
    const points = [0, ...this.checkInTimes, totalDuration];

    for (let i = 0; i < points.length - 1; i++) {
      const gap = points[i + 1] - points[i];
      if (gap > DISTRACTION_THRESHOLD) {
        periods.push({
          start: points[i],
          end: points[i + 1],
          duration: gap,
        });
      }
    }

    return periods;
  }

  private computeLongestGap(totalDuration: number): number {
    const points = [0, ...this.checkInTimes, totalDuration];
    let longest = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const gap = points[i + 1] - points[i];
      if (gap > longest) longest = gap;
    }

    return longest;
  }

  private assessQuality(ratio: number): MeditationQuality {
    if (ratio >= 0.75) return 'absorbed';
    if (ratio >= 0.5) return 'sustained';
    if (ratio >= 0.25) return 'intermittent';
    return 'scattered';
  }
}
```

**Step 2: Run tests**

```bash
npx vitest run tests/meditation/MeditationTimer.test.ts
```
Expected: all tests PASS.

**Step 3: Run full typecheck**

```bash
npm run typecheck
```
Expected: no errors.

**Step 4: Commit**

```bash
git add src/meditation/MeditationTimer.ts
git commit -m "feat: implement MeditationTimer with injectable clock"
```

---

### Task 4: Wire up exports and alias

**Files:**
- Create: `src/meditation/index.ts`
- Modify: `src/index.ts`
- Modify: `src/utils/aliases.ts`

**Step 1: Create module index**

Create `src/meditation/index.ts`:

```ts
export * from './MeditationTimer';
```

**Step 2: Add to barrel export**

In `src/index.ts`, add after the Mind exports:

```ts
// Meditation
export * from './meditation';
```

**Step 3: Add English alias**

In `src/utils/aliases.ts`, add the import with the other imports:

```ts
import { MeditationTimer } from '../meditation/MeditationTimer';
```

Then add the alias after the `QuickCessation` line:

```ts
export const SittingTimer = MeditationTimer;
```

**Step 4: Run full test suite and typecheck**

```bash
npm run typecheck && npx vitest run
```
Expected: all tests pass, no type errors.

**Step 5: Commit**

```bash
git add src/meditation/index.ts src/index.ts src/utils/aliases.ts
git commit -m "feat: export MeditationTimer and add SittingTimer alias"
```

---

### Task 5: Add README section, update CLAUDE.md, mark TODO complete

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `TODO.md`

**Step 1: Add MeditationTimer section to README**

In `README.md`, find the `## Mind and Mental Factors` section (around line 548). Add a new section before it:

```markdown
## Meditation Timer

Track real-time meditation sessions with mindful check-ins vs distraction periods. Uses an injectable `Clock` interface — defaults to wall-clock time, accepts a manual clock for testing.

```typescript
import { MeditationTimer } from 'buddha-js';
// or: import { SittingTimer } from 'buddha-js';

const timer = new MeditationTimer({ duration: 600 }); // 10 minutes
timer.start();

// User checks in when mindful (e.g., on keypress in CLI)
timer.checkIn();

// ... time passes ...
timer.checkIn();

const session = timer.stop();
session.mindfulMoments;     // 2
session.longestDistraction;  // seconds
session.quality;            // 'scattered' | 'intermittent' | 'sustained' | 'absorbed'
session.mindfulnessRatio;   // 0-1
session.distractionPeriods; // [{ start, end, duration }]

// Optional interval bell for CLI
const cliTimer = new MeditationTimer({
  duration: 600,
  intervalBell: 120,          // bell every 2 min
  onBell: () => process.stdout.write('\x07'),  // terminal bell
});
```

---
```

**Step 2: Update CLAUDE.md module table**

In `CLAUDE.md`, add the meditation module to the Module Structure table:

```
| `meditation/` | `MeditationTimer` | Real-time meditation session tracking with injectable clock |
```

**Step 3: Check the TODO box**

In `TODO.md`, change:

```
- [ ] **Meditation Timer**: Implement a real-time meditation timer that tracks "mindful moments" (checking in) versus distraction.
```

to:

```
- [x] **Meditation Timer**: Implement a real-time meditation timer that tracks "mindful moments" (checking in) versus distraction.
```

**Step 4: Run full suite**

```bash
npx vitest run
```
Expected: all tests pass.

**Step 5: Commit**

```bash
git add README.md CLAUDE.md TODO.md
git commit -m "docs: add MeditationTimer to README/CLAUDE.md and mark TODO complete"
```
