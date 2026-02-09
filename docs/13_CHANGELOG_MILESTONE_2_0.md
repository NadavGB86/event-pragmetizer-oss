# Changelog - Milestone 2.0

**Date:** 2026-02-09
**Focus:** Recovery from SDK corruption + Authentication + Cloud + Pro Model + Rich Output
**Stable Checkpoint:** `c356f5d`

---

## Recovery (from Gemini agent SDK corruption)

The Gemini agent mixed `@google/genai` and `@google/generative-ai`, causing build failures.
Codebase was reset to `04ca39b` and rebuilt by Claude in 4 phases.

### Phase 1: Core Bug Fixes
- **Profile merge** wired into App.tsx with array-aware deduplication (`utils/profileMerge.ts`)
- **localStorage error resilience** — corrupted data won't crash the app
- **Model name centralized** — single `MODEL_NAME` in `constants.ts`
- **ExecutionView dynamic** — days/location from plan data, not hardcoded
- **Stable React keys** — composite keys in FinalItineraryView

### Phase 2: Scoring & Logic
- **Currency-aware scoring** — uses native currency budget as primary limit
- **Currency-aware sanity checks** — USD-based thresholds converted per plan currency

### Phase 3: Code Quality
- **Persistence modernized** — `file.text()` replaces FileReader, `a.remove()` cleanup
- **ErrorBoundary extracted** — standalone `components/ErrorBoundary.tsx`
- **Readiness enhanced** — flags default participants as optional missing info

### Phase 4: Auth & Cloud Persistence
- **Supabase client** — `@supabase/supabase-js`, client singleton in `services/supabaseClient.ts`
- **Magic link authentication** — AuthContext, authService, LoginModal (email OTP)
- **Cloud persistence** — storageService CRUD + CloudLoadModal (browse/load/delete)
- **AuthAwareHeader** — extracted header with auth status and cloud save/load buttons

---

## Post-Recovery Bug Fixes

- **Currency display mapping** — LLM `currency_code` field now correctly mapped to `display_currency`
- **Judge verdict on finalize** — score, reasoning, and feedback preserved and shown on final view

---

## Milestone 2.0 Features

### Pro Model Integration (`22d9737`)
- Added `PRO_MODEL_NAME` constant (`gemini-3-pro-preview`)
- Judge and Refiner now use Pro model for higher quality evaluation
- Analyst and Generator remain on Flash model for speed

### Actionable Links (`472df7d`)
- Google Maps links for locations/venues
- Booking.com search links for accommodations
- Google Search links for activities and restaurants
- Links appear on each plan component in the finalized view

### HTML Share Export (`f8f09e4`)
- "Share as HTML" button generates a self-contained HTML file
- Styled output includes all plan details, links, and judge verdict
- Replaces the previous mock share functionality

### Auth UX Improvement (`7e884fa`)
- Login modal auto-closes when magic link authentication completes
- Improved messaging copy for the login flow
- Better handling of the "magic link sent" → "authenticated" transition

---

## Post-M2.0 Fixes (`9188500`)

### Quality & Links Fix
- **Generator quality rules:** Accommodation must match user's profiled standards (no hostels when user wants boutique). Component titles must be specific, verifiable property names.
- **Judge quality validation:** Rejects plans with quality mismatches and vague/generic component names. Warns on borderline quality.
- **Booking.com links:** Now search by hotel name + destination (was destination-only, sending users to wrong country).
- **Destination extraction:** Handles "Hotel in City" patterns and airport codes (TLV-LCA), not just "Flight to City".

---

## Technical Summary

| Metric | Value |
|--------|-------|
| Total commits (recovery + M2.0) | 20 |
| Source files | 25+ |
| Build status | Clean (zero TS errors) |
| SDK | `@google/genai` v1.40.0 |
| Models | `gemini-3-flash-preview` + `gemini-3-pro-preview` |
| Dependencies added | `@supabase/supabase-js` |
