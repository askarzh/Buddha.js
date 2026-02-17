# Interactive Tutorial: Building a Mind from Scratch

This tutorial walks you through constructing a Mind in Buddha.js, piece by piece. By the end, you'll understand how mental factors compose into a mind, and how meditation transforms it.

**Prerequisites:** `npm install buddha-js` and a TypeScript environment.

---

## Step 1: The Atom — MentalFactor

Everything starts with a single mental factor. In Buddhist psychology, mental factors (cetasikas) are the qualities that accompany consciousness. They arise, they color experience, and they pass away.

```typescript
import { MentalFactor } from 'buddha-js';

// Create a mental factor: name, Sanskrit name, quality
const greed = new MentalFactor('Greed', 'Lobha', 'unwholesome');

console.log(greed.name);         // 'Greed'
console.log(greed.sanskritName);  // 'Lobha'
console.log(greed.quality);      // 'unwholesome'
console.log(greed.isActive);     // false
console.log(greed.intensity);    // 0
```

A mental factor starts inactive — present in potential but not coloring the mind. To bring it to life, activate it with an intensity (0-10):

```typescript
greed.activate(7);

console.log(greed.isActive);     // true
console.log(greed.intensity);    // 7
```

And like all phenomena in Buddhism, it can cease:

```typescript
greed.deactivate();

console.log(greed.isActive);     // false
console.log(greed.intensity);    // 0
```

This is impermanence in action. `MentalFactor` extends `Phenomenon` — every mental factor arises and ceases based on conditions. No mental state is permanent.

---

## Step 2: Three Flavors — Wholesome, Unwholesome, Variable

Mental factors come in three qualities:

```typescript
import { MentalFactor } from 'buddha-js';

// Variable — neutral, present in all consciousness
const attention = new MentalFactor('Attention', 'Manasikara', 'variable');

// Unwholesome — causes suffering
const aversion = new MentalFactor('Aversion', 'Dosa', 'unwholesome');

// Wholesome — leads toward freedom
const mindfulness = new MentalFactor('Mindfulness', 'Sati', 'wholesome');
```

In the Mind class, 12 factors are pre-configured across these three categories:

| Category | Factors | Role |
|----------|---------|------|
| **Variable** (5) | Contact, Feeling, Perception, Intention, Attention | Always present in consciousness |
| **Unwholesome** (3) | Greed, Aversion, Delusion | The three poisons — root causes of suffering |
| **Wholesome** (4) | Mindfulness, Equanimity, Compassion, Wisdom | Antidotes that lead toward liberation |

The Buddhist insight: you don't have a fixed personality. You have a stream of mental factors, some wholesome and some not, arising and passing based on conditions. What you practice, you strengthen.

---

## Step 3: The Container — Mind

Now let's compose these factors into a Mind:

```typescript
import { Mind } from 'buddha-js';

const mind = new Mind();
```

The Mind comes pre-loaded with all 12 factors. You can access any of them:

```typescript
const greed = mind.getFactor('greed');
console.log(greed?.name);      // 'Greed'
console.log(greed?.isActive);  // false

const wisdom = mind.getFactor('wisdom');
console.log(wisdom?.name);     // 'Wisdom'
console.log(wisdom?.isActive); // false
```

### Activating Wholesome Factors

Let's activate mindfulness and see how the mind state changes:

```typescript
mind.activateFactor('mindfulness', 7);
mind.activateFactor('wisdom', 5);

const state = mind.getState();
console.log(state.isCalm);           // true (no unwholesome factors active)
console.log(state.isFocused);        // true (mindfulness active + clarity >= 5)
console.log(state.dominantFactors);  // ['Mindfulness', 'Wisdom']
console.log(state.clarity);          // 5
console.log(state.stability);        // 5
```

### Disturbing the Mind

Now activate an unwholesome factor:

```typescript
mind.activateFactor('greed', 8);

const disturbed = mind.getState();
console.log(disturbed.isCalm);           // false (unwholesome factor active!)
console.log(disturbed.dominantFactors);  // ['Greed', 'Mindfulness', 'Wisdom']
```

Notice that greed doesn't replace mindfulness — both can be active simultaneously. But the mind is no longer calm. This is realistic: you can be mindful of your greed.

### Calming the Mind

The `calm()` method deactivates all unwholesome factors:

```typescript
mind.calm();

const calmed = mind.getState();
console.log(calmed.isCalm);           // true
console.log(calmed.dominantFactors);  // ['Mindfulness', 'Wisdom']
console.log(calmed.stability);        // 6 (increased by 1!)
```

Each time you calm the mind, stability increases. This mirrors real practice: the more often you settle the mind, the more naturally stable it becomes.

---

## Step 4: Practice — Meditation Transforms the Mind

In the full library, a `Being` has a `Mind` (along with aggregates, path factors, and more). Let's see how meditation ties it all together:

```typescript
import { Being } from 'buddha-js';

const being = new Being();

// Check the mind before meditation
const before = being.mind.getState();
console.log(before.isCalm);     // true (fresh mind, no disturbances)
console.log(before.isFocused);  // false (mindfulness not yet activated)
```

### First Sit — Light Effort

```typescript
const session1 = being.meditate(10, 3);

console.log(session1.mindfulnessLevel);    // 0 (low effort, minimal gain)
console.log(session1.concentrationLevel);  // Path factor development level
console.log(session1.insight);             // null (not enough concentration yet)

// But mindfulness was activated in the mind
const after1 = being.mind.getState();
console.log(after1.isFocused);  // false (effort 3 < clarity threshold)
```

### Second Sit — Strong Effort

```typescript
const session2 = being.meditate(30, 8);

console.log(session2.mindfulnessLevel);    // 2+ (significant gain)
console.log(session2.insight);
// 'Beginning stability: Moments of calm and clarity amidst distraction.'

// The mind has been transformed
const after2 = being.mind.getState();
console.log(after2.isFocused);             // true (effort 8 > 5)
console.log(after2.dominantFactors);       // ['Mindfulness', ...]
```

### Deep Practice — Sustained Effort

```typescript
// Multiple sessions deepen the practice
being.meditate(30, 9);
being.meditate(30, 9);
const deep = being.meditate(30, 9);

console.log(deep.mindfulnessLevel);  // 10 (maxed out)
console.log(deep.insight);
// 'Clear seeing: Impermanence of mental states becomes obvious...'
console.log(deep.pathProgress);      // Overall path development (0-10)
```

This is the Buddha's core teaching in code: what you practice, you become. Each `meditate()` call activates mindfulness, develops path factors, and calms the unwholesome. Over time, the mind transforms.

---

## Step 5: What's Next

You've built a Mind from scratch — from a single `MentalFactor` to a full `Being` with a meditating mind. Here's where to go from here:

### The Advanced Model: Citta

The `Mind` class models 12 factors with a simple activation API. For the full Abhidhamma model, explore `Citta`:

```typescript
import { Citta } from 'buddha-js';

const citta = new Citta();
```

`Citta` models **52 mental factors** and the **17-moment cognitive process** (citta-vithi) where consciousness processes sense objects moment by moment. This is where karma is actually created — during the 7 javana (impulsion) moments of each cognitive process.

### Further Reading

- **[Typed Dependency Graph](./typed-dependency-graph.md)** — How the 12 links of dependent origination form a typed graph
- **[Momentariness and Reactive Programming](./momentariness-reactive-programming.md)** — Consciousness as an RxJS stream
- **[Vipassana as Object Observation](./vipassana-object-observation.md)** — Mindfulness as non-reactive state observation
- **[Metaphor Guide](./metaphor-guide.md)** — Three classic metaphors for working with the library

### Try the CLI

For interactive exploration without writing code:

```bash
buddha meditate --interval 30   # Timed meditation session
buddha inquiry                  # Investigate the nature of self
buddha diagnose                 # Diagnose suffering with the Four Noble Truths
```
