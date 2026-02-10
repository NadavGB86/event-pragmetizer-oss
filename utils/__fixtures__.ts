/**
 * Shared test fixtures for Event Pragmetizer utilities.
 */
import { UserProfile, CandidatePlan, SynthesisRequest, PlanComponent } from '../types';
import { INITIAL_USER_PROFILE } from '../constants';

// --- Profile Fixtures ---

/** Bare-minimum profile — no constraints, no goals */
export const EMPTY_PROFILE: UserProfile = structuredClone(INITIAL_USER_PROFILE);

/** Profile with budget + vision — the minimum to be "ready" */
export const MINIMAL_READY_PROFILE: UserProfile = {
  needs: {
    participants: { adults: 2, children: 0, room_count: 1, description: 'Couple' },
    standards: [],
    habits: [],
    traits: [],
    constraints: [{ type: 'budget', value: '$3,000 USD', flexibility: 'hard' }],
    latent_desires: [],
  },
  goals: {
    targets: [],
    declared_wants: ['beach', 'relaxation'],
    considerations: [],
    visions: [{ description: 'Relaxing beach getaway', reference_type: 'text' }],
  },
  date_info: { tier: 'none' },
};

/** Full profile with dates, logistics, etc. */
export const FULL_PROFILE: UserProfile = {
  needs: {
    participants: { adults: 2, children: 1, room_count: 1, description: '2 Adults + 1 Child' },
    standards: ['4-star hotels', 'kid-friendly'],
    habits: ['early riser'],
    traits: ['stress-sensitive'],
    constraints: [
      { type: 'budget', value: '$5,000 USD', flexibility: 'soft' },
      { type: 'time', value: '4-5 nights', flexibility: 'hard' },
      { type: 'logistics', value: 'Need car seat for child', flexibility: 'hard' },
    ],
    latent_desires: ['wants quality time'],
  },
  goals: {
    targets: [{ description: 'Visit Barcelona', priority: 'must_have', category: 'experience' }],
    declared_wants: ['beach', 'culture', 'family dining'],
    considerations: ['child-safe activities'],
    visions: [{ description: 'Mediterranean family vacation', reference_type: 'text' }],
  },
  date_info: {
    tier: 'exact',
    start_date: '2026-07-10',
    end_date: '2026-07-14',
  },
};

// --- Plan Component Fixtures ---

export const FLIGHT_COMPONENT: PlanComponent = {
  type: 'transport',
  title: 'Round-trip flight to Barcelona',
  details: 'TLV → BCN direct',
  cost_estimate: 800,
  itinerary_day: 1,
  flexibility: 'fixed',
};

export const CHEAP_FLIGHT_COMPONENT: PlanComponent = {
  type: 'transport',
  title: 'Flight to Barcelona',
  details: 'Budget airline',
  cost_estimate: 50, // Unrealistically cheap
  itinerary_day: 1,
  flexibility: 'fixed',
};

export const HOTEL_COMPONENT: PlanComponent = {
  type: 'accommodation',
  title: 'Hotel Arts Barcelona',
  details: '4-star beachfront',
  cost_estimate: 600,
  itinerary_day: 1,
  flexibility: 'movable',
};

export const CHEAP_HOTEL_COMPONENT: PlanComponent = {
  type: 'accommodation',
  title: 'Budget Hostel',
  details: 'Shared dorm',
  cost_estimate: 10, // Below threshold
  itinerary_day: 1,
  flexibility: 'movable',
};

export const ACTIVITY_COMPONENT: PlanComponent = {
  type: 'activity',
  title: 'Sagrada Familia Tour',
  details: 'Guided tour of the basilica',
  cost_estimate: 120,
  itinerary_day: 2,
  flexibility: 'movable',
};

export const DINING_COMPONENT: PlanComponent = {
  type: 'dining',
  title: 'La Boqueria Market Dinner',
  details: 'Fresh seafood dinner at the market',
  cost_estimate: 80,
  itinerary_day: 2,
  flexibility: 'optional',
};

// --- Plan Fixtures ---

export const VALID_PLAN: CandidatePlan = {
  id: 'plan-1',
  title: 'Barcelona Beach & Culture',
  summary: 'A balanced beach and culture trip to Barcelona with family dining options.',
  components: [FLIGHT_COMPONENT, HOTEL_COMPONENT, ACTIVITY_COMPONENT, DINING_COMPONENT],
  total_estimated_budget: 1600,
  feasibility_score: 85,
  match_reasoning: 'Good match for beach + culture wants',
  tradeoffs: ['Could be tighter on budget with upgrades'],
  display_currency: { code: 'USD', symbol: '$' },
};

export const INSANE_PLAN: CandidatePlan = {
  id: 'plan-insane',
  title: 'Too Good to Be True',
  summary: 'Suspiciously cheap plan.',
  components: [CHEAP_FLIGHT_COMPONENT, CHEAP_HOTEL_COMPONENT],
  total_estimated_budget: 60,
  feasibility_score: 90,
  match_reasoning: 'Budget-friendly',
  tradeoffs: [],
  display_currency: { code: 'USD', symbol: '$' },
};

export const OVER_BUDGET_PLAN: CandidatePlan = {
  ...VALID_PLAN,
  id: 'plan-over',
  total_estimated_budget: 4000, // 33% over $3000 limit
};

// --- Synthesis Request Fixtures ---

export const DEFAULT_REQUEST: SynthesisRequest = {
  hard_envelope: {
    budget_ils: 11400,
    budget: 3000,
    currency: 'USD',
    currency_symbol: '$',
    duration_nights: { min: 4, max: 5 },
    origin: 'TLV',
    date_info: { tier: 'none' },
  },
  scoring_weights: {
    budget_fit: 0.4,
    experience_match: 0.4,
    logistics_ease: 0.2,
  },
  user_context: MINIMAL_READY_PROFILE,
};
