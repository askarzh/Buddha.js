/**
 * The Six Realms (gati) of Rebirth
 *
 * Each realm class extends `Being`, overriding ONLY the `realm` getter and
 * the protected soft-modifier hooks (`meditationGainFactor`, `wisdomCap`,
 * `unwholesomeReactionBoost`, `unpleasantIntensityShift`) — never a public
 * method. This is a soft-modifier design: every realm being still has the
 * full Being API available; realms bias outcomes, they never disable them.
 */

import { Being } from './Being';
import { Realm, Intensity } from '../utils/types';

/**
 * The human realm (manuṣya-gati) — the baseline realm. Neutral on every
 * hook; behaves identically to base `Being`.
 */
export class HumanBeing extends Being {}

/**
 * The deva (god) realm — long-lived, comfortable, and complacent. Divine
 * comfort dulls the sense of urgency (saṃvega) that drives practice, so
 * meditation gains are halved. Starts at full vitality (10), reflecting
 * the deva's vital, unafflicted form.
 */
export class DevaBeing extends Being {
  get realm(): Realm {
    return 'deva';
  }

  protected meditationGainFactor(): number {
    return 0.5; // pamāda: divine comfort dulls urgency (saṃvega)
  }

  constructor() {
    super();
    this.aggregates.form.update({ vitality: 10 });
  }
}

/**
 * The asura (titan) realm — driven by rivalry and envy of the devas.
 * Practice is somewhat undermined by that restlessness, and aversion-toned
 * reactions run hotter (a rivalry bias toward aversion).
 */
export class AsuraBeing extends Being {
  get realm(): Realm {
    return 'asura';
  }

  protected meditationGainFactor(): number {
    return 0.75;
  }

  protected unwholesomeReactionBoost(): number {
    return 1; // rivalry bias toward aversion
  }
}

/**
 * The animal realm (tiryagyoni-gati) — dominated by instinct, with little
 * capacity for reflective wisdom. rightView's developmentLevel is capped
 * low (4).
 */
export class AnimalBeing extends Being {
  get realm(): Realm {
    return 'animal';
  }

  protected wisdomCap(): Intensity {
    return 4;
  }
}

/**
 * The preta (hungry ghost) realm — defined by insatiable craving, which
 * amplifies reactions to experience regardless of valence.
 */
export class PretaBeing extends Being {
  get realm(): Realm {
    return 'preta';
  }

  protected unwholesomeReactionBoost(): number {
    return 2; // insatiable craving amplifies reactions
  }
}

/**
 * The naraka (hell) realm — a realm of intense, unrelenting suffering.
 * Practice is undermined by that suffering, and unpleasant experiences are
 * felt more intensely still.
 */
export class NarakaBeing extends Being {
  get realm(): Realm {
    return 'naraka';
  }

  protected meditationGainFactor(): number {
    return 0.75;
  }

  protected unpleasantIntensityShift(): number {
    return 2;
  }
}

/** Lookup from a `Realm` value to its concrete `Being` subclass. */
export const REALM_CLASSES: Record<Realm, new () => Being> = {
  human: HumanBeing,
  deva: DevaBeing,
  asura: AsuraBeing,
  animal: AnimalBeing,
  preta: PretaBeing,
  naraka: NarakaBeing,
};
