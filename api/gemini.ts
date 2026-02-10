const ALLOWED_MODELS = ['gemini-3-flash-preview', 'gemini-3-pro-preview'];
const MAX_BODY_SIZE = 100 * 1024; // 100KB

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // Size check
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: 'Request too large' }), { status: 413, headers: { 'Content-Type': 'application/json' } });
  }

  let body: { model?: string; [key: string]: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { model, ...rest } = body;
  if (!model || !ALLOWED_MODELS.includes(model)) {
    return new Response(JSON.stringify({ error: `Model not allowed. Use: ${ALLOWED_MODELS.join(', ')}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Forward to Gemini REST API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rest),
    });

    const data = await geminiRes.text();
    return new Response(data, {
      status: geminiRes.ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Gemini API request failed' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
