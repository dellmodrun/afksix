import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRun, step } from '../src/simulator.mjs';

const actionMap = { north: 'up', south: 'down', west: 'left', east: 'right', pause: 'none' };
async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 4096) throw new Error('body too large');
  }
  return JSON.parse(body || '{}');
}

export function createMockBridge({ seed = 6 } = {}) {
  let run = createRun(seed);
  const server = http.createServer(async (request, response) => {
    const send = (status, data) => response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(data));
    try {
      if (request.method === 'GET' && request.url === '/health') return send(200, { ok: true, adapter: 'simulation', version: 1 });
      if (request.method === 'GET' && request.url === '/v1/observation') return send(200, { kind: 'simulation', tick: run.tick, timestamp: new Date().toISOString(), state: run });
      if (request.method === 'POST' && request.url === '/v1/action') {
        const body = await readJson(request);
        if (body.expected_tick !== run.tick) return send(409, { error: 'stale observation' });
        const next = step(run);
        const event = next.events.at(-1);
        if (body.action?.action !== actionMap[event.action]) return send(422, { error: 'action differs from planned simulation step' });
        run = next;
        return send(200, { ok: true, tick: run.tick, outcome: event.outcome });
      }
      return send(404, { error: 'not found' });
    } catch (error) { return send(400, { error: error.message }); }
  });
  return { server, getRun: () => run };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = Number(process.env.AFKSIX_BRIDGE_PORT || 4788);
  const { server } = createMockBridge();
  server.listen(port, '127.0.0.1', () => console.log(`afksix mock bridge listening on http://127.0.0.1:${port}`));
}
