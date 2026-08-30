#!/usr/bin/env node

// src/mcp/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as os from "os";
import * as path2 from "path";

// src/cli/utils/state.ts
import * as fs from "fs";
import * as path from "path";

// src/core/ThreeMarks.ts
var DEFAULT_THREE_MARKS = {
  impermanence: true,
  unsatisfactoriness: true,
  notSelf: true
};

// src/utils/types.ts
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// src/core/Phenomenon.ts
var Phenomenon = class {
  // Three Marks - always true for conditioned phenomena
  impermanence = DEFAULT_THREE_MARKS.impermanence;
  unsatisfactoriness = DEFAULT_THREE_MARKS.unsatisfactoriness;
  notSelf = DEFAULT_THREE_MARKS.notSelf;
  /** The conditions upon which this phenomenon depends */
  conditions = [];
  /** Whether the phenomenon has arisen */
  _hasArisen = false;
  /** Whether the phenomenon has ceased */
  _hasCeased = false;
  /** Unique identifier for this phenomenon instance */
  id;
  constructor() {
    this.id = generateId();
  }
  /**
   * Check if all conditions are met for arising
   */
  conditionsMet() {
    if (this.conditions.length === 0) return true;
    return this.conditions.every((c) => c.hasArisen && !c.hasCeased);
  }
  /**
   * Cause the phenomenon to arise when conditions are met.
   * Reflects the Buddhist principle: "When this exists, that comes to be."
   *
   * @returns true if arising occurred, false if already arisen or conditions not met
   */
  arise() {
    if (this._hasArisen || this._hasCeased) return false;
    if (!this.conditionsMet()) return false;
    this._hasArisen = true;
    this.onArise();
    return true;
  }
  /**
   * Called when phenomenon arises - override for specific behavior
   */
  onArise() {
  }
  /**
   * Cause the phenomenon to cease.
   * Reflects: "With the cessation of this, that ceases."
   *
   * @returns true if cessation occurred, false if not arisen or already ceased
   */
  cease() {
    if (!this._hasArisen || this._hasCeased) return false;
    this._hasCeased = true;
    this.onCease();
    return true;
  }
  /**
   * Called when phenomenon ceases - override for specific behavior
   */
  onCease() {
  }
  /** Has this phenomenon arisen? */
  get hasArisen() {
    return this._hasArisen;
  }
  /** Has this phenomenon ceased? */
  get hasCeased() {
    return this._hasCeased;
  }
  /** Is this phenomenon currently present (arisen but not ceased)? */
  get isPresent() {
    return this._hasArisen && !this._hasCeased;
  }
  // ===== ThreeMarksExaminable Implementation =====
  /**
   * Examine the impermanence of this phenomenon
   */
  examineImpermanence() {
    return {
      arises: true,
      persists: false,
      ceases: true,
      conditions: this.conditions.map((c) => c.name)
    };
  }
  /**
   * Examine the unsatisfactoriness of this phenomenon
   */
  examineUnsatisfactoriness() {
    return {
      providesLastingSatisfaction: false,
      reason: `${this.name} is impermanent and dependently originated, thus cannot provide lasting satisfaction`
    };
  }
  /**
   * Examine the not-self nature of this phenomenon
   */
  examineNotSelf() {
    return {
      hasInherentExistence: false,
      dependsOn: this.conditions.map((c) => c.name),
      controlledBy: "none"
    };
  }
  // ===== Condition Management =====
  /**
   * Add a condition for this phenomenon's arising
   */
  addCondition(condition) {
    if (!this.conditions.includes(condition)) {
      this.conditions.push(condition);
    }
  }
  /**
   * Remove a condition
   */
  removeCondition(condition) {
    const index = this.conditions.indexOf(condition);
    if (index > -1) {
      this.conditions.splice(index, 1);
    }
  }
  /**
   * Get all conditions (read-only)
   */
  getConditions() {
    return [...this.conditions];
  }
  /**
   * Check if this phenomenon depends on another
   */
  dependsOn(phenomenon) {
    return this.conditions.includes(phenomenon);
  }
};

// src/five-aggregates/Skandha.ts
var Skandha = class extends Phenomenon {
  /**
   * Check if this aggregate is empty of self
   */
  investigateSelf() {
    return {
      isSelf: false,
      reason: `${this.name} is impermanent, conditioned, and not under complete control - therefore it cannot be self.`
    };
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: `${this.name} is a component of personal experience that functions within the psychophysical process`,
      usefulFor: [
        "Understanding mental and physical processes",
        "Meditation practice and self-inquiry",
        'Recognizing what is taken to be "self"'
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: `${this.name} is empty of inherent self, arising dependently, and cannot be identified as "I" or "mine"`,
      transcends: [
        "Identification with this aggregate as self",
        "Belief that self owns or controls this aggregate",
        "Reification of momentary processes into permanent entities"
      ]
    };
  }
};

// src/five-aggregates/Rupa.ts
var Rupa = class extends Skandha {
  name = "Rupa";
  sanskritName = "R\u016Bpa";
  position = 1;
  category = "material";
  state = {
    elements: {
      earth: 5,
      water: 5,
      fire: 5,
      air: 5
    },
    senseOrgans: {
      eye: true,
      ear: true,
      nose: true,
      tongue: true,
      body: true
    },
    vitality: 7
  };
  constructor() {
    super();
    this.arise();
  }
  /**
   * Update body state
   */
  update(input) {
    if (input.elements) {
      this.state.elements = { ...this.state.elements, ...input.elements };
    }
    if (input.senseOrgans) {
      this.state.senseOrgans = { ...this.state.senseOrgans, ...input.senseOrgans };
    }
    if (input.vitality !== void 0) {
      this.state.vitality = Math.min(10, Math.max(0, input.vitality));
    }
  }
  /**
   * Get current body state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Get element balance
   */
  getElementBalance() {
    const elements = Object.values(this.state.elements);
    const avg = elements.reduce((a, b) => a + b, 0) / elements.length;
    const variance = elements.reduce((sum, e) => sum + Math.abs(e - avg), 0) / elements.length;
    return 10 - variance;
  }
  /**
   * Check if a sense organ is functional
   */
  isSenseFunctional(sense) {
    return this.state.senseOrgans[sense];
  }
  /**
   * Get vitality level
   */
  getVitality() {
    return this.state.vitality;
  }
  /**
   * Explanation of the four elements
   */
  static explainElements() {
    return `
THE FOUR GREAT ELEMENTS (Mahabhuta)

1. EARTH (Pathavi)
   - Quality: Solidity, hardness, extension
   - In body: Bones, teeth, flesh, skin, etc.
   - Experience: Resistance, weight, stability

2. WATER (Apo)
   - Quality: Cohesion, fluidity
   - In body: Blood, sweat, saliva, tears, etc.
   - Experience: Wetness, flow, binding

3. FIRE (Tejo)
   - Quality: Temperature, maturation
   - In body: Digestive heat, body temperature
   - Experience: Hot, cold, warmth, burning

4. AIR (Vayo)
   - Quality: Motion, distension
   - In body: Breath, circulation, movement
   - Experience: Expansion, vibration, pressure

All physical form is composed of these four elements.
None is self. All are impermanent.
    `.trim();
  }
};

// src/five-aggregates/VedanaAggregate.ts
var VedanaAggregate = class extends Skandha {
  name = "Vedana";
  sanskritName = "Vedan\u0101";
  position = 2;
  category = "mental";
  state = {
    currentTone: "neutral",
    source: "mind",
    intensity: 0
  };
  feelingHistory = [];
  constructor() {
    super();
    this.arise();
  }
  /**
   * Experience a feeling
   */
  update(input) {
    this.state = {
      currentTone: input.tone,
      source: input.source,
      intensity: input.intensity
    };
    this.feelingHistory.push({
      ...input,
      timestamp: Date.now()
    });
  }
  /**
   * Register a feeling. Tone (valence) and intensity are orthogonal:
   * intense pain is MORE unpleasant, not pleasant.
   */
  feel(input) {
    const clamped = Math.min(10, Math.max(0, Math.round(input.intensity)));
    this.update({
      tone: input.valence,
      source: input.senseBase,
      intensity: clamped
    });
    return input.valence;
  }
  /**
   * Get current feeling state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Get feeling history
   */
  getHistory(count = 10) {
    return this.feelingHistory.slice(-count);
  }
  /**
   * Get current feeling tone
   */
  getCurrentTone() {
    return this.state.currentTone;
  }
  /**
   * Get feeling statistics
   */
  getStats() {
    const stats = { pleasant: 0, unpleasant: 0, neutral: 0 };
    this.feelingHistory.forEach((f) => stats[f.tone]++);
    return stats;
  }
  /**
   * Clear current feeling (it passes)
   */
  clear() {
    this.state = {
      currentTone: "neutral",
      source: "mind",
      intensity: 0
    };
  }
  /**
   * Explanation of vedana types
   */
  static explainTypes() {
    return `
THE THREE TYPES OF FEELING (Vedana)

1. PLEASANT (Sukha)
   - Agreeable, enjoyable sensation
   - Tendency: Craving arises to maintain it
   - Danger: Attachment and disappointment when it changes

2. UNPLEASANT (Dukkha)
   - Disagreeable, painful sensation
   - Tendency: Craving arises to escape it
   - Danger: Aversion and struggle

3. NEUTRAL (Adukkha-masukha)
   - Neither pleasant nor unpleasant
   - Tendency: Overlooked, confused with boredom
   - Danger: Ignorance and restlessness

All three types arise and pass.
All three can trigger craving if not met with mindfulness.
The practice: Know feeling as feeling, without reacting.
    `.trim();
  }
};

// src/five-aggregates/Samjna.ts
var Samjna = class extends Skandha {
  name = "Samjna";
  sanskritName = "Sa\u1E43j\xF1\u0101";
  position = 3;
  category = "mental";
  state = {
    currentLabel: "",
    source: "mind",
    confidence: 0
  };
  /** Memory of past perceptions for recognition */
  perceptionMemory = /* @__PURE__ */ new Map();
  /** History of perceptions */
  perceptionHistory = [];
  constructor() {
    super();
    this.arise();
  }
  /**
   * Update perception state
   */
  update(input) {
    if (input.currentLabel !== void 0) {
      this.state.currentLabel = input.currentLabel;
    }
    if (input.source !== void 0) {
      this.state.source = input.source;
    }
    if (input.confidence !== void 0) {
      this.state.confidence = Math.min(10, Math.max(0, input.confidence));
    }
  }
  /**
   * Recognize and label an object
   */
  recognize(object) {
    const key = typeof object === "object" ? JSON.stringify(object) : String(object);
    let label = this.perceptionMemory.get(key);
    if (!label) {
      label = this.generateLabel(object);
      this.perceptionMemory.set(key, label);
    }
    this.state = {
      currentLabel: label,
      source: "mind",
      confidence: this.perceptionMemory.has(key) ? 8 : 5
    };
    this.perceptionHistory.push({
      object,
      label,
      source: "mind",
      timestamp: Date.now()
    });
    return label;
  }
  /**
   * Generate a label for an unknown object
   */
  generateLabel(object) {
    if (typeof object === "string") return object;
    if (typeof object === "number") return `number:${object}`;
    if (typeof object === "boolean") return object ? "true" : "false";
    if (object === null) return "nothing";
    if (object === void 0) return "undefined";
    if (Array.isArray(object)) return `collection[${object.length}]`;
    if (typeof object === "object") {
      const keys = Object.keys(object);
      return keys.length > 0 ? `object:${keys[0]}...` : "empty-object";
    }
    return "unknown";
  }
  /**
   * Learn a new perception (training the recognition)
   */
  learn(object, label) {
    const key = typeof object === "object" ? JSON.stringify(object) : String(object);
    this.perceptionMemory.set(key, label);
  }
  /**
   * Get current perception state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Get perception history
   */
  getHistory(count = 10) {
    return this.perceptionHistory.slice(-count);
  }
  /**
   * Get the current label
   */
  getCurrentLabel() {
    return this.state.currentLabel;
  }
  /**
   * Clear current perception
   */
  clear() {
    this.state = {
      currentLabel: "",
      source: "mind",
      confidence: 0
    };
  }
  /**
   * Explanation of perception
   */
  static explainPerception() {
    return `
PERCEPTION (Samjna/Sanna)

Perception is the mental function that:
- Recognizes objects
- Labels and categorizes experience
- Recalls past associations
- Creates the conceptual world

Examples:
- Seeing red and knowing "this is red"
- Hearing a sound and knowing "this is a voice"
- Remembering "this person is my friend"

The nature of perception:
- It is a CONSTRUCTION, not a direct seeing
- It is based on past experience and conditioning
- It can be mistaken (misperception)
- It creates the "story" of experience

Perception is NOT self because:
- It arises and passes
- It is conditioned by memory and context
- It often operates without our control
- It can be trained and changed

The practice: See perception AS perception.
Notice the labeling function at work.
    `.trim();
  }
};

// src/five-aggregates/SamskaraAggregate.ts
var SamskaraAggregate = class extends Skandha {
  name = "Samskara";
  sanskritName = "Sa\u1E43sk\u0101ra";
  position = 4;
  category = "mental";
  state = {
    activeFactors: [],
    dominantQuality: "variable",
    overallIntensity: 0
  };
  /** Available mental factors */
  mentalFactors = /* @__PURE__ */ new Map([
    // Unwholesome factors
    ["greed", { name: "greed", quality: "unwholesome", intensity: 0, active: false }],
    ["aversion", { name: "aversion", quality: "unwholesome", intensity: 0, active: false }],
    ["delusion", { name: "delusion", quality: "unwholesome", intensity: 0, active: false }],
    ["conceit", { name: "conceit", quality: "unwholesome", intensity: 0, active: false }],
    ["restlessness", { name: "restlessness", quality: "unwholesome", intensity: 0, active: false }],
    // Wholesome factors
    ["faith", { name: "faith", quality: "wholesome", intensity: 0, active: false }],
    ["mindfulness", { name: "mindfulness", quality: "wholesome", intensity: 0, active: false }],
    ["equanimity", { name: "equanimity", quality: "wholesome", intensity: 0, active: false }],
    ["compassion", { name: "compassion", quality: "wholesome", intensity: 0, active: false }],
    ["wisdom", { name: "wisdom", quality: "wholesome", intensity: 0, active: false }],
    // Variable factors
    ["attention", { name: "attention", quality: "variable", intensity: 0, active: false }],
    ["intention", { name: "intention", quality: "variable", intensity: 0, active: false }],
    ["concentration", { name: "concentration", quality: "variable", intensity: 0, active: false }]
  ]);
  constructor() {
    super();
    this.arise();
  }
  /**
   * Update with new active factors
   */
  update(input) {
    this.mentalFactors.forEach((factor) => {
      factor.active = false;
      factor.intensity = 0;
    });
    input.factors.forEach((f) => {
      const factor = this.mentalFactors.get(f.name);
      if (factor) {
        factor.active = true;
        factor.intensity = f.intensity;
      }
    });
    this.updateState();
  }
  /**
   * React to feeling with mental formations
   */
  react(feelingTone, _perception) {
    const reactions = [];
    if (feelingTone === "pleasant") {
      this.activateFactor("greed", 5);
      reactions.push("craving arising");
    } else if (feelingTone === "unpleasant") {
      this.activateFactor("aversion", 5);
      reactions.push("aversion arising");
    } else {
      this.activateFactor("restlessness", 3);
      reactions.push("restlessness arising");
    }
    const mindfulness = this.mentalFactors.get("mindfulness");
    if (mindfulness && mindfulness.active && mindfulness.intensity > 5) {
      reactions.push("mindfulness observing the reaction");
      this.reduceUnwholesomeFactors();
    }
    this.updateState();
    return reactions;
  }
  /**
   * Activate a mental factor
   */
  activateFactor(name, intensity) {
    const factor = this.mentalFactors.get(name);
    if (factor) {
      factor.active = true;
      factor.intensity = intensity;
      this.updateState();
      return true;
    }
    return false;
  }
  /**
   * Deactivate a mental factor
   */
  deactivateFactor(name) {
    const factor = this.mentalFactors.get(name);
    if (factor) {
      factor.active = false;
      factor.intensity = 0;
      this.updateState();
      return true;
    }
    return false;
  }
  /**
   * Reduce unwholesome factors (mindfulness effect)
   */
  reduceUnwholesomeFactors() {
    this.mentalFactors.forEach((factor) => {
      if (factor.quality === "unwholesome" && factor.active) {
        factor.intensity = Math.max(0, factor.intensity - 2);
        if (factor.intensity === 0) {
          factor.active = false;
        }
      }
    });
  }
  /**
   * Update the aggregate state
   */
  updateState() {
    const activeFactors = Array.from(this.mentalFactors.values()).filter((f) => f.active);
    const wholesome = activeFactors.filter((f) => f.quality === "wholesome").reduce((sum, f) => sum + f.intensity, 0);
    const unwholesome = activeFactors.filter((f) => f.quality === "unwholesome").reduce((sum, f) => sum + f.intensity, 0);
    let dominantQuality = "variable";
    if (wholesome > unwholesome) dominantQuality = "wholesome";
    else if (unwholesome > wholesome) dominantQuality = "unwholesome";
    const totalIntensity = activeFactors.reduce((sum, f) => sum + f.intensity, 0);
    const overallIntensity = activeFactors.length > 0 ? Math.round(totalIntensity / activeFactors.length) : 0;
    this.state = {
      activeFactors,
      dominantQuality,
      overallIntensity
    };
  }
  /**
   * Get current state
   */
  getState() {
    return {
      activeFactors: [...this.state.activeFactors],
      dominantQuality: this.state.dominantQuality,
      overallIntensity: this.state.overallIntensity
    };
  }
  /**
   * Get active factor names
   */
  getActiveFactorNames() {
    return this.state.activeFactors.map((f) => f.name);
  }
  /**
   * Check if a factor is active
   */
  isFactorActive(name) {
    const factor = this.mentalFactors.get(name);
    return factor?.active ?? false;
  }
  /**
   * Explanation of mental formations
   */
  static explainFormations() {
    return `
MENTAL FORMATIONS (Samskara/Sankhara)

This aggregate includes all mental factors except feeling and perception.
It is the "doing" aspect of mind - intention, volition, and all active qualities.

EXAMPLES:
- Cetana (Intention) - the directing force of mind
- Attention - where mind focuses
- Desire, aversion, pride, jealousy
- Faith, mindfulness, compassion, wisdom

WHY IT'S KARMIC:
Intention (cetana) is karma. "Intention, monks, is karma."
This aggregate is where we create our future through choices.

THREE TYPES:
- Bodily formations (physical actions)
- Verbal formations (speech)
- Mental formations (thoughts)

NOT-SELF:
- Formations arise from conditions
- They are not commanded by a self
- They are habits, patterns, tendencies
- With practice, they can be transformed
    `.trim();
  }
};

// src/five-aggregates/VijnanaAggregate.ts
var VijnanaAggregate = class extends Skandha {
  name = "Vijnana";
  sanskritName = "Vij\xF1\u0101na";
  position = 5;
  category = "mental";
  state = {
    activeTypes: /* @__PURE__ */ new Set(),
    primaryFocus: null,
    clarity: 5
  };
  /** History of cognitions */
  cognitionHistory = [];
  constructor() {
    super();
    this.arise();
  }
  /**
   * Update consciousness state
   */
  update(input) {
    if (input.activeTypes) {
      this.state.activeTypes = new Set(input.activeTypes);
    }
    if (input.primaryFocus !== void 0) {
      this.state.primaryFocus = input.primaryFocus;
    }
    if (input.clarity !== void 0) {
      this.state.clarity = Math.min(10, Math.max(0, input.clarity));
    }
  }
  /**
   * Cognize an object through a sense base
   */
  cognize(senseBase, object) {
    this.state.activeTypes.add(senseBase);
    this.state.primaryFocus = senseBase;
    const event = {
      type: senseBase,
      object,
      timestamp: Date.now()
    };
    this.cognitionHistory.push(event);
    return event;
  }
  /**
   * Get current consciousness state
   */
  getState() {
    return {
      activeTypes: new Set(this.state.activeTypes),
      primaryFocus: this.state.primaryFocus,
      clarity: this.state.clarity
    };
  }
  /**
   * Get active consciousness types
   */
  getActiveTypes() {
    return Array.from(this.state.activeTypes);
  }
  /**
   * Get primary focus
   */
  getPrimaryFocus() {
    return this.state.primaryFocus;
  }
  /**
   * Get cognition history
   */
  getCognitionHistory(count = 10) {
    return this.cognitionHistory.slice(-count);
  }
  /**
   * Check if a type of consciousness is active
   */
  isTypeActive(type) {
    return this.state.activeTypes.has(type);
  }
  /**
   * Set clarity level (affected by concentration/mindfulness)
   */
  setClarity(level) {
    this.state.clarity = Math.min(10, Math.max(0, level));
  }
  /**
   * Get clarity level
   */
  getClarity() {
    return this.state.clarity;
  }
  /**
   * Clear focus (consciousness releases object)
   */
  releaseFocus() {
    this.state.primaryFocus = null;
  }
  /**
   * Explanation of consciousness types
   */
  static explainTypes() {
    return `
CONSCIOUSNESS (Vijnana/Vinnana)

Consciousness is the KNOWING function - awareness of an object.
It arises dependent on sense organ meeting sense object.

SIX TYPES:
1. Eye consciousness (cakkhuvinnana) - seeing
2. Ear consciousness (sotavinnana) - hearing
3. Nose consciousness (ghanavinnana) - smelling
4. Tongue consciousness (jivhavinnana) - tasting
5. Body consciousness (kayavinnana) - touching
6. Mind consciousness (manovinnana) - thinking

HOW IT ARISES:
Eye + visible form \u2192 eye consciousness arises
Ear + sound \u2192 ear consciousness arises
etc.

NOT-SELF BECAUSE:
- It depends on conditions (no organ = no consciousness)
- It arises and passes moment to moment
- It is not under control ("see this, don't see that")
- It is impersonal, like an echo

"Consciousness is dependent on conditions.
Apart from conditions, there is no arising of consciousness."
- The Buddha
    `.trim();
  }
};

// src/five-aggregates/FiveAggregates.ts
var FiveAggregates = class {
  /** The form/body aggregate */
  form;
  /** The feeling aggregate */
  feeling;
  /** The perception aggregate */
  perception;
  /** The mental formations aggregate */
  mentalFormations;
  /** The consciousness aggregate */
  consciousness;
  /** All aggregates in order */
  allAggregates;
  constructor() {
    this.form = new Rupa();
    this.feeling = new VedanaAggregate();
    this.perception = new Samjna();
    this.mentalFormations = new SamskaraAggregate();
    this.consciousness = new VijnanaAggregate();
    this.allAggregates = [
      this.form,
      this.feeling,
      this.perception,
      this.mentalFormations,
      this.consciousness
    ];
    this.establishInterdependencies();
  }
  /**
   * Establish interdependencies between aggregates
   */
  establishInterdependencies() {
    this.allAggregates.forEach((agg) => {
      this.allAggregates.forEach((other) => {
        if (agg !== other) {
          agg.addCondition(other);
        }
      });
    });
  }
  /**
   * Process a sensory experience through the aggregates
   */
  processExperience(input) {
    this.consciousness.cognize(input.senseBase, input.object);
    const label = this.perception.recognize(input.object);
    const feelingTone = this.feeling.feel({
      senseBase: input.senseBase,
      valence: input.valence ?? "neutral",
      intensity: input.intensity
    });
    const reactions = this.mentalFormations.react(feelingTone, label);
    return {
      input,
      label,
      feelingTone,
      reactions,
      timestamp: Date.now()
    };
  }
  /**
   * Examine where "self" might be found
   * Spoiler: it cannot be found in any aggregate
   */
  searchForSelf() {
    const results = this.allAggregates.map((agg) => {
      const inquiry2 = agg.investigateSelf();
      return {
        aggregate: agg.name,
        isSelf: inquiry2.isSelf,
        reason: inquiry2.reason
      };
    });
    return {
      aggregatesExamined: results,
      selfFound: false,
      conclusion: 'No unchanging, independent self can be found in or apart from the five aggregates. What we call "self" is a process, not an entity.'
    };
  }
  /**
   * Get the current state of all aggregates
   */
  getSnapshot() {
    return {
      form: this.form.getState(),
      feeling: this.feeling.getState(),
      perception: this.perception.getState(),
      mentalFormations: this.mentalFormations.getState(),
      consciousness: this.consciousness.getState(),
      timestamp: Date.now()
    };
  }
  /**
   * Get all aggregates
   */
  getAllAggregates() {
    return [...this.allAggregates];
  }
  /**
   * Get aggregate by position (1-5)
   */
  getByPosition(position) {
    return this.allAggregates[position - 1];
  }
  /**
   * Get a summary of the five aggregates teaching
   */
  getSummary() {
    return `
THE FIVE AGGREGATES (Panca-skandha)

What we call a "person" is analyzed into five groups:

1. RUPA (Form/Body)
   Material aggregate - the physical form
   ${this.form.getState().vitality}/10 vitality

2. VEDANA (Feeling)
   The hedonic tone - pleasant/unpleasant/neutral
   Current: ${this.feeling.getCurrentTone()}

3. SAMJNA (Perception)
   Recognition and labeling
   Current: ${this.perception.getCurrentLabel() || "none"}

4. SAMSKARA (Mental Formations)
   Intentions, emotions, volitions
   Quality: ${this.mentalFormations.getState().dominantQuality}

5. VIJNANA (Consciousness)
   Basic awareness/knowing
   Clarity: ${this.consciousness.getClarity()}/10

THE KEY INSIGHT:
"Form is not self. If form were self, then form would not lead to affliction."
"Feeling is not self... Perception is not self... Formations are not self..."
"Consciousness is not self..."

Search all five aggregates - no self can be found.
The "self" is a useful convention, not an ultimate truth.
    `.trim();
  }
  /**
   * Explain the not-self teaching through the aggregates
   */
  explainAnatta() {
    return `
THE NOT-SELF TEACHING (Anatta/Anatman)

The Buddha's analytical meditation on the aggregates:

FOR EACH AGGREGATE, ASK:

1. Is it permanent or impermanent?
   \u2192 All five are IMPERMANENT (arising and passing)

2. Is what is impermanent satisfying or unsatisfying?
   \u2192 What is impermanent is UNSATISFYING

3. Is what is impermanent and unsatisfying fit to be regarded as:
   "This is mine, this is I, this is my self"?
   \u2192 NO

CONCLUSION:
- Form is not self
- Feeling is not self
- Perception is not self
- Mental formations are not self
- Consciousness is not self

"Seeing thus, the well-instructed noble disciple becomes
disenchanted with form, disenchanted with feeling,
disenchanted with perception, disenchanted with formations,
disenchanted with consciousness.

Being disenchanted, passion fades.
With the fading of passion, one is liberated."

- Anattalakkhana Sutta
    `.trim();
  }
};

// src/eightfold-path/PathFactor.ts
var PathFactor = class extends Phenomenon {
  /** Current level of development (0-10) */
  _developmentLevel = 0;
  /** Whether this factor is being actively cultivated */
  _isActive = false;
  /**
   * Develop this path factor through practice
   *
   * @param effort - Intensity of practice (0-10)
   * @returns New development level
   */
  practice(effort) {
    if (!this._isActive) {
      this.activate();
    }
    const currentLevel = this._developmentLevel;
    const roomToGrow = 10 - currentLevel;
    const increment = Math.min(effort * 0.15, roomToGrow);
    this._developmentLevel = Math.min(10, currentLevel + increment);
    this.onPractice(effort);
    return this._developmentLevel;
  }
  /**
   * Override for factor-specific practice effects
   */
  onPractice(_effort) {
  }
  /**
   * Path factors develop together in mutual support, not in sequence:
   * the interdependence conditions model reinforcement, never prerequisites.
   * A factor arises the moment it is cultivated. (Gethin, Foundations ch. 3)
   */
  conditionsMet() {
    return true;
  }
  /**
   * Activate this path factor (begin cultivating it)
   */
  activate() {
    this._isActive = true;
    if (!this.hasArisen) {
      this.arise();
    }
  }
  /**
   * Deactivate this path factor (pause cultivation)
   */
  deactivate() {
    this._isActive = false;
  }
  /**
   * Reset development level (for simulation purposes)
   */
  reset() {
    this._developmentLevel = 0;
    this._isActive = false;
  }
  /** Get current development level */
  get developmentLevel() {
    return this._developmentLevel;
  }
  /** Is this factor being actively cultivated? */
  get isActive() {
    return this._isActive;
  }
  /**
   * Check if this factor supports another factor
   * All factors support all others in the integrated path
   */
  supports(other) {
    return other !== this;
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: `${this.name} is a factor of the Noble Eightfold Path that can be developed through practice`,
      usefulFor: [
        "Guiding daily conduct",
        "Measuring spiritual progress",
        "Balancing the path"
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: `${this.name} is empty of inherent existence - there is no self who practices and no separate factor being developed`,
      transcends: [
        "Attachment to progress",
        "Pride in achievement",
        "Discouragement at perceived failure"
      ]
    };
  }
};

// src/eightfold-path/wisdom/RightView.ts
var RightView = class extends PathFactor {
  name = "Right View";
  sanskritName = "Samyag-d\u1E5B\u1E63\u1E6Di";
  category = "wisdom";
  position = 1;
  /** Has mundane right view been established? */
  mundaneViewEstablished = false;
  /** Has supramundane right view been glimpsed? */
  supramundaneViewGlimpsed = false;
  onPractice(_effort) {
    if (this._developmentLevel >= 3 && !this.mundaneViewEstablished) {
      this.mundaneViewEstablished = true;
    }
    if (this._developmentLevel >= 7 && !this.supramundaneViewGlimpsed) {
      this.supramundaneViewGlimpsed = true;
    }
  }
  getPractices() {
    return [
      "Study the Four Noble Truths",
      "Learn about karma and its results",
      "Contemplate impermanence regularly",
      "Investigate the nature of self",
      "Question assumptions about reality",
      "Seek teachings from wise sources",
      "Reflect on dependent origination"
    ];
  }
  getDescription() {
    return `
Right View is the cognitive aspect of wisdom - seeing reality clearly.
It begins with intellectual understanding and deepens into direct insight.

MUNDANE RIGHT VIEW:
- Understanding that actions have consequences (karma)
- Recognizing the existence of suffering and its causes
- Knowing that liberation is possible
- Accepting the value of the path

SUPRAMUNDANE RIGHT VIEW:
- Direct insight into the Four Noble Truths
- Seeing impermanence, suffering, and not-self directly
- Understanding dependent origination experientially
- Wisdom that liberates, not just informs
    `.trim();
  }
  getIndicators() {
    return [
      "Taking responsibility for actions and their results",
      "Not blaming circumstances for suffering",
      "Seeing craving as the cause of dissatisfaction",
      "Recognizing impermanence in daily life",
      "Questioning the solidity of the self",
      "Understanding without needing to believe blindly"
    ];
  }
  /**
   * Check the current level of right view
   */
  getViewLevel() {
    if (this.supramundaneViewGlimpsed) return "supramundane";
    if (this.mundaneViewEstablished) return "mundane";
    return "wrong";
  }
  /**
   * What Right View understands about the Four Noble Truths
   */
  understandsFourTruths() {
    return this._developmentLevel >= 3;
  }
};

// src/eightfold-path/wisdom/RightIntention.ts
var RightIntention = class extends PathFactor {
  name = "Right Intention";
  sanskritName = "Samyak-sa\u1E43kalpa";
  category = "wisdom";
  position = 2;
  /** Current levels of each intention quality */
  qualities = {
    renunciation: 0,
    goodwill: 0,
    harmlessness: 0
  };
  onPractice(effort) {
    const increment = effort * 0.1;
    this.qualities.renunciation = Math.min(10, this.qualities.renunciation + increment);
    this.qualities.goodwill = Math.min(10, this.qualities.goodwill + increment);
    this.qualities.harmlessness = Math.min(10, this.qualities.harmlessness + increment);
  }
  /**
   * Set an intention consciously
   */
  setIntention(type, strength) {
    this.qualities[type] = strength;
  }
  /**
   * Get current intention qualities
   */
  getQualities() {
    return { ...this.qualities };
  }
  getPractices() {
    return [
      "Before acting, pause and check your intention",
      "Cultivate metta (loving-kindness) meditation",
      "Practice letting go of small attachments",
      "Notice thoughts of ill-will and replace with goodwill",
      "Refrain from thoughts of harming others",
      "Set daily intentions for practice",
      "Reflect on the results of different intentions"
    ];
  }
  getDescription() {
    return `
Right Intention shapes the quality of our actions. Thought precedes action,
so the mind trained in right intention naturally acts skillfully.

THREE ASPECTS OF RIGHT INTENTION:

1. RENUNCIATION (Nekkhamma)
   - Letting go of excessive desire for pleasure
   - Not driven by craving for acquisition
   - Contentment with what is present

2. GOODWILL (Abyapada)
   - Wishing well for all beings, including oneself
   - Freedom from resentment and ill-will
   - Seeing others as deserving happiness

3. HARMLESSNESS (Avihimsa)
   - Intention not to cause suffering
   - Compassion for those who suffer
   - Non-violence in thought as well as deed
    `.trim();
  }
  getIndicators() {
    return [
      "Thoughts naturally incline toward letting go",
      "Ill-will is quickly recognized and released",
      "No desire to harm even those who harm you",
      "Acting from generosity rather than acquisition",
      "Speech and action reflect inner goodwill",
      "Feeling compassion as a natural response to suffering"
    ];
  }
  /**
   * Check if intentions are balanced
   */
  isBalanced() {
    const { renunciation, goodwill, harmlessness } = this.qualities;
    const avg = (renunciation + goodwill + harmlessness) / 3;
    return Math.abs(renunciation - avg) < 2 && Math.abs(goodwill - avg) < 2 && Math.abs(harmlessness - avg) < 2;
  }
};

// src/eightfold-path/ethics/RightSpeech.ts
var RightSpeech = class extends PathFactor {
  name = "Right Speech";
  sanskritName = "Samyag-v\u0101c";
  category = "ethics";
  position = 3;
  /** Count of mindful speech moments */
  mindfulSpeechCount = 0;
  onPractice(_effort) {
    this.mindfulSpeechCount++;
  }
  /**
   * Assess whether something should be spoken
   * Based on the Buddha's criteria for right speech
   */
  assessSpeech(speech) {
    const shouldSpeak = speech.isTruthful && speech.isBeneficial && speech.isTimely && speech.isKindly;
    return {
      truthful: speech.isTruthful,
      beneficial: speech.isBeneficial,
      timely: speech.isTimely,
      kindly: speech.isKindly,
      shouldSpeak
    };
  }
  /**
   * Get the criteria for right speech
   */
  getCriteria() {
    return [
      "Is it true?",
      "Is it beneficial?",
      "Is it the right time?",
      "Is it spoken with goodwill?"
    ];
  }
  getPractices() {
    return [
      "Pause before speaking to check motivation",
      "Practice noble silence when unsure",
      "Speak truthfully but kindly",
      "Avoid gossip and idle chatter",
      "Use speech to heal, not to harm",
      "Listen more than you speak",
      "Practice saying difficult truths with compassion"
    ];
  }
  getDescription() {
    return `
Right Speech transforms communication into a spiritual practice.
Words have power - they can harm or heal, divide or unite.

ABSTAINING FROM:
\u2022 False speech - lies, deception, misleading
\u2022 Divisive speech - creating conflict, gossip
\u2022 Harsh speech - angry, hurtful, cruel words
\u2022 Idle chatter - pointless, distracting talk

CULTIVATING:
\u2022 Truthfulness - speaking what is true
\u2022 Harmony - speech that brings people together
\u2022 Gentleness - kind, encouraging words
\u2022 Meaningful discourse - useful, timely communication

THE FIVE CRITERIA (before speaking):
1. Is it true?
2. Is it beneficial?
3. Is it timely?
4. Is it spoken with goodwill?
5. If all yes, speak. If any no, remain silent.
    `.trim();
  }
  getIndicators() {
    return [
      "People trust your words because you speak truthfully",
      "Your speech brings people together, not apart",
      "Others feel safe and respected in conversation",
      "You are comfortable with silence",
      "Gossip and harsh words feel uncomfortable",
      "You naturally pause before responding"
    ];
  }
  /**
   * Get mindful speech count
   */
  getMindfulSpeechCount() {
    return this.mindfulSpeechCount;
  }
};

// src/eightfold-path/ethics/RightAction.ts
var RightAction = class extends PathFactor {
  name = "Right Action";
  sanskritName = "Samyak-karm\u0101nta";
  category = "ethics";
  position = 4;
  onPractice(_effort) {
  }
  /**
   * Assess whether an action is skillful
   */
  assessAction(action) {
    const causesHarm = action.causesPhysicalHarm || action.takesWithoutPermission || action.violatesRelationships;
    const isSkillful = !causesHarm && (action.motivation === "wisdom" || action.motivation === "compassion");
    let recommendation;
    if (isSkillful) {
      recommendation = "This action aligns with Right Action. Proceed mindfully.";
    } else if (action.causesPhysicalHarm) {
      recommendation = "This action causes harm. Consider non-violent alternatives.";
    } else if (action.takesWithoutPermission) {
      recommendation = "This involves taking what is not given. Practice generosity instead.";
    } else if (action.violatesRelationships) {
      recommendation = "This may harm relationships. Act with respect and consent.";
    } else {
      recommendation = "Examine your motivation. Act from wisdom, not craving.";
    }
    return {
      causesHarm,
      affectedBeings: action.affectedBeings,
      motivation: action.motivation,
      isSkillful,
      recommendation
    };
  }
  getPractices() {
    return [
      "Practice non-violence toward all beings",
      "Take only what is freely given",
      "Respect others in relationships",
      "Before acting, consider the effects on others",
      "Cultivate generosity as antidote to taking",
      "Practice protecting life, not just avoiding killing",
      "Act with consent and respect"
    ];
  }
  getDescription() {
    return `
Right Action is ethics in bodily conduct. The body is the instrument
through which we interact with the world, so right action shapes
our physical relationship with all beings.

ABSTAINING FROM:
\u2022 Taking life - harming or killing living beings
\u2022 Taking what is not given - theft, deception, exploitation
\u2022 Sexual misconduct - actions that harm through sexuality

CULTIVATING:
\u2022 Non-violence (ahimsa) - protecting and respecting life
\u2022 Generosity (dana) - giving freely, not taking
\u2022 Respectful relationships - consent, faithfulness, care

THE PRINCIPLE:
"What is hateful to yourself, do not do to others."
Consider how your actions affect all beings involved.
    `.trim();
  }
  getIndicators() {
    return [
      "Natural reluctance to cause any harm",
      "Generosity feels more natural than acquisition",
      "Relationships are characterized by respect",
      "You protect rather than exploit",
      "Others feel safe in your presence",
      "Actions considered before undertaken"
    ];
  }
  /**
   * Get the five precepts related to right action
   */
  getFivePrecepts() {
    return [
      "1. I undertake to abstain from taking life",
      "2. I undertake to abstain from taking what is not given",
      "3. I undertake to abstain from sexual misconduct",
      "4. I undertake to abstain from false speech",
      "5. I undertake to abstain from intoxicants that cloud the mind"
    ];
  }
};

// src/eightfold-path/ethics/RightLivelihood.ts
var RightLivelihood = class extends PathFactor {
  name = "Right Livelihood";
  sanskritName = "Samyag-\u0101j\u012Bva";
  category = "ethics";
  position = 5;
  /** The five wrong livelihoods */
  fiveWrongLivelihoods = [
    "weapons",
    "beings",
    "meat",
    "intoxicants",
    "poisons"
  ];
  onPractice(_effort) {
  }
  /**
   * Assess whether a livelihood is right livelihood
   */
  assessLivelihood(livelihood) {
    const harmTypes = [];
    if (livelihood.involvesWeapons) harmTypes.push("Dealing in weapons");
    if (livelihood.involvesTradingBeings) harmTypes.push("Trading in beings");
    if (livelihood.involvesButchery) harmTypes.push("Butchery/meat trade");
    if (livelihood.involvesIntoxicants) harmTypes.push("Dealing in intoxicants");
    if (livelihood.involvesPoisons) harmTypes.push("Dealing in poisons");
    if (livelihood.causesEnvironmentalHarm) harmTypes.push("Environmental harm");
    const causesHarm = harmTypes.length > 0;
    const isRightLivelihood = !causesHarm && !livelihood.involvesDeceit && !livelihood.isExploitative;
    const suggestions = this.generateSuggestions(livelihood, harmTypes);
    return {
      causesHarm,
      harmTypes,
      involvesDeceit: livelihood.involvesDeceit,
      isExploitative: livelihood.isExploitative,
      isRightLivelihood,
      suggestions
    };
  }
  generateSuggestions(livelihood, harmTypes) {
    const suggestions = [];
    if (harmTypes.length > 0) {
      suggestions.push("Consider transitioning to work that does not cause direct harm");
    }
    if (livelihood.involvesDeceit) {
      suggestions.push("Cultivate honesty in all business dealings");
    }
    if (livelihood.isExploitative) {
      suggestions.push("Ensure fair treatment and compensation for all involved");
    }
    if (suggestions.length === 0) {
      suggestions.push("Continue practicing mindfulness in your work");
      suggestions.push("Look for ways to make your work even more beneficial");
    }
    return suggestions;
  }
  getPractices() {
    return [
      "Reflect on how your work affects others",
      "Ensure honest dealings in all business",
      "Treat colleagues and customers with respect",
      "Consider the environmental impact of your work",
      "If in harmful livelihood, plan transition mindfully",
      "Bring mindfulness to your daily work",
      "Use earnings wisely and generously"
    ];
  }
  getDescription() {
    return `
Right Livelihood extends ethics to how we earn our living.
We spend much of our lives working, so work should align with the path.

SPECIFICALLY AVOID:
\u2022 Dealing in weapons
\u2022 Dealing in living beings (slavery, trafficking)
\u2022 Dealing in meat (butchery)
\u2022 Dealing in intoxicants
\u2022 Dealing in poisons

GENERAL PRINCIPLES:
\u2022 Livelihood should not require deceit
\u2022 Livelihood should not exploit others
\u2022 Livelihood should not cause harm
\u2022 Livelihood should ideally benefit others

MODERN CONSIDERATIONS:
\u2022 Environmental impact of work
\u2022 Social justice in employment
\u2022 Ethical investing of earnings
\u2022 Work-life balance for practice
    `.trim();
  }
  getIndicators() {
    return [
      "Work does not require lying or manipulation",
      "No one is harmed by what you do for a living",
      "You can speak openly about your work without shame",
      "Your work contributes positively to society",
      "Fair dealing is natural, not a burden",
      "Work supports rather than hinders your practice"
    ];
  }
  /**
   * Get the five wrong livelihoods
   */
  getFiveWrongLivelihoods() {
    return [...this.fiveWrongLivelihoods];
  }
};

// src/eightfold-path/meditation/RightEffort.ts
var RightEffort = class extends PathFactor {
  name = "Right Effort";
  sanskritName = "Samyag-vy\u0101y\u0101ma";
  category = "meditation";
  position = 6;
  /** Current levels of the four efforts */
  efforts = {
    prevention: 0,
    abandonment: 0,
    cultivation: 0,
    maintenance: 0
  };
  onPractice(effort) {
    const increment = effort * 0.1;
    this.efforts.prevention = Math.min(10, this.efforts.prevention + increment);
    this.efforts.abandonment = Math.min(10, this.efforts.abandonment + increment);
    this.efforts.cultivation = Math.min(10, this.efforts.cultivation + increment);
    this.efforts.maintenance = Math.min(10, this.efforts.maintenance + increment);
  }
  /**
   * Apply effort to prevent an unwholesome state
   */
  prevent(state) {
    this.efforts.prevention = Math.min(10, this.efforts.prevention + 0.1);
    return `Applying effort to prevent ${state} from arising. Guard the sense doors.`;
  }
  /**
   * Apply effort to abandon an unwholesome state
   */
  abandon(state) {
    this.efforts.abandonment = Math.min(10, this.efforts.abandonment + 0.1);
    return `Applying effort to abandon ${state}. Let go through understanding, not suppression.`;
  }
  /**
   * Apply effort to cultivate a wholesome state
   */
  cultivate(state) {
    this.efforts.cultivation = Math.min(10, this.efforts.cultivation + 0.1);
    return `Applying effort to cultivate ${state}. Create conditions for its arising.`;
  }
  /**
   * Apply effort to maintain a wholesome state
   */
  maintain(state) {
    this.efforts.maintenance = Math.min(10, this.efforts.maintenance + 0.1);
    return `Applying effort to maintain ${state}. Sustain without grasping.`;
  }
  /**
   * Get current effort levels
   */
  getEfforts() {
    return { ...this.efforts };
  }
  getPractices() {
    return [
      "Notice unwholesome states early, before they strengthen",
      "Use antidotes: loving-kindness for ill-will, etc.",
      "Actively generate wholesome states through practice",
      "Appreciate and sustain positive mind states",
      "Balance effort - neither too tight nor too loose",
      "Make effort joyful, not grim",
      "Rest when needed to sustain long-term effort"
    ];
  }
  getDescription() {
    return `
Right Effort is the energy behind the path. Without effort, no progress.
But effort must be balanced - too much creates tension, too little leads nowhere.

THE FOUR GREAT EFFORTS:

1. PREVENTION (Samvara)
   Prevent unwholesome states from arising
   "Guard the sense doors" - mindful contact with sense objects

2. ABANDONMENT (Pahana)
   Abandon unwholesome states that have arisen
   Not through suppression, but through understanding and letting go

3. CULTIVATION (Bhavana)
   Cultivate wholesome states that have not yet arisen
   Actively generate mindfulness, concentration, insight

4. MAINTENANCE (Anurakkhana)
   Maintain wholesome states that have arisen
   Sustain positive states without grasping at them

BALANCE:
Like tuning a stringed instrument - not too tight, not too loose.
Effort should be joyful and sustainable, not grim and exhausting.
    `.trim();
  }
  getIndicators() {
    return [
      "Quick recognition of unwholesome states arising",
      "Ability to let go of negative states naturally",
      "Positive states arise more frequently",
      "Good states can be sustained without strain",
      "Practice feels energized, not depleted",
      "Consistent daily practice without burnout"
    ];
  }
  /**
   * Check if efforts are balanced
   */
  isBalanced() {
    const values = Object.values(this.efforts);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return values.every((v) => Math.abs(v - avg) < 2);
  }
};

// src/eightfold-path/meditation/RightMindfulness.ts
var RightMindfulness = class extends PathFactor {
  name = "Right Mindfulness";
  sanskritName = "Samyak-sm\u1E5Bti";
  category = "meditation";
  position = 7;
  /** Development of the four foundations */
  foundations = {
    body: 0,
    feelings: 0,
    mind: 0,
    phenomena: 0
  };
  /** Observation count */
  observationCount = 0;
  onPractice(effort) {
    const increment = effort * 0.1;
    this.foundations.body = Math.min(10, this.foundations.body + increment);
    this.foundations.feelings = Math.min(10, this.foundations.feelings + increment);
    this.foundations.mind = Math.min(10, this.foundations.mind + increment);
    this.foundations.phenomena = Math.min(10, this.foundations.phenomena + increment);
  }
  /**
   * Practice mindfulness of a specific foundation
   */
  observe(foundation, object, notedArising, notedPassing) {
    this.observationCount++;
    this.foundations[foundation] = Math.min(10, this.foundations[foundation] + 0.1);
    let attention;
    if (notedArising && notedPassing) {
      attention = "sustained";
    } else if (notedArising || notedPassing) {
      attention = "intermittent";
    } else {
      attention = "scattered";
    }
    let insight;
    if (attention === "sustained" && this.foundations[foundation] >= 5) {
      insight = `Seeing the ${object} arise and pass, impermanence becomes clear.`;
    }
    return {
      object,
      foundation,
      notedArising,
      notedPassing,
      attention,
      insight
    };
  }
  /**
   * Get current foundation development
   */
  getFoundations() {
    return { ...this.foundations };
  }
  /**
   * Get observation count
   */
  getObservationCount() {
    return this.observationCount;
  }
  getPractices() {
    return [
      "Practice breath awareness as anchor",
      "Note body sensations throughout the day",
      "Label feelings as pleasant, unpleasant, or neutral",
      "Notice mind states: calm, agitated, contracted, expanded",
      "Observe thoughts arising and passing",
      "Practice formal sitting meditation daily",
      "Bring mindfulness to ordinary activities"
    ];
  }
  getDescription() {
    return `
Right Mindfulness is clear, non-judgmental awareness of present experience.
It is developed through the Four Foundations of Mindfulness.

THE FOUR FOUNDATIONS:

1. BODY (Kayanupassana)
   - Breath awareness
   - Body postures and movements
   - Physical sensations
   - Contemplation of body parts
   - Awareness of impermanence of body

2. FEELINGS (Vedananupassana)
   - Pleasant, unpleasant, neutral
   - Worldly and unworldly feelings
   - Seeing feelings arise and pass

3. MIND (Cittanupassana)
   - Knowing when mind is contracted/expanded
   - Knowing presence of greed, hatred, delusion
   - Knowing when mind is concentrated/scattered

4. PHENOMENA (Dhammanupassana)
   - Five hindrances
   - Five aggregates
   - Sense bases
   - Seven factors of enlightenment
   - Four Noble Truths

KEY QUALITIES:
- Present-moment awareness
- Non-judgmental observation
- Continuity of attention
- Seeing arising and passing
    `.trim();
  }
  getIndicators() {
    return [
      "Quicker recognition of mental and physical states",
      "Less reactivity to pleasant and unpleasant",
      "Increased awareness of subtle body sensations",
      "Ability to observe thoughts without being caught",
      "More presence in daily activities",
      "Clear seeing of impermanence in experience"
    ];
  }
  /**
   * Get the most developed foundation
   */
  getStrongestFoundation() {
    const entries = Object.entries(this.foundations);
    return entries.reduce((max, curr) => curr[1] > max[1] ? curr : max)[0];
  }
};

// src/eightfold-path/meditation/RightConcentration.ts
var RightConcentration = class extends PathFactor {
  name = "Right Concentration";
  sanskritName = "Samyak-sam\u0101dhi";
  category = "meditation";
  position = 8;
  /** Highest jhana attained */
  highestJhana = 0;
  /** Total time in absorption */
  totalAbsorptionTime = 0;
  onPractice(effort) {
    if (effort >= 8 && this._developmentLevel >= 3) {
      this.totalAbsorptionTime += effort;
    }
  }
  /**
   * Attempt to enter concentration
   */
  concentrate(effort, duration) {
    let jhanaReached = 0;
    if (this._developmentLevel >= 3 && effort >= 5) {
      jhanaReached = 1;
    }
    if (this._developmentLevel >= 5 && effort >= 6) {
      jhanaReached = 2;
    }
    if (this._developmentLevel >= 7 && effort >= 7) {
      jhanaReached = 3;
    }
    if (this._developmentLevel >= 9 && effort >= 8) {
      jhanaReached = 4;
    }
    if (jhanaReached > this.highestJhana) {
      this.highestJhana = jhanaReached;
    }
    const factorsPresent = this.getFactorsForJhana(jhanaReached);
    const quality = this.determineQuality(jhanaReached, effort);
    if (quality === "absorption") {
      this.totalAbsorptionTime += duration;
    }
    return {
      jhanaReached,
      factorsPresent,
      duration,
      quality,
      description: this.describeJhana(jhanaReached)
    };
  }
  getFactorsForJhana(level) {
    switch (level) {
      case 1:
        return {
          appliedThought: true,
          sustainedThought: true,
          joy: true,
          happiness: true,
          onePointedness: true,
          equanimity: false
        };
      case 2:
        return {
          appliedThought: false,
          sustainedThought: false,
          joy: true,
          happiness: true,
          onePointedness: true,
          equanimity: false
        };
      case 3:
        return {
          appliedThought: false,
          sustainedThought: false,
          joy: false,
          happiness: true,
          onePointedness: true,
          equanimity: true
        };
      case 4:
        return {
          appliedThought: false,
          sustainedThought: false,
          joy: false,
          happiness: false,
          onePointedness: true,
          equanimity: true
        };
      default:
        return {
          appliedThought: false,
          sustainedThought: false,
          joy: false,
          happiness: false,
          onePointedness: false,
          equanimity: false
        };
    }
  }
  determineQuality(jhana, effort) {
    if (jhana === 0) return "momentary";
    if (effort >= 8) return "absorption";
    return "access";
  }
  describeJhana(level) {
    const descriptions = {
      0: "Mind not yet concentrated. Access concentration developing.",
      1: "First Jhana: Joy and happiness born of seclusion, with applied and sustained thought.",
      2: "Second Jhana: Joy and happiness born of concentration, internal confidence.",
      3: "Third Jhana: Equanimous happiness, mindful and alert.",
      4: "Fourth Jhana: Pure equanimity and mindfulness, neither pleasure nor pain."
    };
    return descriptions[level];
  }
  /**
   * Get highest jhana attained
   */
  getHighestJhana() {
    return this.highestJhana;
  }
  /**
   * Get total absorption time
   */
  getTotalAbsorptionTime() {
    return this.totalAbsorptionTime;
  }
  getPractices() {
    return [
      "Establish a regular sitting meditation practice",
      "Develop access concentration before seeking jhana",
      "Use a single meditation object (breath, kasina, etc.)",
      "Overcome the five hindrances",
      "Learn to recognize jhana factors",
      "Practice with a qualified teacher",
      "Build gradually - do not force concentration"
    ];
  }
  getDescription() {
    return `
Right Concentration is the development of a unified, absorbed mind.
It is the culmination of the meditation training.

THE FOUR JHANAS:

FIRST JHANA
- Factors: Applied thought, sustained thought, joy, happiness, one-pointedness
- Character: Secluded from sense desires and unwholesome states
- Joy and happiness born from seclusion

SECOND JHANA
- Factors: Joy, happiness, one-pointedness
- Character: Thought stills, internal confidence arises
- Joy and happiness born from concentration

THIRD JHANA
- Factors: Happiness, equanimity, one-pointedness
- Character: Joy fades, equanimous and mindful
- Pleasant abiding in equanimity

FOURTH JHANA
- Factors: Equanimity, one-pointedness
- Character: Beyond pleasure and pain
- Pure mindfulness and equanimity

PREREQUISITES:
- Ethical conduct (provides a clear conscience)
- Mindfulness (provides the awareness)
- Right effort (provides the energy)
- Letting go of hindrances
    `.trim();
  }
  getIndicators() {
    return [
      "Mind can settle quickly into meditation",
      "Hindrances arise less frequently",
      "Joy and peace arise naturally in practice",
      "Increased stability and stillness",
      "Less distraction from sense objects",
      "Clear recognition of jhana factors when present"
    ];
  }
};

// src/eightfold-path/EightfoldPath.ts
var EightfoldPath = class {
  // Wisdom factors
  rightView;
  rightIntention;
  // Ethics factors
  rightSpeech;
  rightAction;
  rightLivelihood;
  // Meditation factors
  rightEffort;
  rightMindfulness;
  rightConcentration;
  /** All factors in order */
  allFactors;
  constructor() {
    this.rightView = new RightView();
    this.rightIntention = new RightIntention();
    this.rightSpeech = new RightSpeech();
    this.rightAction = new RightAction();
    this.rightLivelihood = new RightLivelihood();
    this.rightEffort = new RightEffort();
    this.rightMindfulness = new RightMindfulness();
    this.rightConcentration = new RightConcentration();
    this.allFactors = [
      this.rightView,
      this.rightIntention,
      this.rightSpeech,
      this.rightAction,
      this.rightLivelihood,
      this.rightEffort,
      this.rightMindfulness,
      this.rightConcentration
    ];
    this.establishInterdependencies();
  }
  /**
   * Set up the mutual support relationships between factors.
   * Each factor conditions and supports all others.
   */
  establishInterdependencies() {
    this.allFactors.forEach((factor) => {
      this.allFactors.forEach((other) => {
        if (factor !== other) {
          factor.addCondition(other);
        }
      });
    });
  }
  /**
   * Get all factors
   */
  getAllFactors() {
    return [...this.allFactors];
  }
  /**
   * Get factors by category
   */
  getCategory(category) {
    return this.allFactors.filter((f) => f.category === category);
  }
  /**
   * Get overall path development as average of all factors
   */
  getOverallDevelopment() {
    const sum = this.allFactors.reduce((acc, f) => acc + f.developmentLevel, 0);
    return sum / this.allFactors.length;
  }
  /**
   * Get development by category
   */
  getCategoryDevelopment(category) {
    const factors = this.getCategory(category);
    const sum = factors.reduce((acc, f) => acc + f.developmentLevel, 0);
    return sum / factors.length;
  }
  /**
   * Practice all factors of a category
   */
  practiceCategory(category, effort) {
    this.getCategory(category).forEach((factor) => factor.practice(effort));
  }
  /**
   * Practice a specific factor
   */
  practiceFactor(position, effort) {
    const factor = this.allFactors[position - 1];
    if (factor) {
      return factor.practice(effort);
    }
    return null;
  }
  /**
   * Get the weakest developed factor
   */
  getWeakestFactor() {
    return this.allFactors.reduce(
      (min, f) => f.developmentLevel < min.developmentLevel ? f : min
    );
  }
  /**
   * Get the strongest developed factor
   */
  getStrongestFactor() {
    return this.allFactors.reduce(
      (max, f) => f.developmentLevel > max.developmentLevel ? f : max
    );
  }
  /**
   * Check if path is balanced (no factor significantly lagging)
   */
  isBalanced(threshold = 2) {
    const levels = this.allFactors.map((f) => f.developmentLevel);
    const max = Math.max(...levels);
    const min = Math.min(...levels);
    return max - min <= threshold;
  }
  /**
   * Get a comprehensive development summary
   */
  getDevelopmentSummary() {
    return {
      overall: this.getOverallDevelopment(),
      byCategory: {
        wisdom: this.getCategoryDevelopment("wisdom"),
        ethics: this.getCategoryDevelopment("ethics"),
        meditation: this.getCategoryDevelopment("meditation")
      },
      isBalanced: this.isBalanced(),
      weakestFactor: this.getWeakestFactor(),
      strongestFactor: this.getStrongestFactor()
    };
  }
  /**
   * Get a practice recommendation based on current development
   */
  getRecommendation() {
    const weakest = this.getWeakestFactor();
    const isBalanced = this.isBalanced();
    return {
      focusFactor: weakest,
      practices: weakest.getPractices(),
      reason: isBalanced ? "Path is balanced; continue gradual development of all factors" : `${weakest.name} needs attention to maintain balance`,
      overallProgress: this.getOverallDevelopment()
    };
  }
  /**
   * Activate all factors (begin cultivating the entire path)
   */
  activateAll() {
    this.allFactors.forEach((f) => f.activate());
  }
  /**
   * Reset all factors (for simulation purposes)
   */
  resetAll() {
    this.allFactors.forEach((f) => f.reset());
  }
  /**
   * Get a summary description of the path
   */
  getSummary() {
    return `
THE NOBLE EIGHTFOLD PATH

WISDOM (Prajna):
  1. Right View (${this.rightView.developmentLevel}/10)
     Understanding the Four Noble Truths
  2. Right Intention (${this.rightIntention.developmentLevel}/10)
     Thoughts of renunciation, goodwill, harmlessness

ETHICS (Sila):
  3. Right Speech (${this.rightSpeech.developmentLevel}/10)
     Truthful, harmonious, kind, meaningful
  4. Right Action (${this.rightAction.developmentLevel}/10)
     Non-violence, honesty, respect
  5. Right Livelihood (${this.rightLivelihood.developmentLevel}/10)
     Earning a living without causing harm

MEDITATION (Samadhi):
  6. Right Effort (${this.rightEffort.developmentLevel}/10)
     Cultivating wholesome, abandoning unwholesome
  7. Right Mindfulness (${this.rightMindfulness.developmentLevel}/10)
     Clear awareness of body, feelings, mind, phenomena
  8. Right Concentration (${this.rightConcentration.developmentLevel}/10)
     Developing unified, absorbed mind

Overall Development: ${this.getOverallDevelopment().toFixed(1)}/10
Balance: ${this.isBalanced() ? "Balanced" : "Needs attention"}
    `.trim();
  }
  /**
   * Explain the threefold training
   */
  explainThreefoldTraining() {
    return `
THE THREEFOLD TRAINING

The Eightfold Path is organized into three trainings (tisikkha):

1. SILA (Ethics)
   - Right Speech, Right Action, Right Livelihood
   - Creates the foundation of a clear conscience
   - Reduces remorse and agitation
   - Makes the mind suitable for concentration

2. SAMADHI (Concentration)
   - Right Effort, Right Mindfulness, Right Concentration
   - Develops calm and clarity
   - Stabilizes attention
   - Prepares the mind for insight

3. PRAJNA (Wisdom)
   - Right View, Right Intention
   - Understanding of reality as it is
   - Liberating insight
   - The goal and fruition of the path

These trainings support each other:
- Ethics creates conditions for concentration
- Concentration creates conditions for wisdom
- Wisdom refines ethics and concentration

The path is not linear but spiral - each training deepens the others.
    `.trim();
  }
};

// src/dependent-origination/Nidana.ts
var Nidana = class extends Phenomenon {
  /** Reference to the next link in the chain */
  nextLink;
  /** Reference to the previous link in the chain */
  previousLink;
  /** Whether this link has been broken */
  _isBroken = false;
  /**
   * Connect this link to the next in the chain
   */
  setNextLink(link) {
    this.nextLink = link;
    link.previousLink = this;
    link.addCondition(this);
  }
  /**
   * Get the next link
   */
  getNextLink() {
    return this.nextLink;
  }
  /**
   * Get the previous link
   */
  getPreviousLink() {
    return this.previousLink;
  }
  /**
   * A broken link cannot arise: "when this does not exist, that does not come to be."
   */
  arise() {
    if (this._isBroken) return false;
    return super.arise();
  }
  /**
   * When this link arises, it conditions the next
   */
  onArise() {
    if (this.nextLink && !this.nextLink.hasArisen && !this._isBroken) {
      this.nextLink.arise();
    }
  }
  /**
   * "With the cessation of this, that ceases" — cessation cascades forward.
   */
  onCease() {
    if (this.nextLink && this.nextLink.isPresent) {
      this.nextLink.cease();
    }
  }
  /**
   * Breaking this link stops the chain: an arisen link ceases (cascading
   * forward); an un-arisen link is blocked from ever arising.
   */
  breakLink() {
    if (this._isBroken) return false;
    this._isBroken = true;
    if (this.isPresent) {
      this.cease();
    }
    return true;
  }
  /**
   * Check if the link is broken
   */
  get isBroken() {
    return this._isBroken;
  }
  /**
   * Restore the link (for simulation reset)
   */
  restoreLink() {
    this._isBroken = false;
    this._hasArisen = false;
    this._hasCeased = false;
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: `${this.name} is a link in the chain of causation that leads to suffering`,
      usefulFor: [
        "Understanding how suffering arises",
        "Identifying points for intervention",
        "Developing insight into conditionality"
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: `${this.name} is empty of inherent existence, arising only when conditions are present`,
      transcends: [
        "Belief in uncaused existence",
        "Eternal self that persists through links",
        "Nihilism that denies causal process"
      ]
    };
  }
};

// src/dependent-origination/links/Avidya.ts
var Avidya = class extends Nidana {
  name = "Avidya";
  sanskritName = "Avidy\u0101";
  position = 1;
  temporalSpan = "past";
  constructor() {
    super();
    this._hasArisen = true;
  }
  getExplanation() {
    return {
      name: this.name,
      meaning: "Fundamental ignorance - not seeing reality as it truly is. Ignorance of the Four Noble Truths, of impermanence, suffering, and not-self.",
      conditionedBy: "The asavas (mental fermentations/taints)",
      conditions: "Sankhara (volitional formations)",
      howToBreak: "Develop wisdom (prajna) through study, reflection, and meditation. Direct insight into the Three Marks dissolves ignorance."
    };
  }
  /**
   * Check what aspects of ignorance are present
   */
  getIgnoranceAspects() {
    return [
      "Not seeing impermanence (anicca)",
      "Not seeing suffering (dukkha)",
      "Not seeing not-self (anatta)",
      "Not understanding the Four Noble Truths",
      "Belief in a permanent, unchanging self",
      "Confusion about cause and effect"
    ];
  }
  /**
   * What dispels ignorance
   */
  getAntidotes() {
    return [
      "Right View - understanding the Four Noble Truths",
      "Contemplation of impermanence",
      "Investigation of the self",
      "Direct insight through meditation",
      "Learning from wise teachers",
      "Reflection on dependent origination itself"
    ];
  }
};

// src/dependent-origination/links/Samskara.ts
var Samskara = class extends Nidana {
  name = "Samskara";
  sanskritName = "Sa\u1E43sk\u0101ra";
  position = 2;
  temporalSpan = "past";
  formations = [];
  getExplanation() {
    return {
      name: this.name,
      meaning: "Volitional formations - intentional actions of body, speech, and mind that create karmic imprints and shape future experience.",
      conditionedBy: "Avidya (ignorance)",
      conditions: "Vijnana (consciousness)",
      howToBreak: "With the cessation of ignorance, volitional formations cease. Actions done with wisdom do not create binding karma."
    };
  }
  /**
   * Add a formation (intentional action)
   */
  addFormation(formation) {
    this.formations.push(formation);
  }
  /**
   * Get all formations
   */
  getFormations() {
    return [...this.formations];
  }
  /**
   * Get formations by type
   */
  getFormationsByType(type) {
    return this.formations.filter((f) => f.type === type);
  }
  /**
   * Get formations by quality
   */
  getFormationsByQuality(quality) {
    return this.formations.filter((f) => f.quality === quality);
  }
  /**
   * Types of formations
   */
  static getFormationTypes() {
    return [
      "Bodily formations (kaya-sankhara) - physical actions",
      "Verbal formations (vaci-sankhara) - speech",
      "Mental formations (citta-sankhara) - thoughts and intentions"
    ];
  }
};

// src/dependent-origination/links/Vijnana.ts
var Vijnana = class extends Nidana {
  name = "Vijnana";
  sanskritName = "Vij\xF1\u0101na";
  position = 3;
  temporalSpan = "present";
  activeConsciousness = /* @__PURE__ */ new Set();
  getExplanation() {
    return {
      name: this.name,
      meaning: "Consciousness - the basic knowing quality that cognizes objects. Arises in six types corresponding to the six sense bases.",
      conditionedBy: "Samskara (volitional formations)",
      conditions: "Nama-rupa (mind and body)",
      howToBreak: "When volitional formations cease, rebirth consciousness does not arise. In meditation, watching consciousness arise and pass without identification."
    };
  }
  /**
   * Activate a type of consciousness
   */
  activateConsciousness(type) {
    this.activeConsciousness.add(type);
  }
  /**
   * Deactivate a type of consciousness
   */
  deactivateConsciousness(type) {
    this.activeConsciousness.delete(type);
  }
  /**
   * Check if a consciousness type is active
   */
  isConsciousnessActive(type) {
    return this.activeConsciousness.has(type);
  }
  /**
   * Get all active consciousness types
   */
  getActiveConsciousness() {
    return Array.from(this.activeConsciousness);
  }
  /**
   * Get all six types
   */
  static getSixConsciousnessTypes() {
    return [
      "Eye consciousness - seeing",
      "Ear consciousness - hearing",
      "Nose consciousness - smelling",
      "Tongue consciousness - tasting",
      "Body consciousness - touching",
      "Mind consciousness - thinking"
    ];
  }
};

// src/dependent-origination/links/NamaRupa.ts
var NamaRupa = class extends Nidana {
  name = "Nama-Rupa";
  sanskritName = "N\u0101ma-r\u016Bpa";
  position = 4;
  temporalSpan = "present";
  nama = {
    feeling: false,
    perception: false,
    intention: false,
    contact: false,
    attention: false
  };
  rupa = {
    earth: false,
    water: false,
    fire: false,
    air: false
  };
  onArise() {
    this.nama = {
      feeling: true,
      perception: true,
      intention: true,
      contact: true,
      attention: true
    };
    this.rupa = {
      earth: true,
      water: true,
      fire: true,
      air: true
    };
    super.onArise();
  }
  getExplanation() {
    return {
      name: this.name,
      meaning: "Mind and body - the psychophysical organism. Nama (mind) includes feeling, perception, intention, contact, attention. Rupa (body) is the physical form.",
      conditionedBy: "Vijnana (consciousness)",
      conditions: "Salayatana (six sense bases)",
      howToBreak: "When consciousness does not descend into the womb, mind-body does not arise. Contemplate the constructed nature of the psychophysical process."
    };
  }
  /**
   * Get nama components
   */
  getNama() {
    return { ...this.nama };
  }
  /**
   * Get rupa components
   */
  getRupa() {
    return { ...this.rupa };
  }
  /**
   * Explanation of nama
   */
  static explainNama() {
    return [
      "Vedana (feeling) - pleasant, unpleasant, neutral",
      "Sanna (perception) - recognition, labeling",
      "Cetana (intention) - volitional aspect",
      "Phassa (contact) - meeting of sense, object, consciousness",
      "Manasikara (attention) - directing awareness"
    ];
  }
  /**
   * Explanation of rupa
   */
  static explainRupa() {
    return [
      "Earth element (pathavi) - solidity, hardness",
      "Water element (apo) - cohesion, fluidity",
      "Fire element (tejo) - temperature, heat",
      "Air element (vayo) - movement, motion"
    ];
  }
};

// src/dependent-origination/links/Salayatana.ts
var Salayatana = class extends Nidana {
  name = "Salayatana";
  sanskritName = "\u1E62a\u1E0D\u0101yatana";
  position = 5;
  temporalSpan = "present";
  senseBases = /* @__PURE__ */ new Map([
    ["eye", { base: "eye", isActive: false, isGuarded: false }],
    ["ear", { base: "ear", isActive: false, isGuarded: false }],
    ["nose", { base: "nose", isActive: false, isGuarded: false }],
    ["tongue", { base: "tongue", isActive: false, isGuarded: false }],
    ["body", { base: "body", isActive: false, isGuarded: false }],
    ["mind", { base: "mind", isActive: false, isGuarded: false }]
  ]);
  onArise() {
    this.senseBases.forEach((state, base) => {
      this.senseBases.set(base, { ...state, isActive: true });
    });
    super.onArise();
  }
  getExplanation() {
    return {
      name: this.name,
      meaning: "The six sense bases - the organs/faculties through which contact with objects occurs: eye, ear, nose, tongue, body, and mind.",
      conditionedBy: "Nama-rupa (mind and body)",
      conditions: "Phassa (contact)",
      howToBreak: "Practice sense restraint (indriya-samvara). Guard the sense doors with mindfulness. Without mind-body, sense bases do not function."
    };
  }
  /**
   * Guard a sense door (practice mindfulness)
   */
  guardSenseDoor(base) {
    const state = this.senseBases.get(base);
    if (state) {
      this.senseBases.set(base, { ...state, isGuarded: true });
    }
  }
  /**
   * Unguard a sense door
   */
  unguardSenseDoor(base) {
    const state = this.senseBases.get(base);
    if (state) {
      this.senseBases.set(base, { ...state, isGuarded: false });
    }
  }
  /**
   * Check if a sense base is guarded
   */
  isSenseGuarded(base) {
    return this.senseBases.get(base)?.isGuarded ?? false;
  }
  /**
   * Get all sense base states
   */
  getSenseBaseStates() {
    return Array.from(this.senseBases.values());
  }
  /**
   * Get unguarded senses (potential for craving)
   */
  getUnguardedSenses() {
    return Array.from(this.senseBases.entries()).filter(([_, state]) => state.isActive && !state.isGuarded).map(([base]) => base);
  }
  /**
   * Explanation of internal and external bases
   */
  static explainBases() {
    return `
INTERNAL BASES (Organs/Faculties):
- Eye (cakkhu) - visual faculty
- Ear (sota) - auditory faculty
- Nose (ghana) - olfactory faculty
- Tongue (jivha) - gustatory faculty
- Body (kaya) - tactile faculty
- Mind (mano) - mental faculty

EXTERNAL BASES (Objects):
- Forms (rupa) - visible objects
- Sounds (sadda) - audible objects
- Smells (gandha) - olfactory objects
- Tastes (rasa) - gustatory objects
- Touches (photthabba) - tactile objects
- Mental objects (dhamma) - thoughts, ideas
    `.trim();
  }
};

// src/dependent-origination/links/Sparsa.ts
var Sparsa = class extends Nidana {
  name = "Sparsa";
  sanskritName = "Spar\u015Ba";
  position = 6;
  temporalSpan = "present";
  contactEvents = [];
  getExplanation() {
    return {
      name: this.name,
      meaning: "Contact - the meeting of sense organ, sense object, and consciousness. This conjunction is the basis for feeling to arise.",
      conditionedBy: "Salayatana (six sense bases)",
      conditions: "Vedana (feeling)",
      howToBreak: "Mindful contact - when contact occurs with awareness, the automatic progression to craving can be interrupted."
    };
  }
  /**
   * Register a contact event
   */
  makeContact(senseBase, object) {
    const event = {
      senseBase,
      object,
      consciousness: true,
      timestamp: Date.now()
    };
    this.contactEvents.push(event);
    return event;
  }
  /**
   * Get recent contact events
   */
  getRecentContacts(count = 10) {
    return this.contactEvents.slice(-count);
  }
  /**
   * Get contacts by sense base
   */
  getContactsBySense(base) {
    return this.contactEvents.filter((e) => e.senseBase === base);
  }
  /**
   * Clear contact history
   */
  clearContacts() {
    this.contactEvents = [];
  }
  /**
   * Explain the nature of contact
   */
  static explainContact() {
    return `
CONTACT (Phassa/Sparsa)

Contact is the conjunction of three factors:
1. Sense organ (e.g., eye)
2. Sense object (e.g., visible form)
3. Consciousness (e.g., eye consciousness)

When these three meet, contact occurs.
Contact is not passive - it is the active "touching" of experience.

Contact immediately gives rise to feeling (vedana).
This is automatic and cannot be prevented.

What CAN be done:
- Bring mindfulness to the moment of contact
- Observe the contact without proliferation
- See the conditioned nature of contact

"With the arising of the sense bases, contact arises.
With the arising of contact, feeling arises."
    `.trim();
  }
};

// src/dependent-origination/links/Vedana.ts
var Vedana = class extends Nidana {
  name = "Vedana";
  sanskritName = "Vedan\u0101";
  position = 7;
  temporalSpan = "present";
  feelings = [];
  currentFeeling = null;
  getExplanation() {
    return {
      name: this.name,
      meaning: "Feeling - the hedonic quality of experience (pleasant, unpleasant, or neutral). Not emotion, but the basic tone that colors all experience.",
      conditionedBy: "Sparsa (contact)",
      conditions: "Tanha (craving)",
      howToBreak: "THE LIBERATION POINT: Feeling cannot be prevented, but the reaction to feeling (craving) can. With mindfulness, observe feeling without reacting."
    };
  }
  /**
   * Experience a feeling
   */
  feel(tone, source, intensity) {
    const event = {
      tone,
      source,
      intensity: Math.min(10, Math.max(1, intensity)),
      timestamp: Date.now()
    };
    this.feelings.push(event);
    this.currentFeeling = event;
    return event;
  }
  /**
   * Get current feeling
   */
  getCurrentFeeling() {
    return this.currentFeeling;
  }
  /**
   * Get feeling history
   */
  getFeelingHistory(count = 10) {
    return this.feelings.slice(-count);
  }
  /**
   * Get feelings by tone
   */
  getFeelingsByTone(tone) {
    return this.feelings.filter((f) => f.tone === tone);
  }
  /**
   * Clear the current feeling (it passes)
   */
  clearCurrentFeeling() {
    this.currentFeeling = null;
  }
  /**
   * Get statistics on feelings
   */
  getFeelingStats() {
    const stats = { pleasant: 0, unpleasant: 0, neutral: 0 };
    this.feelings.forEach((f) => stats[f.tone]++);
    return stats;
  }
  /**
   * Explain feeling and the liberation point
   */
  static explainLiberationPoint() {
    return `
VEDANA AND THE LIBERATION POINT

Feeling (vedana) is the hedonic tone of experience:
- PLEASANT (sukha) - we tend to crave more
- UNPLEASANT (dukkha) - we tend to crave escape
- NEUTRAL (adukkhamasukha) - we tend to ignore/be confused

The automatic pattern:
Contact \u2192 Feeling \u2192 Craving \u2192 Clinging \u2192 Suffering

THE CRUCIAL INSIGHT:
Feeling arises automatically from contact.
But CRAVING does not have to follow feeling.

With mindfulness we can:
1. Recognize the feeling as it arises
2. Note its tone (pleasant/unpleasant/neutral)
3. Observe without reacting
4. See it pass away

This interrupts the chain.
"Feeling is felt, but not identified with."

This is why mindfulness of feeling (vedananupassana)
is one of the Four Foundations of Mindfulness.
    `.trim();
  }
};

// src/dependent-origination/links/Tanha.ts
var Tanha = class extends Nidana {
  name = "Tanha";
  sanskritName = "T\u1E5B\u1E63\u1E47\u0101";
  position = 8;
  temporalSpan = "present";
  cravings = [];
  currentCraving = null;
  getExplanation() {
    return {
      name: this.name,
      meaning: "Craving/Thirst - the driving force that perpetuates suffering. Three types: craving for pleasure, for becoming, and for non-existence.",
      conditionedBy: "Vedana (feeling)",
      conditions: "Upadana (clinging)",
      howToBreak: "THE KEY INTERVENTION POINT: When feeling arises, do not react with craving. Observe with equanimity. This is the essence of the practice."
    };
  }
  /**
   * A craving arises
   */
  crave(type, trigger, object, intensity) {
    const event = {
      type,
      trigger,
      object,
      intensity,
      timestamp: Date.now()
    };
    this.cravings.push(event);
    this.currentCraving = event;
    return event;
  }
  /**
   * Get current craving
   */
  getCurrentCraving() {
    return this.currentCraving;
  }
  /**
   * Let go of current craving (practice working!)
   */
  letGo() {
    if (this.currentCraving) {
      this.currentCraving = null;
      return true;
    }
    return false;
  }
  /**
   * Get craving history
   */
  getCravingHistory(count = 10) {
    return this.cravings.slice(-count);
  }
  /**
   * Get cravings by type
   */
  getCravingsByType(type) {
    return this.cravings.filter((c) => c.type === type);
  }
  /**
   * Check if there's active craving
   */
  hasCraving() {
    return this.currentCraving !== null;
  }
  /**
   * Get statistics
   */
  getCravingStats() {
    const stats = {
      sensory: 0,
      becoming: 0,
      "non-becoming": 0
    };
    this.cravings.forEach((c) => stats[c.type]++);
    return stats;
  }
  /**
   * Explain the three types of craving
   */
  static explainCravingTypes() {
    return `
THE THREE TYPES OF CRAVING (Tanha)

1. KAMA-TANHA (Sensory Craving)
   - Craving for pleasant sense experiences
   - Wanting to see, hear, smell, taste, touch pleasant things
   - The most obvious form of craving
   - Response to PLEASANT feelings

2. BHAVA-TANHA (Craving for Becoming)
   - Craving to be something, become someone
   - Wanting existence, identity, achievement
   - The drive for self-construction
   - Often subtle and socially valued

3. VIBHAVA-TANHA (Craving for Non-Existence)
   - Craving to not be, to escape, to disappear
   - Aversion, wanting to get rid of
   - Response to UNPLEASANT feelings
   - Can manifest as self-destructive impulses

ALL THREE perpetuate suffering.
ALL THREE can be abandoned through practice.
    `.trim();
  }
};

// src/dependent-origination/links/Upadana.ts
var Upadana = class extends Nidana {
  name = "Upadana";
  sanskritName = "Up\u0101d\u0101na";
  position = 9;
  temporalSpan = "present";
  attachments = [];
  getExplanation() {
    return {
      name: this.name,
      meaning: "Clinging/Grasping - intensified craving that holds tightly. Four types: clinging to pleasures, views, practices, and self-doctrine.",
      conditionedBy: "Tanha (craving)",
      conditions: "Bhava (becoming)",
      howToBreak: "When craving ceases, clinging ceases. Practice non-attachment through seeing the impermanent, unsatisfactory, not-self nature of objects."
    };
  }
  /**
   * Cling to something
   */
  clingTo(type, object, intensity) {
    const event = {
      type,
      object,
      intensity,
      timestamp: Date.now()
    };
    this.attachments.push(event);
    return event;
  }
  /**
   * Get all attachments
   */
  getAttachments() {
    return [...this.attachments];
  }
  /**
   * Get attachments by type
   */
  getAttachmentsByType(type) {
    return this.attachments.filter((a) => a.type === type);
  }
  /**
   * Release an attachment
   */
  release(object) {
    const index = this.attachments.findIndex((a) => a.object === object);
    if (index > -1) {
      this.attachments.splice(index, 1);
      return true;
    }
    return false;
  }
  /**
   * Get statistics
   */
  getClingingStats() {
    const stats = {
      sensory: 0,
      views: 0,
      practices: 0,
      self: 0
    };
    this.attachments.forEach((a) => stats[a.type]++);
    return stats;
  }
  /**
   * Explain the four types of clinging
   */
  static explainClingingTypes() {
    return `
THE FOUR TYPES OF CLINGING (Upadana)

1. KAMUPADANA (Clinging to Sense Pleasures)
   - Attachment to pleasant experiences
   - Holding onto pleasurable objects
   - The most common form of clinging

2. DITTHUPADANA (Clinging to Views)
   - Attachment to opinions and beliefs
   - Rigid adherence to philosophical positions
   - Even clinging to "correct" views is problematic

3. SILABBATUPADANA (Clinging to Practices/Rituals)
   - Attachment to rites and rituals as ends in themselves
   - Believing practices alone lead to liberation
   - Mechanical observance without understanding

4. ATTAVADUPADANA (Clinging to Self-Doctrine)
   - Attachment to belief in a permanent self
   - Identifying with body, feelings, perceptions, etc.
   - The most fundamental form of clinging

This last type is the root of the others.
When the illusion of self is seen through,
all clinging naturally relaxes.
    `.trim();
  }
};

// src/dependent-origination/links/Bhava.ts
var Bhava = class extends Nidana {
  name = "Bhava";
  sanskritName = "Bhava";
  position = 10;
  temporalSpan = "present";
  becomingProcesses = [];
  currentMomentum = 0;
  getExplanation() {
    return {
      name: this.name,
      meaning: "Becoming - the process of existence being created through clinging. The karmic momentum that propels us toward birth.",
      conditionedBy: "Upadana (clinging)",
      conditions: "Jati (birth)",
      howToBreak: "When clinging ceases, becoming ceases. Without fuel (upadana), the fire of becoming goes out."
    };
  }
  /**
   * Add a becoming process
   */
  addBecoming(realm, quality, momentum, description) {
    const process2 = {
      realm,
      quality,
      momentum: Math.min(10, Math.max(1, momentum)),
      description
    };
    this.becomingProcesses.push(process2);
    this.currentMomentum += process2.momentum;
    return process2;
  }
  /**
   * Get current karmic momentum
   */
  getMomentum() {
    return this.currentMomentum;
  }
  /**
   * Get all becoming processes
   */
  getProcesses() {
    return [...this.becomingProcesses];
  }
  /**
   * Get processes by realm
   */
  getProcessesByRealm(realm) {
    return this.becomingProcesses.filter((p) => p.realm === realm);
  }
  /**
   * Reduce momentum (through practice)
   */
  reduceMomentum(amount) {
    this.currentMomentum = Math.max(0, this.currentMomentum - amount);
  }
  /**
   * Explain the three realms
   */
  static explainRealms() {
    return `
THE THREE REALMS OF BECOMING (Bhava)

1. KAMA-BHAVA (Sensory Realm)
   - Existence dominated by sense desires
   - Includes humans, animals, hungry ghosts, hell beings
   - Also lower celestial realms
   - Most beings exist here

2. RUPA-BHAVA (Form Realm)
   - Existence with subtle form but no sense desires
   - Attained through jhana practice
   - Celestial realms of form
   - Still impermanent

3. ARUPA-BHAVA (Formless Realm)
   - Existence without any form
   - Attained through formless absorptions
   - Highest celestial realms
   - Still within samsara, still impermanent

ALL THREE REALMS are within conditioned existence.
ALL THREE involve suffering.
Liberation transcends all realms of becoming.
    `.trim();
  }
  /**
   * Explain the two aspects of bhava
   */
  static explainTwoAspects() {
    return `
TWO ASPECTS OF BHAVA:

1. KAMMA-BHAVA (Karmic Becoming)
   - The active process of creating karma
   - Intentions and volitions that shape future
   - The "doing" aspect of becoming

2. UPAPATTI-BHAVA (Resultant Becoming)
   - The passive process of receiving results
   - Being born into certain conditions
   - The "receiving" aspect of becoming

Together they form the cycle:
Actions \u2192 Results \u2192 Conditions for more actions
    `.trim();
  }
};

// src/dependent-origination/links/Jati.ts
var Jati = class extends Nidana {
  name = "Jati";
  sanskritName = "J\u0101ti";
  position = 11;
  temporalSpan = "future";
  births = [];
  getExplanation() {
    return {
      name: this.name,
      meaning: "Birth - the arising of the aggregates, the appearance of a being in a realm of existence. Entry into a new life.",
      conditionedBy: "Bhava (becoming)",
      conditions: "Jaramarana (aging and death)",
      howToBreak: "When becoming ceases, birth does not occur. No fuel, no fire. No karma, no rebirth. This is the goal."
    };
  }
  /**
   * Record a birth
   */
  recordBirth(realm, conditions) {
    const event = {
      realm,
      aggregatesArisen: true,
      timestamp: Date.now(),
      conditions
    };
    this.births.push(event);
    return event;
  }
  /**
   * Get birth history
   */
  getBirths() {
    return [...this.births];
  }
  /**
   * Get last birth
   */
  getLastBirth() {
    return this.births[this.births.length - 1];
  }
  /**
   * What arises with birth
   */
  static whatArisesWithBirth() {
    return [
      "The five aggregates (skandhas)",
      "The six sense bases",
      "Contact, feeling, perception",
      "A body subject to aging",
      "Susceptibility to illness",
      "Inevitability of death",
      "Association with the disliked",
      "Separation from the liked",
      "Not getting what one wants"
    ];
  }
  /**
   * Explain birth in dependent origination
   */
  static explainBirth() {
    return `
BIRTH (Jati) IN DEPENDENT ORIGINATION

Birth is not just physical birth.
It is the arising of the aggregates -
the manifestation of a "being" in any realm.

In the moment-to-moment sense:
- Each moment, a "self" is born
- Identification with experience arises
- The sense of "I" crystallizes around phenomena

In the life-to-life sense:
- Conditioned by karma (bhava)
- Consciousness descends into a new existence
- A new set of aggregates arises

Birth is not the beginning of suffering -
it is the continuation.
The chain that brought us here
extends back without discernible beginning.

The goal: No more birth.
"This is my last birth.
There will be no more becoming."
    `.trim();
  }
};

// src/dependent-origination/links/Jaramarana.ts
var Jaramarana = class extends Nidana {
  name = "Jaramarana";
  sanskritName = "Jar\u0101mara\u1E47a";
  position = 12;
  temporalSpan = "future";
  manifestations = {
    aging: false,
    death: false,
    sorrow: false,
    lamentation: false,
    pain: false,
    grief: false,
    despair: false
  };
  onArise() {
    this.manifestations = {
      aging: true,
      death: true,
      sorrow: true,
      lamentation: true,
      pain: true,
      grief: true,
      despair: true
    };
  }
  getExplanation() {
    return {
      name: this.name,
      meaning: "Aging and death - the inevitable result of birth. Also includes sorrow, lamentation, pain, grief, and despair. The culmination of suffering.",
      conditionedBy: "Jati (birth)",
      conditions: "Nothing - this is the end. But the cycle continues with fresh ignorance...",
      howToBreak: "When birth does not occur, neither does aging and death. End the cycle at its root."
    };
  }
  /**
   * Get current manifestations
   */
  getManifestations() {
    return { ...this.manifestations };
  }
  /**
   * Check if specific manifestation is present
   */
  hasManifested(type) {
    return this.manifestations[type];
  }
  /**
   * Get all active manifestations
   */
  getActiveManifestations() {
    return Object.entries(this.manifestations).filter(([_, active]) => active).map(([name]) => name);
  }
  /**
   * The complete suffering formula
   */
  static getCompleteSufferingFormula() {
    return `
THE COMPLETE MASS OF SUFFERING

With birth as condition, there arise:
- JARA (Aging) - the decay of faculties, weakening
- MARANA (Death) - the ending of the life faculty
- SOKA (Sorrow) - inner grief and dejection
- PARIDEVA (Lamentation) - vocal expression of grief
- DUKKHA (Pain) - bodily suffering
- DOMANASSA (Grief) - mental suffering
- UPAYASA (Despair) - utter hopelessness

"Thus is the origin of this whole mass of suffering."

This is the First Noble Truth in full detail.
This is what the Buddha saw under the Bodhi tree.
This is what motivates the path to liberation.
    `.trim();
  }
  /**
   * Explain the circularity of the chain
   */
  static explainCircularity() {
    return `
THE CIRCLE OF DEPENDENT ORIGINATION

The chain does not end with aging and death.
Fueled by ignorance, it continues:

Aging/Death \u2192 (in the dying moment) \u2192
\u2192 Ignorance (not seeing things as they are) \u2192
\u2192 Formations (new karmic impulses) \u2192
\u2192 Consciousness (descending into new existence) \u2192
\u2192 ... the cycle continues ...

This is SAMSARA - the wheel of existence.
Round and round, beginningless.

THE WAY OUT:
Break the chain at any point.
Most effectively at Craving (link 8).
When craving ceases, clinging ceases.
When clinging ceases, becoming ceases.
When becoming ceases, birth ceases.
When birth ceases, aging and death cease.

"Thus is the cessation of this whole mass of suffering."
    `.trim();
  }
};

// src/dependent-origination/DependentOrigination.ts
var DependentOrigination = class {
  /** All 12 links in order */
  links;
  // Individual link references
  ignorance;
  formations;
  consciousness;
  mindBody;
  sixSenses;
  contact;
  feeling;
  craving;
  clinging;
  becoming;
  birth;
  agingDeath;
  constructor() {
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
    this.establishChain();
  }
  /**
   * Establish the causal chain between links
   */
  establishChain() {
    for (let i = 0; i < this.links.length - 1; i++) {
      this.links[i].setNextLink(this.links[i + 1]);
    }
  }
  /**
   * Simulate the arising of the entire chain from ignorance
   * Returns events as the chain unfolds
   */
  *simulateArisingSequence() {
    for (const link of this.links) {
      if (link.arise()) {
        yield {
          link,
          event: "arose",
          explanation: link.getExplanation()
        };
      }
    }
  }
  /**
   * Run the full arising sequence and return all events
   */
  runFullSequence() {
    return Array.from(this.simulateArisingSequence());
  }
  /**
   * Break the chain at a specific link (practicing cessation)
   */
  breakChainAt(linkPosition) {
    if (linkPosition < 1 || linkPosition > 12) {
      return { success: false, reason: "Invalid link position (must be 1-12)" };
    }
    const link = this.links[linkPosition - 1];
    const broken = link.breakLink();
    return {
      success: broken,
      brokenAt: link.name,
      reason: broken ? `Chain broken at ${link.name}. Subsequent links will not arise.` : `Could not break chain at ${link.name}`
    };
  }
  /**
   * The traditional liberation point: between feeling and craving
   * This is where mindfulness can intervene
   */
  practiceAtLiberationPoint() {
    if (this.feeling.hasArisen && !this.craving.hasArisen) {
      return "Mindfulness present: Observing feeling without reacting with craving. This is the liberation point!";
    }
    if (!this.feeling.hasArisen) {
      return "Feeling has not yet arisen. Contact must occur first.";
    }
    if (this.craving.hasArisen) {
      return "Craving has already arisen - this opportunity passed. Wait for next contact.";
    }
    return "Unknown state";
  }
  /**
   * Get a link by position (1-12)
   */
  getLink(position) {
    return this.links[position - 1];
  }
  /**
   * Get a link by name
   */
  getLinkByName(name) {
    return this.links.find((l) => l.name.toLowerCase() === name.toLowerCase());
  }
  /**
   * Get the current state of all links
   */
  getChainState() {
    return this.links.map((link, i) => ({
      position: i + 1,
      name: link.name,
      hasArisen: link.hasArisen,
      isBroken: link.isBroken
    }));
  }
  /**
   * Reset the entire chain (for simulation purposes)
   */
  reset() {
    this.links.forEach((link) => link.restoreLink());
    this.ignorance._hasArisen = true;
  }
  /**
   * Get the forward (arising) formula
   */
  getArisingFormula() {
    return this.links.map(
      (l, i) => i < this.links.length - 1 ? `${l.sanskritName} \u2192 ` : l.sanskritName
    ).join("");
  }
  /**
   * Get the reverse (cessation) formula
   */
  getCessationFormula() {
    return [...this.links].reverse().map(
      (l, i) => i < this.links.length - 1 ? `cessation of ${l.sanskritName} \u2192 ` : `cessation of ${l.sanskritName}`
    ).join("");
  }
  /**
   * Get explanations for all links
   */
  getAllExplanations() {
    return this.links.map((l) => l.getExplanation());
  }
  /**
   * Get a summary of dependent origination
   */
  getSummary() {
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
8. Tanha (Craving) - Thirst for more \u2190 LIBERATION POINT
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
};

// src/four-noble-truths/Dukkha.ts
var Dukkha = class extends Phenomenon {
  name = "Dukkha";
  sanskritName = "Du\u1E25kha";
  /** The three types of dukkha and whether they're recognized */
  recognizedTypes = /* @__PURE__ */ new Set();
  /**
   * Analyze types of suffering present in a situation
   */
  analyze(sufferingTypes) {
    const present = new Set(sufferingTypes);
    sufferingTypes.forEach((type) => this.recognizedTypes.add(type));
    return {
      obviousSuffering: present.has("dukkha-dukkha"),
      sufferingOfChange: present.has("viparinama-dukkha"),
      existentialUnsatisfactoriness: present.has("sankhara-dukkha"),
      totalTypes: present.size,
      insight: this.generateInsight(present)
    };
  }
  /**
   * Generate insight based on recognized suffering types
   */
  generateInsight(types) {
    if (types.has("sankhara-dukkha")) {
      return "Deep insight: Recognizing the unsatisfactoriness inherent in all conditioned phenomena. This is the foundation for liberation.";
    }
    if (types.has("viparinama-dukkha")) {
      return "Growing insight: Seeing how change brings suffering even to pleasant experiences. Nothing stable can be found.";
    }
    if (types.has("dukkha-dukkha")) {
      return "Initial insight: Recognizing obvious forms of suffering. This acknowledgment is the first step on the path.";
    }
    return "No suffering types analyzed yet.";
  }
  /**
   * Get examples of each type of suffering
   */
  getExamples() {
    return {
      "dukkha-dukkha": [
        "Physical pain and illness",
        "Grief and loss",
        "Fear and anxiety",
        "Not getting what we want"
      ],
      "viparinama-dukkha": [
        "Pleasant experiences ending",
        "Youth fading into old age",
        "Relationships changing",
        "Success turning to failure"
      ],
      "sankhara-dukkha": [
        "The inherent instability of all conditioned things",
        "The burden of maintaining a sense of self",
        "The endless cycle of wanting and becoming",
        "The impossibility of permanent satisfaction"
      ]
    };
  }
  /**
   * The task associated with this truth
   */
  getTask() {
    return "To be fully understood (pari\xF1\xF1eyya)";
  }
  /**
   * Check if all three types have been recognized
   */
  isFullyUnderstood() {
    return this.recognizedTypes.size === 3;
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: "Life contains suffering, pain, and dissatisfaction that we all experience",
      usefulFor: [
        "Motivation to practice the path",
        "Understanding the human condition",
        "Developing compassion for all beings",
        "Honest assessment of experience"
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: "All conditioned phenomena are marked by unsatisfactoriness due to impermanence and lack of inherent self",
      transcends: [
        "Naive optimism that ignores suffering",
        "Nihilistic pessimism that sees only suffering",
        "Denial and avoidance of suffering",
        'Identification with suffering as "my" suffering'
      ]
    };
  }
};

// src/four-noble-truths/Samudaya.ts
var Samudaya = class extends Phenomenon {
  name = "Samudaya";
  sanskritName = "Samudaya";
  /**
   * Analyze the causes present in a situation
   */
  analyze(cravings, intensity = 5) {
    const rootCauses = this.identifyRoots(cravings);
    const primaryDriver = cravings.length > 0 ? cravings[0] : null;
    return {
      cravingsPresent: cravings,
      rootCauses,
      intensity: Math.min(10, Math.max(0, intensity)),
      primaryDriver,
      recommendation: this.generateRecommendation(cravings, intensity)
    };
  }
  /**
   * Identify which root poisons are active
   */
  identifyRoots(cravings) {
    const roots = /* @__PURE__ */ new Set();
    if (cravings.length > 0) {
      roots.add("delusion");
    }
    if (cravings.includes("sensory")) {
      roots.add("greed");
    }
    if (cravings.includes("becoming")) {
      roots.add("greed");
    }
    if (cravings.includes("non-becoming")) {
      roots.add("aversion");
    }
    return Array.from(roots);
  }
  /**
   * Generate a practice recommendation based on the craving pattern
   */
  generateRecommendation(cravings, intensity) {
    if (intensity > 7) {
      return "Strong craving present. Practice mindfulness of the craving itself - observe without acting. Let it arise and pass.";
    }
    if (cravings.includes("sensory")) {
      return "Practice restraint of the senses. Not suppression, but mindful awareness of how sense contact leads to craving.";
    }
    if (cravings.includes("becoming")) {
      return "Examine the desire to become. Who is it that wants to become something? Investigate the self that craves.";
    }
    if (cravings.includes("non-becoming")) {
      return "Investigate the aversion. What are you running from? See that non-existence is also a form of craving.";
    }
    return "Continue cultivating mindfulness to recognize craving when it arises.";
  }
  /**
   * Explain the relationship between craving and suffering
   */
  explainCausation() {
    return `
Craving (tanha) leads to suffering through this process:
1. Contact with sense objects creates feeling (pleasant/unpleasant/neutral)
2. Pleasant feelings trigger craving to maintain the experience
3. Unpleasant feelings trigger craving to escape
4. Craving leads to clinging (upadana)
5. Clinging leads to becoming (bhava)
6. Becoming perpetuates the cycle of suffering

The key insight: It's not the experience itself that causes suffering,
but our craving in relation to the experience.
    `.trim();
  }
  /**
   * Get the task associated with this truth
   */
  getTask() {
    return "To be abandoned (pahatabba)";
  }
  /**
   * Get descriptions of each craving type
   */
  getCravingDescriptions() {
    return {
      sensory: "Craving for pleasant sensory experiences - sights, sounds, tastes, touches, smells, and mental pleasures",
      becoming: "Craving to be something, to exist as a particular kind of person, to achieve states of being",
      "non-becoming": "Craving for non-existence, annihilation, escape from experience - a subtle form of aversion"
    };
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: "Suffering arises from our craving, attachment, and resistance to how things are",
      usefulFor: [
        "Understanding why we suffer",
        "Recognizing patterns of craving in daily life",
        "Taking responsibility for our mental states",
        "Identifying what to let go of"
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: "Craving arises from ignorance of the true nature of phenomena - their emptiness, impermanence, and not-self character",
      transcends: [
        "Blaming external circumstances for suffering",
        "Belief in a self that craves",
        "Attempting to satisfy craving through acquisition",
        "Suppressing craving through willpower alone"
      ]
    };
  }
};

// src/core/Unconditioned.ts
var UnconditionedDharma = class {
  impermanence = false;
  unsatisfactoriness = false;
  notSelf = true;
  id;
  constructor() {
    this.id = generateId();
  }
};

// src/four-noble-truths/Nirodha.ts
var Nirodha = class extends UnconditionedDharma {
  name = "Nirodha";
  sanskritName = "Nirodha";
  /**
   * Assess whether cessation is possible and what obstacles remain
   */
  isPossible(causeAnalysis) {
    const obstacles = this.identifyObstacles(causeAnalysis);
    const progressLevel = this.assessProgress(causeAnalysis);
    return {
      isPossible: true,
      // Cessation is always possible in principle
      obstacles,
      progressLevel,
      pathForward: this.describePathForward(progressLevel, obstacles)
    };
  }
  /**
   * Identify current obstacles to cessation
   */
  identifyObstacles(analysis) {
    const obstacles = [];
    if (analysis.intensity > 7) {
      obstacles.push("Strong craving making clear seeing difficult");
    }
    if (analysis.rootCauses.includes("delusion")) {
      obstacles.push("Fundamental ignorance of the nature of reality");
    }
    if (analysis.rootCauses.includes("greed")) {
      obstacles.push("Attachment and grasping at pleasant experiences");
    }
    if (analysis.rootCauses.includes("aversion")) {
      obstacles.push("Resistance and pushing away of unpleasant experiences");
    }
    if (analysis.cravingsPresent.includes("becoming")) {
      obstacles.push("Identification with a self that needs to become something");
    }
    return obstacles.length > 0 ? obstacles : ["No major obstacles identified - continue practice"];
  }
  /**
   * Assess progress toward cessation
   */
  assessProgress(analysis) {
    if (analysis.cravingsPresent.length === 0 && analysis.rootCauses.length === 0) {
      return 0;
    }
    let progress = 5;
    progress += (10 - analysis.intensity) / 2;
    progress += 3 - analysis.cravingsPresent.length;
    progress += 3 - analysis.rootCauses.length;
    return Math.min(10, Math.max(0, Math.round(progress)));
  }
  /**
   * Describe the path forward based on current state
   */
  describePathForward(progressLevel, _obstacles) {
    if (progressLevel >= 8) {
      return "Advanced practice: Subtle attachments remain. Continue deepening insight into emptiness and not-self.";
    }
    if (progressLevel >= 5) {
      return "Intermediate practice: The path is clear. Develop concentration and insight in balance. Watch for spiritual materialism.";
    }
    if (progressLevel >= 3) {
      return "Beginning practice: Establish ethical conduct and right view. Build a foundation of mindfulness. Study the teachings.";
    }
    return "Foundation building: Start with the basics - ethical conduct, generosity, and learning to observe the mind.";
  }
  /**
   * Describe what Nirvana/cessation actually is
   */
  describeNirvana() {
    return `
Nirvana (Nibbana) is not:
- Annihilation or nothingness
- A place you go after death
- A state of blissful unconsciousness
- Something to be achieved in the future

Nirvana IS:
- The cessation of craving, aversion, and delusion
- The unbinding from compulsive patterns
- Available here and now, moment by moment
- The natural state when ignorance is dispelled
- Peace, freedom, and the end of suffering

"There is, monks, an unborn, unbecome, unmade, unconditioned.
If there were not this unborn... there would be no escape
from the born, become, made, conditioned." - The Buddha
    `.trim();
  }
  /**
   * Get the task associated with this truth
   */
  getTask() {
    return "To be realized (sacchikatabba)";
  }
  /**
   * Explain the relationship between cessation and the other truths
   */
  explainRelationship() {
    return `
The Third Truth is the turning point:
- First Truth (Dukkha): The problem - suffering exists
- Second Truth (Samudaya): The diagnosis - craving causes it
- Third Truth (Nirodha): The prognosis - it CAN end (THIS truth)
- Fourth Truth (Magga): The treatment - the path to end it

Nirodha provides hope and direction. Without the possibility
of cessation, the path would be meaningless. This truth affirms
that liberation is possible for all beings.
    `.trim();
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: "When craving ceases, suffering ceases. Peace and freedom are possible.",
      usefulFor: [
        "Providing hope and motivation for practice",
        "Setting the goal of the spiritual path",
        "Understanding that suffering is not inevitable",
        "Recognizing moments of peace as glimpses of cessation"
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: "Cessation is not the destruction of something that exists, but the non-arising of what never had inherent existence",
      transcends: [
        "View of Nirvana as a place or destination",
        "Belief that cessation is annihilation",
        "Grasping at cessation as a goal to achieve",
        "Separation between samsara and Nirvana"
      ]
    };
  }
};

// src/four-noble-truths/Magga.ts
var Magga = class extends Phenomenon {
  name = "Magga";
  sanskritName = "M\u0101rga";
  /** Reference to the Eightfold Path (if provided) */
  _path;
  constructor(path3) {
    super();
    this._path = path3;
  }
  /**
   * Set the Eightfold Path reference
   */
  setPath(path3) {
    this._path = path3;
  }
  /**
   * Get the associated Eightfold Path (if set)
   */
  getPath() {
    return this._path;
  }
  /**
   * Generate a prescription based on the cause analysis
   */
  prescribe(causeAnalysis) {
    const focusArea = this.determineFocusArea(causeAnalysis);
    const practices = this.getPracticesForArea(focusArea, causeAnalysis);
    const intensity = this.determineIntensity(causeAnalysis);
    return {
      focusArea,
      practices,
      rationale: this.generateRationale(focusArea, causeAnalysis),
      recommendedIntensity: intensity
    };
  }
  /**
   * Determine which area of the path to focus on
   */
  determineFocusArea(analysis) {
    if (analysis.intensity > 7) {
      return "meditation";
    }
    if (analysis.rootCauses.includes("delusion") && !analysis.rootCauses.includes("greed") && !analysis.rootCauses.includes("aversion")) {
      return "wisdom";
    }
    if (analysis.cravingsPresent.includes("sensory")) {
      return "ethics";
    }
    return "wisdom";
  }
  /**
   * Get specific practices for the focus area
   */
  getPracticesForArea(area, _analysis) {
    const practices = {
      wisdom: [
        "Study the Four Noble Truths deeply",
        "Contemplate impermanence in daily life",
        "Investigate the nature of self",
        "Develop Right View through learning and reflection",
        "Set intentions aligned with liberation"
      ],
      ethics: [
        "Practice mindful speech - truthful, kind, helpful",
        "Review actions for harmfulness",
        "Examine livelihood for ethical alignment",
        "Cultivate generosity and letting go",
        "Practice restraint without suppression"
      ],
      meditation: [
        "Establish a regular sitting practice",
        "Develop mindfulness of breath",
        "Practice noting arising and passing",
        "Cultivate concentration through sustained attention",
        "Apply mindfulness to daily activities"
      ]
    };
    return practices[area];
  }
  /**
   * Determine recommended practice intensity
   */
  determineIntensity(analysis) {
    const base = Math.min(8, analysis.intensity + 2);
    return Math.max(3, base);
  }
  /**
   * Generate rationale for the prescription
   */
  generateRationale(area, _analysis) {
    switch (area) {
      case "wisdom":
        return "Wisdom practices address the root of suffering - ignorance. Understanding the nature of reality undermines craving at its source.";
      case "ethics":
        return "Ethical practices create the conditions for peace. By reducing harm, we reduce agitation and create space for insight.";
      case "meditation":
        return "Meditation practices develop the calm and clarity needed to see things as they are. They directly work with the mind.";
    }
  }
  /**
   * Get the task associated with this truth
   */
  getTask() {
    return "To be developed (bhavetabba)";
  }
  /**
   * List the eight factors of the path
   */
  listEightFactors() {
    return [
      { name: "Right View", category: "wisdom", description: "Understanding the Four Noble Truths" },
      { name: "Right Intention", category: "wisdom", description: "Intentions free from greed, hatred, and cruelty" },
      { name: "Right Speech", category: "ethics", description: "Truthful, kind, and helpful communication" },
      { name: "Right Action", category: "ethics", description: "Actions that do not harm" },
      { name: "Right Livelihood", category: "ethics", description: "Earning a living without causing harm" },
      { name: "Right Effort", category: "meditation", description: "Cultivating wholesome states" },
      { name: "Right Mindfulness", category: "meditation", description: "Clear awareness of body, feelings, mind, phenomena" },
      { name: "Right Concentration", category: "meditation", description: "Developing focused, unified mind" }
    ];
  }
  /**
   * Explain the middle way nature of the path
   */
  explainMiddleWay() {
    return `
The Noble Eightfold Path is the "Middle Way" between extremes:

NOT self-indulgence:
- Chasing pleasure does not lead to lasting happiness
- Gratifying craving only strengthens it

NOT self-mortification:
- Punishing the body does not purify the mind
- Extreme asceticism creates more suffering

THE MIDDLE WAY:
- Balanced, sustainable practice
- Working with body and mind skillfully
- Neither grasping nor rejecting experience
- Gradual cultivation leading to liberation

This middle way is itself empty - it's a raft to cross the river,
not something to carry forever.
    `.trim();
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: "There is a practical path of training - in wisdom, ethics, and meditation - that leads to the end of suffering",
      usefulFor: [
        "Providing concrete practices for liberation",
        "Organizing spiritual development",
        "Measuring progress on the path",
        "Knowing what to do next"
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: "The path is empty of inherent existence - it is a skillful means, not an end in itself. The practitioner, practice, and goal are not ultimately separate.",
      transcends: [
        "Attachment to the path itself",
        "Belief in a self who walks the path",
        "Viewing the path as mechanical self-improvement",
        "Separation between path and fruition"
      ]
    };
  }
};

// src/four-noble-truths/FourNobleTruths.ts
var FourNobleTruths = class {
  /** First Noble Truth - Suffering */
  firstTruth;
  /** Second Noble Truth - Origin of Suffering */
  secondTruth;
  /** Third Noble Truth - Cessation of Suffering */
  thirdTruth;
  /** Fourth Noble Truth - The Path */
  fourthTruth;
  constructor(path3) {
    this.firstTruth = new Dukkha();
    this.secondTruth = new Samudaya();
    this.thirdTruth = new Nirodha();
    this.fourthTruth = new Magga(path3);
    this.establishRelationships();
  }
  /**
   * Establish the causal relationships between the truths
   */
  establishRelationships() {
    this.firstTruth.addCondition(this.secondTruth);
  }
  /**
   * Diagnose a situation according to the Four Noble Truths
   *
   * @param input - The situation to diagnose
   * @returns A complete diagnosis with prescription
   */
  diagnose(input) {
    const sufferingAnalysis = this.firstTruth.analyze(input.suffering);
    const causeAnalysis = this.secondTruth.analyze(
      input.cravings,
      input.intensity
    );
    const cessationAssessment = this.thirdTruth.isPossible(causeAnalysis);
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
  getTasks() {
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
  getSummary() {
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
  explainRelationship() {
    return `
The Four Noble Truths form two causal pairs:

PAIR 1: The Problem
  Second Truth (Craving) \u2192 First Truth (Suffering)
  "Because there is craving, there is suffering."

PAIR 2: The Solution
  Fourth Truth (Path) \u2192 Third Truth (Cessation)
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
   * All four truths understood: dukkha fully comprehended (1st truth's task)
   * and the path substantially developed (4th truth's task). The 2nd and 3rd
   * truths' tasks (abandoning, realizing) are reflected in path development.
   */
  allTruthsUnderstood() {
    const path3 = this.fourthTruth.getPath();
    return this.firstTruth.isFullyUnderstood() && path3 !== void 0 && path3.getOverallDevelopment() >= 8;
  }
  /**
   * Get individual access to each truth
   */
  get dukkha() {
    return this.firstTruth;
  }
  get samudaya() {
    return this.secondTruth;
  }
  get nirodha() {
    return this.thirdTruth;
  }
  get magga() {
    return this.fourthTruth;
  }
};

// src/karma/KarmicResult.ts
var KarmicResult = class extends Phenomenon {
  name = "KarmicResult";
  sanskritName = "Vip\u0101ka";
  /** The karma that caused this result */
  sourceKarmaId;
  /** Quality of the result (pleasant/unpleasant/neutral experience) */
  experienceQuality;
  /** Intensity of the result */
  intensity;
  /** Description of the result */
  description;
  constructor(sourceKarmaId, experienceQuality, intensity, description = "") {
    super();
    this.sourceKarmaId = sourceKarmaId;
    this.experienceQuality = experienceQuality;
    this.intensity = intensity;
    this.description = description || `Result of karma: ${experienceQuality} experience`;
  }
  /**
   * Manifest the result (when conditions are right)
   */
  manifest() {
    return this.arise();
  }
  /**
   * Check if result has manifested
   */
  hasManifested() {
    return this.hasArisen;
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: "Actions have results - this result arose from previous karma",
      usefulFor: [
        "Understanding why things happen",
        "Accepting present circumstances",
        "Motivation to create good karma"
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: "The result is empty of inherent existence - there is no receiver of karma, just the natural unfolding of causes and conditions",
      transcends: [
        "Fatalism (predetermined destiny)",
        "Victimhood (why me?)",
        "Belief in cosmic punishment/reward"
      ]
    };
  }
};

// src/karma/Karma.ts
var Karma = class extends Phenomenon {
  name = "Karma";
  sanskritName = "Karma";
  /** The intention behind the action */
  intention;
  /** Quality of the karma */
  quality;
  /** Intensity of the action */
  intensity;
  /** Potential results (seeds) */
  potentialResults = [];
  /** Has the karma been completed (action performed)? */
  _isCompleted = false;
  /** Has the result manifested? */
  _hasManifested = false;
  constructor(intention, intensity) {
    super();
    this.intention = intention;
    this.quality = intention.quality;
    this.intensity = intensity;
    this.addCondition(intention);
  }
  /**
   * Complete the karma (perform the action)
   * This "plants the karmic seed"
   */
  complete() {
    if (this._isCompleted) return false;
    this._isCompleted = true;
    this.arise();
    this.generatePotentialResults();
    return true;
  }
  /**
   * Alias for complete - plant the karmic seed
   */
  plantSeed() {
    return this.complete();
  }
  /**
   * Generate potential results based on quality and intensity
   */
  generatePotentialResults() {
    const resultQuality = this.mapQualityToFeeling(this.quality);
    const resultIntensity = this.calculateResultIntensity();
    this.potentialResults.push(
      new KarmicResult(
        this.id,
        resultQuality,
        resultIntensity,
        `Result of ${this.quality} action`
      )
    );
  }
  /**
   * Map karma quality to result feeling tone
   */
  mapQualityToFeeling(quality) {
    switch (quality) {
      case "wholesome":
        return "pleasant";
      case "unwholesome":
        return "unpleasant";
      default:
        return "neutral";
    }
  }
  /**
   * Calculate result intensity based on intention strength and action intensity
   */
  calculateResultIntensity() {
    const multiplier = 1 + this.intention.strength / 20;
    return Math.min(10, Math.round(this.intensity * multiplier));
  }
  /**
   * Manifest the karmic result (when conditions are right)
   */
  manifest() {
    if (this._hasManifested || this.potentialResults.length === 0) {
      return null;
    }
    const result = this.potentialResults[0];
    if (result.manifest()) {
      this._hasManifested = true;
      return result;
    }
    return null;
  }
  /**
   * Check if karma is still potential (not yet ripened)
   */
  isPotential() {
    return this._isCompleted && !this._hasManifested;
  }
  /**
   * Check if karma has been completed
   */
  get isCompleted() {
    return this._isCompleted;
  }
  /**
   * Check if result has manifested
   */
  get hasManifested() {
    return this._hasManifested;
  }
  /**
   * Get potential results
   */
  getPotentialResults() {
    return [...this.potentialResults];
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: "Actions have consequences that affect future experience - good actions lead to good results",
      usefulFor: [
        "Ethical guidance",
        "Taking responsibility",
        "Understanding cause and effect",
        "Motivation for wholesome action"
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: "Karma is a natural process without a self who acts or receives results - it is empty of inherent existence",
      transcends: [
        "Fatalism (everything is predetermined)",
        "Moral nihilism (actions have no consequences)",
        "Belief in cosmic judge rewarding/punishing"
      ]
    };
  }
  /**
   * Explain the law of karma
   */
  static explain() {
    return `
THE LAW OF KARMA

Karma literally means "action" - specifically, intentional action.
It operates through natural causation, not supernatural intervention.

KEY PRINCIPLES:

1. INTENTION IS KARMA
   The mental factor of intention (cetana) is what makes action karmic.
   Actions without intention have no karmic weight.

2. LIKE PRODUCES LIKE
   - Wholesome intentions \u2192 pleasant results
   - Unwholesome intentions \u2192 unpleasant results
   - Neutral intentions \u2192 neutral results

3. KARMA IS NOT FATE
   - We create new karma constantly
   - Past karma doesn't determine everything
   - We can change our trajectory through present actions

4. KARMA RIPENS WHEN CONDITIONS ALLOW
   - Results may be immediate or delayed
   - Environment must be suitable for ripening
   - Some karma never ripens (if conditions don't arise)

5. KARMA CAN BE WEAKENED
   - Through remorse and confession
   - Through counter-actions
   - Through realization (wisdom)

THE THREE TYPES OF KARMA:
- Bodily karma (actions of body)
- Verbal karma (actions of speech)
- Mental karma (actions of mind)

All are rooted in intention.
    `.trim();
  }
};

// src/karma/Intention.ts
var Intention = class extends Phenomenon {
  name = "Intention";
  sanskritName = "Cetan\u0101";
  /** Description of the intention */
  description;
  /** Strength of the intention */
  strength;
  /** Root motivation */
  root;
  /** Quality of the intention */
  quality;
  constructor(description, strength, root) {
    super();
    this.description = description;
    this.strength = strength;
    if (root) {
      this.root = root;
      this.quality = this.determineQuality(root);
    } else {
      this.root = "neutral";
      this.quality = "neutral";
    }
    this.arise();
  }
  /**
   * Determine quality based on root
   */
  determineQuality(root) {
    const unwholesome = ["greed", "aversion", "delusion"];
    if (unwholesome.includes(root)) {
      return "unwholesome";
    }
    return "wholesome";
  }
  /**
   * Check if intention is complete (ready to manifest as action)
   */
  isComplete() {
    return this.hasArisen && !this.hasCeased;
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: "Intention is the mental factor that directs action and shapes karmic results",
      usefulFor: [
        "Taking responsibility for actions",
        "Understanding the source of karma",
        "Cultivating wholesome motivations"
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: 'Intention arises from conditions and lacks inherent self - there is no "intender" behind the intention',
      transcends: [
        "Belief in a self that intends",
        "Guilt and blame",
        "Pride in good intentions"
      ]
    };
  }
};

// src/emptiness/Sunyata.ts
var Sunyata = class {
  /**
   * Examine a phenomenon for emptiness
   */
  examine(phenomenon) {
    const conditions = phenomenon.getConditions();
    const impermanence = phenomenon.examineImpermanence();
    phenomenon.examineNotSelf();
    return {
      phenomenon: phenomenon.name,
      isEmpty: true,
      dependsOn: conditions.map((c) => c.name),
      arisesCausally: impermanence.arises,
      ceasesCausally: impermanence.ceases,
      hasInherentExistence: false,
      explanation: this.generateExplanation(phenomenon, conditions)
    };
  }
  /**
   * Generate detailed explanation
   */
  generateExplanation(phenomenon, conditions) {
    const conditionNames = conditions.map((c) => c.name).join(", ") || "various conditions";
    return `${phenomenon.name} is empty of inherent existence because:

1. DEPENDENT ORIGINATION
   It depends on: ${conditionNames}
   Without these conditions, it would not exist.

2. IMPERMANENCE
   It arises when conditions gather.
   It ceases when conditions disperse.
   It has no permanent essence.

3. NOT-SELF
   It lacks independent existence.
   It cannot be found apart from its parts.
   It is not controlled by a self.

4. CONCEPTUAL DESIGNATION
   "${phenomenon.name}" is a label applied to a process.
   The label is conventional, not ultimate.

Therefore, ${phenomenon.name} exists conventionally (it functions)
but is empty ultimately (it lacks inherent existence).`;
  }
  /**
   * The famous formula from the Heart Sutra
   */
  getHeartSutraInsight() {
    return {
      formIsEmptiness: "Form does not differ from emptiness",
      emptinessIsForm: "Emptiness does not differ from form",
      explanation: `This is not saying form is nothing.
It means: form exists dependently, therefore it is "empty."
Emptiness is not separate from phenomena - it IS their nature.
There is no form that is not empty.
There is no emptiness apart from form.`,
      appliesTo: [
        "form (rupa)",
        "feeling (vedana)",
        "perception (samjna)",
        "mental formations (samskara)",
        "consciousness (vijnana)"
      ]
    };
  }
  /**
   * Two truths perspective on emptiness
   */
  getTwoTruthsPerspective() {
    return {
      conventional: "Things exist conventionally - they appear, function, and can be spoken about. Conventional existence is not denied.",
      ultimate: "Things lack inherent, independent, permanent existence. When analyzed, no essence can be found. This is ultimate truth.",
      reconciliation: "Both truths are true simultaneously. Emptiness does not negate conventional existence - it explains HOW things exist (dependently, not independently)."
    };
  }
  /**
   * Examine the emptiness of emptiness itself
   */
  examineEmptinessItself() {
    return `EMPTINESS IS ALSO EMPTY

Even emptiness is not an inherent nature or essence.
Emptiness is not a "thing" that phenomena possess.
It is not a cosmic void or nihilistic nothingness.

Emptiness is simply the way things are:
- Dependently originated
- Without inherent existence
- Neither truly existent nor truly non-existent

If we grasp at emptiness as a view, we miss the point.
"Emptiness wrongly grasped is like picking up a snake by the wrong end."

The realization of emptiness is not an intellectual understanding,
but a direct seeing that liberates.`;
  }
  /**
   * Common misunderstandings about emptiness
   */
  getMisunderstandings() {
    return [
      {
        wrong: "Emptiness means nothingness - things don't exist",
        correct: "Emptiness means things lack INHERENT existence, not that they don't exist at all"
      },
      {
        wrong: "If things are empty, nothing matters",
        correct: "Because things are empty (interdependent), everything matters - our actions have effects"
      },
      {
        wrong: "Emptiness is a thing or place",
        correct: "Emptiness is the NATURE of phenomena, not a separate thing"
      },
      {
        wrong: "Understanding emptiness intellectually is realization",
        correct: "True realization is direct insight that transforms, not just intellectual understanding"
      },
      {
        wrong: "Emptiness negates conventional reality",
        correct: "Emptiness explains conventional reality - why things can change, interact, and function"
      }
    ];
  }
  /**
   * Get summary of emptiness teaching
   */
  getSummary() {
    return `
SUNYATA - EMPTINESS

The central insight of Madhyamaka Buddhism.

WHAT EMPTINESS IS:
- The lack of inherent, independent existence
- Dependent origination (things arise from causes)
- The middle way between eternalism and nihilism

WHAT EMPTINESS IS NOT:
- Nothingness or void
- A thing or substance
- Nihilism (nothing exists/matters)

THE FORMULA:
"Whatever is dependently originated is empty.
Whatever is empty is dependently originated."

Emptiness = Dependent Origination = The Middle Way

PRACTICAL SIGNIFICANCE:
- Liberation from grasping at permanent self
- Compassion arises from seeing interdependence
- Freedom from extremes of belief
- Understanding that change is possible
    `.trim();
  }
};

// src/mind/MentalFactor.ts
var MentalFactor = class extends Phenomenon {
  name;
  sanskritName;
  quality;
  _intensity = 0;
  _isActive = false;
  constructor(name, sanskritName, quality) {
    super();
    this.name = name;
    this.sanskritName = sanskritName;
    this.quality = quality;
  }
  /**
   * Activate this mental factor
   */
  activate(intensity) {
    this._isActive = true;
    this._intensity = intensity;
    this.arise();
  }
  /**
   * Deactivate this mental factor
   */
  deactivate() {
    this._isActive = false;
    this._intensity = 0;
    this.cease();
  }
  /**
   * Get current intensity
   */
  get intensity() {
    return this._intensity;
  }
  /**
   * Check if active
   */
  get isActive() {
    return this._isActive;
  }
  getConventionalTruth() {
    return {
      level: "conventional",
      description: `${this.name} is a mental factor that colors conscious experience`,
      usefulFor: [
        "Understanding mental processes",
        "Meditation practice",
        "Psychological insight"
      ]
    };
  }
  getUltimateTruth() {
    return {
      level: "ultimate",
      description: `${this.name} arises from conditions and lacks inherent existence`,
      transcends: [
        "Identification with mental states",
        "Belief in permanent traits"
      ]
    };
  }
};

// src/mind/Mind.ts
var Mind = class {
  /** Active mental factors */
  factors = /* @__PURE__ */ new Map();
  /** Current clarity level */
  clarity = 5;
  /** Current stability level */
  stability = 5;
  constructor() {
    this.initializeFactors();
  }
  /**
   * Initialize common mental factors
   */
  initializeFactors() {
    this.factors.set("contact", new MentalFactor("Contact", "Phassa", "variable"));
    this.factors.set("feeling", new MentalFactor("Feeling", "Vedan\u0101", "variable"));
    this.factors.set("perception", new MentalFactor("Perception", "Sa\xF1\xF1\u0101", "variable"));
    this.factors.set("intention", new MentalFactor("Intention", "Cetan\u0101", "variable"));
    this.factors.set("attention", new MentalFactor("Attention", "Manasik\u0101ra", "variable"));
    this.factors.set("greed", new MentalFactor("Greed", "Lobha", "unwholesome"));
    this.factors.set("aversion", new MentalFactor("Aversion", "Dosa", "unwholesome"));
    this.factors.set("delusion", new MentalFactor("Delusion", "Moha", "unwholesome"));
    this.factors.set("mindfulness", new MentalFactor("Mindfulness", "Sati", "wholesome"));
    this.factors.set("equanimity", new MentalFactor("Equanimity", "Upekkh\u0101", "wholesome"));
    this.factors.set("compassion", new MentalFactor("Compassion", "Karu\u1E47\u0101", "wholesome"));
    this.factors.set("wisdom", new MentalFactor("Wisdom", "Pa\xF1\xF1\u0101", "wholesome"));
  }
  /**
   * Activate a mental factor
   */
  activateFactor(name, intensity) {
    const factor = this.factors.get(name);
    if (factor) {
      factor.activate(intensity);
      return true;
    }
    return false;
  }
  /**
   * Deactivate a mental factor
   */
  deactivateFactor(name) {
    const factor = this.factors.get(name);
    if (factor) {
      factor.deactivate();
      return true;
    }
    return false;
  }
  /**
   * Get current mind state
   */
  getState() {
    const activeFactors = Array.from(this.factors.values()).filter((f) => f.isActive);
    const hasUnwholesome = activeFactors.some((f) => f.quality === "unwholesome");
    const hasMindfulness = this.factors.get("mindfulness")?.isActive ?? false;
    return {
      isCalm: !hasUnwholesome && this.stability >= 5,
      isFocused: hasMindfulness && this.clarity >= 5,
      dominantFactors: activeFactors.sort((a, b) => b.intensity - a.intensity).slice(0, 3).map((f) => f.name),
      clarity: this.clarity,
      stability: this.stability
    };
  }
  /**
   * Set clarity level
   */
  setClarity(level) {
    this.clarity = level;
  }
  /**
   * Set stability level
   */
  setStability(level) {
    this.stability = level;
  }
  /**
   * Calm the mind (deactivate unwholesome factors)
   */
  calm() {
    this.factors.forEach((factor, _name) => {
      if (factor.quality === "unwholesome" && factor.isActive) {
        factor.deactivate();
      }
    });
    this.stability = Math.min(10, this.stability + 1);
  }
  /**
   * Get a factor by name
   */
  getFactor(name) {
    return this.factors.get(name);
  }
  /**
   * Get all active factors
   */
  getActiveFactors() {
    return Array.from(this.factors.values()).filter((f) => f.isActive);
  }
};

// src/simulation/BeingSerializer.ts
function serializeBeing(being) {
  const pathFactors = being.path.getAllFactors();
  const path3 = {
    factors: pathFactors.map((f) => ({
      name: f.name,
      developmentLevel: f.developmentLevel,
      isActive: f.isActive,
      hasArisen: f.hasArisen,
      hasCeased: f.hasCeased
    }))
  };
  const mindFactorKeys = [
    "contact",
    "feeling",
    "perception",
    "intention",
    "attention",
    "greed",
    "aversion",
    "delusion",
    "mindfulness",
    "equanimity",
    "compassion",
    "wisdom"
  ];
  const mindFactors = [];
  for (const key of mindFactorKeys) {
    const factor = being.mind.getFactor(key);
    if (factor) {
      mindFactors.push({
        key,
        name: factor.name,
        sanskritName: factor.sanskritName,
        quality: factor.quality,
        intensity: factor.intensity,
        isActive: factor.isActive
      });
    }
  }
  const mindState = being.mind.getState();
  const mind = {
    factors: mindFactors,
    clarity: mindState.clarity,
    stability: mindState.stability
  };
  const chainState = being.dependentOrigination.getChainState();
  const dependentOrigination = {
    links: chainState.map((l) => ({
      position: l.position,
      name: l.name,
      hasArisen: l.hasArisen,
      hasCeased: false,
      isBroken: l.isBroken
    }))
  };
  const karmicStreamData = being.getKarmicStream().map((k) => ({
    id: k.id,
    description: k.intention.description,
    quality: k.quality,
    intensity: k.intensity,
    root: k.intention.root,
    isCompleted: k.isCompleted,
    hasManifested: k.hasManifested
  }));
  const snapshot = being.aggregates.getSnapshot();
  const allExperiences = being.getExperienceHistory(Infinity);
  return {
    mindfulnessLevel: being.mindfulnessLevel,
    karmicStream: karmicStreamData,
    experienceHistory: allExperiences.map((e) => ({
      input: {
        senseBase: e.input.senseBase,
        object: e.input.object,
        intensity: e.input.intensity,
        valence: e.input.valence
      },
      label: e.label,
      feelingTone: e.feelingTone,
      reactions: [...e.reactions],
      timestamp: e.timestamp
    })),
    aggregates: {
      form: { ...snapshot.form },
      feeling: { ...snapshot.feeling },
      perception: { ...snapshot.perception },
      mentalFormations: {
        dominantQuality: snapshot.mentalFormations.dominantQuality,
        overallIntensity: snapshot.mentalFormations.overallIntensity,
        activeFactors: snapshot.mentalFormations.activeFactors.map((f) => ({
          name: f.name,
          quality: f.quality,
          intensity: f.intensity,
          active: f.active
        }))
      },
      consciousness: {
        activeTypes: Array.from(snapshot.consciousness.activeTypes),
        primaryFocus: snapshot.consciousness.primaryFocus,
        clarity: snapshot.consciousness.clarity
      }
    },
    path: path3,
    mind,
    dependentOrigination
  };
}
function deserializeBeing(data) {
  const being = new Being();
  const factorMap = new Map(being.path.getAllFactors().map((f) => [f.name, f]));
  for (const fd of data.path.factors) {
    const factor = factorMap.get(fd.name);
    if (factor) {
      factor.reset();
      if (fd.hasArisen || fd.isActive) {
        factor.activate();
      }
      factor._developmentLevel = fd.developmentLevel;
      factor._hasArisen = fd.hasArisen;
      factor._hasCeased = fd.hasCeased;
    }
  }
  for (const mf of data.mind.factors) {
    const factor = being.mind.getFactor(mf.key);
    if (factor) {
      if (mf.isActive) {
        factor.activate(mf.intensity);
      } else {
        factor.deactivate();
      }
    }
  }
  being.mind.setClarity(data.mind.clarity);
  being.mind.setStability(data.mind.stability);
  const links = being.dependentOrigination.links;
  for (const ld of data.dependentOrigination.links) {
    const link = links[ld.position - 1];
    if (link) {
      link.restoreLink();
      if (ld.hasArisen) link._hasArisen = true;
      if (ld.hasCeased) link._hasCeased = true;
      if (ld.isBroken) link._isBroken = true;
    }
  }
  const karmicStream = data.karmicStream.map((kd) => {
    const intention = new Intention(
      kd.description,
      kd.intensity,
      kd.root === "neutral" ? void 0 : kd.root
    );
    const karma = new Karma(intention, kd.intensity);
    if (kd.isCompleted) karma.complete();
    if (kd.hasManifested) karma.manifest();
    return karma;
  });
  const experienceHistory = data.experienceHistory.map((e) => ({
    input: {
      senseBase: e.input.senseBase,
      object: e.input.object,
      intensity: e.input.intensity,
      valence: e.input.valence
    },
    label: e.label,
    feelingTone: e.feelingTone,
    reactions: [...e.reactions],
    timestamp: e.timestamp
  }));
  being._restoreState({
    mindfulnessLevel: data.mindfulnessLevel,
    karmicStream,
    experienceHistory
  });
  return being;
}

// src/simulation/Being.ts
var Being = class {
  /** The five aggregates that constitute the "person" */
  aggregates;
  /** The Noble Eightfold Path being developed */
  path;
  /** Dependent origination chain */
  dependentOrigination;
  /** The Four Noble Truths framework */
  fourNobleTruths;
  /** Emptiness analyzer */
  emptiness;
  /** Mind with mental factors */
  mind;
  /** Stream of karma */
  karmicStream = [];
  /** History of experiences */
  experienceHistory = [];
  /** Current mindfulness level */
  _mindfulnessLevel = 0;
  constructor() {
    this.aggregates = new FiveAggregates();
    this.path = new EightfoldPath();
    this.dependentOrigination = new DependentOrigination();
    this.fourNobleTruths = new FourNobleTruths(this.path);
    this.emptiness = new Sunyata();
    this.mind = new Mind();
  }
  /**
   * Experience something through the senses
   */
  experience(input) {
    const processed = this.aggregates.processExperience(input);
    this.experienceHistory.push(processed);
    if (this._mindfulnessLevel > 5) {
      processed.reactions.push("mindful observation without automatic reaction");
    }
    return processed;
  }
  /**
   * Perform an intentional action (creates karma).
   * Quality is determined by the root motivation — "greed is a root of the
   * unwholesome... non-greed is a root of the wholesome" (M. I.46-47) — and
   * cannot be assigned independently of it.
   */
  act(description, intensity, root) {
    const intention = new Intention(description, intensity, root);
    const karma = new Karma(intention, intensity);
    karma.complete();
    this.karmicStream.push(karma);
    return karma;
  }
  /**
   * Receive karmic results (ripen pending karma)
   */
  receiveKarmicResults() {
    const results = [];
    for (const karma of this.karmicStream) {
      if (karma.isPotential()) {
        const result = karma.manifest();
        if (result) {
          results.push(result);
          this.experience({
            senseBase: "mind",
            object: result.description,
            intensity: result.intensity,
            valence: result.experienceQuality
          });
        }
      }
    }
    return results;
  }
  /**
   * Practice meditation
   */
  meditate(duration, effort) {
    this.path.rightEffort.practice(effort);
    this.path.rightMindfulness.practice(effort);
    this.path.rightConcentration.practice(effort);
    this.mind.activateFactor("mindfulness", effort);
    const mindfulnessGain = effort * duration * 0.01;
    this._mindfulnessLevel = Math.min(
      10,
      Math.round(this._mindfulnessLevel + mindfulnessGain)
    );
    if (effort >= 5) {
      this.mind.calm();
    }
    return {
      mindfulnessLevel: this._mindfulnessLevel,
      concentrationLevel: this.path.rightConcentration.developmentLevel,
      insight: this.generateMeditationInsight(),
      pathProgress: this.path.getOverallDevelopment()
    };
  }
  /**
   * Generate insight based on practice levels
   */
  generateMeditationInsight() {
    const concentration = this.path.rightConcentration.developmentLevel;
    const mindfulness = this._mindfulnessLevel;
    const wisdom = this.path.rightView.developmentLevel;
    if (concentration >= 8 && mindfulness >= 8 && wisdom >= 5) {
      return "Deep insight: Directly seeing the three marks of existence in all phenomena. Liberation is near.";
    }
    if (concentration >= 6 && mindfulness >= 6) {
      return "Clear seeing: Impermanence of mental states becomes obvious. Each moment arises and passes.";
    }
    if (concentration >= 4 && mindfulness >= 4) {
      return "Growing clarity: Able to observe thoughts without being caught. Some detachment arising.";
    }
    if (concentration >= 2) {
      return "Beginning stability: Moments of calm and clarity amidst distraction.";
    }
    return null;
  }
  /**
   * Investigate the nature of self
   */
  investigateSelf() {
    const aggregateSearch = this.aggregates.searchForSelf();
    const dependentOriginationInsight = "This being arises dependent on causes and conditions, moment by moment.";
    const emptinessInsight = this.emptiness.examine(this.aggregates.form);
    return {
      aggregateSearch,
      dependentOriginationInsight,
      emptinessInsight,
      conclusion: 'What is called "self" is a convenient designation for a process. No unchanging, independent self can be found.'
    };
  }
  /**
   * Face suffering using the Four Noble Truths
   */
  faceSuffering(suffering, cravings) {
    const diagnosis = this.fourNobleTruths.diagnose({
      suffering,
      cravings
    });
    return {
      acknowledged: true,
      diagnosis,
      response: "Applying the Four Noble Truths framework to understand and address this suffering.",
      nextStep: `Focus on ${diagnosis.path.focusArea} practice: ${diagnosis.path.practices[0]}`
    };
  }
  /**
   * Observe the dependent origination chain in action
   */
  observeDependentOrigination() {
    const chainState = this.dependentOrigination.getChainState();
    const activeLinks = chainState.filter((l) => l.hasArisen).map((l) => l.name);
    return `Dependent Origination observed:
Active links: ${activeLinks.join(" \u2192 ")}
Liberation point: ${this.dependentOrigination.practiceAtLiberationPoint()}`;
  }
  /**
   * Get current mindfulness level
   */
  get mindfulnessLevel() {
    return this._mindfulnessLevel;
  }
  /**
   * Get current state
   */
  getState() {
    return {
      aggregatesSnapshot: this.aggregates.getSnapshot(),
      pathProgress: this.path.getOverallDevelopment(),
      mindfulnessLevel: this._mindfulnessLevel,
      pendingKarma: this.karmicStream.filter((k) => k.isPotential()).length,
      experienceCount: this.experienceHistory.length,
      mindState: this.mind.getState()
    };
  }
  /**
   * Get experience history
   */
  getExperienceHistory(count = 10) {
    return this.experienceHistory.slice(-count);
  }
  /**
   * Get karmic stream
   */
  getKarmicStream() {
    return [...this.karmicStream];
  }
  /**
   * @internal Used by BeingSerializer for deserialization.
   * Not part of the public API.
   */
  _restoreState(state) {
    this._mindfulnessLevel = state.mindfulnessLevel;
    this.karmicStream = state.karmicStream;
    this.experienceHistory = state.experienceHistory;
  }
  /**
   * Serialize this being to a plain JSON-compatible object
   */
  toJSON() {
    return serializeBeing(this);
  }
  /**
   * Restore a Being from serialized data
   */
  static fromJSON(data) {
    return deserializeBeing(data);
  }
  /**
   * Get a summary of this being
   */
  getSummary() {
    const state = this.getState();
    return `
BEING STATE SUMMARY

AGGREGATES:
  Form vitality: ${state.aggregatesSnapshot.form.vitality}/10
  Current feeling: ${state.aggregatesSnapshot.feeling.currentTone}
  Mind quality: ${state.aggregatesSnapshot.mentalFormations.dominantQuality}

PATH DEVELOPMENT:
  Overall progress: ${state.pathProgress.toFixed(1)}/10
  Mindfulness level: ${state.mindfulnessLevel}/10
  ${this.path.isBalanced() ? "Path is balanced" : "Path needs balancing"}

KARMA:
  Pending karmic seeds: ${state.pendingKarma}
  Total experiences: ${state.experienceCount}

MIND:
  Calm: ${state.mindState.isCalm ? "Yes" : "No"}
  Focused: ${state.mindState.isFocused ? "Yes" : "No"}
  Dominant factors: ${state.mindState.dominantFactors.join(", ") || "None"}

INSIGHT:
  ${this.aggregates.searchForSelf().conclusion}
    `.trim();
  }
};

// src/cli/utils/state.ts
var StateManager = class {
  beingsDir;
  constructor(stateDir2) {
    this.beingsDir = path.join(stateDir2, "beings");
  }
  loadBeing(name) {
    const filePath = this.beingPath(name);
    if (!fs.existsSync(filePath)) {
      return new Being();
    }
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      return Being.fromJSON(data);
    } catch (err) {
      throw new Error(`Failed to load being "${name}": ${err.message}`);
    }
  }
  hasBeing(name) {
    return fs.existsSync(this.beingPath(name));
  }
  /** Load a being that must already exist (used by the MCP server). */
  loadExistingBeing(name) {
    if (!this.hasBeing(name)) {
      throw new Error(
        `Being not found: "${name}". Create it with buddha_create_being or list existing beings with buddha_list_beings.`
      );
    }
    return this.loadBeing(name);
  }
  saveBeing(name, being) {
    fs.mkdirSync(this.beingsDir, { recursive: true });
    const filePath = this.beingPath(name);
    fs.writeFileSync(filePath, JSON.stringify(being.toJSON(), null, 2));
  }
  listBeings() {
    if (!fs.existsSync(this.beingsDir)) {
      return [];
    }
    return fs.readdirSync(this.beingsDir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  }
  deleteBeing(name) {
    const filePath = this.beingPath(name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  beingPath(name) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error(`Invalid being name: "${name}". Names may only contain letters, numbers, hyphens, and underscores.`);
    }
    return path.join(this.beingsDir, `${name}.json`);
  }
};

// src/koan/koans.ts
var BUILT_IN_KOANS = [
  {
    id: "mu",
    title: "Zhaozhou's Dog",
    case: 'A monk asked Zhaozhou: "Does a dog have Buddha-nature?" Zhaozhou replied: "Mu."',
    source: "Gateless Gate, Case 1",
    hint: "Mu is not yes or no."
  },
  {
    id: "one-hand",
    title: "One Hand Clapping",
    case: 'Hakuin asked: "You know the sound of two hands clapping. What is the sound of one hand?"',
    source: "Hakuin Ekaku",
    hint: "Listen without ears."
  },
  {
    id: "stone-mind",
    title: "The Stone in the Mind",
    case: 'H\u014Dgen pointed to a rock and asked: "Is this stone inside or outside your mind?" The master said: "Inside my mind." H\u014Dgen replied: "It must be very heavy to carry a stone in your mind."',
    source: "Nishitani, Religion and Nothingness"
  },
  {
    id: "flag-wind",
    title: "The Flag and the Wind",
    case: 'Two monks were arguing about a flag flapping in the wind. One said: "The flag is moving." The other said: "The wind is moving." The Sixth Patriarch said: "Neither the flag nor the wind is moving. It is your mind that moves."',
    source: "Platform Sutra"
  },
  {
    id: "marrow",
    title: "Bodhidharma's Marrow",
    case: 'Bodhidharma asked his four disciples to express their understanding. Three gave verbal answers. The fourth, Huike, simply bowed in silence. Bodhidharma said: "You express my marrow."',
    source: "Denkoroku",
    hint: "What speaks louder than words?"
  },
  {
    id: "nansen-cat",
    title: "Nansen's Cat",
    case: 'Nansen saw monks of the eastern and western halls fighting over a cat. He held up the cat and said: "If any of you can say a turning word, I will spare the cat." No one answered, so Nansen cut the cat in two. That evening, Zhaozhou returned and Nansen told him what happened. Zhaozhou took off his sandals, placed them on his head, and walked out. Nansen said: "If you had been there, you could have saved the cat."',
    source: "Gateless Gate, Case 14"
  },
  {
    id: "fan-wind",
    title: "The Fan and the Wind",
    case: 'A monk asked: "The nature of the wind is constantly abiding and reaches everywhere. Why then, sir, do you still use a fan?" The master just fanned himself.',
    source: "D\u014Dgen, Genj\u014Dk\u014Dan",
    hint: "Practice is not separate from realization."
  },
  {
    id: "original-face",
    title: "The Original Face",
    case: 'Huineng asked Hui Ming: "Without thinking of good or evil, at this very moment, what is your original face \u2014 the face you had before your parents were born?"',
    source: "Platform Sutra"
  }
];

// src/koan/KoanGenerator.ts
var INTELLECTUAL_LENGTH = 15;
var TRAP_PATTERNS = {
  binary: [
    /^(yes|no|true|false|right|wrong)[.!?\s]*$/i,
    /\b(both|neither)\b/i,
    /\b(exists?|does(?:n't| not) exist)\b/i,
    /\b(it is|it isn't|it does|it doesn't)\s*$/i
  ],
  intellectual: [
    /\bbecause\b/i,
    /\bmeans that\b/i,
    /\btherefore\b/i,
    /\brepresents?\b/i,
    /\bsymbolizes?\b/i,
    /\bimplies?\b/i,
    /\bin other words\b/i
  ],
  seeking: [
    /\bis this (the )?(right|correct)\b/i,
    /\bis this the answer\b/i,
    /\bwhat('s| is) the answer\b/i,
    /\bam I (right|correct|close)\b/i,
    /\bI think maybe\b/i,
    /\bI('m| am) not sure\b/i,
    /\bperhaps\b/i
  ],
  nihilistic: [
    /\bnothing (matters|exists|is real)\b/i,
    /\bdoes(?:n't| not) matter\b/i,
    /\bmeaningless\b/i,
    /\bpointless\b/i,
    /\bno point\b/i,
    /\bit('s| is) all (empty|void|illusion)\b/i,
    /\beverything is nothing\b/i
  ],
  grasping: [
    /\bthe answer is\b/i,
    /\bthe meaning is\b/i,
    /\bit means\b/i,
    /\bthis (means|represents|symbolizes)\b/i,
    /\bthe point is\b/i,
    /\bwhat .+ (really )?(means|is about)\b/i
  ]
};
var TRAP_REFLECTIONS = {
  binary: "You reach for yes or no, but the koan lives between the fingers of that grasp.",
  intellectual: "The mind builds a raft of concepts \u2014 but who will carry the raft?",
  seeking: 'Seeking the "right" answer is itself the trap. Who is seeking?',
  nihilistic: "Emptiness is not nothingness. The flower still blooms.",
  grasping: 'To say "the answer is..." is to hold water in a clenched fist.'
};
var NON_DUAL_REFLECTION = "The mind is quiet. What remains?";
var KoanGenerator = class {
  koans;
  constructor() {
    this.koans = BUILT_IN_KOANS;
  }
  /**
   * Present a koan. If no id is given, returns a random koan.
   */
  present(id) {
    if (id !== void 0) {
      const koan = this.koans.find((k) => k.id === id);
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
  contemplate(koanId, response) {
    const koan = this.present(koanId);
    if (!response.trim()) {
      throw new Error("A response is required for contemplation.");
    }
    const trapsDetected = this.detectTraps(response);
    const reflection = trapsDetected.length > 0 ? TRAP_REFLECTIONS[trapsDetected[0]] : NON_DUAL_REFLECTION;
    return {
      koan,
      response,
      trapsDetected,
      reflection,
      isNonDual: trapsDetected.length === 0
    };
  }
  /**
   * Return the full collection of available koans.
   */
  getCollection() {
    return this.koans;
  }
  detectTraps(response) {
    const traps = [];
    for (const [trap, patterns] of Object.entries(TRAP_PATTERNS)) {
      if (trap === "intellectual") {
        const wordCount = response.trim().split(/\s+/).length;
        if (wordCount >= INTELLECTUAL_LENGTH && patterns.some((p) => p.test(response))) {
          traps.push(trap);
        }
      } else {
        if (patterns.some((p) => p.test(response))) {
          traps.push(trap);
        }
      }
    }
    return traps;
  }
};

// src/simulation/PoisonArrow.ts
var STAGES = [
  { stage: "recognize", truth: "dukkha" },
  { stage: "investigate", truth: "samudaya" },
  { stage: "release", truth: "nirodha" },
  { stage: "practice", truth: "magga" }
];
var PoisonArrow = class {
  suffering;
  stepHistory = [];
  constructor(suffering) {
    if (!suffering.trim()) {
      throw new Error("Suffering must be named before it can be addressed.");
    }
    this.suffering = suffering;
  }
  /**
   * Advance to the next cessation stage.
   * Throws if the arrow has already been removed (all 4 steps complete).
   */
  step() {
    if (this.isComplete()) {
      throw new Error(
        "The arrow has already been removed. There is nothing more to do."
      );
    }
    const index = this.stepHistory.length;
    const { stage, truth } = STAGES[index];
    const cessationStep = {
      stage,
      truth,
      insight: this.generateInsight(stage),
      guidance: this.generateGuidance(stage)
    };
    this.stepHistory.push(cessationStep);
    return cessationStep;
  }
  /**
   * Get the current stage, or null if no steps have been taken.
   */
  getCurrentStage() {
    if (this.stepHistory.length === 0) return null;
    return this.stepHistory[this.stepHistory.length - 1].stage;
  }
  /**
   * True when all four steps have been completed.
   */
  isComplete() {
    return this.stepHistory.length >= STAGES.length;
  }
  /**
   * Read-only history of steps taken so far.
   */
  getSteps() {
    return [...this.stepHistory];
  }
  /**
   * Text summary of the cessation path so far.
   */
  getSummary() {
    const lines = [`Suffering: "${this.suffering}"`, ""];
    for (const s of this.stepHistory) {
      lines.push(`[${s.stage}] (${s.truth})`);
      lines.push(`  Insight: ${s.insight}`);
      lines.push(`  Guidance: ${s.guidance}`);
      lines.push("");
    }
    if (this.isComplete()) {
      lines.push("The arrow has been removed.");
    } else {
      lines.push(
        `${STAGES.length - this.stepHistory.length} step(s) remaining.`
      );
    }
    return lines.join("\n").trim();
  }
  generateInsight(stage) {
    switch (stage) {
      case "recognize":
        return `This is suffering: "${this.suffering}". Acknowledging it clearly, without denial or dramatization, is the first step.`;
      case "investigate":
        return `The suffering is sustained by craving \u2014 wanting things to be different than they are. What resistance or clinging is fueling "${this.suffering}"?`;
      case "release":
        return `Cessation is possible. The suffering of "${this.suffering}" is not permanent \u2014 it depends on conditions that can change.`;
      case "practice":
        return `The path forward: meet "${this.suffering}" with wise attention, not with further craving or aversion.`;
    }
  }
  generateGuidance(stage) {
    switch (stage) {
      case "recognize":
        return "Sit with the experience. Name it. Do not push it away or pull it closer.";
      case "investigate":
        return 'Ask: "What am I wanting right now? What am I resisting?" Look for the second arrow.';
      case "release":
        return "You do not need to force letting go. Simply see that the clinging is optional.";
      case "practice":
        return "Return attention to this moment. The arrow is out. What remains is just life, as it is.";
    }
  }
};

// src/mcp/handlers.ts
var koanGenerator = new KoanGenerator();
function createBeing(sm2, name) {
  const being = new Being();
  sm2.saveBeing(name, being);
  return being.getSummary();
}
function listBeings(sm2) {
  return sm2.listBeings();
}
function deleteBeing(sm2, name) {
  sm2.deleteBeing(name);
  return `Being "${name}" deleted.`;
}
function getStatus(sm2, name) {
  const being = sm2.loadExistingBeing(name);
  return { summary: being.getSummary(), state: being.getState() };
}
function experienceSensory(sm2, name, input) {
  const being = sm2.loadExistingBeing(name);
  const result = being.experience(input);
  sm2.saveBeing(name, being);
  return result;
}
function act(sm2, name, description, intensity, root) {
  const being = sm2.loadExistingBeing(name);
  const karma = being.act(description, intensity, root);
  sm2.saveBeing(name, being);
  return karma;
}
function ripenKarma(sm2, name) {
  const being = sm2.loadExistingBeing(name);
  const results = being.receiveKarmicResults();
  sm2.saveBeing(name, being);
  return results;
}
function meditate(sm2, name, duration, effort) {
  const being = sm2.loadExistingBeing(name);
  const result = being.meditate(duration, effort);
  sm2.saveBeing(name, being);
  return result;
}
function diagnose(sm2, name, suffering, cravings) {
  const being = sm2.loadExistingBeing(name);
  const result = being.faceSuffering(suffering, cravings);
  sm2.saveBeing(name, being);
  return result;
}
function inquiry(sm2, name) {
  const being = sm2.loadExistingBeing(name);
  const result = being.investigateSelf();
  sm2.saveBeing(name, being);
  return result;
}
function chain(sm2, name) {
  const being = sm2.loadExistingBeing(name);
  return being.observeDependentOrigination();
}
function presentKoan(id) {
  return koanGenerator.present(id);
}
function contemplateKoan(koanId, response) {
  return koanGenerator.contemplate(koanId, response);
}
function sitWithSuffering(suffering) {
  const sim = new PoisonArrow(suffering);
  const steps = [];
  while (!sim.isComplete()) {
    const step = sim.step();
    steps.push({ stage: step.stage, truth: step.truth, insight: step.insight, guidance: step.guidance });
  }
  return { suffering, steps, summary: sim.getSummary() };
}

// src/mcp/index.ts
var stateDir = process.env.BUDDHA_STATE_DIR || path2.join(os.homedir(), ".buddha");
var sm = new StateManager(stateDir);
var server = new McpServer({
  name: "buddha-js",
  version: "0.1.0"
});
var nameSchema = {
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/).describe("Being name (letters, numbers, hyphens, underscores)")
};
var intensitySchema = z.number().int().min(0).max(10).describe("Intensity level (0-10)");
var senseBaseSchema = z.enum(["eye", "ear", "nose", "tongue", "body", "mind"]).describe("Sense base");
var rootSchema = z.enum([
  "greed",
  "aversion",
  "delusion",
  "non-greed",
  "non-aversion",
  "non-delusion"
]).optional().describe("Root cause");
var dukkhaTypeSchema = z.enum(["dukkha-dukkha", "viparinama-dukkha", "sankhara-dukkha"]).describe("Type of suffering");
var cravingTypeSchema = z.enum(["sensory", "becoming", "non-becoming"]).describe("Type of craving");
server.tool(
  "buddha_list_beings",
  "List all saved beings",
  {},
  async () => {
    try {
      return { content: [{ type: "text", text: JSON.stringify(listBeings(sm)) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
server.tool(
  "buddha_create_being",
  "Create a new being and persist it to disk",
  nameSchema,
  async ({ name }) => {
    try {
      const summary = createBeing(sm, name);
      return {
        content: [{ type: "text", text: summary }]
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error creating being: ${err.message}` }],
        isError: true
      };
    }
  }
);
server.tool(
  "buddha_delete_being",
  "Delete a saved being",
  nameSchema,
  async ({ name }) => {
    try {
      const message = deleteBeing(sm, name);
      return {
        content: [{ type: "text", text: message }]
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error deleting being: ${err.message}` }],
        isError: true
      };
    }
  }
);
server.tool(
  "buddha_status",
  "Get the current status of a being",
  nameSchema,
  async ({ name }) => {
    try {
      const { summary, state } = getStatus(sm, name);
      return {
        content: [
          { type: "text", text: summary },
          { type: "text", text: JSON.stringify(state, null, 2) }
        ]
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error getting status: ${err.message}` }],
        isError: true
      };
    }
  }
);
server.tool(
  "buddha_experience",
  "Process a sensory experience through the five aggregates",
  {
    ...nameSchema,
    senseBase: senseBaseSchema,
    object: z.string().describe("What is experienced"),
    intensity: intensitySchema,
    valence: z.enum(["pleasant", "unpleasant", "neutral"]).optional().describe("Hedonic tone of the experience (default: neutral). Independent of intensity.")
  },
  async ({ name, senseBase, object, intensity, valence }) => {
    try {
      const result = experienceSensory(sm, name, {
        senseBase,
        object,
        intensity,
        valence
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
server.tool(
  "buddha_act",
  "Perform an intentional action that creates karma. Karmic quality (wholesome/unwholesome) is determined by the root; omit root for a neutral act.",
  {
    ...nameSchema,
    description: z.string().describe("Description of the intentional action"),
    intensity: intensitySchema,
    root: rootSchema
  },
  async ({ name, description, intensity, root }) => {
    try {
      const result = act(
        sm,
        name,
        description,
        intensity,
        root
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
server.tool(
  "buddha_karma_ripen",
  "Check for and receive any ripened karmic results",
  nameSchema,
  async ({ name }) => {
    try {
      const results = ripenKarma(sm, name);
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
server.tool(
  "buddha_meditate",
  "Conduct a meditation session \u2014 develops path factors, mindfulness, and generates insights",
  {
    ...nameSchema,
    duration: z.number().positive().describe("Duration in seconds"),
    effort: intensitySchema.describe("Meditation effort (0-10)")
  },
  async ({ name, duration, effort }) => {
    try {
      const result = meditate(sm, name, duration, effort);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
server.tool(
  "buddha_diagnose",
  "Diagnose suffering using the Four Noble Truths framework",
  {
    ...nameSchema,
    suffering: z.array(dukkhaTypeSchema).min(1).describe("Types of suffering present"),
    cravings: z.array(cravingTypeSchema).min(1).describe("Types of craving driving the suffering")
  },
  async ({ name, suffering, cravings }) => {
    try {
      const result = diagnose(sm, name, suffering, cravings);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
server.tool(
  "buddha_inquiry",
  "Investigate the nature of self \u2014 search for an unchanging essence across the five aggregates",
  nameSchema,
  async ({ name }) => {
    try {
      const result = inquiry(sm, name);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
server.tool(
  "buddha_chain",
  "Visualize the 12 links of dependent origination",
  nameSchema,
  async ({ name }) => {
    try {
      return { content: [{ type: "text", text: chain(sm, name) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
server.tool(
  "buddha_koan",
  "Present a Zen koan for contemplation. Available: mu, one-hand, stone-mind, flag-wind, marrow, nansen-cat, fan-wind, original-face",
  { id: z.string().optional().describe("Koan ID (omit for random)") },
  async ({ id }) => {
    try {
      const koan = presentKoan(id);
      return { content: [{ type: "text", text: JSON.stringify(koan, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
server.tool(
  "buddha_contemplate",
  "Submit a response to a koan \u2014 evaluates for dualism traps: binary, intellectual, seeking, nihilistic, grasping",
  {
    koanId: z.string().describe("ID of the koan being contemplated"),
    response: z.string().describe("Your contemplative response to the koan")
  },
  async ({ koanId, response }) => {
    try {
      const result = contemplateKoan(koanId, response);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
server.tool(
  "buddha_sit",
  "Guided cessation via the Poison Arrow method (Cula-Malunkyovada Sutta): four steps \u2014 recognize, investigate, release, practice \u2014 one per Noble Truth. Stateless; no being required. Use when someone (or an agent stuck in a loop) needs quick relief from a named suffering without deep analysis.",
  {
    suffering: z.string().min(1).describe("The suffering or problem being sat with")
  },
  async ({ suffering }) => {
    try {
      const result = sitWithSuffering(suffering);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Buddha.js MCP Server running on stdio");
}
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
