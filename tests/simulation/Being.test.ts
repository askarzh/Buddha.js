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
      const karma = being.act('help someone', 'wholesome', 5, 'non-greed');

      expect(karma.quality).toBe('wholesome');
      expect(karma.isCompleted).toBe(true);
    });

    it('should track karma in stream', () => {
      being.act('action 1', 'wholesome', 5);
      being.act('action 2', 'unwholesome', 3);

      const stream = being.getKarmicStream();
      expect(stream).toHaveLength(2);
    });

    it('should have pending karma', () => {
      being.act('action', 'wholesome', 5);

      const state = being.getState();
      expect(state.pendingKarma).toBe(1);
    });

    it('should receive karmic results', () => {
      being.act('give', 'wholesome', 5, 'non-greed');

      const results = being.receiveKarmicResults();
      expect(results.length).toBeGreaterThan(0);
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
});
