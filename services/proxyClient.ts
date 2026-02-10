import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";

const STORAGE_KEY = 'ep_gemini_api_key';

/** True when running on Vercel with the serverless proxy */
export const useProxy: boolean = import.meta.env.VITE_USE_PROXY === 'true';

// Build-time API key (local dev via .env.local)
const buildTimeKey = process.env.API_KEY;

/** Get the user's BYOK key from localStorage */
export function getUserApiKey(): string {
  try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

/** Save or clear the user's BYOK key */
export function setUserApiKey(key: string): void {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* localStorage unavailable */ }
}

/** True if any Gemini access method is available */
export function hasGeminiAccess(): boolean {
  return !!(getUserApiKey() || buildTimeKey || useProxy);
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
 * Transform SDK-style params into Gemini REST API body format.
 */
function toRestBody(params: GeminiCallParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: params.contents }] }],
  };

  if (params.config?.systemInstruction) {
    body.systemInstruction = { parts: [{ text: params.config.systemInstruction }] };
  }

  const genConfig: Record<string, unknown> = {};
  if (params.config?.temperature !== undefined) {
    genConfig.temperature = params.config.temperature;
  }
  if (params.config?.responseMimeType) {
    genConfig.responseMimeType = params.config.responseMimeType;
  }
  if (Object.keys(genConfig).length > 0) {
    body.generationConfig = genConfig;
  }

  if (params.config?.tools) {
    body.tools = params.config.tools;
  }

  return body;
}

/**
 * Normalize a raw Gemini REST JSON response into an SDK-compatible shape.
 */
function fromRestResponse(json: Record<string, unknown>): GenerateContentResponse {
  const candidates = (json.candidates as Array<Record<string, unknown>>) || [];
  const firstCandidate = candidates[0] as Record<string, unknown> | undefined;
  const content = firstCandidate?.content as { parts?: Array<{ text?: string }> } | undefined;
  const text = content?.parts?.[0]?.text || '';

  return {
    text,
    candidates,
  } as unknown as GenerateContentResponse;
}

/**
 * Unified Gemini caller. Priority: BYOK key > build-time key > proxy.
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

  // 3. Proxy mode (Vercel serverless function)
  if (useProxy) {
    const body = toRestBody(params);
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: params.model, ...body }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Proxy request failed' }));
      throw new Error((err as { error?: string }).error || `Proxy error: ${res.status}`);
    }

    const json = await res.json();
    return fromRestResponse(json as Record<string, unknown>);
  }

  throw new Error('Gemini API key not configured');
}
