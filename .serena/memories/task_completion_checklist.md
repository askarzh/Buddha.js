# Task Completion Checklist

When a coding task is completed, run the following checks:

## 1. Type Checking
```bash
npm run typecheck
```
Must pass with zero errors. Pay attention to:
- Unused variables/parameters (prefix with `_` if intentionally unused)
- Strict null checks
- Missing return types

## 2. Tests
```bash
npm run test:run
```
All 204+ tests must pass. If new functionality was added, corresponding tests should exist in `tests/` mirroring the source structure.

## 3. Build
```bash
npm run build
```
Library build must succeed (CJS + ESM + types).

If CLI was modified:
```bash
npm run build:cli
```

## 4. Code Review
- Ensure new classes extending `Phenomenon` implement required interfaces
- Verify English aliases are added to `src/utils/aliases.ts` if new Sanskrit-named classes were created
- Check that barrel `index.ts` files export new symbols
- Confirm `src/index.ts` exports the new module
- If persistence is involved, verify `toJSON()`/`fromJSON()` roundtrip works
