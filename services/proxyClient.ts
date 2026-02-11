import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { LITE_MODEL_NAME, MODEL_NAME, PRO_MODEL_NAME } from '../constants';

const KEY_STORAGE = 'ep_gemini_api_key';
const MODE_STORAGE = 'ep_usage_mode';

export type UsageMode = 'lite' | 'standard' | 'pro';

// Build-time API key (local dev via .env.local)
const buildTimeKey = process.env.API_KEY;

/** Get the user's BYOK key from localStorage */
export function getUserApiKey(): string {
  try { return localStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; }
}

/** Save or clear the user's BYOK key */
export function setUserApiKey(key: string): void {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch { /* localStorage unavailable */ }
}

/** True if any Gemini access method is available */
export function hasGeminiAccess(): boolean {
  return !!(getUserApiKey() || buildTimeKey);
}

/** Get the current usage mode (defaults to 'lite'). Migrates legacy 'free'/'full' values. */
export function getUserUsageMode(): UsageMode {
  try {
    const raw = localStorage.getItem(MODE_STORAGE);
    // Migrate legacy values
    if (raw === 'free') {
      localStorage.setItem(MODE_STORAGE, 'standard');
      return 'standard';
    }
    if (raw === 'full') {
      localStorage.setItem(MODE_STORAGE, 'pro');
      return 'pro';
    }
    if (raw === 'lite' || raw === 'standard' || raw === 'pro') return raw;
    return 'lite';
  } catch { return 'lite'; }
}

/** Set the usage mode */
export function setUserUsageMode(mode: UsageMode): void {
  try { localStorage.setItem(MODE_STORAGE, mode); } catch { /* localStorage unavailable */ }
}

/**
 * Returns the appropriate model for a given phase and usage mode.
 * Lite: Flash Lite for everything. Standard: Flash for everything. Pro: Flash for chat, Pro for plans + judges.
 */
export function getModelForPhase(phase: 'chat' | 'generate' | 'judge', mode?: UsageMode): string {
  const m = mode ?? getUserUsageMode();
  if (m === 'lite') return LITE_MODEL_NAME;
  if (m === 'standard') return MODEL_NAME;
  // Pro mode: Pro for generation and judging, Flash for chat
  return phase === 'chat' ? MODEL_NAME : PRO_MODEL_NAME;
}

// SDK client for build-time key (local dev)
const buildTimeAi = buildTimeKey ? new GoogleGenAI({ apiKey: buildTimeKey }) : null;

/** Parameters accepted by callGemini — mirrors the SDK's generateContent config */
export interface GeminiCallParams {
  model: string;
  contents: string;
  config?: {
    systemInstruction?: string;
    responseMimeType?: string;
    temperature?: number;
    tools?: Array<{ googleSearch: Record<string, never> }>;
  };
}

/**
 * Unified Gemini caller. Priority: BYOK key > build-time key > error.
 */
export async function callGemini(params: GeminiCallParams): Promise<GenerateContentResponse> {
  // 1. BYOK — user's own key (stored in localStorage)
  const userKey = getUserApiKey();
  if (userKey) {
    const userAi = new GoogleGenAI({ apiKey: userKey });
    return userAi.models.generateContent({
      model: params.model,
      contents: params.contents,
      config: params.config,
    });
  }

  // 2. Build-time key (local dev with .env.local)
  if (buildTimeAi) {
    return buildTimeAi.models.generateContent({
      model: params.model,
      contents: params.contents,
      config: params.config,
    });
  }

  throw new Error('Gemini API key not configured');
}
