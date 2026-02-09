/**
 * Mental Factor (Cetasika)
 *
 * Mental factors are the qualities that accompany consciousness.
 * They arise together with consciousness and color the mind.
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { MentalFactorQuality, Intensity } from '../utils/types';

/**
 * MentalFactor - Base class for mental qualities
 */
export class MentalFactor extends Phenomenon {
  readonly name: string;
  readonly sanskritName: string;
  readonly quality: MentalFactorQuality;

  protected _intensity: Intensity = 0;
  protected _isActive = false;

  constructor(
    name: string,
    sanskritName: string,
    quality: MentalFactorQuality
  ) {
    super();
    this.name = name;
    this.sanskritName = sanskritName;
    this.quality = quality;
  }

  /**
   * Activate this mental factor
   */
  activate(intensity: Intensity): void {
    this._isActive = true;
    this._intensity = intensity;
    this.arise();
  }

  /**
   * Deactivate this mental factor
   */
  deactivate(): void {
    this._isActive = false;
    this._intensity = 0;
    this.cease();
  }

  /**
   * Get current intensity
   */
  get intensity(): Intensity {
    return this._intensity;
  }

  /**
   * Check if active
   */
  get isActive(): boolean {
    return this._isActive;
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: `${this.name} is a mental factor that colors conscious experience`,
      usefulFor: [
        'Understanding mental processes',
        'Meditation practice',
        'Psychological insight'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: `${this.name} arises from conditions and lacks inherent existence`,
      transcends: [
        'Identification with mental states',
        'Belief in permanent traits'
      ]
    };
  }
}
