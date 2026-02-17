/**
 * English Aliases for Sanskrit/Pali Terms
 *
 * These aliases make the library more accessible by using "Plain and Simple"
 * English terminology alongside the traditional Sanskrit/Pali names.
 */

import { Dukkha } from '../four-noble-truths/Dukkha';
import { Samudaya } from '../four-noble-truths/Samudaya';
import { Nirodha } from '../four-noble-truths/Nirodha';
import { Magga } from '../four-noble-truths/Magga';
import { TwoArrows } from '../four-noble-truths/TwoArrows';

import { Avidya } from '../dependent-origination/links/Avidya';
import { Samskara } from '../dependent-origination/links/Samskara';
import { Vijnana } from '../dependent-origination/links/Vijnana';
import { Tanha } from '../dependent-origination/links/Tanha';
import { Upadana } from '../dependent-origination/links/Upadana';

import { PoisonArrow } from '../simulation/PoisonArrow';
import { Sunyata } from '../emptiness/Sunyata';
import { ImpermanenceInsight, NotSelfInsight, UnsatisfactorinessInsight } from '../core/ThreeMarks';

// Four Noble Truths Aliases
export const Dissatisfaction = Dukkha;
export const OriginOfSuffering = Samudaya;
export const CessationOfSuffering = Nirodha;
export const PathToCessation = Magga;
export const EightyFourthProblem = TwoArrows;

// Simulation Aliases
export const QuickCessation = PoisonArrow;

// Dependent Origination Aliases (Key Links)
export const Confusion = Avidya;     // Ignorance
export const BlindUrges = Samskara;  // Volitional Formations
export const Consciousness = Vijnana;
export const Craving = Tanha;        // Thirst
export const Clinging = Upadana;     // Grasping

// Emptiness
export const Emptiness = Sunyata;

// Three Marks Types
export type ChangeInsight = ImpermanenceInsight;
export type PainInsight = UnsatisfactorinessInsight;
export type EgolessnessInsight = NotSelfInsight;
