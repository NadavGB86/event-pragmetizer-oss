import { AppPhase, ChatMessage, UserProfile, ScoredPlan, CandidatePlan } from '../types';

export interface AppState {
  version: number;
  timestamp: number;
  data: {
    phase: AppPhase;
    messages: ChatMessage[];
    userProfile: UserProfile;
    generatedPlans: ScoredPlan[];
    selectedPlan: CandidatePlan | null;
  };
}

const CURRENT_VERSION = 1;

export const exportState = (
  phase: AppPhase,
  messages: ChatMessage[],
  userProfile: UserProfile,
  generatedPlans: ScoredPlan[],
  selectedPlan: CandidatePlan | null
) => {
  const state: AppState = {
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    data: {
      phase,
      messages,
      userProfile,
      generatedPlans,
      selectedPlan
    }
  };

  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-pragmetizer-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const validateAndParseState = async (file: File): Promise<AppState['data']> => {
  const text = await file.text();
  const json = JSON.parse(text);

  // Basic Validation
  if (!json.version || !json.data) {
    throw new Error("Invalid file format: Missing version or data fields.");
  }

  // Deep verification could go here (zod/ajv), for now we check keys
  const requiredKeys = ['phase', 'messages', 'userProfile'];
  const missing = requiredKeys.filter(k => !(k in json.data));
  if (missing.length > 0) {
    throw new Error(`Invalid state: Missing ${missing.join(', ')}`);
  }

  return json.data;
};
