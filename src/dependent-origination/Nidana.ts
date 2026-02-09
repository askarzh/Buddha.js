/**
 * Nidana - Base class for the 12 links of Dependent Origination
 *
 * Each nidana (link) is a conditioned phenomenon that:
 * - Depends on the previous link for arising
 * - Conditions the arising of the next link
 * - Can be "broken" to stop the chain of suffering
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { TemporalSpan } from '../utils/types';

/**
 * Explanation of a link's role in the chain
 */
export interface NidanaExplanation {
  /** Name of the link */
  name: string;
  /** What this link means */
  meaning: string;
  /** What conditions this link */
  conditionedBy: string;
  /** What this link conditions */
  conditions: string;
  /** How to break this link */
  howToBreak: string;
}

/**
 * Base class for the 12 links (nidanas) of dependent origination
 */
export abstract class Nidana extends Phenomenon {
  /** Position in the chain (1-12) */
  abstract readonly position: number;

  /** Temporal span (past, present, future) */
  abstract readonly temporalSpan: TemporalSpan;

  /** Reference to the next link in the chain */
  protected nextLink?: Nidana;

  /** Reference to the previous link in the chain */
  protected previousLink?: Nidana;

  /** Whether this link has been broken */
  protected _isBroken = false;

  /**
   * Connect this link to the next in the chain
   */
  setNextLink(link: Nidana): void {
    this.nextLink = link;
    link.previousLink = this;
    link.addCondition(this);
  }

  /**
   * Get the next link
   */
  getNextLink(): Nidana | undefined {
    return this.nextLink;
  }

  /**
   * Get the previous link
   */
  getPreviousLink(): Nidana | undefined {
    return this.previousLink;
  }

  /**
   * When this link arises, it conditions the next
   */
  protected onArise(): void {
    // When this link arises, the next link can arise
    if (this.nextLink && !this.nextLink.hasArisen && !this._isBroken) {
      this.nextLink.arise();
    }
  }

  /**
   * Breaking this link stops the chain
   */
  breakLink(): boolean {
    if (!this._isBroken) {
      this._isBroken = true;
      this.cease();
      return true;
    }
    return false;
  }

  /**
   * Check if the link is broken
   */
  get isBroken(): boolean {
    return this._isBroken;
  }

  /**
   * Restore the link (for simulation reset)
   */
  restoreLink(): void {
    this._isBroken = false;
    this._hasArisen = false;
    this._hasCeased = false;
  }

  /**
   * Get explanation of this link's role
   */
  abstract getExplanation(): NidanaExplanation;

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: `${this.name} is a link in the chain of causation that leads to suffering`,
      usefulFor: [
        'Understanding how suffering arises',
        'Identifying points for intervention',
        'Developing insight into conditionality'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: `${this.name} is empty of inherent existence, arising only when conditions are present`,
      transcends: [
        'Belief in uncaused existence',
        'Eternal self that persists through links',
        'Nihilism that denies causal process'
      ]
    };
  }
}
