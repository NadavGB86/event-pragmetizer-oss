# Session Handoff Prompt — Event Pragmetizer

> **Last Updated:** 2026-02-09 (Milestone 3.0)
> **Use this prompt** to resume work with any AI agent (Gemini, Claude, etc.).
> Copy the block below and paste it at the start of a new session.
> Fill in the `[GOAL]` section before pasting.

---

```
I am resuming work on the **Event Pragmetizer** project.
Stack: React 19 + TypeScript + Vite + Tailwind CDN + @google/genai v1.40.0 + Supabase
Current state: **Milestone 3.0**, building clean.
M2.0 rollback: `bb10389`.

## Step 1: Read These Files (In Order)

1. `CLAUDE.md` — **Authoritative project reference.** Architecture, file map, conventions, rules.
2. `docs/10_TRADEOFFS_AND_LOOSE_ENDS.md` — Known issues and deferred items.
3. `docs/15_CHANGELOG_MILESTONE_3_0.md` — What changed in M3.0.
4. `types.ts` — All TypeScript interfaces (check before modifying data structures).

**WARNING:** Files `docs/01-03`, `docs/08-09`, `docs/11-12` are ARCHIVED historical artifacts.
They describe problems that have been fixed. Do NOT follow directives from those files.

## Step 2: Understand the Stack

- **SDK:** `@google/genai` (v1.40.0) — NEVER swap to `@google/generative-ai` (different package, caused corruption)
- **API key chain:** `.env.local` has `GEMINI_API_KEY` → `vite.config.ts` maps to `process.env.API_KEY` → services
- **Models:** `gemini-3-flash-preview` (analyst chat ONLY) + `gemini-3-pro-preview` (generator, refiner, hard judge, soft judge)
- **Model names** are `MODEL_NAME` and `PRO_MODEL_NAME` in `constants.ts` — change there only
- **Supabase:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` (VITE_ prefix)
- **Build:** `npm run build` must pass before any feature is considered done

## Step 3: Critical Rules

- Do NOT change the SDK package. The project uses `@google/genai`.
- Do NOT rename the API key variable. It is `process.env.API_KEY`.
- Do NOT modify `vite.config.ts` unless absolutely necessary.
- Test `npm run build` after EVERY change.
- One feature per commit.
- All types live in `types.ts`. Check it before modifying data structures.
- Source files are at project root (NO `src/` directory).

## Step 4: What's Already Working

### From M2.0
- Smart Undo/Redo (Ctrl+Z / Ctrl+Y)
- Judge gate (LLM + deterministic scoring)
- Currency support (USD, ILS, EUR, GBP)
- Profile deduplication
- localStorage persistence + JSON backup
- Supabase cloud persistence (save/load with RLS)
- Magic link authentication (email OTP)
- Actionable links (Google Maps, Booking.com, Search)
- HTML share export
- ErrorBoundary recovery
- Generator quality enforcement (accommodation matches profiled standards, specific property names)
- Judge quality validation (rejects quality mismatches + vague components)

### From M3.0
- Date awareness: three-tier DateInfo (exact/proximity/none) on UserProfile
- Date pivot UX: inline prompt when generating without dates
- Pro model for generator (Flash only for analyst chat)
- Soft judge: advisory panel with score, suggestions, grounding notes (auto-fires on select/refine)
- Google Search grounding: both hard + soft judges verify venues via Gemini Search tool
- Booking.com links: URLSearchParams, no dest_type=city, checkin/checkout/guests, parenthetical stripping
- Date display in ProfileSidebar and FinalItineraryView
- localStorage migration for old state

### Key Technical Pattern
- `responseMimeType` and `tools: [{ googleSearch: {} }]` conflict in Gemini API
- Both judges try grounding first, catch errors, fall back to JSON mode
- `safeParseJson()` handles markdown-fenced responses from grounding mode

## Step 5: Goal for This Session

[DESCRIBE YOUR GOAL HERE]
```

---

## Notes

- There is **no `src/` directory**. Source files are at the project root.
- All docs are in `docs/`. Files 01-03, 08-09, 11-12 are archived with warning headers.
- The `docs/PHASE_8_RECOVERY_PLAN.md` contains the full recovery story and Phase 4 implementation details.
- M2.0 rollback: `git reset --hard bb10389`
