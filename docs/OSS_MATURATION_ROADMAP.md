# OSS Maturation Roadmap

**Created:** 2026-02-10
**Status:** Phases 0-1, 2.1-2.2, 3-5, 6 complete. Phase 2.3 (backend proxy) deferred — awaiting deployment platform decision.
**Supersedes:** `docs/archive/14_OPEN_SOURCE_READINESS_PLAN.md` (initial brainstorm)

This document is the implementation blueprint for transforming Event Pragmetizer from a working prototype into a production-grade open-source application. It was produced by parallel deep-dive research across 5 workstreams (community, build tooling, security, mobile, testing) and consolidated into a phased execution plan.

---

## Current State (v1.0.0 Baseline)

| Area | Status |
|------|--------|
| Core AI features | Working (analyst, generator, judge, refiner) |
| Cloud persistence | Working (Supabase + RLS) |
| Auth | Working (magic link) |
| Git history | Clean (5 commits, no secrets) |
| LICENSE | Missing |
| CONTRIBUTING.md | Missing |
| Issue/PR templates | Missing |
| README.md | Exists but has wrong port (5173 vs 5175) |
| Tailwind | CDN (not compiled) |
| ESLint/Prettier | Not configured |
| CI/CD | Not configured |
| Tests | None |
| Mobile responsiveness | ~60% ready (4 components need fixes) |
| PWA | Not configured |
| API key security | Exposed in client bundle |
| Supabase degradation | Broken client created when credentials missing |
| Missing API key UX | Silent failures, no user guidance |

---

## Phase 0: Quick Wins (Foundation)

**Goal:** Unblock the repo for public collaboration with zero-risk changes.
**Effort:** ~30 minutes
**Dependencies:** None

### 0.1 — Create LICENSE (MIT)

No dependency license conflicts found. 108 packages MIT, rest are ISC/BSD-3/Apache-2.0/BlueOak — all permissive.

```
MIT License
Copyright (c) 2026 Nadav Gordon-Bar
```

### 0.2 — Fix README.md

| Fix | Current | Should Be |
|-----|---------|-----------|
| Port number (line 54) | `http://localhost:5173` | `http://localhost:5175` |
| Contributing section | 1 line | Reference CONTRIBUTING.md |
| License reference | Says "MIT" | Link to actual LICENSE file |

### 0.3 — Decisions Required (before Phase 3)

| Decision | Options | Recommendation |
|----------|---------|----------------|
| `docs/archive/` | Keep / Remove / Add README | **Option C:** Keep with explanatory `docs/archive/README.md` |
| `docs/05_E2E_WALKTHROUGH.md` | Keep personal scenario / Anonymize / Replace | **Keep as-is** — vivid demo scenario, autobiographical but not sensitive |
| `docs/14_OPEN_SOURCE_READINESS_PLAN.md` | Keep / Archive | **Archive after maturation complete** — move to `docs/archive/` |

---

## Phase 1: Build Tooling

**Goal:** Establish the infrastructure that validates all subsequent work.
**Effort:** ~2-3 hours
**Dependencies:** Phase 0
**Branch:** `feat/build-tooling`

### 1.1 — Tailwind CSS: CDN to Compiled (v3.4.x)

**Why v3 over v4:** Production stability. v4 is a ground-up rewrite (2025+); ecosystem tooling still maturing.

**Packages:**
```
npm install -D tailwindcss@3 postcss autoprefixer @tailwindcss/typography
```

**Steps:**
1. `npx tailwindcss init -p` (generates `tailwind.config.js` + `postcss.config.js`)
2. Configure content paths: `['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}', './context/**/*.{ts,tsx}']`
3. Define custom theme extensions:
   - `fontFamily.sans: ['Inter', 'sans-serif']`
   - `animation.fade-in` + `animation.slide-up` (custom keyframes — **will break without this**)
4. Add `@tailwindcss/typography` plugin (required for `prose` classes in `FinalItineraryView.tsx`)
5. Create `app.css` with `@tailwind base/components/utilities` + migrated scrollbar-hide CSS
6. Import `./app.css` in `index.tsx`
7. Remove CDN `<script>` and `<style>` block from `index.html`
8. Verify: `npm run build` + `npm run preview`

**Risks (all mitigated by config):**
| Risk | Impact | Mitigation |
|------|--------|------------|
| `animate-fade-in` / `animate-slide-up` break | Visual regression | Define in `theme.extend.animation` + `keyframes` |
| `prose` classes disappear | FinalItineraryView layout breaks | Install `@tailwindcss/typography` |
| `scrollbar-hide` lost | Scrollbar visible in chat | Move from `<style>` to `app.css` |

### 1.2 — ESLint 9 + Prettier

**Packages:**
```
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier
```

**Config files:** `eslint.config.js` (flat config) + `.prettierrc`

**Key rules:**
- `@typescript-eslint/no-explicit-any: 'error'` (enforces project convention)
- `react-hooks/rules-of-hooks` + `exhaustive-deps`
- `react-refresh/only-export-components`
- Prettier integration via `eslint-config-prettier` (disables conflicting rules)

**First run:** `npx eslint .` will likely surface existing warnings (unused vars, etc.). Fix in a separate commit.

### 1.3 — package.json Scripts

```json
{
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\"",
  "format:check": "prettier --check \"**/*.{ts,tsx,js,json,md}\""
}
```

### 1.4 — GitHub Actions CI

`.github/workflows/ci.yml` — single job, runs on PRs to `master` and pushes to `master`:

```yaml
name: CI
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
```

Test step added later (Phase 5).

---

## Phase 2: Security & Developer UX

**Goal:** Remove the API key from the client bundle and make the app work for any developer out of the box.
**Effort:** ~4-6 hours
**Dependencies:** Phase 0
**Branch:** `feat/security-and-dx`

### 2.1 — Missing API Key Startup Check

**Current behavior:** Silent failures — user sees chat UI but every message errors with opaque messages.

**Fix:** Add a check in `App.tsx` at render time. If `process.env.API_KEY` is falsy, render a full-page setup screen with:
- Welcome message
- Link to `https://aistudio.google.com/apikey`
- Instructions to add key to `.env.local`
- Instructions to restart dev server

**Effort:** Low (~30 min)

### 2.2 — Supabase Graceful Degradation

**5 files to touch:**

| File | Change |
|------|--------|
| `services/supabaseClient.ts` | Export `null` instead of broken client when credentials missing |
| `context/AuthContext.tsx` | Guard all `supabase.auth.*` calls; static "not configured" state when null |
| `services/authService.ts` | Guard OTP/verify/signOut; return "Cloud features not configured" |
| `services/storageService.ts` | Guard `supabase.from('plans').*`; return error messages |
| `components/AuthAwareHeader.tsx` | Hide Login/Cloud Save/Cloud Load buttons when Supabase not configured |

**Result:** App works fully with just a Gemini API key. Cloud features gracefully hidden when Supabase is not configured.

**Effort:** Low-Medium (~2 hours)

### 2.3 — Backend Proxy (Vercel Edge Functions)

**Architecture:**
```
Browser (no API key)
  -> POST /api/gemini
    -> Vercel Edge Function (injects GEMINI_API_KEY from server env)
      -> generativelanguage.googleapis.com
    <- response relayed to browser
```

**Single generic route** `POST /api/gemini` with server-side validation:
- Model allowlist: `gemini-3-flash-preview`, `gemini-3-pro-preview`
- Tools allowlist: only `{ googleSearch: {} }`
- Max content length check

**Client refactor (2 files):**
- `services/geminiService.ts` — Replace `new GoogleGenAI({ apiKey })` with `fetch('/api/gemini', {...})`
- `services/judgeService.ts` — Same pattern; grounding fallback logic stays in client

**Additional files:**
- `api/gemini.ts` — Vercel Edge Function (~50 lines)
- `vercel.json` — Routing configuration
- Rate limiting middleware (per-IP, 20 req/min)

**Effort:** Medium (~3-4 hours)

### 2.4 — Dual Mode (Dev vs Deployed)

The proxy is for deployed instances. Local development should still support direct API key usage for simplicity.

**Strategy:** If `process.env.API_KEY` exists (local dev), use it directly. If not, call the proxy endpoint. This keeps the developer experience simple while securing production.

---

## Phase 3: Community & Documentation

**Goal:** Make the repo welcoming and contributor-ready.
**Effort:** ~2 hours
**Dependencies:** Phase 0
**Branch:** `docs/community-files`

### 3.1 — CONTRIBUTING.md

Sections:
1. Welcome + Code of Conduct reference
2. Getting Started (prerequisites, clone, install, dev)
3. Environment Setup (`.env.example`, optional Supabase)
4. Development Workflow (`npm run dev` on port 5175, `npm run build` to verify)
5. Code Style (TypeScript strict, no `any`, types in `types.ts`, Tailwind utilities, lucide-react icons)
6. Architecture Overview (services/, hooks/, utils/, components/, context/)
7. SDK Rules (`@google/genai` only, API key chain)
8. Commit Convention (conventional commits, one feature per commit)
9. Pull Request Process (open issue first, branch from master, run build)
10. What NOT to Change (`vite.config.ts` define block, SDK package, model names)

### 3.2 — GitHub Issue Templates

`.github/ISSUE_TEMPLATE/bug_report.yml`:
- Description, Steps to Reproduce, Expected/Actual Behavior, Environment, Screenshots

`.github/ISSUE_TEMPLATE/feature_request.yml`:
- Problem/Use Case, Proposed Solution, Alternatives Considered

### 3.3 — Pull Request Template

`.github/pull_request_template.md`:
- What does this PR do? / Related issue / Checklist (`npm run build`, types in `types.ts`, conventional commit)

### 3.4 — Supabase Setup Guide

New doc: `docs/SUPABASE_SETUP.md`
- Create project, get URL + anon key
- SQL migration for `plans` table
- RLS policies
- Auth configuration (magic link)

### 3.5 — docs/archive/ Cleanup

Add `docs/archive/README.md` explaining these are historical documents from pre-fork development.

---

## Phase 4: Mobile Responsiveness & PWA

**Goal:** Make the app usable on Android/iOS phones and installable as a PWA.
**Effort:** ~6-8 hours
**Dependencies:** Phase 1 (compiled Tailwind needed for responsive class changes)
**Branch:** `feat/mobile-pwa`

### 4.1 — Critical Layout Fixes (High Impact, Low Effort)

| Fix | File | Change | Effort |
|-----|------|--------|--------|
| Viewport height | `App.tsx` | `h-screen` -> `h-dvh` (dynamic viewport for mobile browser chrome) | 5 min |
| Final view padding | `FinalItineraryView.tsx` | `p-12` -> `p-4 md:p-12` | 5 min |
| Timeline indent | `ExecutionView.tsx` | `pl-16` -> `pl-10 md:pl-16` | 5 min |
| Refinement bar | `ExecutionView.tsx` | Stack input + button vertically on mobile | 30 min |

### 4.2 — Header Mobile Redesign (High Effort)

`AuthAwareHeader.tsx` — Currently 7-9 icon buttons in a single row that overflow on narrow screens.

**Options:**
- **A) Hamburger menu:** Collapse non-essential buttons into a dropdown on `sm:` screens
- **B) Bottom action bar:** Move undo/redo and cloud buttons to a bottom bar on mobile
- **C) Overflow menu:** Keep most-used buttons visible, put rest in "..." overflow

**Recommendation:** Option A (hamburger) — most familiar mobile pattern.

### 4.3 — Profile Sidebar Mobile Access

Currently `hidden md:block` with no mobile alternative. Options:
- Slide-out drawer triggered by a header icon
- Bottom sheet on tap
- Floating action button

**Recommendation:** Slide-out drawer — standard mobile pattern, reuses existing sidebar component.

### 4.4 — Touch Target Improvements

| Element | Current | Target | Files |
|---------|---------|--------|-------|
| Action links | `text-[11px]` ~20px | `py-1.5 px-3` ~36px+ | ExecutionView, FinalItineraryView |
| Header icon buttons | `p-2` ~36px | `p-2.5` / `min-h-[44px]` | AuthAwareHeader |
| Cloud Load buttons | `px-3 py-1.5 text-xs` ~28px | `py-2 px-4` | CloudLoadModal |
| "Start New Plan" link | Text-only | Add `py-3 px-6` padding | FinalItineraryView |

### 4.5 — PWA Manifest & Service Worker

**Packages:** `npm install -D vite-plugin-pwa`

**Files:**
- `manifest.json` — name, short_name, icons, theme_color, display: standalone
- Icons: 192x192, 512x512, 512x512 maskable, 180x180 apple-touch-icon
- `index.html` additions: manifest link, theme-color meta, apple-mobile-web-app tags

**Service Worker strategy:**
- NetworkFirst for API calls (Gemini, Supabase)
- CacheFirst for static assets
- Offline page: "You're offline — Event Pragmetizer requires internet"

**Note:** The app is fundamentally online-only (requires Gemini API). PWA value is: installability, faster repeat loads, home screen presence.

---

## Phase 5: Testing

**Goal:** Establish a test foundation covering the highest-ROI business logic.
**Effort:** ~4-6 hours
**Dependencies:** Phase 1 (Vitest config uses `vite.config.ts`)
**Branch:** `feat/testing`

### 5.1 — Vitest Setup

**Packages:**
```
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Config:** Add `test` block to `vite.config.ts`:
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./tests/setup.ts'],
  include: ['**/*.test.ts', '**/*.test.tsx'],
  coverage: { provider: 'v8', include: ['utils/**', 'hooks/**', 'services/**'] }
}
```

**Scripts:** `"test": "vitest"`, `"test:run": "vitest run"`, `"test:coverage": "vitest run --coverage"`

### 5.2 — P0 Tests (~38 tests)

Highest-ROI: pure functions that form the "brain" of plan evaluation.

| File | Tests | Key Scenarios |
|------|-------|---------------|
| `utils/scoring.ts` | 12 | Budget scoring, currency mismatch detection, insane plan capping, want matching |
| `utils/sanity.ts` | 8 | Flight cost thresholds per currency, accommodation minimums, global budget sanity |
| `utils/requestBuilder.ts` | 10 | Budget extraction (USD/ILS/EUR/GBP + symbols), duration parsing, stress trait adjustments |
| `utils/profileMerge.ts` | 8 | Array dedup, constraint dedup by type+value, date_info overwrite, goals.targets dedup |

### 5.3 — P1 Tests (~31 tests)

| File | Tests | Key Scenarios |
|------|-------|---------------|
| `utils/readiness.ts` | 6 | Missing budget/vision detection, optional field detection, date_info tier checks |
| `utils/currency.ts` | 5 | Known codes, NIS alias, unknown fallback, null handling |
| `utils/links.ts` | 7 | Booking.com URL params, Maps links, destination extraction patterns |
| `hooks/useUndoRedo.ts` | 6 | Undo/redo state, future clearing on new state, identity check skip |
| `utils/persistence.ts` | 4 | Validation logic, missing version/keys errors |
| `utils/shareHtml.ts` | 3 | HTML structure, judge verdict inclusion, day grouping |

### 5.4 — Future: Service Testability

**Key recommendation:** Extract `parseAnalystResponse` (geminiService), `safeParseJson`, and `extractGroundingNotes` (judgeService) into `utils/` for direct testing without mocking the entire Gemini SDK. This is the highest-ROI refactor for service testability.

### 5.5 — CI Integration

Add test step to `.github/workflows/ci.yml`:
```yaml
- run: npm run test:run
```

**Coverage targets:**

| Phase | Scope | Target |
|-------|-------|--------|
| Initial | utils/ (8 files) | 90%+ |
| Next | hooks/ + extracted parsers | 80%+ |
| Future | services/ (mocked) | 70%+ |
| Long-term | components/ | 60%+ |

---

## Phase 6: Polish & Release

**Goal:** Final touches before announcing v2.0.0.
**Effort:** ~2 hours
**Dependencies:** All previous phases

### 6.1 — README Enhancement
- Add CI badge (`![CI](https://github.com/NadavGB86/event-pragmetizer-oss/actions/workflows/ci.yml/badge.svg)`)
- Add license badge
- Add screenshots/GIF (capture from running app)
- Expand setup instructions for proxy deployment

### 6.2 — Archive Cleanup
- Move `docs/14_OPEN_SOURCE_READINESS_PLAN.md` to `docs/archive/`
- Rename this roadmap to reflect completion status

### 6.3 — Tag v2.0.0
- Update `package.json` version
- Update `docs/CHANGELOG.md` with all Phase 1-5 changes
- `git tag v2.0.0`

---

## Dependency Graph

```
Phase 0 (Quick Wins)
  |
  ├── Phase 1 (Build Tooling) ──────┬── Phase 4 (Mobile/PWA)
  |                                  └── Phase 5 (Testing)
  ├── Phase 2 (Security & DX) ──────── independent
  └── Phase 3 (Community & Docs) ───── independent
                                         |
                                     Phase 6 (Polish & Release)
                                     (after all phases complete)
```

**Phases 2, 3 can run in parallel with Phase 1.**
**Phases 4, 5 depend on Phase 1 (compiled Tailwind, Vitest config).**
**Phase 6 waits for everything.**

---

## Execution Order (Recommended)

| Order | Phase | Branch | Can Parallel? |
|-------|-------|--------|---------------|
| 1st | Phase 0: Quick Wins | `master` (direct) | Start here |
| 2nd | Phase 1: Build Tooling | `feat/build-tooling` | No — foundation |
| 3rd | Phase 2: Security & DX | `feat/security-and-dx` | Yes, with Phase 3 |
| 3rd | Phase 3: Community & Docs | `docs/community-files` | Yes, with Phase 2 |
| 4th | Phase 4: Mobile/PWA | `feat/mobile-pwa` | Yes, with Phase 5 |
| 4th | Phase 5: Testing | `feat/testing` | Yes, with Phase 4 |
| 5th | Phase 6: Polish & Release | `release/v2.0.0` | After all |

---

## Total Effort Estimate

| Phase | Effort |
|-------|--------|
| Phase 0 | ~30 min |
| Phase 1 | ~2-3 hours |
| Phase 2 | ~4-6 hours |
| Phase 3 | ~2 hours |
| Phase 4 | ~6-8 hours |
| Phase 5 | ~4-6 hours |
| Phase 6 | ~2 hours |
| **Total** | **~20-28 hours** |

With agent teams running parallel phases, **effective wall time is ~15-20 hours** across 3-5 focused sessions.

---

*This roadmap was generated by a 5-agent research team analyzing every source file in the project, then consolidated into this execution plan.*
