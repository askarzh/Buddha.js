/**
 * Buddha.js - A TypeScript Library for Buddhist Concepts
 *
 * This library programmatically models core Buddhist teachings:
 * - Four Noble Truths
 * - Noble Eightfold Path
 * - Dependent Origination (12 Links)
 * - Five Aggregates
 * - Karma
 * - Emptiness (Sunyata)
 *
 * All concepts are built on the Three Marks of Existence:
 * impermanence, unsatisfactoriness, and not-self.
 */

// Core
export * from './core';

// Utils
export * from './utils';
export * from './utils/aliases';

// Four Noble Truths
export * from './four-noble-truths';

// Eightfold Path
export * from './eightfold-path';

// Dependent Origination
export * from './dependent-origination';

// Five Aggregates
export * from './five-aggregates';

// Karma
export * from './karma';

// Emptiness
export * from './emptiness';

// Mind (excluding MentalFactor to avoid conflict with five-aggregates)
export { Mind, Citta } from './mind';
export type {
  Ārammaṇa,
  CittaMoment,
  VithiResult,
  CittaClassification
} from './mind';

// Koan
export * from './koan';

// Meditation
export * from './meditation';

// Simulation
export * from './simulation';
