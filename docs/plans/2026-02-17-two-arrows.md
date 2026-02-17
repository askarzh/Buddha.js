# TwoArrows (84th Problem Helper) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `TwoArrows` class that distinguishes unavoidable pain (first arrow) from self-added suffering through resistance (second arrow), with an `EightyFourthProblem` English alias.

**Architecture:** New class `TwoArrows` in `src/four-noble-truths/` extending `Phenomenon`, following the exact same pattern as `Dukkha`. Two new types (`ArrowInput`, `ArrowAnalysis`) added to `src/utils/types.ts`. Exported from the module index and aliased in `src/utils/aliases.ts`.

**Tech Stack:** TypeScript (strict), Vitest for tests. Run tests with `npx vitest run`.

---

### Task 1: Add types to `src/utils/types.ts`

**Files:**
- Modify: `src/utils/types.ts`

**Step 1: Add the two new interfaces after the `DukkhaType` block**

Open `src/utils/types.ts`. After the `DukkhaType` type (around line 40), add:

```ts
/** Input for two-arrows analysis */
export interface ArrowInput {
  /** The raw, unavoidable painful experience (first arrow) */
  pain: string;
  /** Mental reactions layered on top: resistance, craving, aversion (second arrow) */
  mentalReactions: string[];
}

/** Result of two-arrows analysis */
export interface ArrowAnalysis {
  firstArrow: { description: string; isUnavoidable: true };
  secondArrow: { reactions: string[]; count: number; isOptional: true };
  totalArrows: 'one' | 'two';
  /** True when a second arrow is present — this IS the 84th problem */
  isEightyFourthProblem: boolean;
  insight: string;
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
git commit -m "feat: add ArrowInput and ArrowAnalysis types"
```

---

### Task 2: Write failing tests for `TwoArrows`

**Files:**
- Create: `tests/four-noble-truths/TwoArrows.test.ts`

**Step 1: Create the test file**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TwoArrows } from '../../src/four-noble-truths/TwoArrows';

describe('TwoArrows', () => {
  let twoArrows: TwoArrows;

  beforeEach(() => {
    twoArrows = new TwoArrows();
  });

  describe('Identity', () => {
    it('should have correct name and sanskritName', () => {
      expect(twoArrows.name).toBe('TwoArrows');
      expect(twoArrows.sanskritName).toBe('Dvē Sallā');
    });
  });

  describe('analyze() — one arrow (no resistance)', () => {
    it('should identify only the first arrow when no mental reactions', () => {
      const result = twoArrows.analyze({
        pain: 'knee pain while sitting',
        mentalReactions: [],
      });

      expect(result.firstArrow.description).toBe('knee pain while sitting');
      expect(result.firstArrow.isUnavoidable).toBe(true);
      expect(result.secondArrow.count).toBe(0);
      expect(result.totalArrows).toBe('one');
      expect(result.isEightyFourthProblem).toBe(false);
    });

    it('should return insight pointing to first arrow only', () => {
      const result = twoArrows.analyze({
        pain: 'back pain',
        mentalReactions: [],
      });

      expect(result.insight).toBeTruthy();
      expect(typeof result.insight).toBe('string');
    });
  });

  describe('analyze() — two arrows (with resistance)', () => {
    it('should identify both arrows when mental reactions are present', () => {
      const result = twoArrows.analyze({
        pain: 'knee pain while sitting',
        mentalReactions: ['wishing it would stop', 'fear it will get worse'],
      });

      expect(result.firstArrow.description).toBe('knee pain while sitting');
      expect(result.secondArrow.reactions).toEqual(['wishing it would stop', 'fear it will get worse']);
      expect(result.secondArrow.count).toBe(2);
      expect(result.secondArrow.isOptional).toBe(true);
      expect(result.totalArrows).toBe('two');
      expect(result.isEightyFourthProblem).toBe(true);
    });

    it('should return a different insight when two arrows are present', () => {
      const one = twoArrows.analyze({ pain: 'pain', mentalReactions: [] });
      const two = twoArrows.analyze({ pain: 'pain', mentalReactions: ['resistance'] });
      expect(one.insight).not.toBe(two.insight);
    });
  });

  describe('hasRecognizedSecondArrow()', () => {
    it('should return false when no analyses have been done', () => {
      expect(twoArrows.hasRecognizedSecondArrow()).toBe(false);
    });

    it('should return false when only one-arrow analyses done', () => {
      twoArrows.analyze({ pain: 'pain', mentalReactions: [] });
      expect(twoArrows.hasRecognizedSecondArrow()).toBe(false);
    });

    it('should return true after any two-arrow analysis', () => {
      twoArrows.analyze({ pain: 'pain', mentalReactions: ['resistance'] });
      expect(twoArrows.hasRecognizedSecondArrow()).toBe(true);
    });

    it('should remain true even after subsequent one-arrow analyses', () => {
      twoArrows.analyze({ pain: 'pain', mentalReactions: ['resistance'] });
      twoArrows.analyze({ pain: 'pain', mentalReactions: [] });
      expect(twoArrows.hasRecognizedSecondArrow()).toBe(true);
    });
  });

  describe('getAnalysisCount()', () => {
    it('should return 0 initially', () => {
      expect(twoArrows.getAnalysisCount()).toBe(0);
    });

    it('should increment with each analysis', () => {
      twoArrows.analyze({ pain: 'p1', mentalReactions: [] });
      twoArrows.analyze({ pain: 'p2', mentalReactions: ['r'] });
      expect(twoArrows.getAnalysisCount()).toBe(2);
    });
  });

  describe('Two Truths', () => {
    it('should return conventional truth', () => {
      const truth = twoArrows.getConventionalTruth();
      expect(truth.level).toBe('conventional');
      expect(truth.description).toBeTruthy();
      expect(truth.usefulFor).toBeInstanceOf(Array);
      expect(truth.usefulFor.length).toBeGreaterThan(0);
    });

    it('should return ultimate truth', () => {
      const truth = twoArrows.getUltimateTruth();
      expect(truth.level).toBe('ultimate');
      expect(truth.description).toBeTruthy();
      expect(truth.transcends).toBeInstanceOf(Array);
      expect(truth.transcends.length).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/four-noble-truths/TwoArrows.test.ts
```
Expected: FAIL — "Cannot find module '../../src/four-noble-truths/TwoArrows'"

**Step 3: Commit the failing tests**

```bash
git add tests/four-noble-truths/TwoArrows.test.ts
git commit -m "test: add failing tests for TwoArrows"
```

---

### Task 3: Implement `TwoArrows` class

**Files:**
- Create: `src/four-noble-truths/TwoArrows.ts`

**Step 1: Create the implementation**

```ts
/**
 * TwoArrows — The "84th Problem" Helper
 *
 * Models the Buddhist "two arrows" teaching:
 *   - First arrow: unavoidable pain (the raw sensation or loss)
 *   - Second arrow: self-inflicted suffering through resistance, craving, or aversion
 *
 * The "84th problem" is the problem of not wanting to have any problems —
 * the second arrow itself. Recognizing it is optional is the path to relief.
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { ArrowInput, ArrowAnalysis } from '../utils/types';

export class TwoArrows extends Phenomenon {
  readonly name = 'TwoArrows';
  readonly sanskritName = 'Dvē Sallā';

  private analysisHistory: ArrowAnalysis[] = [];

  /**
   * Analyze a painful situation to distinguish first and second arrows.
   */
  analyze(input: ArrowInput): ArrowAnalysis {
    const hasSecondArrow = input.mentalReactions.length > 0;

    const analysis: ArrowAnalysis = {
      firstArrow: {
        description: input.pain,
        isUnavoidable: true,
      },
      secondArrow: {
        reactions: [...input.mentalReactions],
        count: input.mentalReactions.length,
        isOptional: true,
      },
      totalArrows: hasSecondArrow ? 'two' : 'one',
      isEightyFourthProblem: hasSecondArrow,
      insight: hasSecondArrow
        ? `The pain of "${input.pain}" is the first arrow — unavoidable. ` +
          `But ${input.mentalReactions.length} mental reaction(s) form the second arrow: ` +
          `"${input.mentalReactions.join('", "')}". ` +
          `This second arrow is optional. Recognizing it as self-added is the beginning of relief.`
        : `Only the first arrow is present: "${input.pain}". ` +
          `No second arrow of resistance has been added. ` +
          `This is the mark of equanimity — meeting pain without adding suffering.`,
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * Returns true if any past analysis found a second arrow (mental resistance).
   * Indicates the 84th problem has been encountered and recognized.
   */
  hasRecognizedSecondArrow(): boolean {
    return this.analysisHistory.some(a => a.isEightyFourthProblem);
  }

  /**
   * Total number of analyses performed.
   */
  getAnalysisCount(): number {
    return this.analysisHistory.length;
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'Pain is inevitable; suffering through resistance to pain is optional',
      usefulFor: [
        'Distinguishing unavoidable pain from self-added suffering',
        'Reducing unnecessary mental anguish',
        'Developing equanimity in the face of difficulty',
        'Practical daily application of Buddhist insight',
      ],
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description:
        'Neither arrow has inherent existence; both arise dependently and cease when conditions change',
      transcends: [
        'Belief that all pain can be eliminated',
        'Belief that resistance to pain is inevitable',
        'Identification with suffering as "my" suffering',
        'The project of wanting no problems (the 84th problem itself)',
      ],
    };
  }
}
```

**Step 2: Run the tests**

```bash
npx vitest run tests/four-noble-truths/TwoArrows.test.ts
```
Expected: all tests PASS.

**Step 3: Run full typecheck**

```bash
npm run typecheck
```
Expected: no errors.

**Step 4: Commit**

```bash
git add src/four-noble-truths/TwoArrows.ts
git commit -m "feat: implement TwoArrows class (84th Problem helper)"
```

---

### Task 4: Wire up exports and alias

**Files:**
- Modify: `src/four-noble-truths/index.ts`
- Modify: `src/utils/aliases.ts`

**Step 1: Export from the module index**

In `src/four-noble-truths/index.ts`, add one line at the end:

```ts
export * from './TwoArrows';
```

**Step 2: Add English alias**

In `src/utils/aliases.ts`, add after the existing Four Noble Truths aliases block:

```ts
import { TwoArrows } from '../four-noble-truths/TwoArrows';

// ...existing aliases...

// Two Arrows / 84th Problem
export const EightyFourthProblem = TwoArrows;
```

**Step 3: Run full test suite and typecheck**

```bash
npm run typecheck && npx vitest run
```
Expected: all tests pass, no type errors.

**Step 4: Commit**

```bash
git add src/four-noble-truths/index.ts src/utils/aliases.ts
git commit -m "feat: export TwoArrows and add EightyFourthProblem alias"
```

---

### Task 5: Mark TODO complete

**Files:**
- Modify: `TODO.md`

**Step 1: Check the box**

In `TODO.md`, change:

```
- [ ] **The "84th Problem" Helper**: Create a utility to distinguish between inevitable pain (first arrow) and the suffering of resistance (second arrow).
```

to:

```
- [x] **The "84th Problem" Helper**: Create a utility to distinguish between inevitable pain (first arrow) and the suffering of resistance (second arrow).
```

**Step 2: Run full suite one final time**

```bash
npx vitest run
```
Expected: all tests pass.

**Step 3: Commit**

```bash
git add TODO.md
git commit -m "docs: mark 84th Problem helper as complete"
```
