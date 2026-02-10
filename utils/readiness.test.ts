import { describe, it, expect } from 'vitest';
import { assessReadiness } from './readiness';
import { EMPTY_PROFILE, MINIMAL_READY_PROFILE, FULL_PROFILE } from './__fixtures__';

describe('assessReadiness', () => {
  it('marks empty profile as NOT ready', () => {
    const result = assessReadiness(EMPTY_PROFILE);
    expect(result.isReady).toBe(false);
    expect(result.missingCritical).toContain('Budget');
    expect(result.missingCritical).toContain('Event Vision / Wants');
  });

  it('marks profile with budget + vision as ready', () => {
    const result = assessReadiness(MINIMAL_READY_PROFILE);
    expect(result.isReady).toBe(true);
    expect(result.missingCritical).toHaveLength(0);
  });

  it('flags missing budget as critical', () => {
    const noBudget = structuredClone(MINIMAL_READY_PROFILE);
    noBudget.needs.constraints = [];
    const result = assessReadiness(noBudget);
    expect(result.isReady).toBe(false);
    expect(result.missingCritical).toContain('Budget');
  });

  it('flags missing vision as critical', () => {
    const noVision = structuredClone(MINIMAL_READY_PROFILE);
    noVision.goals.declared_wants = [];
    noVision.goals.targets = [];
    noVision.goals.visions = [];
    const result = assessReadiness(noVision);
    expect(result.isReady).toBe(false);
    expect(result.missingCritical).toContain('Event Vision / Wants');
  });

  it('reports optional missing items', () => {
    const result = assessReadiness(MINIMAL_READY_PROFILE);
    // No dates, no logistics, default participants
    expect(result.missingOptional).toContain('Dates');
    expect(result.missingOptional).toContain('Logistics');
  });

  it('full profile has no missing items', () => {
    const result = assessReadiness(FULL_PROFILE);
    expect(result.isReady).toBe(true);
    expect(result.missingCritical).toHaveLength(0);
    expect(result.missingOptional).toHaveLength(0);
  });

  it('considers date_info tier for date check', () => {
    const withDates = structuredClone(MINIMAL_READY_PROFILE);
    withDates.date_info = { tier: 'exact', start_date: '2026-03-15', end_date: '2026-03-18' };
    const result = assessReadiness(withDates);
    expect(result.missingOptional).not.toContain('Dates');
  });

  it('considers time constraint as dates fallback', () => {
    const withTimeConstraint = structuredClone(MINIMAL_READY_PROFILE);
    withTimeConstraint.needs.constraints.push({ type: 'time', value: '3 nights', flexibility: 'hard' });
    const result = assessReadiness(withTimeConstraint);
    expect(result.missingOptional).not.toContain('Dates');
  });

  it('marks default participants as optional missing', () => {
    const defaultParticipants = structuredClone(MINIMAL_READY_PROFILE);
    defaultParticipants.needs.participants = { adults: 1, children: 0, room_count: 1, description: 'Single Traveler' };
    const result = assessReadiness(defaultParticipants);
    expect(result.missingOptional).toContain("Who's coming");
  });

  it('non-default participants are not flagged', () => {
    const result = assessReadiness(MINIMAL_READY_PROFILE);
    // MINIMAL has adults: 2, description: 'Couple'
    expect(result.missingOptional).not.toContain("Who's coming");
  });
});
