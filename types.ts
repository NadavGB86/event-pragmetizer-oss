// Domain Models based on Segment A & B
export interface Constraint {
  type: "budget" | "time" | "logistics" | "geographic" | "social";
  value: string | number;
  flexibility: "hard" | "soft" | "negotiable";
  notes?: string;
}

// Date Awareness (M3.0)
export interface DateInfo {
  tier: 'exact' | 'proximity' | 'none';
  start_date?: string;   // ISO "2026-03-15" (tier: exact)
  end_date?: string;     // ISO "2026-03-18" (tier: exact)
  hint?: string;         // "sometime in April" (tier: proximity)
  earliest?: string;     // ISO optional lower bound (tier: proximity)
  latest?: string;       // ISO optional upper bound (tier: proximity)
}

// Participant Model for Cost Calculation
export interface ParticipantProfile {
  adults: number;
  children: number;
  room_count: number;
  description: string; // e.g. "Couple", "2 Adults + 1 Child"
}

export interface NeedsProfile {
  participants: ParticipantProfile;
  standards: string[];
  habits: string[];
  traits: string[];
  constraints: Constraint[];
  latent_desires: string[];
}

export interface Target {
  description: string;
  priority: "must_have" | "strong_want" | "nice_to_have";
  category: "experience" | "logistics" | "emotional" | "social";
}

export interface Vision {
  description: string;
  reference_type: "text" | "image" | "link";
  content?: string;
}

export interface GoalsProfile {
  targets: Target[];
  declared_wants: string[];
  considerations: string[];
  visions: Vision[];
}

// Full User Profile Context
export interface JudgeVerdict {
  pass: boolean;
  score: number;
  reasoning: string;
  feedback: string[];
  grounding_notes?: string[];
}

// Soft Judge (advisory, non-blocking) — M3.0
export interface SoftJudgeVerdict {
  score: number;
  summary: string;
  suggestions: string[];       // 3-5 actionable refinement commands (clickable chips)
  date_alignment?: string;
  grounding_notes: string[];   // Facts verified via Google Search
}

// Consolidated State for Undo/Redo
export interface AppState {
  phase: AppPhase;
  messages: ChatMessage[];
  userProfile: UserProfile;
  generatedPlans: ScoredPlan[];
  selectedPlan: CandidatePlan | null;
  judgeFeedback: JudgeVerdict | null;
  softJudgeFeedback: SoftJudgeVerdict | null;
}

export interface UserProfile {
  needs: NeedsProfile;
  goals: GoalsProfile;
  date_info: DateInfo;
}

// Plan Models based on Segment C
export interface PlanComponent {
  type: "transport" | "accommodation" | "activity" | "dining" | "logistics";
  title: string;
  details: string;
  cost_estimate: number;
  itinerary_day?: number; // 1-based day index
  flexibility: "fixed" | "movable" | "optional";
}

export interface LogisticsTask {
  description: string;
  resolved: boolean;
  cost_estimate: number;
  outside_trip_budget: boolean;
}

export interface PreDepartureLogistics {
  childcare: LogisticsTask[];
  pet_care: LogisticsTask[];
  documents: LogisticsTask[];
  other: string[];
}

export interface CandidatePlan {
  id: string;
  title: string;
  summary: string;
  components: PlanComponent[];
  pre_departure_logistics?: PreDepartureLogistics; // New field for home logistics
  total_estimated_budget: number;
  feasibility_score: number; // 0-100
  match_reasoning: string;
  tradeoffs: string[];
  display_currency?: {
    code: string;
    symbol: string;
  };
}

// Phase 2: Synthesis & Scoring
export interface SynthesisRequest {
  hard_envelope: {
    budget_ils: number | null;
    budget: number | null;
    currency: string;
    currency_symbol: string;
    duration_nights: { min: number; max: number } | null;
    origin: string;
    date_info: DateInfo;
  };
  scoring_weights: {
    budget_fit: number;
    experience_match: number;
    logistics_ease: number;
  };
  user_context: UserProfile; 
}

export interface DimensionScore {
  score: number; // 0-100
  reason: string;
}

export interface FeasibilityEvaluation {
  overall_score: number;
  dimensions: {
    budget: DimensionScore;
    logistics: DimensionScore;
    experience: DimensionScore;
    constraints: DimensionScore;
  };
  is_valid_hard: boolean; // Does it pass the hard envelope?
}

// Extension of CandidatePlan with computed score
export interface ScoredPlan extends CandidatePlan {
  computed_score: FeasibilityEvaluation;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

export enum AppPhase {
  INTAKE = 'INTAKE',      // Segments A+B
  SYNTHESIS = 'SYNTHESIS', // Segment C
  MATCHING = 'MATCHING',   // Segment D
  EXECUTION = 'EXECUTION',  // Segment E
  FINAL_EXECUTION = 'FINAL_EXECUTION' // Final Immutable View
}

// Guidance Mode for Analyst Chat
export type GuidanceMode = 'quick' | 'guided' | 'deep';

// Auth & Cloud Persistence (Phase 4)
export interface AuthUser {
  id: string;
  email?: string;
}

export interface CloudPlanHeader {
  id: string;
  title: string;
  updated_at: string;
}
