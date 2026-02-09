/**
 * Upadana - Clinging/Grasping (Link 9)
 *
 * Conditioned by craving, clinging arises.
 * Clinging is craving intensified - tight holding onto objects.
 *
 * Four types of clinging:
 * - Kamupadana: Clinging to sensory pleasures
 * - Ditthupadana: Clinging to views
 * - Silabbatupadana: Clinging to rites and rituals
 * - Attavadupadana: Clinging to self-doctrine
 */

import { Nidana, NidanaExplanation } from '../Nidana';
import { Intensity } from '../../utils/types';

export type ClingingType = 'sensory' | 'views' | 'practices' | 'self';

export interface ClingingEvent {
  type: ClingingType;
  object: string;
  intensity: Intensity;
  timestamp: number;
}

export class Upadana extends Nidana {
  readonly name = 'Upadana';
  readonly sanskritName = 'Upādāna';
  readonly position = 9;
  readonly temporalSpan = 'present' as const;

  private attachments: ClingingEvent[] = [];

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Clinging/Grasping - intensified craving that holds tightly. Four types: clinging to pleasures, views, practices, and self-doctrine.',
      conditionedBy: 'Tanha (craving)',
      conditions: 'Bhava (becoming)',
      howToBreak: 'When craving ceases, clinging ceases. Practice non-attachment through seeing the impermanent, unsatisfactory, not-self nature of objects.'
    };
  }

  /**
   * Cling to something
   */
  clingTo(type: ClingingType, object: string, intensity: Intensity): ClingingEvent {
    const event: ClingingEvent = {
      type,
      object,
      intensity,
      timestamp: Date.now()
    };
    this.attachments.push(event);
    return event;
  }

  /**
   * Get all attachments
   */
  getAttachments(): ClingingEvent[] {
    return [...this.attachments];
  }

  /**
   * Get attachments by type
   */
  getAttachmentsByType(type: ClingingType): ClingingEvent[] {
    return this.attachments.filter(a => a.type === type);
  }

  /**
   * Release an attachment
   */
  release(object: string): boolean {
    const index = this.attachments.findIndex(a => a.object === object);
    if (index > -1) {
      this.attachments.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get statistics
   */
  getClingingStats(): Record<ClingingType, number> {
    const stats: Record<ClingingType, number> = {
      sensory: 0,
      views: 0,
      practices: 0,
      self: 0
    };
    this.attachments.forEach(a => stats[a.type]++);
    return stats;
  }

  /**
   * Explain the four types of clinging
   */
  static explainClingingTypes(): string {
    return `
THE FOUR TYPES OF CLINGING (Upadana)

1. KAMUPADANA (Clinging to Sense Pleasures)
   - Attachment to pleasant experiences
   - Holding onto pleasurable objects
   - The most common form of clinging

2. DITTHUPADANA (Clinging to Views)
   - Attachment to opinions and beliefs
   - Rigid adherence to philosophical positions
   - Even clinging to "correct" views is problematic

3. SILABBATUPADANA (Clinging to Practices/Rituals)
   - Attachment to rites and rituals as ends in themselves
   - Believing practices alone lead to liberation
   - Mechanical observance without understanding

4. ATTAVADUPADANA (Clinging to Self-Doctrine)
   - Attachment to belief in a permanent self
   - Identifying with body, feelings, perceptions, etc.
   - The most fundamental form of clinging

This last type is the root of the others.
When the illusion of self is seen through,
all clinging naturally relaxes.
    `.trim();
  }
}
