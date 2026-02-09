# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run typecheck     # TypeScript type checking
npm run build         # Build for distribution (CJS + ESM + types)
npm run dev           # Build in watch mode

# Run a single test file
npx vitest run tests/core/Phenomenon.test.ts

# Run tests matching a pattern
npx vitest run -t "should track arising"
```

## Architecture

Buddha.js models Buddhist concepts as an object-oriented TypeScript library. All concepts are built on a foundational type system.

### Core Foundation

**`Phenomenon`** (src/core/Phenomenon.ts) is the base class for all conditioned phenomena. It implements:
- `ThreeMarks` interface (impermanence, unsatisfactoriness, notSelf)
- `TwoTruthsExaminable` interface (conventional/ultimate truth perspectives)
- Dependent arising: tracks conditions, arising, and cessation

Most domain classes extend `Phenomenon` or use it as a building block.

### Module Structure

| Module | Key Classes | Purpose |
|--------|-------------|---------|
| `core/` | `Phenomenon`, `ThreeMarks`, `TwoTruths` | Foundational abstractions |
| `four-noble-truths/` | `Dukkha`, `Samudaya`, `Nirodha`, `Magga`, `FourNobleTruths` | Suffering, origin, cessation, path |
| `eightfold-path/` | `PathFactor` base, 8 factor classes, `EightfoldPath` | The path of practice |
| `dependent-origination/` | `Nidana` base, 12 link classes, `DependentOrigination` | Causal chain of becoming |
| `five-aggregates/` | `Skandha` base, 5 aggregate classes, `FiveAggregates` | Components of experience |
| `karma/` | `Intention`, `Karma`, `KarmicResult`, `KarmicStore` | Intentional action, results, and event-driven karma system |
| `emptiness/` | `Sunyata`, `ThreeNatures` | Emptiness analysis |
| `mind/` | `MentalFactor`, `Mind`, `Citta` | Mental factors, states, and Abhidhamma consciousness model |
| `simulation/` | `Being` | Integration class combining all concepts |
| `utils/` | `types` | Shared type definitions and utilities |

### Key Patterns

1. **Base class inheritance**: Domain-specific base classes (`PathFactor`, `Nidana`, `Skandha`) extend `Phenomenon` and are extended by concrete implementations

2. **Composite containers**: Aggregate classes like `EightfoldPath`, `DependentOrigination`, `FiveAggregates` compose multiple instances and provide orchestration

3. **Type definitions**: `src/utils/types.ts` contains shared types (`Intensity`, `FeelingTone`, `KarmaQuality`, etc.)

### TypeScript Configuration

Strict mode is enabled with `noUnusedLocals` and `noUnusedParameters`. Prefix unused parameters with underscore (`_param`).

## Conceptual Documentation

The `docs/` directory contains design documents exploring Buddhist-programming parallels:

- **[typed-dependency-graph.md](docs/typed-dependency-graph.md)** — Modeling the 12 nidanas as a compile-time typed graph
- **[momentariness-reactive-programming.md](docs/momentariness-reactive-programming.md)** — Kṣaṇikavāda and RxJS comparison
- **[vipassana-object-observation.md](docs/vipassana-object-observation.md)** — Vipassanā as non-reactive state observation

## Examples

The `examples/` directory contains interactive visualizations:

- **[interactive-demo/](examples/interactive-demo/)** — Comprehensive web demo showcasing all library features (meditation, karma, dependent origination, self-inquiry, Four Noble Truths)
- **[bhavacakra/](examples/bhavacakra/)** — Interactive Wheel of Samsara (Canvas-based, open index.html in browser)

## Full Documentation

See **[README.md](README.md)** for complete API documentation with examples for all modules.
