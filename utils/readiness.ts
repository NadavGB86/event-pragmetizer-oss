import { UserProfile } from '../types';

export interface ProfileReadiness {
  isReady: boolean;
  missingCritical: string[];
  missingOptional: string[];
  note?: string;
}

export function assessReadiness(profile: UserProfile): ProfileReadiness {
  const missingCritical: string[] = [];
  const missingOptional: string[] = [];
  
  // Critical Checks
  // 1. Budget
  const hasBudget = profile.needs.constraints.some(c => c.type === 'budget');
  if (!hasBudget) missingCritical.push('Budget');

  // 2. Event Type / Vision (at least one target or declared want or vision)
  const hasVision = 
    profile.goals.targets.length > 0 || 
    profile.goals.declared_wants.length > 0 || 
    profile.goals.visions.length > 0;
  
  if (!hasVision) missingCritical.push('Event Vision / Wants');

  // Optional Checks
  // Participants (still at default = user hasn't mentioned who's coming)
  const isDefaultParticipants =
    profile.needs.participants.adults === 1 &&
    profile.needs.participants.children === 0 &&
    profile.needs.participants.description === "Single Traveler";
  if (isDefaultParticipants) missingOptional.push('Who\'s coming');

  // Dates (check date_info tier, fall back to constraints for legacy)
  const hasDates = profile.date_info?.tier !== 'none' || profile.needs.constraints.some(c => c.type === 'time');
  if (!hasDates) missingOptional.push('Dates');

  // Logistics
  const hasLogistics = profile.needs.constraints.some(c => c.type === 'logistics');
  if (!hasLogistics) missingOptional.push('Logistics');
  
  return {
    isReady: missingCritical.length === 0,
    missingCritical,
    missingOptional,
    note: missingCritical.length === 0 
      ? "Ready to generate base plans." 
      : "We need a bit more info to make plans that fit."
  };
}
