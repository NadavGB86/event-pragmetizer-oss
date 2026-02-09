# Phase 8 Recovery Plan

> **Purpose:** This document captures everything that was built during the failed Phase 8 attempt
> (commits 22acb9d → 352b97e) so it can be re-implemented cleanly on top of a stable Milestone 1.0 baseline.
>
> **Created:** 2026-02-08, after resetting to commit `04ca39b`.
> **Last Updated:** 2026-02-09 — Recovery complete. Milestone 2.0 shipped. All documentation updated.

---

## What Happened

The Gemini agent introduced Phase 8 features (auth, cloud persistence, UI refactors) but simultaneously
corrupted the SDK layer by mixing two incompatible Google AI packages:

- `@google/genai` (v1.40.0) — the original, working package
- `@google/generative-ai` (v0.24.1) — a different package with an incompatible API

This created circular build failures that compounded over hours of attempted fixes.
The codebase was reset to the last clean Milestone 1.0 state (`04ca39b`).

---

## Recovery Progress

### DONE — Phase 1: Core Bug Fixes (commits 9f719c3 → 28f4785)

| # | Feature | Status |
|---|---------|--------|
| 1.1 | **profileMerge wired into App.tsx** — deduplicates constraints/targets properly | DONE |
| 1.2 | **localStorage error resilience** — corrupted data won't crash | DONE |
| 1.3 | **Model name centralized** — single `MODEL_NAME` in constants.ts | DONE |
| 1.4 | **ExecutionView dynamic** — days/location from plan data, not hardcoded | DONE |
| 1.5 | **Stable React keys** — FinalItineraryView composite keys | DONE |

### DONE — Phase 2: Scoring & Logic (commits 40b8e63 → d16ed76)

| # | Feature | Status |
|---|---------|--------|
| 2.1 | **Currency-aware scoring** — uses `budget` (native currency) as primary limit | DONE |
| 2.2 | **Currency-aware sanity** — USD-based thresholds converted per plan currency | DONE |

### DONE — Phase 3: Code Quality (commits ffb116f → db4f2b6)

| # | Feature | Status |
|---|---------|--------|
| 3.1 | **Persistence modernized** — `file.text()` replaces FileReader, `a.remove()` | DONE |
| 3.2 | **ErrorBoundary extracted** — standalone `components/ErrorBoundary.tsx` | DONE |
| 3.3 | **Readiness enhanced** — flags default participants as optional missing | DONE |

### DONE — Phase 4: Auth & Cloud Persistence (commits d002aa4 → 235c139)

| # | Feature | Status |
|---|---------|--------|
| 4.1 | **Supabase client setup** — `@supabase/supabase-js`, client singleton | DONE |
| 4.2 | **Authentication** — AuthContext, authService, LoginModal (magic link OTP) | DONE |
| 4.3 | **Cloud persistence** — storageService CRUD, CloudLoadModal | DONE |
| 4.4 | **AuthAwareHeader** — extracted header with auth + cloud actions | DONE |

### DONE — Post-Recovery Bug Fixes (commits c3414cc → 70822fe)

| # | Fix | Status |
|---|-----|--------|
| 5.1 | **Currency display mapping** — LLM `currency_code` now mapped to `display_currency` | DONE |
| 5.2 | **Judge verdict on finalize** — score, reasoning, and feedback shown on final view | DONE |

### DONE — Milestone 2.0 Features (commits 22d9737 → 7e884fa)

| # | Feature | Status |
|---|---------|--------|
| 6.1 | **Gemini-3-Pro** — `PRO_MODEL_NAME` for judge + refiner, flash for analyst + generator | DONE |
| 6.2 | **Actionable links** — Google Maps, Booking.com, Google Search per component | DONE |
| 6.3 | **HTML Share** — self-contained styled HTML export with links + judge verdict | DONE |
| 6.4 | **Auth UX** — auto-close modal on magic link auth, improved messaging | DONE |

---

## Stable Checkpoints

| Checkpoint | Commit | What's included |
|-----------|--------|-----------------|
| Post-recovery | `70822fe` | Phases 1-4, currency fix, judge verdict display |
| Milestone 2.0 (code) | `7e884fa` | All above + Pro model, links, HTML share, auth UX |
| Milestone 2.0 (docs) | `c356f5d` | All above + initial documentation checkpoint |
| **Milestone 2.0 (stable)** | **`bb10389`** | All above + complete doc overhaul, archived stale files |

**Safe to return:** `git reset --hard bb10389`

---

## Phase 4 Implementation Details

### 4.1 Supabase Client Setup

**Install:**
```bash
npm install @supabase/supabase-js
```

**Create `services/supabaseClient.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Environment variables (`.env.local`):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** These use `VITE_` prefix (standard Vite convention for client-side access via `import.meta.env`). This is different from `GEMINI_API_KEY` which uses a custom `define` block in vite.config.ts.

### 4.2 Authentication (Magic Link)

**Files to create:**
- `context/AuthContext.tsx` — React context providing `useAuth()` hook
  - State: `user`, `session`, `loading`
  - Methods: `signInWithEmail(email)`, `signOut()`
  - Listens to `supabase.auth.onAuthStateChange`
- `services/authService.ts` — Thin wrapper around Supabase auth
  - `sendMagicLink(email)` → `supabase.auth.signInWithOtp({ email })`
  - `verifyOTP(email, token)` → `supabase.auth.verifyOtp()`
  - `logout()` → `supabase.auth.signOut()`
- `components/auth/LoginModal.tsx` — Modal UI
  - Step 1: Email input
  - Step 2: OTP/magic link confirmation
  - Uses AuthContext methods

**App.tsx changes:**
- Wrap entire app in `<AuthProvider>` (from AuthContext)
- Add `isLoginOpen` state

### 4.3 Cloud Persistence

**Database schema (run in Supabase SQL editor):**
```sql
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own plans" ON public.plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.plans FOR DELETE USING (auth.uid() = user_id);
```

**Files to create:**
- `services/storageService.ts` — CRUD operations
  - `savePlan(userId, title, appState)` → INSERT/UPSERT
  - `getPlans(userId)` → SELECT (headers only: id, title, updated_at)
  - `loadPlan(planId)` → SELECT single plan data
  - `deletePlan(planId)` → DELETE
- `components/persistence/CloudLoadModal.tsx` — Browse/load/delete UI

**New types to add to `types.ts`:**
```typescript
interface AuthUser {
  id: string;
  email?: string;
}

interface CloudPlanHeader {
  id: string;
  title: string;
  updated_at: string;
}
```

### 4.4 AuthAwareHeader

**File to create:** `components/AuthAwareHeader.tsx`
- Extracts the header from App.tsx into its own component
- Props: phase, canUndo, canRedo, undo, redo, onExport, onImport, onReset, onCloudSave, onCloudLoad, onLogin
- Shows user avatar/email when logged in, "Sign In" button when not
- Adds cloud save/load buttons (visible only when authenticated)

**App.tsx changes:**
- Replace inline header JSX with `<AuthAwareHeader ... />`
- Add state: `isLoginOpen`, `isCloudLoadOpen`
- Add handlers: `handleCloudSave()`, `handleCloudLoad(data)`

---

## Critical Rules for Re-Implementation

1. **DO NOT change the SDK.** The project uses `@google/genai` (v1.40.0). Do not swap to `@google/generative-ai`.
2. **API key is `process.env.API_KEY`**, mapped from `GEMINI_API_KEY` in `.env.local` via `vite.config.ts`.
3. **Model name is `MODEL_NAME`** from `constants.ts`. Change it there, not in service files.
4. **Test build after EVERY change.** Run `npm run build` before moving to next feature.
5. **One feature per commit.** No bundling unrelated changes.
6. **Supabase env vars use `VITE_` prefix** (Vite convention for client-side access via `import.meta.env`).
7. **Do not modify vite.config.ts `define` block** unless absolutely necessary. The API key mapping works.

---

## Documentation to Update After Phase 4

- [x] `CLAUDE.md` — Updated for Milestone 2.0 (stable checkpoint, features, conventions)
- [x] `docs/10_TRADEOFFS_AND_LOOSE_ENDS.md` — Updated with resolved items and current tradeoffs
- [x] `docs/13_CHANGELOG_MILESTONE_2_0.md` — New changelog covering recovery + M2.0 features
- [x] `docs/HANDOFF_PROMPT.md` — Rewritten for current state (was dangerously outdated)
- [x] Archived stale docs (01-03, 08-09, 11-12) with warning headers
- [x] Memory MCP and MEMORY.md updated for current state

---

## Architectural Decisions to Ratify

Before re-implementing, decide on these:

1. **Judge vs. Scorer:** Current system uses LLM-based Judge. Original spec called for deterministic scorer.
   Keep both? Replace one? Document the decision.

2. **Refinement strategy:** Manual (current) vs. automatic loop (spec). Complementary or replacement?

3. **Supabase vs. alternatives:** Supabase was chosen for Phase 8. Still the right choice?
