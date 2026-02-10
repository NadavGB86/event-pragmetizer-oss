import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ScoredPlan, UserProfile, JudgeVerdict, SoftJudgeVerdict } from "../types";
import { PRO_MODEL_NAME } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_JUDGE = `
You are the "Event Pragmetizer Gatekeeper".
Your authority is absolute. You must EVALUATE a proposed travel plan against a user's constraints.

ROLE:
You are a strict, no-nonsense manager. You do not generate plans. You JUDGE them.
You protect the user from bad plans (over budget, impossible logistics, hallucinated prices).
You MUST USE Google Search to verify that named hotels, venues, and restaurants actually exist.

INPUT:
1. Candidate Plan (JSON)
2. User Profile (Context)

OUTPUT:
A JSON object with:
- "pass": boolean (true only if NO fatal flaws)
- "score": number (0-100 quality score)
- "reasoning": string (Short, punchy explanation of the verdict. If fail, list the specific fatal flaw).
- "feedback": string[] (List of specific actionable fixes if failed).
- "grounding_notes": string[] (Facts you verified via search, e.g. "Hotel Napa Mermaid exists in Ayia Napa, Cyprus, rated 4-star")

CRITERIA FOR FAILURE (FATAL FLAWS) -> RESULT "pass": false:
- Budget exceeds limit by > 10% (unless explicitly soft).
- Flight prices are unrealistically low (e.g. < $100 for international).
- Location mismatch (Plan is for London, User asked for Paris).
- Missing critical "Must-Have" constraints (e.g., Dates are wrong).
- Quality mismatch: Accommodation quality does NOT match user's profiled standards
  (e.g., user wants "Boutique hotels" but plan suggests a hostel or budget Airbnb).
- Vague/unverifiable components: Plan items use generic names that cannot be searched
  or booked (e.g., "Nice Hotel" instead of a specific property name).
- Hallucinated venue: You searched and the hotel/restaurant does NOT exist. This is a fatal flaw.

CRITERIA FOR WARNING (NON-FATAL) -> RESULT "pass": true (but with feedback):
- Timeline mismatch of 1-2 days if it seems beneficial.
- Slightly over budget (<10%).
- Missing a "Nice-to-have".
- Component specificity: Items that are real but could be more specific.
- Quality borderline: Accommodation meets minimum standards but could be higher.
- Price mismatch > 50% from search results (warn but don't block).

Guidance: If a constraint is violated but the plan is otherwise excellent, prefer to PASS with strong FEEDBACK warnings rather than blocking smoothly.
`;

const SYSTEM_INSTRUCTION_SOFT_JUDGE = `
You are the "Event Pragmetizer Advisor".
You provide ADVISORY feedback on a travel plan — you do NOT block it.
Your job is to help the user improve their plan through actionable suggestions.
You MUST USE Google Search to verify that named hotels, venues, and restaurants actually exist and check approximate prices.

INPUT:
1. Candidate Plan (JSON)
2. User Profile (Context)

OUTPUT:
A JSON object with:
- "score": number (0-100 quality/realism score)
- "summary": string (2-3 sentence assessment of the plan)
- "suggestions": string[] (3-5 actionable refinement commands the user can apply, phrased as imperative instructions like "Replace X with Y", "Add spa treatment on Day 2", "Upgrade hotel to 5-star within budget")
- "date_alignment": string | null (assessment of date/seasonal fit, or null if no dates)
- "grounding_notes": string[] (Facts you verified via search, e.g. "Confirmed: Hotel Napa Mermaid is a 3-star hotel in Ayia Napa starting at ~€80/night")

Be specific. Reference actual component titles. Make suggestions copy-pasteable as refinement instructions.
`;

/**
 * Extract grounding metadata from the Gemini response.
 * The search grounding info lives in response.candidates[0].groundingMetadata.
 */
interface GroundingChunk {
  web?: { title?: string };
  segment?: { text?: string };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingChunk[];
}

interface CandidateWithGrounding {
  groundingMetadata?: GroundingMetadata;
}

function extractGroundingNotes(response: GenerateContentResponse): string[] {
  try {
    const candidates = (response as unknown as { candidates?: CandidateWithGrounding[] }).candidates;
    if (!candidates?.[0]?.groundingMetadata) return [];
    const metadata = candidates[0].groundingMetadata;
    const chunks = metadata.groundingChunks || metadata.groundingSupports || [];
    return chunks
      .map((c: GroundingChunk) => c.web?.title || c.segment?.text || '')
      .filter((s: string) => s.length > 0)
      .slice(0, 5);
  } catch { /* grounding metadata unavailable */ }
  return [];
}

/**
 * Safely parse JSON from a response that may contain markdown fencing.
 */
function safeParseJson<T>(text: string): T {
  // Try direct parse first
  try { return JSON.parse(text); } catch { /* not plain JSON, try fenced */ }
  // Try stripping markdown code fences
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    return JSON.parse(match[1]);
  }
  // Last resort: find first { to last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    return JSON.parse(text.substring(start, end + 1));
  }
  throw new Error('Could not parse JSON from response');
}

export const evaluatePlan = async (plan: ScoredPlan, profile: UserProfile): Promise<JudgeVerdict> => {
   try {
     const model = PRO_MODEL_NAME;

     const prompt = `
     EVALUATE THIS PLAN:
     ${JSON.stringify(plan, null, 2)}

     AGAINST THIS PROFILE:
     ${JSON.stringify(profile, null, 2)}
     `;

     // Try with grounding first (responseMimeType may conflict with tools)
     let response: GenerateContentResponse;
     let usedGrounding = false;
     try {
       response = await ai.models.generateContent({
         model: model,
         contents: prompt,
         config: {
           systemInstruction: SYSTEM_INSTRUCTION_JUDGE,
           tools: [{ googleSearch: {} }],
           temperature: 0.1,
         }
       });
       usedGrounding = true;
     } catch {
       // Fallback: no grounding, use JSON mode
       response = await ai.models.generateContent({
         model: model,
         contents: prompt,
         config: {
           systemInstruction: SYSTEM_INSTRUCTION_JUDGE,
           responseMimeType: "application/json",
           temperature: 0.1,
         }
       });
     }

     const text = response.text || "{}";
     const verdict: JudgeVerdict = safeParseJson(text);

     // Merge grounding notes from API metadata + LLM-returned notes
     if (usedGrounding) {
       const apiNotes = extractGroundingNotes(response);
       verdict.grounding_notes = [
         ...(verdict.grounding_notes || []),
         ...apiNotes,
       ];
     }

     return verdict;

   } catch (error) {
       console.error("Judge Error", error);
       return {
           pass: false,
           score: 0,
           reasoning: "System Error: The Judge could not be reached. Please try again.",
           feedback: ["Check internet connection", "Retry submission"]
       };
   }
};

/**
 * Soft (advisory) judge — non-blocking, runs asynchronously.
 * Uses Google Search grounding to verify venues and prices.
 */
export const softEvaluatePlan = async (plan: ScoredPlan, profile: UserProfile): Promise<SoftJudgeVerdict> => {
  try {
    const model = PRO_MODEL_NAME;

    const prompt = `
    REVIEW THIS PLAN (ADVISORY):
    ${JSON.stringify(plan, null, 2)}

    USER PROFILE:
    ${JSON.stringify(profile, null, 2)}
    `;

    let response: GenerateContentResponse;
    try {
      response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_SOFT_JUDGE,
          tools: [{ googleSearch: {} }],
          temperature: 0.3,
        }
      });
    } catch {
      // Fallback: no grounding
      response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_SOFT_JUDGE,
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });
    }

    const text = response.text || "{}";
    const verdict: SoftJudgeVerdict = safeParseJson(text);

    // Merge API grounding metadata
    const apiNotes = extractGroundingNotes(response);
    verdict.grounding_notes = [
      ...(verdict.grounding_notes || []),
      ...apiNotes,
    ];

    return verdict;

  } catch (error) {
    console.error("Soft Judge Error", error);
    return {
      score: 50,
      summary: "Could not complete advisory review. Plan may still be valid.",
      suggestions: [],
      grounding_notes: [],
    };
  }
};
