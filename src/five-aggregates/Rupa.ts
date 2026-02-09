/**
 * Rupa - Form/Body (Aggregate 1)
 *
 * The material aggregate - physical form.
 * Includes the body, sense organs, and their objects.
 *
 * Composed of the four great elements:
 * - Earth (solidity)
 * - Water (cohesion)
 * - Fire (temperature)
 * - Air (motion)
 */

import { Skandha } from './Skandha';

export interface BodyState {
  /** The four elements */
  elements: {
    earth: number; // Solidity 0-10
    water: number; // Fluidity 0-10
    fire: number;  // Temperature 0-10
    air: number;   // Motion 0-10
  };
  /** Sense organs functional? */
  senseOrgans: {
    eye: boolean;
    ear: boolean;
    nose: boolean;
    tongue: boolean;
    body: boolean;
  };
  /** Overall vitality */
  vitality: number; // 0-10
}

/**
 * Rupa - The Form/Body Aggregate
 */
export class Rupa extends Skandha {
  readonly name = 'Rupa';
  readonly sanskritName = 'Rūpa';
  readonly position = 1;
  readonly category = 'material' as const;

  protected state: BodyState = {
    elements: {
      earth: 5,
      water: 5,
      fire: 5,
      air: 5
    },
    senseOrgans: {
      eye: true,
      ear: true,
      nose: true,
      tongue: true,
      body: true
    },
    vitality: 7
  };

  constructor() {
    super();
    this.arise();
  }

  /**
   * Update body state
   */
  update(input: Partial<BodyState>): void {
    if (input.elements) {
      this.state.elements = { ...this.state.elements, ...input.elements };
    }
    if (input.senseOrgans) {
      this.state.senseOrgans = { ...this.state.senseOrgans, ...input.senseOrgans };
    }
    if (input.vitality !== undefined) {
      this.state.vitality = Math.min(10, Math.max(0, input.vitality));
    }
  }

  /**
   * Get current body state
   */
  getState(): BodyState {
    return { ...this.state };
  }

  /**
   * Get element balance
   */
  getElementBalance(): number {
    const elements = Object.values(this.state.elements);
    const avg = elements.reduce((a, b) => a + b, 0) / elements.length;
    const variance = elements.reduce((sum, e) => sum + Math.abs(e - avg), 0) / elements.length;
    return 10 - variance; // Higher = more balanced
  }

  /**
   * Check if a sense organ is functional
   */
  isSenseFunctional(sense: keyof BodyState['senseOrgans']): boolean {
    return this.state.senseOrgans[sense];
  }

  /**
   * Get vitality level
   */
  getVitality(): number {
    return this.state.vitality;
  }

  /**
   * Explanation of the four elements
   */
  static explainElements(): string {
    return `
THE FOUR GREAT ELEMENTS (Mahabhuta)

1. EARTH (Pathavi)
   - Quality: Solidity, hardness, extension
   - In body: Bones, teeth, flesh, skin, etc.
   - Experience: Resistance, weight, stability

2. WATER (Apo)
   - Quality: Cohesion, fluidity
   - In body: Blood, sweat, saliva, tears, etc.
   - Experience: Wetness, flow, binding

3. FIRE (Tejo)
   - Quality: Temperature, maturation
   - In body: Digestive heat, body temperature
   - Experience: Hot, cold, warmth, burning

4. AIR (Vayo)
   - Quality: Motion, distension
   - In body: Breath, circulation, movement
   - Experience: Expansion, vibration, pressure

All physical form is composed of these four elements.
None is self. All are impermanent.
    `.trim();
  }
}
