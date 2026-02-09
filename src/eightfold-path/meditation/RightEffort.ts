/**
 * Right Effort (Samma Vayama)
 *
 * The sixth factor of the Noble Eightfold Path.
 * The first of the meditation/concentration trainings.
 *
 * Right Effort involves the Four Great Efforts:
 * 1. Prevent unarisen unwholesome states from arising
 * 2. Abandon arisen unwholesome states
 * 3. Cultivate unarisen wholesome states
 * 4. Maintain arisen wholesome states
 */

import { PathFactor } from '../PathFactor';
import { Intensity } from '../../utils/types';

/**
 * The four types of effort
 */
export interface FourEfforts {
  /** Preventing unwholesome states from arising */
  prevention: Intensity;
  /** Abandoning unwholesome states that have arisen */
  abandonment: Intensity;
  /** Cultivating wholesome states that haven't arisen */
  cultivation: Intensity;
  /** Maintaining wholesome states that have arisen */
  maintenance: Intensity;
}

/**
 * Right Effort - Energetic cultivation of the mind
 */
export class RightEffort extends PathFactor {
  readonly name = 'Right Effort';
  readonly sanskritName = 'Samyag-vyāyāma';
  readonly category = 'meditation' as const;
  readonly position = 6;

  /** Current levels of the four efforts */
  private efforts: FourEfforts = {
    prevention: 0,
    abandonment: 0,
    cultivation: 0,
    maintenance: 0
  };

  protected onPractice(effort: Intensity): void {
    // Practicing develops all four efforts
    const increment = effort * 0.1;
    this.efforts.prevention = Math.min(10, this.efforts.prevention + increment) as Intensity;
    this.efforts.abandonment = Math.min(10, this.efforts.abandonment + increment) as Intensity;
    this.efforts.cultivation = Math.min(10, this.efforts.cultivation + increment) as Intensity;
    this.efforts.maintenance = Math.min(10, this.efforts.maintenance + increment) as Intensity;
  }

  /**
   * Apply effort to prevent an unwholesome state
   */
  prevent(state: string): string {
    this.efforts.prevention = Math.min(10, this.efforts.prevention + 0.1) as Intensity;
    return `Applying effort to prevent ${state} from arising. Guard the sense doors.`;
  }

  /**
   * Apply effort to abandon an unwholesome state
   */
  abandon(state: string): string {
    this.efforts.abandonment = Math.min(10, this.efforts.abandonment + 0.1) as Intensity;
    return `Applying effort to abandon ${state}. Let go through understanding, not suppression.`;
  }

  /**
   * Apply effort to cultivate a wholesome state
   */
  cultivate(state: string): string {
    this.efforts.cultivation = Math.min(10, this.efforts.cultivation + 0.1) as Intensity;
    return `Applying effort to cultivate ${state}. Create conditions for its arising.`;
  }

  /**
   * Apply effort to maintain a wholesome state
   */
  maintain(state: string): string {
    this.efforts.maintenance = Math.min(10, this.efforts.maintenance + 0.1) as Intensity;
    return `Applying effort to maintain ${state}. Sustain without grasping.`;
  }

  /**
   * Get current effort levels
   */
  getEfforts(): FourEfforts {
    return { ...this.efforts };
  }

  getPractices(): string[] {
    return [
      'Notice unwholesome states early, before they strengthen',
      'Use antidotes: loving-kindness for ill-will, etc.',
      'Actively generate wholesome states through practice',
      'Appreciate and sustain positive mind states',
      'Balance effort - neither too tight nor too loose',
      'Make effort joyful, not grim',
      'Rest when needed to sustain long-term effort'
    ];
  }

  getDescription(): string {
    return `
Right Effort is the energy behind the path. Without effort, no progress.
But effort must be balanced - too much creates tension, too little leads nowhere.

THE FOUR GREAT EFFORTS:

1. PREVENTION (Samvara)
   Prevent unwholesome states from arising
   "Guard the sense doors" - mindful contact with sense objects

2. ABANDONMENT (Pahana)
   Abandon unwholesome states that have arisen
   Not through suppression, but through understanding and letting go

3. CULTIVATION (Bhavana)
   Cultivate wholesome states that have not yet arisen
   Actively generate mindfulness, concentration, insight

4. MAINTENANCE (Anurakkhana)
   Maintain wholesome states that have arisen
   Sustain positive states without grasping at them

BALANCE:
Like tuning a stringed instrument - not too tight, not too loose.
Effort should be joyful and sustainable, not grim and exhausting.
    `.trim();
  }

  getIndicators(): string[] {
    return [
      'Quick recognition of unwholesome states arising',
      'Ability to let go of negative states naturally',
      'Positive states arise more frequently',
      'Good states can be sustained without strain',
      'Practice feels energized, not depleted',
      'Consistent daily practice without burnout'
    ];
  }

  /**
   * Check if efforts are balanced
   */
  isBalanced(): boolean {
    const values = Object.values(this.efforts);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return values.every(v => Math.abs(v - avg) < 2);
  }
}
