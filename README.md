# Event Pragmetizer

[![CI](https://github.com/NadavGB86/event-pragmetizer-oss/actions/workflows/ci.yml/badge.svg)](https://github.com/NadavGB86/event-pragmetizer-oss/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI-powered event planning that transforms natural language descriptions into feasible, personalized event plans.

## What It Does

Describe what you need — "a birthday party for 30 people, budget around $2000, somewhere outdoors" — and the app will:

1. **Profile your needs** through a conversational chat interface
2. **Generate 2-3 candidate plans** with different tradeoff strategies
3. **Verify feasibility** using Google Search grounding (real venues, real prices)
4. **Deliver an actionable itinerary** with booking links, maps, and cost breakdowns

## Features

- Conversational needs analysis with real-time profile extraction
- Multi-plan comparison with feasibility scoring
- Two-stage plan validation (advisory + strict pass/fail)
- Google Search grounding for venue and price verification
- Date-aware planning (exact dates, date ranges, or open-ended)
- Multi-currency support (USD, ILS, EUR, GBP)
- Smart undo/redo for all state changes
- Cloud persistence via Supabase (optional)
- Magic link authentication (optional)
- Exportable plans (JSON backup + styled HTML)
- Actionable links (Google Maps, Booking.com, Search)

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
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `VITE_SUPABASE_URL` | No | Supabase project URL (for cloud save) |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key (for auth) |

Without Supabase, the app works fully with localStorage-based persistence.

## Tech Stack

- **React 19** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS v3** (compiled, with typography plugin)
- **Google Gemini API** (`@google/genai`) — Flash for chat, Pro for generation/judging
- **Supabase** (optional — auth + cloud persistence)
- **Vitest** (testing)
- **ESLint 9** + **Prettier** (code quality)
- **Lucide React** (icons)

## Project Structure

```
├── App.tsx                    # Main entry, state management, phase routing
├── types.ts                   # Centralized TypeScript interfaces
├── constants.ts               # Model names, system prompts, initial profile
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
npm run test         # Run test suite (66 tests)
npm run test:watch   # Watch mode
npm run format       # Prettier
```

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and PR guidelines. Open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)

## Origin

This project originated from the Event Pragmetizer MVP (M3.0), an AI-powered event planning prototype that reached three milestones of development before being forked into this open-source version.
