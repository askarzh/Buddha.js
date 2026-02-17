# Design: CLI Persistence & Claude Code Plugin

**Date:** 2026-02-18
**Status:** Approved

## Summary

Enhance the Buddha.js CLI with persistence (save/restore Being state between runs) and `--json` output, then package all commands as a Claude Code plugin with auto-activating skills.

## Architecture

**Approach:** CLI-first with `--json` output. Skills call `buddha <cmd> --json` via Bash and present results conversationally. Single source of truth for behavior lives in the CLI commands.

## Part 1: CLI Persistence Layer

### State Directory

- Default: `~/.buddha/`
- Override: `BUDDHA_STATE_DIR` env var or `--state-dir` global flag
- Priority: `--state-dir` > `BUDDHA_STATE_DIR` > `~/.buddha/`

### Named Beings

Each being saved as `<state-dir>/beings/<name>.json`. Default name is `"default"`. Global `--being <name>` flag switches profiles.

### State Manager (`src/cli/utils/state.ts`)

- `loadBeing(name): Being` — loads from JSON file, returns fresh `Being()` if none exists
- `saveBeing(name, being): void` — writes `being.toJSON()` to disk
- `listBeings(): string[]` — lists saved being names
- `deleteBeing(name): void` — removes a saved being
- `getStateDir(): string` — resolves state directory from flag > env > default

### Persisted Commands

`inquiry`, `status`, and `karma` — the three that create `Being()` instances. They load at start, save at end. `meditate` stays standalone (uses `MeditationTimer`, not `Being`).

### New Management Commands

- `buddha beings` — list saved beings
- `buddha beings delete <name>` — delete a being
- `buddha reset` — reset default being to fresh state

## Part 2: `--json` Output Mode

### Global Flag

`--json` on the program level. When passed, all commands output structured JSON to stdout. No interactive prompts in JSON mode.

### JSON Output Contract

```json
{
  "command": "inquiry",
  "being": "default",
  "result": { ... },
  "state": { "mindfulness": 3, "karmicActions": 5 }
}
```

`result` is command-specific. `state` is a brief Being summary (only for Being-based commands).

### Non-Interactive Mode

When `--json` is passed, interactive commands require flags instead of prompts:

- `karma` — `--quality`, `--description`, `--intensity`
- `diagnose` — `--dukkha-types`, `--craving-types`
- `sit` — `--situation`
- `koan` — `--id` (already exists)
- `meditate` — `--duration`

Commands already non-interactive: `inquiry`, `chain`, `status`.

## Part 3: Claude Code Plugin

### Location

`plugin/` directory at project root.

### Structure

```
plugin/
├── .claude-plugin/
│   └── plugin.json          # name: "buddha-js"
├── skills/
│   ├── meditate/SKILL.md
│   ├── diagnose/SKILL.md
│   ├── inquiry/SKILL.md
│   ├── karma/SKILL.md
│   ├── koan/SKILL.md
│   ├── sit/SKILL.md
│   ├── chain/SKILL.md
│   └── status/SKILL.md
└── commands/
    └── buddha.md             # /buddha discovery entry point
```

### How Skills Work

Each SKILL.md instructs Claude to run `buddha <cmd> --json --being <name>` via Bash, parse the JSON, and present it conversationally. Skill descriptions enable auto-activation based on task context.

### Plugin Scope

Skills + one command only. No hooks, no MCP servers.

## What Changes

**New files:**
- `src/cli/utils/state.ts` — state manager
- `plugin/` directory — Claude Code plugin (8 skills + 1 command)
- Tests for state manager

**Modified files:**
- `src/cli/index.ts` — global `--json`, `--being`, `--state-dir` flags
- `src/cli/commands/inquiry.ts` — load/save being, JSON output
- `src/cli/commands/status.ts` — load being, JSON output
- `src/cli/commands/karma.ts` — load/save being, JSON output, non-interactive flags
- `src/cli/commands/diagnose.ts` — JSON output, non-interactive flags
- `src/cli/commands/sit.ts` — JSON output, non-interactive flag
- `src/cli/commands/koan.ts` — JSON output
- `src/cli/commands/chain.ts` — JSON output
- `src/cli/commands/meditate.ts` — JSON output, non-interactive `--duration` flag
- New commands: `beings` (list/delete), `reset`

## What Doesn't Change

- No library code changes
- No existing test changes
- `Being.toJSON()`/`fromJSON()` used as-is
- Existing chalk output preserved when `--json` is not passed
