# Koan Generator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `KoanGenerator` class that presents classic Zen koans and evaluates user responses for dualistic thinking traps.

**Architecture:** Standalone `src/koan/` module with no dependencies on other Buddha.js modules. A static collection of ~8 classic koans lives in `koans.ts`. The `KoanGenerator` class exposes `present()` to draw koans and `contemplate()` to evaluate responses using keyword/pattern-based dualism detection. Types live in `src/utils/types.ts`.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Add Koan types

**Files:**
- Modify: `src/utils/types.ts`

**Step 1: Add types to src/utils/types.ts**

Add the following types at the end of the file (before any closing comments), after the MeditationSession interface:

```ts
// ── Koan Types ──────────────────────────────────────────────

export interface Koan {
  id: string;
  title: string;
  case: string;
  source: string;
  hint?: string;
}

export type DualismTrap =
  | 'binary'
  | 'intellectual'
  | 'seeking'
  | 'nihilistic'
  | 'grasping';

export interface ContemplationResult {
  koan: Koan;
  response: string;
  trapsDetected: DualismTrap[];
  reflection: string;
  isNonDual: boolean;
}
```

**Step 2: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/utils/types.ts
git commit -m "feat: add Koan, DualismTrap, and ContemplationResult types"
```

---

### Task 2: Write failing tests for KoanGenerator

**Files:**
- Create: `tests/koan/KoanGenerator.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { KoanGenerator } from '../../src/koan/KoanGenerator';

describe('KoanGenerator', () => {
  let generator: KoanGenerator;

  beforeEach(() => {
    generator = new KoanGenerator();
  });

  describe('getCollection()', () => {
    it('should return the built-in koan collection', () => {
      const koans = generator.getCollection();
      expect(koans.length).toBeGreaterThanOrEqual(8);
    });

    it('should return readonly array', () => {
      const koans = generator.getCollection();
      expect(Array.isArray(koans)).toBe(true);
    });

    it('should have required fields on each koan', () => {
      for (const koan of generator.getCollection()) {
        expect(koan.id).toBeTruthy();
        expect(koan.title).toBeTruthy();
        expect(koan.case).toBeTruthy();
        expect(koan.source).toBeTruthy();
      }
    });
  });

  describe('present()', () => {
    it('should return a koan from the collection', () => {
      const koan = generator.present();
      const ids = generator.getCollection().map(k => k.id);
      expect(ids).toContain(koan.id);
    });

    it('should return a specific koan by id', () => {
      const all = generator.getCollection();
      const target = all[0];
      const koan = generator.present(target.id);
      expect(koan.id).toBe(target.id);
      expect(koan.title).toBe(target.title);
    });

    it('should throw for unknown koan id', () => {
      expect(() => generator.present('nonexistent')).toThrow();
    });
  });

  describe('contemplate() — trap detection', () => {
    const koanId = () => generator.getCollection()[0].id;

    it('should detect binary trap for yes/no answers', () => {
      const result = generator.contemplate(koanId(), 'Yes');
      expect(result.trapsDetected).toContain('binary');
      expect(result.isNonDual).toBe(false);
    });

    it('should detect binary trap for both/neither answers', () => {
      const result = generator.contemplate(koanId(), 'Both and neither');
      expect(result.trapsDetected).toContain('binary');
    });

    it('should detect intellectual trap for analytical responses', () => {
      const result = generator.contemplate(
        koanId(),
        'This means that the Buddha was trying to express the idea that all sentient beings possess inherent awareness because of the universal nature of consciousness'
      );
      expect(result.trapsDetected).toContain('intellectual');
    });

    it('should detect seeking trap for hedging responses', () => {
      const result = generator.contemplate(koanId(), 'Is this the right answer?');
      expect(result.trapsDetected).toContain('seeking');
    });

    it('should detect nihilistic trap', () => {
      const result = generator.contemplate(koanId(), 'Nothing matters, it is all meaningless');
      expect(result.trapsDetected).toContain('nihilistic');
    });

    it('should detect grasping trap for definitive claims', () => {
      const result = generator.contemplate(koanId(), 'The answer is that Buddha-nature is universal');
      expect(result.trapsDetected).toContain('grasping');
    });

    it('should detect multiple traps in one response', () => {
      const result = generator.contemplate(
        koanId(),
        'The answer is yes because it means that everything is nothing'
      );
      expect(result.trapsDetected.length).toBeGreaterThan(1);
    });

    it('should return isNonDual true when no traps detected', () => {
      const result = generator.contemplate(koanId(), '🙏');
      expect(result.trapsDetected).toEqual([]);
      expect(result.isNonDual).toBe(true);
    });

    it('should include the koan and response in the result', () => {
      const id = koanId();
      const result = generator.contemplate(id, 'Mu');
      expect(result.koan.id).toBe(id);
      expect(result.response).toBe('Mu');
    });

    it('should include a reflection string', () => {
      const result = generator.contemplate(koanId(), 'Yes');
      expect(result.reflection).toBeTruthy();
      expect(typeof result.reflection).toBe('string');
    });

    it('should throw for unknown koan id', () => {
      expect(() => generator.contemplate('nonexistent', 'answer')).toThrow();
    });

    it('should throw for empty response', () => {
      expect(() => generator.contemplate(koanId(), '')).toThrow();
      expect(() => generator.contemplate(koanId(), '   ')).toThrow();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/koan/KoanGenerator.test.ts`
Expected: FAIL (cannot find module)

**Step 3: Commit**

```bash
git add tests/koan/KoanGenerator.test.ts
git commit -m "test: add failing tests for KoanGenerator"
```

---

### Task 3: Implement KoanGenerator

**Files:**
- Create: `src/koan/koans.ts`
- Create: `src/koan/KoanGenerator.ts`

**Step 1: Create the built-in koan collection**

Create `src/koan/koans.ts`:

```ts
import { Koan } from '../utils/types';

export const BUILT_IN_KOANS: readonly Koan[] = [
  {
    id: 'mu',
    title: "Zhaozhou's Dog",
    case: 'A monk asked Zhaozhou: "Does a dog have Buddha-nature?" Zhaozhou replied: "Mu."',
    source: 'Gateless Gate, Case 1',
    hint: 'Mu is not yes or no.',
  },
  {
    id: 'one-hand',
    title: 'One Hand Clapping',
    case: 'Hakuin asked: "You know the sound of two hands clapping. What is the sound of one hand?"',
    source: 'Hakuin Ekaku',
    hint: 'Listen without ears.',
  },
  {
    id: 'stone-mind',
    title: 'The Stone in the Mind',
    case: 'Hōgen pointed to a rock and asked: "Is this stone inside or outside your mind?" The master said: "Inside my mind." Hōgen replied: "It must be very heavy to carry a stone in your mind."',
    source: 'Nishitani, Religion and Nothingness',
  },
  {
    id: 'flag-wind',
    title: 'The Flag and the Wind',
    case: 'Two monks were arguing about a flag flapping in the wind. One said: "The flag is moving." The other said: "The wind is moving." The Sixth Patriarch said: "Neither the flag nor the wind is moving. It is your mind that moves."',
    source: 'Platform Sutra',
  },
  {
    id: 'marrow',
    title: "Bodhidharma's Marrow",
    case: 'Bodhidharma asked his four disciples to express their understanding. Three gave verbal answers. The fourth, Huike, simply bowed in silence. Bodhidharma said: "You express my marrow."',
    source: 'Denkoroku',
    hint: 'What speaks louder than words?',
  },
  {
    id: 'nansen-cat',
    title: "Nansen's Cat",
    case: 'Nansen saw monks of the eastern and western halls fighting over a cat. He held up the cat and said: "If any of you can say a turning word, I will spare the cat." No one answered, so Nansen cut the cat in two. That evening, Zhaozhou returned and Nansen told him what happened. Zhaozhou took off his sandals, placed them on his head, and walked out. Nansen said: "If you had been there, you could have saved the cat."',
    source: 'Gateless Gate, Case 14',
  },
  {
    id: 'fan-wind',
    title: 'The Fan and the Wind',
    case: 'A monk asked: "The nature of the wind is constantly abiding and reaches everywhere. Why then, sir, do you still use a fan?" The master just fanned himself.',
    source: 'Dōgen, Genjōkōan',
    hint: 'Practice is not separate from realization.',
  },
  {
    id: 'original-face',
    title: 'The Original Face',
    case: 'Huineng asked Hui Ming: "Without thinking of good or evil, at this very moment, what is your original face — the face you had before your parents were born?"',
    source: 'Platform Sutra',
  },
];
```

**Step 2: Create the KoanGenerator class**

Create `src/koan/KoanGenerator.ts`:

```ts
/**
 * KoanGenerator — Paradoxical Logic Puzzles for Breaking Dualistic Thinking
 *
 * In Zen (Ch'an) tradition, a koan is a verbal device used to exhaust
 * the discriminating mind. Koans are not riddles with answers — they
 * are tools to push the practitioner beyond conceptual thought.
 *
 * The generator presents classic koans and evaluates contemplation
 * responses for common dualistic thinking traps. Detection of traps
 * is not judgment — it is a mirror.
 */

import {
  Koan,
  DualismTrap,
  ContemplationResult,
} from '../utils/types';
import { BUILT_IN_KOANS } from './koans';

/** Word count threshold for intellectual trap */
const INTELLECTUAL_LENGTH = 15;

/** Patterns for each dualism trap */
const TRAP_PATTERNS: Record<DualismTrap, RegExp[]> = {
  binary: [
    /^(yes|no|true|false|right|wrong)[\.\!\?\s]*$/i,
    /\b(both|neither)\b/i,
    /\b(exists?|does(?:n't| not) exist)\b/i,
    /\b(it is|it isn't|it does|it doesn't)\s*$/i,
  ],
  intellectual: [
    /\bbecause\b/i,
    /\bmeans that\b/i,
    /\btherefore\b/i,
    /\brepresents?\b/i,
    /\bsymbolizes?\b/i,
    /\bimplies?\b/i,
    /\bin other words\b/i,
  ],
  seeking: [
    /\bis this (right|correct|the answer)\b/i,
    /\bwhat('s| is) the answer\b/i,
    /\bam I (right|correct|close)\b/i,
    /\bI think maybe\b/i,
    /\bI('m| am) not sure\b/i,
    /\bperhaps\b/i,
  ],
  nihilistic: [
    /\bnothing (matters|exists|is real)\b/i,
    /\bdoes(?:n't| not) matter\b/i,
    /\bmeaningless\b/i,
    /\bpointless\b/i,
    /\bno point\b/i,
    /\bit('s| is) all (empty|void|illusion)\b/i,
  ],
  grasping: [
    /\bthe answer is\b/i,
    /\bthe meaning is\b/i,
    /\bit means\b/i,
    /\bthis (means|represents|symbolizes)\b/i,
    /\bthe point is\b/i,
    /\bwhat .+ (really )?(means|is about)\b/i,
  ],
};

/** Reflections for each trap type */
const TRAP_REFLECTIONS: Record<DualismTrap, string> = {
  binary: 'You reach for yes or no, but the koan lives between the fingers of that grasp.',
  intellectual: 'The mind builds a raft of concepts — but who will carry the raft?',
  seeking: 'Seeking the "right" answer is itself the trap. Who is seeking?',
  nihilistic: 'Emptiness is not nothingness. The flower still blooms.',
  grasping: 'To say "the answer is..." is to hold water in a clenched fist.',
};

const NON_DUAL_REFLECTION = 'The mind is quiet. What remains?';

export class KoanGenerator {
  private readonly koans: readonly Koan[];

  constructor() {
    this.koans = BUILT_IN_KOANS;
  }

  /**
   * Present a koan. If no id is given, returns a random koan.
   */
  present(id?: string): Koan {
    if (id !== undefined) {
      const koan = this.koans.find(k => k.id === id);
      if (!koan) {
        throw new Error(`Koan not found: "${id}"`);
      }
      return koan;
    }
    return this.koans[Math.floor(Math.random() * this.koans.length)];
  }

  /**
   * Contemplate a koan by submitting a response. Returns an analysis
   * of dualistic thinking traps detected in the response.
   */
  contemplate(koanId: string, response: string): ContemplationResult {
    const koan = this.present(koanId);

    if (!response.trim()) {
      throw new Error('A response is required for contemplation.');
    }

    const trapsDetected = this.detectTraps(response);
    const reflection = trapsDetected.length > 0
      ? TRAP_REFLECTIONS[trapsDetected[0]]
      : NON_DUAL_REFLECTION;

    return {
      koan,
      response,
      trapsDetected,
      reflection,
      isNonDual: trapsDetected.length === 0,
    };
  }

  /**
   * Return the full collection of available koans.
   */
  getCollection(): readonly Koan[] {
    return this.koans;
  }

  private detectTraps(response: string): DualismTrap[] {
    const traps: DualismTrap[] = [];

    for (const [trap, patterns] of Object.entries(TRAP_PATTERNS) as [DualismTrap, RegExp[]][]) {
      if (trap === 'intellectual') {
        const wordCount = response.trim().split(/\s+/).length;
        if (wordCount >= INTELLECTUAL_LENGTH && patterns.some(p => p.test(response))) {
          traps.push(trap);
        }
      } else {
        if (patterns.some(p => p.test(response))) {
          traps.push(trap);
        }
      }
    }

    return traps;
  }
}
```

**Step 3: Run tests to verify they pass**

Run: `npx vitest run tests/koan/KoanGenerator.test.ts`
Expected: ALL PASS

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS (172+ tests)

**Step 5: Commit**

```bash
git add src/koan/koans.ts src/koan/KoanGenerator.ts
git commit -m "feat: implement KoanGenerator with built-in koan collection"
```

---

### Task 4: Wire exports and Riddle alias

**Files:**
- Create: `src/koan/index.ts`
- Modify: `src/index.ts`
- Modify: `src/utils/aliases.ts`

**Step 1: Create barrel export**

Create `src/koan/index.ts`:

```ts
export * from './KoanGenerator';
```

**Step 2: Add to main barrel export**

In `src/index.ts`, add before the `// Meditation` line:

```ts
// Koan
export * from './koan';
```

**Step 3: Add English alias**

In `src/utils/aliases.ts`, add import:

```ts
import { KoanGenerator } from '../koan/KoanGenerator';
```

Add alias (near the Meditation section):

```ts
// Koan
export const Riddle = KoanGenerator;
```

**Step 4: Run tests and typecheck**

Run: `npx vitest run && npm run typecheck`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/koan/index.ts src/index.ts src/utils/aliases.ts
git commit -m "feat: wire KoanGenerator exports and Riddle alias"
```

---

### Task 5: README, CLAUDE.md, TODO updates

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `TODO.md`

**Step 1: Add README section**

Add a `## Koan Generator` section in `README.md` after the Meditation Timer section and before the Being section. Include:
- Brief description of koans and their purpose
- Usage example: `present()`, `contemplate()`, trap detection
- Note about the `Riddle` alias

**Step 2: Update CLAUDE.md module table**

Add a row to the module table in `CLAUDE.md`:

```
| `koan/` | `KoanGenerator` | Zen koan presentation and dualistic thinking detection |
```

**Step 3: Mark TODO complete**

Change in `TODO.md`:

```
- [x] **Koan Generator**: A class that presents paradoxical logic puzzles to break out of dualistic thinking/conditional logic.
```

**Step 4: Add koan module to README project structure**

Add `- **src/koan/**: Zen koan presentation and contemplation (KoanGenerator).` to the project structure list.

**Step 5: Run tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add README.md CLAUDE.md TODO.md
git commit -m "docs: add KoanGenerator to README, CLAUDE.md, and mark TODO complete"
```
