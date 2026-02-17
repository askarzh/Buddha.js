# Design: Metaphor Guide

**Date:** 2026-02-17
**Status:** Approved

## Summary

A single document (`docs/metaphor-guide.md`) explaining three classic Buddhist metaphors and how they map to Buddha.js library concepts. Hybrid style: conceptual narrative + concrete code examples. Each metaphor follows the same structure: the original teaching, what it means in code, and a short example.

## File

`docs/metaphor-guide.md` — added to `docs/README.md` listing.

## Structure

1. **Introduction** — The common thread: all three metaphors warn against confusing the tool for the goal. Buddha.js models are rafts, fingers, and toy carts — useful means, not ends.

2. **The Raft (Kullupama Sutta)** — The dharma is a raft for crossing the river, to be left behind once you reach the other shore.
   - Maps to: `EightfoldPath`, `FourNobleTruths`, `DependentOrigination` — tools for understanding, not objects to cling to.
   - Code: Develop an `EightfoldPath`, show that the insight matters more than the object's state.

3. **The Finger Pointing at the Moon** — A finger pointing at the moon is useful for finding the moon, but staring at the finger misses the point.
   - Maps to: `Phenomenon`, `TwoTruths`, `Sunyata` — conventional truth (the finger) vs ultimate truth (the moon).
   - Code: `getConventionalTruth()` vs `getUltimateTruth()` — the conventional is the finger, the ultimate points toward the moon.

4. **The House on Fire (Lotus Sutra)** — A father lures children from a burning house with toy carts. Urgency requires simplified, skillful means.
   - Maps to: `FourNobleTruths.diagnose()`, `PoisonArrow`, CLI — "skillful means" (upaya) that simplify complex reality into actionable steps.
   - Code: `PoisonArrow` as skillful means — it doesn't model all of Buddhist philosophy, just the urgent part.

5. **Conclusion** — Links back to the README's existing Raft/Finger mention. The library is a means, not an end.

## What Changes

- Create: `docs/metaphor-guide.md`
- Modify: `docs/README.md` (add listing entry)
- Modify: `TODO.md` (mark complete)

## What Doesn't Change

- No library code changes
- No test changes
- README.md main content unchanged (just references the new doc)
