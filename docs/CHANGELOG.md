# Changelog — Event Pragmetizer OSS

## 2.1.0 (2026-02-10)

BYOK (Bring Your Own Key) release. Users provide their own Gemini API key — no server-side key needed.

### BYOK & API Key Security
- **BYOK setup screen** — visitors paste their own Gemini API key on first visit
- **Key stored in browser only** (`localStorage`) — never sent to any server
- **Triple-mode key chain:** BYOK key > build-time key (.env.local) > Vercel proxy > error
- **Honest pricing notice** — setup screen explains Flash is free, Pro is paid, with link to Google's pricing

### Vercel Deployment
- **Serverless proxy** (`api/gemini.ts`) — Vercel Serverless Function for optional server-side key mode
- **504 timeout fix** — switched from Edge (25s limit) to Serverless (60s limit) for Pro model generation
- **Security:** `vite.config.ts` gates key exposure with `VITE_USE_PROXY` to prevent key leak in proxy-mode builds
- **Vercel config** (`vercel.json`) — SPA rewrites + API routing

### Infrastructure
- **Unified Gemini caller** (`services/proxyClient.ts`) — all LLM calls route through `callGemini()`
- **13 proxyClient tests** (79 total) — SDK passthrough, BYOK helpers, proxy flag
- **Repo made public** on GitHub

### Post-v2.0.0 UX Fixes
- Match badge no longer covers plan title
- Mobile phase indicator pill next to app title
- Synthesis loading text centered on mobile
- Judge rejection clears on plan re-selection + "Try Different Plan" button
- Generator prompt enforces non-domestic destinations for "abroad"
- Phone sign-in: OTP code instructions instead of "magic link" wording
- Non-localhost warning for phone sign-in

---

## 2.0.0 (2026-02-10)

The first production-grade release. Transforms the M3.0 prototype into an installable, testable, mobile-friendly open-source application.

### Build Tooling (Phase 1)
- **Tailwind CSS v3** compiled build — migrated from CDN to PostCSS pipeline with `tailwind.config.js`, `postcss.config.js`, and `app.css`
- **ESLint 9** with flat config (`eslint.config.js`) — TypeScript-aware, React Hooks, React Refresh
- **Prettier** with Tailwind plugin for consistent class ordering
- **GitHub Actions CI** — typecheck, lint, test, and build on every push/PR to master

### Security & DX (Phase 2)
- **API key startup check** — white screen replaced with clear setup instructions when `GEMINI_API_KEY` is missing
- **Lazy GoogleGenAI initialization** — SDK client created on first use, not at import time
- **Supabase graceful degradation** — cloud features hidden when credentials are absent; app works fully with localStorage
- **Diagnostic logging** for Supabase configuration state (visible in DevTools console)

### Community & Documentation (Phase 3)
- **CONTRIBUTING.md** — setup guide, code style, architecture overview, SDK rules, commit convention, PR process
- **GitHub issue templates** — bug report and feature request (YAML form format)
- **Pull request template** — checklist for build, typecheck, lint, test, types, and conventional commits

### Mobile Responsiveness & PWA (Phase 4)
- **PWA manifest** (`public/manifest.json`) — installable as standalone app
- **Dynamic viewport height** — `h-[100dvh]` for iOS/Android browser chrome handling
- **Mobile header** — hamburger menu with grouped actions, undo/redo always visible
- **Mobile sidebar drawer** — slide-in profile panel with backdrop overlay and close button
- **Responsive views** — PlanComparison, ExecutionView, FinalItineraryView, and ChatInterface adapted for small screens
- **Safe area padding** — `env(safe-area-inset-bottom)` for iOS home indicator
- **Slide-in animation** — custom Tailwind `slide-in-right` keyframe

### Testing (Phase 5)
- **Vitest** test runner with 66 unit tests across 6 utility files
- **Test coverage:** scoring, sanity checks, request building, profile merging, readiness assessment, currency formatting
- **Shared fixtures** (`utils/__fixtures__.ts`) — reusable profile, plan, and component test data
- **CI integration** — tests run automatically in GitHub Actions pipeline

### Polish & Release (Phase 6)
- **README** — CI and license badges, development scripts section, updated tech stack
- **CONTRIBUTING.md** — added test scripts to available commands and workflow
- **Archive cleanup** — moved initial brainstorm plan to `docs/archive/`
- **Roadmap** — updated with completion status
- **Version bump** — 1.0.0 → 2.0.0

### Known Limitations (resolved in v2.1.0)
- ~~API key in client bundle~~ — resolved: BYOK + Vercel proxy
- PWA icons are placeholders (192px and 512px PNGs not yet created)
- Supabase degradation bug under investigation (diagnostic logging added)

---

## 1.0.0 (2026-02-10)

### Project Initialized
- Forked from Event Pragmetizer M3.0 (`v3.0-legacy`)
- Independent git history, public GitHub repository
- Dev server port set to 5175
- Docs reorganized: active docs in `docs/`, legacy history in `docs/archive/`
- `.env.example` and `README.md` created for contributor onboarding
- `CLAUDE.md` tailored for open-source development goals

### Inherited Features (from M3.0)
- Conversational event profiling (Analyst phase)
- Multi-plan generation with Pro model
- Two-stage judging: soft (advisory) + hard (pass/fail) with Google Search grounding
- Three-tier date awareness (exact / proximity / none) with date pivot UX
- Multi-currency support (USD, ILS, EUR, GBP)
- Smart undo/redo (Ctrl+Z / Ctrl+Y)
- Cloud persistence via Supabase with magic link auth
- JSON backup export/import + styled HTML share
- Actionable links (Google Maps, Booking.com, Search)
