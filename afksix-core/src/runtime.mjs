import fs from 'node:fs';
import crypto from 'node:crypto';
import { validateDecision } from './providers.mjs';

function publicObservation(observation) {
  const result = { kind: observation.kind, tick: observation.tick, timestamp: observation.timestamp };
  if (observation.state?.position) result.position = observation.state.position;
  if (observation.frame) {
    const bytes = Buffer.from(observation.frame.base64 || '', 'base64');
    result.frame_sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    result.frame_bytes = bytes.length;
  }
  return result;
}

export async function runAgent({ bridge, provider, steps = 60, tracePath, onEvent = () => {}, signal } = {}) {
  if (!bridge?.observe || !bridge?.act || !provider?.decide) throw new TypeError('bridge and provider are required');
  if (!Number.isInteger(steps) || steps < 1 || steps > 10000) throw new RangeError('steps must be 1..10000');
  const events = [];
  let previousFrameHash = '';
  let unchangedFrames = 0;
  let trace;
  try {
    if (tracePath) trace = fs.openSync(tracePath, 'wx');
    for (let index = 0; index < steps; index++) {
      if (signal?.aborted) break;
      const observation = await bridge.observe();
      if (!Number.isInteger(observation.tick) || !['simulation', 'frame'].includes(observation.kind)) throw new Error('bridge observation is invalid');
      const recordedObservation = publicObservation(observation);
      if (recordedObservation.frame_sha256) {
        unchangedFrames = recordedObservation.frame_sha256 === previousFrameHash ? unchangedFrames + 1 : 0;
        previousFrameHash = recordedObservation.frame_sha256;
        if (unchangedFrames >= 4) throw new Error('frame has not changed for four actions; stopping run');
      }
      const decision = validateDecision(await provider.decide(observation, { memory: events.slice(-5), stalled: unchangedFrames >= 2 }));
      // A failed provider request never sends a control input.
      const result = await bridge.act(decision, observation.tick);
      if (result.ok !== true || !Number.isInteger(result.tick) || result.tick !== observation.tick + 1) throw new Error('bridge action acknowledgement is invalid');
      const event = {
        seq: index + 1, at: new Date().toISOString(),
        observation: recordedObservation,
        decision: decision.reason, action: decision.action, duration_ms: decision.duration_ms,
        outcome: String(result.outcome || '').slice(0, 300),
      };
      events.push(event);
      if (trace !== undefined) fs.writeSync(trace, JSON.stringify(event) + '\n');
      onEvent(event);
    }
    return { steps: events.length, events };
  } finally {
    if (trace !== undefined) fs.closeSync(trace);
  }
}

export function readTrace(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  return lines.map((line, index) => {
    const event = JSON.parse(line);
    if (event.seq !== index + 1 || !event.observation || !event.action) throw new Error(`invalid trace event ${index + 1}`);
    return event;
  });
}
