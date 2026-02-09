> **ARCHIVED (2026-02-09):** This document was written during pre-recovery analysis (before Phase 5).
> Most gaps identified here have been fixed in Milestone 1.0 and 2.0.
> **Do not use as current guidance.** See `CLAUDE.md` for current state.

# Plan vs. Implementation: Gap Analysis (ARCHIVED)

## Purpose

This document maps the original product specification against the current codebase,
identifying where the implementation aligns, where it diverges, and what the
divergence implies for the next development phase.

---

## 1. Architectural Pipeline

### Spec Vision

A five-segment sequential pipeline with a feedback loop:

```
[A: Needs Profile] → [B: Goals Profile] → [C: Plan Synthesis] → [D: Matching Loop] → [E: Execution]
                                                                        ↑           |
                                                                        └───────────┘
                                                                     (iterate until feasible)
```

Key architectural properties:
- Segments A+B are conversational extraction with structured output
- Segment C generates multiple candidate plans concurrently
- Segment D is a **deterministic evaluation loop** with a multi-dimensional feasibility threshold
- Segment E converts an approved plan into an actionable, bookable itinerary
- LLM 1 (Analyst) handles A+B+C; LLM 2 (Executor) handles E
- The matching loop (D) is computation, not LLM inference

### Current Implementation

A three-phase linear flow with no feedback:

```
[INTAKE (chat)] → [SYNTHESIS (single LLM call)] → [MATCHING (display)] → [EXECUTION (display)]
```

Properties:
- Intake combines A+B into one chat with JSON extraction
- Synthesis and Matching are collapsed: one `generateCandidatePlans()` call returns plans with pre-baked feasibility scores
- No iterative adjustment loop exists
- Execution view displays the plan but doesn't generate new content (no LLM 2 call)
- There is no deterministic feasibility evaluation

### Gap Summary

| Spec Segment | Implementation | Gap Severity |
|---|---|---|
| A: Needs Profiling | Chat + JSON extraction | Partial (merge logic broken) |
| B: Goals Characterization | Combined with A in same chat | Acceptable for MVP |
| C: Plan Synthesis | Single LLM call with JSON output | Working but unvalidated |
| D: Matching & Adjustment Loop | **Not implemented** | Critical |
| E: Execution & Maturation | Static display of Segment C output | Major (no LLM 2 call) |
| Feasibility Threshold | LLM self-reports scores | Critical (scores are fabricated) |
| Constraint Envelope | Not enforced programmatically | Critical |
| Data Enrichment (flights, hotels) | Not implemented | Expected for MVP scope |

---

## 2. Data Model

### Spec Vision

Two distinct structured outputs feeding a typed synthesis request:

```
NeedsProfile {standards, habits, traits, constraints[], latent_desires}
GoalsProfile {targets[], declared_wants, considerations, visions[]}
    ↓
SynthesisRequest {hard_envelope, scoring_weights, generation_parameters}
    ↓
CandidatePlan {components[], feasibility_score, constraint_violations[]}
    ↓
FeasibilityEvaluation {dimension_scores{}, adjustment_directives[]}
    ↓
ExecutionPlan {itinerary[], booking_actions[], contingency_notes[]}
```

### Current Implementation

```typescript
// types.ts
UserProfile { needs: NeedsProfile, goals: GoalsProfile }
    ↓
CandidatePlan { components[], feasibility_score, tradeoffs[] }
    // No SynthesisRequest, no FeasibilityEvaluation, no ExecutionPlan
```

### Gap Analysis

| Schema | Spec | Implemented | Missing |
|---|---|---|---|
| NeedsProfile | 5 fields with typed Constraint[] | 5 fields, Constraint has type/value/flexibility | Constraint lacks `id`, `scope`, `excludes` |
| GoalsProfile | Targets with priority+category, Visions with reference_type | Implemented correctly | Missing `anti_targets` |
| SynthesisRequest | Hard envelope + scoring weights + generation params | **Does not exist** | Entire synthesis configuration layer |
| CandidatePlan | Components + violations + match_reasoning | Components + tradeoffs + match_reasoning | Missing `constraint_violations[]` |
| FeasibilityEvaluation | Multi-dimensional scores + adjustment directives | **Does not exist** | Entire evaluation layer |
| ExecutionPlan | Day plans + booking actions + contingencies | **Does not exist** | Entire execution layer |

The most consequential missing piece is `SynthesisRequest`. Without it, the LLM receives a raw profile dump and guesses at constraints rather than operating within a programmatically defined envelope. This is why the current outputs can produce plans that ignore hard constraints.

---

## 3. LLM Usage

### Spec Vision

| Role | Model Behavior | Temperature | Purpose |
|---|---|---|---|
| LLM 1 (Analyst) | High-temp, exploratory | 0.7 | Creative profiling, option generation |
| Feasibility Engine | Deterministic computation | N/A | Score plans against constraints |
| LLM 2 (Executor) | Low-temp, precise | 0.3-0.4 | Convert approved plan to actionable itinerary |

### Current Implementation

| Call | Model | Temperature | What It Does |
|---|---|---|---|
| `sendMessageToAnalyst` | gemini-3-flash-preview | 0.7 | Chat + extract profile JSON |
| `generateCandidatePlans` | gemini-3-flash-preview | 0.8 | Generate 3 plans with self-scored feasibility |
| `refinePlan` | gemini-3-flash-preview | default | Unused in UI (function exists but never called) |

### Gaps

1. **No deterministic evaluation layer.** Feasibility scores are whatever the LLM claims. There is no function that takes a `CandidatePlan` and a `NeedsProfile` and computes a score.

2. **No LLM 2 call.** The Execution view renders the same `CandidatePlan` from Segment C. The spec envisions a separate LLM call that takes the approved plan skeleton and enriches it with booking links, contingency plans, pre-departure checklists, and day-by-day detail.

3. **Temperature 0.8 for plan generation is too high.** Budget arithmetic and constraint adherence degrade at high temperature. The creative elements (plan titles, descriptions) can tolerate 0.8, but the structured JSON with numerical fields should use 0.4-0.5.

4. **No structured output enforcement.** The generator prompt asks for JSON but doesn't enforce field-level constraints (e.g., "total_estimated_budget MUST be <= 8000"). The LLM self-validates, which it does poorly.

---

## 4. Frontend / UX

### Spec Vision

| View | Description |
|---|---|
| Intake | Conversational chat + live structured sidebar with real-time extraction |
| Plan Presentation | 2-3 variants side-by-side with tradeoff labels, budget breakdown charts, constraint satisfaction indicators |
| Execution | Three detail levels (glance/day/detail) with PDF export, calendar sync, offline access |

### Current Implementation

| View | Description | Alignment |
|---|---|---|
| Intake | Chat left + sidebar right | Good match |
| Plan Comparison | 3 cards with title, budget, tradeoffs, top 3 components | Good match (missing charts and constraint indicators) |
| Execution | Timeline view with alternating cards | Partial (single detail level, no export) |

### What Works Well

- The three-phase header indicator is clean and communicates state
- The plan comparison cards have good information density
- The timeline execution view is visually clear with fixed/movable badges
- The sidebar "Live Context" concept is correct

### What's Missing

- **No readiness gate** before "Generate Plans" -- button appears after 2 messages regardless of profile completeness
- **No multi-dimensional feasibility display** -- single percentage instead of per-dimension breakdown
- **No constraint relaxation suggestions** -- when plans are tight, no "if you add X, Y becomes possible"
- **No back-navigation from Matching to Intake** -- user is stuck if they forgot something
- **No export** from Execution view
- **Currency ambiguity** -- `$` icon used for ILS amounts

---

## 5. Critical Path for Next Phase

Ordered by impact on output quality:

### Must Fix (output correctness)

1. **Implement deterministic feasibility scoring** -- a function, not an LLM opinion
2. **Fix profile merge logic** -- arrays are overwritten instead of appended
3. **Add constraint enforcement to the generator prompt** -- explicit hard limits in the system instruction
4. **Fix childcare constraint interpretation** -- home logistics vs. destination services

### Must Build (core spec features)

5. **Implement the matching/adjustment loop** -- even 2-3 iterations with real scoring
6. **Add readiness gate before plan generation** -- check for blocking questions
7. **Implement LLM 2 (Executor) call** -- enrich approved plan into actionable itinerary

### Should Improve (UX quality)

8. **Add back-navigation between phases**
9. **Display ILS currency explicitly**
10. **Add multi-dimensional feasibility breakdown to plan cards**
11. **Lower temperature for structured JSON generation**
