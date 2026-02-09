/**
 * Samskara - Mental Formations (Aggregate 4)
 *
 * The volitional/mental formations aggregate.
 * This includes intention (cetana), attention, desires,
 * emotions, and all other mental factors except feeling and perception.
 *
 * This is the karmic aggregate - where intention shapes future experience.
 */

import { Skandha } from './Skandha';
import { FeelingTone, Intensity, MentalFactorQuality } from '../utils/types';

export interface MentalFactor {
  name: string;
  quality: MentalFactorQuality;
  intensity: Intensity;
  active: boolean;
}

export interface SamskaraState {
  activeFactors: MentalFactor[];
  dominantQuality: MentalFactorQuality;
  overallIntensity: Intensity;
}

/**
 * Samskara - The Mental Formations Aggregate
 */
export class SamskaraAggregate extends Skandha {
  readonly name = 'Samskara';
  readonly sanskritName = 'Saṃskāra';
  readonly position = 4;
  readonly category = 'mental' as const;

  protected state: SamskaraState = {
    activeFactors: [],
    dominantQuality: 'variable',
    overallIntensity: 0
  };

  /** Available mental factors */
  private mentalFactors: Map<string, MentalFactor> = new Map([
    // Unwholesome factors
    ['greed', { name: 'greed', quality: 'unwholesome', intensity: 0, active: false }],
    ['aversion', { name: 'aversion', quality: 'unwholesome', intensity: 0, active: false }],
    ['delusion', { name: 'delusion', quality: 'unwholesome', intensity: 0, active: false }],
    ['conceit', { name: 'conceit', quality: 'unwholesome', intensity: 0, active: false }],
    ['restlessness', { name: 'restlessness', quality: 'unwholesome', intensity: 0, active: false }],

    // Wholesome factors
    ['faith', { name: 'faith', quality: 'wholesome', intensity: 0, active: false }],
    ['mindfulness', { name: 'mindfulness', quality: 'wholesome', intensity: 0, active: false }],
    ['equanimity', { name: 'equanimity', quality: 'wholesome', intensity: 0, active: false }],
    ['compassion', { name: 'compassion', quality: 'wholesome', intensity: 0, active: false }],
    ['wisdom', { name: 'wisdom', quality: 'wholesome', intensity: 0, active: false }],

    // Variable factors
    ['attention', { name: 'attention', quality: 'variable', intensity: 0, active: false }],
    ['intention', { name: 'intention', quality: 'variable', intensity: 0, active: false }],
    ['concentration', { name: 'concentration', quality: 'variable', intensity: 0, active: false }]
  ]);

  constructor() {
    super();
    this.arise();
  }

  /**
   * Update with new active factors
   */
  update(input: { factors: Array<{ name: string; intensity: Intensity }> }): void {
    // Deactivate all factors first
    this.mentalFactors.forEach(factor => {
      factor.active = false;
      factor.intensity = 0;
    });

    // Activate specified factors
    input.factors.forEach(f => {
      const factor = this.mentalFactors.get(f.name);
      if (factor) {
        factor.active = true;
        factor.intensity = f.intensity;
      }
    });

    this.updateState();
  }

  /**
   * React to feeling with mental formations
   */
  react(feelingTone: FeelingTone, _perception: string): string[] {
    const reactions: string[] = [];

    // Default reactions based on feeling (without mindfulness)
    if (feelingTone === 'pleasant') {
      this.activateFactor('greed', 5);
      reactions.push('craving arising');
    } else if (feelingTone === 'unpleasant') {
      this.activateFactor('aversion', 5);
      reactions.push('aversion arising');
    } else {
      this.activateFactor('restlessness', 3);
      reactions.push('restlessness arising');
    }

    // Check if mindfulness is active to counteract
    const mindfulness = this.mentalFactors.get('mindfulness');
    if (mindfulness && mindfulness.active && mindfulness.intensity > 5) {
      reactions.push('mindfulness observing the reaction');
      // Reduce unwholesome intensities
      this.reduceUnwholesomeFactors();
    }

    this.updateState();
    return reactions;
  }

  /**
   * Activate a mental factor
   */
  activateFactor(name: string, intensity: Intensity): boolean {
    const factor = this.mentalFactors.get(name);
    if (factor) {
      factor.active = true;
      factor.intensity = intensity;
      this.updateState();
      return true;
    }
    return false;
  }

  /**
   * Deactivate a mental factor
   */
  deactivateFactor(name: string): boolean {
    const factor = this.mentalFactors.get(name);
    if (factor) {
      factor.active = false;
      factor.intensity = 0;
      this.updateState();
      return true;
    }
    return false;
  }

  /**
   * Reduce unwholesome factors (mindfulness effect)
   */
  private reduceUnwholesomeFactors(): void {
    this.mentalFactors.forEach(factor => {
      if (factor.quality === 'unwholesome' && factor.active) {
        factor.intensity = Math.max(0, factor.intensity - 2) as Intensity;
        if (factor.intensity === 0) {
          factor.active = false;
        }
      }
    });
  }

  /**
   * Update the aggregate state
   */
  private updateState(): void {
    const activeFactors = Array.from(this.mentalFactors.values())
      .filter(f => f.active);

    // Determine dominant quality
    const wholesome = activeFactors.filter(f => f.quality === 'wholesome')
      .reduce((sum, f) => sum + f.intensity, 0);
    const unwholesome = activeFactors.filter(f => f.quality === 'unwholesome')
      .reduce((sum, f) => sum + f.intensity, 0);

    let dominantQuality: MentalFactorQuality = 'variable';
    if (wholesome > unwholesome) dominantQuality = 'wholesome';
    else if (unwholesome > wholesome) dominantQuality = 'unwholesome';

    // Calculate overall intensity
    const totalIntensity = activeFactors.reduce((sum, f) => sum + f.intensity, 0);
    const overallIntensity = activeFactors.length > 0 ?
      Math.round(totalIntensity / activeFactors.length) as Intensity : 0;

    this.state = {
      activeFactors,
      dominantQuality,
      overallIntensity
    };
  }

  /**
   * Get current state
   */
  getState(): SamskaraState {
    return {
      activeFactors: [...this.state.activeFactors],
      dominantQuality: this.state.dominantQuality,
      overallIntensity: this.state.overallIntensity
    };
  }

  /**
   * Get active factor names
   */
  getActiveFactorNames(): string[] {
    return this.state.activeFactors.map(f => f.name);
  }

  /**
   * Check if a factor is active
   */
  isFactorActive(name: string): boolean {
    const factor = this.mentalFactors.get(name);
    return factor?.active ?? false;
  }

  /**
   * Explanation of mental formations
   */
  static explainFormations(): string {
    return `
MENTAL FORMATIONS (Samskara/Sankhara)

This aggregate includes all mental factors except feeling and perception.
It is the "doing" aspect of mind - intention, volition, and all active qualities.

EXAMPLES:
- Cetana (Intention) - the directing force of mind
- Attention - where mind focuses
- Desire, aversion, pride, jealousy
- Faith, mindfulness, compassion, wisdom

WHY IT'S KARMIC:
Intention (cetana) is karma. "Intention, monks, is karma."
This aggregate is where we create our future through choices.

THREE TYPES:
- Bodily formations (physical actions)
- Verbal formations (speech)
- Mental formations (thoughts)

NOT-SELF:
- Formations arise from conditions
- They are not commanded by a self
- They are habits, patterns, tendencies
- With practice, they can be transformed
    `.trim();
  }
}
