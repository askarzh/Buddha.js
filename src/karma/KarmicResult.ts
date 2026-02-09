/**
 * KarmicResult (Vipaka)
 *
 * The fruit or result of karma.
 * When conditions are right, karmic seeds ripen into results.
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { FeelingTone, Intensity } from '../utils/types';

/**
 * KarmicResult - The ripening of karma
 */
export class KarmicResult extends Phenomenon {
  readonly name = 'KarmicResult';
  readonly sanskritName = 'Vipāka';

  /** The karma that caused this result */
  readonly sourceKarmaId: string;

  /** Quality of the result (pleasant/unpleasant/neutral experience) */
  readonly experienceQuality: FeelingTone;

  /** Intensity of the result */
  readonly intensity: Intensity;

  /** Description of the result */
  readonly description: string;

  constructor(
    sourceKarmaId: string,
    experienceQuality: FeelingTone,
    intensity: Intensity,
    description = ''
  ) {
    super();
    this.sourceKarmaId = sourceKarmaId;
    this.experienceQuality = experienceQuality;
    this.intensity = intensity;
    this.description = description || `Result of karma: ${experienceQuality} experience`;
  }

  /**
   * Manifest the result (when conditions are right)
   */
  manifest(): boolean {
    return this.arise();
  }

  /**
   * Check if result has manifested
   */
  hasManifested(): boolean {
    return this.hasArisen;
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'Actions have results - this result arose from previous karma',
      usefulFor: [
        'Understanding why things happen',
        'Accepting present circumstances',
        'Motivation to create good karma'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: 'The result is empty of inherent existence - there is no receiver of karma, just the natural unfolding of causes and conditions',
      transcends: [
        'Fatalism (predetermined destiny)',
        'Victimhood (why me?)',
        'Belief in cosmic punishment/reward'
      ]
    };
  }
}
