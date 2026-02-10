import { UserProfile, SynthesisRequest, DateInfo } from '../types';

// Helper types
type BudgetInfo = {
    amount: number;
    currency: string;
    symbol: string;
    amountInILS: number; // For sanity checks that use ILS baselines
};

/**
 * Extracts budget amount and currency. Defaults to USD if ambiguous.
 */
function extractBudgetInfo(constraints: { type: string; value: string | number }[]): BudgetInfo | null {
  const budgetConstraint = constraints.find(c => c.type === 'budget');
  if (!budgetConstraint) return null;

  const val = budgetConstraint.value.toString().toLowerCase();
  
  // Regex extracting amount
  const match = val.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/);
  if (!match) return null;
  
  const rawAmount = parseFloat(match[1].replace(/,/g, ''));
  
  let currency = "USD";
  let symbol = "$";
  let rateToILS = 3.8;

  if (val.includes('eur') || val.includes('€') || val.includes('euro')) {
    currency = "EUR";
    symbol = "€";
    rateToILS = 4.0;
  } else if (val.includes('ils') || val.includes('₪') || val.includes('shekel') || val.includes('nis')) {
    currency = "ILS";
    symbol = "₪";
    rateToILS = 1.0;
  } else if (val.includes('gbp') || val.includes('£') || val.includes('pound')) {
      currency = "GBP";
      symbol = "£";
      rateToILS = 4.8;
  }
  // Default is USD (already set)

  return {
      amount: rawAmount,
      currency,
      symbol,
      amountInILS: rawAmount * rateToILS
  };
}

/**
 * Extracts duration range from constraints like "3 nights" or "2-4 days".
 */
function extractDuration(constraints: { type: string; value: string | number }[]): { min: number; max: number } | null {
  const timeConstraint = constraints.find(c => c.type === 'time');
  if (!timeConstraint) return null;

  const val = timeConstraint.value.toString().toLowerCase();
  const nums = val.match(/\d+/g)?.map(Number);

  if (!nums || nums.length === 0) return null;

  if (nums.length === 1) {
    return { min: nums[0], max: nums[0] };
  }
  
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

/**
 * Computes duration_nights from exact date_info, if available.
 */
function computeDurationFromDates(dateInfo: DateInfo): { min: number; max: number } | null {
  if (dateInfo.tier === 'exact' && dateInfo.start_date && dateInfo.end_date) {
    const start = new Date(dateInfo.start_date);
    const end = new Date(dateInfo.end_date);
    const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (nights > 0) return { min: nights, max: nights };
  }
  return null;
}

export function buildSynthesisRequest(profile: UserProfile): SynthesisRequest {
  const budgetInfo = extractBudgetInfo(profile.needs.constraints);
  const dateInfo: DateInfo = profile.date_info || { tier: 'none' };

  // Exact dates override text-parsed duration
  const durationFromDates = computeDurationFromDates(dateInfo);
  const duration = durationFromDates || extractDuration(profile.needs.constraints);

  // Default weights
  const weights = {
    budget_fit: 0.4,
    experience_match: 0.4,
    logistics_ease: 0.2
  };

  if (profile.needs.traits.some(t => t.toLowerCase().includes('stress') || t.toLowerCase().includes('logistics'))) {
      weights.logistics_ease = 0.4;
      weights.experience_match = 0.2;
  }

  return {
    hard_envelope: {
      budget_ils: budgetInfo ? budgetInfo.amountInILS : null, // Keep for legacy
      budget: budgetInfo ? budgetInfo.amount : null,
      currency: budgetInfo ? budgetInfo.currency : "USD",
      currency_symbol: budgetInfo ? budgetInfo.symbol : "$",
      duration_nights: duration,
      origin: "TLV",
      date_info: dateInfo,
    },
    scoring_weights: weights,
    user_context: profile
  };
}
