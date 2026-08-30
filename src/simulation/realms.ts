/**
 * The Six Realms (gati) of Rebirth
 *
 * Each realm class extends `Being`, overriding ONLY the `realm` getter and
 * the protected soft-modifier hooks (`meditationGainFactor`, `wisdomCap`,
 * `unwholesomeReactionBoost`, `unpleasantIntensityShift`) — never a public
 * method. This is a soft-modifier design: every realm being still has the
 * full Being API available; realms bias outcomes, they never disable them.
 *
 * Implemented in `./Being.ts`, not here — `Being.rebirth()` needs
 * REALM_CLASSES to construct the next arising, and each realm class needs
 * `Being` to extend. Splitting that across two files makes it a circular ES
 * module import that fails at the `class X extends Being` statement
 * (confirmed under both Vitest and plain Node ESM: whichever file loads
 * first, the other's base class is still in its temporal dead zone). Keeping
 * them in one module turns it into a same-module forward reference instead.
 * This file re-exports them so `import ... from './realms'` (and
 * `'buddha.js'`'s public surface) is unaffected.
 */
export {
  HumanBeing,
  DevaBeing,
  AsuraBeing,
  AnimalBeing,
  PretaBeing,
  NarakaBeing,
  REALM_CLASSES,
  selectRealm,
} from './Being';
