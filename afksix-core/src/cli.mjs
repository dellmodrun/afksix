#!/usr/bin/env node
import fs from 'node:fs';
import { runSteps } from './simulator.mjs';
import { BridgeClient } from './bridge.mjs';
import { createSimulationProvider, createVisionProvider } from './providers.mjs';
import { readTrace, runAgent } from './runtime.mjs';
import { createMockBridge } from '../examples/mock-bridge.mjs';

const usage = `afksix exploration core

Usage:
  node src/cli.mjs demo [steps=60] [seed=6]
  node src/cli.mjs smoke [steps=30]
  node src/cli.mjs serve-mock [port=4788]
  node src/cli.mjs run --bridge http://127.0.0.1:4788 --provider simulation|vision --steps 30 --trace run.jsonl
  node src/cli.mjs replay run.jsonl

Vision requires OPENAI_API_KEY and AFKSIX_MODEL. The bridge must be local.
`;
function flags(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i]?.startsWith('--') || !args[i + 1]) throw new Error(`invalid option ${args[i] || ''}`);
    options[args[i].slice(2)] = args[i + 1];
  }
  return options;
}
function positive(value, name, max = 10000) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > max) throw new Error(`${name} must be 1..${max}`);
  return number;
}
async function main() {
  const [command = 'help', ...args] = process.argv.slice(2);
  if (command === 'help' || command === '--help') return console.log(usage);
  if (command === 'demo') {
    const run = runSteps(Number(args[1] || 6), Number(args[0] || 60));
    for (const event of run.events) process.stdout.write(`${JSON.stringify(event)}\n`);
    process.stderr.write(`AFKSIX SIMULATION ${JSON.stringify({ steps: run.tick, landmarks: run.landmarks, position: run.position, memory: run.memory })}\n`);
    if (process.env.AFKSIX_OUTPUT) fs.writeFileSync(process.env.AFKSIX_OUTPUT, JSON.stringify(run, null, 2) + '\n');
    return;
  }
  if (command === 'serve-mock') {
    const port = positive(args[0] || 4788, 'port', 65535);
    const { server } = createMockBridge();
    server.listen(port, '127.0.0.1', () => console.log(`afksix mock bridge: http://127.0.0.1:${port}`));
    return;
  }
  if (command === 'smoke') {
    const { server } = createMockBridge();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const bridge = new BridgeClient(`http://127.0.0.1:${server.address().port}`);
      const result = await runAgent({ bridge, provider: createSimulationProvider(), steps: positive(args[0] || 30, 'steps'), onEvent: event => console.log(JSON.stringify(event)) });
      process.stderr.write(`BRIDGE SMOKE PASS / ${result.steps} steps\n`);
    } finally { server.close(); }
    return;
  }
  if (command === 'run') {
    const options = flags(args);
    if (!options.bridge) throw new Error('--bridge is required');
    const bridge = new BridgeClient(options.bridge);
    const health = await bridge.health();
    const providerName = options.provider || (health.adapter === 'simulation' ? 'simulation' : 'vision');
    const provider = providerName === 'simulation' ? createSimulationProvider() :
      providerName === 'vision' ? createVisionProvider({ model: options.model || process.env.AFKSIX_MODEL }) : null;
    if (!provider) throw new Error('provider must be simulation or vision');
    if (providerName === 'simulation' && health.adapter !== 'simulation') throw new Error('simulation provider needs a simulation bridge');
    const result = await runAgent({ bridge, provider, steps: positive(options.steps || 30, 'steps'), tracePath: options.trace, onEvent: event => console.log(JSON.stringify(event)) });
    process.stderr.write(`RUN COMPLETE / ${result.steps} steps\n`);
    return;
  }
  if (command === 'replay') {
    if (!args[0]) throw new Error('trace file required');
    const events = readTrace(fs.readFileSync(args[0], 'utf8'));
    for (const event of events) console.log(`${String(event.seq).padStart(3, '0')} ${event.action.padEnd(5)} ${event.outcome}`);
    console.log(`REPLAY / ${events.length} recorded steps`);
    return;
  }
  throw new Error(`unknown command ${command}\n${usage}`);
}
main().catch(error => { console.error(`AFKSIX ERROR: ${error.message}`); process.exitCode = 1; });
