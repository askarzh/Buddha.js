/**
 * Vedana - Feeling (Link 7)
 *
 * Conditioned by contact, feeling arises.
 * Feeling is the hedonic tone of experience - not emotion,
 * but the basic pleasant/unpleasant/neutral quality.
 *
 * This is a CRITICAL link because:
 * - Feeling is unavoidable (contact always leads to feeling)
 * - But craving in response to feeling IS avoidable
 * - This is the "liberation point" in the chain
 */

import { Nidana, NidanaExplanation } from '../Nidana';
import { FeelingTone, SenseBase } from '../../utils/types';

export interface FeelingEvent {
  tone: FeelingTone;
  source: SenseBase;
  intensity: number; // 1-10
  timestamp: number;
}

export class Vedana extends Nidana {
  readonly name = 'Vedana';
  readonly sanskritName = 'Vedanā';
  readonly position = 7;
  readonly temporalSpan = 'present' as const;

  private feelings: FeelingEvent[] = [];
  private currentFeeling: FeelingEvent | null = null;

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Feeling - the hedonic quality of experience (pleasant, unpleasant, or neutral). Not emotion, but the basic tone that colors all experience.',
      conditionedBy: 'Sparsa (contact)',
      conditions: 'Tanha (craving)',
      howToBreak: 'THE LIBERATION POINT: Feeling cannot be prevented, but the reaction to feeling (craving) can. With mindfulness, observe feeling without reacting.'
    };
  }

  /**
   * Experience a feeling
   */
  feel(tone: FeelingTone, source: SenseBase, intensity: number): FeelingEvent {
    const event: FeelingEvent = {
      tone,
      source,
      intensity: Math.min(10, Math.max(1, intensity)),
      timestamp: Date.now()
    };
    this.feelings.push(event);
    this.currentFeeling = event;
    return event;
  }

  /**
   * Get current feeling
   */
  getCurrentFeeling(): FeelingEvent | null {
    return this.currentFeeling;
  }

  /**
   * Get feeling history
   */
  getFeelingHistory(count = 10): FeelingEvent[] {
    return this.feelings.slice(-count);
  }

  /**
   * Get feelings by tone
   */
  getFeelingsByTone(tone: FeelingTone): FeelingEvent[] {
    return this.feelings.filter(f => f.tone === tone);
  }

  /**
   * Clear the current feeling (it passes)
   */
  clearCurrentFeeling(): void {
    this.currentFeeling = null;
  }

  /**
   * Get statistics on feelings
   */
  getFeelingStats(): { pleasant: number; unpleasant: number; neutral: number } {
    const stats = { pleasant: 0, unpleasant: 0, neutral: 0 };
    this.feelings.forEach(f => stats[f.tone]++);
    return stats;
  }

  /**
   * Explain feeling and the liberation point
   */
  static explainLiberationPoint(): string {
    return `
VEDANA AND THE LIBERATION POINT

Feeling (vedana) is the hedonic tone of experience:
- PLEASANT (sukha) - we tend to crave more
- UNPLEASANT (dukkha) - we tend to crave escape
- NEUTRAL (adukkhamasukha) - we tend to ignore/be confused

The automatic pattern:
Contact → Feeling → Craving → Clinging → Suffering

THE CRUCIAL INSIGHT:
Feeling arises automatically from contact.
But CRAVING does not have to follow feeling.

With mindfulness we can:
1. Recognize the feeling as it arises
2. Note its tone (pleasant/unpleasant/neutral)
3. Observe without reacting
4. See it pass away

This interrupts the chain.
"Feeling is felt, but not identified with."

This is why mindfulness of feeling (vedananupassana)
is one of the Four Foundations of Mindfulness.
    `.trim();
  }
}
