# Event Pragmetizer

[![CI](https://github.com/NadavGB86/event-pragmetizer-oss/actions/workflows/ci.yml/badge.svg)](https://github.com/NadavGB86/event-pragmetizer-oss/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI-powered event planning that transforms natural language descriptions into feasible, personalized event plans.

## What It Does

Describe what you need — "a birthday party for 30 people, budget around $2000, somewhere outdoors" — and the app will:

1. **Choose your guidance mode** (Quick, Guided, or Deep) and **profile your needs** through a conversational chat
2. **Generate 2-3 candidate plans** with different tradeoff strategies
3. **Verify feasibility** using Google Search grounding (real venues, real prices)
4. **Deliver an actionable itinerary** with booking links, maps, and cost breakdowns

## Features

- **Guidance modes** — choose Quick, Guided, or Deep interview depth before starting
- **Usage modes** — Free (Flash, $0) or Full (Pro for plans, pay-per-use) with in-app toggle
- Conversational needs analysis with real-time profile extraction and readiness signaling
- Multi-plan comparison with feasibility scoring
- Two-stage plan validation (advisory + strict pass/fail)
- Google Search grounding for venue and price verification
- Date-aware planning (exact dates, date ranges, or open-ended)
- Multi-currency support (USD, ILS, EUR, GBP)
- Smart undo/redo for all state changes
- Settings panel (API key management, usage mode, cloud sync status)
- Cloud persistence via Supabase (optional)
- Magic link authentication (optional)
- Exportable plans (JSON backup + styled HTML)
- Actionable links (Google Maps, Booking.com, Search)
- BYOK (Bring Your Own Key) — your API key never leaves your browser

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier available)
- (Optional) A [Supabase](https://supabase.com) project for cloud persistence

### Setup

```bash
# Clone the repository
git clone https://github.com/NadavGB86/event-pragmetizer-oss.git
cd event-pragmetizer-oss

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

The app will be available at `http://localhost:5175`.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Google Gemini API key (dev convenience — users enter their own via BYOK) |
| `VITE_SUPABASE_URL` | No | Supabase project URL (enables optional cloud sync) |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key (enables optional cloud sync) |

The app works fully with browser-only storage (localStorage + JSON export/import). No environment variables are required — users enter their own API key via the in-app setup screen (BYOK).

## Tech Stack

- **React 19** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS v3** (compiled, with typography plugin)
- **Google Gemini API** (`@google/genai`) — Flash for chat, Pro for generation/judging (user-configurable)
- **Supabase** (optional — cloud sync for multi-device access)
- **Vitest** (testing)
- **ESLint 9** + **Prettier** (code quality)
- **Lucide React** (icons)

## Project Structure

```
├── App.tsx                    # Main entry, state management, phase routing, guidance mode selector
├── types.ts                   # Centralized TypeScript interfaces
├── constants.ts               # Model names, system prompts, buildAnalystInstruction(mode)
├── components/                # React components (one per file)
│   ├── ChatInterface.tsx      # Conversational intake
│   ├── PlanComparison.tsx     # Side-by-side plan selection
│   ├── ExecutionView.tsx      # Plan detail + refinement
│   ├── FinalItineraryView.tsx # Finalized itinerary + links
│   └── ...
├── services/                  # API calls
│   ├── geminiService.ts       # Analyst, Generator, Refiner
│   ├── judgeService.ts        # Hard + Soft judge with grounding
│   └── ...
├── hooks/                     # State logic
├── utils/                     # Pure functions + test files
├── context/                   # React contexts
├── docs/                      # Documentation
└── public/                    # Static assets + PWA manifest
```

## Development

```bash
npm run dev          # Start dev server (port 5175)
npm run build        # Production build
npm run typecheck    # Type-check
npm run lint         # ESLint
npm run test         # Run test suite (86 tests)
npm run test:watch   # Watch mode
npm run format       # Prettier
```

## Deploy to Vercel

The app can be deployed to [Vercel](https://vercel.com) with zero configuration — no server-side API key needed.

1. Fork this repository
2. Import the project in Vercel
3. Deploy

That's it. Users enter their own Gemini API key via the in-app setup screen (BYOK). All data stays in the user's browser.

**Optional:** To enable cloud sync (save/load plans across devices), set these environment variables in Vercel:
| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and PR guidelines. Open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)

## Origin

This project originated from the Event Pragmetizer MVP (M3.0), an AI-powered event planning prototype that reached three milestones of development before being forked into this open-source version.
