import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Command } from 'commander';
import { StateManager } from '../../src/cli/utils/state';
import { Being } from '../../src/simulation/Being';
import type { BeingData } from '../../src/utils/types';
import { status } from '../../src/cli/commands/status';
import { karma } from '../../src/cli/commands/karma';
import { inquiry } from '../../src/cli/commands/inquiry';
import { chain } from '../../src/cli/commands/chain';
import { diagnose } from '../../src/cli/commands/diagnose';
import { koan } from '../../src/cli/commands/koan';
import { sit } from '../../src/cli/commands/sit';
import { meditate } from '../../src/cli/commands/meditate';
import { reset } from '../../src/cli/commands/reset';
import { beings, beingsDelete } from '../../src/cli/commands/beings';
import {
  runKarma,
  runStatus,
  runMeditate,
  runKoan,
  runSit,
  runBeings,
  runBeingsDelete,
  runReset,
  runInquiry,
  runChain,
  runDiagnose,
  isKarmaError,
  KarmaResult,
} from '../../src/cli/utils/runner';

/** Narrow away the error branch so a test can read the result. */
function karmaOf(result: ReturnType<typeof runKarma>): KarmaResult {
  if (isKarmaError(result)) {
    throw new Error(`expected a karma result, got an error: ${result.error}`);
  }
  return result;
}

describe('CLI command bodies', () => {
  let dir: string;
  let sm: StateManager;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'buddha-cli-'));
    sm = new StateManager(dir);
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  describe('karma', () => {
    it('plants a seed with the quality its root implies', () => {
      const result = karmaOf(runKarma(sm, 'tester', {
        description: 'helped a stranger',
        intensity: '6',
        root: 'non-greed',
      }));
      expect(result.result.karmicSeeds.length).toBeGreaterThan(0);
      expect(result.result.karmicSeeds[0].quality).toBe('wholesome');
    });

    it('derives an unwholesome quality from an unwholesome root', () => {
      const result = karmaOf(runKarma(sm, 'tester', {
        description: 'snapped at a colleague',
        intensity: '6',
        root: 'aversion',
      }));
      expect(result.result.karmicSeeds[0].quality).toBe('unwholesome');
    });

    it('persists the seed so a later call sees it', () => {
      runKarma(sm, 'tester', { description: 'a deed', intensity: '5', root: 'greed' });
      const second = karmaOf(runKarma(sm, 'tester', {}));
      expect(second.result.totalActions).toBeGreaterThan(0);
      expect(second.result.karmicSeeds.some(s => s.description.includes('a deed'))).toBe(true);
    });

    it('rejects a --quality that contradicts the root', () => {
      const result = runKarma(sm, 'tester', {
        description: 'gave freely',
        intensity: '5',
        root: 'non-greed',
        quality: 'unwholesome',
      });
      expect(isKarmaError(result)).toBe(true);
    });

    it('plants nothing when the action fields are incomplete', () => {
      const result = karmaOf(runKarma(sm, 'tester', { description: 'partial' }));
      expect(result.result.totalActions).toBe(0);
    });
  });

  describe('status', () => {
    it('reports the being it was asked about', () => {
      const result = runStatus(sm, 'tester');
      expect(result.command).toBe('status');
      expect(result.being).toBe('tester');
      expect(typeof result.result.mindfulnessLevel).toBe('number');
      expect(result.result.mindState).toHaveProperty('isCalm');
    });

    it('sees the karma another command planted', () => {
      runKarma(sm, 'tester', { description: 'a deed', intensity: '5', root: 'greed' });
      expect(runStatus(sm, 'tester').result.pendingKarma).toBeGreaterThan(0);
    });

    it('never writes to disk', () => {
      runKarma(sm, 'tester', { description: 'a deed', intensity: '5', root: 'greed' });
      const file = path.join(dir, 'beings', 'tester.json');
      const before = fs.readFileSync(file);
      runStatus(sm, 'tester');
      expect(fs.readFileSync(file)).toEqual(before);
    });

    it('creates no file for a being that does not exist', () => {
      runStatus(sm, 'nobody');
      expect(fs.existsSync(path.join(dir, 'beings', 'nobody.json'))).toBe(false);
    });
  });

  describe('meditate', () => {
    // The regression that motivated this task: --duration reached the JSON
    // path only, and nothing asserted it was read at all.
    it('honours --duration', () => {
      expect(runMeditate(sm, 'tester', { duration: '15' }).result.durationMinutes).toBe(15);
    });

    it('defaults to five minutes when no duration is given', () => {
      expect(runMeditate(sm, 'tester', {}).result.durationMinutes).toBe(5);
    });

    it('names the duration in its message', () => {
      expect(runMeditate(sm, 'tester', { duration: '20' }).result.message).toContain('20 minutes');
    });

    // Task 9: meditate now practices on, and saves, the named being — a
    // session leaves a trace, like the MCP `buddha_meditate` tool it mirrors.
    it('persists the practiced mindfulness', () => {
      runMeditate(sm, 'tester', { duration: '15' });
      expect(fs.existsSync(path.join(dir, 'beings', 'tester.json'))).toBe(true);
      expect(runStatus(sm, 'tester').result.mindfulnessLevel).toBeGreaterThan(0);
    });

    it('does not affect a being it was not given', () => {
      runMeditate(sm, 'tester', { duration: '15' });
      expect(fs.existsSync(path.join(dir, 'beings', 'someone-else.json'))).toBe(false);
    });
  });

  describe('koan', () => {
    it('returns a koan with an id and a source', () => {
      const { result } = runKoan(sm, 'tester', {});
      expect(result.id).toBeTruthy();
      expect(result.source).toBeTruthy();
      expect(result.case).toBeTruthy();
      expect(result.title).toBeTruthy();
    });

    it('presents the koan named by --id', () => {
      const anyKoan = runKoan(sm, 'tester', {}).result;
      expect(runKoan(sm, 'tester', { id: anyKoan.id }).result.id).toBe(anyKoan.id);
    });

    it('reports a missing hint as null rather than undefined', () => {
      const { result } = runKoan(sm, 'tester', {});
      expect(result.hint === null || typeof result.hint === 'string').toBe(true);
    });
  });

  describe('sit', () => {
    it('walks the four stages of cessation', () => {
      const { result } = runSit(sm, 'tester', { situation: 'a missed deadline' });
      expect(result.steps).toHaveLength(4);
      expect(result.steps.every(s => s.stage && s.truth && s.insight && s.guidance)).toBe(true);
    });

    it('echoes the situation it was given', () => {
      expect(runSit(sm, 'tester', { situation: 'a missed deadline' }).result.suffering)
        .toBe('a missed deadline');
    });

    it('falls back to unspecified suffering', () => {
      expect(runSit(sm, 'tester', {}).result.suffering).toBe('unspecified suffering');
    });

    it('summarises the completed walk', () => {
      expect(runSit(sm, 'tester', {}).result.summary).toBeTruthy();
    });
  });

  describe('beings', () => {
    it('lists nothing before anything is saved', () => {
      const { result } = runBeings(sm);
      expect(result.beings).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('lists what other commands created', () => {
      runKarma(sm, 'alice', { description: 'a deed', intensity: '5', root: 'greed' });
      runKarma(sm, 'bob', { description: 'a deed', intensity: '5', root: 'greed' });
      const { result } = runBeings(sm);
      expect(result.beings.sort()).toEqual(['alice', 'bob']);
      expect(result.count).toBe(2);
    });

    it('delete removes the named being and leaves the others', () => {
      runKarma(sm, 'alice', { description: 'a deed', intensity: '5', root: 'greed' });
      runKarma(sm, 'bob', { description: 'a deed', intensity: '5', root: 'greed' });
      expect(runBeingsDelete(sm, 'alice').result.deleted).toBe('alice');
      expect(runBeings(sm).result.beings).toEqual(['bob']);
    });

    it('delete of an unknown being is not an error', () => {
      expect(() => runBeingsDelete(sm, 'nobody')).not.toThrow();
    });
  });

  describe('reset', () => {
    it('clears the karma that had been planted', () => {
      runKarma(sm, 'tester', { description: 'a deed', intensity: '5', root: 'greed' });
      expect(runStatus(sm, 'tester').result.pendingKarma).toBeGreaterThan(0);

      const payload = runReset(sm, 'tester');
      expect(payload.result.reset).toBe(true);
      expect(payload.being).toBe('tester');
      expect(runStatus(sm, 'tester').result.pendingKarma).toBe(0);
    });

    // It overwrites rather than unlinks, so the being stays listed.
    it('writes a fresh being rather than removing the file', () => {
      runReset(sm, 'tester');
      expect(fs.existsSync(path.join(dir, 'beings', 'tester.json'))).toBe(true);
      expect(runBeings(sm).result.beings).toContain('tester');
    });

    it('leaves other beings alone', () => {
      runKarma(sm, 'other', { description: 'a deed', intensity: '5', root: 'greed' });
      runReset(sm, 'tester');
      expect(runStatus(sm, 'other').result.pendingKarma).toBeGreaterThan(0);
    });
  });

  describe('inquiry', () => {
    it('returns its analysis for the named being', () => {
      const payload = runInquiry(sm, 'tester');
      expect(payload.being).toBe('tester');
      expect(payload.result.selfFound).toBe(false);
      expect(payload.result.aggregatesExamined.length).toBeGreaterThan(0);
      expect(payload.result.overallConclusion).toBeTruthy();
      expect(payload.result.dependentOriginationInsight).toBeTruthy();
    });

    it('saves the being it investigated', () => {
      runInquiry(sm, 'tester');
      expect(fs.existsSync(path.join(dir, 'beings', 'tester.json'))).toBe(true);
      expect(runBeings(sm).result.beings).toContain('tester');
    });

    it('investigates the named being, not a shared one', () => {
      runKarma(sm, 'alice', { description: 'a deed', intensity: '5', root: 'greed' });
      const payload = runInquiry(sm, 'alice');
      // The karma alice carries is visible in the state the inquiry reports.
      expect(payload.state.karmicActions).toBeGreaterThan(0);
      expect(runInquiry(sm, 'bob').state.karmicActions).toBe(0);
    });
  });

  describe('chain', () => {
    it('returns the twelve links in order, with a liberation point', () => {
      const { result } = runChain(sm, 'tester');
      expect(result.links).toHaveLength(12);
      expect(result.links.map(l => l.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      expect(result.links.every(l => l.name && l.sanskritName)).toBe(true);
      expect(result.liberationPoint).toBeTruthy();
    });

    // Task 9: chain now loads the named being (its `dependentOrigination`,
    // rather than a fresh throwaway one). Nothing in this repo ever advances
    // a link's `hasArisen` past its constructor default, so no being's chain
    // actually differs from another's today — planting karma on alice
    // doesn't touch her dependent-origination chain, so this can't be shown
    // via alice-vs-nobody output equality the way `diagnose`'s twin test can
    // no longer be shown that way either. What changed is observable instead
    // through the being name now being used to load: an invalid one is
    // rejected, where it was silently ignored before.
    it('reads the named being off disk, rejecting an invalid name', () => {
      expect(() => runChain(sm, '../../../etc/passwd')).toThrow('Invalid being name');
    });

    it('reads no being from disk', () => {
      runChain(sm, 'tester');
      expect(fs.existsSync(path.join(dir, 'beings', 'tester.json'))).toBe(false);
    });
  });

  describe('diagnose', () => {
    it('returns all four truths of the diagnosis', () => {
      const { result } = runDiagnose(sm, 'tester', {});
      expect(result.suffering).toBeTruthy();
      expect(result.cause).toBeTruthy();
      expect(result.cessation).toBeTruthy();
      expect(result.path.practices.length).toBeGreaterThan(0);
    });

    it('defaults to dukkha-dukkha and sensory craving', () => {
      const { result } = runDiagnose(sm, 'tester', {});
      expect(result.suffering.obviousSuffering).toBe(true);
      expect(result.cause.cravingsPresent).toContain('sensory');
    });

    it('takes the parsed arrays the interactive checkboxes hold', () => {
      const viaArrays = runDiagnose(sm, 'tester', {
        dukkhaTypes: ['dukkha-dukkha', 'viparinama-dukkha'],
        cravingTypes: ['becoming'],
      });
      const viaFlags = runDiagnose(sm, 'tester', {
        dukkhaTypes: 'dukkha-dukkha,viparinama-dukkha',
        cravingTypes: 'becoming',
      });
      expect(viaArrays).toEqual(viaFlags);
    });

    // The reason the arrays go through unjoined: rendering them as a string
    // first turns an empty selection into the defaults, silently.
    it('an empty array selects nothing rather than falling back to the defaults', () => {
      const { result } = runDiagnose(sm, 'tester', { dukkhaTypes: [], cravingTypes: [] });
      expect(result.suffering.totalTypes).toBe(0);
      expect(result.suffering.obviousSuffering).toBe(false);
      expect(result.cause.cravingsPresent).toEqual([]);
    });

    it('reads the comma-separated types it is given', () => {
      const { result } = runDiagnose(sm, 'tester', {
        dukkhaTypes: 'dukkha-dukkha,viparinama-dukkha,sankhara-dukkha',
        cravingTypes: 'becoming,non-becoming',
      });
      expect(result.suffering.totalTypes).toBe(3);
      expect(result.suffering.sufferingOfChange).toBe(true);
      expect(result.suffering.existentialUnsatisfactoriness).toBe(true);
      expect(result.cause.cravingsPresent.sort()).toEqual(['becoming', 'non-becoming']);
    });

    // Task 9: diagnose now reads the named being's own `fourNobleTruths`
    // instead of building a fresh, throwaway one. Magga's prescription
    // doesn't actually consult path state today, so — like `chain` — no
    // being's diagnosis differs from another's yet; planting karma on alice
    // doesn't change what she's prescribed. What changed is observable
    // through the being name now being used to load: an invalid one is
    // rejected, where it was silently ignored before.
    it('reads the named being off disk, rejecting an invalid name', () => {
      expect(() => runDiagnose(sm, '../../../etc/passwd', {})).toThrow('Invalid being name');
    });

    it('reads no being from disk', () => {
      runDiagnose(sm, 'tester', {});
      expect(fs.existsSync(path.join(dir, 'beings', 'tester.json'))).toBe(false);
    });
  });
});

describe('settling a rebirth that came due on disk', () => {
  // BUDDHA_INCARNATION_GAP_MS is the knob that decides when a load flags a
  // rebirth as due. At 0, any reload of a saved being flags one — which is
  // the state every mutating command has to cope with, and the branch of
  // loadSettledBeing that nothing else in the repo covers.
  const GAP = 'BUDDHA_INCARNATION_GAP_MS';
  let dir: string;
  let sm: StateManager;
  let previousGap: string | undefined;

  /** Save a being, then make any reload of it due for rebirth. */
  function saveThenAge(name: string): void {
    const being = new Being();
    being.act('a deed that follows the continuum across', 5, 'greed');
    sm.saveBeing(name, being);
    process.env[GAP] = '0';
  }

  function persisted(name: string): BeingData {
    return JSON.parse(fs.readFileSync(path.join(dir, 'beings', `${name}.json`), 'utf-8'));
  }

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'buddha-cli-'));
    sm = new StateManager(dir);
    previousGap = process.env[GAP];
  });
  afterEach(() => {
    if (previousGap === undefined) delete process.env[GAP];
    else process.env[GAP] = previousGap;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('karma reports the rebirth in its result document', () => {
    saveThenAge('tester');
    const before = persisted('tester');

    const payload = karmaOf(runKarma(sm, 'tester', {}));

    expect(payload.rebirth).toBeDefined();
    expect(payload.rebirth!.fromRealm).toBeTruthy();
    expect(payload.rebirth!.toRealm).toBeTruthy();
    expect(payload.rebirth!.incarnation).toBe((before.incarnation ?? 1) + 1);
  });

  it('karma persists the newly-transmigrated being, not the one it loaded', () => {
    saveThenAge('tester');
    const before = persisted('tester');

    const payload = karmaOf(runKarma(sm, 'tester', {}));
    const after = persisted('tester');

    expect(after.incarnation).toBe((before.incarnation ?? 1) + 1);
    expect(after.realm).toBe(payload.rebirth!.toRealm);
    expect(payload.rebirth!.fromRealm).toBe(before.realm ?? 'human');
  });

  it('the karmic continuum survives the rebirth', () => {
    saveThenAge('tester');
    const payload = karmaOf(runKarma(sm, 'tester', {}));
    expect(payload.result.karmicSeeds.some(s => s.description.includes('follows the continuum'))).toBe(true);
  });

  it('settling once is enough — the next call reports no rebirth', () => {
    saveThenAge('tester');
    runKarma(sm, 'tester', {});
    const settledIncarnation = persisted('tester').incarnation;

    // The gap knob is still 0, so the freshly-saved being is due again; what
    // must not happen is the SAME rebirth being settled twice.
    const second = karmaOf(runKarma(sm, 'tester', {}));
    expect(second.rebirth!.incarnation).toBe((settledIncarnation ?? 1) + 1);
  });

  it('inquiry settles too, and says so', () => {
    saveThenAge('tester');
    const before = persisted('tester');

    const payload = runInquiry(sm, 'tester');

    expect(payload.rebirth).toBeDefined();
    expect(payload.rebirth!.incarnation).toBe((before.incarnation ?? 1) + 1);
    expect(persisted('tester').incarnation).toBe(payload.rebirth!.incarnation);
  });

  it('status does not settle: observation does not rebirth', () => {
    saveThenAge('tester');
    const before = fs.readFileSync(path.join(dir, 'beings', 'tester.json'));

    const payload = runStatus(sm, 'tester');

    expect(payload).not.toHaveProperty('rebirth');
    expect(fs.readFileSync(path.join(dir, 'beings', 'tester.json'))).toEqual(before);
  });

  it('a command run inside the gap reports no rebirth at all', () => {
    const being = new Being();
    sm.saveBeing('tester', being);
    // No aging: the default gap has not elapsed.
    expect(karmaOf(runKarma(sm, 'tester', {})).rebirth).toBeUndefined();
  });
});

/**
 * The Commander action handlers themselves.
 *
 * Each handler reads its globals through `cmd.optsWithGlobals()` and nothing
 * else off the Command, so a stub is enough to drive the `--json` branch —
 * the branch that returns before any @inquirer prompt is reached. This covers
 * the printing layer that the runner tests above deliberately skip.
 */
describe('CLI action handlers (--json)', () => {
  let dir: string;
  let logged: string[];
  let logSpy: ReturnType<typeof vi.spyOn>;

  /** A Command stand-in carrying the global options the handlers read. */
  function stubCmd(being = 'tester'): Command {
    return {
      optsWithGlobals: () => ({ json: true, being, stateDir: dir }),
    } as unknown as Command;
  }

  /** The single JSON document a handler printed. */
  function lastJson(): any {
    return JSON.parse(logged[logged.length - 1]);
  }

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'buddha-cli-'));
    logged = [];
    logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(' '));
    });
  });
  afterEach(() => {
    logSpy.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('status prints the being status as JSON', () => {
    status({}, stubCmd());
    expect(lastJson().command).toBe('status');
    expect(lastJson().being).toBe('tester');
  });

  it('karma prints the seed it planted', async () => {
    await karma(
      { description: 'helped a stranger', intensity: '6', root: 'non-greed' },
      stubCmd(),
    );
    const out = lastJson();
    expect(out.command).toBe('karma');
    expect(out.result.karmicSeeds[0].quality).toBe('wholesome');
  });

  it('karma exits non-zero when quality contradicts the root', async () => {
    const previousExitCode = process.exitCode;
    try {
      await karma(
        { description: 'gave freely', intensity: '5', root: 'non-greed', quality: 'unwholesome' },
        stubCmd(),
      );
      expect(lastJson().error).toContain('contradicts');
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = previousExitCode;
    }
  });

  it('inquiry prints its analysis', () => {
    inquiry({}, stubCmd());
    expect(lastJson().command).toBe('inquiry');
    expect(lastJson().result.selfFound).toBe(false);
  });

  it('chain prints the twelve links', () => {
    chain({}, stubCmd());
    expect(lastJson().result.links).toHaveLength(12);
  });

  it('diagnose prints a diagnosis', async () => {
    await diagnose({}, stubCmd());
    expect(lastJson().command).toBe('diagnose');
    expect(lastJson().result.path.practices.length).toBeGreaterThan(0);
  });

  it('koan prints a koan', async () => {
    await koan({}, stubCmd());
    expect(lastJson().result.id).toBeTruthy();
  });

  it('sit prints the four cessation stages', async () => {
    await sit({ situation: 'a missed deadline' }, stubCmd());
    expect(lastJson().result.steps).toHaveLength(4);
  });

  it('meditate prints the session it would run', async () => {
    await meditate({ duration: '15' }, stubCmd());
    expect(lastJson().result.durationMinutes).toBe(15);
  });

  it('reset prints its confirmation and clears the being', () => {
    reset({}, stubCmd());
    expect(lastJson().result.reset).toBe(true);
    expect(fs.existsSync(path.join(dir, 'beings', 'tester.json'))).toBe(true);
  });

  it('beings lists and beings delete removes', () => {
    reset({}, stubCmd('alice'));
    beings({}, stubCmd());
    expect(lastJson().result.beings).toEqual(['alice']);

    beingsDelete('alice', {}, stubCmd());
    expect(lastJson().result.deleted).toBe('alice');

    beings({}, stubCmd());
    expect(lastJson().result.count).toBe(0);
  });
});
