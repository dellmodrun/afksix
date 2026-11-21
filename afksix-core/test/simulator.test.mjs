import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, isRoad, LANDMARKS, runSteps, step } from '../src/simulator.mjs';

test('exploration is repeatable and produces valid movement', () => {
  const run = runSteps(6, 120);
  assert.deepEqual(run, runSteps(6, 120));
  assert.equal(run.events.length, 120);
  assert.ok(run.landmarks.length >= 4);
  for (const event of run.events) assert.ok(isRoad(event.position.x, event.position.y));
  assert.ok(run.events.every(event => event.observation && event.decision && event.action && event.outcome));
});

test('goal selection and memory keep the agent exploring', () => {
  let run = createRun(7);
  for (let i = 0; i < 250; i++) run = step(run);
  assert.equal(run.landmarks.length, LANDMARKS.length);
  assert.ok(run.memory.length > 0);
  assert.ok(Object.keys(run.visited).length > 20);
});

test('bad inputs fail clearly', () => {
  assert.throws(() => createRun(-1), /seed/);
  assert.throws(() => runSteps(6, 10001), /count/);
  assert.throws(() => step({ position: { x: -1, y: -1 } }), /invalid run/);
});
