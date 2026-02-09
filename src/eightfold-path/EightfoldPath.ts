/**
 * The Noble Eightfold Path (Ariya Atthangika Magga)
 *
 * The path leading to the cessation of suffering, consisting of eight
 * interdependent factors grouped into three trainings:
 *
 * WISDOM (Prajna):
 * 1. Right View
 * 2. Right Intention
 *
 * ETHICS (Sila):
 * 3. Right Speech
 * 4. Right Action
 * 5. Right Livelihood
 *
 * MEDITATION (Samadhi):
 * 6. Right Effort
 * 7. Right Mindfulness
 * 8. Right Concentration
 */

import { PathFactor } from './PathFactor';
import { RightView } from './wisdom/RightView';
import { RightIntention } from './wisdom/RightIntention';
import { RightSpeech } from './ethics/RightSpeech';
import { RightAction } from './ethics/RightAction';
import { RightLivelihood } from './ethics/RightLivelihood';
import { RightEffort } from './meditation/RightEffort';
import { RightMindfulness } from './meditation/RightMindfulness';
import { RightConcentration } from './meditation/RightConcentration';
import { PathCategory, Intensity } from '../utils/types';
import { IEightfoldPath, PathRecommendation } from '../four-noble-truths/Magga';

/**
 * Summary of path development
 */
export interface PathDevelopmentSummary {
  /** Overall development (0-10) */
  overall: number;
  /** Development by category */
  byCategory: Record<PathCategory, number>;
  /** Is path balanced? */
  isBalanced: boolean;
  /** Weakest factor */
  weakestFactor: PathFactor;
  /** Strongest factor */
  strongestFactor: PathFactor;
}

/**
 * The Noble Eightfold Path - the way leading to cessation of suffering
 *
 * The eight factors work together, each supporting the others.
 * This is not a linear progression but an integrated system.
 */
export class EightfoldPath implements IEightfoldPath {
  // Wisdom factors
  readonly rightView: RightView;
  readonly rightIntention: RightIntention;

  // Ethics factors
  readonly rightSpeech: RightSpeech;
  readonly rightAction: RightAction;
  readonly rightLivelihood: RightLivelihood;

  // Meditation factors
  readonly rightEffort: RightEffort;
  readonly rightMindfulness: RightMindfulness;
  readonly rightConcentration: RightConcentration;

  /** All factors in order */
  private readonly allFactors: PathFactor[];

  constructor() {
    // Create all eight factors
    this.rightView = new RightView();
    this.rightIntention = new RightIntention();
    this.rightSpeech = new RightSpeech();
    this.rightAction = new RightAction();
    this.rightLivelihood = new RightLivelihood();
    this.rightEffort = new RightEffort();
    this.rightMindfulness = new RightMindfulness();
    this.rightConcentration = new RightConcentration();

    this.allFactors = [
      this.rightView,
      this.rightIntention,
      this.rightSpeech,
      this.rightAction,
      this.rightLivelihood,
      this.rightEffort,
      this.rightMindfulness,
      this.rightConcentration
    ];

    // Establish interdependencies
    this.establishInterdependencies();
  }

  /**
   * Set up the mutual support relationships between factors.
   * Each factor conditions and supports all others.
   */
  private establishInterdependencies(): void {
    this.allFactors.forEach(factor => {
      this.allFactors.forEach(other => {
        if (factor !== other) {
          factor.addCondition(other);
        }
      });
    });
  }

  /**
   * Get all factors
   */
  getAllFactors(): PathFactor[] {
    return [...this.allFactors];
  }

  /**
   * Get factors by category
   */
  getCategory(category: PathCategory): PathFactor[] {
    return this.allFactors.filter(f => f.category === category);
  }

  /**
   * Get overall path development as average of all factors
   */
  getOverallDevelopment(): number {
    const sum = this.allFactors.reduce((acc, f) => acc + f.developmentLevel, 0);
    return sum / this.allFactors.length;
  }

  /**
   * Get development by category
   */
  getCategoryDevelopment(category: PathCategory): number {
    const factors = this.getCategory(category);
    const sum = factors.reduce((acc, f) => acc + f.developmentLevel, 0);
    return sum / factors.length;
  }

  /**
   * Practice all factors of a category
   */
  practiceCategory(category: PathCategory, effort: Intensity): void {
    this.getCategory(category).forEach(factor => factor.practice(effort));
  }

  /**
   * Practice a specific factor
   */
  practiceFactor(position: number, effort: Intensity): Intensity | null {
    const factor = this.allFactors[position - 1];
    if (factor) {
      return factor.practice(effort);
    }
    return null;
  }

  /**
   * Get the weakest developed factor
   */
  getWeakestFactor(): PathFactor {
    return this.allFactors.reduce((min, f) =>
      f.developmentLevel < min.developmentLevel ? f : min
    );
  }

  /**
   * Get the strongest developed factor
   */
  getStrongestFactor(): PathFactor {
    return this.allFactors.reduce((max, f) =>
      f.developmentLevel > max.developmentLevel ? f : max
    );
  }

  /**
   * Check if path is balanced (no factor significantly lagging)
   */
  isBalanced(threshold = 2): boolean {
    const levels = this.allFactors.map(f => f.developmentLevel);
    const max = Math.max(...levels);
    const min = Math.min(...levels);
    return (max - min) <= threshold;
  }

  /**
   * Get a comprehensive development summary
   */
  getDevelopmentSummary(): PathDevelopmentSummary {
    return {
      overall: this.getOverallDevelopment(),
      byCategory: {
        wisdom: this.getCategoryDevelopment('wisdom'),
        ethics: this.getCategoryDevelopment('ethics'),
        meditation: this.getCategoryDevelopment('meditation')
      },
      isBalanced: this.isBalanced(),
      weakestFactor: this.getWeakestFactor(),
      strongestFactor: this.getStrongestFactor()
    };
  }

  /**
   * Get a practice recommendation based on current development
   */
  getRecommendation(): PathRecommendation {
    const weakest = this.getWeakestFactor();
    const isBalanced = this.isBalanced();

    return {
      focusFactor: weakest,
      practices: weakest.getPractices(),
      reason: isBalanced
        ? 'Path is balanced; continue gradual development of all factors'
        : `${weakest.name} needs attention to maintain balance`,
      overallProgress: this.getOverallDevelopment()
    };
  }

  /**
   * Activate all factors (begin cultivating the entire path)
   */
  activateAll(): void {
    this.allFactors.forEach(f => f.activate());
  }

  /**
   * Reset all factors (for simulation purposes)
   */
  resetAll(): void {
    this.allFactors.forEach(f => f.reset());
  }

  /**
   * Get a summary description of the path
   */
  getSummary(): string {
    return `
THE NOBLE EIGHTFOLD PATH

WISDOM (Prajna):
  1. Right View (${this.rightView.developmentLevel}/10)
     Understanding the Four Noble Truths
  2. Right Intention (${this.rightIntention.developmentLevel}/10)
     Thoughts of renunciation, goodwill, harmlessness

ETHICS (Sila):
  3. Right Speech (${this.rightSpeech.developmentLevel}/10)
     Truthful, harmonious, kind, meaningful
  4. Right Action (${this.rightAction.developmentLevel}/10)
     Non-violence, honesty, respect
  5. Right Livelihood (${this.rightLivelihood.developmentLevel}/10)
     Earning a living without causing harm

MEDITATION (Samadhi):
  6. Right Effort (${this.rightEffort.developmentLevel}/10)
     Cultivating wholesome, abandoning unwholesome
  7. Right Mindfulness (${this.rightMindfulness.developmentLevel}/10)
     Clear awareness of body, feelings, mind, phenomena
  8. Right Concentration (${this.rightConcentration.developmentLevel}/10)
     Developing unified, absorbed mind

Overall Development: ${this.getOverallDevelopment().toFixed(1)}/10
Balance: ${this.isBalanced() ? 'Balanced' : 'Needs attention'}
    `.trim();
  }

  /**
   * Explain the threefold training
   */
  explainThreefoldTraining(): string {
    return `
THE THREEFOLD TRAINING

The Eightfold Path is organized into three trainings (tisikkha):

1. SILA (Ethics)
   - Right Speech, Right Action, Right Livelihood
   - Creates the foundation of a clear conscience
   - Reduces remorse and agitation
   - Makes the mind suitable for concentration

2. SAMADHI (Concentration)
   - Right Effort, Right Mindfulness, Right Concentration
   - Develops calm and clarity
   - Stabilizes attention
   - Prepares the mind for insight

3. PRAJNA (Wisdom)
   - Right View, Right Intention
   - Understanding of reality as it is
   - Liberating insight
   - The goal and fruition of the path

These trainings support each other:
- Ethics creates conditions for concentration
- Concentration creates conditions for wisdom
- Wisdom refines ethics and concentration

The path is not linear but spiral - each training deepens the others.
    `.trim();
  }
}
