# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run typecheck     # TypeScript type checking
npm run build         # Build for distribution (CJS + ESM + types)
npm run dev           # Build in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint          # ESLint (note: no .eslintrc config yet)
npm run build:cli     # Build CLI to dist/cli.mjs
node dist/cli.mjs     # Run CLI (or: buddha <command> if installed globally)

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
| `eightfold-path/` | `PathFactor` base, 8 factor classes, `EightfoldPath` | The path of practice (grouped into `wisdom/`, `ethics/`, `meditation/`) |
| `dependent-origination/` | `Nidana` base, 12 link classes, `DependentOrigination` | Causal chain of becoming |
| `five-aggregates/` | `Skandha` base, 5 aggregate classes, `FiveAggregates` | Components of experience |
| `karma/` | `Intention`, `Karma`, `KarmicResult`, `KarmicStore`, `KarmicEventSystem` | Intentional action, results, seeds, ripening, and event-driven karma system |
| `emptiness/` | `Sunyata`, `ThreeNatures` | Emptiness analysis |
| `mind/` | `MentalFactor`, `Mind`, `Citta` | Mental factors, states, and Abhidhamma consciousness model |
| `koan/` | `KoanGenerator` | Zen koan presentation and dualistic thinking detection |
| `meditation/` | `MeditationTimer` | Real-time meditation session tracking with injectable clock |
| `cli/` | `buddha` CLI | Terminal interface with persistence and `--json` output (10 commands) |
| `plugin/` | Claude Code plugin | Skills and `/buddha` command for Claude Code integration |
| `simulation/` | `Being` | Integration class combining all concepts |
| `utils/` | `types`, `aliases` | Shared type definitions, utilities, and English aliases for Sanskrit terms |

### Key Patterns

1. **Base class inheritance**: Domain-specific base classes (`PathFactor`, `Nidana`, `Skandha`) extend `Phenomenon` and are extended by concrete implementations

2. **Composite containers**: Aggregate classes like `EightfoldPath`, `DependentOrigination`, `FiveAggregates` compose multiple instances and provide orchestration

3. **Type definitions**: `src/utils/types.ts` contains shared types (`Intensity`, `FeelingTone`, `KarmaQuality`, etc.)

4. **English aliases**: `src/utils/aliases.ts` re-exports core classes under accessible English names (e.g., `Dissatisfaction` for `Dukkha`, `Confusion` for `Avidya`). Both Sanskrit originals and English aliases are part of the public API.

5. **Persistence**: `Being` and `KarmicStore` implement `Serializable<T>` with `toJSON()`/`fromJSON()`. Function callbacks (ripening conditions) use a named condition registry — serialize the name, re-register the function after restore, call `rebindConditions()`. Data shape types are in `src/utils/types.ts`.

6. **Mind factor count**: `Mind` has 12 pre-configured factors (5 variable, 3 unwholesome, 4 wholesome). `Citta` has the full 52-factor Abhidhamma model.

### CLI

Built with Commander.js, @inquirer/prompts, and chalk v5. Separate build config in `tsup.cli.ts` (tsup doesn't support `--banner`/`--outExtension` as CLI flags). Output uses `.mjs` extension since project lacks `"type": "module"`.

**Persistence:** Beings are saved as JSON in `~/.buddha/beings/<name>.json` (override with `BUDDHA_STATE_DIR` env or `--state-dir` flag). Commands `inquiry`, `status`, `karma` load/save the persistent being. Use `--being <name>` for named profiles.

**JSON output:** All commands support `--json` for machine-readable output. Interactive commands accept flags for non-interactive use (e.g., `karma --json --quality wholesome --description "..." --intensity 7 --root non-greed`).

**Commander convention:** Action handlers use `(localOpts, cmd: Command)` pattern with `cmd.optsWithGlobals()` for global flags.

### TypeScript Configuration

Strict mode is enabled with `noUnusedLocals` and `noUnusedParameters`. Prefix unused parameters with underscore (`_param`).

## Conceptual Documentation

The `docs/` directory contains design documents exploring Buddhist-programming parallels:

- **[typed-dependency-graph.md](docs/typed-dependency-graph.md)** — Modeling the 12 nidanas as a compile-time typed graph
- **[momentariness-reactive-programming.md](docs/momentariness-reactive-programming.md)** — Kṣaṇikavāda and RxJS comparison
- **[vipassana-object-observation.md](docs/vipassana-object-observation.md)** — Vipassanā as non-reactive state observation
- **[metaphor-guide.md](docs/metaphor-guide.md)** — Raft, Finger, and Burning House metaphors mapped to library classes
- **[interactive-tutorial.md](docs/interactive-tutorial.md)** — Step-by-step guide building a Mind from MentalFactor to Being.meditate()

## Examples

The `examples/` directory contains interactive visualizations:

- **[interactive-demo/](examples/interactive-demo/)** — Comprehensive web demo showcasing all library features (meditation, karma, dependent origination, self-inquiry, Four Noble Truths)
- **[bhavacakra/](examples/bhavacakra/)** — Interactive Wheel of Samsara (Canvas-based, open index.html in browser)

## NotebookLM Reference

Use the **"Buddha Plain and Simple"** notebook via the `notebooklm-mcp` MCP server (ID: `9e43e48e-13ca-4d45-80ed-36739c4606db`) to query Buddhist source texts when implementing new concepts. Sources include *Buddhism Plain and Simple*, *Buddhist Philosophy: Essential Readings*, *The Foundations of Buddhism*, *Why Buddhism Is True*, and *Ранний буддизм*.

## Full Documentation

See **[README.md](README.md)** for complete API documentation with examples for all modules.
