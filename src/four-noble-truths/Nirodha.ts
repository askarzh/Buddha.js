/**
 * Nirodha - The Third Noble Truth (Cessation of Suffering)
 *
 * Nirodha declares that suffering CAN cease. This is the good news of Buddhism.
 * The complete cessation of craving leads to Nirvana - liberation from
 * the cycle of suffering.
 *
 * This is not annihilation or a blank void, but freedom from the
 * compulsions of craving and the peace of unbinding.
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { CauseAnalysis } from './Samudaya';

/**
 * Assessment of whether cessation is possible
 */
export interface CessationAssessment {
  /** Is cessation possible given current conditions? */
  isPossible: true; // Always true in principle
  /** Current obstacles to cessation */
  obstacles: string[];
  /** Degree to which causes have been weakened (0-10) */
  progressLevel: number;
  /** Description of the path forward */
  pathForward: string;
}

/**
 * Third Noble Truth - Nirodha (Cessation of Suffering)
 *
 * The task with respect to Nirodha is to "realize" it.
 * This realization comes through practice, not mere belief.
 */
export class Nirodha extends Phenomenon {
  readonly name = 'Nirodha';
  readonly sanskritName = 'Nirodha';

  /**
   * Assess whether cessation is possible and what obstacles remain
   */
  isPossible(causeAnalysis: CauseAnalysis): CessationAssessment {
    const obstacles = this.identifyObstacles(causeAnalysis);
    const progressLevel = this.assessProgress(causeAnalysis);

    return {
      isPossible: true, // Cessation is always possible in principle
      obstacles,
      progressLevel,
      pathForward: this.describePathForward(progressLevel, obstacles)
    };
  }

  /**
   * Identify current obstacles to cessation
   */
  private identifyObstacles(analysis: CauseAnalysis): string[] {
    const obstacles: string[] = [];

    if (analysis.intensity > 7) {
      obstacles.push('Strong craving making clear seeing difficult');
    }

    if (analysis.rootCauses.includes('delusion')) {
      obstacles.push('Fundamental ignorance of the nature of reality');
    }

    if (analysis.rootCauses.includes('greed')) {
      obstacles.push('Attachment and grasping at pleasant experiences');
    }

    if (analysis.rootCauses.includes('aversion')) {
      obstacles.push('Resistance and pushing away of unpleasant experiences');
    }

    if (analysis.cravingsPresent.includes('becoming')) {
      obstacles.push('Identification with a self that needs to become something');
    }

    return obstacles.length > 0 ? obstacles : ['No major obstacles identified - continue practice'];
  }

  /**
   * Assess progress toward cessation
   */
  private assessProgress(analysis: CauseAnalysis): number {
    let progress = 5; // Start at middle

    // Lower intensity craving = more progress
    progress += (10 - analysis.intensity) / 2;

    // Fewer active cravings = more progress
    progress += (3 - analysis.cravingsPresent.length);

    // Fewer root causes = more progress
    progress += (3 - analysis.rootCauses.length);

    return Math.min(10, Math.max(0, Math.round(progress)));
  }

  /**
   * Describe the path forward based on current state
   */
  private describePathForward(progressLevel: number, _obstacles: string[]): string {
    if (progressLevel >= 8) {
      return 'Advanced practice: Subtle attachments remain. Continue deepening insight into emptiness and not-self.';
    }

    if (progressLevel >= 5) {
      return 'Intermediate practice: The path is clear. Develop concentration and insight in balance. Watch for spiritual materialism.';
    }

    if (progressLevel >= 3) {
      return 'Beginning practice: Establish ethical conduct and right view. Build a foundation of mindfulness. Study the teachings.';
    }

    return 'Foundation building: Start with the basics - ethical conduct, generosity, and learning to observe the mind.';
  }

  /**
   * Describe what Nirvana/cessation actually is
   */
  describeNirvana(): string {
    return `
Nirvana (Nibbana) is not:
- Annihilation or nothingness
- A place you go after death
- A state of blissful unconsciousness
- Something to be achieved in the future

Nirvana IS:
- The cessation of craving, aversion, and delusion
- The unbinding from compulsive patterns
- Available here and now, moment by moment
- The natural state when ignorance is dispelled
- Peace, freedom, and the end of suffering

"There is, monks, an unborn, unbecome, unmade, unconditioned.
If there were not this unborn... there would be no escape
from the born, become, made, conditioned." - The Buddha
    `.trim();
  }

  /**
   * Get the task associated with this truth
   */
  getTask(): string {
    return 'To be realized (sacchikatabba)';
  }

  /**
   * Explain the relationship between cessation and the other truths
   */
  explainRelationship(): string {
    return `
The Third Truth is the turning point:
- First Truth (Dukkha): The problem - suffering exists
- Second Truth (Samudaya): The diagnosis - craving causes it
- Third Truth (Nirodha): The prognosis - it CAN end (THIS truth)
- Fourth Truth (Magga): The treatment - the path to end it

Nirodha provides hope and direction. Without the possibility
of cessation, the path would be meaningless. This truth affirms
that liberation is possible for all beings.
    `.trim();
  }

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'When craving ceases, suffering ceases. Peace and freedom are possible.',
      usefulFor: [
        'Providing hope and motivation for practice',
        'Setting the goal of the spiritual path',
        'Understanding that suffering is not inevitable',
        'Recognizing moments of peace as glimpses of cessation'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: 'Cessation is not the destruction of something that exists, but the non-arising of what never had inherent existence',
      transcends: [
        'View of Nirvana as a place or destination',
        'Belief that cessation is annihilation',
        'Grasping at cessation as a goal to achieve',
        'Separation between samsara and Nirvana'
      ]
    };
  }
}
