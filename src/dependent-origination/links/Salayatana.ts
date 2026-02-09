/**
 * Salayatana - Six Sense Bases (Link 5)
 *
 * Conditioned by mind-body, the six sense bases arise.
 * These are the doors through which we contact the world:
 *
 * Internal bases (indriya):
 * - Eye, ear, nose, tongue, body, mind
 *
 * External bases (objects):
 * - Forms, sounds, smells, tastes, touches, mental objects
 */

import { Nidana, NidanaExplanation } from '../Nidana';
import { SenseBase } from '../../utils/types';

export interface SenseBaseState {
  base: SenseBase;
  isActive: boolean;
  isGuarded: boolean;
}

export class Salayatana extends Nidana {
  readonly name = 'Salayatana';
  readonly sanskritName = 'Ṣaḍāyatana';
  readonly position = 5;
  readonly temporalSpan = 'present' as const;

  private senseBases: Map<SenseBase, SenseBaseState> = new Map([
    ['eye', { base: 'eye', isActive: false, isGuarded: false }],
    ['ear', { base: 'ear', isActive: false, isGuarded: false }],
    ['nose', { base: 'nose', isActive: false, isGuarded: false }],
    ['tongue', { base: 'tongue', isActive: false, isGuarded: false }],
    ['body', { base: 'body', isActive: false, isGuarded: false }],
    ['mind', { base: 'mind', isActive: false, isGuarded: false }]
  ]);

  protected onArise(): void {
    // Activate all sense bases
    this.senseBases.forEach((state, base) => {
      this.senseBases.set(base, { ...state, isActive: true });
    });
    super.onArise();
  }

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'The six sense bases - the organs/faculties through which contact with objects occurs: eye, ear, nose, tongue, body, and mind.',
      conditionedBy: 'Nama-rupa (mind and body)',
      conditions: 'Phassa (contact)',
      howToBreak: 'Practice sense restraint (indriya-samvara). Guard the sense doors with mindfulness. Without mind-body, sense bases do not function.'
    };
  }

  /**
   * Guard a sense door (practice mindfulness)
   */
  guardSenseDoor(base: SenseBase): void {
    const state = this.senseBases.get(base);
    if (state) {
      this.senseBases.set(base, { ...state, isGuarded: true });
    }
  }

  /**
   * Unguard a sense door
   */
  unguardSenseDoor(base: SenseBase): void {
    const state = this.senseBases.get(base);
    if (state) {
      this.senseBases.set(base, { ...state, isGuarded: false });
    }
  }

  /**
   * Check if a sense base is guarded
   */
  isSenseGuarded(base: SenseBase): boolean {
    return this.senseBases.get(base)?.isGuarded ?? false;
  }

  /**
   * Get all sense base states
   */
  getSenseBaseStates(): SenseBaseState[] {
    return Array.from(this.senseBases.values());
  }

  /**
   * Get unguarded senses (potential for craving)
   */
  getUnguardedSenses(): SenseBase[] {
    return Array.from(this.senseBases.entries())
      .filter(([_, state]) => state.isActive && !state.isGuarded)
      .map(([base]) => base);
  }

  /**
   * Explanation of internal and external bases
   */
  static explainBases(): string {
    return `
INTERNAL BASES (Organs/Faculties):
- Eye (cakkhu) - visual faculty
- Ear (sota) - auditory faculty
- Nose (ghana) - olfactory faculty
- Tongue (jivha) - gustatory faculty
- Body (kaya) - tactile faculty
- Mind (mano) - mental faculty

EXTERNAL BASES (Objects):
- Forms (rupa) - visible objects
- Sounds (sadda) - audible objects
- Smells (gandha) - olfactory objects
- Tastes (rasa) - gustatory objects
- Touches (photthabba) - tactile objects
- Mental objects (dhamma) - thoughts, ideas
    `.trim();
  }
}
