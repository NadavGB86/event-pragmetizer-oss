# CLAUDE.md

## Project Identity

**Name:** Event Pragmetizer OSS
**Type:** AI-powered event planning application (open-source)
**Origin:** Forked from Event Pragmetizer M3.0 (`v3.0-legacy`)
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v3 (compiled) + Google Gemini API (`@google/genai` v1.40.0) + Supabase (optional cloud sync)

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
1. **Analyst (Phase 1):** Guidance mode selector (Quick/Guided/Deep) → chat-based profiling to extract needs (Adults, Kids, Budget, Vibe, Dates). LLM signals readiness when profile is sufficient.
2. **Generator (Phase 2):** Generates plan outlines (Lite: 2, Standard/Pro: 3) with different tradeoff strategies. Outlines are concise strategy sketches — not full itineraries.
3. **Expansion (Phase 2→3):** On plan selection, the chosen outline is expanded into a full detailed itinerary via `expandPlanDetail()`.
4. **Soft Judge (Phase 3a):** Advisory evaluation with Google Search grounding — auto-fires after expansion.
5. **Hard Judge (Phase 3b):** Strict LLM-based validation with grounding. Pass/fail gate for finalization.
6. **Executor (Phase 4):** Final actionable itinerary with print/share capabilities, grounding notes, and date display.

---

## Architecture

### Key Files

| File | Purpose |
|---|---|
| `App.tsx` | Main entry, state management (via `useUndoRedo`), phase routing |
| `types.ts` | **Centralized types.** All interfaces live here. |
| `constants.ts` | `LITE_MODEL_NAME`, `MODEL_NAME`, `PRO_MODEL_NAME`, system instructions (outline + detail + analyst), `buildAnalystInstruction(mode)` |
| `services/proxyClient.ts` | **Unified Gemini caller** — BYOK + SDK mode, 3-tier usage mode (lite/standard/pro), key helpers |
| `services/geminiService.ts` | Analyst, Generator (outline + expand), Refiner LLM calls (via `callGemini`) |
| `services/judgeService.ts` | Hard + soft plan evaluation (via `callGemini` + Google Search grounding) |
| `services/supabaseClient.ts` | Supabase client singleton (optional cloud sync) |
| `services/authService.ts` | Magic link auth — OTP send/verify/logout (optional cloud sync) |
| `services/storageService.ts` | Cloud CRUD — save/get/load/delete plans (optional cloud sync) |
| `components/SettingsModal.tsx` | Settings panel — API key, usage mode, cloud sync status |
| `context/AuthContext.tsx` | Auth state provider + `useAuth()` hook |
| `components/` | One component per file |
| `hooks/useUndoRedo.ts` | State history manager (unlimited undo/redo) |
| `utils/` | Pure functions (profileMerge, scoring, sanity, readiness, currency, links, persistence, shareHtml) |

### File Structure
- Source files in project root (NO `src/` directory)
- `components/`, `services/`, `hooks/`, `utils/`, `context/`, `docs/` directories at root

---

## SDK, API Key & Usage Mode Rules (CRITICAL)

1. **SDK:** `@google/genai` (v1.40.0). **NEVER** swap to `@google/generative-ai` (different, incompatible package).
2. **API pattern:** `new GoogleGenAI({ apiKey })`, `ai.models.generateContent({model, contents, config})`
3. **Models:** `LITE_MODEL_NAME` (flash-lite), `MODEL_NAME` (flash), `PRO_MODEL_NAME` (pro) in `constants.ts`. Change there only.
4. **All Gemini calls** go through `callGemini()` in `services/proxyClient.ts`.
5. **Model selection** is dynamic: `getModelForPhase(phase, mode?)` in `proxyClient.ts`. Services call this instead of using model constants directly.
6. **BYOK (Bring Your Own Key):** Users paste their Gemini API key in the setup screen. Stored in `localStorage('ep_gemini_api_key')`. Key never leaves the browser.
7. **API key priority:** BYOK key (localStorage) > build-time key (.env.local) > error.
8. **Usage mode (3-tier):** `localStorage('ep_usage_mode')` — `'lite'` (Flash-Lite for everything, default), `'standard'` (Flash for everything), or `'pro'` (Flash for chat, Pro for plans/judges). Helpers: `getUserUsageMode()`, `setUserUsageMode()`.
9. **Migration:** Legacy `'free'` → `'standard'`, `'full'` → `'pro'` — handled automatically in `getUserUsageMode()`.
10. **BYOK helpers:** `getUserApiKey()`, `setUserApiKey()`, `hasGeminiAccess()` in `proxyClient.ts`.
11. **No proxy:** The Vercel serverless proxy was removed in v3.0.0. All Gemini calls go direct from browser via SDK.
12. **Guidance mode:** `localStorage('ep_guidance_mode')` — `'quick'`, `'guided'`, or `'deep'`. Controls analyst system prompt via `buildAnalystInstruction(mode)` in `constants.ts`. Selected before chat starts.
13. **Analyst readiness signal:** LLM returns `ready_to_generate` boolean and `still_needed` array in its JSON block. Parsed by `parseAnalystResponse()` in `geminiService.ts`.
14. **Generator prompts:** `SYSTEM_INSTRUCTION_GENERATOR_OUTLINE` (fast outlines) and `SYSTEM_INSTRUCTION_GENERATOR_DETAIL` (full expansion). Old `SYSTEM_INSTRUCTION_GENERATOR` kept but unused.

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
GEMINI_API_KEY=your_key_here              # Dev convenience (optional — BYOK works without it)
VITE_SUPABASE_URL=your_supabase_url       # Optional: enables cloud sync
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key  # Optional: enables cloud sync
```

### For Deployed Users (Vercel / Self-Hosted)
No server-side API key or env vars needed. Users enter their own Gemini API key via the in-app setup screen (BYOK). Cloud sync is optional — only available if Supabase env vars are configured.

---

## Development Priorities (OSS Roadmap)

**Completed (v3.3.0):**
1. Installation & Onboarding (README, `.env.example`, one-command setup)
2. Mobile Responsiveness (PWA manifest, responsive layout, touch-friendly)
3. API Key Security (BYOK — key never leaves browser)
4. Tailwind Compilation (CDN → compiled PostCSS pipeline)
5. Testing (92 tests — 69 utils + 23 proxyClient)
6. CI/CD (GitHub Actions — build, lint, test)
7. Community (LICENSE, CONTRIBUTING.md, issue/PR templates)
8. **Unified Architecture** — same code, same behavior across local dev/Vercel/self-hosted
9. **3-Tier Usage Mode** — Lite (Flash-Lite, ~1K RPD free), Standard (Flash, ~250 RPD free), Pro (Flash+Pro, paid)
10. **Settings Panel** — API key management, 3-tier usage mode, cloud sync status
11. **Proxy removal** — direct SDK calls only, no serverless function
12. **Guidance Modes** — Quick/Guided/Deep analyst modes with scope disclosure and LLM readiness signaling
13. **Model indicator badge** — shows current tier (Lite/Standard/Pro) with model name in header
14. **Code splitting** — React.lazy + vendor chunks, largest chunk 259KB (was 756KB)
15. **PWA icons** — 192px + 512px calendar-check icons on indigo background
16. **Lighter Phase 2** — Outline-first plan generation with on-demand detail expansion
17. **Automatic migration** — Legacy `'free'`/`'full'` mode values migrate to `'standard'`/`'pro'` transparently

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
- `docs/` -> Active documentation (tradeoffs, OSS roadmap, walkthrough).
- `docs/archive/` -> Legacy docs from pre-fork history. Reference only.

---

## Working With This Codebase (AI Agent Instructions)

1. Read this `CLAUDE.md` first — it is the authoritative project reference.
2. Check `types.ts` before modifying data structures.
3. Run `npm run build` to verify clean state before and after changes.
4. Test build after EVERY change.
5. One feature per commit. Conventional commits (`type(scope): description`).
6. Do NOT change the SDK or API key chain.
7. Model names live in `constants.ts`. Model selection goes through `getModelForPhase()` in `proxyClient.ts`.
8. Storage: localStorage is primary. Supabase is optional (gated by `supabaseConfigured` flag).

### Agent Teams
Agent teams are enabled. For complex parallel work (e.g., frontend + backend + tests simultaneously,
or parallel code review), Claude can spawn teammate agents that work independently and communicate.
Use in-process mode (Shift+Up/Down to navigate). Best for tasks where parallel exploration adds value.

### Grounding Fallback Pattern
`responseMimeType: "application/json"` conflicts with `tools: [{ googleSearch: {} }]`.
Both judges try grounding first, catch errors, fall back to JSON mode. Use `safeParseJson()` for responses that may be markdown-fenced.

---

## Origin

This project was created on 2026-02-10 from Event Pragmetizer M3.0 (`v3.0-legacy`).
It is an independent project with its own git history.

Sibling projects:
- **Event Pragmetizer** (learning lab, private): `.gemini/antigravity/scratch/event-pragmetizer/`
- **Pragma Lab** (frozen legacy archive): `.gemini/antigravity/scratch/pragma-lab/`

---

## Known Issues & Investigation Items

- **Judge outline-vs-detail gap:** With the outline→detail flow, a plan outline may pass the soft judge but the expanded detail may fail the hard judge. Currently there is no clear UX feedback explaining *what changed* between the outline approval and the detail rejection. Needs investigation — see Priority 1 in backlog.
- **Budget regex:** Only handles comma-formatted numbers (`$3,000` not `3000`).
- **Soft judge in Lite mode:** Flash-Lite may struggle with judge complexity — error is surfaced to user.

---

*Created: 2026-02-10 | Updated: 2026-02-11 (v3.3.0 stable)*
