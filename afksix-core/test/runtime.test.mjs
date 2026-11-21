import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BridgeClient } from '../src/bridge.mjs';
import { createSimulationProvider, createVisionProvider } from '../src/providers.mjs';
import { readTrace, runAgent } from '../src/runtime.mjs';
import { createMockBridge } from '../examples/mock-bridge.mjs';

async function withBridge(callback) {
  const { server, getRun } = createMockBridge();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { return await callback(new BridgeClient(`http://127.0.0.1:${server.address().port}`), getRun); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('the complete bridge loop records and replays 40 real HTTP steps', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'afksix-'));
  const trace = path.join(directory, 'run.jsonl');
  try {
    await withBridge(async (bridge, getRun) => {
      assert.equal((await bridge.health()).adapter, 'simulation');
      const result = await runAgent({ bridge, provider: createSimulationProvider(), steps: 40, tracePath: trace });
      assert.equal(result.steps, 40);
      assert.equal(getRun().tick, 40);
      assert.ok(getRun().landmarks.length >= 3);
      assert.deepEqual(readTrace(fs.readFileSync(trace, 'utf8')), result.events);
      assert.ok(result.events.every(event => event.observation.tick === event.seq - 1));
    });
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('stale observations are rejected and invalid provider actions never reach the bridge', async () => {
  await withBridge(async bridge => {
    const observation = await bridge.observe();
    await assert.rejects(() => bridge.act({ action: 'up' }, observation.tick + 1), /409/);
    const provider = { decide: async () => ({ action: 'teleport', reason: 'invalid' }) };
    await assert.rejects(() => runAgent({ bridge, provider, steps: 1 }), /unsupported action/);
    assert.equal((await bridge.observe()).tick, 0);
  });
});

test('vision provider sends a frame and accepts only bounded structured actions', async () => {
  let request;
  const fetchImpl = async (url, init) => {
    request = { url, init };
    return { ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: '{"action":"left","duration_ms":120,"reason":"Avoid the obstacle"}' }] }] }) };
  };
  const provider = createVisionProvider({ apiKey: 'test-key', model: 'test-model', fetchImpl });
  const action = await provider.decide({ kind: 'frame', frame: { mime: 'image/png', base64: 'aGVsbG8=' } });
  assert.equal(action.action, 'left');
  assert.equal(action.duration_ms, 120);
  const body = JSON.parse(request.init.body);
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(body.store, false);
  assert.equal(body.input[0].content[1].type, 'input_image');
  assert.ok(body.input[0].content[1].image_url.startsWith('data:image/png;base64,'));
});

test('bridge URL stays on loopback and bad model responses fail closed', async () => {
  assert.throws(() => new BridgeClient('https://example.com'), /loopback/);
  const provider = createVisionProvider({ apiKey: 'test-key', model: 'test-model', fetchImpl: async () => ({ ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: '{"action":"fly","reason":"bad"}' }] }] }) }) });
  await assert.rejects(() => provider.decide({ kind: 'frame', frame: { mime: 'image/jpeg', base64: 'aGVsbG8=' } }), /unsupported action/);
});

test('unchanged frames stop the runner before a fifth repeated action', async () => {
  let tick = 0;
  const bridge = {
    observe: async () => ({ kind: 'frame', tick, timestamp: new Date().toISOString(), frame: { mime: 'image/png', base64: 'aGVsbG8=' } }),
    act: async () => ({ ok: true, tick: ++tick, outcome: 'input delivered' }),
  };
  const provider = { decide: async () => ({ action: 'up', reason: 'Advance', duration_ms: 100 }) };
  await assert.rejects(() => runAgent({ bridge, provider, steps: 10 }), /frame has not changed/);
  assert.equal(tick, 4);
});
