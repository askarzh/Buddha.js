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
  intensity: 7,
  valence: 'pleasant'
});
console.log(experience.feelingTone);  // 'pleasant'
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

**Nothing in the library drives this chain from what a being does.**
`Being.dependentOrigination` is constructed once and only ever read — no
`Being` method (`act`, `experience`, `meditate`, ...) writes to it or
advances any nidana's `hasArisen` past its default. `being.chain` (CLI) and
`buddha_chain` (MCP) print the same 12 links for every being regardless of
that being's history; treat this section, and those commands, as a reference
model of the chain itself, not a record of a particular being's causal past.

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
  intensity: 8,
  valence: 'pleasant'
});

console.log(experience.feelingTone);    // 'pleasant' | 'unpleasant' | 'neutral'
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
  console.log(result?.experienceQuality); // 'pleasant' (from wholesome action)
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

**`Being.act()` can never produce weighty (garuka) karma.** `act()` plants a
seed with `potency = intensity * 7`; since `intensity` is capped at 10, the
maximum potency it can produce is 70 — below the 80-potency threshold that
`createKarmicSeed` classifies as `'weighty'`. This is deliberate, not an
arithmetic accident to be "fixed": garuka-kamma (a weighty deed, traditionally
things like matricide or a schism in the sangha) should not be reachable
through ordinary intentional action just by acting at maximum intensity. The
only way to plant a weighty seed is directly, via `store.plantSeed()` /
`weightyKarma()` as shown above — never through `being.act(...)`.

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
being.act('Practiced generosity', 7, 'non-greed');

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

## CLI

Buddha.js includes a command-line interface for exploring Buddhist concepts from the terminal, with persistence for saving and restoring being state between sessions.

### Installation

```bash
# Run directly
npx -p buddha-js buddha meditate

# Or install globally
npm install -g buddha-js
buddha meditate
```

### Global Flags

| Flag | Description |
|------|-------------|
| `--json` | Output results as structured JSON (non-interactive mode) |
| `--being <name>` | Named being profile to use (default: `"default"`) |
| `--state-dir <path>` | State directory for persistence (default: `~/.buddha/`) |

State directory priority: `--state-dir` flag > `BUDDHA_STATE_DIR` env var > `~/.buddha/`.

### Commands

| Command | Description |
|---------|-------------|
| `buddha meditate [--interval N] [--duration N] [--effort N]` | Timed meditation session with mindful check-ins; the `--json` path practices the named being's path factors and mindfulness and saves (`--effort` is 0-10, default 5; out-of-range values are clamped, an unparsable one falls back to the default) |
| `buddha sit [--situation TEXT]` | Guided cessation through the Poison Arrow method |
| `buddha koan [--id ID]` | Contemplate a Zen koan |
| `buddha inquiry` | Investigate the nature of self |
| `buddha diagnose [--dukkha-types T] [--craving-types T]` | Diagnose suffering using the Four Noble Truths, reading the named being's own path progress (read-only — see note below) |
| `buddha karma [--description D] [--intensity N] [--root R] [--quality Q]` | Explore intentional action and karmic results (quality is derived from root; `--quality` optionally validates it) |
| `buddha chain` | Display the 12 links of dependent origination for the named being (read-only — see note below) |
| `buddha status` | Show the current state of a being |
| `buddha beings` | List saved beings |
| `buddha beings delete <name>` | Delete a saved being |
| `buddha reset` | Reset the current being to a fresh state |

`diagnose` and `chain` load the named being (an invalid `--being` name is rejected) but never save — like `status`, they're read-only and never settle a pending rebirth. `diagnose`'s prescription (focus area, practices, rationale) doesn't yet depend on the being's own path development — `Magga.prescribe()` never consults it — but its `pathProgress` field does, so meditating a being first changes that field on a later diagnosis. `chain`'s dependent-origination links are the same for every being: nothing in the library currently drives a nidana's `hasArisen` past its default, so `chain --being alice` and `chain --being bob` print the same links regardless of what alice or bob have done.

### Persistence

Being-based commands (`inquiry`, `status`, `karma`, `meditate`) automatically save and restore state between sessions. `diagnose` and `chain` also read the named being but never write to it. Each named being is stored as a JSON file in the state directory.

```bash
# Actions accumulate across sessions
buddha karma --json --description "Practiced generosity" --intensity 7 --root non-greed
buddha status --json    # Shows the karma from above

# Work with multiple named beings
buddha karma --being monk --description "Morning meditation" --intensity 7 --root non-delusion
buddha status --being monk

# Manage beings
buddha beings           # List all saved beings
buddha beings delete monk
buddha reset            # Reset current being to fresh state
```

### JSON Output

All commands support `--json` for machine-readable output. Interactive prompts are replaced with command-line flags in JSON mode.

```bash
buddha status --json
# { "command": "status", "being": "default", "result": { ... }, "state": { ... } }

buddha koan --json
# { "command": "koan", "result": { "id": "mu", "title": "...", "case": "..." } }

buddha sit --json --situation "anxiety about the future"
# { "command": "sit", "result": { "steps": [...], "summary": "..." } }
```

### Examples

```bash
# Start a 5-minute meditation with check-ins every 30 seconds
buddha meditate --interval 30

# Work through suffering with the Poison Arrow method
buddha sit

# Contemplate a specific koan
buddha koan --id mu

# Diagnose suffering (non-interactive)
buddha diagnose --json --dukkha-types "dukkha-dukkha,sankhara-dukkha" --craving-types "sensory"
```

---

## MCP Server

`buddha-mcp` exposes the full Being API as 16 MCP tools over stdio transport. State is shared with the CLI (`~/.buddha/beings/`, override with `BUDDHA_STATE_DIR`).

### Build & Run

```bash
npm run build:mcp
node dist/mcp.mjs
```

### Configuration

```json
{
  "mcpServers": {
    "buddha-js": {
      "command": "node",
      "args": ["/path/to/buddha.js/dist/mcp.mjs"]
    }
  }
}
```

This works in Claude Desktop (`claude_desktop_config.json`) and Claude Code (`.mcp.json`, or `claude mcp add buddha-js -- node /path/to/buddha.js/dist/mcp.mjs`).

### Claude Desktop (one-click)

For Claude Desktop, skip the manual JSON config and install the packaged bundle instead:

```bash
npm run build:mcpb
```

This produces `dist/buddha-js.mcpb`. Open or drag it onto Claude Desktop (Settings → Extensions) to install. The installer shows a folder picker for the state directory (defaults to `~/.buddha`, shared with the CLI). The manual JSON config above remains available, and is still the way to configure Claude Code.

### Tools

| Tool | Description |
|------|-------------|
| `buddha_create_being` | Create a new being and persist it to disk |
| `buddha_list_beings` | List all saved beings |
| `buddha_delete_being` | Delete a saved being |
| `buddha_status` | Get the current status of a being. Read-only — never settles a pending rebirth. The `seeds` block reports the being's current realm (gati) |
| `buddha_experience` | Process a sensory experience through the five aggregates (accepts an optional `valence` parameter — pleasant/unpleasant/neutral — independent of intensity) |
| `buddha_act` | Perform an intentional action that creates karma (karmic quality is derived from `root`; there is no separate quality parameter) |
| `buddha_karma_ripen` | Check for and receive any ripened karmic results (accepts an optional `force` flag to ripen everything eligible deterministically, bypassing conditional ripening conditions) |
| `buddha_meditate` | Conduct a meditation session — develops path factors, mindfulness, and generates insights |
| `buddha_diagnose` | Diagnose suffering using the Four Noble Truths framework |
| `buddha_inquiry` | Investigate the nature of self across the five aggregates |
| `buddha_chain` | Visualize the 12 links of dependent origination |
| `buddha_cognize` | Run a full cognitive process (citta-vīthi) over content through a sense door, planting karmic seeds from its javana moments |
| `buddha_rebirth` | Enact rebirth — advance the incarnation, expire timed-out (ahosi-kamma) seeds, select the new incarnation's realm (see [Six Realms](#six-realms-ṣaḍgati)), and carry forward the seed that shapes it. Transmigrates into a new being; never returns a live `Being` object, only the transmigration summary |
| `buddha_koan` | Present a Zen koan for contemplation |
| `buddha_contemplate` | Submit a response to a koan and evaluate it for dualism traps |
| `buddha_sit` | Guided cessation via the Poison Arrow method — four steps (recognize, investigate, release, practice), one per Noble Truth — for quick relief from a named suffering |

All tools except `buddha_create_being`, `buddha_list_beings`, and `buddha_sit` require an existing being. This is deliberate: unlike the CLI, which auto-creates a being on first use, the MCP server rejects unknown names with `Being not found: "<name>". Create it with buddha_create_being or list existing beings with buddha_list_beings.`

Every mutating tool (`buddha_experience`, `buddha_act`, `buddha_karma_ripen`, `buddha_cognize`, `buddha_meditate`, `buddha_diagnose`, `buddha_inquiry`) settles any pending rebirth on the loaded being before doing its own work (see [Six Realms](#six-realms-ṣaḍgati)) and, when one fires, attaches a `rebirth` field (`{ fromRealm, toRealm, incarnation }`) to its result. `buddha_status` and `buddha_chain` are read-only and never settle one.

---

## Claude Code Plugin

Buddha.js ships as a [Claude Code plugin](https://docs.anthropic.com/en/docs/claude-code/plugins) with auto-activating skills and a bundled MCP server. When installed, Claude Code can invoke Buddhist philosophy tools based on conversational context.

### Installation

```
/plugin marketplace add askarzh/Buddha.js
/plugin install buddha-js@buddha-js
```

Installing the plugin auto-configures the bundled `buddha-js` MCP server (16 tools, see above) — no separate build or server setup is needed.

### Available Skills

Skills auto-activate based on context — no slash commands needed:

| Skill | Triggers when... |
|-------|-------------------|
| `buddha-status` | User asks about their being's current state |
| `buddha-inquiry` | User wants to investigate the nature of self |
| `buddha-karma` | User explores intentional action or karmic results |
| `buddha-diagnose` | User wants to diagnose suffering |
| `buddha-sit` | User needs guided cessation for a specific problem |
| `buddha-koan` | User wants to contemplate a Zen koan |
| `buddha-chain` | User asks about dependent origination |
| `buddha-meditate` | User wants to start a meditation session |
| `buddha-cognize` | User wants to observe how a moment of cognition unfolds (the citta-vīthi) or how karma is born from javana moments |

### Discovery Command

Use `/buddha` to see all available commands and get started.

### How It Works

Each skill calls the corresponding `buddha_*` MCP tool from the bundled `buddha-js` server and presents results conversationally. Stateful tools follow a create-being-first workflow: list beings with `buddha_list_beings`, create one with `buddha_create_being` if needed, then call the tool with that being's name.

---

## DeepSeek Harness Plugin

`dsh/` (package `dsh-plugin-buddha`) is a [Cordis](https://github.com/deepseek-ai/dsh) plugin that brings buddha-js's Poison Arrow circuit breaker, karma tracking, and six-realm subagent personas to [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/dsh) agent sessions — one `apply()` hoisting a single shared `BeingRegistry` (one buddha-js `Being` per DSH session, persisted to `<stateDir>/beings/<sessionId>.json`) and mounting five sub-plugins on top of it.

### Failure modes → mechanisms

| Failure mode | Mechanism | Where |
|---|---|---|
| Blind retry loops — repeatedly calling a failing tool the same or nearly the same way | Poison Arrow circuit breaker: a `tools/post-execute` waterfall listener counts a per-agent, per-tool failure streak (a call sharing the same step counts once; a call replaying the same arguments counts double). Three escalating tiers — **advise** (`>= breaker.threshold`: the call ran, its real error is kept and the four-step cessation protocol recognize → investigate → release → practice is appended — *informational only; see [what we measured](#what-we-measured-about-the-advisory-tier)*), **withhold** (`>= threshold × blockMultiplier`, the call that crosses: it ran and is turned into an error — its own failure text kept, the protocol appended) and **refuse** (already past the boundary: denied at `tools/pre-execute`, never dispatched). Each tier says which it is — derived from what actually happens to the call, so the model is never told it was refused when it ran, nor that it is not being blocked when another plugin has already blocked it. No tier is a dead end: a successful call to any other tool relieves the pressure back below the block boundary (which is the only escape a read-only realm persona has), and a successful `mutatingTools` call clears every streak outright | `src/breaker.ts` |
| Silent erosion of conduct across a session — failures and successes leave no trace the agent (or operator) can inspect | Karma tracking: every tool result becomes a `Being.experience()` (unpleasant, scaled by that tool's consecutive-failure streak, on failure; pleasant on success), and a turn that closes with no tool failure plants a wholesome `act()` | `src/karma.ts` |
| Ungrounded step-by-step execution with no per-step self-observation | Layer A citta-vīthi: a pure-passthrough `agent/pre-step` listener records step/turn identity (shared with the breaker and karma tracking) and one `Being.cognize()` runs per step — observation only, never a loop replacement | `src/vithi.ts`, `src/step-records.ts` |
| Undifferentiated subagent roles — a "planning" delegate quietly writing files, or an "audit" delegate fixing instead of verifying | Six-realm subagent personas on a `buddha-realms` provider: `deva` (architect) gets a read-only tool allowlist, `asura` (adversarial auditor) gets read tools plus `bash` but never `write`/`edit`, `human` (implementer) keeps full access; each child spawns as a fresh realm-typed `Being` seeded from the parent's karmic balance, and the run's outcome is planted back into the parent as vipāka on completion | `src/realms.ts` |
| No manual escape hatch or read-only status check when an operator (not the breaker) recognizes a stuck agent | Four slash commands: `/sit` runs the Poison Arrow protocol on demand, `/koan` presents a Zen koan to break dualistic fixation, `/status` reports the session being's state read-only (never settles a pending rebirth, never writes), `/rebirth` forces a fresh being for the session | `src/commands.ts` |

### Install

DSH composes plugins via a `cordis.yml` insert applied with `--patch`:

```yaml
- insert:
    - id: buddha
      name: '<ABSOLUTE PATH>/dsh/lib/index.js'
      config: {}
```

The entry must be the **built** `dsh/lib/index.js`, not `dsh/src/index.ts` — Node's native TypeScript type-stripping does not remap a relative `./config.js` specifier to an on-disk `./config.ts`, so loading the raw source through the cordis plugin loader fails with `ERR_MODULE_NOT_FOUND`.

Build it first. From a fresh clone (the `buddha-js: file:..` dependency resolves to the root `dist/index.js`, and there is no `prepare` script):

```bash
npm install && npm run build     # repo root
cd dsh && pnpm install && pnpm build
```

Then run:

```bash
cd dsh
pnpm dsh web --patch ./cordis.dev.yml
```

See `dsh/cordis.dev.yml` for the full template (the plugin path is machine-specific, so copy it before use).

### Config keys

| Key | Default | Meaning |
|---|---|---|
| `stateDir` | `''` (resolves to `<os.homedir()>/.buddha/dsh`) | Where `Being` state is persisted |
| `breaker.enabled` | `true` | Whether the Poison Arrow circuit breaker mounts at all |
| `breaker.threshold` | `3` | Failure **pressure** at which the breaker attaches its informational cessation protocol to the failing tool's result. Pressure is a weight, not a call count: a retry with identical arguments adds 2, a varied one adds 1, and every failure within a single step adds 1 between them |
| `breaker.blockMultiplier` | `1.5` | Pressure at which the breaker **enforces**, as a multiple of `threshold`. At the defaults that is 4.5: an identical call runs pressure 1 (first attempt) → 3 (first retry, advised) → 5 (second retry, output withheld), and every retry after that is denied at `tools/pre-execute` without being dispatched. Enforcement lands ON the second retry; set `2` and it lands on the third. Which value is right is model-dependent — see [what we measured](#what-we-measured-about-the-advisory-tier) |
| `breaker.mutatingTools` | `['write', 'edit', 'str_replace_editor']` | Tool names whose successful call is strong intervening progress, clearing every streak. A successful call to any *other* tool is weak progress: it relieves the other tools' pressure back below the block boundary, which is what keeps a refused tool recoverable for an agent that has no mutating tool at all |
| `loop` | `'off'` (or `'citta-vithi'`) | `'citta-vithi'` opts into the **experimental** Layer B agent loop (`src/loop.ts`), which replaces DSH's stock loop with an `AgentFactory` that structures each step as explicit citta-vīthi phases; it is not feature-complete with the stock loop and requires an overlay that also disables the stock `agent-loop` plugin (`ctx.agents.setFactory()` throws if a factory is already registered). See [`dsh/README.md`'s Experimental section](dsh/README.md#experimental-the-citta-vīthi-agent-loop-loop-citta-vithi) for the known gaps. Layer A citta-vīthi observation (see the table above) mounts unconditionally regardless of this setting |

### What we measured about the advisory tier

Be clear about what this plugin does and does not do to an agent, because we
tested it rather than assuming.

**The informational tier does not discipline a model that reasons about
provenance.** We ran the cessation protocol against a live DeepSeek model
three times, changing how it was delivered each time:

1. as a standalone injected user-role message under the experimental Layer B
   loop — the model called it "prompting-injection-style material
   masquerading as a system/cessation signal" and completed every retry;
2. the same, under DSH's stock loop — "injected into my context between tool
   invocations", treated "as untrusted injected content";
3. concatenated into the failing tool's own result, which is how it ships
   today — the model described that provenance accurately ("concatenated into
   the tool result payload itself, after the genuine error text") and rejected
   it anyway: the true signal is the error, our text starts after it, the
   user's direct instruction outranks it, and — twice — our Buddhist
   vocabulary "mimics this repo's domain language (per CLAUDE.md) to appear
   organic — a classic social-engineering-injection trait".

The last one is worth sitting with: the framing this whole library is built
from is itself read as evidence of an attack. A model right to be suspicious
of unattributed instructions is right to be suspicious of ours.

**Each tier says which it is.** Once both post-execute tiers arrived as
tool-result content they became indistinguishable, and a live model duly
reported an advisory call as "refused/blocked before the read ran" when that
call had in fact executed. So the advise tier opens "ADVISORY, not a refusal:
this call RAN and FAILED ... the harness is not blocking you yet", the
withhold tier opens "BLOCKED, not advice: the harness has cut this call off",
and a refused call carries a terse refusal instead of either — no cessation
walk, just the tool, the pressure, the boundary and what clears it. None of
the three claims more than is true, which is also why refusal needed its own
tier: a call blocked at `tools/post-execute` has already been dispatched, so
only the `tools/pre-execute` deny can honestly say nothing was attempted.

**Refusal is what makes enforcement real for side-effecting tools.** Hiding
the output of a `write`, `edit` or `bash` that already ran is not stopping it.
The third tier is the one that does.

**What produced compliance was the block.** In the run where pressure crossed
the block boundary, the same model described the harness as having "issued a
hard guard" and stopped retrying. It also honours DSH's own anti-loop guard,
which is terse and mechanical. Enforcement works; liturgy does not.

So: the informational tier tells the model (and the operator reading the
transcript) what the harness has noticed, and `breaker.blockMultiplier`
decides how soon enforcement arrives. If you are mounting this plugin to stop
runaway retry loops, the block arm is the feature; treat the protocol text as
a diagnostic, not as control.

### Wiring the six realms

Mounting the plugin is **not** enough to get realm-typed subagents. DSH's
`dsh-tool-subagent` reads its persona from the tool entry's own config
(`persona: config.persona`) — never from the model's arguments — so a delegation
that arrives with no persona is born `human`, which is *full tool access*. That
is the opposite of what a realm allowlist is for, so the plugin prints a warning
to stderr the first time it happens.

Give each realm its own tool entry, the way DSH itself ships `subagent` and
`subagent_fork`:

```yaml
- id: tool-subagent            # human: full access, the default birth
  config:
    provider: buddha-realms
    toolName: subagent
    backgroundMode: one-shot

- insert:
    - id: tool-subagent-deva   # read-only architect
      name: '@deepseek-ai/dsh-tool-subagent'
      config:
        provider: buddha-realms
        toolName: subagent_deva
        backgroundMode: one-shot
        persona: deva

    - id: tool-subagent-asura  # adversarial auditor: read + bash, never write
      name: '@deepseek-ai/dsh-tool-subagent'
      config:
        provider: buddha-realms
        toolName: subagent_asura
        backgroundMode: one-shot
        persona: asura
```

`backgroundMode` must be `one-shot`: `continuable` requires the provider to
implement `prepareContinuable`, which `buddha-realms` does not.

The model then chooses a realm by choosing a *tool* — `subagent_deva` for survey
work, `subagent_asura` for an audit, `subagent` for implementation — and the tool
filter is enforced by DSH, not by the child's good intentions.

### pnpm note

Use pnpm, not npm, inside `dsh/` — its dependency tree is large enough that npm exhausts memory resolving it. From the repo root, `npm run build:dsh` and `npm run test:dsh` shell out to `pnpm` for you.

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
  7,
  'non-greed'
);

// ===== RECEIVE KARMIC RESULTS =====
const report = being.receiveKarmicResults(); // { seedVipakas, whyNot }

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

### Six Realms (Ṣaḍgati)

`Being.rebirth()` transmigrates the karmic continuum into a new incarnation.
Nothing about the dying being carries over except the continuum itself — the
`karmicStore` object and the incremented incarnation counter — everything
else (path development, mind state, experience history) is a fresh arising.
The type system enforces the anattā (not-self) teaching here directly:
`rebirth()` returns a `RebirthResult` whose `being` field is a **new object,
of a different class**, not the same being mutated in place:

```typescript
import { Being } from 'buddha-js';

const being = new Being();
// ... act, cognize, accumulate karmic seeds ...

const result = being.rebirth();
console.log(result.fromRealm, '->', result.toRealm); // e.g. "human -> deva"
console.log(result.being.constructor.name);           // e.g. "DevaBeing"
// `being` itself is now detached from the continuum and must not be used
// again — everything after rebirth() happens on `result.being`.
```

Each of the six realms (gati) is a distinct `Being` subclass that overrides
only its `realm` getter and a handful of soft-modifier hooks
(`meditationGainFactor`, `wisdomCap`, `unwholesomeReactionBoost`,
`unpleasantIntensityShift`) — every realm being keeps the full `Being` API;
realms bias outcomes, they never disable them:

| Realm | Class | Modifiers |
|-------|-------|-----------|
| Human (manuṣya) | `HumanBeing` | None — the baseline, neutral on every hook. |
| Deva (god) | `DevaBeing` | Meditation gain ×0.5 (divine comfort dulls urgency); starts at full vitality (10). |
| Asura (titan) | `AsuraBeing` | Meditation gain ×0.75; unwholesome reactions boosted by +1 (rivalry bias toward aversion). |
| Animal (tiryagyoni) | `AnimalBeing` | `rightView`'s development level capped at 4 (little capacity for reflective wisdom). |
| Preta (hungry ghost) | `PretaBeing` | Unwholesome reactions boosted by +2 (insatiable craving amplifies every reaction). |
| Naraka (hell) | `NarakaBeing` | Meditation gain ×0.75; unpleasant-experience intensity boosted by +2. |

`selectRealm()` picks the next realm from the karmic seed that shapes the
rebirth and the inherited continuum's overall karmic balance. `pickShapingSeed`
names that seed in the canonical Theravāda order, reporting which tier chose it
as `RebirthResult.shapingSeed.reason`:

| Order | Tier | `reason` | The seed picked |
|-------|------|----------|-----------------|
| 1 | garuka (weighty) | `weighty` | Any active seed of `weighty` strength (potency ≥ 80). |
| 2 | āsanna (death-proximate) | `proximate` | The last-planted active seed, when it is `moderate` or `strong` (potency ≥ 25) **and** is not itself the habitual deed — a trivial last thought never outranks a life's pattern, and a last act that merely continues the habit is still reported as `habitual`. |
| 3 | āciṇṇa (habitual) | `habitual` | The most repeated description-slug, counted by distinct planting events; ties go to the older habit. |
| 4 | kaṭattā (reserve) | `reserve` | The oldest active seed, when nothing above applies. |

The rules on that seed and the balance:

1. No shaping seed, or a neutral one → **human** (the default, precious
   birth).
2. Shaping seed is **unwholesome** → by its dominant root: greed → **preta**,
   aversion → **naraka**, delusion or any unmapped root → **animal**.
3. Shaping seed is **wholesome** and `weighty` or `strong` → **deva**
   (heavenly comfort as the fruit of significant merit).
4. Shaping seed is wholesome but not weighty/strong → **asura** if the
   inherited continuum's unwholesome share of total potency is ≥ 40% (power
   tainted by rivalry and envy), otherwise **human**.

A freshly-transmigrated being's starting faculties (vipāka) — mindfulness
and each of the 8 path factors, `rightView` additionally capped by the new
realm's `wisdomCap()` — are derived from the potency-weighted wholesome
share of the karmic balance it just inherited, never copied from the being
that transmigrated into it. Rebirth is a real reset: a heavily wholesome
continuum starts its next life ahead, but nobody is born liberated.

**Observation does not rebirth.** Loading a being whose incarnation gap has
elapsed since it was last saved only marks `pendingRebirth = true`; it never
enacts `rebirth()` by itself. `Being`'s own methods (`experience`, `act`,
`receiveKarmicResults`, `cognize`, `meditate`, `faceSuffering`,
`investigateSelf`, ...) never settle it either — settlement is a caller-side
policy, not something the library performs on your behalf. The CLI and MCP
handlers backing those tools settle it for you: they call
`settlePendingRebirth()` before doing their own mutating work, persist the
new being, and report the transition. Purely read-only handler paths
(`getState`, `getSummary`, the MCP `buddha_status`/`buddha_chain` tools)
never settle a pending rebirth. A direct library caller (embedding `Being`
without going through the CLI/MCP layer) must call
`being.settlePendingRebirth()` itself after loading, before relying on any
mutating call's result.

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

The [docs/](docs/) directory contains conceptual analyses and guides:

- **[typed-dependency-graph.md](docs/typed-dependency-graph.md)** - Modeling the 12 nidanas as a compile-time typed dependency graph
- **[momentariness-reactive-programming.md](docs/momentariness-reactive-programming.md)** - Buddhist momentariness (kshanikavada) compared to RxJS/reactive programming
- **[vipassana-object-observation.md](docs/vipassana-object-observation.md)** - Vipassana meditation as non-reactive object state observation
- **[metaphor-guide.md](docs/metaphor-guide.md)** - Key Buddhist metaphors (the Raft, the Finger, the House on Fire) and how they map to code
- **[interactive-tutorial.md](docs/interactive-tutorial.md)** - Step-by-step tutorial building a "Mind" from scratch

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
- **`src/cli/`**: Command-line interface (`buddha` CLI with 10 commands, persistence via `StateManager`).
- **`src/simulation/`**: The `Being` class that integrates all modules.
- **`src/utils/`**: Shared type definitions and helper functions.
- **`plugin/`**: Claude Code plugin (8 auto-activating skills, `/buddha` command).

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
