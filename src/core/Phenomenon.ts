/**
 * Phenomenon (Dharma)
 *
 * Base class for all conditioned phenomena in Buddhist ontology.
 * Everything that arises dependently bears the Three Marks of Existence.
 *
 * This is the foundational abstraction of Buddha.js - all Buddhist concepts
 * that involve arising and ceasing extend this class.
 */

import {
  ThreeMarks,
  ThreeMarksExaminable,
  ImpermanenceInsight,
  UnsatisfactorinessInsight,
  NotSelfInsight,
  DEFAULT_THREE_MARKS
} from './ThreeMarks';
import {
  TwoTruthsExaminable,
  ConventionalTruth,
  UltimateTruth
} from './TwoTruths';
import { generateId } from '../utils/types';

/**
 * Base class for all conditioned phenomena.
 *
 * Key characteristics:
 * - Bears the Three Marks (impermanence, unsatisfactoriness, not-self)
 * - Arises dependent on conditions
 * - Can cease when conditions change
 * - Can be examined from conventional and ultimate perspectives
 */
export abstract class Phenomenon implements ThreeMarks, ThreeMarksExaminable, TwoTruthsExaminable {
  // Three Marks - always true for conditioned phenomena
  readonly impermanence: true = DEFAULT_THREE_MARKS.impermanence;
  readonly unsatisfactoriness: true = DEFAULT_THREE_MARKS.unsatisfactoriness;
  readonly notSelf: true = DEFAULT_THREE_MARKS.notSelf;

  /** The conditions upon which this phenomenon depends */
  protected conditions: Phenomenon[] = [];

  /** Whether the phenomenon has arisen */
  protected _hasArisen = false;

  /** Whether the phenomenon has ceased */
  protected _hasCeased = false;

  /** Unique identifier for this phenomenon instance */
  readonly id: string;

  /** Human-readable name */
  abstract readonly name: string;

  /** Sanskrit/Pali term */
  abstract readonly sanskritName: string;

  constructor() {
    this.id = generateId();
  }

  /**
   * Check if all conditions are met for arising
   */
  protected conditionsMet(): boolean {
    if (this.conditions.length === 0) return true;
    return this.conditions.every(c => c.hasArisen && !c.hasCeased);
  }

  /**
   * Cause the phenomenon to arise when conditions are met.
   * Reflects the Buddhist principle: "When this exists, that comes to be."
   *
   * @returns true if arising occurred, false if already arisen or conditions not met
   */
  arise(): boolean {
    if (this._hasArisen || this._hasCeased) return false;
    if (!this.conditionsMet()) return false;

    this._hasArisen = true;
    this.onArise();
    return true;
  }

  /**
   * Called when phenomenon arises - override for specific behavior
   */
  protected onArise(): void {
    // Subclasses can override this
  }

  /**
   * Cause the phenomenon to cease.
   * Reflects: "With the cessation of this, that ceases."
   *
   * @returns true if cessation occurred, false if not arisen or already ceased
   */
  cease(): boolean {
    if (!this._hasArisen || this._hasCeased) return false;

    this._hasCeased = true;
    this.onCease();
    return true;
  }

  /**
   * Called when phenomenon ceases - override for specific behavior
   */
  protected onCease(): void {
    // Subclasses can override this
  }

  /** Has this phenomenon arisen? */
  get hasArisen(): boolean {
    return this._hasArisen;
  }

  /** Has this phenomenon ceased? */
  get hasCeased(): boolean {
    return this._hasCeased;
  }

  /** Is this phenomenon currently present (arisen but not ceased)? */
  get isPresent(): boolean {
    return this._hasArisen && !this._hasCeased;
  }

  // ===== ThreeMarksExaminable Implementation =====

  /**
   * Examine the impermanence of this phenomenon
   */
  examineImpermanence(): ImpermanenceInsight {
    return {
      arises: true,
      persists: false,
      ceases: true,
      conditions: this.conditions.map(c => c.name)
    };
  }

  /**
   * Examine the unsatisfactoriness of this phenomenon
   */
  examineUnsatisfactoriness(): UnsatisfactorinessInsight {
    return {
      providesLastingSatisfaction: false,
      reason: `${this.name} is impermanent and dependently originated, thus cannot provide lasting satisfaction`
    };
  }

  /**
   * Examine the not-self nature of this phenomenon
   */
  examineNotSelf(): NotSelfInsight {
    return {
      hasInherentExistence: false,
      dependsOn: this.conditions.map(c => c.name),
      controlledBy: 'none'
    };
  }

  // ===== TwoTruthsExaminable Implementation =====

  /**
   * Get the conventional truth perspective on this phenomenon
   */
  abstract getConventionalTruth(): ConventionalTruth;

  /**
   * Get the ultimate truth perspective on this phenomenon
   */
  abstract getUltimateTruth(): UltimateTruth;

  // ===== Condition Management =====

  /**
   * Add a condition for this phenomenon's arising
   */
  addCondition(condition: Phenomenon): void {
    if (!this.conditions.includes(condition)) {
      this.conditions.push(condition);
    }
  }

  /**
   * Remove a condition
   */
  removeCondition(condition: Phenomenon): void {
    const index = this.conditions.indexOf(condition);
    if (index > -1) {
      this.conditions.splice(index, 1);
    }
  }

  /**
   * Get all conditions (read-only)
   */
  getConditions(): readonly Phenomenon[] {
    return [...this.conditions];
  }

  /**
   * Check if this phenomenon depends on another
   */
  dependsOn(phenomenon: Phenomenon): boolean {
    return this.conditions.includes(phenomenon);
  }
}
