import { describe, it, expect } from 'vitest';
import { buildSynthesisRequest } from './requestBuilder';
import { EMPTY_PROFILE, MINIMAL_READY_PROFILE, FULL_PROFILE } from './__fixtures__';

describe('buildSynthesisRequest', () => {
  describe('budget extraction', () => {
    it('extracts USD budget from constraint', () => {
      const req = buildSynthesisRequest(MINIMAL_READY_PROFILE);
      expect(req.hard_envelope.budget).toBe(3000);
      expect(req.hard_envelope.currency).toBe('USD');
      expect(req.hard_envelope.currency_symbol).toBe('$');
    });

    it('extracts EUR budget', () => {
      const profile = structuredClone(MINIMAL_READY_PROFILE);
      profile.needs.constraints = [{ type: 'budget', value: '\u20AC2,000 EUR', flexibility: 'hard' }];
      const req = buildSynthesisRequest(profile);
      expect(req.hard_envelope.budget).toBe(2000);
      expect(req.hard_envelope.currency).toBe('EUR');
      expect(req.hard_envelope.currency_symbol).toBe('\u20AC');
    });

    it('extracts ILS budget from shekel symbol', () => {
      const profile = structuredClone(MINIMAL_READY_PROFILE);
      profile.needs.constraints = [{ type: 'budget', value: '\u20AA10,000', flexibility: 'hard' }];
      const req = buildSynthesisRequest(profile);
      expect(req.hard_envelope.budget).toBe(10000);
      expect(req.hard_envelope.currency).toBe('ILS');
    });

    it('extracts GBP budget', () => {
      const profile = structuredClone(MINIMAL_READY_PROFILE);
      profile.needs.constraints = [{ type: 'budget', value: '\u00A31,500 GBP', flexibility: 'soft' }];
      const req = buildSynthesisRequest(profile);
      expect(req.hard_envelope.budget).toBe(1500);
      expect(req.hard_envelope.currency).toBe('GBP');
    });

    it('defaults to USD when no currency specified', () => {
      const profile = structuredClone(MINIMAL_READY_PROFILE);
      profile.needs.constraints = [{ type: 'budget', value: '2500', flexibility: 'hard' }];
      const req = buildSynthesisRequest(profile);
      expect(req.hard_envelope.currency).toBe('USD');
    });

    it('returns null budget when no budget constraint exists', () => {
      const req = buildSynthesisRequest(EMPTY_PROFILE);
      expect(req.hard_envelope.budget).toBeNull();
      expect(req.hard_envelope.budget_ils).toBeNull();
    });

    it('handles comma-separated amounts', () => {
      const profile = structuredClone(MINIMAL_READY_PROFILE);
      profile.needs.constraints = [{ type: 'budget', value: '$1,234.56 USD', flexibility: 'hard' }];
      const req = buildSynthesisRequest(profile);
      expect(req.hard_envelope.budget).toBeCloseTo(1234.56);
    });

    it('computes ILS equivalent for non-ILS currencies', () => {
      const req = buildSynthesisRequest(MINIMAL_READY_PROFILE);
      // 3000 USD * 3.8 = 11400 ILS
      expect(req.hard_envelope.budget_ils).toBe(11400);
    });
  });

  describe('duration extraction', () => {
    it('extracts single duration from time constraint', () => {
      const profile = structuredClone(MINIMAL_READY_PROFILE);
      profile.needs.constraints.push({ type: 'time', value: '3 nights', flexibility: 'hard' });
      const req = buildSynthesisRequest(profile);
      expect(req.hard_envelope.duration_nights).toEqual({ min: 3, max: 3 });
    });

    it('extracts range duration', () => {
      const profile = structuredClone(MINIMAL_READY_PROFILE);
      profile.needs.constraints.push({ type: 'time', value: '2-4 days', flexibility: 'soft' });
      const req = buildSynthesisRequest(profile);
      expect(req.hard_envelope.duration_nights).toEqual({ min: 2, max: 4 });
    });

    it('computes duration from exact dates', () => {
      const req = buildSynthesisRequest(FULL_PROFILE);
      // 2026-07-10 to 2026-07-14 = 4 nights
      expect(req.hard_envelope.duration_nights).toEqual({ min: 4, max: 4 });
    });

    it('exact dates override text duration', () => {
      // FULL_PROFILE has both time constraint "4-5 nights" and exact dates (4 nights)
      const req = buildSynthesisRequest(FULL_PROFILE);
      expect(req.hard_envelope.duration_nights).toEqual({ min: 4, max: 4 });
    });

    it('returns null when no duration info', () => {
      const req = buildSynthesisRequest(EMPTY_PROFILE);
      expect(req.hard_envelope.duration_nights).toBeNull();
    });
  });

  describe('scoring weights', () => {
    it('uses default weights', () => {
      const req = buildSynthesisRequest(MINIMAL_READY_PROFILE);
      expect(req.scoring_weights).toEqual({
        budget_fit: 0.4,
        experience_match: 0.4,
        logistics_ease: 0.2,
      });
    });

    it('adjusts weights for stress-sensitive users', () => {
      const req = buildSynthesisRequest(FULL_PROFILE);
      // FULL_PROFILE has trait "stress-sensitive"
      expect(req.scoring_weights.logistics_ease).toBe(0.4);
      expect(req.scoring_weights.experience_match).toBe(0.2);
    });
  });

  describe('date_info passthrough', () => {
    it('passes through exact date info', () => {
      const req = buildSynthesisRequest(FULL_PROFILE);
      expect(req.hard_envelope.date_info.tier).toBe('exact');
      expect(req.hard_envelope.date_info.start_date).toBe('2026-07-10');
    });

    it('defaults to tier none', () => {
      const req = buildSynthesisRequest(EMPTY_PROFILE);
      expect(req.hard_envelope.date_info.tier).toBe('none');
    });
  });
});
