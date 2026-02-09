import { CandidatePlan } from '../types';

interface SanityThreshold {
  minCost: number; // in USD (base currency for thresholds)
  name: string;
}

// Thresholds in USD — converted at check time based on plan currency.
const THRESHOLDS: Record<string, SanityThreshold> = {
  flight: { minCost: 150, name: "Flight" },
  accommodation: { minCost: 40, name: "Accommodation (per night)" },
  dining: { minCost: 8, name: "Meal" },
  activity: { minCost: 0, name: "Activity" }
};

// Approximate USD-to-X rates for threshold conversion
const USD_RATES: Record<string, number> = {
  USD: 1,
  ILS: 3.8,
  EUR: 0.92,
  GBP: 0.79,
  NIS: 3.8,
};

function getThresholdInCurrency(usdAmount: number, currencyCode: string): number {
  const rate = USD_RATES[currencyCode.toUpperCase()] || 1;
  return Math.round(usdAmount * rate);
}

export interface SanityResult {
  isSane: boolean;
  violations: string[];
}

export function checkPlanSanity(plan: CandidatePlan): SanityResult {
  const violations: string[] = [];
  const currency = plan.display_currency?.code || 'USD';

  // Check individual components
  plan.components.forEach(comp => {
    const type = comp.type.toLowerCase();

    // Improved flight detection
    const isFlight =
        type === 'flight' ||
        (type === 'transport' && /flight|fly|air|plane|tlv|ben gurion|airport/i.test(comp.title)) ||
        comp.title.toLowerCase().includes('flight');

    // Check Flight Cost
    if (isFlight) {
        const minFlight = getThresholdInCurrency(THRESHOLDS.flight.minCost, currency);
        if (comp.cost_estimate < minFlight) {
            violations.push(`Flight cost (${comp.cost_estimate} ${currency}) is suspiciously low (min ~${minFlight} ${currency})`);
        }
    }

    // Check Accommodation
    if (type === 'accommodation' || /hotel|hostel|airbnb|stay/i.test(comp.title)) {
        const minAccom = getThresholdInCurrency(THRESHOLDS.accommodation.minCost, currency);
        if (comp.cost_estimate < minAccom) {
             violations.push(`Accommodation (${comp.cost_estimate} ${currency}) is suspicious (min ~${minAccom} ${currency})`);
        }
    }
  });

  // Global Check: Total Budget Sanity
  const hasFlight = plan.components.some(c =>
    c.type.toLowerCase() === 'flight' ||
    /flight|fly|air|plane/i.test(c.title)
  );

  const minTripTotal = getThresholdInCurrency(200, currency);
  if (hasFlight && plan.total_estimated_budget < minTripTotal) {
      violations.push(`Total budget (${plan.total_estimated_budget} ${currency}) is impossible for a trip with flights.`);
  }

  return {
    isSane: violations.length === 0,
    violations
  };
}
