import { step } from './simulator.mjs';

export const BUTTONS = Object.freeze(['up', 'down', 'left', 'right', 'brake', 'none']);

export function validateDecision(value) {
  if (!value || typeof value !== 'object' || !BUTTONS.includes(value.action)) throw new Error('provider returned an unsupported action');
  if (typeof value.reason !== 'string' || !value.reason.trim() || value.reason.length > 300) throw new Error('provider reason must be 1..300 characters');
  const durationMs = value.duration_ms ?? 200;
  if (!Number.isInteger(durationMs) || durationMs < 50 || durationMs > 500) throw new Error('action duration must be 50..500 ms');
  return { action: value.action, reason: value.reason.trim(), duration_ms: durationMs };
}

export function createSimulationProvider() {
  return {
    async decide(observation) {
      if (observation.kind !== 'simulation' || !observation.state) throw new Error('simulation provider needs simulated state');
      const next = step(observation.state);
      const event = next.events.at(-1);
      const action = { north: 'up', south: 'down', west: 'left', east: 'right', pause: 'none' }[event.action];
      return validateDecision({ action, reason: event.decision, duration_ms: 200 });
    },
  };
}

function responseText(data) {
  const content = data?.output?.flatMap(item => item?.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n');
  if (!content) throw new Error('model response contained no output_text');
  return content;
}

export function createVisionProvider({ apiKey = process.env.OPENAI_API_KEY, model = process.env.AFKSIX_MODEL, fetchImpl = fetch, timeoutMs = 20000 } = {}) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required for the vision provider');
  if (!model) throw new Error('AFKSIX_MODEL is required for the vision provider');
  return {
    async decide(observation, context = {}) {
      if (observation.kind !== 'frame' || !observation.frame?.base64 || !['image/jpeg', 'image/png'].includes(observation.frame.mime)) {
        throw new Error('vision provider needs a JPEG or PNG frame from the bridge');
      }
      const memory = (context.memory || []).slice(-5).map(item => `${item.action}: ${item.outcome}`).join('; ');
      const stalled = context.stalled ? 'The view has stayed unchanged after repeated actions. Change approach or choose none.' : '';
      const response = await fetchImpl('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model, store: false, max_output_tokens: 160,
          instructions: 'You control a test game through one short action at a time. Return only JSON with action (up, down, left, right, brake, none), duration_ms (50..500), and reason (one short sentence). Prefer none if the frame is unclear. No markdown.',
          input: [{ role: 'user', content: [
            { type: 'input_text', text: `Explore freely. Recent outcomes: ${memory || 'none'}. ${stalled} Choose the next short action from the current frame.` },
            { type: 'input_image', image_url: `data:${observation.frame.mime};base64,${observation.frame.base64}`, detail: 'low' },
          ] }],
        }),
      });
      if (!response.ok) throw new Error(`model API HTTP ${response.status}`);
      const raw = responseText(await response.json()).trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
      let parsed;
      try { parsed = JSON.parse(raw); } catch { throw new Error('model returned invalid JSON'); }
      return validateDecision(parsed);
    },
  };
}
