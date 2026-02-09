/**
 * Samskara - Volitional Formations (Link 2)
 *
 * Conditioned by ignorance, volitional formations arise.
 * These are intentional actions of body, speech, and mind
 * that shape future experience through karma.
 *
 * Three types:
 * - Bodily formations (kaya-sankhara)
 * - Verbal formations (vaci-sankhara)
 * - Mental formations (citta-sankhara)
 */

import { Nidana, NidanaExplanation } from '../Nidana';
import { KarmaQuality } from '../../utils/types';

export interface Formation {
  type: 'bodily' | 'verbal' | 'mental';
  quality: KarmaQuality;
  description: string;
}

export class Samskara extends Nidana {
  readonly name = 'Samskara';
  readonly sanskritName = 'Saṃskāra';
  readonly position = 2;
  readonly temporalSpan = 'past' as const;

  private formations: Formation[] = [];

  getExplanation(): NidanaExplanation {
    return {
      name: this.name,
      meaning: 'Volitional formations - intentional actions of body, speech, and mind that create karmic imprints and shape future experience.',
      conditionedBy: 'Avidya (ignorance)',
      conditions: 'Vijnana (consciousness)',
      howToBreak: 'With the cessation of ignorance, volitional formations cease. Actions done with wisdom do not create binding karma.'
    };
  }

  /**
   * Add a formation (intentional action)
   */
  addFormation(formation: Formation): void {
    this.formations.push(formation);
  }

  /**
   * Get all formations
   */
  getFormations(): Formation[] {
    return [...this.formations];
  }

  /**
   * Get formations by type
   */
  getFormationsByType(type: Formation['type']): Formation[] {
    return this.formations.filter(f => f.type === type);
  }

  /**
   * Get formations by quality
   */
  getFormationsByQuality(quality: KarmaQuality): Formation[] {
    return this.formations.filter(f => f.quality === quality);
  }

  /**
   * Types of formations
   */
  static getFormationTypes(): string[] {
    return [
      'Bodily formations (kaya-sankhara) - physical actions',
      'Verbal formations (vaci-sankhara) - speech',
      'Mental formations (citta-sankhara) - thoughts and intentions'
    ];
  }
}
