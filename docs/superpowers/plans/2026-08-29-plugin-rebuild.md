# Claude Code Plugin Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Claude Code plugin actually installable and functional: bundle the MCP server into the plugin via `${CLAUDE_PLUGIN_ROOT}`, add a marketplace manifest, add the missing `buddha_sit` MCP tool, and rewrite the eight skills against the real MCP tool surface.

**Architecture:** The plugin stops shelling out to `node dist/cli.mjs` (a cwd-relative path that breaks on install). Instead `plugin/.claude-plugin/plugin.json` declares an `mcpServers` entry pointing at a built server committed inside the plugin (`plugin/dist/mcp.mjs`), so installing the plugin wires up all 14 MCP tools automatically. Skills instruct Claude to call `buddha_*` MCP tools, not bash. A repo-root `.claude-plugin/marketplace.json` enables `/plugin marketplace add askarzh/Buddha.js`.

**Tech Stack:** Claude Code plugin spec (plugin.json, marketplace.json, SKILL.md frontmatter), tsup, MCP SDK + zod.

**Spec:** Audit findings §2 (plugin not installable; skills document wrong values), plus the approved roadmap item "Plugin rebuild".

## Global Constraints

- `npm run typecheck`, `npm run lint`, `npm run test:run` must pass after every task.
- MCP tool count changes 13 → 14 (`buddha_sit`); update README.md and CLAUDE.md tool lists in the same task that adds the tool.
- Every command/tool/parameter a skill documents MUST be verified against the real schemas in `src/mcp/index.ts` — skills were previously written from a design doc and shipped wrong enum values; that class of error is the thing this phase exists to kill.
- `plugin/dist/mcp.mjs` is a committed build artifact: `.gitignore` must not ignore it (root `dist/` stays ignored) and the build script must rebuild it deterministically.
- Conventional commits. Do not publish or push.

---

### Task 1: Add `buddha_sit` MCP tool

**Files:**
- Modify: `src/mcp/handlers.ts`, `src/mcp/index.ts`
- Modify: `README.md` (MCP tool table), `CLAUDE.md` (tool count + list)
- Test: `tests/mcp/handlers.test.ts`

**Interfaces:**
- Produces: handler `sitWithSuffering(suffering: string)` returning `{ suffering: string; steps: Array<{ stage; truth; insight; guidance }>; summary: string }`; MCP tool `buddha_sit` with input `{ suffering: z.string().min(1).describe('The suffering or problem being sat with') }`. Stateless — no being, no persistence (mirrors the CLI's `sit --json`).

- [ ] **Step 1: Write the failing test**

```ts
// tests/mcp/handlers.test.ts (add)
describe('sitWithSuffering', () => {
  it('walks all four cessation stages for a named suffering', () => {
    const result = sitWithSuffering('deadline pressure');
    expect(result.suffering).toBe('deadline pressure');
    expect(result.steps.map(s => s.stage)).toEqual(['recognize', 'investigate', 'release', 'practice']);
    expect(result.steps.map(s => s.truth)).toEqual(['dukkha', 'samudaya', 'nirodha', 'magga']);
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('rejects empty suffering', () => {
    expect(() => sitWithSuffering('   ')).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/mcp`.

- [ ] **Step 3: Implement**

`src/mcp/handlers.ts` (mirror `src/cli/commands/sit.ts:10-30`'s json branch):
```ts
import { PoisonArrow } from '../simulation/PoisonArrow';

export function sitWithSuffering(suffering: string) {
  const sim = new PoisonArrow(suffering);
  const steps = [];
  while (!sim.isComplete()) {
    const step = sim.step();
    steps.push({ stage: step.stage, truth: step.truth, insight: step.insight, guidance: step.guidance });
  }
  return { suffering, steps, summary: sim.getSummary() };
}
```

`src/mcp/index.ts` — register following the file's existing pattern (try/catch → `isError`):
```ts
server.tool(
  'buddha_sit',
  'Guided cessation via the Poison Arrow method (Cula-Malunkyovada Sutta): four steps — recognize, investigate, release, practice — one per Noble Truth. Stateless; no being required. Use when someone (or an agent stuck in a loop) needs quick relief from a named suffering without deep analysis.',
  {
    suffering: z.string().min(1).describe('The suffering or problem being sat with'),
  },
  async ({ suffering }) => {
    try {
      const result = sitWithSuffering(suffering);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);
```

- [ ] **Step 4:** Update README.md's MCP tool table (add `buddha_sit` row; change "13" to "14" wherever the count appears) and CLAUDE.md ("13 Tools" list → 14, add `buddha_sit`).

- [ ] **Step 5: Verify** — `npm run test:run && npm run typecheck && npm run lint` green; `npm run build:mcp` succeeds.

- [ ] **Step 6: Commit** — `git commit -m "feat(mcp): add buddha_sit tool (Poison Arrow guided cessation)"`

---

### Task 2: Plugin manifest, bundled server, marketplace

**Files:**
- Modify: `plugin/.claude-plugin/plugin.json`
- Create: `.claude-plugin/marketplace.json` (repo root)
- Create: `plugin/dist/mcp.mjs` (built artifact)
- Modify: `.gitignore` (if needed), `package.json` (build:plugin script)

**Interfaces:**
- Produces: `npm run build:plugin` → builds the MCP server and copies it to `plugin/dist/mcp.mjs`; `plugin.json` declares the server via `${CLAUDE_PLUGIN_ROOT}`.

- [ ] **Step 1:** `plugin/.claude-plugin/plugin.json` becomes:

```json
{
  "name": "buddha-js",
  "version": "0.2.0",
  "description": "Buddhist philosophy tools for Claude Code — meditation, diagnosis, karma, koans, self-inquiry, and the Poison Arrow method, backed by a bundled MCP server",
  "author": { "name": "Askar Zhakenov", "email": "askar@zhakenov.pro" },
  "keywords": ["buddhism", "meditation", "mindfulness", "philosophy", "mcp"],
  "mcpServers": {
    "buddha-js": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/mcp.mjs"]
    }
  }
}
```

- [ ] **Step 2:** Create repo-root `.claude-plugin/marketplace.json`:

```json
{
  "name": "buddha-js",
  "owner": { "name": "Askar Zhakenov", "email": "askar@zhakenov.pro" },
  "plugins": [
    {
      "name": "buddha-js",
      "source": "./plugin",
      "description": "Buddhist philosophy tools — meditation, diagnosis, karma, koans, self-inquiry, and the Poison Arrow method, backed by a bundled MCP server"
    }
  ]
}
```

- [ ] **Step 3:** Add script to package.json: `"build:plugin": "npm run build:mcp && mkdir -p plugin/dist && cp dist/mcp.mjs plugin/dist/mcp.mjs"`. Run it. Check ignore state: `grep -n "dist" .gitignore`; if the pattern matches nested dist dirs (bare `dist/`), add negations `!plugin/dist/` and `!plugin/dist/mcp.mjs`; if it's root-anchored (`/dist/`), nothing needed. Confirm with `git check-ignore -v plugin/dist/mcp.mjs || echo TRACKED` → must print TRACKED.

- [ ] **Step 4: Verify** — stage the artifact and manifests; smoke-test the bundled server over JSON-RPC stdio (initialize → notifications/initialized → tools/list, same message shapes as the doctrinal-fixes plan's Task 8 Step 3, but running `node plugin/dist/mcp.mjs`): expect 14 tools including `buddha_sit`. Paste the tool list into your report.

- [ ] **Step 5: Commit** — `git commit -m "feat(plugin): bundle MCP server via CLAUDE_PLUGIN_ROOT and add marketplace manifest"`

---

### Task 3: Rewrite the eight skills + command against the MCP surface

**Files:**
- Modify: all eight `plugin/skills/*/SKILL.md`, `plugin/commands/buddha.md`
- Modify: `README.md` (plugin section: correct install instructions)

**Requirements (apply to every skill):**
- No `node dist/cli.mjs` anywhere in plugin/ when done (`grep -rn "dist/cli" plugin/` must be empty).
- Skills tell Claude to call the MCP tools (`buddha_status`, `buddha_sit`, …) with parameters matching the REAL zod schemas in `src/mcp/index.ts` — read that file first and transcribe enums exactly (dukkha types are `dukkha-dukkha|viparinama-dukkha|sankhara-dukkha`; cravings are `sensory|becoming|non-becoming`; koan ids are strings — enumerate them from `src/koan/koans.ts`).
- Keep each skill's existing contemplative guardrails (e.g., koan's "Do NOT explain or interpret the koan", sit's "not a debugging session") — the prose was good; only the mechanics were wrong.
- Keep frontmatter style: `name: buddha-<x>`, third-person trigger-shaped `description`.
- Each skill notes the being workflow where relevant: stateful tools need an existing being — create with `buddha_create_being` or list with `buddha_list_beings`; `buddha_koan`/`buddha_contemplate`/`buddha_sit` are stateless.

**Per-skill tool mapping:** status→`buddha_status`; inquiry→`buddha_inquiry`; karma→`buddha_act`+`buddha_karma_ripen` (quality derives from root — no quality param); diagnose→`buddha_diagnose` (real enums above); sit→`buddha_sit`; koan→`buddha_koan`+`buddha_contemplate`; chain→`buddha_chain`; meditate→`buddha_meditate` (check real param names/ranges in src/mcp/index.ts).

- [ ] **Step 1:** Read `src/mcp/index.ts` fully and `src/koan/koans.ts` (ids only); write down the exact schema for each tool used.
- [ ] **Step 2:** Rewrite the eight SKILL.md files and `plugin/commands/buddha.md` (command lists the 14 tools and the create-being-first workflow; drop the "build the CLI first" prerequisite — the bundled server ships built).
- [ ] **Step 3:** Update README.md's plugin section: install via `/plugin marketplace add askarzh/Buddha.js` then `/plugin install buddha-js@buddha-js`; remove the outdated `claude plugin add ./plugin` instruction; note that installing the plugin auto-configures the MCP server.
- [ ] **Step 4: Verify** — `grep -rn "dist/cli" plugin/` empty; `grep -rln "buddha_" plugin/skills/ | wc -l` = 8; spot-check every enum value documented in plugin/ exists verbatim in src/ (`grep -n "viparinama" plugin/skills/diagnose/SKILL.md src/utils/types.ts`).
- [ ] **Step 5: Commit** — `git commit -m "fix(plugin)!: rewrite skills against the real MCP tool surface"`

---

## Verification sweep (controller)

`npm run test:run` + typecheck + lint; bundled-server smoke test (14 tools); grep sweeps from Task 3 Step 4; README/CLAUDE.md tool counts consistent (14 everywhere).
