# Buddha.js Context for Gemini

This file provides context and guidance for Gemini when working with the `buddha-js` repository.

## Project Overview

`buddha-js` is a TypeScript library that models Buddhist philosophical concepts using object-oriented patterns. It is not a religious tool but a philosophical modeling library that treats concepts like "Phenomena", "Karma", and "Dependent Origination" as programmable constructs.

### Core Philosophy & Architecture

The library is built around a few key architectural patterns that mirror Buddhist philosophy:

* **`Phenomenon` Base Class (`src/core/Phenomenon.ts`):** The foundational class for all conditioned things. It implements:
  * `ThreeMarks`: Impermanence (`impermanence`), Unsatisfactoriness (`unsatisfactoriness`), and Not-Self (`notSelf`).
  * `TwoTruthsExaminable`: Methods to view the object from "conventional" and "ultimate" perspectives.
  * Lifecycle methods: `arise()`, `cease()`, and condition tracking.
* **Module Structure:**
  * `core/`: Base abstractions (`Phenomenon`, `ThreeMarks`).
  * `four-noble-truths/`: Diagnostic framework (`Dukkha`, `Samudaya`, `Nirodha`, `Magga`).
  * `eightfold-path/`: Practice factors (`RightView`, `RightMindfulness`, etc.).
  * `dependent-origination/`: The 12-link causal chain (`Nidana` subclasses).
  * `five-aggregates/`: Components of a person (`Rupa`, `Vedana`, etc.).
  * `karma/`: Intentional action and result system (`Intention`, `KarmicStore`).
  * `mind/`: Consciousness and mental factors (`Mind`, `Citta`, Abhidhamma models).
  * `simulation/`: Integration class (`Being`) that combines all concepts.
  * `emptiness/`: Analysis of inherent existence (`Sunyata`).

## Development Workflow

### Key Commands

* **Test (Watch):** `npm test` (uses Vitest)
* **Test (Run Once):** `npm run test:run`
* **Type Check:** `npm run typecheck` (TypeScript)
* **Lint:** `npm run lint` (ESLint)
* **Build:** `npm run build` (uses `tsup` to generate CJS, ESM, and types)

### Running Specific Tests

* **Single File:** `npx vitest run tests/core/Phenomenon.test.ts`
* **Pattern Match:** `npx vitest run -t "should track arising"`

## Coding Conventions

* **Language:** TypeScript (Strict mode enabled).
* **Unused Parameters:** Prefix with an underscore (e.g., `_param`) to avoid linter errors.
* **Inheritance:** Most domain classes should extend `Phenomenon` or a specific subclass like `Nidana`, `PathFactor`, or `Skandha`.
* **Type Definitions:** Shared types (like `Intensity`, `FeelingTone`) are located in `src/utils/types.ts`.
* **Testing:** New features must include unit tests in the `tests/` directory, mirroring the source structure.

## Documentation Context

* **`README.md`:** Contains extensive examples and API documentation. Refer to this for usage patterns.
* **`docs/`:** Contains conceptual deep-dives (e.g., comparing Buddhist momentariness to Reactive Programming).
* **`examples/`:** Contains interactive demos (web-based) showing the library in action.
