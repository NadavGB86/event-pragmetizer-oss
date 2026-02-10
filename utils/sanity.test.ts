import { describe, it, expect } from 'vitest';
import { checkPlanSanity } from './sanity';
import { VALID_PLAN, INSANE_PLAN, CHEAP_FLIGHT_COMPONENT, CHEAP_HOTEL_COMPONENT } from './__fixtures__';
import { CandidatePlan } from '../types';

describe('checkPlanSanity', () => {
  it('passes a valid plan', () => {
    const result = checkPlanSanity(VALID_PLAN);
    expect(result.isSane).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('detects suspiciously cheap flights', () => {
    const result = checkPlanSanity(INSANE_PLAN);
    expect(result.isSane).toBe(false);
    expect(result.violations.some(v => v.includes('Flight cost'))).toBe(true);
  });

  it('detects suspiciously cheap accommodation', () => {
    const cheapHotel: CandidatePlan = {
      ...VALID_PLAN,
      id: 'cheap-hotel',
      components: [CHEAP_HOTEL_COMPONENT],
      total_estimated_budget: 10,
    };
    const result = checkPlanSanity(cheapHotel);
    expect(result.isSane).toBe(false);
    expect(result.violations.some(v => v.includes('Accommodation'))).toBe(true);
  });

  it('detects impossible total budget with flights', () => {
    const tinyBudget: CandidatePlan = {
      ...VALID_PLAN,
      id: 'tiny',
      components: [CHEAP_FLIGHT_COMPONENT],
      total_estimated_budget: 50,
    };
    const result = checkPlanSanity(tinyBudget);
    expect(result.violations.some(v => v.includes('impossible'))).toBe(true);
  });

  it('detects flight by title keywords (not just type)', () => {
    const planWithFlightInTitle: CandidatePlan = {
      ...VALID_PLAN,
      id: 'flight-title',
      components: [{
        type: 'transport',
        title: 'Budget Air Ticket',
        details: 'Cheap airline',
        cost_estimate: 50,
        itinerary_day: 1,
        flexibility: 'fixed',
      }],
      total_estimated_budget: 50,
    };
    const result = checkPlanSanity(planWithFlightInTitle);
    expect(result.isSane).toBe(false);
  });

  it('handles EUR currency thresholds', () => {
    const eurPlan: CandidatePlan = {
      ...VALID_PLAN,
      id: 'eur-plan',
      display_currency: { code: 'EUR', symbol: '\u20AC' },
      components: [{
        type: 'transport',
        title: 'Flight to Paris',
        details: 'Direct',
        cost_estimate: 140, // $150 * 0.92 = ~138 EUR threshold
        itinerary_day: 1,
        flexibility: 'fixed',
      }],
      total_estimated_budget: 1500,
    };
    const result = checkPlanSanity(eurPlan);
    // 140 EUR > 138 EUR threshold, so should pass
    expect(result.violations.filter(v => v.includes('Flight cost'))).toHaveLength(0);
  });

  it('handles plans with no flights gracefully', () => {
    const noFlights: CandidatePlan = {
      ...VALID_PLAN,
      id: 'no-flights',
      components: [{
        type: 'activity',
        title: 'City Walking Tour',
        details: 'Free tour',
        cost_estimate: 0,
        itinerary_day: 1,
        flexibility: 'optional',
      }],
      total_estimated_budget: 100,
    };
    const result = checkPlanSanity(noFlights);
    expect(result.isSane).toBe(true);
  });
});
