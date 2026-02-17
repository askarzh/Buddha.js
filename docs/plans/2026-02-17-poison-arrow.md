# PoisonArrow (Simplified Cessation Simulation) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `PoisonArrow` class that provides a 4-step cessation path (recognize → investigate → release → practice) mapping 1:1 to the Four Noble Truths, with no deep configuration required.

**Architecture:** Standalone class in `src/simulation/PoisonArrow.ts` (does NOT extend `Phenomenon`). Takes a suffering string in the constructor, advances through 4 stages via `step()`. Two new types (`CessationStage`, `CessationStep`) in `src/utils/types.ts`. Exported from the simulation index and aliased as `QuickCessation`.

**Tech Stack:** TypeScript (strict), Vitest for tests. Run tests with `npx vitest run`.

---

### Task 1: Add types to `src/utils/types.ts`

**Files:**
- Modify: `src/utils/types.ts`

**Step 1: Add the two new types after the `ArrowAnalysis` interface**

Open `src/utils/types.ts`. After the `ArrowAnalysis` interface (around line 58), add:

```ts
/** Stage in the poison arrow cessation path */
export type CessationStage = 'recognize' | 'investigate' | 'release' | 'practice';

/** Result of a single cessation step */
export interface CessationStep {
  /** Which stage this step represents */
  stage: CessationStage;
  /** Which Noble Truth this stage corresponds to */
  truth: 'dukkha' | 'samudaya' | 'nirodha' | 'magga';
  /** Insight gained at this stage */
  insight: string;
  /** Practical guidance for this stage */
  guidance: string;
}
```

**Step 2: Run typecheck to confirm no errors**

```bash
npm run typecheck
```
Expected: no errors.

**Step 3: Commit**

```bash
git add src/utils/types.ts
git commit -m "feat: add CessationStage and CessationStep types"
```

---

### Task 2: Write failing tests for `PoisonArrow`

**Files:**
- Create: `tests/simulation/PoisonArrow.test.ts`

**Step 1: Create the test file**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PoisonArrow } from '../../src/simulation/PoisonArrow';

describe('PoisonArrow', () => {
  let sim: PoisonArrow;

  beforeEach(() => {
    sim = new PoisonArrow('anxiety about the future');
  });

  describe('initial state', () => {
    it('should not be complete initially', () => {
      expect(sim.isComplete()).toBe(false);
    });

    it('should have no current stage before first step', () => {
      expect(sim.getCurrentStage()).toBeNull();
    });

    it('should have empty steps history', () => {
      expect(sim.getSteps()).toEqual([]);
    });
  });

  describe('step() — four stages', () => {
    it('should return recognize stage on first step', () => {
      const result = sim.step();
      expect(result.stage).toBe('recognize');
      expect(result.truth).toBe('dukkha');
      expect(result.insight).toBeTruthy();
      expect(result.guidance).toBeTruthy();
    });

    it('should return investigate stage on second step', () => {
      sim.step();
      const result = sim.step();
      expect(result.stage).toBe('investigate');
      expect(result.truth).toBe('samudaya');
    });

    it('should return release stage on third step', () => {
      sim.step();
      sim.step();
      const result = sim.step();
      expect(result.stage).toBe('release');
      expect(result.truth).toBe('nirodha');
    });

    it('should return practice stage on fourth step', () => {
      sim.step();
      sim.step();
      sim.step();
      const result = sim.step();
      expect(result.stage).toBe('practice');
      expect(result.truth).toBe('magga');
    });

    it('should include the suffering description in the recognize insight', () => {
      const result = sim.step();
      expect(result.insight).toContain('anxiety about the future');
    });
  });

  describe('completion', () => {
    it('should be complete after 4 steps', () => {
      sim.step();
      sim.step();
      sim.step();
      sim.step();
      expect(sim.isComplete()).toBe(true);
    });

    it('should throw when stepping past completion', () => {
      sim.step();
      sim.step();
      sim.step();
      sim.step();
      expect(() => sim.step()).toThrow();
    });
  });

  describe('getCurrentStage()', () => {
    it('should track the current stage after each step', () => {
      sim.step();
      expect(sim.getCurrentStage()).toBe('recognize');
      sim.step();
      expect(sim.getCurrentStage()).toBe('investigate');
      sim.step();
      expect(sim.getCurrentStage()).toBe('release');
      sim.step();
      expect(sim.getCurrentStage()).toBe('practice');
    });
  });

  describe('getSteps()', () => {
    it('should accumulate steps history', () => {
      sim.step();
      sim.step();
      const steps = sim.getSteps();
      expect(steps).toHaveLength(2);
      expect(steps[0].stage).toBe('recognize');
      expect(steps[1].stage).toBe('investigate');
    });

    it('should return a read-only copy', () => {
      sim.step();
      const steps = sim.getSteps();
      expect(steps).toHaveLength(1);
      // Original should not be affected by future steps
      sim.step();
      expect(steps).toHaveLength(1);
    });
  });

  describe('getSummary()', () => {
    it('should include suffering description', () => {
      sim.step();
      const summary = sim.getSummary();
      expect(summary).toContain('anxiety about the future');
    });

    it('should include all completed stages', () => {
      sim.step();
      sim.step();
      sim.step();
      sim.step();
      const summary = sim.getSummary();
      expect(summary).toContain('recognize');
      expect(summary).toContain('investigate');
      expect(summary).toContain('release');
      expect(summary).toContain('practice');
    });
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/simulation/PoisonArrow.test.ts
```
Expected: FAIL — "Cannot find module '../../src/simulation/PoisonArrow'"

**Step 3: Commit the failing tests**

```bash
git add tests/simulation/PoisonArrow.test.ts
git commit -m "test: add failing tests for PoisonArrow"
```

---

### Task 3: Implement `PoisonArrow` class

**Files:**
- Create: `src/simulation/PoisonArrow.ts`

**Step 1: Create the implementation**

```ts
/**
 * PoisonArrow — Simplified Cessation Simulation
 *
 * Based on the Cula-Malunkyovada Sutta (MN 63): a man struck by a poisoned
 * arrow should remove it immediately rather than asking who shot it, what
 * the bow was made of, or where the archer came from.
 *
 * This class embodies that pragmatism. Given a description of suffering,
 * it walks through four steps to cessation — one per Noble Truth — without
 * requiring configuration of the 12 nidanas, aggregates, karma, or any
 * other deep machinery. Just pull out the arrow.
 */

import { CessationStage, CessationStep } from '../utils/types';

const STAGES: ReadonlyArray<{ stage: CessationStage; truth: CessationStep['truth'] }> = [
  { stage: 'recognize', truth: 'dukkha' },
  { stage: 'investigate', truth: 'samudaya' },
  { stage: 'release', truth: 'nirodha' },
  { stage: 'practice', truth: 'magga' },
];

export class PoisonArrow {
  private readonly suffering: string;
  private stepHistory: CessationStep[] = [];

  constructor(suffering: string) {
    this.suffering = suffering;
  }

  /**
   * Advance to the next cessation stage.
   * Throws if the arrow has already been removed (all 4 steps complete).
   */
  step(): CessationStep {
    if (this.isComplete()) {
      throw new Error(
        'The arrow has already been removed. There is nothing more to do.'
      );
    }

    const index = this.stepHistory.length;
    const { stage, truth } = STAGES[index];

    const cessationStep: CessationStep = {
      stage,
      truth,
      insight: this.generateInsight(stage),
      guidance: this.generateGuidance(stage),
    };

    this.stepHistory.push(cessationStep);
    return cessationStep;
  }

  /**
   * Get the current stage, or null if no steps have been taken.
   */
  getCurrentStage(): CessationStage | null {
    if (this.stepHistory.length === 0) return null;
    return this.stepHistory[this.stepHistory.length - 1].stage;
  }

  /**
   * True when all four steps have been completed.
   */
  isComplete(): boolean {
    return this.stepHistory.length >= STAGES.length;
  }

  /**
   * Read-only history of steps taken so far.
   */
  getSteps(): readonly CessationStep[] {
    return [...this.stepHistory];
  }

  /**
   * Text summary of the cessation path so far.
   */
  getSummary(): string {
    const lines = [`Suffering: "${this.suffering}"`, ''];

    for (const s of this.stepHistory) {
      lines.push(`[${s.stage}] (${s.truth})`);
      lines.push(`  Insight: ${s.insight}`);
      lines.push(`  Guidance: ${s.guidance}`);
      lines.push('');
    }

    if (this.isComplete()) {
      lines.push('The arrow has been removed.');
    } else {
      lines.push(
        `${STAGES.length - this.stepHistory.length} step(s) remaining.`
      );
    }

    return lines.join('\n').trim();
  }

  private generateInsight(stage: CessationStage): string {
    switch (stage) {
      case 'recognize':
        return (
          `This is suffering: "${this.suffering}". ` +
          `Acknowledging it clearly, without denial or dramatization, is the first step.`
        );
      case 'investigate':
        return (
          `The suffering is sustained by craving — wanting things to be different than they are. ` +
          `What resistance or clinging is fueling "${this.suffering}"?`
        );
      case 'release':
        return (
          `Cessation is possible. The suffering of "${this.suffering}" is not permanent — ` +
          `it depends on conditions that can change.`
        );
      case 'practice':
        return (
          `The path forward: meet "${this.suffering}" with wise attention, ` +
          `not with further craving or aversion.`
        );
    }
  }

  private generateGuidance(stage: CessationStage): string {
    switch (stage) {
      case 'recognize':
        return 'Sit with the experience. Name it. Do not push it away or pull it closer.';
      case 'investigate':
        return 'Ask: "What am I wanting right now? What am I resisting?" Look for the second arrow.';
      case 'release':
        return 'You do not need to force letting go. Simply see that the clinging is optional.';
      case 'practice':
        return 'Return attention to this moment. The arrow is out. What remains is just life, as it is.';
    }
  }
}
```

**Step 2: Run the tests**

```bash
npx vitest run tests/simulation/PoisonArrow.test.ts
```
Expected: all tests PASS.

**Step 3: Run full typecheck**

```bash
npm run typecheck
```
Expected: no errors.

**Step 4: Commit**

```bash
git add src/simulation/PoisonArrow.ts
git commit -m "feat: implement PoisonArrow cessation simulation"
```

---

### Task 4: Wire up exports and alias

**Files:**
- Modify: `src/simulation/index.ts`
- Modify: `src/utils/aliases.ts`

**Step 1: Export from the simulation index**

In `src/simulation/index.ts`, add one line at the end:

```ts
export * from './PoisonArrow';
```

**Step 2: Add English alias**

In `src/utils/aliases.ts`, add the import at the top with the other imports:

```ts
import { PoisonArrow } from '../simulation/PoisonArrow';
```

Then add the alias after the existing `EightyFourthProblem` line:

```ts
export const QuickCessation = PoisonArrow;
```

**Step 3: Run full test suite and typecheck**

```bash
npm run typecheck && npx vitest run
```
Expected: all tests pass, no type errors.

**Step 4: Commit**

```bash
git add src/simulation/index.ts src/utils/aliases.ts
git commit -m "feat: export PoisonArrow and add QuickCessation alias"
```

---

### Task 5: Add parable and usage to README, mark TODO complete

**Files:**
- Modify: `README.md`
- Modify: `TODO.md`

**Step 1: Add PoisonArrow section to README**

In `README.md`, find the `## Being (Simulation)` section (around line 584). Add a new subsection before it (after the Persistence section's `---`):

```markdown
## Poison Arrow (Quick Cessation)

Based on the Cula-Malunkyovada Sutta (MN 63): a man struck by a poisoned arrow should remove it immediately rather than asking who shot it. The `PoisonArrow` class (aliased as `QuickCessation`) provides a simplified 4-step cessation path — one step per Noble Truth — without requiring configuration of nidanas, aggregates, or karma.

```typescript
import { PoisonArrow } from 'buddha-js';
// or: import { QuickCessation } from 'buddha-js';

const sim = new PoisonArrow('anxiety about the future');

sim.step();
// { stage: 'recognize', truth: 'dukkha',
//   insight: 'This is suffering: "anxiety about the future"...',
//   guidance: 'Sit with the experience. Name it...' }

sim.step();
// { stage: 'investigate', truth: 'samudaya', ... }

sim.step();
// { stage: 'release', truth: 'nirodha', ... }

sim.step();
// { stage: 'practice', truth: 'magga', ... }

sim.isComplete(); // true — the arrow has been removed

// Review the path
console.log(sim.getSummary());
```

---
```

**Step 2: Check the TODO box**

In `TODO.md`, change:

```
- [ ] **"Poison Arrow" Simulation**: A simplified simulation mode that focuses strictly on immediate cessation of suffering without requiring deep configuration of the 12 Nidanas.
```

to:

```
- [x] **"Poison Arrow" Simulation**: A simplified simulation mode that focuses strictly on immediate cessation of suffering without requiring deep configuration of the 12 Nidanas.
```

**Step 3: Run full suite one final time**

```bash
npx vitest run
```
Expected: all tests pass.

**Step 4: Commit**

```bash
git add README.md TODO.md
git commit -m "docs: add PoisonArrow to README and mark TODO complete"
```
