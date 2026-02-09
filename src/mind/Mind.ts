/**
 * Mind (Citta)
 *
 * The mind or heart - the center of conscious experience.
 * In Buddhist psychology, mind is not a static entity but
 * a stream of momentary consciousness events.
 */

import { MentalFactor } from './MentalFactor';
import { Intensity } from '../utils/types';

/**
 * State of the mind
 */
export interface MindState {
  isCalm: boolean;
  isFocused: boolean;
  dominantFactors: string[];
  clarity: Intensity;
  stability: Intensity;
}

/**
 * Mind - The stream of consciousness
 */
export class Mind {
  /** Active mental factors */
  private factors: Map<string, MentalFactor> = new Map();

  /** Current clarity level */
  private clarity: Intensity = 5;

  /** Current stability level */
  private stability: Intensity = 5;

  constructor() {
    this.initializeFactors();
  }

  /**
   * Initialize common mental factors
   */
  private initializeFactors(): void {
    // Universal factors
    this.factors.set('contact', new MentalFactor('Contact', 'Phassa', 'variable'));
    this.factors.set('feeling', new MentalFactor('Feeling', 'Vedanā', 'variable'));
    this.factors.set('perception', new MentalFactor('Perception', 'Saññā', 'variable'));
    this.factors.set('intention', new MentalFactor('Intention', 'Cetanā', 'variable'));
    this.factors.set('attention', new MentalFactor('Attention', 'Manasikāra', 'variable'));

    // Unwholesome factors
    this.factors.set('greed', new MentalFactor('Greed', 'Lobha', 'unwholesome'));
    this.factors.set('aversion', new MentalFactor('Aversion', 'Dosa', 'unwholesome'));
    this.factors.set('delusion', new MentalFactor('Delusion', 'Moha', 'unwholesome'));

    // Wholesome factors
    this.factors.set('mindfulness', new MentalFactor('Mindfulness', 'Sati', 'wholesome'));
    this.factors.set('equanimity', new MentalFactor('Equanimity', 'Upekkhā', 'wholesome'));
    this.factors.set('compassion', new MentalFactor('Compassion', 'Karuṇā', 'wholesome'));
    this.factors.set('wisdom', new MentalFactor('Wisdom', 'Paññā', 'wholesome'));
  }

  /**
   * Activate a mental factor
   */
  activateFactor(name: string, intensity: Intensity): boolean {
    const factor = this.factors.get(name);
    if (factor) {
      factor.activate(intensity);
      return true;
    }
    return false;
  }

  /**
   * Deactivate a mental factor
   */
  deactivateFactor(name: string): boolean {
    const factor = this.factors.get(name);
    if (factor) {
      factor.deactivate();
      return true;
    }
    return false;
  }

  /**
   * Get current mind state
   */
  getState(): MindState {
    const activeFactors = Array.from(this.factors.values())
      .filter(f => f.isActive);

    const hasUnwholesome = activeFactors.some(f => f.quality === 'unwholesome');
    const hasMindfulness = this.factors.get('mindfulness')?.isActive ?? false;

    return {
      isCalm: !hasUnwholesome && this.stability >= 5,
      isFocused: hasMindfulness && this.clarity >= 5,
      dominantFactors: activeFactors
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 3)
        .map(f => f.name),
      clarity: this.clarity,
      stability: this.stability
    };
  }

  /**
   * Set clarity level
   */
  setClarity(level: Intensity): void {
    this.clarity = level;
  }

  /**
   * Set stability level
   */
  setStability(level: Intensity): void {
    this.stability = level;
  }

  /**
   * Calm the mind (deactivate unwholesome factors)
   */
  calm(): void {
    this.factors.forEach((factor, _name) => {
      if (factor.quality === 'unwholesome' && factor.isActive) {
        factor.deactivate();
      }
    });
    this.stability = Math.min(10, this.stability + 1) as Intensity;
  }

  /**
   * Get a factor by name
   */
  getFactor(name: string): MentalFactor | undefined {
    return this.factors.get(name);
  }

  /**
   * Get all active factors
   */
  getActiveFactors(): MentalFactor[] {
    return Array.from(this.factors.values()).filter(f => f.isActive);
  }
}
