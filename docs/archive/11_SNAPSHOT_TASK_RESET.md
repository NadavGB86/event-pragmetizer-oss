> **ARCHIVED (2026-02-09):** This is a snapshot from BEFORE the recovery reset.
> It contains tasks from the Gemini agent era, including item 8.3 which incorrectly
> directed migration TO `@google/generative-ai` (the wrong SDK — this caused the corruption).
> **Do not follow any directives in this file.** All items were resolved during recovery.

# Task Checklist - Event Pragmetizer (Snapshot Pre-Reset) (ARCHIVED)

## Phase 8: Future Capabilities (Authentication & Cloud Sync)

- [x] Select Topic for Phase 8 <!-- id: 0 -->
    - [x] Option 1: Authentication & Cloud Sync (Supabase) <!-- id: 0.1 -->

- [x] Create Implementation Plan for Authentication <!-- id: 1 -->
    - [x] Define Schema (Users, Plans tables) <!-- id: 1.1 -->
    - [x] Design UI (Login/Register Modal) <!-- id: 1.2 -->
    - [x] Define Sync Logic (Save/Load vs Auto-Sync) <!-- id: 1.3 -->

- [x] Execute Implementation <!-- id: 2 -->
    - [x] Install `@supabase/supabase-js` (Done by User) <!-- id: 2.1 -->
    - [x] Create `services/supabaseClient.ts` <!-- id: 2.2 -->
    - [x] Update `types.ts` with User/Plan definitions <!-- id: 2.8 -->
    - [x] Create `services/authService.ts` <!-- id: 2.7 -->
    - [x] Create `services/storageService.ts` <!-- id: 2.6 -->
    - [x] Implement `AuthProvider` (`AuthContext`) <!-- id: 2.3 -->
    - [x] Add `LoginModal` component <!-- id: 2.4 -->
    - [x] Add `CloudLoadModal` component <!-- id: 2.9 -->
    - [x] Update `App.tsx` with Auth UI <!-- id: 2.5 -->

- [x] Incorporate External Review Feedback (Docs) <!-- id: 4 -->
    - [x] Read `docs/event_pragmetizer_review.md` <!-- id: 4.1 -->
    - [x] Add Warning Headers to Stale Docs (01, 02, 03) <!-- id: 4.2 -->
    - [x] Verify Env Variable Naming (`CLAUDE.md` updated) <!-- id: 4.3 -->

- [x] Verify Integration <!-- id: 3 -->
    - [x] Install Dependencies (`npm install @supabase/supabase-js`) <!-- id: 3.1 -->
    - [x] Build Check (`npm run build` PASSED) <!-- id: 3.2 -->
    - [x] Manual Auth Test (Email Sent & Confirmed) <!-- id: 3.3 -->
    - [x] **Run Database Migration (SQL)** <!-- id: 3.5 -->
    - [x] Cloud Save/Load Test (Verified) <!-- id: 3.4 -->

## Phase 9: Quality & Hardening (Review Feedback)

- [x] Fix Critical Data Issues <!-- id: 5 -->
    - [x] **Fix 1.1:** Implement recursive/array-aware Profile Merge (`utils/profileMerge.ts`) <!-- id: 5.1 -->
    - [x] Apply new merge logic in `App.tsx` <!-- id: 5.2 -->
    - [x] **Fix 1.2:** Add Readiness Gate (Prevent generating empty plans) <!-- id: 5.3 -->

- [x] Fix Lint Warnings & Code Smell <!-- id: 7 -->
    - [x] Refactor `AuthAwareHeader` out of `App.tsx` <!-- id: 7.1 -->
    - [x] Fix nested ternaries in `AuthAwareHeader` <!-- id: 7.2 -->
    - [x] Fix array index keys (`ExecutionView.tsx`, `ProfileSidebar.tsx`) <!-- id: 7.3 -->
    - [x] Fix `vite.config.ts` import <!-- id: 7.5 -->
    - [x] Fix Critical Type Errors (`types.ts`, `FinalItineraryView.tsx`) <!-- id: 7.6 -->
    - [x] Fix Accessibility & Complexity Warnings (`CloudLoadModal`, `scoring`, `persistence`) <!-- id: 7.7 -->

- [x] UX Improvements <!-- id: 8 -->
    - [x] **Auth Auto-Resume:** If user logs in via "Save" button, auto-save after redirect. <!-- id: 8.1 -->
    - [x] **Final Polish:** Fix remaining linting issues (ErrorBoundary props, CloudLoadModal button). <!-- id: 8.2 -->
    - [x] **Build Fix:** Migrate from `@google/genai` to `@google/generative-ai` SDK. <!-- id: 8.3 -->

- [x] Architectural Decisions (Judge vs Scorer) <!-- id: 6 -->
    - [x] Analyze current architecture <!-- id: 6.1 -->
    - [x] Discuss approach with User <!-- id: 6.2 -->
    - [x] Implement chosen path (Confirmed Hybrid model) <!-- id: 6.3 -->

- [ ] Refactor Architecture to Match Reference Project <!-- id: 9 -->
    - [ ] Uninstall `@google/generative-ai`, Install `@google/genai` <!-- id: 9.1 -->
    - [ ] Update `constants.ts` with `gemini-2.0-flash-exp` <!-- id: 9.2 -->
    - [ ] Refactor `geminiService.ts` to use `GoogleGenAI` patterns <!-- id: 9.3 -->
    - [ ] Refactor `judgeService.ts` to use `GoogleGenAI` patterns <!-- id: 9.4 -->
    - [ ] Verify Build & Runtime (Fixed `ContentUnion` & `INVALID_ARGUMENT` bugs) <!-- id: 9.5 -->
    - [ ] Fix Analyst Ignoring Context (Prompt Tuning + Model Switch) <!-- id: 9.6 -->
