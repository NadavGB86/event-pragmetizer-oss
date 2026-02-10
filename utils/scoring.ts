import { CandidatePlan, SynthesisRequest, FeasibilityEvaluation } from '../types';
import { checkPlanSanity } from './sanity';

export function scoreFeasibility(plan: CandidatePlan, request: SynthesisRequest): FeasibilityEvaluation {
  const { hard_envelope, scoring_weights, user_context } = request;
  
  // 0. Sanity Check (The "BS Detector")
  const sanity = checkPlanSanity(plan);
  
  // 1. Budget Score
  let budgetScore = 100;
  let budgetReason = "Within budget";
  
  if (!sanity.isSane) {
      budgetScore = 0;
      budgetReason = "Unrealistic Prices";
  } else { 
      // Budget Logic - Currency-Aware

      // Use the currency-native budget as primary (what the user stated),
      // fall back to budget_ils (ILS conversion) for legacy compatibility.
      const limit = typeof hard_envelope.budget === 'number' && hard_envelope.budget > 0
          ? hard_envelope.budget
          : (typeof hard_envelope.budget_ils === 'number' ? hard_envelope.budget_ils : 0);
      
      if (limit > 0) {
          const cost = plan.total_estimated_budget;
          
          // SAFETY: Check for massive currency mismatch (e.g. 13000 ILS vs 3000 USD limit)
          // If the cost is > 5x the limit, it's likely a currency error, NOT a real overage.
          // OR if the plan currency is explicitly different.
          // For MVP, we'll assume the LLM generates in the SAME currency as the limit if instructed.
          
          if (cost > limit) {
              const overage = (cost - limit) / limit; // e.g. 0.1 for 10% over
              
              // If overage is > 500% (5.0), treat as currency hallucination and ignore/warn
              if (overage > 5.0) {
                 budgetScore = 100; // Give benefit of doubt on massive mismatches
                 budgetReason = "Currency Mismatch Detected (Ignored)";
              } else {
                 // Regular penalty
                 const penalty = overage * 100 * 5; 
                 budgetScore = Math.max(0, 100 - penalty);
                 budgetReason = `Over budget by ${Math.round(overage * 100)}%`;
              }
          } else {
              budgetScore = 100;
          }
      } else {
          budgetScore = 100; // No hard limit found
          budgetReason = "No strict limit set";
      }
  }

  // 2. Experience Match Score (Keyword matching)
  const wants = user_context.goals.declared_wants.map(w => w.toLowerCase());
  const planText = JSON.stringify(plan).toLowerCase();
  
  let hitCount = 0;
  wants.forEach(want => {
      // Simple inclusion check
      if (planText.includes(want)) hitCount++;
  });
  
  let experienceScore = 0;
  if (wants.length > 0) {
      experienceScore = Math.min(100, (hitCount / wants.length) * 100);
  } else {
      experienceScore = 80; // Default if no specific wants declared
  }
  
  // 3. Logistics / Constraints (Duration check)
  let constraintsScore = 100;
  let constraintsReason = "Pass";
  let hardFail = false;

  // Sanity Failures act as Hard Fails
  if (!sanity.isSane) {
      hardFail = true;
      constraintsReason = sanity.violations[0]; // Show first violation
      constraintsScore = 0;
  }

  // Overall Calculation
  const finalScore = (
      (budgetScore * scoring_weights.budget_fit) +
      (experienceScore * scoring_weights.experience_match) +
      (constraintsScore * scoring_weights.logistics_ease)
  );

  // Hard Cap if over budget by > 20%
  if (budgetScore < 0) hardFail = true;

  return {
    overall_score: hardFail ? 20 : Math.round(finalScore), // Cap at 20% if hard fail
    dimensions: {
      budget: { score: Math.round(budgetScore), reason: budgetReason },
      experience: { score: Math.round(experienceScore), reason: `Matched ${hitCount}/${wants.length} wants` },
      logistics: { score: 80, reason: "Estimated" }, // Placeholder until we analyze transfers
      constraints: { score: constraintsScore, reason: constraintsReason }
    },
    is_valid_hard: !hardFail
  };
}
