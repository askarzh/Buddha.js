/**
 * Intention (Cetana)
 *
 * "Intention, monks, is karma." - The Buddha
 *
 * Intention is the volitional aspect of action.
 * It is what makes an action karmic (having results).
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { Intensity, KarmaQuality, UnwholesomeRoot, WholesomeRoot } from '../utils/types';

/**
 * Intention - The volitional force behind action
 */
export class Intention extends Phenomenon {
  readonly name = 'Intention';
  readonly sanskritName = 'Cetanā';

  /** Description of the intention */
  readonly description: string;

  /** Strength of the intention */
  readonly strength: Intensity;

  /** Root motivation */
  readonly root: UnwholesomeRoot | WholesomeRoot | 'neutral';

  /** Quality of the intention */
  readonly quality: KarmaQuality;

  constructor(
    description: string,
    strength: Intensity,
    root?: UnwholesomeRoot | WholesomeRoot
  ) {
    super();
    this.description = description;
    this.strength = strength;

    if (root) {
      this.root = root;
      this.quality = this.determineQuality(root);
    } else {
      this.root = 'neutral';
      this.quality = 'neutral';
    }

    this.arise();
  }

  /**
   * Determine quality based on root
   */
  private determineQuality(root: UnwholesomeRoot | WholesomeRoot): KarmaQuality {
    const unwholesome: UnwholesomeRoot[] = ['greed', 'aversion', 'delusion'];
    if (unwholesome.includes(root as UnwholesomeRoot)) {
      return 'unwholesome';
    }
    return 'wholesome';
  }

  /**
   * Check if intention is complete (ready to manifest as action)
   */
  isComplete(): boolean {
    return this.hasArisen && !this.hasCeased;
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'Intention is the mental factor that directs action and shapes karmic results',
      usefulFor: [
        'Taking responsibility for actions',
        'Understanding the source of karma',
        'Cultivating wholesome motivations'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: 'Intention arises from conditions and lacks inherent self - there is no "intender" behind the intention',
      transcends: [
        'Belief in a self that intends',
        'Guilt and blame',
        'Pride in good intentions'
      ]
    };
  }
}
