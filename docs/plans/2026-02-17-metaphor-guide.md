# Metaphor Guide Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Write a conceptual guide (`docs/metaphor-guide.md`) explaining three Buddhist metaphors and how they map to Buddha.js library classes, with code examples.

**Architecture:** Single markdown document with intro, three metaphor sections (each following the same Teaching/In Code/Example pattern), and a conclusion. Update `docs/README.md` to list the new doc. Mark TODO complete.

**Tech Stack:** Markdown, TypeScript code examples (no executable code, just illustrative snippets)

---

### Task 1: Write the Metaphor Guide document

**Files:**
- Create: `docs/metaphor-guide.md`

**Step 1: Create `docs/metaphor-guide.md`**

Write the full document with this exact content:

````markdown
# Metaphor Guide: Raft, Finger, and Burning House

Three classic Buddhist metaphors illuminate how to work with Buddha.js — and more importantly, how not to.

The common thread: **don't confuse the tool for the goal.** These classes model Buddhist concepts, but the models are not the concepts themselves. Use them to develop understanding, then let the understanding guide you.

---

## The Raft (Kullupama Sutta)

### The Teaching

A man builds a raft to cross a dangerous river. Once safely on the other shore, he faces a choice: carry the raft on his head for the rest of the journey, or leave it behind?

> "The teaching is like a raft for crossing over, not for grasping." — *The Diamond Sutra*

The dharma — the entire body of Buddhist teaching — is a raft. It is essential during the crossing and useless after. Clinging to the teaching itself becomes another form of attachment.

### In Code

The classes in Buddha.js are rafts. `EightfoldPath`, `FourNobleTruths`, `DependentOrigination` — these are tools for understanding suffering, its causes, and the way beyond it. They are not the understanding itself.

Use an `EightfoldPath` to explore how the eight factors develop. Practice with it. But know that the path object's `.getOverallDevelopment()` returning `7.5` is not enlightenment — it's a number in memory. The insight you gain from working through the model is what matters.

### Example

```typescript
import { EightfoldPath } from 'buddha-js';

// Build the raft
const path = new EightfoldPath();

// Use it to cross — develop understanding
path.practiceCategory('wisdom', 8);
path.practiceCategory('ethics', 7);
path.practiceCategory('meditation', 9);

console.log(path.getOverallDevelopment()); // 6.25

// The number is the raft. The understanding is the other shore.
// Don't carry the raft on your head.
```

---

## The Finger Pointing at the Moon

### The Teaching

A teacher points at the moon. A student stares at the finger.

The finger is necessary — without it, you might never look up. But fixating on the finger means you miss the moon entirely. Every teaching, every concept, every model is a finger. The moon is direct understanding.

### In Code

Buddha.js implements the Two Truths doctrine through `getConventionalTruth()` and `getUltimateTruth()` on every `Phenomenon`. This distinction *is* the finger-and-moon relationship:

- **Conventional truth** is the finger — how a phenomenon functions, what it's useful for, how to work with it practically. This is the level of the code.
- **Ultimate truth** is the moon — the recognition that the phenomenon is empty of inherent existence, arising only through conditions. This is what the code points toward.

The `Sunyata` class analyzes emptiness, but the analysis itself is another finger. Reading that `hasInherentExistence: false` is not the same as *seeing* emptiness.

### Example

```typescript
import { Rupa, Sunyata } from 'buddha-js';

const form = new Rupa();

// The finger — how form functions conventionally
const finger = form.getConventionalTruth();
// { level: 'conventional', description: 'Form is the physical aspect...', usefulFor: [...] }

// The moon — what form actually is
const moon = form.getUltimateTruth();
// { level: 'ultimate', description: 'Form arises from conditions...', transcends: [...] }

// Even the emptiness analysis is a finger
const emptiness = new Sunyata();
const insight = emptiness.examine(form);
// { isEmpty: true, hasInherentExistence: false, dependsOn: [...] }

// The object `insight` is not insight. It points toward it.
```

---

## The House on Fire (Lotus Sutra)

### The Teaching

A father returns home to find his house engulfed in flames. His children are inside, playing, unaware of the danger. He calls to them, but they're absorbed in their games and won't leave.

So he calls out: "Come outside! I have wonderful toy carts waiting for you!" The children rush out, excited about the carts. They are saved — not by understanding the nature of fire, but by a skillful simplification that met them where they were.

This is **upaya** — skillful means. Sometimes the full teaching is too much. A simplified tool that actually gets used is worth more than a complete system that overwhelms.

### In Code

The `PoisonArrow` class is the toy cart. It doesn't model all twelve links of dependent origination. It doesn't analyze the five aggregates or track karmic seeds. It does one thing: walk you through the Four Noble Truths applied to a specific, immediate suffering, in four steps.

The `buddha sit` CLI command is another toy cart — it wraps `PoisonArrow` in a terminal interface anyone can use. `FourNobleTruths.diagnose()` is the full system; `PoisonArrow` is the simplified version that meets you in the burning house.

### Example

```typescript
import { PoisonArrow } from 'buddha-js';

// The house is on fire — suffering is immediate
const arrow = new PoisonArrow('anxiety about the future');

// The toy cart — four simple steps, no philosophical overhead
while (!arrow.isComplete()) {
  const step = arrow.step();
  console.log(`${step.stage}: ${step.insight}`);
  // recognize: "The suffering 'anxiety about the future' is present and real..."
  // investigate: "Looking deeper into what sustains this suffering..."
  // release: "Seeing the possibility of this suffering ceasing..."
  // practice: "Taking the first step on the path..."
}

// The children are out of the house.
// Understanding can come later. Safety comes first.
```

---

## Conclusion

All three metaphors point to the same truth: **the map is not the territory.**

- The **Raft** says: use the tool, then let it go.
- The **Finger** says: look where the tool points, not at the tool itself.
- The **House on Fire** says: sometimes a simple tool that works *now* is better than a complete one that comes too late.

Buddha.js is all three. Use it to explore, understand, and practice. And when the understanding takes root — when you no longer need the models to see impermanence, unsatisfactoriness, and not-self — leave the raft on the shore.
````

**Step 2: Verify the document renders correctly**

Read back the file to confirm it was written correctly.

**Step 3: Commit**

```bash
git add docs/metaphor-guide.md
git commit -m "docs: add Metaphor Guide with Raft, Finger, and House on Fire"
```

---

### Task 2: Update docs/README.md and TODO.md

**Files:**
- Modify: `docs/README.md`
- Modify: `TODO.md`

**Step 1: Add the Metaphor Guide to `docs/README.md`**

After the Vipassana section (around line 38), add a new entry:

```markdown
### [Metaphor Guide: Raft, Finger, and Burning House](./metaphor-guide.md)

Three classic Buddhist metaphors applied to the library: when to use the tools, what they point toward, and why simplicity matters.

**Topics:**
- The Raft (Kullupama Sutta) — tools for crossing, not for carrying
- The Finger Pointing at the Moon — conventional truth vs ultimate truth
- The House on Fire (Lotus Sutra) — skillful means and the PoisonArrow
```

Also add a row to the philosophical foundation table:

```markdown
| Skillful Means (Upaya) | Simplified APIs / CLI wrappers |
```

**Step 2: Mark the TODO as complete**

In `TODO.md`, change:
```
- [ ] **Metaphor Guide**: A doc explaining key concepts using the "Raft", "Finger pointing at the Moon", and "House on Fire" metaphors.
```
To:
```
- [x] **Metaphor Guide**: A doc explaining key concepts using the "Raft", "Finger pointing at the Moon", and "House on Fire" metaphors.
```

**Step 3: Commit**

```bash
git add docs/README.md TODO.md
git commit -m "docs: add Metaphor Guide to docs index and mark TODO complete"
```
