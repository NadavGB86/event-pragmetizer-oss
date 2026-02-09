# CLAUDE.md

## Project Identity

**Name:** Event Pragmetizer OSS
**Type:** AI-powered event planning application (open-source)
**Origin:** Forked from Event Pragmetizer M3.0 (`v3.0-legacy`)
**Stack:** React 19 + TypeScript + Vite + Tailwind (CDN) + Google Gemini API (`@google/genai` v1.40.0) + Supabase (auth + cloud persistence)

---

## Project Goal

Transform Event Pragmetizer into a **production-grade, open-source application** that:
- Is installable and usable by anyone (friends, family, GitHub community)
- Works on both Android phones and desktop browsers (responsive / PWA)
- Has clear installation and setup documentation
- Follows open-source best practices (LICENSE, CONTRIBUTING, CHANGELOG)
- Is developed collaboratively between Nadav and Claude Code

---

## What This App Does

Transforms unstructured natural language descriptions of event needs into feasible, personalized event plans.

### Core Flow
1. **Analyst (Phase 1):** Chat-based profiling to extract needs (Adults, Kids, Budget, Vibe, Dates).
2. **Generator (Phase 2):** Generates 2-3 candidate plans with different tradeoff strategies (Pro model).
3. **Soft Judge (Phase 3a):** Advisory evaluation with Google Search grounding — auto-fires on plan select.
4. **Hard Judge (Phase 3b):** Strict LLM-based validation with grounding. Pass/fail gate for finalization.
5. **Executor (Phase 4):** Final actionable itinerary with print/share capabilities, grounding notes, and date display.

---

## Architecture

### Key Files

| File | Purpose |
|---|---|
| `App.tsx` | Main entry, state management (via `useUndoRedo`), phase routing |
| `types.ts` | **Centralized types.** All interfaces live here. |
| `constants.ts` | `MODEL_NAME`, `INITIAL_USER_PROFILE`, system instructions |
| `services/geminiService.ts` | Analyst, Generator, Refiner LLM calls |
| `services/judgeService.ts` | Hard + soft plan evaluation (LLM + Google Search grounding) |
| `services/supabaseClient.ts` | Supabase client singleton |
| `services/authService.ts` | Magic link auth (OTP send/verify/logout) |
| `services/storageService.ts` | Cloud CRUD (save/get/load/delete plans) |
| `context/AuthContext.tsx` | Auth state provider + `useAuth()` hook |
| `components/` | One component per file |
| `hooks/useUndoRedo.ts` | State history manager (unlimited undo/redo) |
| `utils/` | Pure functions (profileMerge, scoring, sanity, readiness, currency, links, persistence, shareHtml) |

### File Structure
- Source files in project root (NO `src/` directory)
- `components/`, `services/`, `hooks/`, `utils/`, `context/`, `docs/` directories at root

---

## SDK & API Key Rules (CRITICAL)

1. **SDK:** `@google/genai` (v1.40.0). **NEVER** swap to `@google/generative-ai` (different, incompatible package).
2. **API pattern:** `new GoogleGenAI({ apiKey })`, `ai.models.generateContent({model, contents, config})`
3. **Models:** `MODEL_NAME` (flash) and `PRO_MODEL_NAME` (pro) in `constants.ts`. Change there only.
4. **API key chain:** `.env.local` (`GEMINI_API_KEY`) -> `vite.config.ts` (`define` block) -> `process.env.API_KEY` -> services
5. **Do NOT modify `vite.config.ts` define block** unless absolutely necessary.

---

## Environment Setup

```bash
npm install          # Install deps
npm run dev          # Start local server (HMR)
npm run build        # Production build (TSC + Vite)
npm run preview      # Preview dist/
```

### Environment Variables (`.env.local`)
```env
GEMINI_API_KEY=your_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Development Priorities (OSS Roadmap)

1. **Installation & Onboarding:** Clear README, `.env.example`, one-command setup
2. **Mobile Responsiveness:** PWA manifest, responsive layout, touch-friendly
3. **API Key Security:** Backend proxy or serverless function (remove client-side key)
4. **Tailwind Compilation:** Move from CDN to compiled Tailwind for production
5. **Testing:** Unit tests for utils, integration tests for services
6. **CI/CD:** GitHub Actions for build, lint, test
7. **Community:** LICENSE, CONTRIBUTING.md, issue templates

---

## Coding Conventions

### Strict Typing
- **No `any`**: Use interfaces from `types.ts`.
- All new types go in `types.ts`.

### State Management
- **Single Truth:** All app state in `AppState` (managed by `useUndoRedo` in `App.tsx`).
- **Use `globalThis.location.reload()`** instead of `window.location.reload()`.

### UI/UX
- **Tailwind:** Utility classes only. No external CSS.
- **Icons:** Use `lucide-react`.
- Always show loading states for LLM operations.

### File Structure
- `services/` -> API calls only.
- `hooks/` -> State logic.
- `utils/` -> Pure functions (no side effects).
- `components/` -> One component per file.
- `docs/` -> Documentation.

---

## Working With This Codebase (AI Agent Instructions)

1. Read this `CLAUDE.md` first — it is the authoritative project reference.
2. Check `types.ts` before modifying data structures.
3. Run `npm run build` to verify clean state before and after changes.
4. Test build after EVERY change.
5. One feature per commit. Conventional commits (`type(scope): description`).
6. Do NOT change the SDK or API key chain.
7. Model names live in `constants.ts`.

### Grounding Fallback Pattern
`responseMimeType: "application/json"` conflicts with `tools: [{ googleSearch: {} }]`.
Both judges try grounding first, catch errors, fall back to JSON mode. Use `safeParseJson()` for responses that may be markdown-fenced.

---

## Origin

This project was created on 2026-02-10 from Event Pragmetizer M3.0 (`v3.0-legacy`).
It is an independent project with its own git history. The legacy version remains
frozen at `.gemini/antigravity/scratch/event-pragmetizer/`.

---

*Created: 2026-02-10*
