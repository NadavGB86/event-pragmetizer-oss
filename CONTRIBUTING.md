# Contributing to Event Pragmetizer

Thanks for your interest in contributing! This guide will help you get set up and follow our conventions.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier available)
- (Optional) A [Supabase](https://supabase.com) project for cloud persistence

### Setup

```bash
git clone https://github.com/NadavGB86/event-pragmetizer-oss.git
cd event-pragmetizer-oss
npm install
cp .env.example .env.local
# Add your Gemini API key to .env.local
npm run dev
```

The app runs at `http://localhost:5175`.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key |

Without Supabase variables, the app works with localStorage only. Cloud features are automatically hidden.

## Development Workflow

1. Run `npm run dev` to start the dev server (port 5175)
2. Make your changes
3. Run `npm run test` to ensure all tests pass
4. Run `npm run build` to verify the production build
5. Run `npm run typecheck` and `npm run lint` before committing

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build (TypeScript + Vite) |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Code Style

- **TypeScript strict mode** — no `any` types. All interfaces go in `types.ts`.
- **Tailwind CSS** — utility classes only. No external CSS files.
- **Icons** — use `lucide-react`.
- **State** — all app state is in `AppState`, managed by `useUndoRedo` in `App.tsx`.
- **Use `globalThis.location.reload()`** instead of `window.location.reload()`.

## Architecture

```
App.tsx                    Main entry, state management, phase routing
types.ts                   Centralized TypeScript interfaces
constants.ts               Model names, system prompts, initial profile
components/                React components (one per file)
services/                  API calls only (Gemini, Supabase)
hooks/                     State logic (useUndoRedo)
utils/                     Pure functions (no side effects)
context/                   React contexts (auth)
docs/                      Active documentation
```

## SDK Rules

- We use `@google/genai` (v1.40.0). **Never** swap to `@google/generative-ai` — they are different, incompatible packages.
- API key chain: `.env.local` -> `vite.config.ts` define block -> `process.env.API_KEY`
- Model names live in `constants.ts`. Change them there only.
- **Do not modify the `vite.config.ts` define block** unless absolutely necessary.

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

Examples:
feat(chat): add message timestamp display
fix(scoring): correct currency mismatch detection
docs: update setup instructions
chore: bump dependency versions
```

One feature per commit. Keep commits focused and atomic.

## Pull Request Process

1. **Open an issue first** to discuss what you'd like to change
2. **Branch from `master`** — use descriptive branch names (`feat/chat-scroll`, `fix/scoring-bug`)
3. **Run `npm run test` and `npm run build`** before submitting — PRs that fail CI will be rejected
4. **Describe your changes** in the PR description
5. **Link the related issue**

## What NOT to Change

These are intentional architectural decisions:

- `vite.config.ts` define block (API key injection mechanism)
- The SDK package (`@google/genai` — do not swap)
- Model name constants (change in `constants.ts` only, not in service files)
- The `types.ts` centralization pattern (all types go there)

## Questions?

Open an issue or start a discussion. We're happy to help!
