> **Aspirational Reference (2026-02-09):** This walkthrough shows the ideal end-to-end flow
> with the Birthday 40 scenario. The actual implementation covers most of this flow but some details
> (e.g., SynthesisRequest structure, exact day-plan format) differ from what's described here.
> Use as a **vision document** for product direction, not as a technical spec of current behavior.

# End-to-End Walkthrough: Birthday 40 Use Case

## Purpose

Demonstrates how the Event Pragmetizer processes a real scenario from initial user
input through final execution plan. Shows the data transformations at each segment
boundary and what the user sees at each phase.

This is the reference example for development and testing.

---

## The Scenario

A user needs to plan a 40th birthday trip abroad for his partner. He is under
extreme stress (job search, toddler, sleep-deprived), has a tight budget (8,000 ILS),
limited childcare options (grandparents max 2 days), and his partner has high
standards for accommodation and experience quality.

---

## Phase 1: Intake

### What the User Sees

A chat interface on the left, an empty "Live Context" sidebar on the right.
The system opens with:

> **System:** Hi! I'm your Event Pragmetizer. I'm here to turn your vague ideas
> into a solid plan. Tell me about the event you're planning -- who it's for,
> what matters to them, what you're working with, and anything else on your mind.
> The more you share now, the less I'll need to ask later.

### User's First Message (Raw Input)

```
I want to plan a 40th birthday trip abroad for my partner. This is a big milestone
for her and I want it to feel special, but I'm in a really difficult spot right
now in terms of bandwidth -- I'm between jobs, deep in a job search, barely
sleeping, and I have almost zero mental capacity for logistics and planning.
So I need serious help here.

About her and what she likes:
She loves traveling abroad, especially to places that combine high standards with
beauty and comfort. Think boutique hotels, not chains. She's into the "glamping"
aesthetic -- she loves nature and beautiful scenery, but it has to be clean,
polished, and high-end. Not rustic, not rough. She enjoys great restaurants
(chef-level, not necessarily Michelin but quality), good cocktails, spa treatments
and massages, and generally feeling pampered. She can enjoy a funny movie or a
stand-up comedy show. The key thing to understand about her: she doesn't travel
to "see things" or check boxes -- she travels to feel good. If the hotel is
mediocre, the whole trip fails for her, no matter how great the itinerary is.

About me and what I need:
I get bored easily on vacations that are just "relax and do nothing." I need some
intellectual stimulation -- I love escape rooms, cultural stories and history when
it's engaging (not dry museum tours), puzzle-type experiences, and deep
conversations. I enjoy good food broadly but I'm not a foodie snob. Stand-up
comedy, game nights, fun social experiences -- that's my speed. I hate feeling
rushed or stressed on trips. If there's a tight schedule and missing one train
means the whole day is ruined, I'll be miserable. I need buffer time, flexible
plans, and room for error.

Practical situation:
- We live in Israel.
- We have a 2-year-old son. We'd strongly prefer to travel without him (this is
  her 40th, she deserves adult time), but childcare is limited. My parents or hers
  can watch him for a maximum of 2 days. Beyond that we'd need to figure something
  out -- maybe a paid sitter for the extra days, but that cost would be separate
  from the trip budget.
- We also have a dog that needs boarding (also separate cost).
- Budget for the trip itself (flights, hotel, food, activities): around 8,000 ILS,
  which is roughly 2,000-2,300 EUR. I know this is tight for what I'm describing.
- Trip length: ideally 3 nights, maybe 4 if we solve the childcare gap.
  A 2-night weekend trip feels too short for a 40th birthday abroad, but it's the
  fallback if logistics don't work out.

What I'm bad at (seriously, factor this in):
- Tight schedules and time-sensitive bookings
- Bureaucracy, fine print, complicated transfers
- Multi-step logistics (connecting flights, train + bus + taxi chains)
- Remembering small details under pressure

What would make this a success:
For her -- she walks away feeling like she had a luxurious, beautiful, special
birthday experience.
For me -- I don't have a panic attack planning or executing it.
For both -- a few moments of real connection, good food, some laughs, and the
feeling that we actually did something meaningful for this milestone.

I don't have specific destinations in mind. Open to suggestions, but keep in mind:
wherever we go needs to be simple to get to from Tel Aviv (short direct flight),
easy to navigate once there, and a place where our budget actually buys quality.
```

### System Processing (Hidden from User)

The Analyst LLM processes this and returns conversational text plus a JSON block:

**Displayed to user:**
> This sounds like a wonderful plan, and I can already see some strong directions
> to work with. Before I start generating options, let me confirm a couple of
> things. First -- do you have specific dates in mind, or a window of weeks where
> this could happen? Flight prices can vary significantly even within the same month.
> Second -- regarding the childcare gap: if grandparents cover 2 days and you need
> 3 nights, would you be open to arranging one additional day of paid childcare
> at home? That single extra day is the difference between a 2-night trip and a
> proper 3-night getaway.

**Extracted JSON (parsed and merged into profile):**

```json
{
  "needs": {
    "standards": [
      "Boutique hotels (no chains)",
      "High-end clean aesthetic",
      "Chef-level restaurants",
      "Quality cocktail bars"
    ],
    "habits": [
      "Travels to feel good, not to sightsee",
      "Enjoys spa/massage as core activity",
      "Tolerates movies if not too long",
      "Enjoys comedy shows"
    ],
    "traits": [
      "Aesthetic-driven decision maker",
      "Comfort is prerequisite, not bonus",
      "Currently cognitively overloaded",
      "Poor at logistics under stress",
      "Needs intellectual stimulation on trips"
    ],
    "constraints": [
      { "type": "budget", "value": "8000 ILS (~2100 EUR)", "flexibility": "hard" },
      { "type": "time", "value": "3 nights preferred, 2-4 range", "flexibility": "soft" },
      { "type": "logistics", "value": "Grandparents max 2 days childcare", "flexibility": "hard" },
      { "type": "logistics", "value": "Dog boarding required (separate cost)", "flexibility": "hard" },
      { "type": "geographic", "value": "Direct flight from TLV, max 4.5 hours", "flexibility": "hard" },
      { "type": "logistics", "value": "Minimal complexity - low transfer tolerance", "flexibility": "hard" }
    ],
    "latent_desires": [
      "Wants to feel like a competent partner despite chaos",
      "Needs guilt-free disconnection from job search"
    ]
  },
  "goals": {
    "targets": [
      { "description": "Partner feels celebrated for milestone 40th", "priority": "must_have", "category": "emotional" },
      { "description": "Luxurious, beautiful experience overall", "priority": "must_have", "category": "experience" },
      { "description": "Intellectual stimulation for planner", "priority": "strong_want", "category": "experience" },
      { "description": "Zero-stress execution", "priority": "must_have", "category": "logistics" }
    ],
    "declared_wants": [
      "Spa/massage",
      "Fine dining",
      "Cocktail bars",
      "Escape room",
      "Stand-up comedy",
      "Nature (glamping aesthetic)"
    ],
    "considerations": [
      "Budget extremely tight for described standards",
      "Childcare gap between 2 grandparent days and 3-night trip",
      "Partner's hotel standards are deal-breaker level"
    ],
    "visions": [
      { "description": "Rooftop cocktails overlooking a historic city at sunset", "reference_type": "text" },
      { "description": "Beautiful hotel room, coffee on balcony, no rush", "reference_type": "text" },
      { "description": "A dinner that feels like an event itself", "reference_type": "text" }
    ]
  }
}
```

### Sidebar State After First Exchange

The "Live Context" sidebar now shows:
- **Constraints:** Budget ₪8,000 (hard), Duration 2-4 nights (soft), Childcare 2 days max (hard), Direct flight from TLV (hard), Low complexity (hard)
- **Standards:** Boutique hotels, Chef restaurants, High-end aesthetic, Quality cocktails
- **Targets:** Partner feels celebrated (must_have), Zero-stress execution (must_have), Intellectual stimulation (strong_want)
- **Wants:** Spa, Fine dining, Cocktails, Escape room, Comedy, Nature
- **Visions:** Rooftop cocktails at sunset, Beautiful hotel room morning, Dinner as event

### Follow-Up Exchange

User responds to the system's questions:

```
Dates are flexible -- anytime in the next 2 months. Weekday departure is fine.
And yes, we can arrange a paid sitter for one extra day if it means 3 nights
instead of 2. That cost is outside the trip budget.

No specific destination dreams from her. She liked Santorini photos she saw online
but we both know that's way out of budget. We've been to Prague before and loved
it but want somewhere new. No food restrictions.
```

**System extracts and appends:**
```json
{
  "needs": {
    "constraints": [
      { "type": "time", "value": "Flexible dates, next 2 months", "flexibility": "soft" },
      { "type": "logistics", "value": "Paid sitter for day 3 available (outside budget)", "flexibility": "negotiable" }
    ]
  },
  "goals": {
    "considerations": [
      "Santorini aesthetic appeal but budget-unrealistic",
      "Prague visited before - exclude from destinations"
    ]
  }
}
```

### Readiness Assessment

```
assessReadiness(profile) → {
  isReady: true,
  missingCritical: [],
  missingOptional: ["specific_dates"],
  note: "Dates are flexible (next 2 months). System can optimize for price."
}
```

The "Generate Plans" button turns green: "Ready to generate."

---

## Phase 2: Plan Synthesis + Matching

### What the User Sees

Loading screen: "Synthesizing options... The Analyst is reviewing your constraints
against possibilities."

### System Processing (Hidden)

**Step 1: Build SynthesisRequest**

```json
{
  "hard_envelope": {
    "budget_ils": 8000,
    "budget_eur_approx": 2100,
    "duration_nights": [2, 3],
    "origin": "TLV",
    "direct_flights_only": true,
    "max_flight_hours": 4.5,
    "accommodation_min_standard": "boutique_4star_equivalent",
    "logistics_complexity_cap": "low",
    "excluded_destinations": ["Prague"]
  },
  "scoring_weights": {
    "partner_satisfaction": 0.40,
    "planner_satisfaction": 0.15,
    "budget_efficiency": 0.20,
    "logistics_simplicity": 0.15,
    "milestone_feeling": 0.10
  },
  "pre_departure_requirements": {
    "childcare": "3 days total: 2 grandparents + 1 paid sitter. Arrange before booking flights.",
    "pet_boarding": "Book dog boarding for trip duration + 1 buffer day."
  }
}
```

**Step 2: LLM generates 3 candidate plans**

**Step 3: Deterministic feasibility scoring**

Example scoring for "The Athenian Sensory Sanctuary" (3 nights, ₪7,950):

```
budget_fit:              92  (7950/8000 = 99.4%, within budget but minimal buffer)
logistics_complexity:    95  (direct flight, central hotel, walkable)
experience_quality:      88  (hits 5/6 declared wants: spa, dining, cocktails,
                              comedy [English-friendly], nature aesthetic.
                              Missing: escape room not prominent in Athens)
constraint_satisfaction: 100 (all hard constraints met)
desire_fulfillment:      85  (both must_haves met, 1/1 strong_want partially met)

Overall: 0.40(88) + 0.15(85) + 0.20(92) + 0.15(95) + 0.10(90) = 89.85 → 90%
```

Example scoring for "The Budapest Intellectual Grandeur" (3 nights, ₪8,000):

```
budget_fit:              80  (8000/8000 = 100%, zero buffer)
logistics_complexity:    90  (direct flight, central hotel. Slightly longer flight than Athens)
experience_quality:      95  (hits 6/6: spa, dining, cocktails, escape room capital,
                              comedy clubs, ruin bar culture)
constraint_satisfaction: 95  (all hard constraints met, budget at exact limit)
desire_fulfillment:      92  (both must_haves met, strong_want fully met)

Overall: 0.40(95) + 0.15(92) + 0.20(80) + 0.15(90) + 0.10(95) = 90.90 → 91%
```

**Step 4: Matching loop check**

All 3 plans score above 70% threshold. No adjustment iterations needed.
Plans are sorted by overall score and passed to the comparison view.

### What the User Sees

Three plan cards displayed side-by-side:

| Plan | Budget | Feasibility | Lead Tradeoff |
|---|---|---|---|
| Budapest Intellectual Grandeur | ₪8,000 | 91% | Budget at hard limit, zero buffer |
| Athenian Sensory Sanctuary | ₪7,950 | 90% | Weaker on intellectual stimulation |
| Bucharest Max-Value Indulgence | ₪7,200 | 87% | City aesthetic less "polished" |

Each card shows:
- Title + feasibility badge
- Summary paragraph
- Budget estimate in ILS
- Tradeoff strategy (2-3 bullet points)
- Top 3 components (transport, accommodation, lead activity)
- "Select & Refine →" button

**Feasibility breakdown on hover/expand:**

Budapest card expands to show:
```
Budget Fit:              ████████░░ 80%   ← flagged amber (at limit)
Logistics Simplicity:    █████████░ 90%
Experience Quality:      █████████▌ 95%   ← highest of all plans
Constraint Satisfaction: █████████▌ 95%
Desire Fulfillment:      █████████░ 92%
```

---

## Phase 3: Execution

### User Selects Budapest Plan

Clicks "Select & Refine →" on the Budapest card.

### System Processing (Hidden)

The Executor LLM (LLM 2) is called with the approved plan skeleton and full profile.
Temperature: 0.3. System instruction emphasizes precision, real-world grounding,
buffer time, and fallback options.

### What the User Sees

#### Hero Header
```
The Budapest Intellectual Grandeur

A balanced 3-night plan focusing on the city's famous thermal history
and high-concept escape games. Perfectly hits the 'Boutique' and
'Intellectual Stimulation' targets within budget.

₪8,000    Feasibility: 91%
```

#### Pre-Departure Checklist
```
Before You Go
─────────────
☐ Confirm grandparents for Day 1-2 childcare
☐ Book paid sitter for Day 3
☐ Book dog boarding (trip dates + 1 buffer day)
☐ Book flights: TLV-BUD direct (Wizz Air, check for Thu departure deals)
☐ Book hotel: Hotel Clark Budapest or Palazzo Zichy (confirm availability)
☐ Book escape room: Reserve "The Grand Budapest" at Locked Room (English available)
```

#### Day-by-Day Itinerary

**Day 1 (Thursday): Arrival & Ruin Bar Discovery**
```
14:00   Arrive BUD. Private transfer to hotel (pre-booked, ~25 min).
        → Fallback: Bolt taxi, ~€15, no booking needed.

15:30   Check in at Hotel Clark Budapest.
        Take 30 min to decompress. No obligations until evening.

17:00   FLEX WINDOW (2 hours)
        Options: Walk along Danube promenade / nap / hotel bar.

19:00   Dinner at Borkonyha Wine Kitchen.
        → Fallback: Babel Budapest (walkable, same quality tier).
        Budget: ~₪400 for two with wine.

21:30   Ruin bar crawl: Start at Szimpla Kert, drift to Instant-Fogas.
        → No booking needed. Open late. Leave whenever.
```

**Day 2 (Friday): The Intellectual & Sensory Day**
```
10:00   Late breakfast at hotel (included).

11:00   Escape Room: "The Grand Budapest" at Locked Room.
        → Pre-booked. English-language. ~75 min.
        → Fallback: Escape Room Division (10 min walk, also English).
        Budget: ~₪180 for two.

13:00   Lunch: casual street food at Central Market Hall.
        Budget: ~₪100 for two.

14:30   Szechenyi Thermal Baths. Couples entry + private cabin.
        → No strict time limit. Stay 2-3 hours.
        → Fallback: Gellert Baths (more ornate, slightly pricier).
        Budget: ~₪200 for two.

18:00   FLEX WINDOW (1.5 hours)
        Options: Hotel rest / Danube walk / cocktail at hotel bar.

19:30   Birthday dinner: Costes (1 Michelin star) OR Onyx (fine dining, Buda side).
        → This is THE dinner. Book in advance. Tasting menu.
        Budget: ~₪700 for two with pairing.
        → Fallback: Borkonyha again (if Costes fully booked).

22:00   Cocktails at Boutiq'Bar or Kollazs.
        → Walk-in. No reservation needed.
```

**Day 3 (Saturday): Her Day**
```
10:30   Late start. Room service breakfast (budget: ~₪100).

11:30   Spa treatment: 90-min couples massage at hotel spa or Rudas Bath Spa.
        → Pre-book. Budget: ~₪350 for couples treatment.

14:00   Light lunch at a café in the Jewish Quarter.
        → Walk and browse vintage shops / galleries.
        Budget: ~₪150 for two.

16:00   FLEX WINDOW (3 hours)
        Options: Fisherman's Bastion sunset view (free) /
        Danube river cruise (₪100, 1 hour, optional) /
        Simply rest at hotel.

19:00   Farewell dinner: Mazel Tov (Mediterranean, garden courtyard, great vibe).
        Budget: ~₪350 for two.

21:00   Evening open. Options:
        - Live jazz at Budapest Jazz Club
        - Stand-up at Dumaszínház (check for English-friendly shows)
        - Quiet cocktails back at a ruin bar

Pack for morning departure.
```

**Day 4 (Sunday): Departure**
```
09:00   Breakfast at hotel.
10:00   Check out. Private transfer to airport (~25 min).
        → Same Bolt fallback as arrival.
12:00+  Flight BUD-TLV.
```

#### Budget Summary
```
Category              Estimated (ILS)
───────────────────────────────────────
Flights (2x roundtrip)      2,200
Accommodation (3 nights)    2,800
Dining (3 dinners + casual) 1,700
Activities (escape + spa)     730
Transport (transfers)         250
Buffer / misc                 320
───────────────────────────────────────
Total                       8,000
```

#### Contingency Notes
```
• If Costes dinner is fully booked: Borkonyha and Babel are both excellent
  and ₪200-300 cheaper. Reallocate savings to a fancier cocktail bar.
• If weather is cold/rainy on Day 3: Replace Fisherman's Bastion with
  New York Café (iconic interior, no weather dependency, ₪50 for coffee).
• If escape room slots are full: Book "Trap Factory" instead (also English,
  similarly reviewed, 15-min walk from center).
• If flight prices spike above ₪2,500 for two: Shift departure to Wednesday
  (mid-week flights are typically ₪300-500 cheaper).
```

---

## Data Transformation Summary

```
Phase 1 Input:   ~500 words of unstructured natural language
Phase 1 Output:  Structured UserProfile (6 constraints, 4 targets, 6 wants, 3 visions)

Phase 2 Input:   UserProfile + SynthesisRequest with hard envelope
Phase 2 Output:  3 CandidatePlans, each scored on 5 dimensions

Phase 3 Input:   Selected CandidatePlan + full UserProfile
Phase 3 Output:  ExecutionPlan with 4 day-plans, 12 time blocks,
                 8 fallback options, 6 pre-departure tasks, budget summary

Total LLM calls: 1 (analyst chat) + 1 (plan generation) + 1 (execution enrichment) = 3
Total deterministic computations: 1 (readiness check) + 3 (feasibility scores) = 4
```

---

## What This Example Validates

1. **A single rich user input** provides enough signal for complete profiling
   without extensive back-and-forth (the system asks 2 follow-up questions,
   not 10).

2. **Feasibility scoring differentiates plans meaningfully.** Budapest scores
   highest on experience but lowest on budget buffer. Athens is safer financially
   but weaker on the planner's intellectual needs. The scores reflect real tradeoffs.

3. **The execution plan is usable as-is.** A stressed, logistics-averse user
   could print this and follow it. Every fixed commitment has a fallback. Every
   evening has flex time. Nothing requires precision timing.

4. **Pre-departure logistics are separated from destination planning.** Childcare
   and dog boarding appear as a checklist, not as plan components with fake
   cost estimates.

5. **Budget arithmetic is verifiable.** Each component has a line-item estimate.
   The total matches the hard constraint. The user can see exactly where the
   money goes and decide if the allocation matches their priorities.
