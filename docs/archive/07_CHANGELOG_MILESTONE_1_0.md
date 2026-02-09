# Changelog - Milestone 1.0 (Stability & Polish)

**Focus:** Moving from "Prototype" to "Production-Ready MVP".

## Major Features
*   **Smart Undo/Redo:** Implemented `useUndoRedo` hook to wrap the crucial application state (`AppState`). Users can now step back through changes (like rejecting a plan) without refreshing.
*   **Advanced Cost Calculator:** Added `Participants` data model (adults, children, rooms) to the profile. Generator and Judge now use per-night/per-room/per-person logic accurately.
*   **Strict Type Safety:** Centralized all interfaces in `types.ts` and removed `any` types (e.g., `JudgeVerdict` created).

## UI/UX Polish
*   **Participants Display:** Added a clear visual summary of the travel party (e.g., "2 Adults • 1 Kid") in the Sidebar.
*   **Visual Ternaries:** Refactored complex inline logic in `PlanComparison` and `ExecutionView` into readable variables.
*   **Icons:** Cleaned up unused Lucide imports.

## Architecture & Code Quality
*   **State Consolidation:** Refactored `App.tsx` to use a single source of truth (`useUndoRedo`) instead of disparate `useState` atoms.
*   **Linting:** Fixed `useEffect` dependency warnings, `window` vs `globalThis`, and unused variable warnings.
*   **Stability:** Build Verification (`npm run build`) passed successfully.

## Known Limitations (See Loose Ends)
*   State persistence is currently limited to `localStorage`.
*   APIs are still simulated via LLM prompts (no real GDS/OTA lookup).
