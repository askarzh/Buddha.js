/**
 * Citta - Consciousness (Abhidhamma Model)
 *
 * In Abhidhamma psychology, citta (consciousness) is:
 * - Momentary: Each citta lasts only one mind-moment (kṣaṇa)
 * - Object-taking: Every citta cognizes an object (ārammaṇa)
 * - Accompanied: Cetasikas (mental factors) always arise with citta
 * - Classified: By realm, quality, root, and door
 *
 * The cognitive process (citta-vīthi) consists of 17 mind-moments
 * from the arising of an object to the return to bhavaṅga.
 */

import { Phenomenon } from '../core/Phenomenon';
import { ConventionalTruth, UltimateTruth } from '../core/TwoTruths';
import { MentalFactor } from './MentalFactor';
import {
  CittaRealm,
  CittaQuality,
  CittaRoot,
  VithiStage,
  CittaDoor,
  SenseBase,
  FeelingTone,
  generateId
} from '../utils/types';

// =============================================================================
// TYPES
// =============================================================================

/** Object of consciousness */
export interface Ārammaṇa {
  readonly type: 'sense-object' | 'mental-object' | 'concept';
  readonly content: string;
  readonly senseBase?: SenseBase;
}

/** A single mind-moment */
export interface CittaMoment {
  readonly id: string;
  readonly timestamp: number;
  readonly stage: VithiStage;
  readonly object: Ārammaṇa | null;
  readonly quality: CittaQuality;
  readonly feeling: FeelingTone;
  readonly cetasikas: string[];
  readonly karmicPotency: number;  // 0 for non-javana, 1-7 for javana position
}

/** Result of a cognitive process */
export interface VithiResult {
  readonly moments: CittaMoment[];
  readonly object: Ārammaṇa;
  readonly totalDuration: number;
  readonly karmicImpact: 'strong' | 'weak' | 'none';
  readonly quality: CittaQuality;
}

/** Configuration for citta classification */
export interface CittaClassification {
  readonly realm: CittaRealm;
  readonly quality: CittaQuality;
  readonly roots: CittaRoot[];
  readonly door: CittaDoor;
  readonly feeling: FeelingTone;
}

// =============================================================================
// CITTA CLASS
// =============================================================================

/**
 * Citta - A unit of consciousness
 *
 * Models the Abhidhamma analysis of mind as a stream of
 * momentary consciousness events (citta-santāna).
 */
export class Citta extends Phenomenon {
  readonly name = 'Citta';
  readonly sanskritName = 'Citta';

  /** Current classification */
  private classification: CittaClassification;

  /** Current stage in cognitive process */
  private currentStage: VithiStage = 'bhavaṅga';

  /** Associated mental factors */
  private cetasikas: Map<string, MentalFactor> = new Map();

  /** Current object of consciousness */
  private currentObject: Ārammaṇa | null = null;

  /** History of mind-moments */
  private momentStream: CittaMoment[] = [];

  /** Bhavaṅga (life-continuum) object - set at rebirth */
  private bhavaṅgaObject: Ārammaṇa;

  /** Is a vīthi (cognitive process) currently active? */
  private vithiActive = false;

  /** Current position in javana sequence (1-7) */
  private javanaPosition = 0;

  constructor(classification?: Partial<CittaClassification>) {
    super();

    // Default classification: sense-sphere, resultant, rootless
    this.classification = {
      realm: classification?.realm ?? 'kāmāvacara',
      quality: classification?.quality ?? 'vipāka',
      roots: classification?.roots ?? ['ahetuka'],
      door: classification?.door ?? 'dvāra-vimutta',
      feeling: classification?.feeling ?? 'neutral'
    };

    // Set default bhavaṅga object
    this.bhavaṅgaObject = {
      type: 'mental-object',
      content: 'rebirth-consciousness object'
    };

    this.initializeUniversalCetasikas();
  }

  // ===========================================================================
  // COGNITIVE PROCESS (CITTA-VĪTHI)
  // ===========================================================================

  /**
   * Process a sense object through the full cognitive sequence.
   * This models the 17 mind-moments of a complete vīthi.
   *
   * Five-door process:
   * 1. Atīta-bhavaṅga (past bhavaṅga)
   * 2. Bhavaṅga-calana (vibrating)
   * 3. Bhavaṅgupaccheda (arrested)
   * 4. Pañcadvārāvajjana (five-door adverting)
   * 5. Pañca-viññāṇa (sense consciousness)
   * 6. Sampaṭicchana (receiving)
   * 7. Santīraṇa (investigating)
   * 8. Voṭṭhabbana (determining)
   * 9-15. Javana × 7 (impulsion - karmically active)
   * 16-17. Tadārammaṇa × 2 (registration)
   */
  processSenseObject(object: Ārammaṇa, door: CittaDoor): VithiResult {
    if (door === 'mano-dvāra' || door === 'dvāra-vimutta') {
      throw new Error('Use processMentalObject for mind-door process');
    }

    this.vithiActive = true;
    const moments: CittaMoment[] = [];

    // 1-3: Bhavaṅga disruption
    moments.push(this.createMoment('bhavaṅga', this.bhavaṅgaObject, 'vipāka'));
    moments.push(this.createMoment('bhavaṅga-calana', this.bhavaṅgaObject, 'vipāka'));
    moments.push(this.createMoment('bhavaṅgupaccheda', this.bhavaṅgaObject, 'vipāka'));

    // 4: Five-door adverting
    this.currentObject = object;
    moments.push(this.createMoment('āvajjana', object, 'kiriya'));

    // 5: Sense consciousness (appropriate to door)
    moments.push(this.createMoment('pañca-viññāṇa', object, 'vipāka'));

    // 6: Receiving
    moments.push(this.createMoment('sampaṭicchana', object, 'vipāka'));

    // 7: Investigating
    moments.push(this.createMoment('santīraṇa', object, 'vipāka'));

    // 8: Determining
    moments.push(this.createMoment('voṭṭhabbana', object, 'kiriya'));

    // 9-15: Seven javana moments (karmically active)
    const javanaQuality = this.determineJavanaQuality(object);
    for (let i = 1; i <= 7; i++) {
      this.javanaPosition = i;
      moments.push(this.createMoment('javana', object, javanaQuality, i));
    }
    this.javanaPosition = 0;

    // 16-17: Two registration moments (if object is clear)
    if (this.isObjectClear(object)) {
      moments.push(this.createMoment('tadārammaṇa', object, 'vipāka'));
      moments.push(this.createMoment('tadārammaṇa', object, 'vipāka'));
    }

    // Return to bhavaṅga
    this.currentStage = 'bhavaṅga';
    this.currentObject = null;
    this.vithiActive = false;

    // Store in stream
    this.momentStream.push(...moments);

    return {
      moments,
      object,
      totalDuration: moments.length,
      karmicImpact: this.assessKarmicImpact(javanaQuality),
      quality: javanaQuality
    };
  }

  /**
   * Process a mental object (mind-door process).
   * Shorter than sense-door: no sense consciousness.
   */
  processMentalObject(object: Ārammaṇa): VithiResult {
    this.vithiActive = true;
    const moments: CittaMoment[] = [];

    // 1-3: Bhavaṅga disruption
    moments.push(this.createMoment('bhavaṅga', this.bhavaṅgaObject, 'vipāka'));
    moments.push(this.createMoment('bhavaṅga-calana', this.bhavaṅgaObject, 'vipāka'));
    moments.push(this.createMoment('bhavaṅgupaccheda', this.bhavaṅgaObject, 'vipāka'));

    // 4: Mind-door adverting
    this.currentObject = object;
    moments.push(this.createMoment('āvajjana', object, 'kiriya'));

    // 5-11: Seven javana moments
    const javanaQuality = this.determineJavanaQuality(object);
    for (let i = 1; i <= 7; i++) {
      this.javanaPosition = i;
      moments.push(this.createMoment('javana', object, javanaQuality, i));
    }
    this.javanaPosition = 0;

    // 12-13: Registration (if applicable)
    if (this.isObjectClear(object)) {
      moments.push(this.createMoment('tadārammaṇa', object, 'vipāka'));
      moments.push(this.createMoment('tadārammaṇa', object, 'vipāka'));
    }

    // Return to bhavaṅga
    this.currentStage = 'bhavaṅga';
    this.currentObject = null;
    this.vithiActive = false;

    this.momentStream.push(...moments);

    return {
      moments,
      object,
      totalDuration: moments.length,
      karmicImpact: this.assessKarmicImpact(javanaQuality),
      quality: javanaQuality
    };
  }

  // ===========================================================================
  // MOMENT CREATION AND MANAGEMENT
  // ===========================================================================

  /**
   * Create a single mind-moment.
   * Each moment arises, exists for one kṣaṇa, and ceases.
   */
  private createMoment(
    stage: VithiStage,
    object: Ārammaṇa | null,
    quality: CittaQuality,
    javanaPos = 0
  ): CittaMoment {
    this.currentStage = stage;

    const moment: CittaMoment = {
      id: generateId(),
      timestamp: Date.now(),
      stage,
      object,
      quality,
      feeling: this.determineFeelingForStage(stage, object),
      cetasikas: this.getActiveCetasikaNames(),
      karmicPotency: stage === 'javana' ? this.calculateKarmicPotency(javanaPos) : 0
    };

    // Emit arising event (conceptual)
    this.onMomentArise(moment);

    return moment;
  }

  /**
   * Called when a moment arises - hook for observers
   */
  protected onMomentArise(_moment: CittaMoment): void {
    // Override for custom behavior
  }

  /**
   * Get the current mind-moment (latest in stream)
   */
  getCurrentMoment(): CittaMoment | undefined {
    return this.momentStream[this.momentStream.length - 1];
  }

  /**
   * Get recent moments from the stream
   */
  getRecentMoments(count = 17): CittaMoment[] {
    return this.momentStream.slice(-count);
  }

  // ===========================================================================
  // JAVANA (IMPULSION) - WHERE KARMA IS MADE
  // ===========================================================================

  /**
   * Determine the quality of javana based on mental factors.
   * This is where karma is actually created.
   */
  private determineJavanaQuality(object: Ārammaṇa): CittaQuality {
    const hasGreed = this.cetasikas.get('greed')?.isActive;
    const hasAversion = this.cetasikas.get('aversion')?.isActive;
    const hasDelusion = this.cetasikas.get('delusion')?.isActive;
    const hasMindfulness = this.cetasikas.get('mindfulness')?.isActive;
    const hasWisdom = this.cetasikas.get('wisdom')?.isActive;

    // If mindfulness/wisdom are active, wholesome
    if (hasMindfulness || hasWisdom) {
      return 'kusala';
    }

    // If any unwholesome root is active, unwholesome
    if (hasGreed || hasAversion || hasDelusion) {
      return 'akusala';
    }

    // Default based on object
    if (object.type === 'sense-object') {
      return 'kusala'; // Neutral response to sense objects
    }

    return 'kusala';
  }

  /**
   * Calculate karmic potency based on javana position.
   *
   * The 7 javanas have different strengths:
   * - 1st javana: weak (accumulating)
   * - 2nd-6th javana: medium (full strength)
   * - 7th javana: weak (fading)
   *
   * The 1st and 7th are weaker because they are
   * transitional moments.
   */
  private calculateKarmicPotency(position: number): number {
    if (position === 1 || position === 7) {
      return 1; // Weak
    }
    return 2; // Full strength
  }

  /**
   * Assess overall karmic impact of a vīthi
   */
  private assessKarmicImpact(quality: CittaQuality): 'strong' | 'weak' | 'none' {
    if (quality === 'vipāka' || quality === 'kiriya') {
      return 'none'; // Resultant and functional don't create karma
    }
    // Wholesome/unwholesome create karma
    return this.cetasikas.get('wisdom')?.isActive ? 'strong' : 'weak';
  }

  // ===========================================================================
  // CETASIKA (MENTAL FACTOR) MANAGEMENT
  // ===========================================================================

  /**
   * Initialize the 7 universal cetasikas (sabbacitta-sādhāraṇa).
   * These accompany EVERY citta.
   */
  private initializeUniversalCetasikas(): void {
    // 7 Universal cetasikas
    this.cetasikas.set('phassa', new MentalFactor('Contact', 'Phassa', 'variable'));
    this.cetasikas.set('vedanā', new MentalFactor('Feeling', 'Vedanā', 'variable'));
    this.cetasikas.set('saññā', new MentalFactor('Perception', 'Saññā', 'variable'));
    this.cetasikas.set('cetanā', new MentalFactor('Volition', 'Cetanā', 'variable'));
    this.cetasikas.set('ekaggatā', new MentalFactor('One-pointedness', 'Ekaggatā', 'variable'));
    this.cetasikas.set('jīvitindriya', new MentalFactor('Life-faculty', 'Jīvitindriya', 'variable'));
    this.cetasikas.set('manasikāra', new MentalFactor('Attention', 'Manasikāra', 'variable'));

    // Activate universal factors (always present)
    this.cetasikas.forEach(c => c.activate(5));

    // Add common optional cetasikas (not always active)
    this.cetasikas.set('vitakka', new MentalFactor('Initial Application', 'Vitakka', 'variable'));
    this.cetasikas.set('vicāra', new MentalFactor('Sustained Application', 'Vicāra', 'variable'));
    this.cetasikas.set('adhimokkha', new MentalFactor('Decision', 'Adhimokkha', 'variable'));
    this.cetasikas.set('vīriya', new MentalFactor('Energy', 'Vīriya', 'variable'));
    this.cetasikas.set('pīti', new MentalFactor('Joy', 'Pīti', 'wholesome'));
    this.cetasikas.set('chanda', new MentalFactor('Desire-to-act', 'Chanda', 'variable'));

    // Unwholesome cetasikas
    this.cetasikas.set('moha', new MentalFactor('Delusion', 'Moha', 'unwholesome'));
    this.cetasikas.set('ahirika', new MentalFactor('Shamelessness', 'Ahirika', 'unwholesome'));
    this.cetasikas.set('anottappa', new MentalFactor('Fearlessness of wrong', 'Anottappa', 'unwholesome'));
    this.cetasikas.set('uddhacca', new MentalFactor('Restlessness', 'Uddhacca', 'unwholesome'));
    this.cetasikas.set('lobha', new MentalFactor('Greed', 'Lobha', 'unwholesome'));
    this.cetasikas.set('diṭṭhi', new MentalFactor('Wrong View', 'Diṭṭhi', 'unwholesome'));
    this.cetasikas.set('māna', new MentalFactor('Conceit', 'Māna', 'unwholesome'));
    this.cetasikas.set('dosa', new MentalFactor('Hatred', 'Dosa', 'unwholesome'));
    this.cetasikas.set('issā', new MentalFactor('Envy', 'Issā', 'unwholesome'));
    this.cetasikas.set('macchariya', new MentalFactor('Miserliness', 'Macchariya', 'unwholesome'));
    this.cetasikas.set('kukkucca', new MentalFactor('Worry', 'Kukkucca', 'unwholesome'));
    this.cetasikas.set('thīna', new MentalFactor('Sloth', 'Thīna', 'unwholesome'));
    this.cetasikas.set('middha', new MentalFactor('Torpor', 'Middha', 'unwholesome'));
    this.cetasikas.set('vicikicchā', new MentalFactor('Doubt', 'Vicikicchā', 'unwholesome'));

    // Beautiful (sobhana) cetasikas
    this.cetasikas.set('saddhā', new MentalFactor('Faith', 'Saddhā', 'wholesome'));
    this.cetasikas.set('sati', new MentalFactor('Mindfulness', 'Sati', 'wholesome'));
    this.cetasikas.set('hirī', new MentalFactor('Moral Shame', 'Hirī', 'wholesome'));
    this.cetasikas.set('ottappa', new MentalFactor('Moral Dread', 'Ottappa', 'wholesome'));
    this.cetasikas.set('alobha', new MentalFactor('Non-greed', 'Alobha', 'wholesome'));
    this.cetasikas.set('adosa', new MentalFactor('Non-hatred', 'Adosa', 'wholesome'));
    this.cetasikas.set('tatramajjhattatā', new MentalFactor('Equanimity', 'Tatramajjhattatā', 'wholesome'));
    this.cetasikas.set('kāyapassaddhi', new MentalFactor('Tranquility of factors', 'Kāyapassaddhi', 'wholesome'));
    this.cetasikas.set('cittapassaddhi', new MentalFactor('Tranquility of mind', 'Cittapassaddhi', 'wholesome'));
    this.cetasikas.set('kāyalahutā', new MentalFactor('Lightness of factors', 'Kāyalahutā', 'wholesome'));
    this.cetasikas.set('cittalahutā', new MentalFactor('Lightness of mind', 'Cittalahutā', 'wholesome'));
    this.cetasikas.set('kāyamudutā', new MentalFactor('Malleability of factors', 'Kāyamudutā', 'wholesome'));
    this.cetasikas.set('cittamudutā', new MentalFactor('Malleability of mind', 'Cittamudutā', 'wholesome'));
    this.cetasikas.set('kāyakammaññatā', new MentalFactor('Wieldiness of factors', 'Kāyakammaññatā', 'wholesome'));
    this.cetasikas.set('cittakammaññatā', new MentalFactor('Wieldiness of mind', 'Cittakammaññatā', 'wholesome'));
    this.cetasikas.set('kāyapāguññatā', new MentalFactor('Proficiency of factors', 'Kāyapāguññatā', 'wholesome'));
    this.cetasikas.set('cittapāguññatā', new MentalFactor('Proficiency of mind', 'Cittapāguññatā', 'wholesome'));
    this.cetasikas.set('kāyujukatā', new MentalFactor('Rectitude of factors', 'Kāyujukatā', 'wholesome'));
    this.cetasikas.set('cittujukatā', new MentalFactor('Rectitude of mind', 'Cittujukatā', 'wholesome'));
    this.cetasikas.set('sammāvācā', new MentalFactor('Right Speech', 'Sammāvācā', 'wholesome'));
    this.cetasikas.set('sammākammanta', new MentalFactor('Right Action', 'Sammākammanta', 'wholesome'));
    this.cetasikas.set('sammāājīva', new MentalFactor('Right Livelihood', 'Sammāājīva', 'wholesome'));
    this.cetasikas.set('karuṇā', new MentalFactor('Compassion', 'Karuṇā', 'wholesome'));
    this.cetasikas.set('muditā', new MentalFactor('Sympathetic Joy', 'Muditā', 'wholesome'));
    this.cetasikas.set('paññā', new MentalFactor('Wisdom', 'Paññā', 'wholesome'));

    // Aliases for compatibility with existing code
    this.cetasikas.set('greed', this.cetasikas.get('lobha')!);
    this.cetasikas.set('aversion', this.cetasikas.get('dosa')!);
    this.cetasikas.set('delusion', this.cetasikas.get('moha')!);
    this.cetasikas.set('mindfulness', this.cetasikas.get('sati')!);
    this.cetasikas.set('wisdom', this.cetasikas.get('paññā')!);
  }

  /**
   * Activate a cetasika by name
   */
  activateCetasika(name: string, intensity: number = 5): boolean {
    const cetasika = this.cetasikas.get(name);
    if (cetasika) {
      cetasika.activate(intensity as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10);
      return true;
    }
    return false;
  }

  /**
   * Deactivate a cetasika
   */
  deactivateCetasika(name: string): boolean {
    const cetasika = this.cetasikas.get(name);
    if (cetasika) {
      cetasika.deactivate();
      return true;
    }
    return false;
  }

  /**
   * Get names of currently active cetasikas
   */
  private getActiveCetasikaNames(): string[] {
    return Array.from(this.cetasikas.entries())
      .filter(([_, c]) => c.isActive)
      .map(([name]) => name);
  }

  /**
   * Get all cetasikas
   */
  getCetasikas(): Map<string, MentalFactor> {
    return new Map(this.cetasikas);
  }

  // ===========================================================================
  // FEELING DETERMINATION
  // ===========================================================================

  /**
   * Determine feeling tone for a given stage.
   * Different stages have characteristic feelings.
   */
  private determineFeelingForStage(stage: VithiStage, object: Ārammaṇa | null): FeelingTone {
    // Bhavaṅga is always neutral
    if (stage.includes('bhavaṅga')) {
      return 'neutral';
    }

    // Adverting and determining are neutral
    if (stage === 'āvajjana' || stage === 'voṭṭhabbana') {
      return 'neutral';
    }

    // For sense consciousness and receiving, depends on object
    if (object) {
      return this.classification.feeling;
    }

    return 'neutral';
  }

  /**
   * Check if object is clear enough for registration
   */
  private isObjectClear(object: Ārammaṇa): boolean {
    // Simplified: all objects are clear enough
    return object.content.length > 0;
  }

  // ===========================================================================
  // STATE AND CLASSIFICATION
  // ===========================================================================

  /**
   * Get current stage
   */
  getCurrentStage(): VithiStage {
    return this.currentStage;
  }

  /**
   * Get current javana position (1-7, or 0 if not in javana)
   */
  getJavanaPosition(): number {
    return this.javanaPosition;
  }

  /**
   * Get current object
   */
  getCurrentObject(): Ārammaṇa | null {
    return this.currentObject;
  }

  /**
   * Get classification
   */
  getClassification(): CittaClassification {
    return { ...this.classification };
  }

  /**
   * Is the citta currently in bhavaṅga (resting state)?
   */
  isInBhavanga(): boolean {
    return this.currentStage === 'bhavaṅga' && !this.vithiActive;
  }

  /**
   * Is a cognitive process currently active?
   */
  isProcessing(): boolean {
    return this.vithiActive;
  }

  /**
   * Get total moments processed
   */
  getTotalMoments(): number {
    return this.momentStream.length;
  }

  // ===========================================================================
  // TWO TRUTHS
  // ===========================================================================

  getConventionalTruth(): ConventionalTruth {
    return {
      level: 'conventional',
      description: 'Citta is the knowing element, the subject of experience that cognizes objects',
      usefulFor: [
        'Understanding mental processes',
        'Analyzing the cognitive sequence',
        'Identifying where karma is made (javana)',
        'Meditation on the nature of mind'
      ]
    };
  }

  getUltimateTruth(): UltimateTruth {
    return {
      level: 'ultimate',
      description: 'Citta is a momentary arising, lasting only one mind-moment. ' +
        'It has no permanent essence. What we call "mind" is a stream of such moments.',
      transcends: [
        'Belief in a permanent consciousness',
        'Identification with mental states',
        'The illusion of a continuous observer'
      ]
    };
  }

  // ===========================================================================
  // EXPLANATIONS
  // ===========================================================================

  /**
   * Explain the cognitive process
   */
  static explainVithi(): string {
    return `
CITTA-VĪTHI: THE COGNITIVE PROCESS

A complete cognitive process consists of 17 mind-moments:

FIVE-DOOR PROCESS (e.g., seeing):

1. Atīta-bhavaṅga    - Past life-continuum
2. Bhavaṅga-calana   - Vibrating life-continuum
3. Bhavaṅgupaccheda  - Arrested life-continuum
4. Pañcadvārāvajjana - Five-door adverting
5. Cakkhu-viññāṇa    - Eye-consciousness (or other sense)
6. Sampaṭicchana     - Receiving
7. Santīraṇa         - Investigating
8. Voṭṭhabbana       - Determining
9-15. Javana × 7     - Impulsion (KARMA IS MADE HERE)
16-17. Tadārammaṇa × 2 - Registration

KEY INSIGHT:
Karma is made only during the 7 javana moments.
All other moments are either resultant (vipāka) or functional (kiriya).

The first and last javana are weaker than the middle five.
This is why repeated actions strengthen habits.
    `.trim();
  }

  /**
   * Explain the classification system
   */
  static explainClassification(): string {
    return `
CITTA CLASSIFICATION (89 or 121 types)

BY REALM (Bhūmi):
- Kāmāvacara: Sense-sphere (54 cittas)
- Rūpāvacara: Form-sphere/jhāna (15 cittas)
- Arūpāvacara: Formless-sphere (12 cittas)
- Lokuttara: Supramundane/path-fruit (8 or 40 cittas)

BY QUALITY:
- Kusala: Wholesome - creates good karma
- Akusala: Unwholesome - creates bad karma
- Vipāka: Resultant - result of past karma
- Kiriya: Functional - neither cause nor result

BY ROOT (Hetu):
Unwholesome roots: Lobha (greed), Dosa (hatred), Moha (delusion)
Wholesome roots: Alobha (non-greed), Adosa (non-hatred), Amoha (wisdom)
Rootless: Ahetuka cittas (18 types)

SENSE-SPHERE BREAKDOWN:
- 12 Akusala (unwholesome)
- 8 Mahākusala (great wholesome)
- 8 Mahāvipāka (great resultant)
- 8 Mahākiriya (great functional - Arahants only)
- 18 Ahetuka (rootless)
    `.trim();
  }
}
