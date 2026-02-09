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
