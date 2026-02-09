> **ARCHIVED (2026-02-09):** Historical snapshot from BEFORE the recovery reset.
> The "Phase 9: SDK Refactor FAILED" section describes the Gemini agent's mistake.
> This was fully resolved — the project uses `@google/genai` v1.40.0 successfully.
> **Do not follow any directives in this file.**

# Implementation Plan Snapshot (Pre-Reset) (ARCHIVED)

## Phase 8: Authentication & Cloud Persistence

### Goal Description
Implement **User Authentication** and **Cloud Storage** using **Supabase**.
This addresses the critical limitation of `localStorage` (5MB limit & data loss risk).

### User Review Required
*   **Supabase Setup Required**: `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`.
*   **Design Decision**: Manual Save/Load (Cloud slots) for MVP.

### Implementation Details
1.  **Dependencies**: `npm install @supabase/supabase-js`
2.  **Infrastructure**: `services/supabaseClient.ts`, `services/authService.ts`, `services/storageService.ts`.
3.  **State & Context**: `context/AuthContext.tsx`, Update `App.tsx`.
4.  **UI Components**: `LoginModal.tsx`, `CloudLoadModal.tsx`, Save buttons.
5.  **Database Schema**: `users` (Supabase Auth), `plans` (JSONB data).

## Phase 9: SDK Refactor (Gemini 2.0 Support) - FAILED/ROLLED BACK
*Attempted to migrate to `@google/genai` but encountered `INVALID_ARGUMENT` and Model 404 errors. Rolling back to `@google/generative-ai`.*

### Reference Project (Target)
- **SDK:** `@google/genai`
- **Key Model:** `gemini-2.0-flash-exp`

### Failed Changes (Reverted)
- Update `constants.ts` models.
- Switch `geminiService.ts` to `@google/genai`.
- Switch `judgeService.ts` to `@google/genai`.
