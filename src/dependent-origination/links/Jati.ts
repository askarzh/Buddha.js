/**
 * Jati - Birth (Link 11)
 *
 * Conditioned by becoming, birth arises.
 * Birth is the manifestation of existence -
 * the arising of the aggregates in a new life.
 *
 * Birth inevitably leads to aging and death.
 * This is the entry point into another round of suffering.
 */

import { Nidana, NidanaExplanation } from '../Nidana';

export interface BirthEvent {
  realm: string;
  aggregatesArisen: boolean;
  timestamp: number;
  conditions: string[];
}

export class Jati extends Nidana {
  readonly name = 'Jati';
  readonly sanskritName = 'Jāti';
  readonly position = 11;
  readonly temporalSpan = 'future' as const;

  private births: BirthEvent[] = [];

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Birth - the arising of the aggregates, the appearance of a being in a realm of existence. Entry into a new life.',
      conditionedBy: 'Bhava (becoming)',
      conditions: 'Jaramarana (aging and death)',
      howToBreak: 'When becoming ceases, birth does not occur. No fuel, no fire. No karma, no rebirth. This is the goal.'
    };
  }

  /**
   * Record a birth
   */
  recordBirth(realm: string, conditions: string[]): BirthEvent {
    const event: BirthEvent = {
      realm,
      aggregatesArisen: true,
      timestamp: Date.now(),
      conditions
    };
    this.births.push(event);
    return event;
  }

  /**
   * Get birth history
   */
  getBirths(): BirthEvent[] {
    return [...this.births];
  }

  /**
   * Get last birth
   */
  getLastBirth(): BirthEvent | undefined {
    return this.births[this.births.length - 1];
  }

  /**
   * What arises with birth
   */
  static whatArisesWithBirth(): string[] {
    return [
      'The five aggregates (skandhas)',
      'The six sense bases',
      'Contact, feeling, perception',
      'A body subject to aging',
      'Susceptibility to illness',
      'Inevitability of death',
      'Association with the disliked',
      'Separation from the liked',
      'Not getting what one wants'
    ];
  }

  /**
   * Explain birth in dependent origination
   */
  static explainBirth(): string {
    return `
BIRTH (Jati) IN DEPENDENT ORIGINATION

Birth is not just physical birth.
It is the arising of the aggregates -
the manifestation of a "being" in any realm.

In the moment-to-moment sense:
- Each moment, a "self" is born
- Identification with experience arises
- The sense of "I" crystallizes around phenomena

In the life-to-life sense:
- Conditioned by karma (bhava)
- Consciousness descends into a new existence
- A new set of aggregates arises

Birth is not the beginning of suffering -
it is the continuation.
The chain that brought us here
extends back without discernible beginning.

The goal: No more birth.
"This is my last birth.
There will be no more becoming."
    `.trim();
  }
}
