# Release Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make buddha-js publishable and presentable: license, correct npm packaging, MCP documentation, working lint, patched dependencies, and CI.

**Architecture:** No source-code changes — this phase touches only metadata, docs, tooling config, and the lockfile. Four tasks; tasks 1+2 and 3+4 may be batched into single dispatches (same-shape mechanical work).

**Tech Stack:** npm, ESLint 9 flat config + typescript-eslint, GitHub Actions.

**Spec:** The 2026-08-29 audit's "Missing for a public release" findings (recorded in the merged PR #2's context and the roadmap section of docs/superpowers/plans/2026-08-29-doctrinal-correctness-fixes.md).

## Global Constraints

- `npm run typecheck` and `npm run test:run` (239 tests) must still pass after every task.
- No changes to files under `src/` except where a lint fix is mechanical and behavior-preserving (prefer rule tuning over code churn; any src/ edit must be named in the report).
- Conventional-commit messages.
- Do not publish to npm; do not push. Local commits only.

---

### Task 1: LICENSE + package.json publish metadata

**Files:**
- Create: `LICENSE`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm pack --dry-run` lists `dist/**`, `LICENSE`, `README.md`, `package.json` and nothing else unintended; `prepublishOnly` guarantees all three builds exist before any publish.

- [ ] **Step 1:** Create `LICENSE` with the standard MIT license text, line 3: `Copyright (c) 2026 Askar Zhakenov`.

- [ ] **Step 2:** Edit `package.json`:
  - `"author": "Askar Zhakenov <askar@zhakenov.pro>"`
  - `"repository": { "type": "git", "url": "git+https://github.com/askarzh/Buddha.js.git" }`
  - `"homepage": "https://github.com/askarzh/Buddha.js#readme"`
  - `"bugs": { "url": "https://github.com/askarzh/Buddha.js/issues" }`
  - `"engines": { "node": ">=18" }`
  - Add script `"prepublishOnly": "npm run typecheck && npm run test:run && npm run build && npm run build:cli && npm run build:mcp"`

- [ ] **Step 3: Verify** — run `npm run typecheck && npm run test:run` (green), then `npm run build && npm run build:cli && npm run build:mcp`, then `npm pack --dry-run 2>&1 | tail -30`: confirm the tarball contains `dist/index.js`, `dist/index.mjs`, `dist/index.d.ts`, `dist/cli.mjs`, `dist/mcp.mjs`, `LICENSE`, `README.md`. Paste the file list into your report.

- [ ] **Step 4: Commit** — `git commit -m "chore: add MIT LICENSE and npm publish metadata with prepublishOnly guard"`

---

### Task 2: README MCP-server section + doc fixes

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** Fix the stale field reference in the Karma section (~line 365): `result?.feeling` → `result?.experienceQuality` (the real field on `KarmicResult`).

- [ ] **Step 2:** Add an `## MCP Server` section between the CLI section and the Claude Code Plugin section (match the README's existing heading/style conventions), containing:
  - One-paragraph intro: `buddha-mcp` exposes the full Being API as 13 MCP tools over stdio; state is shared with the CLI (`~/.buddha/beings/`, `BUDDHA_STATE_DIR` override).
  - Build + run: `npm run build:mcp` then `node dist/mcp.mjs`.
  - Configuration snippet (verbatim):
    ```json
    {
      "mcpServers": {
        "buddha-js": {
          "command": "node",
          "args": ["/path/to/buddha.js/dist/mcp.mjs"]
        }
      }
    }
    ```
    with a note that this works in Claude Desktop (`claude_desktop_config.json`) and Claude Code (`.mcp.json` or `claude mcp add buddha-js -- node /path/to/buddha.js/dist/mcp.mjs`).
  - A table of the 13 tools with one-line descriptions: `buddha_create_being`, `buddha_list_beings`, `buddha_delete_being`, `buddha_status`, `buddha_experience` (note the `valence` parameter), `buddha_act` (note: karmic quality is derived from `root`; no quality parameter), `buddha_karma_ripen`, `buddha_meditate`, `buddha_diagnose`, `buddha_inquiry`, `buddha_chain`, `buddha_koan`, `buddha_contemplate`.
  - A note: tools other than `buddha_create_being`/`buddha_list_beings` require an existing being; unknown names return `Being not found: "<name>"...` (this is deliberate — the CLI auto-creates, the MCP server does not).
  - Cross-check every tool name and behavior claim against `src/mcp/index.ts` before writing — do not document from memory.

- [ ] **Step 3: Verify** — `grep -n "experienceQuality\|## MCP Server" README.md` shows both changes; `grep -c "buddha_" README.md` ≥ 13.

- [ ] **Step 4: Commit** — `git commit -m "docs: add MCP server section to README; fix stale KarmicResult field reference"`

---

### Task 3: Working ESLint config

**Files:**
- Create: `eslint.config.mjs`
- Modify: `package.json` (lint script), possibly minimal mechanical fixes

- [ ] **Step 1:** Install dev dependencies: `npm install --save-dev eslint@^9 typescript-eslint@^8 @eslint/js`.

- [ ] **Step 2:** Create `eslint.config.mjs`:

```js
// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'examples/', 'docs/', 'coverage/'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // The serializer and simulation layers intentionally use `as any`
      // to restore protected state; revisit in the v0.2 serializer rework.
      '@typescript-eslint/no-explicit-any': 'off',
      // `_`-prefixed unused args are the project convention (see CLAUDE.md).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  }
);
```

- [ ] **Step 3:** Update the lint script: `"lint": "eslint src tests"` (flat config; no `--ext`).

- [ ] **Step 4:** Run `npm run lint`. Triage remaining errors: fix mechanical, behavior-preserving ones (unused imports, `let`→`const`); for any rule that fires broadly on intentional patterns, disable it in the config with a one-line comment stating why. Any `src/` edit must be listed in your report. Re-run until clean, then `npm run test:run` + `npm run typecheck` (still green).

- [ ] **Step 5: Commit** — `git commit -m "chore: add ESLint 9 flat config; make npm run lint pass"`

---

### Task 4: Dependency audit fix + CI workflow

**Files:**
- Modify: `package-lock.json` (via npm)
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1:** Run `npm audit fix` (WITHOUT `--force`). Then `npm run test:run && npm run typecheck` — must stay green. Run `npm audit 2>&1 | tail -5` and record the remaining vulnerability count in your report (the esbuild/vite dev-chain ones need `--force`/major bumps — leave them, note them).

- [ ] **Step 2:** Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:run
      - run: npm run build
      - run: npm run build:cli
      - run: npm run build:mcp
```

- [ ] **Step 3: Verify** — `npx yaml-lint` is not installed; instead validate with `node -e "const y=require('js-yaml')"` only if available, otherwise visually verify indentation and run `git diff --check` for whitespace errors. Full local equivalent: run the same commands the workflow runs (`npm run typecheck && npm run lint && npm run test:run && npm run build && npm run build:cli && npm run build:mcp`) and confirm all pass.

- [ ] **Step 4: Commit** — `git commit -m "chore: npm audit fix and GitHub Actions CI workflow"`

---

## Verification sweep (controller)

After all tasks: `npm run prepublishOnly` end-to-end (exercises everything), `npm pack --dry-run` file list sanity, `npm audit` remaining count noted.
