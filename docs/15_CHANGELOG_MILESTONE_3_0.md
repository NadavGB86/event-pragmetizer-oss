# Milestone 3.0 Changelog — Pragmatism & Real-World Grounding

**Date:** 2026-02-09
**Scope:** Date awareness, two-stage judging with Google Search grounding, Booking.com fix, Pro model for generation

---

## Motivation

User testing of M2.0 revealed a fundamental gap: the app produces plans that look polished but aren't grounded in real-world actionability. Specifically:
1. Booking.com links still produce wrong results (parenthetical text + `dest_type=city` pollution)
2. No date/timeline awareness — can't validate availability, seasonal pricing, or scheduling
3. Single-stage judging is too late and not actionable
4. Generator on Flash model produces lower-quality plans with vague/generic component names

---

## Changes by Phase

### Phase A: Foundation Types

**`types.ts`**
- Added `DateInfo` interface: three-tier (`exact` / `proximity` / `none`) with ISO dates, hints, bounds
- Added `SoftJudgeVerdict` interface: score, summary, suggestions (clickable), date_alignment, grounding_notes
- Modified `UserProfile`: added `date_info: DateInfo`
- Modified `SynthesisRequest.hard_envelope`: added `date_info: DateInfo`
- Modified `JudgeVerdict`: added optional `grounding_notes?: string[]`
- Modified `AppState`: added `softJudgeFeedback: SoftJudgeVerdict | null`

**`constants.ts`**
- Updated `INITIAL_USER_PROFILE`: added `date_info: { tier: 'none' }`

### Phase B: Data Pipeline

**`utils/profileMerge.ts`**
- Added `date_info` merge: scalar overwrite (not array append)

**`utils/readiness.ts`**
- Updated date check: now checks `profile.date_info.tier !== 'none'` with fallback to legacy constraint check

**`utils/requestBuilder.ts`**
- Added `computeDurationFromDates()`: computes `duration_nights` from exact date pairs
- Exact dates override text-parsed duration
- `date_info` passed through to `hard_envelope`

### Phase C: Services & Utilities

**`services/geminiService.ts`**
- Changed `generateCandidatePlans()` from `MODEL_NAME` to `PRO_MODEL_NAME` (Pro model for generation)

**`services/judgeService.ts`**
- Added `softEvaluatePlan()`: advisory judge with Google Search grounding
- Added `SYSTEM_INSTRUCTION_SOFT_JUDGE`: advisory prompt for suggestions and grounding
- Enhanced `evaluatePlan()`: now tries grounding first (`tools: [{ googleSearch: {} }]`), falls back to JSON mode
- Added `extractGroundingNotes()`: extracts verified facts from Gemini grounding metadata
- Added `safeParseJson()`: handles markdown-fenced JSON responses from grounding mode
- Updated `SYSTEM_INSTRUCTION_JUDGE`: hallucinated venues are now fatal flaws, price mismatches from search > 50% are warnings

**`utils/links.ts`**
- Updated `getComponentLinks()` signature: now accepts `participants` and `dateInfo`
- Added `stripParenthetical()`: "Hotel Napa (Boutique)" -> "Hotel Napa"
- Booking.com links: URLSearchParams-based, no `dest_type=city`, includes `checkin`/`checkout`/`group_adults`/`no_rooms`/`group_children`

### Phase D: App State & Flow

**`App.tsx`**
- Added static imports for `softEvaluatePlan` and `evaluatePlan` (removed dynamic import)
- Added transient state: `showDatePivot`, `isSoftJudging`
- Added `softJudgeFeedback` to AppState with setter
- Added `triggerSoftJudge()`: async non-blocking fire-and-forget pattern
- Added `handleContinueWithoutDates()`: bypasses date pivot
- `handleGeneratePlans`: shows date pivot if `date_info.tier === 'none'`
- `handleSelectPlan`: clears soft feedback, fires soft judge
- `handleRefinePlan`: clears soft feedback, fires soft judge after refinement
- localStorage migration: ensures `date_info` and `softJudgeFeedback` exist on old state
- Prop threading: passes `softJudgeFeedback`, `isSoftJudging`, `participants`, `dateInfo` to ExecutionView and FinalItineraryView

### Phase E: UI Components

**`components/ExecutionView.tsx`**
- New props: `softJudgeFeedback`, `isSoftJudging`, `participants`, `dateInfo`
- Added soft judge advisory panel (between itinerary and refinement bar):
  - Loading state: spinner + "Evaluating plan quality..."
  - Score badge (color-coded: green 80+, amber 60-80, red <60)
  - Summary text, date alignment, grounding notes
  - Clickable suggestion chips that fill refinement input
- Updated `getComponentLinks()` calls with `participants` and `dateInfo`

**`components/FinalItineraryView.tsx`**
- New props: `participants`, `dateInfo`
- Added date display in header (exact dates shown as formatted range)
- Added "Verified Facts" section under judge verdict (grounding notes)
- Updated `getComponentLinks()` calls with new params
- Updated `downloadPlanHtml()` call with new params

**`components/ProfileSidebar.tsx`**
- Added "Travel Dates" section with Calendar icon:
  - Exact: formatted date range
  - Proximity: hint text with optional bounds
  - None: "No dates set yet" (italic, muted)

**`utils/shareHtml.ts`**
- Updated `generatePlanHtml()` and `downloadPlanHtml()` signatures to accept `participants` and `dateInfo`
- Passes through to `getComponentLinks()` calls

### Phase F: Prompt Engineering

**`constants.ts` — SYSTEM_INSTRUCTION_ANALYST**
- Added date extraction instructions: three-tier system with examples
- Added date probing: analyst asks about dates after 3+ exchanges if not mentioned
- Updated JSON example to include `date_info`

**`constants.ts` — SYSTEM_INSTRUCTION_GENERATOR**
- Added rule 8: date awareness (exact -> specific scheduling, proximity -> seasonal estimates, none -> off-peak defaults)
- Added rule 9: seasonal pricing awareness (peak/shoulder/off-peak multipliers)

---

## Files Changed (13 total)

| File | Change Type |
|------|------------|
| `types.ts` | +2 interfaces, modify 4 existing |
| `constants.ts` | Update 2 prompts, update initial profile |
| `utils/profileMerge.ts` | Add date_info merge |
| `utils/readiness.ts` | Update date check |
| `utils/requestBuilder.ts` | Pass date_info, compute duration from exact dates |
| `services/geminiService.ts` | Generator model -> PRO |
| `services/judgeService.ts` | +softEvaluatePlan(), grounding on both judges, new prompts |
| `utils/links.ts` | Booking.com rewrite, new params |
| `App.tsx` | State, date pivot, soft judge triggers, prop threading |
| `components/ExecutionView.tsx` | Soft judge panel, suggestion chips |
| `components/FinalItineraryView.tsx` | Grounding notes, date display, link params |
| `components/ProfileSidebar.tsx` | Date info section |
| `utils/shareHtml.ts` | Signature + link params |

---

## Model Routing (M3.0)

| Model | Used By |
|-------|---------|
| `gemini-3-flash-preview` (MODEL_NAME) | Analyst chat only |
| `gemini-3-pro-preview` (PRO_MODEL_NAME) | Generator, Refiner, Hard Judge, Soft Judge |

---

## Technical Notes

- **`responseMimeType` + `tools` conflict:** Gemini does not support `responseMimeType: "application/json"` together with `tools: [{ googleSearch: {} }]`. Both judges try grounding first; on error, fall back to JSON mode. `safeParseJson()` handles markdown-fenced responses.
- **Soft judge is fire-and-forget:** Non-blocking async pattern. UI shows spinner while waiting. User can start refining immediately.
- **Date pivot is transient state:** `showDatePivot` is not in `AppState`, not undoable. It's just a UI prompt that disappears.
- **localStorage migration:** `loadInitialState()` patches old state with default `date_info: { tier: 'none' }` and `softJudgeFeedback: null`.
