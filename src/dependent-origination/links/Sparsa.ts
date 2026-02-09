/**
 * Sparsa/Phassa - Contact (Link 6)
 *
 * Conditioned by the six sense bases, contact arises.
 * Contact is the meeting of three things:
 * - Sense organ (internal base)
 * - Sense object (external base)
 * - Consciousness
 *
 * This meeting gives rise to feeling.
 */

import { Nidana, NidanaExplanation } from '../Nidana';
import { SenseBase } from '../../utils/types';

export interface ContactEvent {
  senseBase: SenseBase;
  object: string;
  consciousness: boolean;
  timestamp: number;
}

export class Sparsa extends Nidana {
  readonly name = 'Sparsa';
  readonly sanskritName = 'Sparśa';
  readonly position = 6;
  readonly temporalSpan = 'present' as const;

  private contactEvents: ContactEvent[] = [];

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Contact - the meeting of sense organ, sense object, and consciousness. This conjunction is the basis for feeling to arise.',
      conditionedBy: 'Salayatana (six sense bases)',
      conditions: 'Vedana (feeling)',
      howToBreak: 'Mindful contact - when contact occurs with awareness, the automatic progression to craving can be interrupted.'
    };
  }

  /**
   * Register a contact event
   */
  makeContact(senseBase: SenseBase, object: string): ContactEvent {
    const event: ContactEvent = {
      senseBase,
      object,
      consciousness: true,
      timestamp: Date.now()
    };
    this.contactEvents.push(event);
    return event;
  }

  /**
   * Get recent contact events
   */
  getRecentContacts(count = 10): ContactEvent[] {
    return this.contactEvents.slice(-count);
  }

  /**
   * Get contacts by sense base
   */
  getContactsBySense(base: SenseBase): ContactEvent[] {
    return this.contactEvents.filter(e => e.senseBase === base);
  }

  /**
   * Clear contact history
   */
  clearContacts(): void {
    this.contactEvents = [];
  }

  /**
   * Explain the nature of contact
   */
  static explainContact(): string {
    return `
CONTACT (Phassa/Sparsa)

Contact is the conjunction of three factors:
1. Sense organ (e.g., eye)
2. Sense object (e.g., visible form)
3. Consciousness (e.g., eye consciousness)

When these three meet, contact occurs.
Contact is not passive - it is the active "touching" of experience.

Contact immediately gives rise to feeling (vedana).
This is automatic and cannot be prevented.

What CAN be done:
- Bring mindfulness to the moment of contact
- Observe the contact without proliferation
- See the conditioned nature of contact

"With the arising of the sense bases, contact arises.
With the arising of contact, feeling arises."
    `.trim();
  }
}
