import { describe, it, expect } from 'vitest';
import { mergeProfile } from './profileMerge';
import { EMPTY_PROFILE, MINIMAL_READY_PROFILE } from './__fixtures__';
import { UserProfile } from '../types';

describe('mergeProfile', () => {
  it('returns existing profile when update is empty', () => {
    const result = mergeProfile(MINIMAL_READY_PROFILE, {});
    expect(result).toEqual(MINIMAL_READY_PROFILE);
  });

  it('overwrites date_info (not merges)', () => {
    const result = mergeProfile(EMPTY_PROFILE, {
      date_info: { tier: 'exact', start_date: '2026-06-01', end_date: '2026-06-05' },
    });
    expect(result.date_info.tier).toBe('exact');
    expect(result.date_info.start_date).toBe('2026-06-01');
  });

  it('appends new constraints without duplicates', () => {
    const existing = structuredClone(MINIMAL_READY_PROFILE);
    const result = mergeProfile(existing, {
      needs: {
        ...existing.needs,
        constraints: [
          { type: 'budget', value: '$3,000 USD', flexibility: 'hard' }, // duplicate
          { type: 'time', value: '3 nights', flexibility: 'hard' }, // new
        ],
      },
    });
    // Should have budget (original) + time (new), not duplicate budget
    expect(result.needs.constraints).toHaveLength(2);
    expect(result.needs.constraints.map(c => c.type)).toContain('time');
  });

  it('deduplicates constraints by type + value', () => {
    const existing: UserProfile = structuredClone(EMPTY_PROFILE);
    existing.needs.constraints = [{ type: 'budget', value: '$3,000 USD', flexibility: 'hard' }];

    const result = mergeProfile(existing, {
      needs: {
        ...existing.needs,
        constraints: [{ type: 'budget', value: '$3,000 USD', flexibility: 'soft' }], // same type+value, different flexibility
      },
    });
    // type + value match, so should NOT add duplicate
    expect(result.needs.constraints).toHaveLength(1);
  });

  it('appends new declared_wants', () => {
    const result = mergeProfile(MINIMAL_READY_PROFILE, {
      goals: {
        ...MINIMAL_READY_PROFILE.goals,
        declared_wants: ['nightlife', 'beach'], // 'beach' already exists
      },
    });
    // 'beach' + 'relaxation' (original) + 'nightlife' (new)
    expect(result.goals.declared_wants).toContain('nightlife');
    expect(result.goals.declared_wants).toContain('beach');
    expect(result.goals.declared_wants).toContain('relaxation');
    // No duplicate 'beach'
    expect(result.goals.declared_wants.filter(w => w === 'beach')).toHaveLength(1);
  });

  it('deduplicates targets by description', () => {
    const existing = structuredClone(MINIMAL_READY_PROFILE);
    existing.goals.targets = [
      { description: 'Visit Barcelona', priority: 'must_have', category: 'experience' },
    ];
    const result = mergeProfile(existing, {
      goals: {
        ...existing.goals,
        targets: [
          { description: 'Visit Barcelona', priority: 'strong_want', category: 'experience' }, // same desc
          { description: 'Try local food', priority: 'nice_to_have', category: 'experience' }, // new
        ],
      },
    });
    expect(result.goals.targets).toHaveLength(2);
  });

  it('deduplicates visions by description', () => {
    const result = mergeProfile(MINIMAL_READY_PROFILE, {
      goals: {
        ...MINIMAL_READY_PROFILE.goals,
        visions: [
          { description: 'Relaxing beach getaway', reference_type: 'text' }, // duplicate
          { description: 'Adventure trip', reference_type: 'text' }, // new
        ],
      },
    });
    // Original had 1 vision, adding 1 new = 2
    expect(result.goals.visions).toHaveLength(2);
  });

  it('merges standards without duplicates', () => {
    const existing = structuredClone(MINIMAL_READY_PROFILE);
    existing.needs.standards = ['4-star hotels'];
    const result = mergeProfile(existing, {
      needs: {
        ...existing.needs,
        standards: ['4-star hotels', 'all-inclusive'],
      },
    });
    expect(result.needs.standards).toHaveLength(2);
    expect(result.needs.standards).toContain('all-inclusive');
  });

  it('preserves participants from update when provided', () => {
    const result = mergeProfile(EMPTY_PROFILE, {
      needs: {
        ...EMPTY_PROFILE.needs,
        participants: { adults: 4, children: 2, room_count: 2, description: 'Extended family' },
      },
    });
    expect(result.needs.participants.adults).toBe(4);
    expect(result.needs.participants.description).toBe('Extended family');
  });

  it('does not mutate the original profile', () => {
    const original = structuredClone(MINIMAL_READY_PROFILE);
    const originalConstraintCount = original.needs.constraints.length;
    mergeProfile(original, {
      needs: {
        ...original.needs,
        constraints: [{ type: 'time', value: '5 days', flexibility: 'hard' }],
      },
    });
    expect(original.needs.constraints).toHaveLength(originalConstraintCount);
  });
});
