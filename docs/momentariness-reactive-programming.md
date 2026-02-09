# Kṣaṇikavāda and Reactive Programming

A comparative analysis of the Buddhist doctrine of momentariness and reactive programming paradigms (RxJS/TypeScript).

## Doctrinal Foundation

**Kṣaṇikavāda** (Sanskrit: क्षणिकवाद) — the doctrine of momentariness — is a core teaching of Buddhist Abhidharma philosophy, particularly developed by the Sarvāstivāda and Sautrāntika schools.

Key claims:
1. All conditioned phenomena (saṃskāra) exist for only a single moment (kṣaṇa)
2. What appears as continuous existence is a rapid succession of discrete moments
3. Each moment arises, briefly exists, and immediately ceases
4. Causation operates through this succession — each moment conditions the next

## Structural Parallels

| Buddhist Concept | Reactive Programming |
|------------------|---------------------|
| Kṣaṇa (moment) | Event emission |
| Santāna (continuum) | Observable stream |
| Utpāda (arising) | `next()` emission |
| Nirodha (ceasing) | Value replaced / `complete()` |
| Pratyaya (condition) | Upstream observable |
| Upalabdhi (observation) | Subscription |
| Citta-santāna (mental continuum) | Subject / BehaviorSubject |

## The Moment as Discrete Emission

In Sautrāntika analysis, arising and ceasing are simultaneous — a dharma exists only at the instant of its arising:

```typescript
interface Kshana<T> {
  readonly value: T;
  readonly timestamp: number;
  readonly arising: true;
  readonly ceasing: true;  // Simultaneous with arising
}

function momentarize<T>(value: T): Kshana<T> {
  return {
    value,
    timestamp: Date.now(),
    arising: true,
    ceasing: true
  };
}

// A stream of moments
const mindMoments$ = interval(100).pipe(
  map(i => momentarize(`thought-${i}`))
);
```

## Santāna as Observable Stream

The santāna (continuum) gives the illusion of persistent identity through causal continuity:

```typescript
class MentalContinuum {
  private readonly stream$ = new BehaviorSubject<Kshana<MentalMoment>>(
    momentarize(initialMoment)
  );

  // Each new moment REPLACES the previous
  nextMoment(moment: MentalMoment): void {
    this.stream$.next(momentarize(moment));
  }

  // Subscription is like attention (manasikāra)
  observe(): Observable<Kshana<MentalMoment>> {
    return this.stream$.asObservable();
  }
}
```

> "There is no river, only the flowing."

## Dependent Origination as Operators

The 12 nidānas map to a pipeline of stream operators:

```typescript
function dependentOriginationPipeline(
  contact$: Observable<Contact>
): Observable<Craving> {

  return contact$.pipe(
    // Contact (sparśa) → Feeling (vedanā)
    map((contact): Feeling => ({
      tone: evaluateFeelingTone(contact)
    })),

    // Feeling → Craving (tṛṣṇā)
    map((feeling): Craving => ({
      type: feeling.tone === 'pleasant' ? 'sensory' : 'non-becoming',
      intensity: feeling.tone === 'neutral' ? 1 : 7
    })),

    share()
  );
}
```

## Mindfulness as Stream Interception

The liberation point between feeling and craving can be modeled as a custom operator:

```typescript
function withMindfulness<T>(
  noting: (value: T) => string
) {
  return (source: Observable<T>) => source.pipe(
    map(value => ({
      observed: value,
      noted: noting(value),
      reactedTo: false  // Observation without reaction
    }))
  );
}

// Liberated pipeline: feeling arises but craving doesn't follow
function liberatedPipeline(contact$: Observable<Contact>) {
  return contact$.pipe(
    map(toFeeling),
    withMindfulness(f => `Feeling: ${f.tone}. Just this.`)
    // Chain broken — no craving arises
  );
}
```

## Impermanence and Immutability

Both systems treat values as immutable and ephemeral:

```typescript
// WRONG (violates momentariness):
moment.feeling = 'pleasant';  // Mutation implies persistence

// RIGHT (honors momentariness):
stream$.next({ ...moment, feeling: 'pleasant' });  // New moment arises
```

The `distinctUntilChanged` operator reveals the illusion of sameness:

```typescript
feelingStream$.pipe(
  distinctUntilChanged((a, b) => a.tone === b.tone)
  // Filters by value equality, but even "unchanged"
  // moments are actually new moments
);
```

## Karma as Delayed Effects

Karmic seeds that ripen later map to delayed/scheduled emissions:

```typescript
function karmicRipening(actions$: Observable<KarmicSeed>) {
  return actions$.pipe(
    mergeMap(seed =>
      of(seed).pipe(
        delay(Math.random() * 5000),  // Variable ripening time
        map(s => ({
          fromSeed: s,
          ripensAs: s.quality === 'wholesome'
            ? 'pleasant result'
            : 'unpleasant result'
        }))
      )
    )
  );
}
```

## Nirvāṇa as Stream Completion

Nirvāṇa is the cessation of the conditioned stream — not annihilation, but the ending of compulsive arising:

```typescript
class SamsaricBeing {
  private readonly cessation$ = new Subject<void>();

  private readonly mentalStream$ = interval(100).pipe(
    map(i => momentarize({ thought: i })),
    takeUntil(this.cessation$),
    finalize(() => console.log('The stream has ceased. Peace.'))
  );

  attainNirvana(): void {
    this.cessation$.next();
    this.cessation$.complete();
  }
}
```

## Five Aggregates as Concurrent Streams

The "self" is the mistaken reification of concurrent streams:

```typescript
function examineForSelf(aggregates: AggregateStreams) {
  return combineLatest([
    aggregates.form$,
    aggregates.feeling$,
    aggregates.perception$,
    aggregates.formations$,
    aggregates.consciousness$
  ]).pipe(
    map(([form, feeling, perception, formations, consciousness]) => `
      All momentary. No unchanging self found.
      What is called "self" is the PATTERN, not a thing.
    `)
  );
}
```

## Philosophical Comparison

| Aspect | Kṣaṇikavāda | RxJS/Reactive |
|--------|-------------|---------------|
| **Ontology** | Only present moment exists | Only current emission is "real" |
| **Identity** | Apparent through causal continuity | Referential identity of stream |
| **Causation** | Each moment conditions the next | Operators transform upstream → downstream |
| **Observer** | Consciousness is also momentary | Subscription separate from emission |
| **Liberation** | Cessation of conditioned arising | `complete()` / `unsubscribe()` |
| **Immutability** | Moments cannot be modified | Values are immutable |

## Key Insight

Both systems reveal that **what appears continuous is actually discrete**. The "self" in Buddhism and "state" in reactive programming are both *process patterns*, not persistent entities.

> *"There is no stream, only streaming. There is no self, only selfing."*

## References

- Stcherbatsky, *Buddhist Logic*, Vol. I (on kṣaṇikavāda)
- Vasubandhu, *Abhidharmakośa*, Chapter II
- ReactiveX Documentation: https://reactivex.io/
