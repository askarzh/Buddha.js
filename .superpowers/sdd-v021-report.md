# v0.2.1 fix batch report

Baseline: 281/281 tests, typecheck/lint clean. Final: 291/291 tests, typecheck/lint clean.

## Fix 1 — isPartial always true
File: `src/karma/KarmicEventSystem.ts:538` (createVipaka).
Change: `isPartial: seed.timesRipened < seed.maxRipenings` → `seed.timesRipened + 1 < seed.maxRipenings` (reflects the state *after* the pending increment in `ripenSeed`, rather than the stale pre-increment value).
RED: added two tests in `tests/karma/KarmicStore.test.ts` ("Vipaka isPartial reflects post-ripening state"). Ran on unmodified `createVipaka` first — confirmed the "maxRipenings: 2" case failed (`isPartial` was `true` on both ripenings instead of `true` then `false`).
GREEN: `npx vitest run tests/karma/KarmicStore.test.ts` → 4/4 pass.

## Fix 2 — per-slug habitual-accumulation rebind
File: `src/simulation/Being.ts`:
- `buildSeedConditions` (~line 305): condition name changed to `habitual-accumulation:${slug}` (description unchanged).
- `registerRipeningConditions` (~line 178): kept `habitual-accumulation` (no suffix) as a legacy fallback for old saves, improved to exclude structural tags (`act`, `cognize`, `incarnation:*`, the seed's own root) from its tag-count scan; added a loop that enumerates the restored store's seeds' condition names for any `habitual-accumulation:<slug>` and registers a closure over that slug via `countDistinctPlantings(slug)`.
RED: stashed `src/simulation/Being.ts` and reran `tests/simulation/Being.persistence.test.ts` — the new "rebinds habitual-accumulation per-slug..." test failed with `writeHabitual` evaluating `true` (v0.2 store-wide fallback cross-pollution — write-code seeds looked habitual because walk-the-dog seeds shared the count).
GREEN: restored fix, `npx vitest run tests/simulation/Being.persistence.test.ts` → 14/14 pass (walk-the-dog group `true`, write-code group `false`).
Also updated two pre-existing tests in `tests/simulation/Being.cognize.test.ts` that looked up the condition by exact name `'habitual-accumulation'` to `c.name?.startsWith('habitual-accumulation')` — required because the condition name legitimately changed by this fix; not a pinned-behavior conflict (the assertions on `.check()` outcomes are unchanged).

## Fix 3 — alias duplicates in getActiveCetasikaNames
File: `src/mind/Citta.ts:478` (getActiveCetasikaNames). Deduped via `Set<MentalFactor>` over object identity, keeping the first-encountered key (map iteration order means canonical Pali keys like `lobha` win over English aliases like `greed`).
RED: new test in `tests/mind/Citta.test.ts` ("does not list an active cetasika twice...") failed with `TypeError: Cannot read properties of undefined` against the unfixed code path once the test's structure was corrected to inspect `result.moments` (VithiResult doesn't itself carry `cetasikas`; moments do) — then failed with 2 matches instead of 1 once pointed at the right field.
GREEN: `npx vitest run tests/mind/Citta.test.ts` → 10/10 pass.

## Fix 4 — slugOf can return undefined
File: `src/simulation/Being.ts`:
- `slugOf` (~line 360): return type changed from `string | undefined` to `string`; falls back to `seed.id` when no description-derived tag survives the structural-tag filter.
- Added `Being.slugify()` static helper (trims leading/trailing dashes after collapsing non-alphanumerics) and switched both `plantSeedFromAct` and `plantSeedsFromJavanas` to use it (spec named `plantSeedFromAct`'s slug explicitly; applied to both call sites for consistency since they share the same slug logic).
RED: dash-trim test ("trims leading/trailing dashes...") failed on unmodified code — `getSeedsByTag('walk-the-dog')` returned 2 seeds instead of 3 (the punctuated description slugified to a leading/trailing-dash variant and didn't share the tag). The structural-tag-name test ("act" description) did NOT show a RED/GREEN difference — see Deviation below.
GREEN: both tests pass after the fix; `npx vitest run tests/simulation/Being.cognize.test.ts` → 8/8 pass.
**Deviation**: the spec's suggested test ("act with description 'act' → no crash... habitual counting treats it as its own group") turned out not to be a true regression test — the only caller of `slugOf` (`pickShapingSeed`) already guards `if (!slug) continue`, so `undefined` was silently skipped from grouping both before and after the fix (never crashed, never falsely grouped). Kept the test as a documentation-level regression guard (`expect(() => being.rebirth()).not.toThrow()`), but the primary observable fix is the return-type strengthening (compile-time) plus the dash-trimming behavior, which the second test actually exercises RED→GREEN.

## Fix 5 — unwholesome karma can never be 'strong'
File: `src/mind/Citta.ts:363` (assessKarmicImpact). Now returns `'strong'` when wisdom is active OR any unwholesome root cetasika (`greed`/`lobha`, `aversion`/`dosa`, `delusion`/`moha`) is active with `intensity >= 7`; else `'weak'`.
Checked `grep -rn karmicImpact tests/` before the fix — no test pinned the old wisdom-only behavior.
RED: two new tests in `tests/mind/Citta.test.ts` — "marks unwholesome karma as strong..." failed (`'weak'` received) on unmodified code.
GREEN: both directions pass (greed@8 → strong; greed@5 → weak). `npx vitest run tests/mind/Citta.test.ts` → 10/10 pass.

## Fix 6 — kusala seeds hardcode root 'non-delusion'
File: `src/simulation/Being.ts`: added `determineActiveWholesomeRoot()` (mirrors the existing `determineActiveUnwholesomeRoot`), comparing intensities of `alobha`, `adosa`, and an "amoha stand-in" (max of `wisdom`/`mindfulness` intensities) on citta's cetasika map (confirmed the real keys via `initializeUniversalCetasikas` — `alobha`/`adosa` are real Pali keys, `wisdom`/`mindfulness` are the existing English aliases for `paññā`/`sati`). `plantSeedsFromJavanas` now calls this for kusala javanas instead of hardcoding `'non-delusion'`.
RED: new test in `tests/simulation/Being.cognize.test.ts` ("kusala cognize seeds derive their root...") failed on unmodified code — root was `'non-delusion'` instead of `'non-greed'` after activating `alobha` at intensity 9.
GREEN: `npx vitest run tests/simulation/Being.cognize.test.ts` → 8/8 pass.

## Fix 7 — CLI status parity
Files:
- `src/simulation/Being.ts`: added public `getSeedStats()` returning `{ balance, byState, byTiming, incarnation }` (same shape the MCP handler built inline).
- `src/mcp/handlers.ts`: `getStatus` now calls `being.getSeedStats()` instead of duplicating the balance/byState/byTiming computation.
- `src/cli/commands/status.ts`: `status --json` output gains a `seeds: being.getSeedStats()` field.
Pure addition (n/a for RED) for `getSeedStats()` itself — new test in `tests/simulation/Being.persistence.test.ts` ("getSeedStats > returns the balance/byState/byTiming/incarnation shape...") verifies the shape directly.
GREEN: MCP handler tests (`tests/mcp/handlers.test.ts`, including the pre-existing "getStatus includes a seeds section" test) still pass unchanged — 27/27. No dedicated CLI-level test existed for `status.ts` before this change (only `tests/cli/state.test.ts` for persistence), and the spec only required the `Being.getSeedStats()` shape test + MCP handler parity, so none was added.

## Plugin rebuild
`npm run build:plugin` rerun after all source fixes (Being.ts and Citta.ts are bundled into `plugin/dist/mcp.mjs`). `plugin/.claude-plugin/plugin.json` bumped `0.3.0` → `0.3.1`. `git status` shows `plugin/dist/mcp.mjs` and `plugin/.claude-plugin/plugin.json` as the only plugin-related diffs — bundle is fresh, no drift.

## Final verification
- `npm run test:run` → 291/291 pass (281 baseline + 10 new).
- `npm run typecheck` → clean.
- `npm run lint` → clean.
