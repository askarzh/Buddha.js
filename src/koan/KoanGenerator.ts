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
  TrapJournalEntry,
} from '../utils/types';
import { BUILT_IN_KOANS } from './koans';

/** Word count threshold for intellectual trap */
const INTELLECTUAL_LENGTH = 15;

/** Patterns for each dualism trap */
const TRAP_PATTERNS: Record<DualismTrap, RegExp[]> = {
  binary: [
    /^(yes|no|true|false|right|wrong)[.!?\s]*$/i,
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

/** The fields a composed koan must carry to be presentable. */
const REQUIRED_KOAN_FIELDS = ['id', 'title', 'case', 'source'] as const;

export class KoanGenerator {
  private readonly koans: readonly Koan[];
  private readonly trapJournal: TrapJournalEntry[] = [];

  constructor() {
    this.koans = BUILT_IN_KOANS;
  }

  /**
   * Present a koan.
   *
   * - No argument: a random koan from the built-in collection.
   * - A string: the collection koan with that id.
   * - An object: a koan composed by the caller, used as-is. The canon is
   *   not the point — the question this practitioner is stuck on is. A
   *   composed koan is validated and returned, but never joins the
   *   permanent collection.
   */
  present(idOrKoan?: string | Koan): Koan {
    if (typeof idOrKoan === 'object' && idOrKoan !== null) {
      return this.validateComposed(idOrKoan);
    }
    if (idOrKoan !== undefined) {
      const koan = this.koans.find(k => k.id === idOrKoan);
      if (!koan) {
        throw new Error(`Koan not found: "${idOrKoan}"`);
      }
      return koan;
    }
    return this.koans[Math.floor(Math.random() * this.koans.length)];
  }

  /**
   * Record a response to a koan in the trap journal.
   *
   * The journal holds no verdict: no correct answer, no score, no
   * pass/fail. It records only which dualistic traps the response fell
   * into, so that a continuum can see the shape it keeps returning to.
   */
  recordResponse(koanId: string, response: string): TrapJournalEntry {
    if (!response.trim()) {
      throw new Error('A response is required to record.');
    }
    const entry: TrapJournalEntry = {
      koanId,
      traps: this.detectTraps(response),
      at: Date.now(),
    };
    this.trapJournal.push(entry);
    return entry;
  }

  /** The trap journal, oldest entry first. */
  getTrapJournal(): readonly TrapJournalEntry[] {
    return this.trapJournal;
  }

  /**
   * The trap appearing in the most journal entries, or undefined when no
   * trap has appeared at least twice.
   *
   * Ties are broken DELIBERATELY and arbitrarily: the trap encountered
   * earliest in the journal wins, and the others are not reported. Two traps
   * at the same count means the habit has no single shape yet, and naming
   * one of them is already more than the data supports — callers wanting the
   * whole distribution should count `getTrapJournal()` themselves.
   */
  getRecurringTrap(): DualismTrap | undefined {
    const counts = new Map<DualismTrap, number>();
    for (const entry of this.trapJournal) {
      for (const trap of entry.traps) {
        counts.set(trap, (counts.get(trap) ?? 0) + 1);
      }
    }
    let recurring: DualismTrap | undefined;
    let best = 1;
    for (const [trap, count] of counts) {
      if (count > best) {
        best = count;
        recurring = trap;
      }
    }
    return recurring;
  }

  private validateComposed(koan: Koan): Koan {
    for (const field of REQUIRED_KOAN_FIELDS) {
      const value = (koan as Partial<Koan>)[field];
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`A composed koan needs a non-empty "${field}".`);
      }
    }
    return {
      id: koan.id,
      title: koan.title,
      case: koan.case,
      source: koan.source,
      ...(koan.hint ? { hint: koan.hint } : {}),
    };
  }

  /**
   * Contemplate a koan by submitting a response. Returns an analysis
   * of dualistic thinking traps detected in the response.
   *
   * NOTE: this resolves `koanId` through `present()`, so it only accepts ids
   * from the built-in collection — a koan composed at call time was never
   * added to the collection and cannot be looked up again, so contemplating
   * one throws "Koan not found". Record a response to a composed koan with
   * `recordResponse()` instead (which needs no lookup), or compose and
   * respond in a single call, as the MCP `buddha_koan` tool does.
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
