import { readFile, writeFile } from 'node:fs/promises';

const file = new URL('../public/api/state', import.meta.url);
const state = JSON.parse(await readFile(file, 'utf8'));
if (state.stream) {
  state.stream.live = false;
  state.stream.hls = '';
  state.stream.hlsBodies = {};
}
for (const body of state.bodies || []) body.hls = '';
await writeFile(file, JSON.stringify(state));
console.log('Snapshot localized: remote HLS references disabled.');
