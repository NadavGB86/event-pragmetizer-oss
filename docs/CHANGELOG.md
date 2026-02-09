# Changelog — Event Pragmetizer OSS

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

### Known Issues (carried from M3.0)
- See `docs/10_TRADEOFFS_AND_LOOSE_ENDS.md` for full list
- API key in client bundle (needs backend proxy for production)
- Tailwind via CDN (needs compiled build for production)
- No tests yet
