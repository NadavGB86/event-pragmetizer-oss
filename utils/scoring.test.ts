import { describe, it, expect } from 'vitest';
import { scoreFeasibility } from './scoring';
import { VALID_PLAN, INSANE_PLAN, OVER_BUDGET_PLAN, DEFAULT_REQUEST } from './__fixtures__';
import { CandidatePlan, SynthesisRequest } from '../types';

describe('scoreFeasibility', () => {
  describe('budget scoring', () => {
    it('scores 100 when within budget', () => {
      const result = scoreFeasibility(VALID_PLAN, DEFAULT_REQUEST);
      expect(result.dimensions.budget.score).toBe(100);
      expect(result.dimensions.budget.reason).toBe('Within budget');
    });

    it('penalizes over-budget plans', () => {
      const result = scoreFeasibility(OVER_BUDGET_PLAN, DEFAULT_REQUEST);
      expect(result.dimensions.budget.score).toBeLessThan(100);
      expect(result.dimensions.budget.reason).toMatch(/Over budget/);
    });

    it('scores 100 for massive mismatch (currency hallucination)', () => {
      const massiveOverPlan: CandidatePlan = {
        ...VALID_PLAN,
        id: 'massive',
        total_estimated_budget: 50000, // >5x $3000 = treated as currency mismatch
      };
      const result = scoreFeasibility(massiveOverPlan, DEFAULT_REQUEST);
      expect(result.dimensions.budget.score).toBe(100);
      expect(result.dimensions.budget.reason).toMatch(/Currency Mismatch/);
    });

    it('scores 100 when no budget limit set', () => {
      const noBudgetRequest: SynthesisRequest = {
        ...DEFAULT_REQUEST,
        hard_envelope: { ...DEFAULT_REQUEST.hard_envelope, budget: null, budget_ils: null },
      };
      const result = scoreFeasibility(VALID_PLAN, noBudgetRequest);
      expect(result.dimensions.budget.score).toBe(100);
    });
  });

  describe('sanity check integration', () => {
    it('hard-fails insane plans', () => {
      const result = scoreFeasibility(INSANE_PLAN, DEFAULT_REQUEST);
      expect(result.is_valid_hard).toBe(false);
      expect(result.overall_score).toBe(20); // Hard fail cap
    });

    it('passes valid plans', () => {
      const result = scoreFeasibility(VALID_PLAN, DEFAULT_REQUEST);
      expect(result.is_valid_hard).toBe(true);
      expect(result.overall_score).toBeGreaterThan(20);
    });
  });

  describe('experience matching', () => {
    it('matches declared wants against plan text', () => {
      // MINIMAL_READY_PROFILE has wants: ['beach', 'relaxation']
      // VALID_PLAN title includes 'Beach'
      const result = scoreFeasibility(VALID_PLAN, DEFAULT_REQUEST);
      expect(result.dimensions.experience.score).toBeGreaterThan(0);
      expect(result.dimensions.experience.reason).toMatch(/Matched \d+\/\d+ wants/);
    });

    it('scores 80 when no wants declared', () => {
      const noWantsRequest: SynthesisRequest = {
        ...DEFAULT_REQUEST,
        user_context: {
          ...DEFAULT_REQUEST.user_context,
          goals: { ...DEFAULT_REQUEST.user_context.goals, declared_wants: [] },
        },
      };
      const result = scoreFeasibility(VALID_PLAN, noWantsRequest);
      expect(result.dimensions.experience.score).toBe(80);
    });

    it('scores 0 when no wants match', () => {
      const mismatchRequest: SynthesisRequest = {
        ...DEFAULT_REQUEST,
        user_context: {
          ...DEFAULT_REQUEST.user_context,
          goals: { ...DEFAULT_REQUEST.user_context.goals, declared_wants: ['skiing', 'snowboarding'] },
        },
      };
      const result = scoreFeasibility(VALID_PLAN, mismatchRequest);
      expect(result.dimensions.experience.score).toBe(0);
    });
  });

  describe('weighted scoring', () => {
    it('uses scoring weights for final calculation', () => {
      const result = scoreFeasibility(VALID_PLAN, DEFAULT_REQUEST);
      // Valid plan: budget=100, experience>0, constraints=100
      // With weights 0.4/0.4/0.2, score should be > 60
      expect(result.overall_score).toBeGreaterThanOrEqual(60);
    });

    it('stress-sensitive weights affect final score', () => {
      const stressRequest: SynthesisRequest = {
        ...DEFAULT_REQUEST,
        scoring_weights: { budget_fit: 0.4, experience_match: 0.2, logistics_ease: 0.4 },
      };
      const normalResult = scoreFeasibility(VALID_PLAN, DEFAULT_REQUEST);
      const stressResult = scoreFeasibility(VALID_PLAN, stressRequest);
      // Different weights should produce different scores (unless all dimensions are equal)
      expect(typeof stressResult.overall_score).toBe('number');
      expect(normalResult.overall_score).not.toBe(stressResult.overall_score);
    });
  });

  describe('output structure', () => {
    it('returns all required dimensions', () => {
      const result = scoreFeasibility(VALID_PLAN, DEFAULT_REQUEST);
      expect(result).toHaveProperty('overall_score');
      expect(result).toHaveProperty('is_valid_hard');
      expect(result.dimensions).toHaveProperty('budget');
      expect(result.dimensions).toHaveProperty('experience');
      expect(result.dimensions).toHaveProperty('logistics');
      expect(result.dimensions).toHaveProperty('constraints');
    });

    it('all scores are between 0 and 100', () => {
      const result = scoreFeasibility(VALID_PLAN, DEFAULT_REQUEST);
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(result.dimensions.budget.score).toBeGreaterThanOrEqual(0);
      expect(result.dimensions.budget.score).toBeLessThanOrEqual(100);
    });
  });
});
