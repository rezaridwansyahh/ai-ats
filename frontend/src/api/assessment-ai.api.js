// SSE consumer for assessment AI narrative generation.
// Mirrors the pattern in `job.api.js#generateJobAI` — raw fetch + ReadableStream
// so we can stream tokens into a Textarea live (typewriter effect).
//
// PII strip is performed HERE (frontend layer) and AGAIN in the backend controller
// (defense in depth). The model never sees candidate name, email, or date of birth.

function stripPII(profile = {}) {
  if (!profile || typeof profile !== 'object') return {};
  const { name, email, date_birth, ...rest } = profile; // eslint-disable-line no-unused-vars
  return rest;
}

async function streamSSE(path, body, onChunk, signal) {
  const token = localStorage.getItem('token');
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const res = await fetch(`${baseURL}/portal/api/assessment-ai/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    let error;
    try {
      error = text ? JSON.parse(text) : { message: `Request failed with status ${res.status}` };
    } catch {
      error = { message: text || `Request failed with status ${res.status}` };
    }
    throw error;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return fullText;
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) {
          fullText += parsed.text;
          onChunk?.(parsed.text, fullText);
        }
      } catch (e) {
        if (e instanceof Error && e.message) throw e;
        // skip malformed json lines silently
      }
    }
  }

  return fullText;
}

export async function streamSectionInterpretation(
  { battery, section, scores, profile },
  onChunk,
  signal,
) {
  return streamSSE(
    'generate-section',
    { battery, section, scores, profile: stripPII(profile) },
    onChunk,
    signal,
  );
}

export async function streamSynthesis(
  { battery, allScores, sectionInterpretations, profile },
  onChunk,
  signal,
) {
  return streamSSE(
    'generate-synthesis',
    {
      battery,
      allScores,
      sectionInterpretations: sectionInterpretations || {},
      profile: stripPII(profile),
    },
    onChunk,
    signal,
  );
}
