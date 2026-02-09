# Buddha.js Interactive Demo

A comprehensive web-based demo that showcases all the features of the Buddha.js library through an interactive interface.

## Running

Open `index.html` in any modern web browser:

```bash
# From the Buddha.js root directory
open examples/interactive-demo/index.html

# Or use a local server
python -m http.server 8080
# Then visit http://localhost:8080/examples/interactive-demo/
```

## Features

### Being State Sidebar

A real-time display of the simulated being's current state:
- **Mind state** - Calm/focused status and dominant mental factors
- **Path development** - Progress in wisdom, ethics, and meditation
- **Mindfulness level** - Visual indicator (0-10)
- **Karmic balance** - Wholesome vs. unwholesome potency
- **Experience count** - Total sensory experiences processed

### Tab Panels

#### 1. Experience

Process sensory experiences through the Five Aggregates:
- Choose a sense base (eye, ear, nose, tongue, body, mind)
- Describe the sense object
- Set intensity level
- See how feeling tone and reactions are generated

The aggregates panel shows the five skandhas:
- **Form (Rupa)** - Physical aspect
- **Feeling (Vedana)** - Pleasant/unpleasant/neutral
- **Perception (Samjna)** - Recognition
- **Formations (Samskara)** - Mental reactions
- **Consciousness (Vijnana)** - Awareness

#### 2. Meditation

Practice meditation to develop the Eightfold Path:
- Set duration and effort level
- Watch path factors increase
- Receive insights based on development levels
- Calm the mind to deactivate unwholesome factors

Path factors tracked:
- Right View, Right Intention (Wisdom)
- Right Speech, Right Action, Right Livelihood (Ethics)
- Right Effort, Right Mindfulness, Right Concentration (Meditation)

#### 3. Karma

Experience the karmic event system:
- **Plant seeds** - Create karma through intentional actions
- **See ripening** - Watch karma manifest over time
- **Strengthen/weaken** - Modify potency through repetition or counter-action
- **Track balance** - Monitor wholesome vs. unwholesome karma

Seed states: active, ripening, ripened, purified

#### 4. Dependent Origination

Visualize the 12-link chain of dependent arising:
- **Simulate arising** - Watch links activate in sequence
- **Break the chain** - Practice at the liberation point (between feeling and craving)
- **Click links** - Learn about each nidana

The liberation point (links 7-8) is highlighted, showing where mindfulness can intervene.

#### 5. Self-Inquiry

Search for an unchanging self in the five aggregates:
- Investigate each aggregate systematically
- Discover the not-self (anatta) teaching
- Receive insight into the nature of "self" as process

#### 6. Four Noble Truths

Apply the Buddha's diagnostic framework:
- Describe suffering types present
- Identify cravings and their intensity
- Receive a complete diagnosis:
  1. **Dukkha** - Analysis of suffering
  2. **Samudaya** - Root causes identified
  3. **Nirodha** - Cessation assessment
  4. **Magga** - Recommended path and practices

## Concepts Demonstrated

| Concept | Tab | Description |
|---------|-----|-------------|
| Five Aggregates | Experience | Processing sensory input |
| Feeling Tone | Experience | Pleasant/unpleasant/neutral |
| Eightfold Path | Meditation | Progressive development |
| Mindfulness | Meditation | Awareness cultivation |
| Karmic Seeds | Karma | Delayed consequence system |
| Ripening Conditions | Karma | When karma manifests |
| 12 Nidanas | Chain | Dependent origination |
| Liberation Point | Chain | Breaking the cycle |
| Anatta | Self-Inquiry | Not-self investigation |
| Four Noble Truths | Truths | Diagnostic framework |

## Integration with Buddha.js

This demo simulates the behavior of these Buddha.js classes:

- `Being` - The simulated sentient being
- `FiveAggregates` - Sensory processing
- `EightfoldPath` - Path development
- `Mind` - Mental factors
- `KarmicStore` - Event-driven karma
- `DependentOrigination` - 12-link chain
- `FourNobleTruths` - Diagnostic framework

For the actual TypeScript implementation, see the library source in `src/`.
