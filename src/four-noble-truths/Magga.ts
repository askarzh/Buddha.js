/**
 * Magga - The Fourth Noble Truth (The Path)
 *
 * The path leading to the cessation of suffering is the
 * Noble Eightfold Path - the practical method for liberation.
 *
 * This truth provides the "how" - the concrete practices
 * that lead from suffering to its cessation.
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { CauseAnalysis } from './Samudaya';
import { PathCategory } from '../utils/types';

// Forward declaration - will be properly imported when EightfoldPath is created
export interface IEightfoldPath {
  getOverallDevelopment(): number;
  getRecommendation(): PathRecommendation;
  practiceCategory(category: PathCategory, effort: number): void;
  isBalanced(threshold?: number): boolean;
}

/**
 * A prescription for practice based on analysis
 */
export interface PathPrescription {
  /** Which training to focus on */
  focusArea: PathCategory;
  /** Specific practices recommended */
  practices: string[];
  /** Why this focus is recommended */
  rationale: string;
  /** Intensity of practice recommended (1-10) */
  recommendedIntensity: number;
}

/**
 * Recommendation from the path
 */
export interface PathRecommendation {
  focusFactor: { name: string };
  practices: string[];
  reason: string;
  overallProgress: number;
}

/**
 * Fourth Noble Truth - Magga (The Path)
 *
 * The task with respect to Magga is to "develop" it.
 * This is an active, ongoing process of cultivation.
 */
export class Magga extends Phenomenon {
  readonly name = 'Magga';
  readonly sanskritName = 'Mārga';

  /** Reference to the Eightfold Path (if provided) */
  private _path?: IEightfoldPath;

  constructor(path?: IEightfoldPath) {
    super();
    this._path = path;
  }

  /**
   * Set the Eightfold Path reference
   */
  setPath(path: IEightfoldPath): void {
    this._path = path;
  }

  /**
   * Get the associated Eightfold Path (if set)
   */
  getPath(): IEightfoldPath | undefined {
    return this._path;
  }

  /**
   * Generate a prescription based on the cause analysis
   */
  prescribe(causeAnalysis: CauseAnalysis): PathPrescription {
    const focusArea = this.determineFocusArea(causeAnalysis);
    const practices = this.getPracticesForArea(focusArea, causeAnalysis);
    const intensity = this.determineIntensity(causeAnalysis);

    return {
      focusArea,
      practices,
      rationale: this.generateRationale(focusArea, causeAnalysis),
      recommendedIntensity: intensity
    };
  }

  /**
   * Determine which area of the path to focus on
   */
  private determineFocusArea(analysis: CauseAnalysis): PathCategory {
    // High intensity craving needs meditation/concentration work
    if (analysis.intensity > 7) {
      return 'meditation';
    }

    // If delusion is the main root, wisdom practices are needed
    if (analysis.rootCauses.includes('delusion') &&
        !analysis.rootCauses.includes('greed') &&
        !analysis.rootCauses.includes('aversion')) {
      return 'wisdom';
    }

    // If behavioral issues (greed/aversion acting out), ethics first
    if (analysis.cravingsPresent.includes('sensory')) {
      return 'ethics';
    }

    // Default to wisdom for understanding
    return 'wisdom';
  }

  /**
   * Get specific practices for the focus area
   */
  private getPracticesForArea(area: PathCategory, _analysis: CauseAnalysis): string[] {
    const practices: Record<PathCategory, string[]> = {
      wisdom: [
        'Study the Four Noble Truths deeply',
        'Contemplate impermanence in daily life',
        'Investigate the nature of self',
        'Develop Right View through learning and reflection',
        'Set intentions aligned with liberation'
      ],
      ethics: [
        'Practice mindful speech - truthful, kind, helpful',
        'Review actions for harmfulness',
        'Examine livelihood for ethical alignment',
        'Cultivate generosity and letting go',
        'Practice restraint without suppression'
      ],
      meditation: [
        'Establish a regular sitting practice',
        'Develop mindfulness of breath',
        'Practice noting arising and passing',
        'Cultivate concentration through sustained attention',
        'Apply mindfulness to daily activities'
      ]
    };

    return practices[area];
  }

  /**
   * Determine recommended practice intensity
   */
  private determineIntensity(analysis: CauseAnalysis): number {
    // More intense craving requires more intensive practice
    // But not too intense - balance is key
    const base = Math.min(8, analysis.intensity + 2);
    return Math.max(3, base); // Minimum intensity of 3
  }

  /**
   * Generate rationale for the prescription
   */
  private generateRationale(area: PathCategory, _analysis: CauseAnalysis): string {
    switch (area) {
      case 'wisdom':
        return 'Wisdom practices address the root of suffering - ignorance. Understanding the nature of reality undermines craving at its source.';
      case 'ethics':
        return 'Ethical practices create the conditions for peace. By reducing harm, we reduce agitation and create space for insight.';
      case 'meditation':
        return 'Meditation practices develop the calm and clarity needed to see things as they are. They directly work with the mind.';
    }
  }

  /**
   * Get the task associated with this truth
   */
  getTask(): string {
    return 'To be developed (bhavetabba)';
  }

  /**
   * List the eight factors of the path
   */
  listEightFactors(): Array<{ name: string; category: PathCategory; description: string }> {
    return [
      { name: 'Right View', category: 'wisdom', description: 'Understanding the Four Noble Truths' },
      { name: 'Right Intention', category: 'wisdom', description: 'Intentions free from greed, hatred, and cruelty' },
      { name: 'Right Speech', category: 'ethics', description: 'Truthful, kind, and helpful communication' },
      { name: 'Right Action', category: 'ethics', description: 'Actions that do not harm' },
      { name: 'Right Livelihood', category: 'ethics', description: 'Earning a living without causing harm' },
      { name: 'Right Effort', category: 'meditation', description: 'Cultivating wholesome states' },
      { name: 'Right Mindfulness', category: 'meditation', description: 'Clear awareness of body, feelings, mind, phenomena' },
      { name: 'Right Concentration', category: 'meditation', description: 'Developing focused, unified mind' }
    ];
  }

  /**
   * Explain the middle way nature of the path
   */
  explainMiddleWay(): string {
    return `
The Noble Eightfold Path is the "Middle Way" between extremes:

NOT self-indulgence:
- Chasing pleasure does not lead to lasting happiness
- Gratifying craving only strengthens it

NOT self-mortification:
- Punishing the body does not purify the mind
- Extreme asceticism creates more suffering

THE MIDDLE WAY:
- Balanced, sustainable practice
- Working with body and mind skillfully
- Neither grasping nor rejecting experience
- Gradual cultivation leading to liberation

This middle way is itself empty - it's a raft to cross the river,
not something to carry forever.
    `.trim();
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'There is a practical path of training - in wisdom, ethics, and meditation - that leads to the end of suffering',
      usefulFor: [
        'Providing concrete practices for liberation',
        'Organizing spiritual development',
        'Measuring progress on the path',
        'Knowing what to do next'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: 'The path is empty of inherent existence - it is a skillful means, not an end in itself. The practitioner, practice, and goal are not ultimately separate.',
      transcends: [
        'Attachment to the path itself',
        'Belief in a self who walks the path',
        'Viewing the path as mechanical self-improvement',
        'Separation between path and fruition'
      ]
    };
  }
}
