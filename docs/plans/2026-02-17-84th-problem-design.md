# Design: "84th Problem" Helper — TwoArrows Class

**Date:** 2026-02-17
**Status:** Approved

## Summary

Add a `TwoArrows` class to `src/four-noble-truths/` that models the Buddhist "two arrows" teaching: the distinction between unavoidable pain (first arrow) and the suffering added through mental resistance (second arrow). The "84th problem" is the problem of not wanting to have problems — the second arrow itself.

## Location

`src/four-noble-truths/TwoArrows.ts` — extends `Phenomenon`, alongside `Dukkha`, `Samudaya`, `Nirodha`, `Magga`.

## Types

Added to `src/utils/types.ts`:

```ts
interface ArrowInput {
  pain: string;              // raw, unavoidable painful experience
  mentalReactions: string[]; // resistance, craving, aversion layered on top
}

interface ArrowAnalysis {
  firstArrow: { description: string; isUnavoidable: true };
  secondArrow: { reactions: string[]; count: number; isOptional: true };
  totalArrows: 'one' | 'two';
  isEightyFourthProblem: boolean; // true when second arrow is present
  insight: string;
}
```

## Class API

```ts
class TwoArrows extends Phenomenon {
  analyze(input: ArrowInput): ArrowAnalysis
  hasRecognizedSecondArrow(): boolean   // true if any past analysis found a 2nd arrow
  getAnalysisCount(): number
  getConventionalTruth(): ConventionalTruth
  getUltimateTruth(): UltimateTruth
}
```

Tracks analysis history internally (like `Dukkha` tracks `recognizedTypes`).

## Wiring

- Exported from `src/four-noble-truths/index.ts`
- English alias `EightyFourthProblem` added to `src/utils/aliases.ts`
- Tests in `tests/four-noble-truths/TwoArrows.test.ts`

## Insight Logic

- No mental reactions → `totalArrows: 'one'`, `isEightyFourthProblem: false`
- Mental reactions present → `totalArrows: 'two'`, `isEightyFourthProblem: true`
- Insight string explains the distinction and points toward the second arrow as optional
