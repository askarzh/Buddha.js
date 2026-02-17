/**
 * KoanGenerator — Paradoxical Logic Puzzles for Breaking Dualistic Thinking
 *
 * In Zen (Ch'an) tradition, a koan is a verbal device used to exhaust
 * the discriminating mind. Koans are not riddles with answers — they
 * are tools to push the practitioner beyond conceptual thought.
 *
 * The generator presents classic koans and evaluates contemplation
 * responses for common dualistic thinking traps. Detection of traps
 * is not judgment — it is a mirror.
 */

import {
  Koan,
  DualismTrap,
  ContemplationResult,
} from '../utils/types';
import { BUILT_IN_KOANS } from './koans';

/** Word count threshold for intellectual trap */
const INTELLECTUAL_LENGTH = 15;

/** Patterns for each dualism trap */
const TRAP_PATTERNS: Record<DualismTrap, RegExp[]> = {
  binary: [
    /^(yes|no|true|false|right|wrong)[\.\!\?\s]*$/i,
    /\b(both|neither)\b/i,
    /\b(exists?|does(?:n't| not) exist)\b/i,
    /\b(it is|it isn't|it does|it doesn't)\s*$/i,
  ],
  intellectual: [
    /\bbecause\b/i,
    /\bmeans that\b/i,
    /\btherefore\b/i,
    /\brepresents?\b/i,
    /\bsymbolizes?\b/i,
    /\bimplies?\b/i,
    /\bin other words\b/i,
  ],
  seeking: [
    /\bis this (the )?(right|correct)\b/i,
    /\bis this the answer\b/i,
    /\bwhat('s| is) the answer\b/i,
    /\bam I (right|correct|close)\b/i,
    /\bI think maybe\b/i,
    /\bI('m| am) not sure\b/i,
    /\bperhaps\b/i,
  ],
  nihilistic: [
    /\bnothing (matters|exists|is real)\b/i,
    /\bdoes(?:n't| not) matter\b/i,
    /\bmeaningless\b/i,
    /\bpointless\b/i,
    /\bno point\b/i,
    /\bit('s| is) all (empty|void|illusion)\b/i,
    /\beverything is nothing\b/i,
  ],
  grasping: [
    /\bthe answer is\b/i,
    /\bthe meaning is\b/i,
    /\bit means\b/i,
    /\bthis (means|represents|symbolizes)\b/i,
    /\bthe point is\b/i,
    /\bwhat .+ (really )?(means|is about)\b/i,
  ],
};

/** Reflections for each trap type */
const TRAP_REFLECTIONS: Record<DualismTrap, string> = {
  binary: 'You reach for yes or no, but the koan lives between the fingers of that grasp.',
  intellectual: 'The mind builds a raft of concepts — but who will carry the raft?',
  seeking: 'Seeking the "right" answer is itself the trap. Who is seeking?',
  nihilistic: 'Emptiness is not nothingness. The flower still blooms.',
  grasping: 'To say "the answer is..." is to hold water in a clenched fist.',
};

const NON_DUAL_REFLECTION = 'The mind is quiet. What remains?';

export class KoanGenerator {
  private readonly koans: readonly Koan[];

  constructor() {
    this.koans = BUILT_IN_KOANS;
  }

  /**
   * Present a koan. If no id is given, returns a random koan.
   */
  present(id?: string): Koan {
    if (id !== undefined) {
      const koan = this.koans.find(k => k.id === id);
      if (!koan) {
        throw new Error(`Koan not found: "${id}"`);
      }
      return koan;
    }
    return this.koans[Math.floor(Math.random() * this.koans.length)];
  }

  /**
   * Contemplate a koan by submitting a response. Returns an analysis
   * of dualistic thinking traps detected in the response.
   */
  contemplate(koanId: string, response: string): ContemplationResult {
    const koan = this.present(koanId);

    if (!response.trim()) {
      throw new Error('A response is required for contemplation.');
    }

    const trapsDetected = this.detectTraps(response);
    const reflection = trapsDetected.length > 0
      ? TRAP_REFLECTIONS[trapsDetected[0]]
      : NON_DUAL_REFLECTION;

    return {
      koan,
      response,
      trapsDetected,
      reflection,
      isNonDual: trapsDetected.length === 0,
    };
  }

  /**
   * Return the full collection of available koans.
   */
  getCollection(): readonly Koan[] {
    return this.koans;
  }

  private detectTraps(response: string): DualismTrap[] {
    const traps: DualismTrap[] = [];

    for (const [trap, patterns] of Object.entries(TRAP_PATTERNS) as [DualismTrap, RegExp[]][]) {
      if (trap === 'intellectual') {
        const wordCount = response.trim().split(/\s+/).length;
        if (wordCount >= INTELLECTUAL_LENGTH && patterns.some(p => p.test(response))) {
          traps.push(trap);
        }
      } else {
        if (patterns.some(p => p.test(response))) {
          traps.push(trap);
        }
      }
    }

    return traps;
  }
}
