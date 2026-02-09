/**
 * Karma - Intentional Action and Its Results
 *
 * "Intention (cetana) is karma." - The Buddha
 *
 * Karma is not fate or destiny. It is the natural law of
 * cause and effect in the moral sphere.
 *
 * The quality of intention determines the quality of result.
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { Intention } from './Intention';
import { KarmicResult } from './KarmicResult';
import { KarmaQuality, Intensity, FeelingTone } from '../utils/types';

/**
 * Karma - An intentional action with potential results
 */
export class Karma extends Phenomenon {
  readonly name = 'Karma';
  readonly sanskritName = 'Karma';

  /** The intention behind the action */
  readonly intention: Intention;

  /** Quality of the karma */
  readonly quality: KarmaQuality;

  /** Intensity of the action */
  readonly intensity: Intensity;

  /** Potential results (seeds) */
  private potentialResults: KarmicResult[] = [];

  /** Has the karma been completed (action performed)? */
  private _isCompleted = false;

  /** Has the result manifested? */
  private _hasManifested = false;

  constructor(intention: Intention, intensity: Intensity) {
    super();
    this.intention = intention;
    this.quality = intention.quality;
    this.intensity = intensity;
    this.addCondition(intention);
  }

  /**
   * Complete the karma (perform the action)
   * This "plants the karmic seed"
   */
  complete(): boolean {
    if (this._isCompleted) return false;

    this._isCompleted = true;
    this.arise();
    this.generatePotentialResults();
    return true;
  }

  /**
   * Alias for complete - plant the karmic seed
   */
  plantSeed(): boolean {
    return this.complete();
  }

  /**
   * Generate potential results based on quality and intensity
   */
  private generatePotentialResults(): void {
    const resultQuality = this.mapQualityToFeeling(this.quality);
    const resultIntensity = this.calculateResultIntensity();

    this.potentialResults.push(
      new KarmicResult(
        this.id,
        resultQuality,
        resultIntensity,
        `Result of ${this.quality} action`
      )
    );
  }

  /**
   * Map karma quality to result feeling tone
   */
  private mapQualityToFeeling(quality: KarmaQuality): FeelingTone {
    switch (quality) {
      case 'wholesome': return 'pleasant';
      case 'unwholesome': return 'unpleasant';
      default: return 'neutral';
    }
  }

  /**
   * Calculate result intensity based on intention strength and action intensity
   */
  private calculateResultIntensity(): Intensity {
    // Results can multiply - strong intention + strong action = stronger result
    const multiplier = 1 + (this.intention.strength / 20);
    return Math.min(10, Math.round(this.intensity * multiplier)) as Intensity;
  }

  /**
   * Manifest the karmic result (when conditions are right)
   */
  manifest(): KarmicResult | null {
    if (this._hasManifested || this.potentialResults.length === 0) {
      return null;
    }

    const result = this.potentialResults[0];
    if (result.manifest()) {
      this._hasManifested = true;
      return result;
    }
    return null;
  }

  /**
   * Check if karma is still potential (not yet ripened)
   */
  isPotential(): boolean {
    return this._isCompleted && !this._hasManifested;
  }

  /**
   * Check if karma has been completed
   */
  get isCompleted(): boolean {
    return this._isCompleted;
  }

  /**
   * Check if result has manifested
   */
  get hasManifested(): boolean {
    return this._hasManifested;
  }

  /**
   * Get potential results
   */
  getPotentialResults(): KarmicResult[] {
    return [...this.potentialResults];
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'Actions have consequences that affect future experience - good actions lead to good results',
      usefulFor: [
        'Ethical guidance',
        'Taking responsibility',
        'Understanding cause and effect',
        'Motivation for wholesome action'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: 'Karma is a natural process without a self who acts or receives results - it is empty of inherent existence',
      transcends: [
        'Fatalism (everything is predetermined)',
        'Moral nihilism (actions have no consequences)',
        'Belief in cosmic judge rewarding/punishing'
      ]
    };
  }

  /**
   * Explain the law of karma
   */
  static explain(): string {
    return `
THE LAW OF KARMA

Karma literally means "action" - specifically, intentional action.
It operates through natural causation, not supernatural intervention.

KEY PRINCIPLES:

1. INTENTION IS KARMA
   The mental factor of intention (cetana) is what makes action karmic.
   Actions without intention have no karmic weight.

2. LIKE PRODUCES LIKE
   - Wholesome intentions → pleasant results
   - Unwholesome intentions → unpleasant results
   - Neutral intentions → neutral results

3. KARMA IS NOT FATE
   - We create new karma constantly
   - Past karma doesn't determine everything
   - We can change our trajectory through present actions

4. KARMA RIPENS WHEN CONDITIONS ALLOW
   - Results may be immediate or delayed
   - Environment must be suitable for ripening
   - Some karma never ripens (if conditions don't arise)

5. KARMA CAN BE WEAKENED
   - Through remorse and confession
   - Through counter-actions
   - Through realization (wisdom)

THE THREE TYPES OF KARMA:
- Bodily karma (actions of body)
- Verbal karma (actions of speech)
- Mental karma (actions of mind)

All are rooted in intention.
    `.trim();
  }
}
