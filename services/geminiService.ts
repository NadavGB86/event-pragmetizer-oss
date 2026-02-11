import { callGemini, getModelForPhase } from './proxyClient';
import { GenerateContentResponse } from "@google/genai";
import { UserProfile, CandidatePlan, ChatMessage, GuidanceMode } from "../types";
import { buildAnalystInstruction, SYSTEM_INSTRUCTION_GENERATOR } from "../constants";
import { getCurrencySymbol } from "../utils/currency";


/** Parsed analyst response with profile update and readiness signal */
interface AnalystParseResult {
  text: string;
  profileUpdate: Partial<UserProfile> | null;
  readyToGenerate: boolean;
  stillNeeded: string[];
}

/**
 * Parses the response text to separate the conversational part from the hidden JSON block.
 * Extracts readiness signal (ready_to_generate, still_needed) from the JSON if present.
 */
function parseAnalystResponse(text: string): AnalystParseResult {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonRegex);

  if (match) {
    try {
      const jsonStr = match[1];
      const parsed = JSON.parse(jsonStr);
      // Remove the JSON block from the message shown to user
      const message = text.replace(jsonRegex, '').trim();
      // Extract readiness fields before passing as profile update
      const readyToGenerate = parsed.ready_to_generate === true;
      const stillNeeded: string[] = Array.isArray(parsed.still_needed) ? parsed.still_needed : [];
      // Remove readiness fields from profile update (they're not part of UserProfile)
      delete parsed.ready_to_generate;
      delete parsed.still_needed;
      return { text: message, profileUpdate: parsed, readyToGenerate, stillNeeded };
    } catch (e) {
      console.error("Failed to parse JSON from LLM response", e);
      return { text: text, profileUpdate: null, readyToGenerate: false, stillNeeded: [] };
    }
  }

  return { text: text, profileUpdate: null, readyToGenerate: false, stillNeeded: [] };
}

export const sendMessageToAnalyst = async (
  history: ChatMessage[],
  currentProfile: UserProfile,
  guidanceMode: GuidanceMode = 'guided'
): Promise<AnalystParseResult> => {

  try {
    const model = getModelForPhase('chat');

    // Construct context-aware prompt
    const chatHistoryText = history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n');
    const profileContext = JSON.stringify(currentProfile);

    const prompt = `
    CURRENT EXTRACTED PROFILE: ${profileContext}

    CONVERSATION HISTORY:
    ${chatHistoryText}

    Respond to the last user message. Remember to append the JSON block if you detect new constraints or goals.
    Include ready_to_generate and still_needed in the JSON block.
    `;

    const response: GenerateContentResponse = await callGemini({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: buildAnalystInstruction(guidanceMode),
        temperature: 0.7,
      },
    });

    const responseText = response.text || "I'm having trouble processing that. Could you repeat?";
    return parseAnalystResponse(responseText);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Connection error. Please check your API key.", profileUpdate: null, readyToGenerate: false, stillNeeded: [] };
  }
};

import { buildSynthesisRequest } from "../utils/requestBuilder";
import { scoreFeasibility } from "../utils/scoring";
import { ScoredPlan } from "../types";

export const generateCandidatePlans = async (profile: UserProfile): Promise<ScoredPlan[]> => {
  try {
    const model = getModelForPhase('generate');

    // 1. Build strict request
    const synthesisRequest = buildSynthesisRequest(profile);

    const prompt = `
    GENERATE PLANS FOR THIS REQUEST:
    ${JSON.stringify(synthesisRequest, null, 2)}
    `;

    // 2. Call LLM
    const response: GenerateContentResponse = await callGemini({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_GENERATOR,
        responseMimeType: "application/json",
        temperature: 0.5, // Lower temperature for adherence
      },
    });

    const jsonStr = response.text || "[]";
    const rawPlans: CandidatePlan[] = JSON.parse(jsonStr);

    // 3. Map currency_code from LLM to display_currency, then score
    const scoredPlans: ScoredPlan[] = rawPlans.map(plan => {
        // LLM outputs currency_code (string), app expects display_currency ({ code, symbol })
        const llmCurrency = (plan as CandidatePlan & { currency_code?: string }).currency_code;
        const currencyCode = llmCurrency || synthesisRequest.hard_envelope.currency;
        const planWithCurrency: CandidatePlan = {
            ...plan,
            display_currency: {
                code: currencyCode,
                symbol: getCurrencySymbol(currencyCode),
            },
        };

        const score = scoreFeasibility(planWithCurrency, synthesisRequest);
        return { ...planWithCurrency, computed_score: score };
    });

    return scoredPlans;

  } catch (error) {
    console.error("Gemini Planning Error:", error);
    return [];
  }
};

// 4. Refinement Logic
const SYSTEM_INSTRUCTION_REFINER = `
You are the "Event Pragmetizer Refiner".
Your goal is to modify an existing travel plan based on a specific user instruction.

INPUT:
1. Current Plan (JSON)
2. User Instruction (String)
3. User Profile (Context)

OUTPUT:
A single valid JSON object representing the *entire* modified plan.
- Maintain the structure of 'CandidatePlan'.
- Update 'total_estimated_budget' if components change.
- Update 'tradeoffs' and 'match_reasoning' to reflect the changes.
- Do NOT hallucinate prices below realistic minimums (e.g. Flight < $100).
`;

export const refinePlan = async (currentPlan: ScoredPlan, instruction: string, profile: UserProfile): Promise<ScoredPlan> => {
  try {
     const model = getModelForPhase('generate');

     // Build request to maintain context
     const request = buildSynthesisRequest(profile);

     const prompt = `
     CURRENT PLAN:
     ${JSON.stringify(currentPlan, null, 2)}

     USER INSTRUCTION:
     "${instruction}"

     USER CONTEXT:
     ${JSON.stringify(profile)}

     Update the plan to address the instruction while maintaining feasibility.
     `;
     
     const response: GenerateContentResponse = await callGemini({
        model: model,
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION_REFINER,
            responseMimeType: "application/json",
            temperature: 0.5,
        }
     });
     
     const text = response.text || "{}";
     const modifiedPlan: CandidatePlan = JSON.parse(text);

     // Important: Re-score the modified plan to see semantic/budget impact
     const newScore = scoreFeasibility(modifiedPlan, request);

     return {
         ...modifiedPlan,
         computed_score: newScore,
         display_currency: currentPlan.display_currency // Preserve currency preference
     };

  } catch (error) {
      console.error("Refinement Error", error);
      throw error;
  }
}