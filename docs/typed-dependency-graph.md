# Typed Dependency Graph for Pratityasamutpada

This document describes how the 12 nidanas (links of dependent origination) can be modeled as a compile-time typed dependency graph in TypeScript.

## Overview

Pratityasamutpada (Sanskrit: प्रतीत्यसमुत्पाद) — dependent origination — describes how phenomena arise in dependence upon conditions. The 12 nidanas form a causal chain where each link conditions the next.

## The 12 Links

| # | Sanskrit | English | Temporal Span | Conditions |
|---|----------|---------|---------------|------------|
| 1 | Avidyā | Ignorance | Past | (root cause) |
| 2 | Saṃskāra | Formations | Past | Avidyā |
| 3 | Vijñāna | Consciousness | Present | Saṃskāra |
| 4 | Nāma-rūpa | Mind-Body | Present | Vijñāna |
| 5 | Ṣaḍāyatana | Six Senses | Present | Nāma-rūpa |
| 6 | Sparśa | Contact | Present | Ṣaḍāyatana |
| 7 | Vedanā | Feeling | Present | Sparśa |
| 8 | Tṛṣṇā | Craving | Present | Vedanā |
| 9 | Upādāna | Clinging | Present | Tṛṣṇā |
| 10 | Bhava | Becoming | Present | Upādāna |
| 11 | Jāti | Birth | Future | Bhava |
| 12 | Jarā-maraṇa | Aging-Death | Future | Jāti |

## Current Implementation

The current implementation uses runtime linking:

```typescript
class Nidana extends Phenomenon {
  protected nextLink?: Nidana;
  protected previousLink?: Nidana;

  setNextLink(link: Nidana): void {
    this.nextLink = link;
    link.previousLink = this;
  }
}
```

**Limitations:**
- Link types are `Nidana | undefined` (loses concrete type)
- Chain structure enforced at runtime, not compile-time
- No type-safe traversal

## Proposed: Type-Level Chain Definition

### Position-to-Type Mapping

```typescript
type NidanaPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface NidanaMap {
  1: Avidya;
  2: Samskara;
  3: Vijnana;
  4: NamaRupa;
  5: Salayatana;
  6: Sparsa;
  7: Vedana;
  8: Tanha;
  9: Upadana;
  10: Bhava;
  11: Jati;
  12: Jaramarana;
}
```

### Compile-Time Predecessor/Successor Types

```typescript
type Predecessor<P extends NidanaPosition> =
  P extends 1 ? never : NidanaMap[Subtract<P, 1>];

type Successor<P extends NidanaPosition> =
  P extends 12 ? never : NidanaMap[Add<P, 1>];
```

### Generic Nidana Base

```typescript
abstract class TypedNidana<
  Pos extends NidanaPosition,
  Prev extends Nidana | never = Predecessor<Pos>,
  Next extends Nidana | never = Successor<Pos>
> extends Phenomenon {
  abstract readonly position: Pos;

  protected predecessor: Prev | undefined;
  protected successor: Next | undefined;

  conditionsNext(next: Next): void {
    this.successor = next;
  }

  getConditionedBy(): Prev | undefined {
    return this.predecessor;
  }

  getConditions(): Next | undefined {
    return this.successor;
  }
}
```

### Heterogeneous Chain Type

```typescript
type NidanaChain = readonly [
  Avidya,      // 1
  Samskara,    // 2
  Vijnana,     // 3
  NamaRupa,    // 4
  Salayatana,  // 5
  Sparsa,      // 6
  Vedana,      // 7  <- Liberation point
  Tanha,       // 8
  Upadana,     // 9
  Bhava,       // 10
  Jati,        // 11
  Jaramarana   // 12
];
```

### Type-Safe Graph Operations

```typescript
class TypedDependentOrigination {
  private readonly chain: NidanaChain;

  // Type-safe link retrieval
  getLink<P extends NidanaPosition>(position: P): NidanaMap[P] {
    return this.chain[position - 1] as NidanaMap[P];
  }

  // Liberation point with specific types
  getLiberationPoint(): {
    feeling: Vedana;
    craving: Tanha;
    canIntervene: boolean;
  } {
    const feeling = this.getLink(7);  // TypeScript knows: Vedana
    const craving = this.getLink(8);  // TypeScript knows: Tanha
    return {
      feeling,
      craving,
      canIntervene: feeling.hasArisen && !craving.hasArisen
    };
  }
}
```

## Temporal Groupings

The three-life interpretation groups links by temporal span:

```typescript
type PastLinks = NidanaMap[1] | NidanaMap[2];
type PresentEffectLinks = NidanaMap[3] | NidanaMap[4] | NidanaMap[5];
type PresentCauseLinks = NidanaMap[6] | NidanaMap[7] | NidanaMap[8] | NidanaMap[9] | NidanaMap[10];
type FutureLinks = NidanaMap[11] | NidanaMap[12];

interface TemporalGrouping {
  past: readonly [Avidya, Samskara];
  presentEffect: readonly [Vijnana, NamaRupa, Salayatana];
  presentCause: readonly [Sparsa, Vedana, Tanha, Upadana, Bhava];
  future: readonly [Jati, Jaramarana];
}
```

## Alternative Interpretations

### Momentary Interpretation

All 12 links occur in a single mind-moment:

```typescript
type MomentaryChain = NidanaChain; // All 12 in one instant
```

### Two-Life Model

```typescript
interface TwoLifeModel {
  thisLife: SliceChain<NidanaChain, 1, 10>;  // Avidya -> Bhava
  nextLife: SliceChain<NidanaChain, 11, 12>; // Jati -> Jaramarana
}
```

### Cyclic Model

Jaramarana conditions the next Avidya:

```typescript
interface CyclicEdge {
  from: Jaramarana;
  to: Avidya;
  relationship: 'conditions-rebirth';
}
```

## Benefits

| Aspect | Runtime Approach | Typed Approach |
|--------|------------------|----------------|
| Link types | `Nidana \| undefined` | Concrete types |
| Chain structure | Runtime array | Typed tuple |
| Traversal | Loses type info | Preserves types |
| Errors | Runtime | Compile-time |

## References

- Buddhaghosa, *Visuddhimagga* (Path of Purification), Chapter XVII
- Vasubandhu, *Abhidharmakośa*, Chapter III
- Nāgārjuna, *Mūlamadhyamakakārikā*, Chapter XXVI
