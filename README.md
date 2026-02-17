# Buddha.js

A TypeScript library that programmatically models Buddhist philosophy using object-oriented patterns. It provides classes and abstractions for core Buddhist concepts, allowing developers to explore, simulate, and reason about these ideas in code.

## Philosophy

Buddha.js treats Buddhist concepts as first-class programming constructs:

- **Phenomena** arise and cease based on conditions (dependency injection meets dependent origination)
- **The Three Marks** are built into every phenomenon (impermanence, unsatisfactoriness, not-self)
- **Events propagate** through the 12-link chain of dependent origination
- **Karma operates** as an event system with delayed execution
- **Meditation** develops factors that transform the mind

### The Raft and the Finger

In the spirit of *Buddha Plain and Simple*, this library views these code models as a "raft"—a tool to cross the river of confusion, to be left behind once understanding is reached. The classes and objects here are not the Truth itself, but merely "fingers pointing at the moon."

> "The teaching is like a raft for crossing over, not for grasping." — *The Diamond Sutra*

This is not a religious library—it's a philosophical modeling tool that demonstrates how ancient wisdom maps to modern programming patterns.

## Installation

```bash
npm install buddha-js
```

## Quick Start

```typescript
import { Being, DependentOrigination, FourNobleTruths, KarmicStore } from 'buddha-js';

// Create a sentient being
const being = new Being();

// Process a sensory experience
const experience = being.experience({
  senseBase: 'eye',
  object: 'beautiful flower',
  intensity: 7
});
console.log(experience.feeling);  // 'pleasant'
console.log(experience.reactions); // Mental reactions to the experience

// Practice meditation
const result = being.meditate(30, 8);
console.log(result.insight);
// "Clear seeing: Impermanence of mental states becomes obvious..."

// Investigate the self
const inquiry = being.investigateSelf();
console.log(inquiry.conclusion);
// "What is called 'self' is a convenient designation for a process..."

// Work with dependent origination
const chain = new DependentOrigination();
for (const event of chain.simulateArisingSequence()) {
  console.log(`${event.link.name} arises`);
}
```

## English Aliases (Plain English API)

For those who prefer plain English terms over Sanskrit, the library exports readable aliases:

```typescript
import {
  Dissatisfaction,      // Dukkha
  Confusion,            // Avidya
  Craving,              // Tanha
  Clinging,             // Upadana
  OriginOfSuffering,    // Samudaya
  PathToCessation       // Magga
} from 'buddha-js';

const problem = new Dissatisfaction();
console.log(problem.getTask()); // "To be fully understood"

const rootCause = new Confusion();
console.log(rootCause.getExplanation().meaning);
```

---

## Core Concepts

### Phenomenon (Base Class)

All Buddhist concepts extend `Phenomenon`, which embodies the Three Marks of Existence:

```typescript
import { Phenomenon } from 'buddha-js';

// Every phenomenon has these properties (always true):
phenomenon.impermanence;       // true - all things change
phenomenon.unsatisfactoriness; // true - cannot provide lasting satisfaction
phenomenon.notSelf;            // true - no independent, unchanging essence

// Phenomena arise and cease based on conditions:
phenomenon.arise();    // When conditions are met
phenomenon.cease();    // When conditions change
phenomenon.isPresent;  // Currently arisen but not ceased

// Examine from two perspectives:
phenomenon.getConventionalTruth();  // Practical, everyday understanding
phenomenon.getUltimateTruth();      // Deeper analysis of emptiness
```

### Two Truths

Every phenomenon can be examined from two perspectives:

```typescript
const aggregate = new Rupa(); // Form aggregate

// Conventional truth - how it functions in daily life
const conventional = aggregate.getConventionalTruth();
// { level: 'conventional', description: 'Form is the physical aspect...', usefulFor: [...] }

// Ultimate truth - analysis reveals no inherent essence
const ultimate = aggregate.getUltimateTruth();
// { level: 'ultimate', description: 'Form arises from conditions...', transcends: [...] }
```

---

## Four Noble Truths

The diagnostic framework for understanding and addressing suffering. As Steve Hagen notes, life inevitably brings "83 problems" (difficulties we can't avoid), but the **84th problem** is our desire to have no problems. This framework addresses that 84th problem.

```typescript
import { FourNobleTruths, EightfoldPath } from 'buddha-js';

const path = new EightfoldPath();
const truths = new FourNobleTruths(path);

// Diagnose a situation
const diagnosis = truths.diagnose({
  suffering: ['existential', 'mental'],
  cravings: ['craving-for-sensual-pleasures', 'craving-for-existence'],
  intensity: 7
});

console.log(diagnosis.suffering);
// { types: [...], intensity: 'strong', deepestType: 'existential' }

console.log(diagnosis.cause);
// { cravingTypes: [...], rootPoisons: [...], intensity: 7 }

console.log(diagnosis.cessationPossible);
// { isPossible: true, difficulty: 'moderate', timeframe: 'gradual', obstacles: [...] }

console.log(diagnosis.path);
// { focusArea: 'wisdom', practices: [...], urgency: 'high' }
```

### Individual Truths

```typescript
// First Truth: Dukkha (Suffering)
const dukkha = truths.dukkha;
dukkha.analyze(['physical', 'mental']);
dukkha.getTask(); // "To be fully understood"

// Second Truth: Samudaya (Origin)
const samudaya = truths.samudaya;
samudaya.analyze(['craving-for-sensual-pleasures'], 6);

// Third Truth: Nirodha (Cessation)
const nirodha = truths.nirodha;
nirodha.isPossible(causeAnalysis);

// Fourth Truth: Magga (Path)
const magga = truths.magga;
magga.prescribe(causeAnalysis);
```

### Two Arrows / The 84th Problem

A farmer once came to the Buddha listing all his problems. The Buddha replied: "Everyone has 83 problems. I can't help with those. But I can help with the 84th — wanting to have no problems."

This connects to the Sallatha Sutta's "two arrows" teaching: the first arrow is unavoidable pain; the second is the suffering we add through resistance. The `TwoArrows` class (aliased as `EightyFourthProblem`) helps distinguish between the two.

```typescript
import { TwoArrows } from 'buddha-js';
// or: import { EightyFourthProblem } from 'buddha-js';

const arrows = new TwoArrows();

// Situation with both arrows
const result = arrows.analyze({
  pain: 'knee pain while sitting',
  mentalReactions: ['wishing it would stop', 'fear it will get worse'],
});

result.totalArrows;            // 'two'
result.isEightyFourthProblem;  // true — the second arrow IS the 84th problem
result.firstArrow;             // { description: 'knee pain...', isUnavoidable: true }
result.secondArrow;            // { reactions: [...], count: 2, isOptional: true }
result.insight;                // Explanation of first vs second arrow

// Situation with equanimity (no second arrow)
const equanimous = arrows.analyze({
  pain: 'knee pain while sitting',
  mentalReactions: [],
});

equanimous.totalArrows;            // 'one'
equanimous.isEightyFourthProblem;  // false

// Track recognition over time
arrows.hasRecognizedSecondArrow(); // true (from the first analysis)
arrows.getAnalysisCount();         // 2
```

---

## Eightfold Path

The practical path of transformation, organized into three trainings:

```typescript
import { EightfoldPath } from 'buddha-js';

const path = new EightfoldPath();

// ===== WISDOM (Prajna) =====
path.rightView.practice(7);           // See reality clearly
path.rightIntention.practice(6);      // Cultivate wholesome intention

// ===== ETHICS (Sila) =====
path.rightSpeech.practice(8);         // Truthful, kind speech
path.rightAction.practice(7);         // Ethical conduct
path.rightLivelihood.practice(6);     // Wholesome livelihood

// ===== MEDITATION (Samadhi) =====
path.rightEffort.practice(8);         // Balanced effort
path.rightMindfulness.practice(9);    // Present awareness
path.rightConcentration.practice(7);  // Focused attention

// Check development
console.log(path.getOverallDevelopment());  // 0-10 average
console.log(path.isBalanced());             // Are all factors developed?
console.log(path.getLeastDeveloped());      // Which factor needs work?

// Get factor by category
const wisdomFactors = path.getFactorsByCategory('wisdom');
const ethicsFactors = path.getFactorsByCategory('ethics');
const meditationFactors = path.getFactorsByCategory('meditation');
```

---

## Dependent Origination

The 12-link chain showing how suffering arises and can cease:

```typescript
import { DependentOrigination } from 'buddha-js';

const chain = new DependentOrigination();

// The 12 links
chain.ignorance;      // 1. Avidya - not seeing clearly
chain.formations;     // 2. Samskara - karmic formations
chain.consciousness;  // 3. Vijnana - descending consciousness
chain.mindBody;       // 4. Nama-rupa - psychophysical organism
chain.sixSenses;      // 5. Salayatana - sense faculties
chain.contact;        // 6. Sparsa - sense contact
chain.feeling;        // 7. Vedana - feeling tone
chain.craving;        // 8. Tanha - craving/thirst
chain.clinging;       // 9. Upadana - grasping
chain.becoming;       // 10. Bhava - karmic momentum
chain.birth;          // 11. Jati - new existence
chain.agingDeath;     // 12. Jaramarana - suffering

// Simulate the chain arising
for (const event of chain.simulateArisingSequence()) {
  console.log(`${event.link.sanskritName} → ${event.link.name}`);
  console.log(`  ${event.explanation.causation}`);
}

// The liberation point: between feeling and craving
chain.practiceAtLiberationPoint();
// "Mindfulness present: Observing feeling without reacting with craving."

// Break the chain (practice cessation)
const result = chain.breakChainAt(8); // Break at craving
console.log(result.reason);
// "Chain broken at Craving. Subsequent links will not arise."

// Get the formulas
chain.getArisingFormula();   // Avidya → Samskara → Vijnana → ...
chain.getCessationFormula(); // cessation of Jaramarana → cessation of Jati → ...
```

---

## Five Aggregates

The components that constitute a "person":

```typescript
import { FiveAggregates } from 'buddha-js';

const aggregates = new FiveAggregates();

// Process an experience through the aggregates
const experience = aggregates.processExperience({
  senseBase: 'eye',
  object: 'sunset',
  intensity: 8
});

console.log(experience.feeling);    // 'pleasant' | 'unpleasant' | 'neutral'
console.log(experience.perception); // 'sunset perceived as sunset'
console.log(experience.reactions);  // Mental reactions

// Search for a self within the aggregates
const inquiry = aggregates.searchForSelf();
console.log(inquiry.foundSelf);     // false
console.log(inquiry.searchedIn);    // ['form', 'feeling', 'perception', ...]
console.log(inquiry.conclusion);
// "No unchanging, independent self found in any aggregate"

// Individual aggregates
aggregates.form;              // Physical body (Rupa)
aggregates.feeling;           // Feeling tone (Vedana)
aggregates.perception;        // Recognition (Samjna)
aggregates.mentalFormations;  // Volitions (Samskara)
aggregates.consciousness;     // Awareness (Vijnana)

// Get current state
const snapshot = aggregates.getSnapshot();
```

---

## Karma

### Basic Karma

```typescript
import { Karma, Intention } from 'buddha-js';

// Create an intention
const intention = new Intention(
  'Help a stranger',
  8,      // intensity (0-10)
  'non-greed'  // root (wholesome or unwholesome)
);

// Create karma from the intention
const karma = new Karma(intention, 8);

// Complete the action
karma.complete();

// Later, karma ripens
if (karma.isPotential()) {
  const result = karma.manifest();
  console.log(result?.feeling);     // 'pleasant' (from wholesome action)
  console.log(result?.intensity);   // Based on original intensity
}
```

### Karmic Event System

An event-driven karma system with delayed execution:

```typescript
import { KarmicStore, wholesomeAction, unwholesomeAction, RipeningConditions } from 'buddha-js';

// Create a karmic store (alaya-vijnana)
const store = new KarmicStore({
  enableAutoRipening: true,
  timeScale: 10  // Speed up time for simulation
});

// Subscribe to karmic events
store.on('seed:planted', (event) => {
  console.log(`Karmic seed planted: ${event.seed?.description}`);
});

store.on('seed:ripened', (event) => {
  console.log(`Karma ripened! Result: ${event.vipaka?.description}`);
  console.log(`Feeling: ${event.vipaka?.quality}`);  // pleasant/unpleasant/neutral
});

// Plant wholesome karma
const generosity = store.plantSeed({
  type: 'bodily',
  quality: 'wholesome',
  description: 'Donated to charity',
  intentionStrength: 8,
  root: 'non-greed',
  ripeningTiming: 'deferred'
});

// Plant unwholesome karma with conditions
const anger = store.plantSeed({
  type: 'verbal',
  quality: 'unwholesome',
  description: 'Spoke harshly in anger',
  intentionStrength: 6,
  root: 'hatred',
  conditions: [
    RipeningConditions.afterTime(5000),
    RipeningConditions.randomChance(0.7)
  ]
});

// Strengthen karma through repetition
store.strengthenSeed(generosity.id, 20);

// Weaken karma through counter-action
store.weakenSeed(anger.id, 15);

// Purify karma through wisdom
store.purifySeed(anger.id);

// Wait for specific karma to ripen (Promise-based)
const result = await store.waitForRipening(generosity.id, 30000);

// Get karmic balance
const balance = store.getKarmicBalance();
console.log(`Wholesome: ${balance.wholesome}`);
console.log(`Unwholesome: ${balance.unwholesome}`);
console.log(`Net balance: ${balance.balance}`);

// Collective karma
const collectiveSeeds = store.createCollectiveKarma(
  ['person1', 'person2', 'person3'],
  { quality: 'wholesome', description: 'Group meditation retreat' }
);
```

#### Helper Functions

```typescript
import { wholesomeAction, unwholesomeAction, immediateKarma, weightyKarma } from 'buddha-js';

// Quick wholesome action
store.plantSeed(wholesomeAction('Helped someone in need', 7, 'bodily'));

// Quick unwholesome action with root
store.plantSeed(unwholesomeAction('Took what was not given', 5, 'greed', 'bodily'));

// Immediate karma (ripens quickly)
store.plantSeed(immediateKarma({
  quality: 'wholesome',
  description: 'Kind word'
}));

// Weighty karma (very strong, ripens multiple times)
store.plantSeed(weightyKarma({
  quality: 'unwholesome',
  description: 'Serious harm'
}));
```

---

## Persistence (Save & Restore)

Save and restore state using `toJSON()`/`fromJSON()` — compatible with `JSON.stringify`/`JSON.parse`. Inspired by the Yogacara concept of *alaya-vijnana* (storehouse consciousness), where karmic seeds are stored as latent potentials and reconstituted when conditions arise.

### KarmicStore Persistence

```typescript
import { KarmicStore } from 'buddha-js';

const store = new KarmicStore({ enableAutoRipening: true, timeScale: 10 });

// Plant seeds, register named conditions...
store.registerCondition('is-mindful', () => mindfulnessLevel > 5);
store.plantSeed({
  type: 'mental',
  quality: 'wholesome',
  description: 'Mindful awareness',
  intentionStrength: 7,
  root: 'non-greed',
  conditions: [{ type: 'conditional', name: 'is-mindful', check: () => mindfulnessLevel > 5, weight: 1 }]
});

// Serialize
const json = store.toJSON();
const str = JSON.stringify(store); // toJSON() called automatically

// Restore
const data = JSON.parse(str);
const restored = KarmicStore.fromJSON(data);

// Re-register condition functions (not serializable)
restored.registerCondition('is-mindful', () => mindfulnessLevel > 5);
restored.rebindConditions(); // Reconnects named conditions from registry
```

### Being Persistence

```typescript
import { Being } from 'buddha-js';

const being = new Being();
being.meditate(30, 8);
being.act('Practiced generosity', 'wholesome', 7, 'non-greed');

// Serialize
const json = being.toJSON();
const str = JSON.stringify(being);

// Restore
const data = JSON.parse(str);
const restored = Being.fromJSON(data);

// Restored state includes:
// - Mindfulness level
// - Path factor development (activation, development level)
// - Mind state (active factors, clarity, stability)
// - Dependent origination chain state
// - Karmic stream (intentions and karma objects)
// - Experience history

// Not restored (starts fresh):
// - Five Aggregates (reactive to new experiences)
// - Event listeners (re-register after restore)
// - Auto-ripening timers (restart manually)
```

### What Gets Serialized

| Component | Serialized | Notes |
| --------- | --------- | ----- |
| Mindfulness level | Yes | Direct value |
| Path factors | Yes | Activation state, development level |
| Mind state | Yes | Active factors, clarity, stability |
| Dependent origination | Yes | Link states (arisen/ceased) |
| Karmic stream | Yes | Intentions and karma objects |
| Experience history | Yes | Past processed experiences |
| Aggregates | Snapshot only | Not restored; reactive state starts fresh |
| Event listeners | No | Re-register after restore |
| Ripening timers | No | Restart via `startAutoRipening()` |
| Condition functions | Named only | Use condition registry for persistence |

---

## Mind and Mental Factors

### Mind (Citta)

```typescript
import { Mind } from 'buddha-js';

const mind = new Mind();

// Activate mental factors
mind.activateFactor('mindfulness', 8);
mind.activateFactor('compassion', 7);
mind.activateFactor('wisdom', 6);

// Deactivate unwholesome factors
mind.deactivateFactor('greed');
mind.deactivateFactor('aversion');

// Calm the mind (deactivates unwholesome factors)
mind.calm();

// Get current state
const state = mind.getState();
console.log(state.isCalm);          // true/false
console.log(state.isFocused);       // true/false
console.log(state.dominantFactors); // Top 3 active factors
console.log(state.clarity);         // 0-10
console.log(state.stability);       // 0-10

// Get active factors
const activeFactors = mind.getActiveFactors();
```

### Citta (Abhidhamma Consciousness Model)

A detailed model of consciousness following the Abhidhamma's 17 mind-moment cognitive process:

```typescript
import { Citta } from 'buddha-js';

const citta = new Citta();

// Process a sense object through the full cognitive sequence
const result = citta.processSenseObject({
  door: 'cakkhu-dvara',  // eye-door
  object: 'visible form',
  impactStrength: 7
});

console.log(result.moments);        // Array of 17 mind-moments
console.log(result.javanaCount);    // Number of impulsion moments (where karma is made)
console.log(result.finalState);     // bhavanga (life-continuum)

// Each moment in the cognitive process:
// 1. bhavanga (life-continuum)
// 2. bhavanga-calana (vibrating)
// 3. bhavangupaccheda (arrest)
// 4. avajjana (adverting)
// 5. panca-vinnana (sense consciousness)
// 6. sampaticchana (receiving)
// 7. santiirana (investigating)
// 8. votthabbana (determining)
// 9-15. javana (7 moments of impulsion) <- karma created here
// 16-17. tadarammana (registering)

// Get classification
const classification = citta.getClassification();
console.log(classification.realm);   // kamavacara | rupavacara | arupavacara | lokuttara
console.log(classification.quality); // kusala | akusala | vipaka | kiriya
console.log(classification.root);    // ahetuka | lobha | dosa | moha | alobha | adosa | amoha
```

---

## Poison Arrow (Quick Cessation)

Based on the Cula-Malunkyovada Sutta (MN 63): a man struck by a poisoned arrow should remove it immediately rather than asking who shot it. The `PoisonArrow` class (aliased as `QuickCessation`) provides a simplified 4-step cessation path — one step per Noble Truth — without requiring configuration of nidanas, aggregates, or karma.

```typescript
import { PoisonArrow } from 'buddha-js';
// or: import { QuickCessation } from 'buddha-js';

const sim = new PoisonArrow('anxiety about the future');

sim.step();
// { stage: 'recognize', truth: 'dukkha',
//   insight: 'This is suffering: "anxiety about the future"...',
//   guidance: 'Sit with the experience. Name it...' }

sim.step();
// { stage: 'investigate', truth: 'samudaya', ... }

sim.step();
// { stage: 'release', truth: 'nirodha', ... }

sim.step();
// { stage: 'practice', truth: 'magga', ... }

sim.isComplete(); // true — the arrow has been removed

// Review the path
console.log(sim.getSummary());
```

---

## Koan Generator

In Zen tradition, a koan is a verbal device used to exhaust the discriminating mind — not a riddle with an answer, but a tool to push beyond conceptual thought. The `KoanGenerator` (aliased as `Riddle`) ships with 8 classic koans and evaluates contemplation responses for dualistic thinking traps.

```typescript
import { KoanGenerator } from 'buddha-js';
// or: import { Riddle } from 'buddha-js';

const generator = new KoanGenerator();

// Present a random koan
const koan = generator.present();
console.log(koan.title); // e.g. "Zhaozhou's Dog"
console.log(koan.case);  // The koan dialogue

// Contemplate with a response
const result = generator.contemplate(koan.id, 'Yes');

result.trapsDetected;  // ['binary'] — caught in yes/no thinking
result.isNonDual;      // false
result.reflection;     // 'You reach for yes or no, but the koan lives...'

// A non-dual response
const quiet = generator.contemplate(koan.id, '🙏');
quiet.isNonDual;       // true
quiet.reflection;      // 'The mind is quiet. What remains?'

// Browse all koans
generator.getCollection(); // 8 classic koans
```

**Dualism traps detected:** `binary` (yes/no), `intellectual` (over-analysis), `seeking` (looking for "the answer"), `nihilistic` ("nothing matters"), `grasping` (definitive claims).

---

## Meditation Timer

Track real-time meditation sessions by recording "mindful moments" (check-ins) versus periods of distraction. Based on the practice of *sati* (mindfulness): quality is measured not by absence of distraction, but by how quickly one recognizes distraction and returns to presence.

Uses an injectable `Clock` interface — defaults to wall-clock time (`Date.now`), but accepts a manual clock for testing and simulation.

```typescript
import { MeditationTimer } from 'buddha-js';
// or: import { SittingTimer } from 'buddha-js';

const timer = new MeditationTimer({
  duration: 300,        // 5-minute session
  intervalBell: 60,     // bell every 60 seconds
  onBell: () => console.log('🔔'),
});

timer.start();

// ... user presses a key to record a mindful moment ...
timer.checkIn();

// ... time passes, user checks in again ...
timer.checkIn();

const session = timer.stop();

session.quality;            // 'scattered' | 'intermittent' | 'sustained' | 'absorbed'
session.mindfulnessRatio;   // 0–1, check-ins vs expected (1 per 30s)
session.distractionPeriods; // Array of { start, end, duration }
session.longestDistraction; // Longest gap in seconds
session.mindfulMoments;     // Total check-in count
```

---

## Being (Simulation)

The `Being` class integrates all concepts to simulate a sentient being:

```typescript
import { Being } from 'buddha-js';

const being = new Being();

// ===== EXPERIENCE =====
const exp = being.experience({
  senseBase: 'ear',
  object: 'beautiful music',
  intensity: 8
});

// ===== INTENTIONAL ACTION =====
const karma = being.act(
  'Helped a friend',
  'wholesome',
  7,
  'non-greed'
);

// ===== RECEIVE KARMIC RESULTS =====
const results = being.receiveKarmicResults();

// ===== MEDITATION =====
const meditation = being.meditate(30, 8);
console.log(meditation.mindfulnessLevel);   // 0-10
console.log(meditation.concentrationLevel); // 0-10
console.log(meditation.insight);            // Generated insight based on levels
console.log(meditation.pathProgress);       // Overall path development

// ===== SELF-INVESTIGATION =====
const selfInquiry = being.investigateSelf();
console.log(selfInquiry.aggregateSearch.foundSelf);      // false
console.log(selfInquiry.dependentOriginationInsight);
console.log(selfInquiry.emptinessInsight);
console.log(selfInquiry.conclusion);

// ===== FACE SUFFERING =====
const response = being.faceSuffering(
  ['existential', 'mental'],
  ['craving-for-sensual-pleasures']
);
console.log(response.diagnosis);
console.log(response.nextStep);

// ===== OBSERVE DEPENDENT ORIGINATION =====
console.log(being.observeDependentOrigination());

// ===== GET STATE =====
const state = being.getState();
console.log(being.getSummary());
```

---

## Emptiness (Sunyata)

Analyze the emptiness of phenomena:

```typescript
import { Sunyata, FiveAggregates } from 'buddha-js';

const emptiness = new Sunyata();
const aggregates = new FiveAggregates();

// Examine any phenomenon for emptiness
const insight = emptiness.examine(aggregates.form);

console.log(insight.phenomenon);      // Name of examined phenomenon
console.log(insight.inherentNature);  // Always 'none' - no independent essence
console.log(insight.dependsOn);       // What conditions it depends on
console.log(insight.explanation);     // Detailed explanation
```

---

## Type Definitions

```typescript
// Feeling tone
type FeelingTone = 'pleasant' | 'unpleasant' | 'neutral';

// Karma quality
type KarmaQuality = 'wholesome' | 'unwholesome' | 'neutral';

// Path categories
type PathCategory = 'wisdom' | 'ethics' | 'meditation';

// Six sense bases
type SenseBase = 'eye' | 'ear' | 'nose' | 'tongue' | 'body' | 'mind';

// Intensity scale
type Intensity = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Types of suffering
type DukkhaType = 'physical' | 'mental' | 'existential' | 'change' | 'conditioned';

// Types of craving
type CravingType =
  | 'craving-for-sensual-pleasures'  // Kama-tanha
  | 'craving-for-existence'          // Bhava-tanha
  | 'craving-for-non-existence';     // Vibhava-tanha

// Unwholesome roots (three poisons)
type UnwholesomeRoot = 'greed' | 'hatred' | 'delusion';

// Wholesome roots
type WholesomeRoot = 'non-greed' | 'non-hatred' | 'non-delusion';

// Mental factor quality
type MentalFactorQuality = 'wholesome' | 'unwholesome' | 'variable';
```

---

## Examples

See the [examples/](examples/) directory for interactive demonstrations:

- **[interactive-demo/](examples/interactive-demo/)** - Comprehensive web demo of all library features
- **[bhavacakra/](examples/bhavacakra/)** - Interactive Wheel of Samsara visualization (Canvas)

---

## Design Documents

The [docs/](docs/) directory contains conceptual analyses:

- **[typed-dependency-graph.md](docs/typed-dependency-graph.md)** - Modeling the 12 nidanas as a compile-time typed dependency graph
- **[momentariness-reactive-programming.md](docs/momentariness-reactive-programming.md)** - Buddhist momentariness (kshanikavada) compared to RxJS/reactive programming
- **[vipassana-object-observation.md](docs/vipassana-object-observation.md)** - Vipassana meditation as non-reactive object state observation

---

## Project Structure

The library is organized into modules reflecting core Buddhist concepts:

- **`src/core/`**: Foundational classes (`Phenomenon`, `ThreeMarks`, `TwoTruths`).
- **`src/four-noble-truths/`**: Diagnostic framework classes.
- **`src/eightfold-path/`**: Classes for the three trainings (Wisdom, Ethics, Meditation).
- **`src/dependent-origination/`**: The 12 links (`Nidana` subclasses) and chain logic.
- **`src/five-aggregates/`**: The components of a person (`Skandha` subclasses).
- **`src/karma/`**: Karma generation, results, and the event-driven store.
- **`src/mind/`**: Consciousness models (`Mind`, `Citta`) and mental factors.
- **`src/emptiness/`**: Tools for analyzing emptiness (`Sunyata`).
- **`src/koan/`**: Zen koan presentation and contemplation (`KoanGenerator`).
- **`src/meditation/`**: Real-time meditation session tracking (`MeditationTimer`).
- **`src/simulation/`**: The `Being` class that integrates all modules.
- **`src/utils/`**: Shared type definitions and helper functions.

---

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

---

## License

MIT

---

## Further Reading

- *What the Buddha Taught* by Walpola Rahula
- *The Heart of the Buddha's Teaching* by Thich Nhat Hanh
- *A Comprehensive Manual of Abhidhamma* by Bhikkhu Bodhi
- *Dependent Origination* by Buddhadasa Bhikkhu
