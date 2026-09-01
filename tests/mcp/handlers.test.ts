import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StateManager } from '../../src/cli/utils/state';
import { createBeing, listBeings, deleteBeing, getStatus, experienceSensory, act, ripenKarma, meditate, diagnose, inquiry, chain, presentKoan, getTrapJournal, contemplateKoan, sitWithSuffering, cognizeObject, rebirthBeing } from '../../src/mcp/handlers';

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

  test('getStatus throws for a nonexistent being instead of creating one', () => {
    expect(() => getStatus(sm, 'no-such-being')).toThrow(/Being not found/);
    expect(sm.listBeings()).not.toContain('no-such-being');
  });

  test('act throws for a nonexistent being', () => {
    expect(() => act(sm, 'no-such-being', 'walk', 3)).toThrow(/Being not found/);
  });
});

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
    const result = act(sm, 'actor', 'gave food to a hungry person', 7, 'non-greed');
    expect(result).toHaveProperty('quality', 'wholesome');
    expect(result).toHaveProperty('intention.description');
  });

  test('act derives quality from root, ignoring any independently-assigned quality', () => {
    const result = act(sm, 'actor', 'stole food', 7, 'greed');
    expect(result).toHaveProperty('quality', 'unwholesome');
  });

  test('ripenKarma returns a karmic results report', () => {
    act(sm, 'actor', 'small kind act', 3);
    const report = ripenKarma(sm, 'actor');
    expect(Array.isArray(report.seedVipakas)).toBe(true);
    expect(Array.isArray(report.whyNot)).toBe(true);
  });

  test('ripenKarma without force returns whyNot explanations', () => {
    act(sm, 'actor', 'planted rice', 5, 'non-greed');
    const report = ripenKarma(sm, 'actor');
    expect(report.whyNot.length).toBeGreaterThan(0);
  });

  test('ripenKarma with force ripens everything eligible deterministically', () => {
    act(sm, 'actor', 'gave alms', 5, 'non-greed');
    const report = ripenKarma(sm, 'actor', true);
    expect(Array.isArray(report.seedVipakas)).toBe(true);
  });
});

describe('MCP handlers — depth features', () => {
  let sm: StateManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'buddha-mcp-'));
    sm = new StateManager(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('cognizeObject runs a vithi and persists planted seeds', () => {
    createBeing(sm, 'seer');
    const result = cognizeObject(sm, 'seer', 'a red flower', 'eye');
    expect(result.seedsPlanted).toHaveLength(3);
    const reloaded = sm.loadExistingBeing('seer');
    expect(reloaded.karmicStore.getSeeds().length).toBeGreaterThanOrEqual(3);
  });

  test('rebirthBeing advances the incarnation', () => {
    createBeing(sm, 'phoenix');
    expect(rebirthBeing(sm, 'phoenix').incarnation).toBe(2);
  });

  test('rebirthBeing persists the NEW being, not the dead loaded one', () => {
    createBeing(sm, 'grasper');
    act(sm, 'grasper', 'hoarded wealth', 8, 'greed');
    act(sm, 'grasper', 'hoarded more wealth', 8, 'greed');
    act(sm, 'grasper', 'hoarded even more wealth', 8, 'greed');

    const result = rebirthBeing(sm, 'grasper');
    expect(result.toRealm).toBe('preta');
    expect(result).not.toHaveProperty('being');

    const reloaded = sm.loadExistingBeing('grasper');
    expect(reloaded.realm).toBe('preta');
    expect(reloaded.realm).toBe(result.toRealm);
  });

  test('rebirthBeing response includes a one-line realm description', () => {
    createBeing(sm, 'wanderer');
    const result = rebirthBeing(sm, 'wanderer');
    expect(typeof result.description).toBe('string');
    expect(result.description).toContain(result.toRealm);
  });

  test('getStatus includes a seeds section', () => {
    createBeing(sm, 'yogi');
    act(sm, 'yogi', 'meditated', 4, 'non-delusion');
    const result = getStatus(sm, 'yogi');
    expect(result.seeds).toHaveProperty('balance');
    expect(result.seeds).toHaveProperty('byState');
    expect(result.seeds).toHaveProperty('byTiming');
    expect(result.seeds).toHaveProperty('incarnation', 1);
    expect(result.seeds).toHaveProperty('realm', 'human');
  });

  describe('pending-rebirth settlement', () => {
    const ORIGINAL_GAP = process.env.BUDDHA_INCARNATION_GAP_MS;

    afterEach(() => {
      if (ORIGINAL_GAP === undefined) {
        delete process.env.BUDDHA_INCARNATION_GAP_MS;
      } else {
        process.env.BUDDHA_INCARNATION_GAP_MS = ORIGINAL_GAP;
      }
    });

    test('getStatus is read-only: two consecutive calls do not settle or mutate the saved file', () => {
      createBeing(sm, 'sleeper');
      const beingFile = join(tempDir, 'beings', 'sleeper.json');
      const before = readFileSync(beingFile, 'utf-8');

      // Force every load to observe the incarnation gap as crossed.
      process.env.BUDDHA_INCARNATION_GAP_MS = '0';

      const first = getStatus(sm, 'sleeper');
      const afterFirst = readFileSync(beingFile, 'utf-8');
      const second = getStatus(sm, 'sleeper');
      const afterSecond = readFileSync(beingFile, 'utf-8');

      expect(first.seeds.realm).toBe(second.seeds.realm);
      expect(afterFirst).toBe(before);
      expect(afterSecond).toBe(before);
    });

    test('act settles a pending rebirth before continuing, persists the new realm, and reports it', () => {
      createBeing(sm, 'crosser');
      act(sm, 'crosser', 'hoarded wealth', 8, 'greed');
      act(sm, 'crosser', 'hoarded more wealth', 8, 'greed');
      act(sm, 'crosser', 'hoarded even more wealth', 8, 'greed');
      rebirthBeing(sm, 'crosser');

      // Only now simulate the gap having elapsed since the last save, so
      // exactly the next load (inside the following act() call) observes
      // pendingRebirth — a mutating handler must settle it before doing its
      // own work, and report that it did.
      process.env.BUDDHA_INCARNATION_GAP_MS = '0';

      // This load itself observes the gap as crossed too (BUDDHA_INCARNATION_GAP_MS=0),
      // so it already reflects the load-time +1 advance that settling below
      // is designed to net out to a single +1 overall — beforeIncarnation is
      // therefore the SAME value act() below should settle to, not one less.
      const beforeIncarnation = sm.loadExistingBeing('crosser').incarnation;

      const result = act(sm, 'crosser', 'gave alms', 5, 'non-greed') as Record<string, unknown>;
      expect(result).toHaveProperty('rebirth');
      const rebirth = result.rebirth as { fromRealm: string; toRealm: string; incarnation: number };
      expect(rebirth.incarnation).toBe(beforeIncarnation);

      // Reload with the gap restored to its default so this reload itself
      // doesn't observe a further (unsettled) gap crossing — we're checking
      // what act() persisted, not stacking another in-memory bump on read.
      if (ORIGINAL_GAP === undefined) {
        delete process.env.BUDDHA_INCARNATION_GAP_MS;
      } else {
        process.env.BUDDHA_INCARNATION_GAP_MS = ORIGINAL_GAP;
      }
      const reloaded = sm.loadExistingBeing('crosser');
      expect(reloaded.realm).toBe(rebirth.toRealm);
      expect(reloaded.incarnation).toBe(rebirth.incarnation);
    });

    test('diagnose settles a pending rebirth before continuing and persists the new realm', () => {
      createBeing(sm, 'crosser2');
      act(sm, 'crosser2', 'hoarded wealth', 8, 'greed');
      act(sm, 'crosser2', 'hoarded more wealth', 8, 'greed');
      act(sm, 'crosser2', 'hoarded even more wealth', 8, 'greed');
      rebirthBeing(sm, 'crosser2');

      process.env.BUDDHA_INCARNATION_GAP_MS = '0';

      const result = diagnose(sm, 'crosser2', ['dukkha-dukkha'], ['sensory']) as Record<string, unknown>;
      expect(result).toHaveProperty('rebirth');
      const rebirth = result.rebirth as { fromRealm: string; toRealm: string; incarnation: number };

      if (ORIGINAL_GAP === undefined) {
        delete process.env.BUDDHA_INCARNATION_GAP_MS;
      } else {
        process.env.BUDDHA_INCARNATION_GAP_MS = ORIGINAL_GAP;
      }
      const reloaded = sm.loadExistingBeing('crosser2');
      expect(reloaded.realm).toBe(rebirth.toRealm);
      expect(reloaded.incarnation).toBe(rebirth.incarnation);
    });

    test('inquiry settles a pending rebirth before continuing and persists the new realm', () => {
      createBeing(sm, 'crosser3');
      act(sm, 'crosser3', 'hoarded wealth', 8, 'greed');
      act(sm, 'crosser3', 'hoarded more wealth', 8, 'greed');
      act(sm, 'crosser3', 'hoarded even more wealth', 8, 'greed');
      rebirthBeing(sm, 'crosser3');

      process.env.BUDDHA_INCARNATION_GAP_MS = '0';

      const result = inquiry(sm, 'crosser3') as Record<string, unknown>;
      expect(result).toHaveProperty('rebirth');
      const rebirth = result.rebirth as { fromRealm: string; toRealm: string; incarnation: number };

      if (ORIGINAL_GAP === undefined) {
        delete process.env.BUDDHA_INCARNATION_GAP_MS;
      } else {
        process.env.BUDDHA_INCARNATION_GAP_MS = ORIGINAL_GAP;
      }
      const reloaded = sm.loadExistingBeing('crosser3');
      expect(reloaded.realm).toBe(rebirth.toRealm);
      expect(reloaded.incarnation).toBe(rebirth.incarnation);
    });

    test('rebirthBeing on a gap-crossed being settles the pending rebirth rather than double-advancing', () => {
      createBeing(sm, 'crosser4');
      const savedIncarnation = sm.loadExistingBeing('crosser4').incarnation;
      expect(savedIncarnation).toBe(1);

      // Force the load inside rebirthBeing to observe the gap as crossed —
      // it must settle that pending rebirth (net +1), not call being.rebirth()
      // directly on top of an already-advanced-by-load incarnation.
      process.env.BUDDHA_INCARNATION_GAP_MS = '0';

      const result = rebirthBeing(sm, 'crosser4');
      expect(result.incarnation).toBe(savedIncarnation + 1);

      if (ORIGINAL_GAP === undefined) {
        delete process.env.BUDDHA_INCARNATION_GAP_MS;
      } else {
        process.env.BUDDHA_INCARNATION_GAP_MS = ORIGINAL_GAP;
      }
      const reloaded = sm.loadExistingBeing('crosser4');
      expect(reloaded.incarnation).toBe(savedIncarnation + 1);
    });
  });
});

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

  test('diagnose returns suffering analysis', () => {
    const result = diagnose(sm, 'meditator', ['dukkha-dukkha'], ['sensory']);
    expect(result).toBeDefined();
  });

  test('inquiry investigates self and returns result', () => {
    const result = inquiry(sm, 'meditator');
    expect(result).toHaveProperty('conclusion');
  });

  // Note: `faceSuffering` and `investigateSelf` are pure analysis methods — they
  // don't mutate any Being state that gets serialized, so the persisted JSON is
  // byte-identical before and after the handler runs. A before/after file-content
  // diff would therefore be a false assertion here. Instead, spy on the actual
  // write call so the test fails precisely when `sm.saveBeing(...)` is removed
  // from the handler (verified locally by commenting it out — see fixwave report).
  test('diagnose persists the being via a save call', () => {
    const beingFile = join(tempDir, 'beings', 'meditator.json');
    expect(readFileSync(beingFile, 'utf-8').length).toBeGreaterThan(0);

    const saveSpy = vi.spyOn(sm, 'saveBeing');
    diagnose(sm, 'meditator', ['dukkha-dukkha'], ['sensory']);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith('meditator', expect.anything());
    saveSpy.mockRestore();
  });

  test('inquiry persists the being via a save call', () => {
    const beingFile = join(tempDir, 'beings', 'meditator.json');
    expect(readFileSync(beingFile, 'utf-8').length).toBeGreaterThan(0);

    const saveSpy = vi.spyOn(sm, 'saveBeing');
    inquiry(sm, 'meditator');

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith('meditator', expect.anything());
    saveSpy.mockRestore();
  });

  test('chain returns dependent origination visualization', () => {
    const result = chain(sm, 'meditator');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

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

  test('presentKoan composes a koan from title and case', () => {
    const koan = presentKoan('unread-file', {
      title: 'The Unread File',
      case: 'You read a file that is not there, six times. What did you read?',
    });
    expect(koan.id).toBe('unread-file');
    expect(koan.case).toContain('six times');
    expect(koan.source).toBe('composed by the harness');
  });

  test('presentKoan rejects a composed koan missing its case', () => {
    expect(() => presentKoan('half-composed', { title: 'Only a Title' })).toThrow(/case/);
  });

  test('presentKoan records a response as a trap, never as a verdict', () => {
    const before = getTrapJournal().entries.length;
    const result = presentKoan('mu', undefined, 'The answer is clearly yes.') as {
      recorded: { koanId: string; traps: string[] };
    };
    expect(result.recorded.koanId).toBe('mu');
    expect(result.recorded.traps).toContain('grasping');
    expect(result.recorded).not.toHaveProperty('score');
    expect(result.recorded).not.toHaveProperty('correct');
    expect(getTrapJournal().entries.length).toBe(before + 1);
  });

  test('getTrapJournal names the recurring trap once it repeats', () => {
    presentKoan('one-hand', undefined, 'The answer is one hand.');
    presentKoan('nansen-cat', undefined, 'The answer is the sandal.');
    expect(getTrapJournal().recurringTrap).toBe('grasping');
  });
});

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
