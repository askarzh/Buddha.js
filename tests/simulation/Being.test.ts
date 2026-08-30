import { describe, it, expect, beforeEach } from 'vitest';
import { Being } from '../../src/simulation/Being';

describe('Being', () => {
  let being: Being;

  beforeEach(() => {
    being = new Being();
  });

  describe('Structure', () => {
    it('should have all components', () => {
      expect(being.aggregates).toBeDefined();
      expect(being.path).toBeDefined();
      expect(being.dependentOrigination).toBeDefined();
      expect(being.fourNobleTruths).toBeDefined();
      expect(being.emptiness).toBeDefined();
      expect(being.mind).toBeDefined();
    });
  });

  describe('Experience', () => {
    it('should process sensory input', () => {
      const experience = being.experience({
        senseBase: 'eye',
        object: 'flower',
        intensity: 7
      });

      expect(experience.label).toBeDefined();
      expect(experience.feelingTone).toBeDefined();
      expect(experience.reactions).toBeInstanceOf(Array);
    });

    it('should track experience history', () => {
      being.experience({ senseBase: 'eye', object: 'a', intensity: 5 });
      being.experience({ senseBase: 'ear', object: 'b', intensity: 5 });

      const history = being.getExperienceHistory();
      expect(history).toHaveLength(2);
    });
  });

  describe('Karma', () => {
    it('should create karma through action', () => {
      const karma = being.act('help someone', 5, 'non-greed');

      expect(karma.quality).toBe('wholesome');
      expect(karma.isCompleted).toBe(true);
    });

    it('derives karma quality from the root', () => {
      expect(being.act('donate', 5, 'non-greed').quality).toBe('wholesome');
      expect(being.act('steal', 5, 'greed').quality).toBe('unwholesome');
      expect(being.act('walk', 5).quality).toBe('neutral');
    });

    it('should track karma in stream', () => {
      being.act('action 1', 5, 'non-greed');
      being.act('action 2', 3, 'greed');

      const stream = being.getKarmicStream();
      expect(stream).toHaveLength(2);
    });

    it('should have pending karma', () => {
      being.act('action', 5, 'non-greed');

      const state = being.getState();
      expect(state.pendingKarma).toBe(1);
    });

    it('should receive karmic results', () => {
      being.act('give', 5, 'non-greed');

      const report = being.receiveKarmicResults();
      expect(report.results.length).toBeGreaterThan(0);
    });

    it('experiences unwholesome karmic results as unpleasant', () => {
      being.act('harsh speech', 7, 'aversion');
      being.receiveKarmicResults();
      const last = being.getExperienceHistory(1)[0];
      expect(last.feelingTone).toBe('unpleasant');
    });

    it('conditional ripening explains why seeds did not ripen', () => {
      being.act('kind word', 5, 'non-aversion');
      const report = being.receiveKarmicResults();
      expect(report.whyNot.length).toBeGreaterThan(0);
      expect(report.whyNot[0].unmet.join(' ')).toMatch(/mindfulness/);
    });

    it('force-ripening is deterministic', () => {
      being.act('kind word', 5, 'non-aversion');
      const report = being.receiveKarmicResults(true);
      expect(report.seedVipakas).toHaveLength(1);
      expect(being.karmicStore.getSeeds({ state: 'active' })).toHaveLength(0);
    });

    it('ripened seed vipakas are experienced with matching valence', () => {
      being.act('harsh word', 5, 'aversion');
      being.receiveKarmicResults(true);
      const last = being.getExperienceHistory(1)[0];
      expect(last.feelingTone).toBe('unpleasant');
    });
  });

  describe('Meditation', () => {
    it('should develop path factors', () => {
      const initialProgress = being.path.getOverallDevelopment();

      being.meditate(30, 7);

      expect(being.path.getOverallDevelopment()).toBeGreaterThan(initialProgress);
    });

    it('should increase mindfulness level', () => {
      const result = being.meditate(30, 8);

      expect(result.mindfulnessLevel).toBeGreaterThan(0);
      expect(being.mindfulnessLevel).toBeGreaterThan(0);
    });

    it('should generate insights at higher levels', () => {
      // Practice extensively
      for (let i = 0; i < 50; i++) {
        being.meditate(60, 10);
      }

      const result = being.meditate(60, 10);
      expect(result.insight).toBeDefined();
    });

    it('should calm the mind', () => {
      being.meditate(30, 7);

      const state = being.getState();
      expect(state.mindState.isCalm).toBe(true);
    });
  });

  describe('Self Investigation', () => {
    it('should not find self', () => {
      const result = being.investigateSelf();

      expect(result.aggregateSearch.selfFound).toBe(false);
      expect(result.conclusion).toContain('self');
    });

    it('should provide emptiness insight', () => {
      const result = being.investigateSelf();

      expect(result.emptinessInsight).toBeDefined();
      expect(result.emptinessInsight?.isEmpty).toBe(true);
    });

    it('should provide dependent origination insight', () => {
      const result = being.investigateSelf();

      expect(result.dependentOriginationInsight).toContain('dependent');
    });
  });

  describe('Facing Suffering', () => {
    it('should diagnose suffering', () => {
      const response = being.faceSuffering(
        ['dukkha-dukkha'],
        ['sensory']
      );

      expect(response.acknowledged).toBe(true);
      expect(response.diagnosis).toBeDefined();
      expect(response.nextStep).toBeDefined();
    });

    it('should provide path forward', () => {
      const response = being.faceSuffering(
        ['dukkha-dukkha', 'viparinama-dukkha'],
        ['sensory', 'becoming']
      );

      expect(response.diagnosis.path).toBeDefined();
      expect(response.diagnosis.path.practices.length).toBeGreaterThan(0);
    });
  });

  describe('State', () => {
    it('should provide complete state', () => {
      const state = being.getState();

      expect(state.aggregatesSnapshot).toBeDefined();
      expect(state.pathProgress).toBeDefined();
      expect(state.mindfulnessLevel).toBeDefined();
      expect(state.pendingKarma).toBeDefined();
      expect(state.experienceCount).toBeDefined();
      expect(state.mindState).toBeDefined();
    });
  });

  describe('Summary', () => {
    it('should provide summary', () => {
      const summary = being.getSummary();

      expect(summary).toContain('AGGREGATES');
      expect(summary).toContain('PATH DEVELOPMENT');
      expect(summary).toContain('KARMA');
      expect(summary).toContain('MIND');
    });
  });

  describe('Three Marks Integration', () => {
    it('all components should bear three marks', () => {
      // Check aggregates
      being.aggregates.getAllAggregates().forEach(agg => {
        expect(agg.impermanence).toBe(true);
        expect(agg.unsatisfactoriness).toBe(true);
        expect(agg.notSelf).toBe(true);
      });

      // Check dependent origination links
      being.dependentOrigination.links.forEach(link => {
        expect(link.impermanence).toBe(true);
      });
    });
  });

  describe('karmic seed ledger', () => {
    it('act() plants exactly one seed with quality derived from root', () => {
      const being = new Being();
      being.act('donated books', 5, 'non-greed');
      const seeds = being.karmicStore.getSeeds();
      expect(seeds).toHaveLength(1);
      expect(seeds[0].quality).toBe('wholesome');
      expect(seeds[0].strength).toBe('moderate');
      expect(being.getKarmicStream()).toHaveLength(1); // legacy contract intact
    });

    it('maps intensity to seed strength boundaries', () => {
      const being = new Being();
      being.act('a', 3);            // neutral root
      being.act('b', 4, 'greed');
      being.act('c', 8, 'aversion');
      const strengths = being.karmicStore.getSeeds().map(s => s.strength);
      expect(strengths).toEqual(['weak', 'moderate', 'strong']);
    });
  });
});
