/**
 * Right Concentration (Samma Samadhi)
 *
 * The eighth factor of the Noble Eightfold Path.
 * Development of one-pointed, unified mind through jhana practice.
 *
 * The Buddha described four jhanas (meditative absorptions):
 * 1. First Jhana - applied/sustained thought, joy, happiness
 * 2. Second Jhana - internal confidence, joy, happiness
 * 3. Third Jhana - equanimity, mindfulness, happiness
 * 4. Fourth Jhana - pure equanimity and mindfulness
 */

import { PathFactor } from '../PathFactor';
import { Intensity } from '../../utils/types';

/**
 * The four jhana states
 */
export type JhanaLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Jhana factors present at each level
 */
export interface JhanaFactors {
  /** Vitakka - initial application of mind */
  appliedThought: boolean;
  /** Vicara - sustained application of mind */
  sustainedThought: boolean;
  /** Piti - joy/rapture */
  joy: boolean;
  /** Sukha - happiness/pleasure */
  happiness: boolean;
  /** Ekaggata - one-pointedness */
  onePointedness: boolean;
  /** Upekkha - equanimity */
  equanimity: boolean;
}

/**
 * Result of a concentration session
 */
export interface ConcentrationResult {
  /** Highest jhana reached */
  jhanaReached: JhanaLevel;
  /** Factors present */
  factorsPresent: JhanaFactors;
  /** Duration of absorption */
  duration: number;
  /** Quality of concentration */
  quality: 'access' | 'momentary' | 'absorption';
  /** Description of experience */
  description: string;
}

/**
 * Right Concentration - Unification of mind
 */
export class RightConcentration extends PathFactor {
  readonly name = 'Right Concentration';
  readonly sanskritName = 'Samyak-samādhi';
  readonly category = 'meditation' as const;
  readonly position = 8;

  /** Highest jhana attained */
  private highestJhana: JhanaLevel = 0;

  /** Total time in absorption */
  private totalAbsorptionTime = 0;

  protected onPractice(effort: Intensity): void {
    // Concentration develops with sustained practice
    if (effort >= 8 && this._developmentLevel >= 3) {
      this.totalAbsorptionTime += effort;
    }
  }

  /**
   * Attempt to enter concentration
   */
  concentrate(effort: Intensity, duration: number): ConcentrationResult {
    // Calculate jhana level based on development and effort
    let jhanaReached: JhanaLevel = 0;

    if (this._developmentLevel >= 3 && effort >= 5) {
      jhanaReached = 1;
    }
    if (this._developmentLevel >= 5 && effort >= 6) {
      jhanaReached = 2;
    }
    if (this._developmentLevel >= 7 && effort >= 7) {
      jhanaReached = 3;
    }
    if (this._developmentLevel >= 9 && effort >= 8) {
      jhanaReached = 4;
    }

    if (jhanaReached > this.highestJhana) {
      this.highestJhana = jhanaReached;
    }

    const factorsPresent = this.getFactorsForJhana(jhanaReached);
    const quality = this.determineQuality(jhanaReached, effort);

    if (quality === 'absorption') {
      this.totalAbsorptionTime += duration;
    }

    return {
      jhanaReached,
      factorsPresent,
      duration,
      quality,
      description: this.describeJhana(jhanaReached)
    };
  }

  private getFactorsForJhana(level: JhanaLevel): JhanaFactors {
    switch (level) {
      case 1:
        return {
          appliedThought: true,
          sustainedThought: true,
          joy: true,
          happiness: true,
          onePointedness: true,
          equanimity: false
        };
      case 2:
        return {
          appliedThought: false,
          sustainedThought: false,
          joy: true,
          happiness: true,
          onePointedness: true,
          equanimity: false
        };
      case 3:
        return {
          appliedThought: false,
          sustainedThought: false,
          joy: false,
          happiness: true,
          onePointedness: true,
          equanimity: true
        };
      case 4:
        return {
          appliedThought: false,
          sustainedThought: false,
          joy: false,
          happiness: false,
          onePointedness: true,
          equanimity: true
        };
      default:
        return {
          appliedThought: false,
          sustainedThought: false,
          joy: false,
          happiness: false,
          onePointedness: false,
          equanimity: false
        };
    }
  }

  private determineQuality(jhana: JhanaLevel, effort: Intensity): 'access' | 'momentary' | 'absorption' {
    if (jhana === 0) return 'momentary';
    if (effort >= 8) return 'absorption';
    return 'access';
  }

  private describeJhana(level: JhanaLevel): string {
    const descriptions: Record<JhanaLevel, string> = {
      0: 'Mind not yet concentrated. Access concentration developing.',
      1: 'First Jhana: Joy and happiness born of seclusion, with applied and sustained thought.',
      2: 'Second Jhana: Joy and happiness born of concentration, internal confidence.',
      3: 'Third Jhana: Equanimous happiness, mindful and alert.',
      4: 'Fourth Jhana: Pure equanimity and mindfulness, neither pleasure nor pain.'
    };
    return descriptions[level];
  }

  /**
   * Get highest jhana attained
   */
  getHighestJhana(): JhanaLevel {
    return this.highestJhana;
  }

  /**
   * Get total absorption time
   */
  getTotalAbsorptionTime(): number {
    return this.totalAbsorptionTime;
  }

  getPractices(): string[] {
    return [
      'Establish a regular sitting meditation practice',
      'Develop access concentration before seeking jhana',
      'Use a single meditation object (breath, kasina, etc.)',
      'Overcome the five hindrances',
      'Learn to recognize jhana factors',
      'Practice with a qualified teacher',
      'Build gradually - do not force concentration'
    ];
  }

  getDescription(): string {
    return `
Right Concentration is the development of a unified, absorbed mind.
It is the culmination of the meditation training.

THE FOUR JHANAS:

FIRST JHANA
- Factors: Applied thought, sustained thought, joy, happiness, one-pointedness
- Character: Secluded from sense desires and unwholesome states
- Joy and happiness born from seclusion

SECOND JHANA
- Factors: Joy, happiness, one-pointedness
- Character: Thought stills, internal confidence arises
- Joy and happiness born from concentration

THIRD JHANA
- Factors: Happiness, equanimity, one-pointedness
- Character: Joy fades, equanimous and mindful
- Pleasant abiding in equanimity

FOURTH JHANA
- Factors: Equanimity, one-pointedness
- Character: Beyond pleasure and pain
- Pure mindfulness and equanimity

PREREQUISITES:
- Ethical conduct (provides a clear conscience)
- Mindfulness (provides the awareness)
- Right effort (provides the energy)
- Letting go of hindrances
    `.trim();
  }

  getIndicators(): string[] {
    return [
      'Mind can settle quickly into meditation',
      'Hindrances arise less frequently',
      'Joy and peace arise naturally in practice',
      'Increased stability and stillness',
      'Less distraction from sense objects',
      'Clear recognition of jhana factors when present'
    ];
  }
}
