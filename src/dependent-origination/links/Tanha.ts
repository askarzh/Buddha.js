/**
 * Tanha - Craving (Link 8)
 *
 * Conditioned by feeling, craving arises.
 * Craving is the second Noble Truth - the origin of suffering.
 *
 * Three types:
 * - Kama-tanha: Craving for sensory pleasures
 * - Bhava-tanha: Craving for existence/becoming
 * - Vibhava-tanha: Craving for non-existence
 *
 * This is where the chain can most effectively be broken!
 */

import { Nidana, NidanaExplanation } from '../Nidana';
import { CravingType, FeelingTone, Intensity } from '../../utils/types';

export interface CravingEvent {
  type: CravingType;
  trigger: FeelingTone;
  intensity: Intensity;
  object: string;
  timestamp: number;
}

export class Tanha extends Nidana {
  readonly name = 'Tanha';
  readonly sanskritName = 'Tṛṣṇā';
  readonly position = 8;
  readonly temporalSpan = 'present' as const;

  private cravings: CravingEvent[] = [];
  private currentCraving: CravingEvent | null = null;

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Craving/Thirst - the driving force that perpetuates suffering. Three types: craving for pleasure, for becoming, and for non-existence.',
      conditionedBy: 'Vedana (feeling)',
      conditions: 'Upadana (clinging)',
      howToBreak: 'THE KEY INTERVENTION POINT: When feeling arises, do not react with craving. Observe with equanimity. This is the essence of the practice.'
    };
  }

  /**
   * A craving arises
   */
  crave(type: CravingType, trigger: FeelingTone, object: string, intensity: Intensity): CravingEvent {
    const event: CravingEvent = {
      type,
      trigger,
      object,
      intensity,
      timestamp: Date.now()
    };
    this.cravings.push(event);
    this.currentCraving = event;
    return event;
  }

  /**
   * Get current craving
   */
  getCurrentCraving(): CravingEvent | null {
    return this.currentCraving;
  }

  /**
   * Let go of current craving (practice working!)
   */
  letGo(): boolean {
    if (this.currentCraving) {
      this.currentCraving = null;
      return true;
    }
    return false;
  }

  /**
   * Get craving history
   */
  getCravingHistory(count = 10): CravingEvent[] {
    return this.cravings.slice(-count);
  }

  /**
   * Get cravings by type
   */
  getCravingsByType(type: CravingType): CravingEvent[] {
    return this.cravings.filter(c => c.type === type);
  }

  /**
   * Check if there's active craving
   */
  hasCraving(): boolean {
    return this.currentCraving !== null;
  }

  /**
   * Get statistics
   */
  getCravingStats(): Record<CravingType, number> {
    const stats: Record<CravingType, number> = {
      sensory: 0,
      becoming: 0,
      'non-becoming': 0
    };
    this.cravings.forEach(c => stats[c.type]++);
    return stats;
  }

  /**
   * Explain the three types of craving
   */
  static explainCravingTypes(): string {
    return `
THE THREE TYPES OF CRAVING (Tanha)

1. KAMA-TANHA (Sensory Craving)
   - Craving for pleasant sense experiences
   - Wanting to see, hear, smell, taste, touch pleasant things
   - The most obvious form of craving
   - Response to PLEASANT feelings

2. BHAVA-TANHA (Craving for Becoming)
   - Craving to be something, become someone
   - Wanting existence, identity, achievement
   - The drive for self-construction
   - Often subtle and socially valued

3. VIBHAVA-TANHA (Craving for Non-Existence)
   - Craving to not be, to escape, to disappear
   - Aversion, wanting to get rid of
   - Response to UNPLEASANT feelings
   - Can manifest as self-destructive impulses

ALL THREE perpetuate suffering.
ALL THREE can be abandoned through practice.
    `.trim();
  }
}
