#!/usr/bin/env node
import fs from 'node:fs';
import { runSteps } from './simulator.mjs';

const [command = 'demo', countArg = '60', seedArg = '6'] = process.argv.slice(2);
if (command !== 'demo') {
  console.error('Usage: node src/cli.mjs demo [steps=60] [seed=6]');
  process.exitCode = 2;
} else {
  const count = Number(countArg);
  const seed = Number(seedArg);
  try {
    const run = runSteps(seed, count);
    for (const event of run.events) process.stdout.write(`${JSON.stringify(event)}\n`);
    const summary = { steps: run.tick, landmarks: run.landmarks, position: run.position, memory: run.memory };
    process.stderr.write(`AFKSIX SIMULATION ${JSON.stringify(summary)}\n`);
    if (process.env.AFKSIX_OUTPUT) fs.writeFileSync(process.env.AFKSIX_OUTPUT, JSON.stringify(run, null, 2) + '\n');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
