> **ARCHIVED (2026-02-09):** This document was written during pre-recovery analysis.
> Targets 1.1 (profile merge), 1.2 (readiness gate), 2.2 (deterministic scoring), 2.3 (temperature),
> 2.4 (childcare), 5.1 (currency), 5.2 (back-nav) have all been implemented.
> **Do not use as current TODO list.** See `CLAUDE.md` for current state.

# Technical Review & Improvement Targets (ARCHIVED)

## Purpose

Actionable critique of the current codebase with clearly scoped improvement targets.
Each target is defined with enough specificity that a coding agent can implement it
without ambiguity. Targets are ordered by impact, grouped by system layer.

---

## Layer 1: Data Integrity (Profile Extraction)

### Issue 1.1: Array Overwrite on Profile Merge

**Location:** `App.tsx`, `handleSendMessage`, lines ~47-52

**Problem:** The profile merge uses shallow spread:
```typescript
needs: { ...prev.needs, ...result.profileUpdate?.needs }
```
If the first extraction yields `constraints: [{budget}]` and the second yields
`constraints: [{time}]`, the second call overwrites the first. All previously
extracted constraints are lost.

**Impact:** Critical. The profile degrades with every message instead of accumulating.

**Target 1.1: Implement array-aware profile merge**

Requirements:
- Arrays (constraints, standards, habits, traits, latent_desires, targets, declared_wants, visions) must APPEND, not replace
- Deduplicate by semantic similarity (exact match on `type` + `value` for constraints, exact string match for simple arrays)
- Non-array fields (if any are added later) use standard overwrite
- Write a dedicated `mergeProfile(existing: UserProfile, update: Partial<UserProfile>): UserProfile` utility function
- Add unit tests for merge behavior: empty update, partial update, duplicate detection, array growth across 3+ merges

**Implementation approach:**
```typescript
// utils/profileMerge.ts
function mergeArrayField<T>(existing: T[], incoming: T[], deduplicateKey?: keyof T): T[] {
  if (!incoming || incoming.length === 0) return existing;
  const merged = [...existing];
  for (const item of incoming) {
    const isDuplicate = deduplicateKey
      ? merged.some(e => e[deduplicateKey] === item[deduplicateKey])
      : merged.some(e => JSON.stringify(e) === JSON.stringify(item));
    if (!isDuplicate) merged.push(item);
  }
  return merged;
}
```

---

### Issue 1.2: No Profile Completeness Validation

**Location:** `App.tsx`, the "Generate Plans" button appears when `messages.length > 2`

**Problem:** There is no check on whether the extracted profile contains minimum
required data. A user could say "hi" → "sure" → click Generate. The system would
send an empty profile to the plan generator.

**Impact:** High. Produces meaningless plans from insufficient data.

**Target 1.2: Add readiness gate with blocking question detection**

Requirements:
- Define a `ProfileReadiness` type with fields: `isReady: boolean`, `missingCritical: string[]`, `missingOptional: string[]`
- Critical fields that block generation: at least 1 constraint of type "budget", at least 1 target or declared_want, event_type identified
- Optional but recommended: date range, duration, geographic preferences
- The "Generate Plans" button must be disabled when `isReady === false`
- Display `missingCritical` items as a checklist near the button ("Still needed: budget, dates")
- Implement as a pure function: `assessReadiness(profile: UserProfile): ProfileReadiness`

---

## Layer 2: Plan Generation Quality

### Issue 2.1: No Constraint Enforcement in Generator Prompt

**Location:** `constants.ts`, `SYSTEM_INSTRUCTION_GENERATOR`

**Problem:** The generator prompt says "generate 3 plans based on this profile" but
does not extract hard constraints and embed them as explicit rules. The LLM receives
a JSON dump and interprets it freely. It can (and does) produce plans that violate
hard constraints while self-reporting high feasibility scores.

**Impact:** Critical. The core value proposition is constraint-aware planning.

**Target 2.1: Build a SynthesisRequest from the profile before calling the generator**

Requirements:
- Create a `buildSynthesisRequest(profile: UserProfile): SynthesisRequest` function
- Extract all hard constraints and encode them as explicit rules in the prompt:
  ```
  HARD RULES (violations = plan rejection):
  - Total budget MUST NOT exceed 8000 ILS
  - All flights MUST be direct from TLV
  - Maximum logistics complexity: LOW (no multi-leg transfers)
  - Trip duration: 2-4 nights
  ```
- Include scoring weights derived from the profile (partner satisfaction 40%, planner satisfaction 15%, etc.)
- Pass the SynthesisRequest as a structured section in the generator system instruction, separate from the raw profile
- Add a post-generation validation step that checks each returned plan against the hard rules and rejects/flags violations

---

### Issue 2.2: Feasibility Scores Are LLM-Asserted, Not Computed

**Location:** `services/geminiService.ts`, `generateCandidatePlans`

**Problem:** The LLM assigns its own feasibility_score (0-100) to each plan. This
score has no grounding in actual constraint evaluation. Observed in outputs: a plan
at 99.4% of budget gets 88% feasibility while a plan at 90% of budget gets 95%.
The correlation between actual constraint satisfaction and reported score is weak.

**Impact:** Critical. Users make selection decisions based on these numbers.

**Target 2.2: Implement deterministic feasibility scoring**

Requirements:
- Create `scoreFeasibility(plan: CandidatePlan, profile: UserProfile): FeasibilityEvaluation`
- Compute per-dimension scores:

  | Dimension | Scoring Logic |
  |---|---|
  | budget_fit | 100 if under budget, linear decay 100→0 as overage goes 0→20% |
  | logistics_complexity | Based on transfer count, flight directness, hotel centrality |
  | experience_quality | % of declared_wants addressed by plan components |
  | constraint_satisfaction | Binary per hard constraint, weighted average |
  | desire_fulfillment | % of targets met at must_have > strong_want > nice_to_have |

- Overall score = weighted average of dimensions using profile-derived weights
- Hard floor check: if ANY hard constraint is violated, cap overall score at 40% regardless of other dimensions
- Return both overall score and per-dimension breakdown
- Replace the LLM-asserted score with the computed score before displaying to user

---

### Issue 2.3: Temperature Too High for Structured Output

**Location:** `services/geminiService.ts`, `generateCandidatePlans`, temperature: 0.8

**Problem:** High temperature increases variance in numerical outputs (budgets,
scores) and reduces schema adherence. Creative naming benefits from high temp;
budget arithmetic does not.

**Impact:** Medium. Contributes to inconsistent budget figures.

**Target 2.3: Split creative and structured generation**

Requirements:
- Option A (simpler): Lower temperature to 0.5 for the entire plan generation call. Accept slightly less creative titles.
- Option B (better): Two-pass generation. First pass at temp 0.7 generates plan concepts (title, summary, destination, component types). Second pass at temp 0.3 fills in structured fields (costs, logistics details, flexibility tags) within hard constraints.
- For MVP, Option A is sufficient.

---

### Issue 2.4: Childcare Constraint Misinterpreted

**Observed in outputs:** Plans include a "Childcare Support" component categorized
as ACCOMMODATION, described as "evening babysitting services" at the destination.
The actual constraint is childcare for the toddler *at home in Israel* while the
couple is abroad.

**Impact:** High. Demonstrates that the LLM misunderstands a core constraint.

**Target 2.4: Separate home logistics from destination logistics in the data model**

Requirements:
- Add a `pre_departure_logistics` section to the plan schema:
  ```typescript
  interface PreDepartureLogistics {
    childcare: { description: string; resolved: boolean; cost_estimate?: number; outside_trip_budget: boolean };
    pet_care: { description: string; resolved: boolean; cost_estimate?: number; outside_trip_budget: boolean };
    other: string[];
  }
  ```
- In the generator prompt, explicitly instruct: "Childcare and pet care are HOME logistics in Israel. They are NOT destination activities. Their costs are OUTSIDE the trip budget. Include them in pre_departure_logistics, NOT in plan components."
- Display pre-departure logistics in the Execution view as a separate "Before You Go" checklist, not as timeline components

---

## Layer 3: Matching Loop

### Issue 3.1: No Iterative Adjustment

**Problem:** The spec defines a matching loop that evaluates plans against the
feasibility threshold and sends failing plans back for adjustment. The current
implementation has no loop -- plans are generated once and displayed.

**Impact:** Critical. This is a core spec feature. Without it, the user sees
whatever the LLM generates on the first try, with no quality improvement.

**Target 3.1: Implement a bounded adjustment loop**

Requirements:
- After `generateCandidatePlans` returns, run `scoreFeasibility` on each plan
- If any plan scores below threshold (e.g., 70%):
  1. Identify the lowest-scoring dimension
  2. Generate an adjustment directive: "Reduce accommodation cost by 15%" or "Replace activity X with a lower-cost alternative"
  3. Call the LLM with the original plan + directive to produce an adjusted version
  4. Re-score the adjusted plan
  5. Repeat up to `max_iterations = 3`
- Exit conditions: all plans above threshold, OR convergence (score delta < 2% between iterations), OR max iterations reached
- Track iteration count per plan for debugging
- UI: show a "Refining plans..." spinner during the loop, not per-iteration updates (users don't need to see intermediate states)

---

## Layer 4: Execution Layer

### Issue 4.1: No LLM 2 (Executor) Call

**Problem:** The Execution view displays the same `CandidatePlan` object from
Segment C. There is no enrichment step that converts a plan skeleton into an
actionable itinerary with booking links, contingencies, and day-by-day structure.

**Impact:** Major. The execution view is currently a prettier version of the
comparison card, not an actionable plan.

**Target 4.1: Implement the Executor LLM call**

Requirements:
- Create `generateExecutionPlan(plan: CandidatePlan, profile: UserProfile): ExecutionPlan`
- New types needed:
  ```typescript
  interface ExecutionPlan {
    approved_plan_id: string;
    day_plans: DayPlan[];
    pre_departure: PreDepartureLogistics;
    contingency_notes: string[];
    packing_suggestions: string[];
    budget_summary: { category: string; estimated: number; }[];
  }
  interface DayPlan {
    day_number: number;
    title: string;
    blocks: TimeBlock[];
    flex_windows: string[];
    fallback_options: string[];
  }
  interface TimeBlock {
    time: string;
    activity: string;
    location: string;
    notes: string;
    booking_required: boolean;
    booking_link?: string;
  }
  ```
- System instruction for LLM 2 should emphasize: precision, real opening hours where known, buffer time between activities (minimum 30 min), fallback options for every fixed-time activity, and explicit "no action needed" markers for pre-booked items
- Temperature: 0.3-0.4 (precision mode)
- The Execution view should render DayPlans as expandable day sections, not the flat component timeline currently shown

---

## Layer 5: Frontend / UX

### Issue 5.1: Currency Display Ambiguity

**Location:** `PlanComparison.tsx`, `ExecutionView.tsx`

**Problem:** Dollar sign icon (`<DollarSign>`) used for ILS amounts. User specified
budget in ILS. Plans display amounts that could be ILS or EUR depending on
interpretation.

**Target 5.1:** Replace `<DollarSign>` with a text-based `₪` prefix or a custom ILS
icon. Ensure all displayed amounts include the currency code: "₪7,950" or
"7,950 ILS". The generator prompt should specify: "All costs must be in ILS."

### Issue 5.2: No Back-Navigation Between Phases

**Location:** `App.tsx` -- phase transitions are one-directional

**Target 5.2:** Add back-navigation:
- From MATCHING → INTAKE: "Refine Profile" button that preserves existing profile and chat history
- From EXECUTION → MATCHING: Already implemented via `onBack` prop (good)
- Preserve state when navigating backwards (don't reset profile or plans)

### Issue 5.3: No Multi-Dimensional Feasibility Display

**Location:** `PlanComparison.tsx` -- shows single percentage

**Target 5.3:** After implementing Target 2.2 (deterministic scoring), display
the per-dimension breakdown on each plan card. Use a compact horizontal bar chart
or a radar/spider chart showing the 5 dimensions. The overall score remains
prominent, but dimension scores are visible on hover or in an expandable section.

### Issue 5.4: Generate Button Placement and State

**Location:** `App.tsx` -- floating button at bottom of chat

**Target 5.4:** Move the generate button to a fixed position (not floating over chat).
Show readiness state next to it: "Ready to generate" (green) vs. "Need more info:
budget, dates" (amber with missing items listed). Disable when not ready.

---

## Implementation Priority Order

For an AI coding agent working through these targets:

### Phase 1: Data Foundation (Targets 1.1, 1.2, 2.4)
Fix profile merge → Add readiness gate → Fix childcare model.
These are prerequisite for everything else.

### Phase 2: Intelligence Layer (Targets 2.1, 2.2, 2.3)
Build SynthesisRequest → Implement deterministic scoring → Adjust temperature.
This makes plan generation reliable.

### Phase 3: Core Loop (Target 3.1)
Implement bounded adjustment loop using the scoring from Phase 2.
This is the spec's differentiating feature.

### Phase 4: Execution (Target 4.1)
Implement LLM 2 call and enrich the execution view.
This makes the output actionable.

### Phase 5: UX Polish (Targets 5.1-5.4)
Currency, navigation, feasibility display, button states.
These improve trust and usability.
