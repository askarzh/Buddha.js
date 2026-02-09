/**
 * Dukkha - The First Noble Truth
 *
 * Dukkha is often translated as "suffering" but more accurately means
 * "unsatisfactoriness" or "dis-ease". It encompasses:
 *
 * 1. Dukkha-dukkha: Obvious suffering (pain, illness, loss)
 * 2. Viparinama-dukkha: Suffering of change (impermanence of pleasure)
 * 3. Sankhara-dukkha: Suffering of conditioned existence (existential)
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { DukkhaType } from '../utils/types';

/**
 * Analysis result of suffering types
 */
export interface DukkhaAnalysis {
  /** Is obvious suffering present? */
  obviousSuffering: boolean;
  /** Is suffering of change present? */
  sufferingOfChange: boolean;
  /** Is existential unsatisfactoriness recognized? */
  existentialUnsatisfactoriness: boolean;
  /** Total types of suffering identified */
  totalTypes: number;
  /** Insight gained from this analysis */
  insight: string;
}

/**
 * First Noble Truth - Dukkha (Suffering/Unsatisfactoriness)
 *
 * The task with respect to Dukkha is to "fully understand" it.
 * Not to avoid, suppress, or wallow in it, but to see it clearly.
 */
export class Dukkha extends Phenomenon {
  readonly name = 'Dukkha';
  readonly sanskritName = 'Duḥkha';

  /** The three types of dukkha and whether they're recognized */
  private recognizedTypes: Set<DukkhaType> = new Set();

  /**
   * Analyze types of suffering present in a situation
   */
  analyze(sufferingTypes: DukkhaType[]): DukkhaAnalysis {
    const present = new Set(sufferingTypes);

    // Update recognized types
    sufferingTypes.forEach(type => this.recognizedTypes.add(type));

    return {
      obviousSuffering: present.has('dukkha-dukkha'),
      sufferingOfChange: present.has('viparinama-dukkha'),
      existentialUnsatisfactoriness: present.has('sankhara-dukkha'),
      totalTypes: present.size,
      insight: this.generateInsight(present)
    };
  }

  /**
   * Generate insight based on recognized suffering types
   */
  private generateInsight(types: Set<DukkhaType>): string {
    if (types.has('sankhara-dukkha')) {
      return 'Deep insight: Recognizing the unsatisfactoriness inherent in all conditioned phenomena. This is the foundation for liberation.';
    }
    if (types.has('viparinama-dukkha')) {
      return 'Growing insight: Seeing how change brings suffering even to pleasant experiences. Nothing stable can be found.';
    }
    if (types.has('dukkha-dukkha')) {
      return 'Initial insight: Recognizing obvious forms of suffering. This acknowledgment is the first step on the path.';
    }
    return 'No suffering types analyzed yet.';
  }

  /**
   * Get examples of each type of suffering
   */
  getExamples(): Record<DukkhaType, string[]> {
    return {
      'dukkha-dukkha': [
        'Physical pain and illness',
        'Grief and loss',
        'Fear and anxiety',
        'Not getting what we want'
      ],
      'viparinama-dukkha': [
        'Pleasant experiences ending',
        'Youth fading into old age',
        'Relationships changing',
        'Success turning to failure'
      ],
      'sankhara-dukkha': [
        'The inherent instability of all conditioned things',
        'The burden of maintaining a sense of self',
        'The endless cycle of wanting and becoming',
        'The impossibility of permanent satisfaction'
      ]
    };
  }

  /**
   * The task associated with this truth
   */
  getTask(): string {
    return 'To be fully understood (pariññeyya)';
  }

  /**
   * Check if all three types have been recognized
   */
  isFullyUnderstood(): boolean {
    return this.recognizedTypes.size === 3;
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'Life contains suffering, pain, and dissatisfaction that we all experience',
      usefulFor: [
        'Motivation to practice the path',
        'Understanding the human condition',
        'Developing compassion for all beings',
        'Honest assessment of experience'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: 'All conditioned phenomena are marked by unsatisfactoriness due to impermanence and lack of inherent self',
      transcends: [
        'Naive optimism that ignores suffering',
        'Nihilistic pessimism that sees only suffering',
        'Denial and avoidance of suffering',
        'Identification with suffering as "my" suffering'
      ]
    };
  }
}
