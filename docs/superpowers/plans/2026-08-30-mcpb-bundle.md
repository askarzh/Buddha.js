# Claude Desktop MCPB Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package `buddha-mcp` as a one-click `.mcpb` bundle for Claude Desktop: manifest + bundled server + build script + docs + CI validation.

**Architecture:** MCPB is justified (the server persists local state in `~/.buddha/beings/`, shared with the CLI — genuinely local). The existing tsup MCP build already produces a fully self-contained ESM bundle (`dist/mcp.mjs`, no external requires), so the MCPB is just: `mcpb/manifest.json` + a copy of that bundle at `mcpb/server/index.mjs` + `mcpb pack`. The `.mjs` extension is REQUIRED (the bundle dir has no package.json, so a `.js` entry would be treated as CJS and fail — the bundle is ESM). State dir is exposed as install-time user config mapped to the `BUDDHA_STATE_DIR` env var the server already honors.

**Tech Stack:** @anthropic-ai/mcpb CLI (manifest v0.4), tsup, GitHub Actions.

**Spec:** Roadmap phase 4 ("Claude Desktop MCPB") from the approved audit roadmap; MCPB packaging rules from the mcp-server-dev:build-mcpb skill.

## Global Constraints

- `npm run typecheck`, `npm run lint`, `npm run test:run` (241 tests) stay green.
- No `src/` changes — packaging, docs, and CI only.
- The packed `.mcpb` and the staged `mcpb/server/` are build artifacts: gitignored. Only `mcpb/manifest.json` is tracked.
- Security posture unchanged: the server only reads/writes its state dir, with being names validated by `^[a-zA-Z0-9_-]+$` in `StateManager.beingPath` — the manifest gets no new capabilities.
- Conventional commits; no push/publish.

---

### Task 1: MCPB scaffold, build script, docs, CI (single batched task)

**Files:**
- Create: `mcpb/manifest.json`
- Modify: `package.json` (build:mcpb script), `.gitignore`, `README.md` (Claude Desktop section), `.github/workflows/ci.yml`, `CLAUDE.md` (Commands section)

**Interfaces:**
- Produces: `npm run build:mcpb` → builds the MCP server, stages `mcpb/server/index.mjs`, runs `npx @anthropic-ai/mcpb pack mcpb dist/buddha-js.mcpb` (pack validates the manifest); output `dist/buddha-js.mcpb`.

- [ ] **Step 1:** Create `mcpb/manifest.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/anthropics/mcpb/main/schemas/mcpb-manifest-v0.4.schema.json",
  "manifest_version": "0.4",
  "name": "buddha-js",
  "display_name": "Buddha.js",
  "version": "0.2.0",
  "description": "Buddhist philosophy tools: meditation, karma, koans, self-inquiry, and the Poison Arrow method — 14 tools over a persistent simulated being.",
  "author": { "name": "Askar Zhakenov", "email": "askar@zhakenov.pro" },
  "homepage": "https://github.com/askarzh/Buddha.js",
  "license": "MIT",
  "server": {
    "type": "node",
    "entry_point": "server/index.mjs",
    "mcp_config": {
      "command": "node",
      "args": ["${__dirname}/server/index.mjs"],
      "env": {
        "BUDDHA_STATE_DIR": "${user_config.stateDir}"
      }
    }
  },
  "user_config": {
    "stateDir": {
      "type": "directory",
      "title": "State directory",
      "description": "Where beings are saved as JSON (shared with the buddha CLI if installed).",
      "default": "${HOME}/.buddha",
      "required": false
    }
  },
  "compatibility": {
    "claude_desktop": ">=1.0.0",
    "platforms": ["darwin", "win32", "linux"]
  }
}
```
If `mcpb validate` rejects any field name (schema drift), adapt to the validator's schema and record the deviation in your report.

- [ ] **Step 2:** Add to package.json scripts:
`"build:mcpb": "npm run build:mcp && mkdir -p mcpb/server && cp dist/mcp.mjs mcpb/server/index.mjs && npx --yes @anthropic-ai/mcpb pack mcpb dist/buddha-js.mcpb"`
(If the pack CLI's argument order differs — check `npx @anthropic-ai/mcpb pack --help` — adapt and note it.)

- [ ] **Step 3:** Add to `.gitignore`: `mcpb/server/` and `*.mcpb` (dist/ is already ignored). `mcpb/manifest.json` stays tracked — confirm with `git check-ignore mcpb/manifest.json; echo "exit=$?"` → exit 1.

- [ ] **Step 4:** Run `npm run build:mcpb`. Then smoke-test the STAGED entry exactly as the manifest would launch it, with a temp state dir:
initialize → notifications/initialized → tools/list over stdio against `node mcpb/server/index.mjs` with `BUDDHA_STATE_DIR=$(mktemp -d)` → expect 14 tools including `buddha_sit`. Paste the tool list and the pack output (bundle size, validation OK) into your report.

- [ ] **Step 5:** README.md — in the MCP Server section, add a "Claude Desktop (one-click)" subsection: build with `npm run build:mcpb`, then open/drag `dist/buddha-js.mcpb` onto Claude Desktop (Settings → Extensions); the installer shows a folder picker for the state directory (default `~/.buddha`, shared with the CLI). Note that the manual JSON config remains available for Claude Code. CLAUDE.md Commands block: add `npm run build:mcpb   # Package Claude Desktop bundle to dist/buddha-js.mcpb`.

- [ ] **Step 6:** `.github/workflows/ci.yml` — append one step after the plugin-drift check: `- run: npm run build:mcpb` (validates the manifest and proves the bundle packs on every push).

- [ ] **Step 7: Verify** — `npm run typecheck && npm run lint && npm run test:run` green; `git status` shows no unintended tracked artifacts (`git ls-files mcpb/` → only `mcpb/manifest.json`).

- [ ] **Step 8: Commit** — `git commit -m "feat(mcpb): package buddha-mcp as a one-click Claude Desktop bundle"`

---

## Verification sweep (controller)

Green suite; `dist/buddha-js.mcpb` exists after `npm run build:mcpb`; staged-entry smoke test 14 tools; only manifest tracked under mcpb/.
