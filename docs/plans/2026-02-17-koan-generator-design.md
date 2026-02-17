# Design: Koan Generator

**Date:** 2026-02-17
**Status:** Approved

## Summary

Add a `KoanGenerator` class in a new `src/koan/` module that presents classic Zen koans and evaluates user responses for dualistic thinking traps. Ships with a built-in collection of ~8-10 classic koans. The interaction model mirrors the master-student dynamic: `present()` a koan, then `contemplate()` it by submitting a response and receiving feedback on detected thinking patterns.

## Location

`src/koan/KoanGenerator.ts` — new standalone module, no dependency on Phenomenon, Being, Mind, or other modules.

`src/koan/koans.ts` — built-in koan data as a static array.

## Types

Added to `src/utils/types.ts`:

```ts
interface Koan {
  id: string;
  title: string;           // e.g. "Zhaozhou's Dog"
  case: string;            // The koan scenario/dialogue
  source: string;          // e.g. "Gateless Gate, Case 1"
  hint?: string;           // Optional pointer (not an answer)
}

type DualismTrap =
  | 'binary'          // yes/no, true/false, exists/doesn't
  | 'intellectual'    // analyzing rather than experiencing
  | 'seeking'         // looking for "the answer"
  | 'nihilistic'      // "nothing matters" / "it's all empty"
  | 'grasping';       // clinging to a concept as THE answer

interface ContemplationResult {
  koan: Koan;
  response: string;
  trapsDetected: DualismTrap[];
  reflection: string;       // feedback pointing beyond the trap
  isNonDual: boolean;       // no traps detected
}
```

## Class API

```ts
class KoanGenerator {
  present(): Koan                              // random koan from collection
  present(id: string): Koan                    // specific koan by ID
  contemplate(koanId: string, response: string): ContemplationResult
  getCollection(): readonly Koan[]             // all available koans
}
```

## Built-in Koan Collection

~8-10 classics:

1. **Zhaozhou's Dog (Mu)** — "Does a dog have Buddha-nature?" "Mu."
2. **One Hand Clapping** — Hakuin's "What is the sound of one hand?"
3. **The Stone in the Mind** — Is the stone inside or outside your mind?
4. **The Flag and the Wind** — Is it the flag moving or the wind?
5. **Bodhidharma's Marrow** — Express your understanding without words
6. **Nansen's Cat** — Nansen cuts the cat; Zhaozhou puts sandals on his head
7. **The Fan and the Wind** — Why use a fan if the wind is everywhere?
8. **The Original Face** — What was your face before your parents were born?

## Dualism Detection

The `contemplate()` method checks responses for common traps:

| Trap | Detection Pattern |
|------|------------------|
| `binary` | Response is essentially "yes", "no", "both", "neither", or binary framing |
| `intellectual` | Lengthy explanation, philosophical analysis, uses "because", "means that" |
| `seeking` | Asks "is this right?", "what's the answer?", hedging language |
| `nihilistic` | "nothing", "doesn't matter", "no point", "emptiness" as a concept |
| `grasping` | Definitive claims: "the answer is", "it represents", "the meaning is" |

When no traps detected, `isNonDual` is true — but the reflection still doesn't confirm "correctness" (that would recreate duality).

## Wiring

- Exported from `src/koan/index.ts`
- Added to `src/index.ts` barrel export
- English alias `Riddle` in `src/utils/aliases.ts`
- Tests in `tests/koan/KoanGenerator.test.ts` covering present(), contemplate(), and trap detection
