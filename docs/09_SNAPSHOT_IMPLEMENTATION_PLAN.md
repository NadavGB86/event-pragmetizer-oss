> **ARCHIVED (2026-02-09):** Historical implementation plan. The "Phase 9: SDK Refactor FAILED"
> note at the bottom refers to the Gemini agent's mistake — this was fully resolved during recovery.
> The project now successfully uses `@google/genai` v1.40.0 with `gemini-3-flash-preview` and `gemini-3-pro-preview`.
> **Do not follow the Phase 8/9 backlog items here — they are all done.**

# Implementation Plan - Milestone 1.0 (COMPLETED) (ARCHIVED)

**Status:** Stable, Cleaned, Documented.
**Version:** v1.0.0 (Conceptually)

## Features Delivered
1.  **Core Intelligence:**
    *   **Analyst:** Conversational profiling to extract needs.
    *   **Generator:** JSON-based itinerary synthesis with budget logic.
    *   **Judge:** Strict validation gatekeeper (LLM-based) to reject bad plans.
2.  **UX & Interactive:**
    *   **Refinement:** Chat-based plan modification ("Make it cheaper").
    *   **Visualization:** Rich cards for Travel/Stay/Eat/Do.
    *   **Actionable:** Print view, Undo/Redo history.
3.  **Data & State:**
    *   **Persistence:** LocalStorage auto-save + JSON Import/Export.
    *   **Calc:** Advanced pricing for families (Adults/Kids/Rooms).

## Technical Debt (Cleaned)
*   [x] Fixed `window` usage for standard `globalThis`.
*   [x] Removed unused Icons and Imports.
*   [x] Consolidated State Management (`useUndoRedo`).
*   [x] Centralized Types (`types.ts`).

---

# Implementation Plan - Phase 8: Future Capabilities (BACKLOG)

## 1. Authentication & Cloud Sync
*   **Goal:** Replace LocalStorage/JSON with real user accounts (Supabase/Firebase).
*   **Why:** Allow users to access plans from mobile/desktop without manual file transfer.

## 2. API Integration (Real-Time Data)
*   **Goal:** Fetch *real* flight prices (Skyscanner/Amadeus) and hotel rates.
*   **Why:** Currently, price estimates are LLM hallucinations (educated guesses). For a real travel tool, we need live pricing.

## 3. Social Sharing
*   **Goal:** "Send to Partner" button generates a read-only View Link.
*   **Why:** Travel planning is collaborative.

## 4. Multi-City Support
*   **Goal:** Handle "Eurotrip" style plans (London -> Paris -> Rome).
*   **Current Limit:** Optimized for single-destination trips.

## 5. Mobile Native Polish
*   **Goal:** PWA manifest and touch-optimized gestures.
*   **Status:** Responsive now, but could be "App-like".
