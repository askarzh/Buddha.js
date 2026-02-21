# Code Style & Conventions

## TypeScript Configuration
- **Strict mode** enabled with all strict flags
- `noUnusedLocals: true` — no unused local variables
- `noUnusedParameters: true` — prefix unused params with underscore (`_param`)
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `strictNullChecks: true`
- `strictPropertyInitialization: true`
- Target: ES2022, Module: ESNext, Resolution: bundler

## Naming Conventions
- **Classes**: PascalCase, typically named after Buddhist concepts (Sanskrit names like `Dukkha`, `Nidana`)
- **English aliases**: Exported from `src/utils/aliases.ts` (e.g., `Dissatisfaction` for `Dukkha`)
- **Interfaces**: PascalCase with descriptive names (`BeingState`, `MeditationResult`, `SufferingResponse`)
- **Type aliases**: PascalCase, often using TypeScript literal types (`Intensity`, `KarmaQuality`, `FeelingTone`)
- **Methods**: camelCase, descriptive (`examineImpermanence`, `observeDependentOrigination`)
- **Private fields**: Prefixed with underscore (`_hasArisen`, `_hasCeased`, `_mindfulnessLevel`)
- **File names**: PascalCase for classes matching the class name, camelCase for utility files

## Documentation Style
- JSDoc block comments on classes with philosophical context
- No inline comments unless logic is non-obvious
- Sanskrit terms explained in comments where first introduced

## Module Pattern
- Each module has its own `index.ts` barrel file for re-exports
- Top-level `src/index.ts` re-exports all modules
- Tests mirror source structure in `tests/` directory

## CLI Conventions
- Commander.js action handlers use `(localOpts, cmd: Command)` pattern
- `cmd.optsWithGlobals()` for accessing global flags
- All commands support `--json` for machine-readable output
- Interactive commands accept flags for non-interactive use
- CLI outputs `.mjs` extension (project lacks `"type": "module"`)

## Persistence Conventions
- `Serializable<T>` interface with `toJSON()` / static `fromJSON()`
- Function callbacks use named condition registry (serialize name, re-register function, call `rebindConditions()`)
- Data shape types (suffixed `Data`) defined in `src/utils/types.ts`
