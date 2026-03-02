# Buddha.js MCP Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expose the full Buddha.js Being API as a stdio-based MCP server, sharing persistence with the CLI.

**Architecture:** Handler functions in `src/mcp/handlers.ts` (pure, testable) with MCP wiring in `src/mcp/index.ts`. Uses `@modelcontextprotocol/sdk` v1.x with zod for input schemas. Reuses `StateManager` from `src/cli/utils/state.ts` to share `~/.buddha/beings/` persistence with the CLI. Built with tsup to `dist/mcp.mjs`.

**Tech Stack:** @modelcontextprotocol/sdk v1.x, zod, tsup (ESM), vitest

---

### Task 1: Infrastructure Setup

**Files:**
- Create: `src/mcp/index.ts`
- Create: `src/mcp/handlers.ts`
- Create: `tsup.mcp.ts`
- Modify: `package.json`

**Step 1: Install dependencies**

Run: `npm install @modelcontextprotocol/sdk zod`
Expected: Packages added to `dependencies` in package.json

**Step 2: Create build config**

Create `tsup.mcp.ts`:

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { mcp: 'src/mcp/index.ts' },
  format: ['esm'],
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  banner: { js: '#!/usr/bin/env node' },
});
```

**Step 3: Add build:mcp script**

In `package.json`, add to `"scripts"`:

```json
"build:mcp": "tsup --config tsup.mcp.ts"
```

**Step 4: Create src/mcp/handlers.ts with one handler**

```typescript
import { StateManager } from '../cli/utils/state';

export function listBeings(sm: StateManager): string[] {
  return sm.listBeings();
}
```

**Step 5: Create src/mcp/index.ts with server skeleton**

```typescript
#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as os from 'node:os';
import * as path from 'node:path';
import { StateManager } from '../cli/utils/state';
import { listBeings } from './handlers';

const stateDir = process.env.BUDDHA_STATE_DIR || path.join(os.homedir(), '.buddha');
const sm = new StateManager(stateDir);

const server = new McpServer({
  name: 'buddha-js',
  version: '0.1.0',
});

server.tool(
  'buddha_list_beings',
  'List all saved beings',
  {},
  async () => ({
    content: [{ type: 'text' as const, text: JSON.stringify(listBeings(sm)) }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Buddha.js MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

**Step 6: Build and verify**

Run: `npm run build:mcp`
Expected: `dist/mcp.mjs` created without errors

**Step 7: Commit**

```bash
git add tsup.mcp.ts src/mcp/index.ts src/mcp/handlers.ts package.json package-lock.json
git commit -m "feat(mcp): scaffold MCP server with list_beings tool"
```

---

### Task 2: Being Management Tools (create, list, delete, status)

**Files:**
- Modify: `src/mcp/handlers.ts`
- Create: `tests/mcp/handlers.test.ts`
- Modify: `src/mcp/index.ts`

**Step 1: Write failing tests**

Create `tests/mcp/handlers.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StateManager } from '../../src/cli/utils/state';
import { createBeing, listBeings, deleteBeing, getStatus } from '../../src/mcp/handlers';

describe('MCP handlers — being management', () => {
  let sm: StateManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'buddha-mcp-'));
    sm = new StateManager(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('createBeing creates and persists a new being', () => {
    const result = createBeing(sm, 'tester');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(sm.listBeings()).toContain('tester');
  });

  test('listBeings returns empty array initially', () => {
    expect(listBeings(sm)).toEqual([]);
  });

  test('listBeings returns created beings', () => {
    createBeing(sm, 'one');
    createBeing(sm, 'two');
    expect(listBeings(sm).sort()).toEqual(['one', 'two']);
  });

  test('deleteBeing removes a being', () => {
    createBeing(sm, 'temp');
    deleteBeing(sm, 'temp');
    expect(listBeings(sm)).toEqual([]);
  });

  test('getStatus returns summary and state', () => {
    createBeing(sm, 'monk');
    const result = getStatus(sm, 'monk');
    expect(typeof result.summary).toBe('string');
    expect(result.state).toBeDefined();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/mcp/handlers.test.ts`
Expected: FAIL — `createBeing`, `deleteBeing`, `getStatus` not exported

**Step 3: Implement handlers**

Replace `src/mcp/handlers.ts`:

```typescript
import { StateManager } from '../cli/utils/state';
import { Being } from '../simulation/Being';

export function createBeing(sm: StateManager, name: string): string {
  const being = new Being();
  sm.saveBeing(name, being);
  return being.getSummary();
}

export function listBeings(sm: StateManager): string[] {
  return sm.listBeings();
}

export function deleteBeing(sm: StateManager, name: string): string {
  sm.deleteBeing(name);
  return `Being "${name}" deleted.`;
}

export function getStatus(sm: StateManager, name: string) {
  const being = sm.loadBeing(name);
  return { summary: being.getSummary(), state: being.getState() };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/mcp/handlers.test.ts`
Expected: All 5 tests PASS

**Step 5: Register tools on MCP server**

Update `src/mcp/index.ts` — add imports and tool registrations:

```typescript
import { z } from 'zod';
import { createBeing, listBeings, deleteBeing, getStatus } from './handlers';

const nameSchema = z.string()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .describe('Being name (alphanumeric, hyphens, underscores)');

server.tool(
  'buddha_create_being',
  'Create a new being with default state',
  { name: nameSchema },
  async ({ name }) => {
    try {
      const summary = createBeing(sm, name);
      return { content: [{ type: 'text' as const, text: summary }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);

// buddha_list_beings already registered in Task 1

server.tool(
  'buddha_delete_being',
  'Delete a saved being',
  { name: nameSchema },
  async ({ name }) => {
    try {
      return { content: [{ type: 'text' as const, text: deleteBeing(sm, name) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);

server.tool(
  'buddha_status',
  'Get the current state and summary of a being',
  { name: nameSchema },
  async ({ name }) => {
    try {
      const result = getStatus(sm, name);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);
```

**Step 6: Build and typecheck**

Run: `npm run typecheck && npm run build:mcp`
Expected: No errors

**Step 7: Commit**

```bash
git add src/mcp/handlers.ts src/mcp/index.ts tests/mcp/handlers.test.ts
git commit -m "feat(mcp): add being management tools (create, list, delete, status)"
```

---

### Task 3: Stateful Action Tools (experience, act, karma_ripen)

**Files:**
- Modify: `src/mcp/handlers.ts`
- Modify: `tests/mcp/handlers.test.ts`
- Modify: `src/mcp/index.ts`

**Step 1: Write failing tests**

Append to `tests/mcp/handlers.test.ts`:

```typescript
import { experienceSensory, act, ripenKarma } from '../../src/mcp/handlers';

describe('MCP handlers — stateful actions', () => {
  let sm: StateManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'buddha-mcp-'));
    sm = new StateManager(tempDir);
    createBeing(sm, 'actor');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('experienceSensory processes input and saves state', () => {
    const result = experienceSensory(sm, 'actor', {
      senseBase: 'mind',
      object: 'thought of kindness',
      intensity: 5,
    });
    expect(result).toHaveProperty('feelingTone');
    expect(result).toHaveProperty('label');
  });

  test('act creates karma and saves state', () => {
    const result = act(sm, 'actor', 'gave food to a hungry person', 'wholesome', 7, 'non-greed');
    expect(result).toHaveProperty('quality', 'wholesome');
    expect(result).toHaveProperty('description');
  });

  test('ripenKarma returns array of results', () => {
    act(sm, 'actor', 'small kind act', 'wholesome', 3);
    const results = ripenKarma(sm, 'actor');
    expect(Array.isArray(results)).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/mcp/handlers.test.ts`
Expected: FAIL — `experienceSensory`, `act`, `ripenKarma` not exported

**Step 3: Implement handlers**

Add to `src/mcp/handlers.ts`:

```typescript
import type {
  SenseBase, Intensity, KarmaQuality,
  UnwholesomeRoot, WholesomeRoot,
} from '../utils/types';

export function experienceSensory(
  sm: StateManager,
  name: string,
  input: { senseBase: SenseBase; object: unknown; intensity: Intensity },
) {
  const being = sm.loadBeing(name);
  const result = being.experience(input);
  sm.saveBeing(name, being);
  return result;
}

export function act(
  sm: StateManager,
  name: string,
  description: string,
  quality: KarmaQuality,
  intensity: Intensity,
  root?: UnwholesomeRoot | WholesomeRoot,
) {
  const being = sm.loadBeing(name);
  const karma = being.act(description, quality, intensity, root);
  sm.saveBeing(name, being);
  return karma;
}

export function ripenKarma(sm: StateManager, name: string) {
  const being = sm.loadBeing(name);
  const results = being.receiveKarmicResults();
  sm.saveBeing(name, being);
  return results;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/mcp/handlers.test.ts`
Expected: All tests PASS

**Step 5: Register tools on MCP server**

Add shared schemas and tools to `src/mcp/index.ts`:

```typescript
import { experienceSensory, act, ripenKarma } from './handlers';

const intensitySchema = z.number().int().min(0).max(10)
  .describe('Intensity level (0-10)');
const senseBaseSchema = z.enum(['eye', 'ear', 'nose', 'tongue', 'body', 'mind'])
  .describe('Sense base (salayatana)');
const karmaQualitySchema = z.enum(['wholesome', 'unwholesome', 'neutral'])
  .describe('Moral quality of the action');
const rootSchema = z.enum([
  'greed', 'aversion', 'delusion',
  'non-greed', 'non-aversion', 'non-delusion',
]).optional().describe('Root cause (unwholesome or wholesome)');

server.tool(
  'buddha_experience',
  'Process a sensory experience through the five aggregates',
  {
    name: nameSchema,
    senseBase: senseBaseSchema,
    object: z.string().describe('What is experienced (sensory object)'),
    intensity: intensitySchema,
  },
  async ({ name, senseBase, object, intensity }) => {
    try {
      const result = experienceSensory(sm, name, {
        senseBase: senseBase as SenseBase,
        object,
        intensity: intensity as Intensity,
      });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);

server.tool(
  'buddha_act',
  'Perform an intentional action that creates karma — every action has moral quality and karmic consequences',
  {
    name: nameSchema,
    description: z.string().describe('Description of the intentional action'),
    quality: karmaQualitySchema,
    intensity: intensitySchema,
    root: rootSchema,
  },
  async ({ name, description, quality, intensity, root }) => {
    try {
      const result = act(
        sm, name, description,
        quality as KarmaQuality,
        intensity as Intensity,
        root as UnwholesomeRoot | WholesomeRoot | undefined,
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);

server.tool(
  'buddha_karma_ripen',
  'Check for and receive any ripened karmic results from past actions',
  { name: nameSchema },
  async ({ name }) => {
    try {
      const results = ripenKarma(sm, name);
      return { content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);
```

Note: add `import type { SenseBase, Intensity, KarmaQuality, UnwholesomeRoot, WholesomeRoot } from '../utils/types';` to the imports in index.ts.

**Step 6: Build and typecheck**

Run: `npm run typecheck && npm run build:mcp`
Expected: No errors

**Step 7: Commit**

```bash
git add src/mcp/handlers.ts src/mcp/index.ts tests/mcp/handlers.test.ts
git commit -m "feat(mcp): add action tools (experience, act, karma_ripen)"
```

---

### Task 4: Contemplative Tools (meditate, diagnose, inquiry, chain)

**Files:**
- Modify: `src/mcp/handlers.ts`
- Modify: `tests/mcp/handlers.test.ts`
- Modify: `src/mcp/index.ts`

**Step 1: Write failing tests**

Append to `tests/mcp/handlers.test.ts`:

```typescript
import { meditate, diagnose, inquiry, chain } from '../../src/mcp/handlers';

describe('MCP handlers — contemplative tools', () => {
  let sm: StateManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'buddha-mcp-'));
    sm = new StateManager(tempDir);
    createBeing(sm, 'meditator');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('meditate develops path factors and returns result', () => {
    const result = meditate(sm, 'meditator', 300, 7);
    expect(result).toHaveProperty('mindfulnessLevel');
    expect(result).toHaveProperty('insight');
  });

  test('diagnose returns Four Noble Truths analysis', () => {
    const result = diagnose(sm, 'meditator', ['dukkha-dukkha'], ['sensory']);
    expect(result).toBeDefined();
  });

  test('inquiry investigates self and returns result', () => {
    const result = inquiry(sm, 'meditator');
    expect(result).toHaveProperty('conclusion');
  });

  test('chain returns dependent origination visualization', () => {
    const result = chain(sm, 'meditator');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/mcp/handlers.test.ts`
Expected: FAIL — functions not exported

**Step 3: Implement handlers**

Add to `src/mcp/handlers.ts`:

```typescript
import type { DukkhaType, CravingType } from '../utils/types';

export function meditate(
  sm: StateManager,
  name: string,
  duration: number,
  effort: Intensity,
) {
  const being = sm.loadBeing(name);
  const result = being.meditate(duration, effort);
  sm.saveBeing(name, being);
  return result;
}

export function diagnose(
  sm: StateManager,
  name: string,
  suffering: DukkhaType[],
  cravings: CravingType[],
) {
  const being = sm.loadBeing(name);
  return being.faceSuffering(suffering, cravings);
}

export function inquiry(sm: StateManager, name: string) {
  const being = sm.loadBeing(name);
  return being.investigateSelf();
}

export function chain(sm: StateManager, name: string): string {
  const being = sm.loadBeing(name);
  return being.observeDependentOrigination();
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/mcp/handlers.test.ts`
Expected: All tests PASS

**Step 5: Register tools on MCP server**

Add to `src/mcp/index.ts`:

```typescript
import { meditate, diagnose, inquiry, chain } from './handlers';
import type { DukkhaType, CravingType } from '../utils/types';

const dukkhaTypeSchema = z.enum(['dukkha-dukkha', 'viparinama-dukkha', 'sankhara-dukkha'])
  .describe('Type of suffering: obvious pain, pain of change, or conditioned existence');
const cravingTypeSchema = z.enum(['sensory', 'becoming', 'non-becoming'])
  .describe('Type of craving driving the suffering');

server.tool(
  'buddha_meditate',
  'Conduct a meditation session — develops path factors, mindfulness, and generates insights. State is saved.',
  {
    name: nameSchema,
    duration: z.number().positive().describe('Duration in seconds'),
    effort: intensitySchema.describe('Meditation effort (0-10)'),
  },
  async ({ name, duration, effort }) => {
    try {
      const result = meditate(sm, name, duration, effort as Intensity);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);

server.tool(
  'buddha_diagnose',
  'Diagnose suffering using the Four Noble Truths framework — identify suffering type, root cause, cessation possibility, and recommended path',
  {
    name: nameSchema,
    suffering: z.array(dukkhaTypeSchema).min(1).describe('Types of suffering present'),
    cravings: z.array(cravingTypeSchema).min(1).describe('Types of craving driving the suffering'),
  },
  async ({ name, suffering, cravings }) => {
    try {
      const result = diagnose(sm, name, suffering as DukkhaType[], cravings as CravingType[]);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);

server.tool(
  'buddha_inquiry',
  'Investigate the nature of self — search for an unchanging essence across the five aggregates, dependent origination, and emptiness',
  { name: nameSchema },
  async ({ name }) => {
    try {
      const result = inquiry(sm, name);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);

server.tool(
  'buddha_chain',
  'Visualize the 12 links of dependent origination for a being — shows the causal chain of becoming',
  { name: nameSchema },
  async ({ name }) => {
    try {
      return { content: [{ type: 'text' as const, text: chain(sm, name) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);
```

**Step 6: Build and typecheck**

Run: `npm run typecheck && npm run build:mcp`
Expected: No errors

**Step 7: Commit**

```bash
git add src/mcp/handlers.ts src/mcp/index.ts tests/mcp/handlers.test.ts
git commit -m "feat(mcp): add contemplative tools (meditate, diagnose, inquiry, chain)"
```

---

### Task 5: Koan Tools (present, contemplate)

**Files:**
- Modify: `src/mcp/handlers.ts`
- Modify: `tests/mcp/handlers.test.ts`
- Modify: `src/mcp/index.ts`

**Step 1: Write failing tests**

Append to `tests/mcp/handlers.test.ts`:

```typescript
import { presentKoan, contemplateKoan } from '../../src/mcp/handlers';

describe('MCP handlers — koan tools', () => {
  test('presentKoan returns a random koan', () => {
    const koan = presentKoan();
    expect(koan).toHaveProperty('id');
    expect(koan).toHaveProperty('title');
    expect(koan).toHaveProperty('case');
    expect(koan).toHaveProperty('source');
  });

  test('presentKoan with id returns specific koan', () => {
    const koan = presentKoan('mu');
    expect(koan.id).toBe('mu');
  });

  test('contemplateKoan evaluates response for dualism traps', () => {
    const result = contemplateKoan('mu', 'yes');
    expect(result).toHaveProperty('trapsDetected');
    expect(result).toHaveProperty('isNonDual');
    expect(result).toHaveProperty('reflection');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/mcp/handlers.test.ts`
Expected: FAIL — `presentKoan`, `contemplateKoan` not exported

**Step 3: Implement handlers**

Add to `src/mcp/handlers.ts`:

```typescript
import { KoanGenerator } from '../koan/KoanGenerator';

const koanGenerator = new KoanGenerator();

export function presentKoan(id?: string) {
  return koanGenerator.present(id);
}

export function contemplateKoan(koanId: string, response: string) {
  return koanGenerator.contemplate(koanId, response);
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/mcp/handlers.test.ts`
Expected: All tests PASS

**Step 5: Register tools on MCP server**

Add to `src/mcp/index.ts`:

```typescript
import { presentKoan, contemplateKoan } from './handlers';

server.tool(
  'buddha_koan',
  'Present a Zen koan for contemplation. Available: mu, one-hand, stone-mind, flag-wind, marrow, nansen-cat, fan-wind, original-face',
  { id: z.string().optional().describe('Koan ID (omit for random)') },
  async ({ id }) => {
    try {
      const koan = presentKoan(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(koan, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);

server.tool(
  'buddha_contemplate',
  'Submit a response to a koan — evaluates for dualism traps: binary, intellectual, seeking, nihilistic, grasping',
  {
    koanId: z.string().describe('ID of the koan being contemplated'),
    response: z.string().describe('Your contemplative response to the koan'),
  },
  async ({ koanId, response }) => {
    try {
      const result = contemplateKoan(koanId, response);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true };
    }
  },
);
```

**Step 6: Build and typecheck**

Run: `npm run typecheck && npm run build:mcp`
Expected: No errors

**Step 7: Commit**

```bash
git add src/mcp/handlers.ts src/mcp/index.ts tests/mcp/handlers.test.ts
git commit -m "feat(mcp): add koan tools (present, contemplate)"
```

---

### Task 6: Integration, Build, and Documentation

**Files:**
- Modify: `package.json`
- Modify: `CLAUDE.md`

**Step 1: Add bin entry**

In `package.json` `"bin"` section, add:

```json
"buddha-mcp": "./dist/mcp.mjs"
```

**Step 2: Run full test suite**

Run: `npm run typecheck && npx vitest run tests/mcp/`
Expected: All tests pass, no type errors

**Step 3: Build**

Run: `npm run build:mcp`
Expected: `dist/mcp.mjs` created

**Step 4: Smoke test the MCP server**

Run:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}' | node dist/mcp.mjs 2>/dev/null | head -1
```
Expected: JSON response containing `"serverInfo":{"name":"buddha-js"}`

**Step 5: Add MCP section to CLAUDE.md**

Add after the CLI section:

```markdown
### MCP Server

Buddha.js includes an MCP (Model Context Protocol) server exposing the full Being API. Shares persistence with CLI (`~/.buddha/beings/`).

**Build & Run:**
\`\`\`bash
npm run build:mcp     # Build to dist/mcp.mjs
node dist/mcp.mjs     # Run (stdio transport)
\`\`\`

**Configuration (Claude Code / Claude Desktop):**
\`\`\`json
{
  "mcpServers": {
    "buddha-js": {
      "command": "node",
      "args": ["/path/to/buddha.js/dist/mcp.mjs"]
    }
  }
}
\`\`\`

**13 Tools:** `buddha_create_being`, `buddha_list_beings`, `buddha_delete_being`, `buddha_status`, `buddha_experience`, `buddha_act`, `buddha_karma_ripen`, `buddha_meditate`, `buddha_diagnose`, `buddha_inquiry`, `buddha_chain`, `buddha_koan`, `buddha_contemplate`
```

**Step 6: Commit**

```bash
git add package.json CLAUDE.md
git commit -m "feat(mcp): finalize MCP server with bin entry and docs"
```
