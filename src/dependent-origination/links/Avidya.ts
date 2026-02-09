/**
 * Avidya - Ignorance (Link 1)
 *
 * The first link in the chain of dependent origination.
 * Avidya is not mere lack of information, but fundamental
 * misunderstanding of the nature of reality:
 * - Not seeing impermanence
 * - Not seeing suffering
 * - Not seeing not-self
 * - Not understanding the Four Noble Truths
 */

import { Nidana, NidanaExplanation } from '../Nidana';

export class Avidya extends Nidana {
  readonly name = 'Avidya';
  readonly sanskritName = 'Avidyā';
  readonly position = 1;
  readonly temporalSpan = 'past' as const;

  constructor() {
    super();
    // Ignorance is the root - it arises by default
    this._hasArisen = true;
  }

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Fundamental ignorance - not seeing reality as it truly is. Ignorance of the Four Noble Truths, of impermanence, suffering, and not-self.',
      conditionedBy: 'The asavas (mental fermentations/taints)',
      conditions: 'Sankhara (volitional formations)',
      howToBreak: 'Develop wisdom (prajna) through study, reflection, and meditation. Direct insight into the Three Marks dissolves ignorance.'
    };
  }

  /**
   * Check what aspects of ignorance are present
   */
  getIgnoranceAspects(): string[] {
    return [
      'Not seeing impermanence (anicca)',
      'Not seeing suffering (dukkha)',
      'Not seeing not-self (anatta)',
      'Not understanding the Four Noble Truths',
      'Belief in a permanent, unchanging self',
      'Confusion about cause and effect'
    ];
  }

  /**
   * What dispels ignorance
   */
  getAntidotes(): string[] {
    return [
      'Right View - understanding the Four Noble Truths',
      'Contemplation of impermanence',
      'Investigation of the self',
      'Direct insight through meditation',
      'Learning from wise teachers',
      'Reflection on dependent origination itself'
    ];
  }
}
