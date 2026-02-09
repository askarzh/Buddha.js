/**
 * Skandha - Base class for the Five Aggregates
 *
 * The five aggregates (skandhas) are the components that constitute
 * what we conventionally call a "person" or "self".
 *
 * None of them IS the self, and no self can be found apart from them.
 * They are the basis for the illusion of self when clung to.
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { AggregateCategory } from '../utils/types';

/**
 * Base class for the Five Aggregates (Skandhas)
 */
export abstract class Skandha extends Phenomenon {
  /** Position in the traditional ordering (1-5) */
  abstract readonly position: number;

  /** Whether this is material (rupa) or mental (nama) */
  abstract readonly category: AggregateCategory;

  /** Current state/content of this aggregate */
  protected abstract state: unknown;

  /**
   * Update the state of this aggregate
   */
  abstract update(input: unknown): void;

  /**
   * Get current state
   */
  abstract getState(): unknown;

  /**
   * Check if this aggregate is empty of self
   */
  investigateSelf(): { isSelf: false; reason: string } {
    return {
      isSelf: false,
      reason: `${this.name} is impermanent, conditioned, and not under complete control - therefore it cannot be self.`
    };
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: `${this.name} is a component of personal experience that functions within the psychophysical process`,
      usefulFor: [
        'Understanding mental and physical processes',
        'Meditation practice and self-inquiry',
        'Recognizing what is taken to be "self"'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: `${this.name} is empty of inherent self, arising dependently, and cannot be identified as "I" or "mine"`,
      transcends: [
        'Identification with this aggregate as self',
        'Belief that self owns or controls this aggregate',
        'Reification of momentary processes into permanent entities'
      ]
    };
  }
}
