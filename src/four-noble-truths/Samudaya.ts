/**
 * Samudaya - The Second Noble Truth (Origin of Suffering)
 *
 * The cause of suffering is craving (tanha), which comes in three forms:
 * 1. Kama-tanha: Craving for sensory pleasures
 * 2. Bhava-tanha: Craving for existence/becoming
 * 3. Vibhava-tanha: Craving for non-existence/annihilation
 *
 * Craving is rooted in the three poisons: greed, aversion, and delusion.
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { CravingType, UnwholesomeRoot } from '../utils/types';

/**
 * Analysis of the causes of suffering
 */
export interface CauseAnalysis {
  /** Types of craving present */
  cravingsPresent: CravingType[];
  /** Root causes (three poisons) */
  rootCauses: UnwholesomeRoot[];
  /** Strength of craving (0-10) */
  intensity: number;
  /** Primary driver */
  primaryDriver: CravingType | null;
  /** Recommendation for practice */
  recommendation: string;
}

/**
 * Second Noble Truth - Samudaya (Origin of Suffering)
 *
 * The task with respect to Samudaya is to "abandon" it.
 * This means letting go of craving, not through suppression
 * but through understanding its nature.
 */
export class Samudaya extends Phenomenon {
  readonly name = 'Samudaya';
  readonly sanskritName = 'Samudaya';

  /**
   * Analyze the causes present in a situation
   */
  analyze(cravings: CravingType[], intensity: number = 5): CauseAnalysis {
    const rootCauses = this.identifyRoots(cravings);
    const primaryDriver = cravings.length > 0 ? cravings[0] : null;

    return {
      cravingsPresent: cravings,
      rootCauses,
      intensity: Math.min(10, Math.max(0, intensity)),
      primaryDriver,
      recommendation: this.generateRecommendation(cravings, intensity)
    };
  }

  /**
   * Identify which root poisons are active
   */
  private identifyRoots(cravings: CravingType[]): UnwholesomeRoot[] {
    const roots: Set<UnwholesomeRoot> = new Set();

    // All craving is rooted in delusion (ignorance of true nature)
    if (cravings.length > 0) {
      roots.add('delusion');
    }

    // Sensory craving is rooted in greed
    if (cravings.includes('sensory')) {
      roots.add('greed');
    }

    // Craving for becoming involves greed (wanting to be something)
    if (cravings.includes('becoming')) {
      roots.add('greed');
    }

    // Craving for non-existence involves aversion
    if (cravings.includes('non-becoming')) {
      roots.add('aversion');
    }

    return Array.from(roots);
  }

  /**
   * Generate a practice recommendation based on the craving pattern
   */
  private generateRecommendation(cravings: CravingType[], intensity: number): string {
    if (intensity > 7) {
      return 'Strong craving present. Practice mindfulness of the craving itself - observe without acting. Let it arise and pass.';
    }

    if (cravings.includes('sensory')) {
      return 'Practice restraint of the senses. Not suppression, but mindful awareness of how sense contact leads to craving.';
    }

    if (cravings.includes('becoming')) {
      return 'Examine the desire to become. Who is it that wants to become something? Investigate the self that craves.';
    }

    if (cravings.includes('non-becoming')) {
      return 'Investigate the aversion. What are you running from? See that non-existence is also a form of craving.';
    }

    return 'Continue cultivating mindfulness to recognize craving when it arises.';
  }

  /**
   * Explain the relationship between craving and suffering
   */
  explainCausation(): string {
    return `
Craving (tanha) leads to suffering through this process:
1. Contact with sense objects creates feeling (pleasant/unpleasant/neutral)
2. Pleasant feelings trigger craving to maintain the experience
3. Unpleasant feelings trigger craving to escape
4. Craving leads to clinging (upadana)
5. Clinging leads to becoming (bhava)
6. Becoming perpetuates the cycle of suffering

The key insight: It's not the experience itself that causes suffering,
but our craving in relation to the experience.
    `.trim();
  }

  /**
   * Get the task associated with this truth
   */
  getTask(): string {
    return 'To be abandoned (pahatabba)';
  }

  /**
   * Get descriptions of each craving type
   */
  getCravingDescriptions(): Record<CravingType, string> {
    return {
      sensory: 'Craving for pleasant sensory experiences - sights, sounds, tastes, touches, smells, and mental pleasures',
      becoming: 'Craving to be something, to exist as a particular kind of person, to achieve states of being',
      'non-becoming': 'Craving for non-existence, annihilation, escape from experience - a subtle form of aversion'
    };
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'Suffering arises from our craving, attachment, and resistance to how things are',
      usefulFor: [
        'Understanding why we suffer',
        'Recognizing patterns of craving in daily life',
        'Taking responsibility for our mental states',
        'Identifying what to let go of'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: 'Craving arises from ignorance of the true nature of phenomena - their emptiness, impermanence, and not-self character',
      transcends: [
        'Blaming external circumstances for suffering',
        'Belief in a self that craves',
        'Attempting to satisfy craving through acquisition',
        'Suppressing craving through willpower alone'
      ]
    };
  }
}
