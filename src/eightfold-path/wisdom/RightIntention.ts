/**
 * Right Intention (Samma Sankappa)
 *
 * The second factor of the Noble Eightfold Path.
 * Also called Right Thought, Right Resolve, or Right Aspiration.
 *
 * Right Intention involves three aspects:
 * 1. Nekkhamma - Intention of renunciation (letting go)
 * 2. Abyapada - Intention of goodwill (non-ill-will)
 * 3. Avihimsa - Intention of harmlessness (non-cruelty)
 */

import { PathFactor } from '../PathFactor';
import { Intensity } from '../../utils/types';

/**
 * The three types of right intention
 */
export interface IntentionQualities {
  /** Renunciation - letting go of sense craving */
  renunciation: Intensity;
  /** Goodwill - freedom from ill-will */
  goodwill: Intensity;
  /** Harmlessness - freedom from cruelty */
  harmlessness: Intensity;
}

/**
 * Right Intention - Thoughts aligned with liberation
 */
export class RightIntention extends PathFactor {
  readonly name = 'Right Intention';
  readonly sanskritName = 'Samyak-saṃkalpa';
  readonly category = 'wisdom' as const;
  readonly position = 2;

  /** Current levels of each intention quality */
  private qualities: IntentionQualities = {
    renunciation: 0,
    goodwill: 0,
    harmlessness: 0
  };

  protected onPractice(effort: Intensity): void {
    // Practicing develops all three qualities
    const increment = effort * 0.1;
    this.qualities.renunciation = Math.min(10, this.qualities.renunciation + increment) as Intensity;
    this.qualities.goodwill = Math.min(10, this.qualities.goodwill + increment) as Intensity;
    this.qualities.harmlessness = Math.min(10, this.qualities.harmlessness + increment) as Intensity;
  }

  /**
   * Set an intention consciously
   */
  setIntention(type: keyof IntentionQualities, strength: Intensity): void {
    this.qualities[type] = strength;
  }

  /**
   * Get current intention qualities
   */
  getQualities(): IntentionQualities {
    return { ...this.qualities };
  }

  getPractices(): string[] {
    return [
      'Before acting, pause and check your intention',
      'Cultivate metta (loving-kindness) meditation',
      'Practice letting go of small attachments',
      'Notice thoughts of ill-will and replace with goodwill',
      'Refrain from thoughts of harming others',
      'Set daily intentions for practice',
      'Reflect on the results of different intentions'
    ];
  }

  getDescription(): string {
    return `
Right Intention shapes the quality of our actions. Thought precedes action,
so the mind trained in right intention naturally acts skillfully.

THREE ASPECTS OF RIGHT INTENTION:

1. RENUNCIATION (Nekkhamma)
   - Letting go of excessive desire for pleasure
   - Not driven by craving for acquisition
   - Contentment with what is present

2. GOODWILL (Abyapada)
   - Wishing well for all beings, including oneself
   - Freedom from resentment and ill-will
   - Seeing others as deserving happiness

3. HARMLESSNESS (Avihimsa)
   - Intention not to cause suffering
   - Compassion for those who suffer
   - Non-violence in thought as well as deed
    `.trim();
  }

  getIndicators(): string[] {
    return [
      'Thoughts naturally incline toward letting go',
      'Ill-will is quickly recognized and released',
      'No desire to harm even those who harm you',
      'Acting from generosity rather than acquisition',
      'Speech and action reflect inner goodwill',
      'Feeling compassion as a natural response to suffering'
    ];
  }

  /**
   * Check if intentions are balanced
   */
  isBalanced(): boolean {
    const { renunciation, goodwill, harmlessness } = this.qualities;
    const avg = (renunciation + goodwill + harmlessness) / 3;
    return Math.abs(renunciation - avg) < 2 &&
           Math.abs(goodwill - avg) < 2 &&
           Math.abs(harmlessness - avg) < 2;
  }
}
