# Tradeoffs & Loose Ends

**Last Updated:** 2026-02-09 (Milestone 3.0)

---

## 1. Resolved Items (Milestone 2.0)

These were previously open items, now addressed:

- **State Persistence:** Cloud save/load via Supabase `plans` table with RLS. localStorage backup remains.
- **Currency Display:** Proper symbol mapping (ILS/EUR/USD/GBP) via `utils/currency.ts`. Scoring and sanity checks are currency-aware.
- **Profile Merge:** Array-aware deduplication via `utils/profileMerge.ts`. Constraints deduplicate by (type, value).
- **Back Navigation:** Full back-nav between all phases.
- **Export:** JSON backup export/import + HTML share with styled output and actionable links.
- **Authentication:** Magic link auth via Supabase, auto-close on link click.
- **Judge Verdict Display:** Score, reasoning, and feedback shown on finalized plan.
- **Pro Model:** Judge and refiner use `gemini-3-pro-preview` for higher quality evaluation.

---

## 2. Technical Tradeoffs (Still Open)

- **Local/Cloud Conflict Resolution:**
  If a user edits locally while offline and also has a cloud version, there's no merge strategy.
  Current behavior: last save wins. Consider adding timestamps or version comparison.

- **Undo Granularity:**
  Every state change could be an undo step. No grouping of related actions (e.g., "typing session").
  Not a bug, but could be improved for UX.

- **Performance:**
  No `React.memo` optimization for plan cards. Fine for current scale (2-3 plans), but would matter at 20+.

- **API Key in Client Bundle:**
  Gemini API key is embedded in the client bundle via Vite `define`. Acceptable for prototype/personal use.
  Production deployment would need a backend proxy.

- **Tailwind CDN:**
  Loaded via CDN script tag, not compiled. Means no custom config, no `@apply`, no `theme()`.
  Fine for current scope, but limits design system extensibility.

- **Grounding API Cost (M3.0):**
  Both soft + hard judges use Google Search grounding on every invocation. Each soft judge call fires
  on plan select AND after each refinement. Acceptable for prototype. For production, consider
  caching grounding results per plan hash, or rate-limiting soft judge calls.

- **`responseMimeType` + `tools` Conflict (M3.0):**
  Gemini does not support structured JSON output together with tool use (Google Search).
  Both judges use a try/catch fallback: try grounding first, fall back to JSON mode.
  This means grounding may silently fail on some model versions. `safeParseJson()` handles
  markdown-fenced responses from non-JSON-mode calls.

- **Soft Judge Latency (M3.0):**
  Pro + Search grounding takes 5-10s. The soft judge is fire-and-forget (non-blocking),
  so the user can start refining immediately. But the spinner may feel slow.

- **Date Extraction Accuracy (M3.0):**
  Date classification depends entirely on the analyst LLM correctly interpreting natural language
  dates into the three-tier schema. Explicit examples in prompt mitigate this, but edge cases
  (e.g., "next Friday") will likely produce `tier: 'none'` fallback.

---

## 3. Deferred Feature Ideas

- **Chat History Auto-Scroll:** `useRef` to scroll to bottom when new messages arrive.
- **Multi-City Logistics:** Travel time between cities, multi-leg itineraries.
- **Component-Level Error Boundaries:** Individual plan card crash isolation.
- **Real-Time Pricing:** Flight/hotel API integration (Skyscanner, Amadeus).
- **Collaborative Sharing:** "Send to Partner" with read-only link.
- **PWA / Mobile Polish:** Manifest, touch gestures, offline support.
- **Auto-Sync:** Replace manual save/load with real-time sync.

---

## 4. Resolved in M3.0

- **Booking.com links rewritten:** URLSearchParams-based, parenthetical stripping, no `dest_type=city`, includes checkin/checkout/guests when available.
- **No date awareness:** Now has three-tier DateInfo (exact/proximity/none) with date pivot UX, seasonal pricing in generator prompt.
- **Single-stage judging:** Now two-stage: soft judge (advisory, auto on select/refine) + hard judge (pass/fail gate). Both use Google Search grounding.
- **Generator quality on Flash model:** Generator now uses Pro model. Flash only for analyst chat.
- **No venue verification:** Both judges now use Google Search grounding to verify hotels/venues exist and check prices.

## 5. Previously Resolved (M2.0 / Post-M2.0)

- **Booking.com link accuracy (initial fix):** Links included hotel name + destination (was destination-only). Further fixed in M3.0.
- **Generator quality matching:** Generator prompt enforces accommodation quality matching user standards and requires specific property names.
- **Judge quality validation:** Judge now rejects plans with quality mismatches (e.g., budget Airbnb when user profiled for boutique hotels) and vague/generic component names.
- **Destination extraction:** `extractDestination()` now handles "Hotel in City" patterns and airport codes, not just "Flight to City".

---

## 6. The "Brain" Continuity Note

The logic for **Scoring** (deterministic, in `utils/scoring.ts`) vs **Judging** (LLM-based, in `services/judgeService.ts`) was aligned in Phase 5. Both use currency-aware budget comparison. If prompts or scoring logic drift apart, users may see conflicting signals ("90% match" but "Judge Rejected"). Keep these two systems in sync when making changes.

**M3.0 addition:** There are now THREE evaluation surfaces — deterministic scoring, soft judge (advisory), and hard judge (pass/fail). The soft judge score and hard judge score may differ because they use different prompts and evaluation criteria. The soft judge is intentionally more lenient (advisory) while the hard judge is strict (gatekeeper). If these drift too far apart, users may see a soft score of 85 followed by a hard rejection — this is by design, but the gap shouldn't be extreme.
