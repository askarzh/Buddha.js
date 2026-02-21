# Suggested Commands

## Build
```bash
npm run build           # Build library (CJS + ESM + types) via tsup
npm run build:cli       # Build CLI to dist/cli.mjs (separate tsup config: tsup.cli.ts)
npm run dev             # Build library in watch mode
```

## Test
```bash
npm run test:run        # Run all tests once (204 tests, 15 files)
npm test                # Run tests in watch mode
npm run test:coverage   # Run tests with v8 coverage report
npx vitest run tests/core/Phenomenon.test.ts   # Run a single test file
npx vitest run -t "should track arising"        # Run tests matching a pattern
```

## Type Checking & Linting
```bash
npm run typecheck       # TypeScript type checking (tsc --noEmit)
npm run lint            # ESLint (note: no .eslintrc config yet)
```

## Run CLI
```bash
node dist/cli.mjs               # Run CLI directly
node dist/cli.mjs --help         # Show CLI help
node dist/cli.mjs status         # Check being status
node dist/cli.mjs karma --json   # Machine-readable output
```

## System Utilities
```bash
git status              # Check git state
git log --oneline -10   # Recent commits
ls src/                 # List source modules
```
