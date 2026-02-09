/**
 * Vedana - Feeling (Aggregate 2)
 *
 * The feeling aggregate - the hedonic tone of experience.
 * Not emotion, but the basic pleasant/unpleasant/neutral quality
 * that accompanies every moment of consciousness.
 *
 * This is what we react to with craving and aversion.
 */

import { Skandha } from './Skandha';
import { FeelingTone, SenseBase, Intensity } from '../utils/types';

export interface FeelingState {
  currentTone: FeelingTone;
  source: SenseBase;
  intensity: Intensity;
}

export interface FeelingRecord {
  tone: FeelingTone;
  source: SenseBase;
  intensity: Intensity;
  timestamp: number;
}

/**
 * Vedana - The Feeling Aggregate
 */
export class VedanaAggregate extends Skandha {
  readonly name = 'Vedana';
  readonly sanskritName = 'Vedanā';
  readonly position = 2;
  readonly category = 'mental' as const;

  protected state: FeelingState = {
    currentTone: 'neutral',
    source: 'mind',
    intensity: 0
  };

  private feelingHistory: FeelingRecord[] = [];

  constructor() {
    super();
    this.arise();
  }

  /**
   * Experience a feeling
   */
  update(input: { tone: FeelingTone; source: SenseBase; intensity: Intensity }): void {
    this.state = {
      currentTone: input.tone,
      source: input.source,
      intensity: input.intensity
    };

    this.feelingHistory.push({
      ...input,
      timestamp: Date.now()
    });
  }

  /**
   * Process sensory input and determine feeling tone
   */
  feel(input: { senseBase: SenseBase; pleasantness: number }): FeelingTone {
    let tone: FeelingTone;

    if (input.pleasantness > 6) {
      tone = 'pleasant';
    } else if (input.pleasantness < 4) {
      tone = 'unpleasant';
    } else {
      tone = 'neutral';
    }

    this.update({
      tone,
      source: input.senseBase,
      intensity: Math.abs(input.pleasantness - 5) as Intensity
    });

    return tone;
  }

  /**
   * Get current feeling state
   */
  getState(): FeelingState {
    return { ...this.state };
  }

  /**
   * Get feeling history
   */
  getHistory(count = 10): FeelingRecord[] {
    return this.feelingHistory.slice(-count);
  }

  /**
   * Get current feeling tone
   */
  getCurrentTone(): FeelingTone {
    return this.state.currentTone;
  }

  /**
   * Get feeling statistics
   */
  getStats(): { pleasant: number; unpleasant: number; neutral: number } {
    const stats = { pleasant: 0, unpleasant: 0, neutral: 0 };
    this.feelingHistory.forEach(f => stats[f.tone]++);
    return stats;
  }

  /**
   * Clear current feeling (it passes)
   */
  clear(): void {
    this.state = {
      currentTone: 'neutral',
      source: 'mind',
      intensity: 0
    };
  }

  /**
   * Explanation of vedana types
   */
  static explainTypes(): string {
    return `
THE THREE TYPES OF FEELING (Vedana)

1. PLEASANT (Sukha)
   - Agreeable, enjoyable sensation
   - Tendency: Craving arises to maintain it
   - Danger: Attachment and disappointment when it changes

2. UNPLEASANT (Dukkha)
   - Disagreeable, painful sensation
   - Tendency: Craving arises to escape it
   - Danger: Aversion and struggle

3. NEUTRAL (Adukkha-masukha)
   - Neither pleasant nor unpleasant
   - Tendency: Overlooked, confused with boredom
   - Danger: Ignorance and restlessness

All three types arise and pass.
All three can trigger craving if not met with mindfulness.
The practice: Know feeling as feeling, without reacting.
    `.trim();
  }
}
