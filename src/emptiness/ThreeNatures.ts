/**
 * The Three Natures (Trisvabhava)
 *
 * The Yogacara analysis of how we experience reality.
 * A sophisticated model of delusion and awakening.
 *
 * 1. Imagined Nature (Parikalpita) - false projections
 * 2. Dependent Nature (Paratantra) - causal flow
 * 3. Consummate Nature (Parinishpanna) - reality seen clearly
 */

/**
 * Analysis of imagined nature
 */
export interface ImaginedNature {
  nature: 'imagined';
  description: string;
  example: string;
  status: string;
  liberation: string;
}

/**
 * Analysis of dependent nature
 */
export interface DependentNature {
  nature: 'dependent';
  description: string;
  conditions: string[];
  status: string;
  liberation: string;
}

/**
 * Analysis of consummate nature
 */
export interface ConsummateNature {
  nature: 'consummate';
  description: string;
  status: string;
  liberation: string;
  relationship: string;
}

/**
 * Complete three natures analysis
 */
export interface ThreeNaturesAnalysis {
  imagined: ImaginedNature;
  dependent: DependentNature;
  consummate: ConsummateNature;
  summary: string;
}

/**
 * The Three Natures - Yogacara Analysis
 */
export class ThreeNatures {
  /**
   * Analyze the imagined/constructed nature
   * How we project and superimpose onto experience
   */
  analyzeImagined(perception: string): ImaginedNature {
    return {
      nature: 'imagined',
      description: 'The subject-object duality we project onto experience. The false construction of "I" perceiving "that thing".',
      example: perception,
      status: 'Does not exist as imagined - the duality is a construction',
      liberation: 'See through the construction. Recognize that subject and object arise together, dependently.'
    };
  }

  /**
   * Analyze the dependent/other-dependent nature
   * The causal flow of experience
   */
  analyzeDependent(conditions: string[]): DependentNature {
    return {
      nature: 'dependent',
      description: 'Experience arising from causes and conditions. The continuous flow of dependently originated phenomena.',
      conditions,
      status: 'Exists dependently - neither fully real nor completely unreal',
      liberation: 'See its dependent nature. Understand causality without grasping.'
    };
  }

  /**
   * Analyze the consummate/perfected nature
   * Reality seen clearly without projections
   */
  analyzeConsummate(): ConsummateNature {
    return {
      nature: 'consummate',
      description: 'The dependent nature seen without the imagined overlay. Reality as it is, free from false construction.',
      status: 'The true nature of things - what remains when imagination is removed',
      liberation: 'Direct realization through practice',
      relationship: 'The dependent nature minus the imagined nature equals the consummate nature'
    };
  }

  /**
   * Apply complete three natures analysis to an experience
   */
  analyzeExperience(experience: {
    rawData: string;
    interpretation: string;
    conditions: string[];
  }): ThreeNaturesAnalysis {
    return {
      imagined: this.analyzeImagined(experience.interpretation),
      dependent: this.analyzeDependent(experience.conditions),
      consummate: this.analyzeConsummate(),
      summary: `In this experience:
- What is IMAGINED: the interpretation "${experience.interpretation}" and the sense of a separate "I" experiencing it
- What is DEPENDENT: the raw experience arising from conditions (${experience.conditions.join(', ')})
- What is CONSUMMATE: the dependent experience, seen without the imagined overlay`
    };
  }

  /**
   * Get the transformation formula
   */
  getTransformationFormula(): string {
    return `
THE YOGACARA TRANSFORMATION

DELUSION:
Dependent Nature + Imagined Nature = Samsara
(Reality + False Projections = Suffering)

LIBERATION:
Dependent Nature - Imagined Nature = Consummate Nature
(Reality - False Projections = Freedom)

The transformation is not adding something new,
but REMOVING the false overlay of imagination.

The dependent nature doesn't change.
What changes is how we relate to it.
    `.trim();
  }

  /**
   * Explain the three natures teaching
   */
  explainThreeNatures(): string {
    return `
THE THREE NATURES (Trisvabhava) - YOGACARA BUDDHISM

1. PARIKALPITA (Imagined/Constructed Nature)
   What: The duality we impose on experience
   - The sense of "I" as separate subject
   - Objects as independent, lasting things
   - The story we tell about experience

   Status: Does not exist as imagined
   Example: Seeing a rope and imagining a snake

2. PARATANTRA (Dependent/Other-Dependent Nature)
   What: The flow of experience itself
   - Arising from causes and conditions
   - The stream of consciousness
   - Neither purely subjective nor objective

   Status: Exists dependently
   Example: The rope itself, as dependently arisen

3. PARINISHPANNA (Consummate/Perfected Nature)
   What: Reality seen without projections
   - The dependent nature, clearly seen
   - Free from imagined overlay
   - Emptiness of the imagined

   Status: The ultimate truth
   Example: Seeing the rope as just a rope

KEY INSIGHT:
We don't need to CREATE the consummate nature.
We need to REMOVE the imagined nature.
The consummate is simply the dependent, clearly seen.
    `.trim();
  }
}
