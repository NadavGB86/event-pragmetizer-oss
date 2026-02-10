import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure API key is set before proxyClient module loads (CI has no .env.local)
process.env.API_KEY = 'test-key-for-ci';

// Mock the GoogleGenAI SDK before any imports
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = { generateContent: mockGenerateContent };
    },
  };
});

describe('proxyClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGenerateContent.mockReset();
  });

  // --- SDK mode (default, no VITE_USE_PROXY) ---
  describe('SDK mode (default)', () => {
    it('calls GoogleGenAI generateContent with correct params', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Hello world',
        candidates: [],
      });

      const { callGemini } = await import('./proxyClient');

      const result = await callGemini({
        model: 'gemini-3-flash-preview',
        contents: 'Test prompt',
        config: { temperature: 0.7 },
      });

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-3-flash-preview',
        contents: 'Test prompt',
        config: { temperature: 0.7 },
      });
      expect(result.text).toBe('Hello world');
    });

    it('passes systemInstruction through config', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'response', candidates: [] });
      const { callGemini } = await import('./proxyClient');

      await callGemini({
        model: 'gemini-3-pro-preview',
        contents: 'prompt',
        config: { systemInstruction: 'You are a judge', temperature: 0.1 },
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            systemInstruction: 'You are a judge',
            temperature: 0.1,
          }),
        }),
      );
    });

    it('passes tools through config for grounding', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'grounded', candidates: [] });
      const { callGemini } = await import('./proxyClient');

      await callGemini({
        model: 'gemini-3-pro-preview',
        contents: 'evaluate plan',
        config: { tools: [{ googleSearch: {} }], temperature: 0.1 },
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            tools: [{ googleSearch: {} }],
          }),
        }),
      );
    });

    it('passes responseMimeType for JSON mode', async () => {
      mockGenerateContent.mockResolvedValue({ text: '[]', candidates: [] });
      const { callGemini } = await import('./proxyClient');

      await callGemini({
        model: 'gemini-3-pro-preview',
        contents: 'generate plans',
        config: { responseMimeType: 'application/json', temperature: 0.5 },
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseMimeType: 'application/json',
          }),
        }),
      );
    });

    it('handles config with multiple options combined', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{}', candidates: [] });
      const { callGemini } = await import('./proxyClient');

      await callGemini({
        model: 'gemini-3-pro-preview',
        contents: 'multi-config test',
        config: {
          systemInstruction: 'Be concise',
          responseMimeType: 'application/json',
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
        },
      });

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-3-pro-preview',
        contents: 'multi-config test',
        config: {
          systemInstruction: 'Be concise',
          responseMimeType: 'application/json',
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
        },
      });
    });

    it('works without config (bare call)', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'bare', candidates: [] });
      const { callGemini } = await import('./proxyClient');

      await callGemini({
        model: 'gemini-3-flash-preview',
        contents: 'simple prompt',
      });

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-3-flash-preview',
        contents: 'simple prompt',
        config: undefined,
      });
    });

    it('preserves candidates array from response', async () => {
      const candidatesData = [
        {
          content: { parts: [{ text: 'plan details' }] },
          groundingMetadata: { searchEntryPoint: { renderedContent: '<div>sources</div>' } },
        },
      ];
      mockGenerateContent.mockResolvedValue({
        text: 'plan details',
        candidates: candidatesData,
      });
      const { callGemini } = await import('./proxyClient');

      const result = await callGemini({
        model: 'gemini-3-pro-preview',
        contents: 'evaluate',
        config: { tools: [{ googleSearch: {} }] },
      });

      expect(result.candidates).toEqual(candidatesData);
    });
  });

  // --- useProxy flag ---
  describe('useProxy flag', () => {
    it('is false by default (no VITE_USE_PROXY set)', async () => {
      const { useProxy } = await import('./proxyClient');
      expect(useProxy).toBe(false);
    });
  });

  // --- BYOK (Bring Your Own Key) ---
  describe('BYOK helpers', () => {
    let store: Record<string, string>;

    beforeEach(() => {
      store = {};
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, val: string) => { store[key] = val; },
        removeItem: (key: string) => { delete store[key]; },
      });
    });

    it('getUserApiKey returns empty when no key stored', async () => {
      const { getUserApiKey } = await import('./proxyClient');
      expect(getUserApiKey()).toBe('');
    });

    it('setUserApiKey stores and getUserApiKey retrieves the key', async () => {
      const { getUserApiKey, setUserApiKey } = await import('./proxyClient');
      setUserApiKey('AIzaSy-test-key');
      expect(getUserApiKey()).toBe('AIzaSy-test-key');
    });

    it('setUserApiKey with empty string removes the key', async () => {
      const { getUserApiKey, setUserApiKey } = await import('./proxyClient');
      setUserApiKey('some-key');
      setUserApiKey('');
      expect(getUserApiKey()).toBe('');
    });

    it('hasGeminiAccess returns true when BYOK key is set', async () => {
      const { hasGeminiAccess, setUserApiKey } = await import('./proxyClient');
      setUserApiKey('AIzaSy-test-key');
      expect(hasGeminiAccess()).toBe(true);
    });

    it('hasGeminiAccess returns true when build-time key exists', async () => {
      const { hasGeminiAccess } = await import('./proxyClient');
      // process.env.API_KEY is set at top of file
      expect(hasGeminiAccess()).toBe(true);
    });
  });

  // Note: Proxy mode (fetch-based) tests require VITE_USE_PROXY=true at module load time.
  // Since this is a compile-time env var, proxy mode is best tested via integration/E2E
  // tests against a running Vercel deployment. The SDK pass-through tests above verify
  // the most important behavior — that callGemini correctly delegates to the SDK.
});
