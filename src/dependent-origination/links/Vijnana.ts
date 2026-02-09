/**
 * Vijnana - Consciousness (Link 3)
 *
 * Conditioned by volitional formations, consciousness arises.
 * This is the basic knowing quality - awareness of objects.
 *
 * Six types of consciousness:
 * - Eye consciousness
 * - Ear consciousness
 * - Nose consciousness
 * - Tongue consciousness
 * - Body consciousness
 * - Mind consciousness
 */

import { Nidana, NidanaExplanation } from '../Nidana';
import { SenseBase } from '../../utils/types';

export type ConsciousnessType = SenseBase;

export class Vijnana extends Nidana {
  readonly name = 'Vijnana';
  readonly sanskritName = 'Vijñāna';
  readonly position = 3;
  readonly temporalSpan = 'present' as const;

  private activeConsciousness: Set<ConsciousnessType> = new Set();

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Consciousness - the basic knowing quality that cognizes objects. Arises in six types corresponding to the six sense bases.',
      conditionedBy: 'Samskara (volitional formations)',
      conditions: 'Nama-rupa (mind and body)',
      howToBreak: 'When volitional formations cease, rebirth consciousness does not arise. In meditation, watching consciousness arise and pass without identification.'
    };
  }

  /**
   * Activate a type of consciousness
   */
  activateConsciousness(type: ConsciousnessType): void {
    this.activeConsciousness.add(type);
  }

  /**
   * Deactivate a type of consciousness
   */
  deactivateConsciousness(type: ConsciousnessType): void {
    this.activeConsciousness.delete(type);
  }

  /**
   * Check if a consciousness type is active
   */
  isConsciousnessActive(type: ConsciousnessType): boolean {
    return this.activeConsciousness.has(type);
  }

  /**
   * Get all active consciousness types
   */
  getActiveConsciousness(): ConsciousnessType[] {
    return Array.from(this.activeConsciousness);
  }

  /**
   * Get all six types
   */
  static getSixConsciousnessTypes(): string[] {
    return [
      'Eye consciousness - seeing',
      'Ear consciousness - hearing',
      'Nose consciousness - smelling',
      'Tongue consciousness - tasting',
      'Body consciousness - touching',
      'Mind consciousness - thinking'
    ];
  }
}
