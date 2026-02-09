/**
 * Pratityasamutpada - Dependent Origination
 *
 * The 12-link chain showing how suffering arises and can cease.
 * This is the Buddha's unique contribution to understanding causation.
 *
 * The formula:
 * "When this exists, that comes to be.
 *  With the arising of this, that arises.
 *  When this does not exist, that does not come to be.
 *  With the cessation of this, that ceases."
 */

import { Nidana, NidanaExplanation } from './Nidana';
import { Avidya } from './links/Avidya';
import { Samskara } from './links/Samskara';
import { Vijnana } from './links/Vijnana';
import { NamaRupa } from './links/NamaRupa';
import { Salayatana } from './links/Salayatana';
import { Sparsa } from './links/Sparsa';
import { Vedana } from './links/Vedana';
import { Tanha } from './links/Tanha';
import { Upadana } from './links/Upadana';
import { Bhava } from './links/Bhava';
import { Jati } from './links/Jati';
import { Jaramarana } from './links/Jaramarana';

/**
 * Event emitted when a link arises or ceases
 */
export interface ChainEvent {
  link: Nidana;
  event: 'arose' | 'ceased' | 'broken';
  explanation: NidanaExplanation;
}

/**
 * Result of breaking the chain
 */
export interface BreakResult {
  success: boolean;
  brokenAt?: string;
  reason: string;
}

/**
 * Pratityasamutpada - Dependent Origination
 *
 * The 12-link chain is the causal map of suffering:
 * 1. Avidya (Ignorance)
 * 2. Samskara (Formations)
 * 3. Vijnana (Consciousness)
 * 4. Nama-rupa (Mind-Body)
 * 5. Salayatana (Six Senses)
 * 6. Sparsa (Contact)
 * 7. Vedana (Feeling)
 * 8. Tanha (Craving)
 * 9. Upadana (Clinging)
 * 10. Bhava (Becoming)
 * 11. Jati (Birth)
 * 12. Jaramarana (Aging/Death)
 */
export class DependentOrigination {
  /** All 12 links in order */
  readonly links: readonly Nidana[];

  // Individual link references
  readonly ignorance: Avidya;
  readonly formations: Samskara;
  readonly consciousness: Vijnana;
  readonly mindBody: NamaRupa;
  readonly sixSenses: Salayatana;
  readonly contact: Sparsa;
  readonly feeling: Vedana;
  readonly craving: Tanha;
  readonly clinging: Upadana;
  readonly becoming: Bhava;
  readonly birth: Jati;
  readonly agingDeath: Jaramarana;

  constructor() {
    // Create all 12 links
    this.ignorance = new Avidya();
    this.formations = new Samskara();
    this.consciousness = new Vijnana();
    this.mindBody = new NamaRupa();
    this.sixSenses = new Salayatana();
    this.contact = new Sparsa();
    this.feeling = new Vedana();
    this.craving = new Tanha();
    this.clinging = new Upadana();
    this.becoming = new Bhava();
    this.birth = new Jati();
    this.agingDeath = new Jaramarana();

    this.links = [
      this.ignorance,
      this.formations,
      this.consciousness,
      this.mindBody,
      this.sixSenses,
      this.contact,
      this.feeling,
      this.craving,
      this.clinging,
      this.becoming,
      this.birth,
      this.agingDeath
    ];

    // Establish the chain
    this.establishChain();
  }

  /**
   * Establish the causal chain between links
   */
  private establishChain(): void {
    for (let i = 0; i < this.links.length - 1; i++) {
      (this.links[i] as Nidana).setNextLink(this.links[i + 1] as Nidana);
    }
  }

  /**
   * Simulate the arising of the entire chain from ignorance
   * Returns events as the chain unfolds
   */
  *simulateArisingSequence(): Generator<ChainEvent> {
    for (const link of this.links) {
      if (link.arise()) {
        yield {
          link,
          event: 'arose',
          explanation: link.getExplanation()
        };
      }
    }
  }

  /**
   * Run the full arising sequence and return all events
   */
  runFullSequence(): ChainEvent[] {
    return Array.from(this.simulateArisingSequence());
  }

  /**
   * Break the chain at a specific link (practicing cessation)
   */
  breakChainAt(linkPosition: number): BreakResult {
    if (linkPosition < 1 || linkPosition > 12) {
      return { success: false, reason: 'Invalid link position (must be 1-12)' };
    }

    const link = this.links[linkPosition - 1] as Nidana;
    const broken = link.breakLink();

    return {
      success: broken,
      brokenAt: link.name,
      reason: broken
        ? `Chain broken at ${link.name}. Subsequent links will not arise.`
        : `Could not break chain at ${link.name}`
    };
  }

  /**
   * The traditional liberation point: between feeling and craving
   * This is where mindfulness can intervene
   */
  practiceAtLiberationPoint(): string {
    // Position 7 is Vedana (Feeling), Position 8 is Tanha (Craving)
    if (this.feeling.hasArisen && !this.craving.hasArisen) {
      return 'Mindfulness present: Observing feeling without reacting with craving. This is the liberation point!';
    }
    if (!this.feeling.hasArisen) {
      return 'Feeling has not yet arisen. Contact must occur first.';
    }
    if (this.craving.hasArisen) {
      return 'Craving has already arisen - this opportunity passed. Wait for next contact.';
    }
    return 'Unknown state';
  }

  /**
   * Get a link by position (1-12)
   */
  getLink(position: number): Nidana | undefined {
    return this.links[position - 1] as Nidana | undefined;
  }

  /**
   * Get a link by name
   */
  getLinkByName(name: string): Nidana | undefined {
    return this.links.find(l => l.name.toLowerCase() === name.toLowerCase()) as Nidana | undefined;
  }

  /**
   * Get the current state of all links
   */
  getChainState(): Array<{ position: number; name: string; hasArisen: boolean; isBroken: boolean }> {
    return this.links.map((link, i) => ({
      position: i + 1,
      name: link.name,
      hasArisen: link.hasArisen,
      isBroken: (link as Nidana).isBroken
    }));
  }

  /**
   * Reset the entire chain (for simulation purposes)
   */
  reset(): void {
    this.links.forEach(link => (link as Nidana).restoreLink());
    // Ignorance starts arisen by default
    this.ignorance.arise();
  }

  /**
   * Get the forward (arising) formula
   */
  getArisingFormula(): string {
    return this.links.map((l, i) =>
      i < this.links.length - 1 ? `${l.sanskritName} → ` : l.sanskritName
    ).join('');
  }

  /**
   * Get the reverse (cessation) formula
   */
  getCessationFormula(): string {
    return [...this.links].reverse().map((l, i) =>
      i < this.links.length - 1
        ? `cessation of ${l.sanskritName} → `
        : `cessation of ${l.sanskritName}`
    ).join('');
  }

  /**
   * Get explanations for all links
   */
  getAllExplanations(): NidanaExplanation[] {
    return this.links.map(l => l.getExplanation());
  }

  /**
   * Get a summary of dependent origination
   */
  getSummary(): string {
    return `
DEPENDENT ORIGINATION (Pratityasamutpada)

The Buddha's analysis of how suffering arises and ceases.

THE TWELVE LINKS:

PAST CAUSES:
1. Avidya (Ignorance) - Not seeing reality clearly
2. Samskara (Formations) - Volitional actions creating karma

PRESENT EFFECTS:
3. Vijnana (Consciousness) - Awareness descending
4. Nama-rupa (Mind-Body) - Psychophysical organism
5. Salayatana (Six Senses) - Sense faculties

PRESENT CAUSES:
6. Sparsa (Contact) - Meeting of sense, object, consciousness
7. Vedana (Feeling) - Pleasant, unpleasant, neutral
8. Tanha (Craving) - Thirst for more ← LIBERATION POINT
9. Upadana (Clinging) - Tight grasping
10. Bhava (Becoming) - Karmic momentum

FUTURE EFFECTS:
11. Jati (Birth) - New existence arises
12. Jaramarana (Aging/Death) - Suffering culminates

THE FORMULA:
"When this exists, that comes to be.
With the arising of this, that arises.
When this does not exist, that does not come to be.
With the cessation of this, that ceases."
    `.trim();
  }
}
