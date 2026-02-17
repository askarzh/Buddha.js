import { describe, it, expect } from 'vitest';
import { KarmicStore } from '../../src/karma/KarmicEventSystem';

describe('KarmicStore Persistence', () => {
  it('should have toJSON method', () => {
    const store = new KarmicStore({ enableAutoRipening: false });
    expect(typeof store.toJSON).toBe('function');
  });

  describe('toJSON', () => {
    it('should serialize empty store', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      const data = store.toJSON();
      expect(data.seeds).toEqual([]);
      expect(data.config).toBeDefined();
      expect(data.config.maxSeeds).toBe(1000);
    });

    it('should serialize seeds with all fields', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      store.plantSeed({
        quality: 'wholesome',
        description: 'Act of generosity',
        intentionStrength: 7,
        root: 'non-greed',
        tags: ['giving'],
      });

      const data = store.toJSON();
      expect(data.seeds).toHaveLength(1);
      expect(data.seeds[0].quality).toBe('wholesome');
      expect(data.seeds[0].description).toBe('Act of generosity');
      expect(data.seeds[0].intentionStrength).toBe(7);
      expect(data.seeds[0].root).toBe('non-greed');
      expect(data.seeds[0].tags).toEqual(['giving']);
      expect(data.seeds[0].state).toBe('active');
    });

    it('should serialize ripening conditions without check function', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      store.plantSeed({
        quality: 'unwholesome',
        description: 'Angry thought',
        conditions: [{
          type: 'state',
          name: 'test-condition',
          description: 'Test condition',
          check: () => true,
          weight: 0.8
        }],
      });

      const data = store.toJSON();
      const condition = data.seeds[0].ripeningConditions[0];
      expect(condition.type).toBe('state');
      expect(condition.name).toBe('test-condition');
      expect(condition.description).toBe('Test condition');
      expect(condition.weight).toBe(0.8);
      expect((condition as any).check).toBeUndefined();
    });

    it('should be JSON.stringify compatible', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      store.plantSeed({ quality: 'neutral', description: 'Walking' });
      const str = JSON.stringify(store);
      const parsed = JSON.parse(str);
      expect(parsed.seeds).toHaveLength(1);
    });

    it('should serialize config', () => {
      const customStore = new KarmicStore({
        maxSeeds: 500,
        timeScale: 2,
        enableAutoRipening: false,
      });
      const data = customStore.toJSON();
      expect(data.config.maxSeeds).toBe(500);
      expect(data.config.timeScale).toBe(2);
    });
  });

  describe('Condition Registry', () => {
    it('should register and retrieve named conditions', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      store.registerCondition('always-true', () => true);
      const check = store.getCondition('always-true');
      expect(check).toBeDefined();
      expect(check!()).toBe(true);
    });

    it('should return undefined for unregistered conditions', () => {
      const store = new KarmicStore({ enableAutoRipening: false });
      expect(store.getCondition('nonexistent')).toBeUndefined();
    });
  });
});
