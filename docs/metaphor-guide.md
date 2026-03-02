# Metaphor Guide: Raft, Finger, and Burning House

Three classic Buddhist metaphors illuminate how to work with Buddha.js — and more importantly, how not to.

The common thread: **don't confuse the tool for the goal.** These classes model Buddhist concepts, but the models are not the concepts themselves. Use them to develop understanding, then let the understanding guide you.

---

## The Raft (Kullupama Sutta)

### The Teaching

A man builds a raft to cross a dangerous river. Once safely on the other shore, he faces a choice: carry the raft on his head for the rest of the journey, or leave it behind?

> "The teaching is like a raft for crossing over, not for grasping." — *The Diamond Sutra*

The dharma — the entire body of Buddhist teaching — is a raft. It is essential during the crossing and useless after. Clinging to the teaching itself becomes another form of attachment.

### In Code

The classes in Buddha.js are rafts. `EightfoldPath`, `FourNobleTruths`, `DependentOrigination` — these are tools for understanding suffering, its causes, and the way beyond it. They are not the understanding itself.

Use an `EightfoldPath` to explore how the eight factors develop. Practice with it. But know that the path object's `.getOverallDevelopment()` returning `7.5` is not enlightenment — it's a number in memory. The insight you gain from working through the model is what matters.

### Example

```typescript
import { EightfoldPath } from 'buddha-js';

// Build the raft
const path = new EightfoldPath();

// Use it to cross — develop understanding
path.practiceCategory('wisdom', 8);
path.practiceCategory('ethics', 7);
path.practiceCategory('meditation', 9);

console.log(path.getOverallDevelopment()); // 6.25

// The number is the raft. The understanding is the other shore.
// Don't carry the raft on your head.
```

---

## The Finger Pointing at the Moon

### The Teaching

A teacher points at the moon. A student stares at the finger.

The finger is necessary — without it, you might never look up. But fixating on the finger means you miss the moon entirely. Every teaching, every concept, every model is a finger. The moon is direct understanding.

### In Code

Buddha.js implements the Two Truths doctrine through `getConventionalTruth()` and `getUltimateTruth()` on every `Phenomenon`. This distinction *is* the finger-and-moon relationship:

- **Conventional truth** is the finger — how a phenomenon functions, what it's useful for, how to work with it practically. This is the level of the code.
- **Ultimate truth** is the moon — the recognition that the phenomenon is empty of inherent existence, arising only through conditions. This is what the code points toward.

The `Sunyata` class analyzes emptiness, but the analysis itself is another finger. Reading that `hasInherentExistence: false` is not the same as *seeing* emptiness.

### Example

```typescript
import { Rupa, Sunyata } from 'buddha-js';

const form = new Rupa();

// The finger — how form functions conventionally
const finger = form.getConventionalTruth();
// { level: 'conventional', description: 'Form is the physical aspect...', usefulFor: [...] }

// The moon — what form actually is
const moon = form.getUltimateTruth();
// { level: 'ultimate', description: 'Form arises from conditions...', transcends: [...] }

// Even the emptiness analysis is a finger
const emptiness = new Sunyata();
const insight = emptiness.examine(form);
// { isEmpty: true, hasInherentExistence: false, dependsOn: [...] }

// The object `insight` is not insight. It points toward it.
```

---

## The House on Fire (Lotus Sutra)

### The Teaching

A father returns home to find his house engulfed in flames. His children are inside, playing, unaware of the danger. He calls to them, but they're absorbed in their games and won't leave.

So he calls out: "Come outside! I have wonderful toy carts waiting for you!" The children rush out, excited about the carts. They are saved — not by understanding the nature of fire, but by a skillful simplification that met them where they were.

This is **upaya** — skillful means. Sometimes the full teaching is too much. A simplified tool that actually gets used is worth more than a complete system that overwhelms.

### In Code

The `PoisonArrow` class is the toy cart. It doesn't model all twelve links of dependent origination. It doesn't analyze the five aggregates or track karmic seeds. It does one thing: walk you through the Four Noble Truths applied to a specific, immediate suffering, in four steps.

The `buddha sit` CLI command is another toy cart — it wraps `PoisonArrow` in a terminal interface anyone can use. `FourNobleTruths.diagnose()` is the full system; `PoisonArrow` is the simplified version that meets you in the burning house.

### Example

```typescript
import { PoisonArrow } from 'buddha-js';

// The house is on fire — suffering is immediate
const arrow = new PoisonArrow('anxiety about the future');

// The toy cart — four simple steps, no philosophical overhead
while (!arrow.isComplete()) {
  const step = arrow.step();
  console.log(`${step.stage}: ${step.insight}`);
  // recognize: "The suffering 'anxiety about the future' is present and real..."
  // investigate: "Looking deeper into what sustains this suffering..."
  // release: "Seeing the possibility of this suffering ceasing..."
  // practice: "Taking the first step on the path..."
}

// The children are out of the house.
// Understanding can come later. Safety comes first.
```

---

## The Chariot (Questions of King Milinda)

### The Teaching

King Milinda asks the monk Nagasena about the nature of the self. Nagasena asks if the pole, the axle, the wheels, or the framework are the "chariot". When the king admits they are not, Nagasena explains that the word "chariot" is merely a conventional designation—a convenient label applied to the right assemblage of parts.

Similarly, the word "person" or "self" is just a conventional name given to the interacting collection of the Five Aggregates (form, feeling, perception, mental formations, and consciousness).

### In Code

This perfectly describes **Composition over Inheritance** and the abstraction of objects in JavaScript.

In Buddha.js, the `FiveAggregates` class is the chariot. It doesn't contain a magical "Self" property. It simply coordinates the five constituent `Skandha` components. When you call `getSkandhas()`, you see the parts. 

The `Being` class takes this further—it's just a grouping of `FiveAggregates`, a `Mind`, and a `KarmicStore`. There is no core essence, just organized components interacting.

### Example

```typescript
import { FiveAggregates, Rupa, Vedana } from 'buddha-js';

// The "chariot" components
const aggregates = new FiveAggregates();
aggregates.addSkandha(new Rupa('physical body'));
aggregates.addSkandha(new Vedana('pleasant feeling'));

// We call this a "person" conventionally
console.log(aggregates.analyze()); 
// { totalSkandhas: 2, hasSelf: false, components: [...] }

// Ultimate truth: there is no "self" here, only parts
const ultimate = aggregates.getUltimateTruth();
// "An interacting system of 5 aggregates... empty of a separate self."
```

---

## The Storehouse Consciousness (Yogācāra)

### The Teaching

In the Mind-Only school, every intentional action plants a "seed" (*bīja*) in the deepest layer of the mind, known as the *ālaya-vijñāna* or "storehouse consciousness". This storehouse is the repository of all past tendencies, which lie dormant as seeds until the right conditions cause them to mature and project our experience of reality. 

### In Code

This maps flawlessly to **State Management** and **Event-Driven Architecture**.

Buddha.js models this literally with the `KarmicEventSystem` and `KarmicStore`. Actions (`Intention`) dispatch events (create `KarmicSeed` objects). These seeds sit dormant in the storehouse array until a specific condition (a `RipeningCondition` returning true) triggers them to "unzip" and render into active consciousness as a `KarmicVipaka` (result).

### Example

```typescript
import { KarmicStore, createKarmicSeed } from 'buddha-js';

const storehouse = new KarmicStore();

// An action plants a seed
const action = createKarmicSeed({
  quality: 'wholesome',
  description: 'helping a friend',
  minDelay: 1000 // dormant period
});

storehouse.plantSeed(action);

// The storehouse ticker runs, waiting for conditions
// When conditions match, the seed ripens into Vipaka (result)
storehouse.on('ripened', (event) => {
  console.log(`Karmic result experienced: ${event.vipaka.description}`);
});
```

---

## The Spider in the Web (Abhidhamma)

### The Teaching

In the Theravada tradition, the mind is said to have an inactive baseline mode called *bhavanga*, occurring in deep sleep or the micro-moments between active thoughts. To explain this, texts compare the baseline mind to a spider resting in the middle of its web. When an insect strikes a thread on the web, the spider wakes up, runs out along the thread, investigates, consumes the insect, and returns to rest.

### In Code

This is an exact conceptual match for **the Event Loop** in asynchronous programming (like JavaScript or Node.js). 

The `Mind` class and its `citta` (consciousness moments) stream operate like this. The spider resting in the center is the main thread in an idle state. The insect hitting the web is an event trigger (like an incoming percept to the `Salayatana` / sense doors). The mind darts out to process it, generating mental factors (`MentalFactor`), and then returns to empty waiting.

### Example

```typescript
import { Mind, Citta } from 'buddha-js';

const mind = new Mind();
const spider = mind.getBaselineState(); // empty consciousness

// An event hits the sense web
setTimeout(() => {
  const visualPercept = new Citta('eye-consciousness');
  mind.process(visualPercept); // The spider darts out
  // ... mental factors arise and cease ...
  mind.returnToBaseline(); // The spider returns to the center
}, 500);
```

---

## Conclusion

All three metaphors point to the same truth: **the map is not the territory.**

- The **Raft** says: use the tool, then let it go.
- The **Finger** says: look where the tool points, not at the tool itself.
- The **House on Fire** says: sometimes a simple tool that works *now* is better than a complete one that comes too late.

Buddha.js is all three. Use it to explore, understand, and practice. And when the understanding takes root — when you no longer need the models to see impermanence, unsatisfactoriness, and not-self — leave the raft on the shore.
