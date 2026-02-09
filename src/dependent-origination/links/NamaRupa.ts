/**
 * Nama-Rupa - Mind and Body (Link 4)
 *
 * Conditioned by consciousness, mind and body arise.
 * The psychophysical organism that is the basis for experience.
 *
 * Nama (name/mind) includes:
 * - Feeling, perception, intention, contact, attention
 *
 * Rupa (form/body) includes:
 * - The physical body and sense organs
 */

import { Nidana, NidanaExplanation } from '../Nidana';

export interface NamaComponents {
  feeling: boolean;
  perception: boolean;
  intention: boolean;
  contact: boolean;
  attention: boolean;
}

export interface RupaComponents {
  earth: boolean; // Solidity
  water: boolean; // Cohesion
  fire: boolean;  // Temperature
  air: boolean;   // Movement
}

export class NamaRupa extends Nidana {
  readonly name = 'Nama-Rupa';
  readonly sanskritName = 'Nāma-rūpa';
  readonly position = 4;
  readonly temporalSpan = 'present' as const;

  private nama: NamaComponents = {
    feeling: false,
    perception: false,
    intention: false,
    contact: false,
    attention: false
  };

  private rupa: RupaComponents = {
    earth: false,
    water: false,
    fire: false,
    air: false
  };

  protected onArise(): void {
    // When mind-body arises, activate all components
    this.nama = {
      feeling: true,
      perception: true,
      intention: true,
      contact: true,
      attention: true
    };
    this.rupa = {
      earth: true,
      water: true,
      fire: true,
      air: true
    };
    super.onArise();
  }

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Mind and body - the psychophysical organism. Nama (mind) includes feeling, perception, intention, contact, attention. Rupa (body) is the physical form.',
      conditionedBy: 'Vijnana (consciousness)',
      conditions: 'Salayatana (six sense bases)',
      howToBreak: 'When consciousness does not descend into the womb, mind-body does not arise. Contemplate the constructed nature of the psychophysical process.'
    };
  }

  /**
   * Get nama components
   */
  getNama(): NamaComponents {
    return { ...this.nama };
  }

  /**
   * Get rupa components
   */
  getRupa(): RupaComponents {
    return { ...this.rupa };
  }

  /**
   * Explanation of nama
   */
  static explainNama(): string[] {
    return [
      'Vedana (feeling) - pleasant, unpleasant, neutral',
      'Sanna (perception) - recognition, labeling',
      'Cetana (intention) - volitional aspect',
      'Phassa (contact) - meeting of sense, object, consciousness',
      'Manasikara (attention) - directing awareness'
    ];
  }

  /**
   * Explanation of rupa
   */
  static explainRupa(): string[] {
    return [
      'Earth element (pathavi) - solidity, hardness',
      'Water element (apo) - cohesion, fluidity',
      'Fire element (tejo) - temperature, heat',
      'Air element (vayo) - movement, motion'
    ];
  }
}
