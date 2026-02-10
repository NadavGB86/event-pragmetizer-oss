import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";

/** True when running on Vercel with the edge proxy */
export const useProxy: boolean = import.meta.env.VITE_USE_PROXY === 'true';

// SDK client — only initialized when we have a local API key
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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
 * The SDK response has a `.text` getter that returns the first candidate's text.
 * We replicate that plus preserve the full `candidates` array for grounding metadata.
 */
function fromRestResponse(json: Record<string, unknown>): GenerateContentResponse {
  // The raw REST response has: { candidates: [{ content: { parts: [{ text: "..." }] }, groundingMetadata: {...} }] }
  const candidates = (json.candidates as Array<Record<string, unknown>>) || [];
  const firstCandidate = candidates[0] as Record<string, unknown> | undefined;
  const content = firstCandidate?.content as { parts?: Array<{ text?: string }> } | undefined;
  const text = content?.parts?.[0]?.text || '';

  // Return an object that mimics GenerateContentResponse
  // The SDK's .text property is a getter, we attach it directly
  return {
    text,
    candidates,
  } as unknown as GenerateContentResponse;
}

/**
 * Unified Gemini caller. Uses SDK locally, proxy in production.
 */
export async function callGemini(params: GeminiCallParams): Promise<GenerateContentResponse> {
  if (!useProxy) {
    // SDK mode — direct call
    if (!ai) throw new Error('Gemini API key not configured');
    return ai.models.generateContent({
      model: params.model,
      contents: params.contents,
      config: params.config,
    });
  }

  // Proxy mode — REST via edge function
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
