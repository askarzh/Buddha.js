# Bhavacakra - Interactive Wheel of Samsara

An animated, interactive visualization of the Buddhist Wheel of Life (Bhavacakra) using HTML5 Canvas.

## Running

Open `index.html` in any modern web browser.

```bash
# From the Buddha.js root directory
open examples/bhavacakra/index.html
# or
python -m http.server 8080  # then visit localhost:8080/examples/bhavacakra/
```

## Features

### Interactive Elements

- **Click** on any section to learn about it
- **Spin** the wheel with the Spin button
- **Pause/Resume** the animation
- **Toggle labels** for Nidanas and Realms
- **Legend** for quick realm navigation
- **Nidana chips** for quick link navigation

### Visual Components

The wheel displays the traditional Bhavacakra structure:

#### Outer Ring: 12 Nidanas (Dependent Origination)
1. Avidyā (Ignorance) - Blind person
2. Saṃskāra (Formations) - Potter
3. Vijñāna (Consciousness) - Monkey
4. Nāma-rūpa (Name-Form) - Boat with passengers
5. Ṣaḍāyatana (Six Senses) - House with windows
6. Sparśa (Contact) - Couple embracing
7. Vedanā (Feeling) - Arrow in eye
8. Tṛṣṇā (Craving) - Person drinking
9. Upādāna (Clinging) - Monkey grabbing fruit
10. Bhava (Becoming) - Pregnant woman
11. Jāti (Birth) - Woman giving birth
12. Jarā-maraṇa (Aging & Death) - Corpse being carried

#### Middle Ring: 6 Realms of Existence
- **Deva** (Gods) - Long life, pleasure, pride
- **Asura** (Jealous Gods) - Power, conflict, envy
- **Manusya** (Human) - Balance, opportunity for practice
- **Tiryagyoni** (Animal) - Ignorance, instinct
- **Preta** (Hungry Ghost) - Craving, never satisfied
- **Naraka** (Hell) - Intense suffering, hatred

#### Inner Ring: Two Paths
- White/ascending - virtuous actions leading upward
- Black/descending - non-virtuous actions leading downward

#### Hub: Three Poisons
- 🐓 Rooster - Greed (Lobha)
- 🐍 Snake - Hatred (Dosa)
- 🐷 Pig - Delusion (Moha)

#### Yama
The Lord of Death holds the wheel, representing the inescapable nature of cyclic existence.

## Integration with Buddha.js

This visualization complements the Buddha.js library:

- The **12 Nidanas** correspond to `src/dependent-origination/`
- The **Three Poisons** are modeled in `src/utils/types.ts` as `UnwholesomeRoot`
- The **Six Realms** relate to `CittaRealm` in the Abhidhamma model
- The **Being** class (`src/simulation/Being.ts`) represents an entity moving through these realms

## Symbolism

The Bhavacakra teaches that:

1. **All beings cycle through the six realms** based on their karma
2. **The three poisons drive the wheel** - greed, hatred, and delusion
3. **The 12 links show how suffering perpetuates** through dependent origination
4. **Liberation is possible** by breaking the chain (especially between feeling and craving)
5. **Yama reminds us** that death comes to all who remain in samsara

## Customization

Edit the data objects at the top of the script to customize:

```javascript
const SIX_REALMS = [...];      // Realm definitions
const TWELVE_NIDANAS = [...];  // Link definitions
const THREE_POISONS = [...];   // Poison definitions
```

Adjust the radius constants to change proportions:

```javascript
const OUTER_RADIUS = 280;
const NIDANA_RADIUS = 260;
const REALM_OUTER = 220;
const REALM_INNER = 100;
const PATH_RADIUS = 80;
const HUB_RADIUS = 50;
```
