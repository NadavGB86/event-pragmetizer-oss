> **ARCHIVED (2026-02-09):** This document was written before recovery. The file structure,
> state architecture, data flows, and "What Does NOT Exist" sections are all outdated.
> The project now has 25+ source files, Supabase auth, cloud persistence, undo/redo, judge service, and more.
> **Do not use for current architecture understanding.** See `CLAUDE.md` for current file map and architecture.

# Technical Overview: Event Pragmetizer Codebase (ARCHIVED)

## Purpose

Explains the current codebase structure, data flow, dependencies, and runtime
behavior as they exist in the repository. No aspirational content -- this is
what IS, not what should be.

---

## 1. Stack & Dependencies

| Layer | Technology | Version |
|---|---|---|
| Runtime | Vite + React | Vite 6.2, React 19.2 |
| Language | TypeScript | 5.8 |
| Styling | Tailwind CSS (CDN) | Latest via cdn.tailwindcss.com |
| Icons | lucide-react | 0.563 |
| LLM Backend | Google Gemini API | @google/genai 1.40 |
| Font | Inter (Google Fonts CDN) | 300-700 weights |

**Notable:** Tailwind is loaded via CDN script tag in `index.html`, not compiled.
This means only Tailwind's pre-built utility classes are available. No custom
config, no `@apply`, no `theme()` extensions.

**Build chain:** Vite with `@vitejs/plugin-react`. Standard dev server on port 3000.
No SSR, no API routes -- this is a pure client-side SPA.

**API key handling:** The Gemini API key is read from `.env.local` as
`GEMINI_API_KEY` and injected at build time via Vite's `define` config in
`vite.config.ts`. The key is exposed to the client bundle (acceptable for a
prototype, not for production).

---

## 2. File Structure

```
/
├── index.html              # Entry point, loads Tailwind CDN + Inter font
├── index.tsx               # React root mount
├── App.tsx                 # Main app component, state management, phase routing
├── types.ts                # All TypeScript interfaces and enums
├── constants.ts            # Initial state + LLM system instructions
├── components/
│   ├── ChatInterface.tsx   # Chat UI (messages list + input)
│   ├── ProfileSidebar.tsx  # Real-time extraction display
│   ├── PlanComparison.tsx  # 3-card plan selection view
│   └── ExecutionView.tsx   # Timeline plan detail view
├── services/
│   └── geminiService.ts    # All Gemini API calls
├── vite.config.ts          # Build configuration
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
├── metadata.json           # AI Studio app metadata
└── .env.local              # GEMINI_API_KEY (not committed)
```

**Total codebase size:** ~800 lines of TypeScript across all files. Compact prototype.

---

## 3. State Architecture

All state lives in `App.tsx` via `useState` hooks. No state management library.

```
App State
├── phase: AppPhase              # INTAKE | SYNTHESIS | MATCHING | EXECUTION
├── messages: ChatMessage[]      # Full chat history
├── isProcessing: boolean        # Loading state for LLM calls
├── userProfile: UserProfile     # Accumulated extraction from chat
├── generatedPlans: CandidatePlan[]  # Plans from generator
└── selectedPlan: CandidatePlan | null  # User's chosen plan
```

**Phase transitions:**
```
INTAKE  ──[Generate Plans]──►  SYNTHESIS  ──[plans returned]──►  MATCHING
MATCHING  ──[Select & Refine]──►  EXECUTION
EXECUTION  ──[Back to Options]──►  MATCHING
```

There is no backward path from MATCHING to INTAKE. Once plans are generated,
the chat and profile are abandoned.

---

## 4. Data Flow: Intake Phase

```
User types message
    │
    ▼
App.handleSendMessage(text)
    │
    ├── Creates ChatMessage, appends to messages[]
    │
    ▼
GeminiService.sendMessageToAnalyst(history, currentProfile)
    │
    ├── Serializes chat history as flat text: "USER: ...\nMODEL: ..."
    ├── Serializes current profile as JSON string
    ├── Sends to Gemini with SYSTEM_INSTRUCTION_ANALYST
    │
    ▼
LLM Response (text + optional ```json block)
    │
    ▼
parseAnalystResponse(text)
    │
    ├── Regex extracts ```json ... ``` block if present
    ├── Parses JSON into Partial<UserProfile>
    ├── Returns { text: conversational_part, profileUpdate: parsed_json }
    │
    ▼
App receives result
    │
    ├── If profileUpdate exists:
    │       Shallow-merge into userProfile (BUG: overwrites arrays)
    │
    └── Append model response to messages[]
```

**Key behavior of the Analyst prompt:**
The system instruction (`SYSTEM_INSTRUCTION_ANALYST` in `constants.ts`) asks the
LLM to:
1. Conduct a friendly interview
2. Extract structured data into defined categories (standards, constraints, targets, visions, declared_wants)
3. Append a JSON block at the end of every response that contains new structured data

The JSON block is stripped from the displayed message (user never sees it) and
parsed into the profile state.

**Known issues:**
- Chat history is sent as flat text, not structured messages. The model can't
  reliably distinguish turns in long conversations.
- Profile context is sent on every call but grows monotonically. No summarization
  or windowing strategy for long conversations.
- The JSON extraction regex (`/```json\s*([\s\S]*?)\s*```/`) is greedy-minimal but
  will fail if the LLM produces malformed JSON or multiple JSON blocks.

---

## 5. Data Flow: Plan Generation

```
User clicks "Generate Plans"
    │
    ▼
App.handleGeneratePlans()
    │
    ├── Sets phase to SYNTHESIS (triggers loading spinner)
    │
    ▼
GeminiService.generateCandidatePlans(userProfile)
    │
    ├── Serializes profile as JSON
    ├── Sends to Gemini with SYSTEM_INSTRUCTION_GENERATOR
    ├── Uses responseMimeType: "application/json" (forces JSON output)
    ├── Temperature: 0.8
    │
    ▼
LLM returns JSON array of CandidatePlan objects
    │
    ▼
App receives plans
    │
    ├── Sets generatedPlans = plans
    ├── Sets phase to MATCHING
    │
    ▼
PlanComparison renders 3 plan cards
```

**Key behavior of the Generator prompt:**
The system instruction (`SYSTEM_INSTRUCTION_GENERATOR`) defines the output schema
and asks for 3 plans with different tradeoff strategies. It uses
`responseMimeType: "application/json"` which forces the Gemini model to output
valid JSON (no conversational wrapper).

**No post-processing occurs on the returned plans.** The feasibility_score,
cost_estimate values, and component details are displayed exactly as the LLM
generates them. There is no validation, no re-scoring, no constraint checking.

---

## 6. Data Flow: Execution View

```
User clicks "Select & Refine" on a plan card
    │
    ▼
App.handleSelectPlan(plan)
    │
    ├── Sets selectedPlan = plan
    ├── Sets phase to EXECUTION
    │
    ▼
ExecutionView renders the SAME CandidatePlan object
    │
    ├── Hero header: title, summary, budget, feasibility score
    ├── Timeline: plan.components mapped to alternating cards
    │
    (No additional LLM call. No enrichment. No booking links.)
```

The `refinePlan` function exists in `geminiService.ts` but is **never called**
from any component. It was presumably intended for a "refine" interaction in the
Execution view that was not implemented.

---

## 7. Type System

All types are in `types.ts`. Key relationships:

```
UserProfile
├── needs: NeedsProfile
│   ├── standards: string[]
│   ├── habits: string[]
│   ├── traits: string[]
│   ├── constraints: Constraint[]  ─── { type, value, flexibility, notes? }
│   └── latent_desires: string[]
└── goals: GoalsProfile
    ├── targets: Target[]  ─── { description, priority, category }
    ├── declared_wants: string[]
    ├── considerations: string[]
    └── visions: Vision[]  ─── { description, reference_type, content? }

CandidatePlan
├── id: string
├── title: string
├── summary: string
├── components: PlanComponent[]  ─── { type, title, details, cost_estimate, flexibility }
├── total_estimated_budget: number
├── feasibility_score: number
├── match_reasoning: string
└── tradeoffs: string[]

AppPhase (enum): INTAKE | SYNTHESIS | MATCHING | EXECUTION

ChatMessage: { id, role, content, timestamp, isThinking? }
```

**Unused fields:** `ChatMessage.isThinking` is defined but never set to `true`.
`PlanComponent.type` includes `"logistics"` as a valid value but no plan component
in observed outputs uses it (childcare gets mislabeled as `"accommodation"`).

---

## 8. External Dependencies & Runtime Requirements

- **Gemini API key** in `.env.local` as `GEMINI_API_KEY`. Without it, all LLM calls fail silently (caught by try/catch, returns fallback text).
- **Internet access** required at runtime for: Gemini API calls, Tailwind CDN, Google Fonts CDN, lucide-react ESM import.
- **No database.** All state is in-memory React state. Refreshing the page resets everything.
- **No authentication.** No user accounts, no session persistence.
- **No backend server.** The Gemini API is called directly from the browser. The API key is embedded in the client bundle.

---

## 9. What Does NOT Exist in the Codebase

For clarity, these features are referenced in the spec or implied by the UI but
have no implementation:

| Feature | Status |
|---|---|
| SynthesisRequest construction | No code (using simplified direct prompt) |
| LLM 2 (Executor) enrichment call | No code (UI refinement uses direct generation, no separate API) |
| Flight/hotel/activity data APIs | No code (simulated placeholders) |
| Constraint relaxation suggestions | No code |
| Multi-user sessions | No code |
| Persistent storage (Server) | No code (using LocalStorage client-side) |

**Recently Implemented (Phase 5):**
- **Persistence:** LocalStorage integration (App.tsx: `loadState`)
- **Error Boundary:** Component crash protection
- **Judge Loop:** `judgeService.ts` evaluates plans before finalization
- **Back Navigation:** Full navigation between phases
- **Readiness Gate:** Profile validation logic

