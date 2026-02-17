# CLI Persistence & Claude Code Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add persistence (save/restore Being state between runs) and `--json` output to the CLI, then package all commands as a Claude Code plugin.

**Architecture:** A state manager module handles file I/O for named beings. Global Commander flags (`--json`, `--being`, `--state-dir`) propagate via `program.opts()`. Interactive commands accept non-interactive flags when `--json` is set. The Claude Code plugin is a `plugin/` directory with SKILL.md files that call `buddha <cmd> --json` via Bash.

**Tech Stack:** Commander.js (existing), Node `fs` + `path` + `os`, Vitest, Claude Code plugin format

---

### Task 1: State Manager

Create the persistence module that loads/saves beings to disk.

**Files:**
- Create: `src/cli/utils/state.ts`
- Create: `tests/cli/state.test.ts`

**Step 1: Write the test file**

```typescript
// tests/cli/state.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { StateManager } from '../../src/cli/utils/state';
import { Being } from '../../src/simulation/Being';

describe('StateManager', () => {
  let tmpDir: string;
  let mgr: StateManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'buddha-test-'));
    mgr = new StateManager(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return a fresh Being when no save file exists', () => {
    const being = mgr.loadBeing('default');
    expect(being).toBeInstanceOf(Being);
    const state = being.getState();
    expect(state.mindfulnessLevel).toBe(0);
    expect(state.pendingKarma).toBe(0);
  });

  it('should save and load a being with state preserved', () => {
    const being = new Being();
    being.act('Give generously', 'wholesome', 7, 'non-greed');
    being.meditate(10, 8);
    mgr.saveBeing('default', being);

    const restored = mgr.loadBeing('default');
    const state = restored.getState();
    expect(state.mindfulnessLevel).toBeGreaterThan(0);
    expect(state.pendingKarma).toBeGreaterThan(0);
  });

  it('should support multiple named beings', () => {
    const monk = new Being();
    monk.meditate(30, 9);
    mgr.saveBeing('monk', monk);

    const student = new Being();
    student.act('Study hard', 'wholesome', 5, 'non-delusion');
    mgr.saveBeing('student', student);

    const names = mgr.listBeings();
    expect(names).toContain('monk');
    expect(names).toContain('student');
    expect(names).toHaveLength(2);

    const restoredMonk = mgr.loadBeing('monk');
    expect(restoredMonk.getState().mindfulnessLevel).toBeGreaterThan(0);
  });

  it('should delete a being', () => {
    const being = new Being();
    mgr.saveBeing('temp', being);
    expect(mgr.listBeings()).toContain('temp');

    mgr.deleteBeing('temp');
    expect(mgr.listBeings()).not.toContain('temp');
  });

  it('should handle deleting a non-existent being gracefully', () => {
    expect(() => mgr.deleteBeing('nonexistent')).not.toThrow();
  });

  it('should create the state directory if it does not exist', () => {
    const nested = path.join(tmpDir, 'nested', 'deep');
    const mgr2 = new StateManager(nested);
    const being = new Being();
    mgr2.saveBeing('test', being);
    expect(fs.existsSync(path.join(nested, 'beings', 'test.json'))).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cli/state.test.ts`
Expected: FAIL — `StateManager` not found

**Step 3: Write the implementation**

```typescript
// src/cli/utils/state.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Being } from '../../simulation/Being';
import { BeingData } from '../../utils/types';

export class StateManager {
  private readonly beingsDir: string;

  constructor(stateDir: string) {
    this.beingsDir = path.join(stateDir, 'beings');
  }

  loadBeing(name: string): Being {
    const filePath = this.beingPath(name);
    if (!fs.existsSync(filePath)) {
      return new Being();
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: BeingData = JSON.parse(raw);
    return Being.fromJSON(data);
  }

  saveBeing(name: string, being: Being): void {
    fs.mkdirSync(this.beingsDir, { recursive: true });
    const filePath = this.beingPath(name);
    fs.writeFileSync(filePath, JSON.stringify(being.toJSON(), null, 2));
  }

  listBeings(): string[] {
    if (!fs.existsSync(this.beingsDir)) {
      return [];
    }
    return fs.readdirSync(this.beingsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''));
  }

  deleteBeing(name: string): void {
    const filePath = this.beingPath(name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private beingPath(name: string): string {
    return path.join(this.beingsDir, `${name}.json`);
  }
}

/**
 * Resolve the state directory from: --state-dir flag > BUDDHA_STATE_DIR env > ~/.buddha/
 */
export function resolveStateDir(flagValue?: string): string {
  if (flagValue) return flagValue;
  if (process.env.BUDDHA_STATE_DIR) return process.env.BUDDHA_STATE_DIR;
  return path.join(os.homedir(), '.buddha');
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/cli/state.test.ts`
Expected: 6 tests PASS

**Step 5: Commit**

```bash
git add src/cli/utils/state.ts tests/cli/state.test.ts
git commit -m "feat(cli): add StateManager for being persistence"
```

---

### Task 2: Global flags and Being-based command persistence

Add `--json`, `--being`, `--state-dir` global flags. Update `inquiry`, `status`, and `karma` to load/save the persistent being.

**Files:**
- Modify: `src/cli/index.ts`
- Modify: `src/cli/commands/inquiry.ts`
- Modify: `src/cli/commands/status.ts`
- Modify: `src/cli/commands/karma.ts`

**Step 1: Add global flags to `src/cli/index.ts`**

Replace the current program setup (lines 11-16) with:

```typescript
const program = new Command();

program
  .name('buddha')
  .description('Buddha.js — Buddhist concepts from the terminal')
  .version('0.1.0')
  .option('--json', 'Output results as JSON (non-interactive)')
  .option('--being <name>', 'Named being profile to use', 'default')
  .option('--state-dir <path>', 'State directory for persistence');
```

**Step 2: Update `src/cli/commands/status.ts`**

Replace the entire file:

```typescript
import { Being } from '../../simulation/Being';
import { StateManager, resolveStateDir } from '../utils/state';
import { header } from '../utils/format';

interface StatusOpts {
  json?: boolean;
  being: string;
  stateDir?: string;
}

export function status(_args: unknown, cmd: { parent: { opts: () => StatusOpts } }): void {
  const opts = cmd.parent.opts();
  const mgr = new StateManager(resolveStateDir(opts.stateDir));
  const being = mgr.loadBeing(opts.being);

  if (opts.json) {
    const state = being.getState();
    console.log(JSON.stringify({
      command: 'status',
      being: opts.being,
      result: {
        pathProgress: state.pathProgress,
        mindfulnessLevel: state.mindfulnessLevel,
        pendingKarma: state.pendingKarma,
        experienceCount: state.experienceCount,
        mindState: {
          isCalm: state.mindState.isCalm,
          isFocused: state.mindState.isFocused,
          dominantFactors: state.mindState.dominantFactors,
        },
      },
      state: { mindfulness: state.mindfulnessLevel, karmicActions: state.pendingKarma },
    }, null, 2));
    return;
  }

  console.log(header('Being Status'));
  console.log(being.getSummary());
}
```

**Important:** Commander passes `(commandArgs, commandObject)` to `.action()`. The parent program's opts are at `cmd.parent.opts()`. The exact shape depends on whether the command has its own arguments. For commands registered with `.action(fn)` on a subcommand with no args, Commander calls `fn(options, command)`. But since these commands don't define their own options, Commander calls `fn(command)` where `command.parent.opts()` has the global flags. Test the actual Commander behavior — if `cmd.parent` is undefined, it may be `cmd.optsWithGlobals()` instead. Commander v12+ supports `optsWithGlobals()`.

**Corrected approach — use `program.opts()` directly:**

Since all commands are defined on the same `program` instance, import and reference `program` directly or use Commander's `optsWithGlobals()`. The simplest approach: export a helper.

Add to `src/cli/utils/state.ts`:

```typescript
import { Command } from 'commander';

export interface GlobalOpts {
  json?: boolean;
  being: string;
  stateDir?: string;
}

export function getGlobalOpts(cmd: Command): GlobalOpts {
  return cmd.optsWithGlobals() as GlobalOpts;
}

export function getStateManager(opts: GlobalOpts): StateManager {
  return new StateManager(resolveStateDir(opts.stateDir));
}
```

**Revised `status.ts`:**

```typescript
import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { header } from '../utils/format';

export function status(this: Command): void {
  const opts = getGlobalOpts(this);
  const mgr = getStateManager(opts);
  const being = mgr.loadBeing(opts.being);

  if (opts.json) {
    const state = being.getState();
    console.log(JSON.stringify({
      command: 'status',
      being: opts.being,
      result: {
        pathProgress: state.pathProgress,
        mindfulnessLevel: state.mindfulnessLevel,
        pendingKarma: state.pendingKarma,
        experienceCount: state.experienceCount,
        mindState: {
          isCalm: state.mindState.isCalm,
          isFocused: state.mindState.isFocused,
          dominantFactors: state.mindState.dominantFactors,
        },
      },
      state: { mindfulness: state.mindfulnessLevel, karmicActions: state.pendingKarma },
    }, null, 2));
    return;
  }

  console.log(header('Being Status'));
  console.log(being.getSummary());
}
```

**Important Commander note:** When using `.action(status)`, Commander calls the function with `(options, command)`. For subcommands with NO local options, it's `(command)` where `command` is the Command instance. Use `this` binding or the command argument to call `optsWithGlobals()`. **The implementer must verify the exact Commander v14 calling convention by checking the existing command signatures.** If `this` doesn't work, use the last argument.

**Step 3: Update `src/cli/commands/inquiry.ts`**

Replace to load/save being:

```typescript
import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { header, label, insight, divider } from '../utils/format';

export function inquiry(this: Command): void {
  const opts = getGlobalOpts(this);
  const mgr = getStateManager(opts);
  const being = mgr.loadBeing(opts.being);

  const result = being.investigateSelf();
  mgr.saveBeing(opts.being, being);

  if (opts.json) {
    console.log(JSON.stringify({
      command: 'inquiry',
      being: opts.being,
      result: {
        selfFound: result.aggregateSearch.selfFound,
        aggregatesExamined: result.aggregateSearch.aggregatesExamined.map(a => a.aggregate),
        conclusion: result.aggregateSearch.conclusion,
        dependentOriginationInsight: result.dependentOriginationInsight,
        emptinessInsight: result.emptinessInsight ? {
          phenomenon: result.emptinessInsight.phenomenon,
          hasInherentExistence: result.emptinessInsight.hasInherentExistence,
          dependsOn: result.emptinessInsight.dependsOn,
        } : null,
        conclusion_final: result.conclusion,
      },
      state: { mindfulness: being.getState().mindfulnessLevel, karmicActions: being.getState().pendingKarma },
    }, null, 2));
    return;
  }

  console.log(header('Self Investigation'));

  console.log(label('Aggregate Search:'));
  console.log(`  Self found: ${result.aggregateSearch.selfFound}`);
  console.log(`  Searched in: ${result.aggregateSearch.aggregatesExamined.map(a => a.aggregate).join(', ')}`);
  console.log(`  ${result.aggregateSearch.conclusion}`);

  console.log();
  console.log(label('Dependent Origination:'));
  console.log(`  ${result.dependentOriginationInsight}`);

  if (result.emptinessInsight) {
    console.log();
    console.log(label('Emptiness Analysis:'));
    console.log(`  Phenomenon: ${result.emptinessInsight.phenomenon}`);
    console.log(`  Inherent existence: ${result.emptinessInsight.hasInherentExistence}`);
    console.log(`  Depends on: ${result.emptinessInsight.dependsOn.join(', ') || 'various conditions'}`);
  }

  console.log();
  console.log(divider());
  console.log(insight(result.conclusion));
}
```

**Step 4: Update `src/cli/commands/karma.ts`**

Add persistence (load at start, save at end) and `--json` mode with non-interactive flags.

Add options to the karma command in `index.ts`:

```typescript
program
  .command('karma')
  .description('Explore intentional action and karmic results')
  .option('--quality <quality>', 'Karma quality: wholesome or unwholesome (for --json)')
  .option('--description <desc>', 'Action description (for --json)')
  .option('--intensity <n>', 'Action intensity 1-10 (for --json)')
  .option('--root <root>', 'Root: greed, aversion, delusion, non-greed, non-aversion, non-delusion (for --json)')
  .action(karma);
```

In `karma.ts`, add persistence and JSON mode:

```typescript
import { Command } from 'commander';
import { input, select } from '@inquirer/prompts';
import { Being } from '../../simulation/Being';
import { KarmaQuality, Intensity, UnwholesomeRoot, WholesomeRoot } from '../../utils/types';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { header, label, insight, subtle, divider, success } from '../utils/format';
import chalk from 'chalk';

interface KarmaOpts {
  quality?: string;
  description?: string;
  intensity?: string;
  root?: string;
}

export async function karma(this: Command): Promise<void> {
  const globalOpts = getGlobalOpts(this);
  const localOpts = this.opts() as KarmaOpts;
  const mgr = getStateManager(globalOpts);
  const being = mgr.loadBeing(globalOpts.being);

  if (globalOpts.json) {
    // Non-interactive: perform a single action if flags provided, then output state
    if (localOpts.quality && localOpts.description && localOpts.intensity && localOpts.root) {
      const quality = localOpts.quality as KarmaQuality;
      const intensity = parseInt(localOpts.intensity, 10) as Intensity;
      const root = localOpts.root as WholesomeRoot | UnwholesomeRoot;
      being.act(localOpts.description, quality, intensity, root);
    }
    mgr.saveBeing(globalOpts.being, being);

    const stream = being.getKarmicStream();
    const state = being.getState();
    console.log(JSON.stringify({
      command: 'karma',
      being: globalOpts.being,
      result: {
        karmicStream: stream.map(k => ({
          description: k.intention.description,
          quality: k.quality,
          intensity: k.intensity,
        })),
        totalActions: stream.length,
      },
      state: { mindfulness: state.mindfulnessLevel, karmicActions: state.pendingKarma },
    }, null, 2));
    return;
  }

  // Interactive mode — existing code, with persistence wrapping
  console.log(header('Karma — Intentional Action'));
  console.log('Every action plants a seed. What will you cultivate?\n');

  let running = true;
  while (running) {
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        { name: 'Perform an action', value: 'act' },
        { name: 'Receive karmic results', value: 'receive' },
        { name: 'View karmic stream', value: 'view' },
        { name: 'Quit', value: 'quit' },
      ],
    });

    switch (action) {
      case 'act': {
        const description = await input({ message: 'Describe the action:' });
        const quality = await select<KarmaQuality>({
          message: 'Quality:',
          choices: [
            { name: 'Wholesome', value: 'wholesome' },
            { name: 'Unwholesome', value: 'unwholesome' },
          ],
        });
        const intensity = await select<Intensity>({
          message: 'Intensity (1-10):',
          choices: ([3, 5, 7, 9] as Intensity[]).map(n => ({ name: `${n}`, value: n })),
        });
        const root = quality === 'wholesome'
          ? await select<WholesomeRoot>({
              message: 'Root:',
              choices: [
                { name: 'Non-greed (generosity)', value: 'non-greed' },
                { name: 'Non-aversion (loving-kindness)', value: 'non-aversion' },
                { name: 'Non-delusion (wisdom)', value: 'non-delusion' },
              ],
            })
          : await select<UnwholesomeRoot>({
              message: 'Root:',
              choices: [
                { name: 'Greed', value: 'greed' },
                { name: 'Aversion', value: 'aversion' },
                { name: 'Delusion', value: 'delusion' },
              ],
            });

        const k = being.act(description, quality, intensity, root);
        console.log(success(`\n  Karma created: ${k.quality} (intensity ${k.intensity})\n`));
        break;
      }

      case 'receive': {
        const results = being.receiveKarmicResults();
        if (results.length === 0) {
          console.log(subtle('\n  No karma has ripened yet.\n'));
        } else {
          console.log(label('\n  Karmic Results:'));
          for (const r of results) {
            const color = r.experienceQuality === 'pleasant' ? chalk.green
              : r.experienceQuality === 'unpleasant' ? chalk.red
              : chalk.gray;
            console.log(`    ${color('•')} ${r.description} (${r.experienceQuality})`);
          }
          console.log();
        }
        break;
      }

      case 'view': {
        const stream = being.getKarmicStream();
        if (stream.length === 0) {
          console.log(subtle('\n  No actions taken yet.\n'));
        } else {
          console.log(label('\n  Karmic Stream:'));
          for (const k of stream) {
            const symbol = k.quality === 'wholesome' ? chalk.green('●') : chalk.red('●');
            console.log(`    ${symbol} ${k.intention.description} (${k.quality}, intensity ${k.intensity})`);
          }
          console.log();
        }
        break;
      }

      case 'quit':
        running = false;
        break;
    }
  }

  mgr.saveBeing(globalOpts.being, being);

  console.log(divider());
  const state = being.getState();
  console.log(insight(`Session complete. ${state.pendingKarma} karmic seeds planted.`));
}
```

**Step 5: Run existing tests to verify no regressions**

Run: `npx vitest run`
Expected: All 196 tests PASS (CLI commands have no tests yet — this is a manual verification step)

**Step 6: Commit**

```bash
git add src/cli/index.ts src/cli/utils/state.ts src/cli/commands/status.ts src/cli/commands/inquiry.ts src/cli/commands/karma.ts
git commit -m "feat(cli): add persistence and --json output for Being-based commands"
```

---

### Task 3: `--json` output for non-Being commands

Add JSON output to `chain`, `sit`, `koan`, `diagnose`, and `meditate`. These don't use persistence but need `--json` and non-interactive flags.

**Files:**
- Modify: `src/cli/index.ts` (add flags to diagnose, sit, meditate)
- Modify: `src/cli/commands/chain.ts`
- Modify: `src/cli/commands/sit.ts`
- Modify: `src/cli/commands/koan.ts`
- Modify: `src/cli/commands/diagnose.ts`
- Modify: `src/cli/commands/meditate.ts`

**Step 1: Update `src/cli/commands/chain.ts`**

```typescript
import { Command } from 'commander';
import { DependentOrigination } from '../../dependent-origination/DependentOrigination';
import { getGlobalOpts } from '../utils/state';
import { header, label, insight, subtle, divider } from '../utils/format';

export function chain(this: Command): void {
  const opts = getGlobalOpts(this);
  const do_ = new DependentOrigination();

  if (opts.json) {
    console.log(JSON.stringify({
      command: 'chain',
      result: {
        links: do_.links.map((link, i) => ({
          position: i + 1,
          name: link.name,
          sanskritName: link.sanskritName,
        })),
        liberationPoint: do_.practiceAtLiberationPoint(),
      },
    }, null, 2));
    return;
  }

  console.log(header('Dependent Origination — The 12 Links'));

  const links = do_.links;
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const arrow = i < links.length - 1 ? ' →' : '';
    console.log(`  ${subtle(`${i + 1}.`)} ${label(link.name)} ${subtle(`(${link.sanskritName})`)}${arrow}`);
  }

  console.log();
  console.log(divider());
  console.log(label('Liberation Point:'));
  console.log(insight(do_.practiceAtLiberationPoint()));
}
```

**Step 2: Update `src/cli/commands/koan.ts`**

Add JSON mode (present koan without interactive loop):

```typescript
import { Command } from 'commander';
import { input, confirm } from '@inquirer/prompts';
import { KoanGenerator } from '../../koan/KoanGenerator';
import { getGlobalOpts } from '../utils/state';
import { header, label, insight, subtle, divider, success } from '../utils/format';
import chalk from 'chalk';

export async function koan(this: Command): Promise<void> {
  const globalOpts = getGlobalOpts(this);
  const localOpts = this.opts() as { id?: string };
  const generator = new KoanGenerator();

  if (globalOpts.json) {
    const k = localOpts.id ? generator.present(localOpts.id) : generator.present();
    console.log(JSON.stringify({
      command: 'koan',
      result: {
        id: k.id,
        title: k.title,
        case: k.case,
        source: k.source,
        hint: k.hint ?? null,
      },
    }, null, 2));
    return;
  }

  // Existing interactive code
  let continueLoop = true;
  while (continueLoop) {
    const k = localOpts.id ? generator.present(localOpts.id) : generator.present();

    console.log(header(k.title));
    console.log(k.case);
    console.log(subtle(`-- ${k.source}`));

    if (k.hint) {
      console.log(subtle(`\nHint: ${k.hint}`));
    }

    console.log();
    const response = await input({
      message: 'Contemplate and respond:',
    });

    const result = generator.contemplate(k.id, response);

    console.log();
    if (result.isNonDual) {
      console.log(success('No dualistic traps detected.'));
    } else {
      console.log(label('Traps detected:'));
      for (const trap of result.trapsDetected) {
        console.log(`  ${chalk.red('•')} ${trap}`);
      }
    }

    console.log();
    console.log(insight(result.reflection));
    console.log(divider());

    continueLoop = await confirm({
      message: 'Try another koan?',
      default: false,
    });

    // Clear specific id after first round so subsequent koans are random
    localOpts.id = undefined;
  }
}
```

**Step 3: Update `src/cli/commands/sit.ts`**

Add `--situation` flag to index.ts:

```typescript
program
  .command('sit')
  .description('Guided cessation through the Poison Arrow method')
  .option('--situation <text>', 'Describe the suffering (for --json)')
  .action(sit);
```

Update sit.ts:

```typescript
import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import { PoisonArrow } from '../../simulation/PoisonArrow';
import { getGlobalOpts } from '../utils/state';
import { header, stage, insight, divider, success } from '../utils/format';

export async function sit(this: Command): Promise<void> {
  const globalOpts = getGlobalOpts(this);
  const localOpts = this.opts() as { situation?: string };

  if (globalOpts.json) {
    const suffering = localOpts.situation ?? 'unspecified suffering';
    const sim = new PoisonArrow(suffering);
    const steps = [];
    while (!sim.isComplete()) {
      steps.push(sim.step());
    }
    console.log(JSON.stringify({
      command: 'sit',
      result: {
        suffering,
        steps: steps.map(s => ({
          stage: s.stage,
          truth: s.truth,
          insight: s.insight,
          guidance: s.guidance,
        })),
        summary: sim.getSummary(),
      },
    }, null, 2));
    return;
  }

  // Existing interactive code
  console.log(header('Poison Arrow -- Quick Cessation'));
  console.log('Based on the Cula-Malunkyovada Sutta: remove the arrow first.\n');

  const suffering = await input({
    message: 'What suffering are you sitting with?',
  });

  const sim = new PoisonArrow(suffering);

  while (!sim.isComplete()) {
    const step = sim.step();
    console.log();
    console.log(stage(step.stage.toUpperCase(), `Truth of ${step.truth}`));
    console.log(insight(step.insight));
    console.log(`  ${step.guidance}`);

    if (!sim.isComplete()) {
      await input({ message: 'Press Enter to continue...' });
    }
  }

  console.log();
  console.log(divider());
  console.log(success('The arrow has been removed.'));
  console.log();
  console.log(sim.getSummary());
}
```

**Step 4: Update `src/cli/commands/diagnose.ts`**

Add flags to index.ts:

```typescript
program
  .command('diagnose')
  .description('Diagnose suffering using the Four Noble Truths')
  .option('--dukkha-types <types>', 'Comma-separated: dukkha-dukkha,viparinama-dukkha,sankhara-dukkha (for --json)')
  .option('--craving-types <types>', 'Comma-separated: sensory,becoming,non-becoming (for --json)')
  .action(diagnose);
```

Update diagnose.ts:

```typescript
import { Command } from 'commander';
import { checkbox } from '@inquirer/prompts';
import { EightfoldPath } from '../../eightfold-path/EightfoldPath';
import { FourNobleTruths } from '../../four-noble-truths/FourNobleTruths';
import { DukkhaType, CravingType } from '../../utils/types';
import { getGlobalOpts } from '../utils/state';
import { header, label, insight, divider } from '../utils/format';

const SUFFERING_CHOICES = [
  { name: 'Obvious suffering (pain, illness, loss)', value: 'dukkha-dukkha' as DukkhaType },
  { name: 'Suffering of change (impermanence of pleasure)', value: 'viparinama-dukkha' as DukkhaType },
  { name: 'Suffering of conditioned existence', value: 'sankhara-dukkha' as DukkhaType },
];

const CRAVING_CHOICES = [
  { name: 'Craving for sensory pleasures', value: 'sensory' as CravingType },
  { name: 'Craving for existence / becoming', value: 'becoming' as CravingType },
  { name: 'Craving for non-existence', value: 'non-becoming' as CravingType },
];

export async function diagnose(this: Command): Promise<void> {
  const globalOpts = getGlobalOpts(this);
  const localOpts = this.opts() as { dukkhaTypes?: string; cravingTypes?: string };

  let suffering: DukkhaType[];
  let cravings: CravingType[];

  if (globalOpts.json) {
    suffering = (localOpts.dukkhaTypes ?? 'dukkha-dukkha').split(',') as DukkhaType[];
    cravings = (localOpts.cravingTypes ?? 'sensory').split(',') as CravingType[];
  } else {
    console.log(header('Four Noble Truths — Diagnosis'));

    suffering = await checkbox<DukkhaType>({
      message: 'What types of suffering are present?',
      choices: SUFFERING_CHOICES,
      required: true,
    });

    cravings = await checkbox<CravingType>({
      message: 'What cravings are active?',
      choices: CRAVING_CHOICES,
      required: true,
    });
  }

  const path = new EightfoldPath();
  const truths = new FourNobleTruths(path);

  const diagnosis = truths.diagnose({ suffering, cravings });

  if (globalOpts.json) {
    console.log(JSON.stringify({
      command: 'diagnose',
      result: {
        suffering: diagnosis.suffering,
        cause: diagnosis.cause,
        cessation: diagnosis.cessationPossible,
        path: diagnosis.path,
      },
    }, null, 2));
    return;
  }

  // Existing chalk output (unchanged from current code)
  console.log();
  console.log(label('Suffering:'));
  console.log(`  Obvious suffering: ${diagnosis.suffering.obviousSuffering ? 'yes' : 'no'}`);
  console.log(`  Suffering of change: ${diagnosis.suffering.sufferingOfChange ? 'yes' : 'no'}`);
  console.log(`  Existential unsatisfactoriness: ${diagnosis.suffering.existentialUnsatisfactoriness ? 'yes' : 'no'}`);
  console.log(`  Types identified: ${diagnosis.suffering.totalTypes}`);
  console.log(`  Insight: ${diagnosis.suffering.insight}`);

  console.log();
  console.log(label('Cause:'));
  console.log(`  Cravings: ${diagnosis.cause.cravingsPresent.join(', ')}`);
  console.log(`  Root causes: ${diagnosis.cause.rootCauses.join(', ')}`);
  console.log(`  Intensity: ${diagnosis.cause.intensity}`);
  console.log(`  Primary driver: ${diagnosis.cause.primaryDriver ?? 'none'}`);
  console.log(`  Recommendation: ${diagnosis.cause.recommendation}`);

  console.log();
  console.log(label('Cessation:'));
  console.log(`  Possible: ${diagnosis.cessationPossible.isPossible}`);
  console.log(`  Progress level: ${diagnosis.cessationPossible.progressLevel}/10`);
  console.log(`  Obstacles: ${diagnosis.cessationPossible.obstacles.join('; ')}`);
  console.log(`  Path forward: ${diagnosis.cessationPossible.pathForward}`);

  console.log();
  console.log(label('Path Forward:'));
  console.log(`  Focus area: ${diagnosis.path.focusArea}`);
  console.log(`  Recommended intensity: ${diagnosis.path.recommendedIntensity}/10`);
  console.log(`  Rationale: ${diagnosis.path.rationale}`);
  console.log(`  Practices:`);
  for (const practice of diagnosis.path.practices) {
    console.log(`    - ${practice}`);
  }

  console.log(divider());
  console.log(insight('The diagnosis is complete. The path is clear.'));
}
```

**Step 5: Update `src/cli/commands/meditate.ts`**

Add `--duration` flag to index.ts:

```typescript
program
  .command('meditate')
  .description('Start a meditation session with mindful check-ins')
  .option('--interval <seconds>', 'Seconds between interval bells', '60')
  .option('--duration <minutes>', 'Duration in minutes (for --json, runs silently)')
  .action(meditate);
```

Add JSON mode to meditate.ts. When `--json` is passed, run a simulated session (no real-time waiting — just create a timer, immediately stop it, return summary):

```typescript
// Add at the top of the meditate function, after parsing options:
if (globalOpts.json) {
  const durationMins = localOpts.duration ? parseInt(localOpts.duration, 10) : 5;
  console.log(JSON.stringify({
    command: 'meditate',
    result: {
      duration: durationMins * 60,
      message: `Meditation session: ${durationMins} minutes. Use interactive mode for real-time practice.`,
    },
  }, null, 2));
  return;
}
```

**Note:** Meditation is inherently real-time and interactive. In JSON mode, we just return metadata rather than simulating a session. The skill can use this to inform the user.

**Step 6: Run tests**

Run: `npx vitest run`
Expected: All tests PASS

**Step 7: Commit**

```bash
git add src/cli/index.ts src/cli/commands/chain.ts src/cli/commands/koan.ts src/cli/commands/sit.ts src/cli/commands/diagnose.ts src/cli/commands/meditate.ts
git commit -m "feat(cli): add --json output and non-interactive flags for all commands"
```

---

### Task 4: Being management commands

Add `buddha beings` (list) and `buddha reset` commands.

**Files:**
- Create: `src/cli/commands/beings.ts`
- Create: `src/cli/commands/reset.ts`
- Modify: `src/cli/index.ts`

**Step 1: Create `src/cli/commands/beings.ts`**

```typescript
import { Command } from 'commander';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { header, label, subtle } from '../utils/format';

export function beings(this: Command): void {
  const opts = getGlobalOpts(this);
  const mgr = getStateManager(opts);
  const names = mgr.listBeings();

  if (opts.json) {
    console.log(JSON.stringify({
      command: 'beings',
      result: { beings: names, count: names.length },
    }, null, 2));
    return;
  }

  console.log(header('Saved Beings'));
  if (names.length === 0) {
    console.log(subtle('  No beings saved yet. Run a command to create one.'));
  } else {
    for (const name of names) {
      console.log(`  ${label(name)}`);
    }
    console.log(subtle(`\n  ${names.length} being(s) saved.`));
  }
}

export function beingsDelete(name: string, _opts: unknown, cmd: Command): void {
  const globalOpts = getGlobalOpts(cmd);
  const mgr = getStateManager(globalOpts);
  mgr.deleteBeing(name);

  if (globalOpts.json) {
    console.log(JSON.stringify({
      command: 'beings delete',
      result: { deleted: name },
    }, null, 2));
    return;
  }

  console.log(`  Deleted being: ${name}`);
}
```

**Step 2: Create `src/cli/commands/reset.ts`**

```typescript
import { Command } from 'commander';
import { Being } from '../../simulation/Being';
import { getGlobalOpts, getStateManager } from '../utils/state';
import { success } from '../utils/format';

export function reset(this: Command): void {
  const opts = getGlobalOpts(this);
  const mgr = getStateManager(opts);
  mgr.saveBeing(opts.being, new Being());

  if (opts.json) {
    console.log(JSON.stringify({
      command: 'reset',
      being: opts.being,
      result: { reset: true },
    }, null, 2));
    return;
  }

  console.log(success(`  Being "${opts.being}" has been reset to a fresh state.`));
}
```

**Step 3: Register in `src/cli/index.ts`**

Add imports and command registrations:

```typescript
import { beings, beingsDelete } from './commands/beings';
import { reset } from './commands/reset';

// ... after existing commands ...

const beingsCmd = program
  .command('beings')
  .description('List saved beings')
  .action(beings);

beingsCmd
  .command('delete <name>')
  .description('Delete a saved being')
  .action(beingsDelete);

program
  .command('reset')
  .description('Reset the current being to a fresh state')
  .action(reset);
```

**Note on Commander subcommand action binding:** `beingsDelete` receives `(name, options, command)` since it has a `<name>` argument. The implementer must verify that `cmd` in `beingsDelete` correctly accesses global opts via `cmd.optsWithGlobals()` or `cmd.parent.parent.opts()`. Test this.

**Step 4: Run tests**

Run: `npx vitest run`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/cli/commands/beings.ts src/cli/commands/reset.ts src/cli/index.ts
git commit -m "feat(cli): add beings list/delete and reset commands"
```

---

### Task 5: Claude Code Plugin

Create the plugin directory with manifest, skills, and entry command.

**Files:**
- Create: `plugin/.claude-plugin/plugin.json`
- Create: `plugin/commands/buddha.md`
- Create: `plugin/skills/status/SKILL.md`
- Create: `plugin/skills/inquiry/SKILL.md`
- Create: `plugin/skills/karma/SKILL.md`
- Create: `plugin/skills/diagnose/SKILL.md`
- Create: `plugin/skills/sit/SKILL.md`
- Create: `plugin/skills/koan/SKILL.md`
- Create: `plugin/skills/chain/SKILL.md`
- Create: `plugin/skills/meditate/SKILL.md`

**Step 1: Create plugin manifest**

```json
// plugin/.claude-plugin/plugin.json
{
  "name": "buddha-js",
  "version": "0.1.0",
  "description": "Buddhist philosophy tools for Claude Code — meditation, diagnosis, karma, koans, and self-inquiry",
  "keywords": ["buddhism", "meditation", "mindfulness", "philosophy"]
}
```

**Step 2: Create `/buddha` entry command**

```markdown
<!-- plugin/commands/buddha.md -->
---
name: buddha
description: Explore Buddhist philosophy tools
---

# Buddha.js — Buddhist Philosophy Tools

Available commands (run via `buddha <command> --json`):

| Command | Description |
|---------|-------------|
| `status` | Show the current state of your being |
| `inquiry` | Investigate the nature of self (anatta) |
| `karma` | Explore intentional action and karmic results |
| `diagnose` | Diagnose suffering using the Four Noble Truths |
| `sit` | Guided cessation through the Poison Arrow method |
| `koan` | Contemplate a Zen koan |
| `chain` | Display the 12 links of dependent origination |
| `meditate` | Start a meditation session |
| `beings` | List saved beings |
| `reset` | Reset a being to fresh state |

## Usage

Ask about any Buddhist concept and the relevant skill will activate automatically. Or run a specific command:

```bash
node dist/cli.mjs status --json --being default
```

**Prerequisites:** The CLI must be built first: `npm run build:cli`
```

**Step 3: Create skill files**

Each skill follows the same pattern: description for auto-activation, instructions to run `buddha <cmd> --json` and present results.

**`plugin/skills/status/SKILL.md`:**
```markdown
---
name: buddha-status
description: Use when the user wants to check their being's current state, path progress, mindfulness level, or karmic status in Buddha.js
---

# Being Status

Check the current state of a Buddha.js being.

## Instructions

1. Run the status command via Bash:
   ```bash
   node dist/cli.mjs status --json --being default
   ```
2. Parse the JSON output
3. Present the results conversationally, highlighting:
   - Path progress and mindfulness level
   - Pending karmic seeds
   - Mind state (calm, focused, dominant factors)

If the user wants a different being, use `--being <name>` instead of `default`.
```

**`plugin/skills/inquiry/SKILL.md`:**
```markdown
---
name: buddha-inquiry
description: Use when the user asks about the nature of self, identity, anatta (not-self), or wants to investigate what they really are in Buddha.js
---

# Self Investigation

Investigate the nature of self through the five aggregates and emptiness analysis.

## Instructions

1. Run the inquiry command via Bash:
   ```bash
   node dist/cli.mjs inquiry --json --being default
   ```
2. Parse the JSON output
3. Present the results conversationally, covering:
   - Whether a fixed self was found in the aggregates
   - The dependent origination insight
   - The emptiness analysis (if present)
   - The final conclusion

This command modifies the being's state (investigation counts as an experience), so the being is saved after running.
```

**`plugin/skills/karma/SKILL.md`:**
```markdown
---
name: buddha-karma
description: Use when the user wants to explore karma, perform intentional actions, plant karmic seeds, or check their karmic stream in Buddha.js
---

# Karma Exploration

Explore intentional action and karmic results.

## Instructions

**To view the karmic stream:**
```bash
node dist/cli.mjs karma --json --being default
```

**To perform an action:**
```bash
node dist/cli.mjs karma --json --being default --quality wholesome --description "Helping a colleague" --intensity 7 --root non-aversion
```

Parameters for actions:
- `--quality`: `wholesome` or `unwholesome`
- `--description`: Text describing the action
- `--intensity`: 1-10
- `--root`: `non-greed`, `non-aversion`, `non-delusion` (wholesome) or `greed`, `aversion`, `delusion` (unwholesome)

Present results conversationally. When the user describes an action, map it to the appropriate quality, intensity, and root before running the command.
```

**`plugin/skills/diagnose/SKILL.md`:**
```markdown
---
name: buddha-diagnose
description: Use when the user describes suffering, dissatisfaction, or a problem they want to examine through the Four Noble Truths in Buddha.js
---

# Four Noble Truths Diagnosis

Diagnose suffering using the Buddhist framework of the Four Noble Truths.

## Instructions

1. If the user describes their suffering, map it to dukkha types and craving types
2. Run the diagnose command:
   ```bash
   node dist/cli.mjs diagnose --json --dukkha-types "dukkha-dukkha,viparinama-dukkha" --craving-types "sensory,becoming"
   ```

Dukkha types: `dukkha-dukkha` (obvious pain), `viparinama-dukkha` (impermanence of pleasure), `sankhara-dukkha` (conditioned existence)

Craving types: `sensory` (sensory pleasures), `becoming` (existence/becoming), `non-becoming` (non-existence)

3. Present the diagnosis conversationally, covering suffering analysis, cause, cessation possibility, and the recommended path forward.
```

**`plugin/skills/sit/SKILL.md`:**
```markdown
---
name: buddha-sit
description: Use when the user wants quick relief from suffering, to practice the Poison Arrow method, or needs guided cessation in Buddha.js
---

# Poison Arrow — Quick Cessation

Guided cessation through the Poison Arrow method (Cula-Malunkyovada Sutta).

## Instructions

1. Ask the user what suffering they're experiencing (or extract it from context)
2. Run the sit command:
   ```bash
   node dist/cli.mjs sit --json --situation "description of suffering"
   ```
3. Present each cessation step conversationally — the stage, truth, insight, and guidance
4. End with the summary
```

**`plugin/skills/koan/SKILL.md`:**
```markdown
---
name: buddha-koan
description: Use when the user wants a Zen koan, a paradox to contemplate, or wants to practice non-dual thinking in Buddha.js
---

# Koan Contemplation

Present and contemplate Zen koans to break out of dualistic thinking.

## Instructions

**To get a random koan:**
```bash
node dist/cli.mjs koan --json
```

**To get a specific koan by ID:**
```bash
node dist/cli.mjs koan --json --id <koan-id>
```

Present the koan's title, case text, source, and hint. Invite the user to contemplate and respond. Koans are meant to be sat with, not solved logically.
```

**`plugin/skills/chain/SKILL.md`:**
```markdown
---
name: buddha-chain
description: Use when the user asks about dependent origination, the 12 links/nidanas, or how suffering arises through conditions in Buddha.js
---

# Dependent Origination Chain

Display and explain the 12 links of dependent origination (pratityasamutpada).

## Instructions

1. Run the chain command:
   ```bash
   node dist/cli.mjs chain --json
   ```
2. Present the 12 links in order with their Sanskrit names
3. Highlight the liberation point and its practice instruction
```

**`plugin/skills/meditate/SKILL.md`:**
```markdown
---
name: buddha-meditate
description: Use when the user wants to meditate, practice mindfulness, or start a meditation session in Buddha.js
---

# Meditation

Guide the user through meditation practice.

## Instructions

The meditation command is best used interactively in the terminal:
```bash
node dist/cli.mjs meditate --interval 30
```

In JSON mode, it returns metadata only (meditation requires real-time interaction):
```bash
node dist/cli.mjs meditate --json --duration 5
```

For Claude Code context: suggest the user run the meditation command directly in their terminal for the full experience. You can offer to set up the command for them.
```

**Step 4: Verify plugin structure**

Run: `find plugin/ -type f | sort`
Expected output:
```
plugin/.claude-plugin/plugin.json
plugin/commands/buddha.md
plugin/skills/chain/SKILL.md
plugin/skills/diagnose/SKILL.md
plugin/skills/inquiry/SKILL.md
plugin/skills/karma/SKILL.md
plugin/skills/koan/SKILL.md
plugin/skills/meditate/SKILL.md
plugin/skills/sit/SKILL.md
plugin/skills/status/SKILL.md
```

**Step 5: Commit**

```bash
git add plugin/
git commit -m "feat: add Claude Code plugin with skills for all CLI commands"
```

---

### Task 6: Documentation and TODO update

Update README, CLAUDE.md, and TODO.md.

**Files:**
- Modify: `CLAUDE.md`
- Modify: `TODO.md`

**Step 1: Update CLAUDE.md**

Add to the Commands section:

```bash
# CLI persistence
buddha status --being monk          # Use named being
buddha beings                       # List saved beings
buddha reset --being monk           # Reset a being
BUDDHA_STATE_DIR=/tmp/b buddha status  # Custom state dir

# JSON output (for scripts and skills)
buddha status --json --being default
buddha karma --json --quality wholesome --description "Helping" --intensity 7 --root non-greed
```

Add to the Module Structure table a note about the plugin:

```markdown
| `plugin/` | Claude Code plugin | Skills and commands for Claude Code integration |
```

**Step 2: Add new TODO items and mark complete**

Add to TODO.md under Core Features:

```markdown
- [x] **CLI Persistence**: Save and restore Being state between CLI sessions with named beings.
- [x] **CLI JSON Output**: Machine-readable `--json` output for all commands.
- [x] **Claude Code Plugin**: Package CLI as a Claude Code plugin with auto-activating skills.
```

**Step 3: Commit**

```bash
git add CLAUDE.md TODO.md
git commit -m "docs: update CLAUDE.md and TODO.md for CLI persistence and plugin"
```

---

Plan complete and saved to `docs/plans/2026-02-18-cli-persistence-plugin.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?