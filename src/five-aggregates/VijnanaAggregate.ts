/**
 * Vijnana - Consciousness (Aggregate 5)
 *
 * The consciousness aggregate - basic awareness.
 * Vijnana is the knowing function - awareness OF something.
 *
 * Six types corresponding to six sense bases:
 * - Eye consciousness, ear consciousness, etc.
 *
 * Consciousness is not self - it arises and passes,
 * depending on sense organ and object.
 */

import { Skandha } from './Skandha';
import { SenseBase } from '../utils/types';

export interface ConsciousnessState {
  activeTypes: Set<SenseBase>;
  primaryFocus: SenseBase | null;
  clarity: number; // 0-10
}

export interface CognitionEvent {
  type: SenseBase;
  object: unknown;
  timestamp: number;
}

/**
 * Vijnana - The Consciousness Aggregate
 */
export class VijnanaAggregate extends Skandha {
  readonly name = 'Vijnana';
  readonly sanskritName = 'Vijñāna';
  readonly position = 5;
  readonly category = 'mental' as const;

  protected state: ConsciousnessState = {
    activeTypes: new Set(),
    primaryFocus: null,
    clarity: 5
  };

  /** History of cognitions */
  private cognitionHistory: CognitionEvent[] = [];

  constructor() {
    super();
    this.arise();
  }

  /**
   * Update consciousness state
   */
  update(input: Partial<{ activeTypes: SenseBase[]; primaryFocus: SenseBase; clarity: number }>): void {
    if (input.activeTypes) {
      this.state.activeTypes = new Set(input.activeTypes);
    }
    if (input.primaryFocus !== undefined) {
      this.state.primaryFocus = input.primaryFocus;
    }
    if (input.clarity !== undefined) {
      this.state.clarity = Math.min(10, Math.max(0, input.clarity));
    }
  }

  /**
   * Cognize an object through a sense base
   */
  cognize(senseBase: SenseBase, object: unknown): CognitionEvent {
    // Activate this type of consciousness
    this.state.activeTypes.add(senseBase);
    this.state.primaryFocus = senseBase;

    const event: CognitionEvent = {
      type: senseBase,
      object,
      timestamp: Date.now()
    };

    this.cognitionHistory.push(event);
    return event;
  }

  /**
   * Get current consciousness state
   */
  getState(): ConsciousnessState {
    return {
      activeTypes: new Set(this.state.activeTypes),
      primaryFocus: this.state.primaryFocus,
      clarity: this.state.clarity
    };
  }

  /**
   * Get active consciousness types
   */
  getActiveTypes(): SenseBase[] {
    return Array.from(this.state.activeTypes);
  }

  /**
   * Get primary focus
   */
  getPrimaryFocus(): SenseBase | null {
    return this.state.primaryFocus;
  }

  /**
   * Get cognition history
   */
  getCognitionHistory(count = 10): CognitionEvent[] {
    return this.cognitionHistory.slice(-count);
  }

  /**
   * Check if a type of consciousness is active
   */
  isTypeActive(type: SenseBase): boolean {
    return this.state.activeTypes.has(type);
  }

  /**
   * Set clarity level (affected by concentration/mindfulness)
   */
  setClarity(level: number): void {
    this.state.clarity = Math.min(10, Math.max(0, level));
  }

  /**
   * Get clarity level
   */
  getClarity(): number {
    return this.state.clarity;
  }

  /**
   * Clear focus (consciousness releases object)
   */
  releaseFocus(): void {
    this.state.primaryFocus = null;
  }

  /**
   * Explanation of consciousness types
   */
  static explainTypes(): string {
    return `
CONSCIOUSNESS (Vijnana/Vinnana)

Consciousness is the KNOWING function - awareness of an object.
It arises dependent on sense organ meeting sense object.

SIX TYPES:
1. Eye consciousness (cakkhuvinnana) - seeing
2. Ear consciousness (sotavinnana) - hearing
3. Nose consciousness (ghanavinnana) - smelling
4. Tongue consciousness (jivhavinnana) - tasting
5. Body consciousness (kayavinnana) - touching
6. Mind consciousness (manovinnana) - thinking

HOW IT ARISES:
Eye + visible form → eye consciousness arises
Ear + sound → ear consciousness arises
etc.

NOT-SELF BECAUSE:
- It depends on conditions (no organ = no consciousness)
- It arises and passes moment to moment
- It is not under control ("see this, don't see that")
- It is impersonal, like an echo

"Consciousness is dependent on conditions.
Apart from conditions, there is no arising of consciousness."
- The Buddha
    `.trim();
  }
}
