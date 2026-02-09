# Open Source & Sharing Readiness Plan

**Created:** 2026-02-09
**Status:** Planning (not yet executing)
**Purpose:** Document the gaps between "works on Nadav's machine" and "anyone can clone and run this"

---

## Current Binding Points (What Ties This to You)

| Binding | Location | Risk Level |
|---------|----------|------------|
| Gemini API key | `.env.local` → client bundle | HIGH — key exposed in browser |
| Supabase URL + anon key | `.env.local` → client bundle | MEDIUM — anon key is public by design, but your project URL is exposed |
| Supabase `plans` table + RLS | Your Supabase project | HIGH — others can't use your DB |
| Claude CLAUDE.md | Project root | LOW — helpful, not harmful |
| Claude MEMORY.md | `~/.claude/projects/.../memory/` | NONE — local to your machine |
| Gemini brain files | `~/.gemini/antigravity/brain/` | NONE — local to your machine |
| `docs/` references to commits | Repo-internal | LOW — just context |

---

## Phase 1: "Friends & Family" (Private repo, shared access)

**Goal:** Let trusted people use the app without setting up their own infrastructure.

### Option A: Deploy as hosted app (Recommended)
1. **Deploy to Vercel/Netlify** — Free tier, connects to GitHub repo
2. **Backend proxy for API key** — Vercel Edge Function or Netlify Function that:
   - Receives requests from the frontend
   - Adds the Gemini API key server-side
   - Forwards to Gemini API
   - Returns response to frontend
3. **Keep Supabase as-is** — Auth and cloud persistence work for all users via RLS
4. **Share the URL** — Friends just visit the site, create an account, use it

**Changes needed:**
- [ ] Create `api/gemini-proxy.ts` (Vercel serverless function)
- [ ] Update `geminiService.ts` and `judgeService.ts` to call proxy instead of Gemini directly
- [ ] Add `vercel.json` or `netlify.toml` configuration
- [ ] Remove `process.env.API_KEY` from client bundle (move to server-side only)
- [ ] Add rate limiting to prevent abuse
- [ ] Add CORS configuration

**Estimated effort:** 2-3 hours

### Option B: Each friend runs their own
1. Share repo access (GitHub collaborator invite)
2. They provide their own Gemini API key
3. They create their own Supabase project (or share yours)

**Less work but worse UX** — requires technical setup from each user.

---

## Phase 2: "Open Source" (Public repo, anyone can contribute or self-host)

**Goal:** Make the repo public so anyone can clone, run, and contribute.

### Pre-Requisites

#### Security Audit
- [ ] **Verify no secrets in git history** — Run `git log --all -p | grep -i "key\|secret\|password"` or use `trufflehog`/`gitleaks`
- [ ] **Check `.env.local` is in `.gitignore`** (it should already be)
- [ ] **Verify no API keys in committed files** — Search all source for hardcoded keys
- [ ] **Review Supabase anon key exposure** — Anon keys are public by design, but document this

#### Documentation
- [ ] **README.md** — Project description, demo GIF/screenshot, features list, setup instructions
- [ ] **`.env.example`** — Template with placeholder values:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your_anon_key_here
  ```
- [ ] **CONTRIBUTING.md** — How to contribute, code style, PR process
- [ ] **LICENSE** — Choose a license (MIT recommended for portfolio projects)
- [ ] **Supabase setup guide** — SQL migration script, RLS policies, auth configuration
- [ ] **Architecture overview** — Can adapt from CLAUDE.md

#### Code Changes
- [ ] **Remove personal references** — Ensure no personal email, paths, or identifiers in code
- [ ] **Configurable Supabase** — Already uses env vars (good)
- [ ] **Configurable models** — Already uses `constants.ts` (good)
- [ ] **Error messages** — Ensure user-friendly errors when API key is missing/invalid
- [ ] **Graceful degradation** — App should work without Supabase (localStorage only mode)

#### Nice-to-Haves
- [ ] **Demo mode** — Mock responses so people can see the UX without an API key
- [ ] **Docker compose** — For easy local setup
- [ ] **GitHub Actions** — CI for build verification on PRs
- [ ] **Deployment guide** — Step-by-step for Vercel/Netlify
- [ ] **Screenshots/GIF** — For the README

---

## Phase 3: "Production" (If it gets traction)

**Goal:** Handle multiple concurrent users safely.

- [ ] **Backend proxy** — Required. Can't expose API key to all users.
- [ ] **Rate limiting** — Per-user API call limits
- [ ] **Usage monitoring** — Track API costs
- [ ] **Multi-tenant Supabase** — Already handled by RLS
- [ ] **Custom domain** — Optional but professional
- [ ] **Analytics** — Anonymous usage tracking (Plausible/PostHog)
- [ ] **Error tracking** — Sentry or similar
- [ ] **Performance** — Code splitting, lazy loading, CDN assets

---

## Gap Summary (Quick Reference)

| Gap | Blocking "Friends & Family"? | Blocking "Open Source"? |
|-----|------------------------------|------------------------|
| API key in client bundle | YES | YES |
| No README for setup | No | YES |
| ~~No `.env.example`~~ | ~~No~~ | ~~YES~~ DONE |
| No LICENSE | No | YES |
| No backend proxy | YES (for hosted) | YES |
| No demo mode | No | No (nice-to-have) |
| No CI/CD | No | No (nice-to-have) |
| No graceful degradation without Supabase | No | Recommended |
| Personal commit references in docs | No | Minor cleanup |

---

## Repository Strategy: Private Legacy + Clean Public Fork

**Recommended approach** (industry standard for personal-to-public transitions):

### Why NOT just flip the current repo to public?

- Git history may contain personal paths, debug logs, or recovery artifacts
- 12+ archived docs with internal team references create noise
- Commit messages reference personal Supabase project, brain files, etc.
- The recovery history is valuable to you but confusing to strangers

### Recommended: Clean Fork Strategy

1. **Keep `NadavGB86/event-pragmetizer` as PRIVATE** — your development repo ("legacy")
   - Continue developing here
   - All personal config, memory, brain references stay private
   - This is your working copy with full history

2. **Create `NadavGB86/event-pragmetizer-public`** (or a cleaner name like `pragmetizer`)
   - Fresh repo with clean history (single "initial commit" or squashed history)
   - Copy only source code + essential docs (CLAUDE.md, README, LICENSE, .env.example)
   - Strip archived docs (01-03, 08-09, 11-12), recovery plan, brain references
   - Add public-facing README with screenshots, setup guide, features

3. **Sync workflow** (when ready):
   - Develop in private repo
   - When a feature is stable, cherry-pick or copy to public repo
   - Or use `git format-patch` / `git am` for clean transfers
   - Automate with a script if cadence is frequent

### Alternative: Git Filter-Repo (Advanced)

If you want to preserve meaningful commit history in the public version:
```bash
# Clone private repo
git clone event-pragmetizer event-pragmetizer-public
cd event-pragmetizer-public

# Remove sensitive files from ALL history
git filter-repo --path-glob '*.local' --invert-paths
git filter-repo --path docs/PHASE_8_RECOVERY_PLAN.md --invert-paths
# ... repeat for any files with personal info

# Push to new remote
git remote add origin https://github.com/NadavGB86/pragmetizer.git
git push -u origin main
```

**Trade-off:** More work upfront, but preserves commit history for credibility.

### What to Include in Public Repo

| Include | Exclude |
|---------|---------|
| All source code (App.tsx, components/, services/, etc.) | docs/01-03 (archived analysis) |
| types.ts, constants.ts | docs/08-09, 11-12 (Gemini-era snapshots) |
| CLAUDE.md (adapted as developer guide) | docs/PHASE_8_RECOVERY_PLAN.md (internal) |
| README.md (new, public-facing) | .claude/ directory |
| LICENSE (MIT) | Personal commit references |
| .env.example | docs/HANDOFF_PROMPT.md (internal) |
| docs/10_TRADEOFFS (as "Known Limitations") | This plan document |
| docs/05_E2E_WALKTHROUGH (as "Example Use Case") | |

---

## Already Done (Quick Wins)

- [x] `.env.example` — Created with placeholder values and setup links
- [x] `.gitignore` — Already covers `*.local`, `node_modules`, `dist`, `.claude/`
- [x] `.env.local` never committed to git history (verified clean)

---

## Recommended Order of Execution

1. **`.env.example`** — Done
2. **Backend proxy** (unlocks hosted deployment)
3. **Deploy to Vercel** (unlocks "Friends & Family")
4. **README.md + LICENSE** (unlocks "Open Source")
5. **Create clean public repo** (fork strategy above)
6. **Security audit of git history** (before making public)
7. **CONTRIBUTING.md + Supabase setup guide** (developer experience)
8. **Demo mode + CI/CD** (polish)
