# Event Pragmetizer

[![CI](https://github.com/NadavGB86/event-pragmetizer-oss/actions/workflows/ci.yml/badge.svg)](https://github.com/NadavGB86/event-pragmetizer-oss/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**AI-powered event planning that turns a conversation into a real, actionable plan.**

Describe what you need in plain language — "a birthday party for 30 people, budget around $2,000, somewhere outdoors" — and the app handles the rest: profiling your needs, generating multiple plan options, verifying feasibility with real-world data, and delivering a complete itinerary with booking links.

**[Try it live](https://event-pragmetizer-oss.vercel.app)** | [Contributing](CONTRIBUTING.md) | [Changelog](docs/CHANGELOG.md)

---

## How It Works

1. **Pick your depth** — choose Quick, Guided, or Deep mode depending on how much detail you want to provide
2. **Chat about your event** — a conversational AI analyst profiles your needs (guests, budget, vibe, dates, location)
3. **Compare plans** — 2-3 candidate plans generated with different tradeoff strategies and feasibility scores
4. **Verify feasibility** — plans are validated against real venues and prices via Google Search grounding
5. **Get your itinerary** — a finalized, actionable plan with maps, booking links, and cost breakdowns

## Key Features

| | |
|---|---|
| **Free or Paid** | Choose Free mode (Gemini Flash, $0) or Full mode (Pro for plans, pay-per-use) — switch anytime in Settings |
| **Your Key, Your Data** | BYOK (Bring Your Own Key) — your API key stays in your browser, never sent to any server |
| **Works Everywhere** | Responsive PWA — installable on phone or desktop, works offline for saved plans |
| **Multi-Currency** | USD, ILS, EUR, GBP with automatic formatting |
| **Smart Validation** | Two-stage judging: advisory review + strict pass/fail with Google Search grounding |
| **Cloud Sync** | Optional Supabase integration for saving plans across devices |
| **Export & Share** | JSON backup, styled HTML export, actionable Google Maps and Booking.com links |

## Quick Start

You need [Node.js](https://nodejs.org/) 18+ and a [Google Gemini API key](https://aistudio.google.com/apikey) (free tier available).

```bash
git clone https://github.com/NadavGB86/event-pragmetizer-oss.git
cd event-pragmetizer-oss
npm install
npm run dev
```

Open `http://localhost:5175` and enter your Gemini API key when prompted. That's it.

> **No environment variables required.** The app works fully with browser-only storage. For development convenience, you can set `GEMINI_API_KEY` in a `.env.local` file (see `.env.example`).

## Deploy Your Own

Deploy to [Vercel](https://vercel.com) with zero configuration:

1. Fork this repo
2. Import in Vercel
3. Deploy

Users enter their own API key via the in-app setup screen. No server-side secrets needed.

<details>
<summary>Optional: Enable cloud sync</summary>

Set these environment variables in Vercel to let users save/load plans across devices:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

</details>

## Tech Stack

React 19 + TypeScript, Vite, Tailwind CSS v3, Google Gemini API (`@google/genai`), Vitest (86 tests), ESLint 9 + Prettier, Lucide React icons. Optional: Supabase for cloud sync.

<details>
<summary>Development commands</summary>

```bash
npm run dev          # Dev server (port 5175)
npm run build        # Production build
npm run typecheck    # Type-check
npm run lint         # ESLint
npm run test         # Run tests (86)
npm run test:watch   # Watch mode
npm run format       # Prettier
```

</details>

<details>
<summary>Project structure</summary>

```
├── App.tsx              # Entry, state management, phase routing
├── types.ts             # Centralized TypeScript interfaces
├── constants.ts         # Model config, system prompts
├── components/          # React components (one per file)
├── services/            # Gemini API calls, judge service
├── hooks/               # State logic (undo/redo)
├── utils/               # Pure functions + tests
├── context/             # React contexts (auth)
├── docs/                # Documentation + changelog
└── public/              # Static assets, PWA manifest, icons
```

</details>

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and PR guidelines. Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
