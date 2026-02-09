/**
 * PathFactor - Base class for the Eight Factors of the Noble Path
 *
 * Each factor of the Eightfold Path is:
 * - Part of an integrated system (not linear steps)
 * - To be developed through practice
 * - Mutually supporting with other factors
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { PathCategory, Intensity } from '../utils/types';

/**
 * Base class for all eight factors of the Noble Eightfold Path
 */
export abstract class PathFactor extends Phenomenon {
  /** Which training category this factor belongs to */
  abstract readonly category: PathCategory;

  /** Position in the traditional ordering (1-8) */
  abstract readonly position: number;

  /** Current level of development (0-10) */
  protected _developmentLevel: Intensity = 0;

  /** Whether this factor is being actively cultivated */
  protected _isActive = false;

  /**
   * Develop this path factor through practice
   *
   * @param effort - Intensity of practice (0-10)
   * @returns New development level
   */
  practice(effort: Intensity): Intensity {
    if (!this._isActive) {
      this.activate();
    }

    // Development is gradual and requires consistent effort
    // Higher effort leads to faster development, but with diminishing returns
    const currentLevel = this._developmentLevel;
    const roomToGrow = 10 - currentLevel;
    const increment = Math.min(effort * 0.15, roomToGrow);

    this._developmentLevel = Math.min(10, currentLevel + increment) as Intensity;

    this.onPractice(effort);
    return this._developmentLevel;
  }

  /**
   * Override for factor-specific practice effects
   */
  protected onPractice(_effort: Intensity): void {
    // Subclasses can override
  }

  /**
   * Activate this path factor (begin cultivating it)
   */
  activate(): void {
    this._isActive = true;
    if (!this.hasArisen) {
      this.arise();
    }
  }

  /**
   * Deactivate this path factor (pause cultivation)
   */
  deactivate(): void {
    this._isActive = false;
  }

  /**
   * Reset development level (for simulation purposes)
   */
  reset(): void {
    this._developmentLevel = 0;
    this._isActive = false;
  }

  /** Get current development level */
  get developmentLevel(): Intensity {
    return this._developmentLevel;
  }

  /** Is this factor being actively cultivated? */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Check if this factor supports another factor
   * All factors support all others in the integrated path
   */
  supports(other: PathFactor): boolean {
    // All factors mutually support each other
    return other !== this;
  }

  /**
   * Get practices that develop this factor
   */
  abstract getPractices(): string[];

  /**
   * Get description of what this factor means
   */
  abstract getDescription(): string;

  /**
   * Get indicators that this factor is well-developed
   */
  abstract getIndicators(): string[];

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: `${this.name} is a factor of the Noble Eightfold Path that can be developed through practice`,
      usefulFor: [
        'Guiding daily conduct',
        'Measuring spiritual progress',
        'Balancing the path'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: `${this.name} is empty of inherent existence - there is no self who practices and no separate factor being developed`,
      transcends: [
        'Attachment to progress',
        'Pride in achievement',
        'Discouragement at perceived failure'
      ]
    };
  }
}
