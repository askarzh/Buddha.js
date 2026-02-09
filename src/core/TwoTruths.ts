/**
 * The Two Truths Doctrine (Satyadvaya)
 *
 * A fundamental Madhyamaka teaching that reality can be understood
 * from two valid perspectives:
 *
 * 1. Conventional Truth (Samvrti-satya) - How things appear and function
 * 2. Ultimate Truth (Paramartha-satya) - The empty nature of phenomena
 *
 * Both truths are valid and do not contradict each other.
 */

// TruthLevel type is used in the interfaces below via literal types

/**
 * Conventional Truth - the relative reality of everyday experience
 */
export interface ConventionalTruth {
  /** The level of truth */
  level: 'conventional';
  /** Description from conventional perspective */
  description: string;
  /** What this truth is useful for */
  usefulFor: string[];
}

/**
 * Ultimate Truth - the reality of emptiness and dependent origination
 */
export interface UltimateTruth {
  /** The level of truth */
  level: 'ultimate';
  /** Description from ultimate perspective */
  description: string;
  /** What misconceptions this transcends */
  transcends: string[];
}

/**
 * Interface for phenomena that can be examined from both truth perspectives
 */
export interface TwoTruthsExaminable {
  /** Get the conventional truth perspective */
  getConventionalTruth(): ConventionalTruth;

  /** Get the ultimate truth perspective */
  getUltimateTruth(): UltimateTruth;
}

/**
 * Combined view of both truths
 */
export interface TwoTruthsView {
  conventional: ConventionalTruth;
  ultimate: UltimateTruth;
  reconciliation: string;
}

/**
 * Helper to create a Two Truths view
 */
export function createTwoTruthsView(
  conventional: ConventionalTruth,
  ultimate: UltimateTruth
): TwoTruthsView {
  return {
    conventional,
    ultimate,
    reconciliation: 'Both truths are valid perspectives on the same reality'
  };
}
