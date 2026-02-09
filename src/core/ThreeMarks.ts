/**
 * The Three Marks of Existence (Trilakshana)
 * Universal characteristics of all conditioned phenomena
 *
 * These three characteristics are the foundation of Buddhist insight:
 * 1. Anitya (Impermanence) - All phenomena arise and cease
 * 2. Dukkha (Unsatisfactoriness) - Conditioned things cannot satisfy
 * 3. Anatman (Not-Self) - No unchanging essence exists
 */

/**
 * The Three Marks interface - all conditioned phenomena bear these marks
 */
export interface ThreeMarks {
  /** Anitya - Impermanence: the phenomenon is subject to change */
  readonly impermanence: true;

  /** Dukkha - Unsatisfactoriness: cannot provide lasting satisfaction */
  readonly unsatisfactoriness: true;

  /** Anatman - Not-Self: lacks inherent, independent existence */
  readonly notSelf: true;
}

/**
 * Insight into the impermanent nature of phenomena
 */
export interface ImpermanenceInsight {
  /** Does this phenomenon arise? */
  arises: boolean;
  /** Does it persist unchangingly? (always false for conditioned phenomena) */
  persists: boolean;
  /** Does it cease? */
  ceases: boolean;
  /** What conditions does it depend on? */
  conditions: string[];
}

/**
 * Insight into the unsatisfactory nature of phenomena
 */
export interface UnsatisfactorinessInsight {
  /** Can this provide lasting satisfaction? (always false) */
  providesLastingSatisfaction: false;
  /** Why is it unsatisfactory? */
  reason: string;
}

/**
 * Insight into the not-self nature of phenomena
 */
export interface NotSelfInsight {
  /** Does this have inherent existence? (always false) */
  hasInherentExistence: false;
  /** What does it depend on? */
  dependsOn: string[];
  /** Is it controlled by a self? (always 'none') */
  controlledBy: 'self' | 'none';
}

/**
 * Interface for examining the three marks in phenomena
 */
export interface ThreeMarksExaminable {
  /** Examine the impermanence aspect */
  examineImpermanence(): ImpermanenceInsight;

  /** Examine the unsatisfactoriness aspect */
  examineUnsatisfactoriness(): UnsatisfactorinessInsight;

  /** Examine the not-self aspect */
  examineNotSelf(): NotSelfInsight;
}

/**
 * Default implementation of Three Marks for conditioned phenomena
 */
export const DEFAULT_THREE_MARKS: ThreeMarks = {
  impermanence: true,
  unsatisfactoriness: true,
  notSelf: true
} as const;
