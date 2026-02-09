/**
 * Right View (Samma Ditthi)
 *
 * The first factor of the Noble Eightfold Path.
 * Understanding the Four Noble Truths and the nature of reality.
 *
 * Right View has two levels:
 * 1. Mundane Right View - Understanding karma and moral causation
 * 2. Supramundane Right View - Direct insight into the Four Noble Truths
 */

import { PathFactor } from '../PathFactor';
import { Intensity } from '../../utils/types';

/**
 * Right View - Understanding reality as it is
 */
export class RightView extends PathFactor {
  readonly name = 'Right View';
  readonly sanskritName = 'Samyag-dṛṣṭi';
  readonly category = 'wisdom' as const;
  readonly position = 1;

  /** Has mundane right view been established? */
  private mundaneViewEstablished = false;

  /** Has supramundane right view been glimpsed? */
  private supramundaneViewGlimpsed = false;

  protected onPractice(_effort: Intensity): void {
    // At development level 3+, mundane right view is established
    if (this._developmentLevel >= 3 && !this.mundaneViewEstablished) {
      this.mundaneViewEstablished = true;
    }

    // At development level 7+, supramundane right view begins to arise
    if (this._developmentLevel >= 7 && !this.supramundaneViewGlimpsed) {
      this.supramundaneViewGlimpsed = true;
    }
  }

  getPractices(): string[] {
    return [
      'Study the Four Noble Truths',
      'Learn about karma and its results',
      'Contemplate impermanence regularly',
      'Investigate the nature of self',
      'Question assumptions about reality',
      'Seek teachings from wise sources',
      'Reflect on dependent origination'
    ];
  }

  getDescription(): string {
    return `
Right View is the cognitive aspect of wisdom - seeing reality clearly.
It begins with intellectual understanding and deepens into direct insight.

MUNDANE RIGHT VIEW:
- Understanding that actions have consequences (karma)
- Recognizing the existence of suffering and its causes
- Knowing that liberation is possible
- Accepting the value of the path

SUPRAMUNDANE RIGHT VIEW:
- Direct insight into the Four Noble Truths
- Seeing impermanence, suffering, and not-self directly
- Understanding dependent origination experientially
- Wisdom that liberates, not just informs
    `.trim();
  }

  getIndicators(): string[] {
    return [
      'Taking responsibility for actions and their results',
      'Not blaming circumstances for suffering',
      'Seeing craving as the cause of dissatisfaction',
      'Recognizing impermanence in daily life',
      'Questioning the solidity of the self',
      'Understanding without needing to believe blindly'
    ];
  }

  /**
   * Check the current level of right view
   */
  getViewLevel(): 'wrong' | 'mundane' | 'supramundane' {
    if (this.supramundaneViewGlimpsed) return 'supramundane';
    if (this.mundaneViewEstablished) return 'mundane';
    return 'wrong'; // Default state before practice
  }

  /**
   * What Right View understands about the Four Noble Truths
   */
  understandsFourTruths(): boolean {
    return this._developmentLevel >= 3;
  }
}
