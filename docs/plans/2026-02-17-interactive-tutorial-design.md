# Design: Interactive Tutorial — Building a Mind from Scratch

**Date:** 2026-02-17
**Status:** Approved

## Summary

A markdown tutorial (`docs/interactive-tutorial.md`) that walks the reader through constructing a Mind bottom-up: from a single MentalFactor, to the Mind container, to a meditating Being. Five steps, each building on the previous. Code blocks use TypeScript imports from `buddha-js`.

## File

`docs/interactive-tutorial.md` — added to `docs/README.md` listing.

## Structure

### Step 1: The Atom — MentalFactor
- Create a `MentalFactor`, activate/deactivate it, observe properties
- Explain quality (variable/unwholesome/wholesome), intensity, active state
- Show it extends `Phenomenon` (impermanent — arises and ceases)

### Step 2: Three Flavors — Wholesome, Unwholesome, Variable
- Create one of each type, show how quality categorizes mental experience
- Table of all 13 factors the Mind manages
- Buddhist concept: mind is colored by its factors

### Step 3: The Container — Mind
- Instantiate `Mind`, explore pre-built factors with `getFactor()`
- Activate wholesome factors, check `getState()` (calm, focused)
- Activate unwholesome factors, see state change
- Call `calm()`, observe recovery

### Step 4: Practice — Meditation Transforms the Mind
- Create a `Being` (which has a `Mind`)
- Call `being.meditate()` with different effort levels
- Observe mindfulness activation, calming of unwholesome factors
- Show insight generation based on mind state

### Step 5: What's Next
- Tease `Citta` (52 factors, 17-moment cognitive process)
- Link to existing docs and CLI

## What Changes

- Create: `docs/interactive-tutorial.md`
- Modify: `docs/README.md` (add listing entry)
- Modify: `TODO.md` (mark complete)

## What Doesn't Change

- No library code changes
- No test changes
