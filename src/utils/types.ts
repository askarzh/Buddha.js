/**
 * Buddha.js Type Definitions
 * Core types used throughout the library
 */

/** Feeling tone - the hedonic quality of experience (vedana) */
export type FeelingTone = 'pleasant' | 'unpleasant' | 'neutral';

/** The three unwholesome roots (akusala-mula) */
export type UnwholesomeRoot = 'greed' | 'aversion' | 'delusion';

/** The three wholesome roots (kusala-mula) */
export type WholesomeRoot = 'non-greed' | 'non-aversion' | 'non-delusion';

/** Karma quality - the moral valence of intentional action */
export type KarmaQuality = 'wholesome' | 'unwholesome' | 'neutral';

/** Temporal span in dependent origination */
export type TemporalSpan = 'past' | 'present' | 'future';

/** Truth level in the Two Truths doctrine */
export type TruthLevel = 'conventional' | 'ultimate';

/** Path factor category (threefold training) */
export type PathCategory = 'wisdom' | 'ethics' | 'meditation';

/** Six sense bases (salayatana) */
export type SenseBase = 'eye' | 'ear' | 'nose' | 'tongue' | 'body' | 'mind';

/** Intensity level for mental factors and practice (0-10 scale) */
export type Intensity = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Types of craving (tanha) */
export type CravingType = 'sensory' | 'becoming' | 'non-becoming';

/** Types of suffering (dukkha) */
export type DukkhaType =
  | 'dukkha-dukkha'      // Pain of pain (obvious suffering)
  | 'viparinama-dukkha'  // Pain of change (impermanence)
  | 'sankhara-dukkha';   // Pain of conditioned existence

/** Input for two-arrows analysis */
export interface ArrowInput {
  /** The raw, unavoidable painful experience (first arrow) */
  pain: string;
  /** Mental reactions layered on top: resistance, craving, aversion (second arrow) */
  mentalReactions: string[];
}

/** Result of two-arrows analysis */
export interface ArrowAnalysis {
  firstArrow: { description: string; isUnavoidable: true };
  secondArrow: { reactions: string[]; count: number; isOptional: true };
  totalArrows: 'one' | 'two';
  /** True when a second arrow is present — this IS the 84th problem */
  isEightyFourthProblem: boolean;
  insight: string;
}

/** Aggregate category */
export type AggregateCategory = 'material' | 'mental';

/** Mental factor quality */
export type MentalFactorQuality = 'wholesome' | 'unwholesome' | 'variable';

// =============================================================================
// ABHIDHAMMA CITTA TYPES
// =============================================================================

/** Realm of consciousness (bhūmi) */
export type CittaRealm =
  | 'kāmāvacara'    // Sense-sphere (54 cittas)
  | 'rūpāvacara'    // Form-sphere (15 cittas)
  | 'arūpāvacara'   // Formless-sphere (12 cittas)
  | 'lokuttara';    // Supramundane (8 or 40 cittas)

/** Quality/function of consciousness */
export type CittaQuality =
  | 'kusala'        // Wholesome - creates good karma
  | 'akusala'       // Unwholesome - creates bad karma
  | 'vipāka'        // Resultant - result of past karma
  | 'kiriya';       // Functional - neither cause nor result

/** Root conditions (hetu) */
export type CittaRoot =
  | 'ahetuka'       // Rootless
  | 'lobha'         // Greed-rooted (unwholesome)
  | 'dosa'          // Hatred-rooted (unwholesome)
  | 'moha'          // Delusion-rooted (unwholesome)
  | 'alobha'        // Non-greed-rooted (wholesome)
  | 'adosa'         // Non-hatred-rooted (wholesome)
  | 'amoha';        // Non-delusion/wisdom-rooted (wholesome)

/** Stages of the cognitive process (citta-vīthi) */
export type VithiStage =
  | 'bhavaṅga'              // Life-continuum (resting state)
  | 'bhavaṅga-calana'       // Vibrating life-continuum
  | 'bhavaṅgupaccheda'      // Arrested life-continuum
  | 'āvajjana'              // Adverting (turning to object)
  | 'pañca-viññāṇa'         // Five-sense consciousness
  | 'sampaṭicchana'         // Receiving
  | 'santīraṇa'             // Investigating
  | 'voṭṭhabbana'           // Determining
  | 'javana'                // Impulsion (karmically active)
  | 'tadārammaṇa';          // Registration

/** Door through which consciousness arises */
export type CittaDoor =
  | 'cakkhu-dvāra'   // Eye-door
  | 'sota-dvāra'     // Ear-door
  | 'ghāna-dvāra'    // Nose-door
  | 'jivhā-dvāra'    // Tongue-door
  | 'kāya-dvāra'     // Body-door
  | 'mano-dvāra'     // Mind-door
  | 'dvāra-vimutta'; // Door-free (bhavaṅga)

/** Generate a unique ID */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// =============================================================================
// PERSISTENCE TYPES
// =============================================================================

/** Interface for classes that can serialize to/from JSON */
export interface Serializable<TData> {
  toJSON(): TData;
}

/** Serialized ripening condition (without check function) */
export interface RipeningConditionData {
  type: 'time' | 'state' | 'trigger' | 'random' | 'accumulation';
  name?: string;
  description: string;
  weight: number;
}

/** Serialized karmic seed */
export interface KarmicSeedData {
  id: string;
  createdAt: number;
  type: 'bodily' | 'verbal' | 'mental';
  quality: KarmaQuality;
  description: string;
  intentionStrength: Intensity;
  root: UnwholesomeRoot | WholesomeRoot | 'neutral';
  potency: number;
  originalPotency: number;
  strength: 'weak' | 'moderate' | 'strong' | 'weighty';
  ripeningTiming: 'immediate' | 'deferred' | 'next-life' | 'distant-future';
  minDelay: number;
  maxDelay: number;
  ripeningConditions: RipeningConditionData[];
  state: 'dormant' | 'active' | 'ripening' | 'ripened' | 'exhausted' | 'purified';
  ripeningProgress: number;
  timesRipened: number;
  maxRipenings: number;
  tags: string[];
  collectiveId?: string;
}

/** Serialized KarmicStore */
export interface KarmicStoreData {
  seeds: KarmicSeedData[];
  config: {
    maxSeeds: number;
    defaultMinDelay: number;
    defaultMaxDelay: number;
    ripeningCheckInterval: number;
    enableAutoRipening: boolean;
    timeScale: number;
  };
}

/** Serialized path factor state */
export interface PathFactorData {
  name: string;
  developmentLevel: Intensity;
  isActive: boolean;
  hasArisen: boolean;
  hasCeased: boolean;
}

/** Serialized eightfold path */
export interface PathData {
  factors: PathFactorData[];
}

/** Serialized mental factor */
export interface MentalFactorData {
  key: string;
  name: string;
  sanskritName: string;
  quality: MentalFactorQuality;
  intensity: Intensity;
  isActive: boolean;
}

/** Serialized mind state */
export interface MindData {
  factors: MentalFactorData[];
  clarity: Intensity;
  stability: Intensity;
}

/** Serialized nidana link */
export interface NidanaLinkData {
  position: number;
  name: string;
  hasArisen: boolean;
  hasCeased: boolean;
  isBroken: boolean;
}

/** Serialized dependent origination chain */
export interface NidanaChainData {
  links: NidanaLinkData[];
}

/** Serialized karma */
export interface KarmaData {
  id: string;
  description: string;
  quality: KarmaQuality;
  intensity: Intensity;
  root: UnwholesomeRoot | WholesomeRoot | 'neutral';
  isCompleted: boolean;
  hasManifested: boolean;
}

/** Serialized Being */
export interface BeingData {
  mindfulnessLevel: Intensity;
  karmicStream: KarmaData[];
  experienceHistory: Array<{
    input: { senseBase: string; object: unknown; intensity: number };
    label: string;
    feelingTone: FeelingTone;
    reactions: string[];
    timestamp: number;
  }>;
  aggregates: {
    form: Record<string, unknown>;
    feeling: Record<string, unknown>;
    perception: Record<string, unknown>;
    mentalFormations: Record<string, unknown>;
    consciousness: Record<string, unknown>;
  };
  path: PathData;
  mind: MindData;
  dependentOrigination: NidanaChainData;
}
