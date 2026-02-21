# Buddha.js — Project Overview

## Purpose
A TypeScript library that programmatically models Buddhist philosophical concepts as an object-oriented type system. It provides both a library API and a CLI for interacting with Buddhist concepts from the terminal.

## Tech Stack
- **Language**: TypeScript (strict mode, ES2022 target)
- **Bundler**: tsup (CJS + ESM + types for library; ESM `.mjs` for CLI)
- **Test framework**: Vitest (node environment, globals enabled)
- **CLI**: Commander.js + @inquirer/prompts + chalk v5
- **Package manager**: npm
- **License**: MIT
- **Version**: 0.1.0

## Architecture

Everything is built on `Phenomenon` (src/core/Phenomenon.ts), the base class for all conditioned phenomena implementing:
- `ThreeMarksExaminable` (impermanence, unsatisfactoriness, not-self)
- `TwoTruthsExaminable` (conventional/ultimate truth)
- Dependent arising (conditions, arising, cessation)

### Module Structure
| Module | Key Classes | Purpose |
|--------|-------------|---------|
| `core/` | `Phenomenon`, `ThreeMarks`, `TwoTruths` | Foundational abstractions |
| `four-noble-truths/` | `Dukkha`, `Samudaya`, `Nirodha`, `Magga`, `FourNobleTruths`, `TwoArrows` | Suffering, origin, cessation, path |
| `eightfold-path/` | `PathFactor` base, 8 factor classes, `EightfoldPath` | Path of practice (wisdom/, ethics/, meditation/) |
| `dependent-origination/` | `Nidana` base, 12 link classes, `DependentOrigination` | Causal chain of becoming |
| `five-aggregates/` | `Skandha` base, 5 aggregate classes, `FiveAggregates` | Components of experience |
| `karma/` | `Intention`, `Karma`, `KarmicResult`, `KarmicEventSystem` | Action, results, seeds, ripening |
| `emptiness/` | `Sunyata`, `ThreeNatures` | Emptiness analysis |
| `mind/` | `MentalFactor`, `Mind`, `Citta` | Mental factors, states, Abhidhamma model |
| `koan/` | `KoanGenerator` | Zen koan presentation |
| `meditation/` | `MeditationTimer` | Real-time meditation session tracking |
| `simulation/` | `Being`, `BeingSerializer`, `PoisonArrow` | Integration class combining all concepts |
| `cli/` | CLI commands (10 commands) | Terminal interface with persistence |
| `utils/` | `types.ts`, `aliases.ts` | Shared types, English aliases for Sanskrit terms |

### Key Patterns
1. **Base class inheritance**: `Phenomenon` → domain base (`PathFactor`, `Nidana`, `Skandha`) → concrete class
2. **Composite containers**: `EightfoldPath`, `DependentOrigination`, `FiveAggregates` orchestrate children
3. **Dual naming**: Both Sanskrit originals (`Dukkha`) and English aliases (`Dissatisfaction`) are public API
4. **Persistence**: `Being` and `KarmicStore` implement `Serializable<T>` with `toJSON()`/`fromJSON()`
5. **CLI persistence**: Beings saved as JSON in `~/.buddha/beings/<name>.json`
