import { describe, it, expect, vi } from 'vitest';
import { Being } from '../../src/simulation/Being';
import {
  HumanBeing,
  DevaBeing,
  AsuraBeing,
  AnimalBeing,
  PretaBeing,
  NarakaBeing,
  selectRealm,
} from '../../src/simulation/realms';
import { createKarmicSeed } from '../../src/karma/KarmicEventSystem';

/** A karmic balance with the given wholesome/unwholesome/neutral potency. */
function balanceOf(wholesome: number, unwholesome: number, neutral: number) {
  return {
    wholesome,
    unwholesome,
    neutral,
    balance: wholesome - unwholesome,
    totalPotency: wholesome + unwholesome + neutral,
  };
}

describe('selectRealm (spec §3, one test per table row)', () => {
  it('no shaping seed -> human', () => {
    expect(selectRealm(null, balanceOf(0, 0, 0))).toBe('human');
  });

  it('a neutral shaping seed -> human', () => {
    const seed = createKarmicSeed({ quality: 'neutral', description: 'idle glance' });
    expect(selectRealm(seed, balanceOf(0, 0, 0))).toBe('human');
  });

  it('unwholesome shaping seed rooted in greed -> preta', () => {
    const seed = createKarmicSeed({ quality: 'unwholesome', description: 'grasping', root: 'greed' });
    expect(selectRealm(seed, balanceOf(0, 10, 0))).toBe('preta');
  });

  it('unwholesome shaping seed rooted in aversion -> naraka', () => {
    const seed = createKarmicSeed({ quality: 'unwholesome', description: 'rage', root: 'aversion' });
    expect(selectRealm(seed, balanceOf(0, 10, 0))).toBe('naraka');
  });

  it('unwholesome shaping seed rooted in delusion (or any unmapped root) -> animal', () => {
    const seed = createKarmicSeed({ quality: 'unwholesome', description: 'confusion', root: 'delusion' });
    expect(selectRealm(seed, balanceOf(0, 10, 0))).toBe('animal');
  });

  it('wholesome shaping seed at weighty or strong strength -> deva', () => {
    const weighty = createKarmicSeed({ quality: 'wholesome', description: 'a life-defining vow', potency: 90 });
    expect(weighty.strength).toBe('weighty');
    expect(selectRealm(weighty, balanceOf(90, 0, 0))).toBe('deva');

    const strong = createKarmicSeed({ quality: 'wholesome', description: 'generous act', potency: 60 });
    expect(strong.strength).toBe('strong');
    expect(selectRealm(strong, balanceOf(60, 0, 0))).toBe('deva');
  });

  it('wholesome shaping seed below weighty/strong, with unwholesome share >= 40% -> asura', () => {
    const seed = createKarmicSeed({ quality: 'wholesome', description: 'a small kindness', potency: 20 });
    expect(seed.strength).not.toBe('weighty');
    expect(seed.strength).not.toBe('strong');
    // unwholesome share = 40 / (20 + 40 + 40) = 0.4
    expect(selectRealm(seed, balanceOf(20, 40, 40))).toBe('asura');
  });

  it('wholesome shaping seed below weighty/strong, with unwholesome share < 40% -> human', () => {
    const seed = createKarmicSeed({ quality: 'wholesome', description: 'a small kindness', potency: 20 });
    // unwholesome share = 10 / (20 + 10 + 70) = 0.1
    expect(selectRealm(seed, balanceOf(20, 10, 70))).toBe('human');
  });

  it('the 40% denominator zero-guards a zero-potency balance to human, not asura', () => {
    const seed = createKarmicSeed({ quality: 'wholesome', description: 'a small kindness', potency: 20 });
    expect(selectRealm(seed, balanceOf(0, 0, 0))).toBe('human');
  });
});

describe('Being.rebirth() — transmigration', () => {
  it('transmigration passes ONLY the karmic continuum', () => {
    const b = new HumanBeing();
    b.act('greedy grab', 9, 'greed');
    b.meditate(600, 8);
    const oldStore = b.karmicStore;
    const oldPath = b.path;

    const r = b.rebirth();

    expect(r.being).not.toBe(b);
    expect(r.being.karmicStore).toBe(oldStore); // the continuum passes by identity
    expect(r.being.path).not.toBe(oldPath); // everything else is a fresh arising
    expect(r.being.getExperienceHistory(Infinity)).toHaveLength(0);
    expect(b.karmicStore).not.toBe(oldStore); // the dead being is detached
    expect(b.karmicStore.getSeeds()).toHaveLength(0); // detached with a fresh, empty store
  });

  it('reports fromRealm/toRealm alongside the new being', () => {
    const b = new HumanBeing();
    const r = b.rebirth();
    expect(r.fromRealm).toBe('human');
    expect(r.toRealm).toBe(r.being.realm);
  });

  it('greedy shaping seed leads to the preta realm', () => {
    const b = new Being();
    b.act('greedy grab', 9, 'greed');
    b.act('greedy grab', 9, 'greed');

    const r = b.rebirth();

    expect(r.toRealm).toBe('preta');
    expect(r.being).toBeInstanceOf(PretaBeing);
  });

  it('a weighty aversion-rooted seed leads to the naraka realm', () => {
    const b = new Being();
    b.karmicStore.plantSeed({
      quality: 'unwholesome',
      description: 'a life-ruining rage',
      root: 'aversion',
      potency: 90,
      tags: ['aversion', 'a-life-ruining-rage', 'incarnation:1'],
    });

    const r = b.rebirth();

    expect(r.toRealm).toBe('naraka');
    expect(r.being).toBeInstanceOf(NarakaBeing);
  });

  it('a weighty wholesome seed leads to the deva realm', () => {
    const b = new Being();
    b.karmicStore.plantSeed({
      quality: 'wholesome',
      description: 'a life-defining vow',
      potency: 90,
      tags: ['non-delusion', 'a-life-defining-vow', 'incarnation:1'],
    });

    const r = b.rebirth();

    expect(r.toRealm).toBe('deva');
    expect(r.being).toBeInstanceOf(DevaBeing);
  });

  it('a delusion-rooted shaping seed leads to the animal realm', () => {
    const b = new Being();
    b.karmicStore.plantSeed({
      quality: 'unwholesome',
      description: 'a life-defining confusion',
      root: 'delusion',
      potency: 90,
      tags: ['delusion', 'a-life-defining-confusion', 'incarnation:1'],
    });

    const r = b.rebirth();

    expect(r.toRealm).toBe('animal');
    expect(r.being).toBeInstanceOf(AnimalBeing);
  });

  it('a moderate wholesome shaping seed with a high unwholesome share leads to the asura realm', () => {
    // Fake time so createdAt ordering is deterministic: the wholesome seed
    // is planted first (oldest), so pickShapingSeed's kaṭattā-kamma reserve
    // rule picks it as the shaping seed (none of these three are weighty or
    // share a habitual slug, and the last-planted one is too weak to count
    // as āsanna-kamma).
    vi.useFakeTimers();
    try {
      const b = new Being();
      vi.setSystemTime(1000);
      const shaping = b.karmicStore.plantSeed({
        quality: 'wholesome',
        description: 'a small kindness',
        potency: 20,
        tags: ['non-delusion', 'a-small-kindness', 'incarnation:1'],
      });
      expect(shaping.strength).not.toBe('weighty');
      expect(shaping.strength).not.toBe('strong');

      vi.setSystemTime(2000);
      b.karmicStore.plantSeed({
        quality: 'unwholesome',
        description: 'chronic irritation',
        root: 'aversion',
        potency: 40,
        tags: ['aversion', 'chronic-irritation', 'incarnation:1'],
      });
      vi.setSystemTime(3000);
      b.karmicStore.plantSeed({
        quality: 'neutral',
        description: 'idle habit',
        potency: 20,
        tags: ['neutral', 'idle-habit', 'incarnation:1'],
      });

      // unwholesome share = 40 / (20 + 40 + 20) = 0.5 >= 0.4 threshold
      const r = b.rebirth();

      expect(r.shapingSeed?.description).toBe('a small kindness');
      expect(r.toRealm).toBe('asura');
      expect(r.being).toBeInstanceOf(AsuraBeing);
    } finally {
      vi.useRealTimers();
    }
  });

  it('faculties are vipāka-derived and capped: wholesome-heavy store -> mindfulness in 1..4', () => {
    const b = new Being();
    for (let i = 0; i < 5; i++) {
      b.karmicStore.plantSeed({
        quality: 'wholesome',
        description: `good deed ${i}`,
        potency: 10,
        tags: ['non-greed', `good-deed-${i}`, 'incarnation:1'],
      });
    }

    const r = b.rebirth();

    expect(r.being.mindfulnessLevel).toBeGreaterThanOrEqual(1);
    expect(r.being.mindfulnessLevel).toBeLessThanOrEqual(4);
    for (const factor of r.being.path.getAllFactors()) {
      expect(factor.developmentLevel).toBeGreaterThanOrEqual(0);
      expect(factor.developmentLevel).toBeLessThanOrEqual(3);
    }
  });

  it('faculties are zero when the inherited store is empty', () => {
    const b = new Being();
    const r = b.rebirth();

    expect(r.being.mindfulnessLevel).toBe(0);
    for (const factor of r.being.path.getAllFactors()) {
      expect(factor.developmentLevel).toBe(0);
    }
  });

  it('an all-wholesome, zero-unwholesome, zero-neutral inherited store maxes starting faculties within their caps', () => {
    const b = new Being();
    b.karmicStore.plantSeed({
      quality: 'wholesome',
      description: 'a lifetime of small kindnesses',
      potency: 10,
      tags: ['non-greed', 'a-lifetime-of-small-kindnesses', 'incarnation:1'],
    });

    const r = b.rebirth();

    expect(r.being.mindfulnessLevel).toBe(4);
    for (const factor of r.being.path.getAllFactors()) {
      expect(factor.developmentLevel).toBe(3);
    }
  });

  it("rightView's starting development respects the new realm's wisdomCap", () => {
    const b = new Being();
    b.karmicStore.plantSeed({
      quality: 'unwholesome',
      description: 'a life-defining confusion',
      root: 'delusion',
      potency: 90,
      tags: ['delusion', 'a-life-defining-confusion', 'incarnation:1'],
    });

    const r = b.rebirth();

    expect(r.being).toBeInstanceOf(AnimalBeing);
    expect(r.being.path.rightView.developmentLevel).toBeLessThanOrEqual(4);
  });

  it('the dying being cannot mutate the continuum it transmigrated away from', () => {
    const b = new Being();
    b.act('a habit', 5, 'non-delusion');
    const r = b.rebirth();

    // Acting on the now-dead `b` must not affect the new being's store.
    b.act('post-mortem act', 5, 'non-delusion');
    expect(r.being.karmicStore.getSeeds().some(s => s.description === 'post-mortem act')).toBe(false);
    expect(b.karmicStore.getSeeds().some(s => s.description === 'post-mortem act')).toBe(true);
  });

  it("re-registered ripening conditions read the new being's faculties, not the dying being's", () => {
    const b = new Being();
    b.act('a mindful act', 5, 'non-delusion');
    const seed = b.karmicStore.getSeeds()[0];
    const condition = seed.ripeningConditions.find(c => c.name === 'mindfulness-support');
    expect(condition).toBeDefined();

    const r = b.rebirth();

    // The dying being's mindfulness stays whatever it was; the new being's
    // starts fresh (vipāka-derived). Raise the NEW being's mindfulness and
    // confirm the (rebound) condition reads it, not the dead being's.
    (r.being as unknown as { _mindfulnessLevel: number })['_mindfulnessLevel'] = 6;
    const rebornSeed = r.being.karmicStore.getSeed(seed.id);
    const rebornCondition = rebornSeed?.ripeningConditions.find(c => c.name === 'mindfulness-support');
    expect(rebornCondition?.check()).toBe(true);
  });
});

describe('realm serialization + observation-does-not-rebirth guard', () => {
  it('realm round-trips: DevaBeing -> toJSON has realm "deva" -> fromJSON is instanceof DevaBeing', () => {
    const deva = new DevaBeing();
    const data = deva.toJSON();
    expect(data.realm).toBe('deva');

    const restored = Being.fromJSON(data);
    expect(restored).toBeInstanceOf(DevaBeing);
    expect(restored.realm).toBe('deva');
  });

  it('legacy save (no realm field) restores a human-equivalent being with pendingRebirth false', () => {
    const being = new Being();
    const data = being.toJSON();
    delete (data as { realm?: string }).realm;

    const restored = Being.fromJSON(data);
    expect(restored).toBeInstanceOf(HumanBeing);
    expect(restored.realm).toBe('human');
    expect(restored.pendingRebirth).toBe(false);
  });

  it('a gap-load sets pendingRebirth without changing realm, and is idempotent on repeat observation', () => {
    process.env.BUDDHA_INCARNATION_GAP_MS = '0';
    try {
      const being = new HumanBeing();
      const data = being.toJSON();

      const first = Being.fromJSON(data);
      expect(first.pendingRebirth).toBe(true);
      expect(first.realm).toBe('human');
      expect(first).toBeInstanceOf(HumanBeing);

      // Observing (loading) the SAME data again must produce the same
      // result — observation does not itself rebirth, and does not mutate
      // the source data or accumulate state across loads.
      const second = Being.fromJSON(data);
      expect(second.pendingRebirth).toBe(true);
      expect(second.realm).toBe('human');
      expect(second.incarnation).toBe(first.incarnation);
    } finally {
      delete process.env.BUDDHA_INCARNATION_GAP_MS;
    }
  });

  it('a quick reload (within the gap) never sets pendingRebirth', () => {
    const being = new Being();
    const restored = Being.fromJSON(being.toJSON());
    expect(restored.pendingRebirth).toBe(false);
  });

  it('restoring an animal save with a hand-edited rightView of 9 clamps it to the animal wisdomCap (<=4)', () => {
    const being = new Being();
    const data = being.toJSON();
    data.realm = 'animal';
    const rightViewEntry = data.path.factors.find(f => f.name === 'Right View');
    expect(rightViewEntry).toBeDefined();
    rightViewEntry!.developmentLevel = 9;
    rightViewEntry!.hasArisen = true;
    rightViewEntry!.isActive = true;

    const restored = Being.fromJSON(data);
    expect(restored).toBeInstanceOf(AnimalBeing);
    expect(restored.path.rightView.developmentLevel).toBeLessThanOrEqual(4);
  });

  it('settlePendingRebirth() fires once then returns null, and the result is a real rebirth (different being)', () => {
    process.env.BUDDHA_INCARNATION_GAP_MS = '0';
    try {
      const being = new HumanBeing();
      const data = being.toJSON();
      const restored = Being.fromJSON(data);
      expect(restored.pendingRebirth).toBe(true);

      const result = restored.settlePendingRebirth();
      expect(result).not.toBeNull();
      expect(result!.being).not.toBe(restored);
      expect(restored.pendingRebirth).toBe(false);

      const again = restored.settlePendingRebirth();
      expect(again).toBeNull();
    } finally {
      delete process.env.BUDDHA_INCARNATION_GAP_MS;
    }
  });
});
