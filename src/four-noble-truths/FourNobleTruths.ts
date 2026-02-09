/**
 * The Four Noble Truths (Cattari Ariyasaccani)
 *
 * The core framework of Buddhist teaching, structured as a medical diagnosis:
 * 1. Dukkha - The symptom (suffering exists)
 * 2. Samudaya - The diagnosis (craving is the cause)
 * 3. Nirodha - The prognosis (suffering can end)
 * 4. Magga - The prescription (the Eightfold Path)
 *
 * These four truths are not beliefs to accept, but realities to understand,
 * each with its own task: understand, abandon, realize, develop.
 */

import { Dukkha, DukkhaAnalysis } from './Dukkha';
import { Samudaya, CauseAnalysis } from './Samudaya';
import { Nirodha, CessationAssessment } from './Nirodha';
import { Magga, IEightfoldPath, PathPrescription } from './Magga';
import { DukkhaType, CravingType } from '../utils/types';

/**
 * Complete diagnosis using the Four Noble Truths framework
 */
export interface Diagnosis {
  /** Analysis of suffering present */
  suffering: DukkhaAnalysis;
  /** Analysis of causes */
  cause: CauseAnalysis;
  /** Assessment of cessation possibility */
  cessationPossible: CessationAssessment;
  /** Prescription for practice */
  path: PathPrescription;
}

/**
 * The four tasks associated with each truth
 */
export interface FourTasks {
  dukkha: string;
  samudaya: string;
  nirodha: string;
  magga: string;
}

/**
 * Input for diagnosing a situation
 */
export interface DiagnosisInput {
  /** Types of suffering being experienced */
  suffering: DukkhaType[];
  /** Types of craving present */
  cravings: CravingType[];
  /** Intensity of craving (0-10) */
  intensity?: number;
}

/**
 * The Four Noble Truths - the core framework of Buddhist teaching
 *
 * This class provides methods to work with the truths as an integrated system
 * for understanding and addressing suffering.
 */
export class FourNobleTruths {
  /** First Noble Truth - Suffering */
  readonly firstTruth: Dukkha;

  /** Second Noble Truth - Origin of Suffering */
  readonly secondTruth: Samudaya;

  /** Third Noble Truth - Cessation of Suffering */
  readonly thirdTruth: Nirodha;

  /** Fourth Noble Truth - The Path */
  readonly fourthTruth: Magga;

  constructor(path?: IEightfoldPath) {
    this.firstTruth = new Dukkha();
    this.secondTruth = new Samudaya();
    this.thirdTruth = new Nirodha();
    this.fourthTruth = new Magga(path);

    // Establish causal relationships
    this.establishRelationships();
  }

  /**
   * Establish the causal relationships between the truths
   */
  private establishRelationships(): void {
    // The second truth (origin) causes the first (suffering)
    this.firstTruth.addCondition(this.secondTruth);

    // The fourth truth (path) leads to the third (cessation)
    this.thirdTruth.addCondition(this.fourthTruth);
  }

  /**
   * Diagnose a situation according to the Four Noble Truths
   *
   * @param input - The situation to diagnose
   * @returns A complete diagnosis with prescription
   */
  diagnose(input: DiagnosisInput): Diagnosis {
    // 1. Analyze the suffering (First Truth)
    const sufferingAnalysis = this.firstTruth.analyze(input.suffering);

    // 2. Analyze the causes (Second Truth)
    const causeAnalysis = this.secondTruth.analyze(
      input.cravings,
      input.intensity
    );

    // 3. Assess cessation possibility (Third Truth)
    const cessationAssessment = this.thirdTruth.isPossible(causeAnalysis);

    // 4. Generate prescription (Fourth Truth)
    const pathPrescription = this.fourthTruth.prescribe(causeAnalysis);

    return {
      suffering: sufferingAnalysis,
      cause: causeAnalysis,
      cessationPossible: cessationAssessment,
      path: pathPrescription
    };
  }

  /**
   * Get the task associated with each truth
   */
  getTasks(): FourTasks {
    return {
      dukkha: this.firstTruth.getTask(),
      samudaya: this.secondTruth.getTask(),
      nirodha: this.thirdTruth.getTask(),
      magga: this.fourthTruth.getTask()
    };
  }

  /**
   * Get a summary of the Four Noble Truths
   */
  getSummary(): string {
    return `
THE FOUR NOBLE TRUTHS

1. DUKKHA (Suffering)
   "There is suffering."
   Task: To be fully understood
   ${this.firstTruth.getConventionalTruth().description}

2. SAMUDAYA (Origin)
   "Suffering has a cause: craving."
   Task: To be abandoned
   ${this.secondTruth.getConventionalTruth().description}

3. NIRODHA (Cessation)
   "Suffering can cease."
   Task: To be realized
   ${this.thirdTruth.getConventionalTruth().description}

4. MAGGA (Path)
   "There is a path to cessation."
   Task: To be developed
   ${this.fourthTruth.getConventionalTruth().description}

These truths are not beliefs but realities to be directly known.
    `.trim();
  }

  /**
   * Explain the relationship between the truths
   */
  explainRelationship(): string {
    return `
The Four Noble Truths form two causal pairs:

PAIR 1: The Problem
  Second Truth (Craving) → First Truth (Suffering)
  "Because there is craving, there is suffering."

PAIR 2: The Solution
  Fourth Truth (Path) → Third Truth (Cessation)
  "By developing the path, cessation is realized."

The genius of this framework is that it identifies:
- The problem (suffering) and its cause (craving)
- The solution (cessation) and its method (the path)

This is why Buddhism is often compared to medicine:
- Doctor: Buddha
- Disease: Suffering
- Diagnosis: Craving
- Cure: Cessation
- Medicine: The Eightfold Path
    `.trim();
  }

  /**
   * Check if all truths have been understood (arisen)
   */
  allTruthsUnderstood(): boolean {
    return this.firstTruth.isFullyUnderstood();
  }

  /**
   * Get individual access to each truth
   */
  get dukkha(): Dukkha {
    return this.firstTruth;
  }

  get samudaya(): Samudaya {
    return this.secondTruth;
  }

  get nirodha(): Nirodha {
    return this.thirdTruth;
  }

  get magga(): Magga {
    return this.fourthTruth;
  }
}
