import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public');
const required = [
  'index.html', 'skills/index.html', 'proof/index.html', 'ledger/index.html',
  'site/rs.css', 'site/home.js', 'site/skills.js', 'site/proof.js', 'site/ledger.js',
  'api/state', 'api/calls', 'api/brain/proof', 'api/money/ledger',
  'run/last.json', 'assets/icons/index.json'
];

for (const file of required) await access(path.join(root, file));

let files = 0;
let bytes = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else { files++; bytes += (await stat(full)).size; }
  }
}
await walk(root);

for (const route of ['index.html', 'skills/index.html', 'proof/index.html', 'ledger/index.html']) {
  const html = await readFile(path.join(root, route), 'utf8');
  if (!html.includes('BlockMind')) throw new Error(`${route} is not a BlockMind page`);
}

const state = JSON.parse(await readFile(path.join(root, 'api/state'), 'utf8'));
if (state.stream?.hls || (state.bodies || []).some(body => body.hls)) {
  throw new Error('Remote HLS reference remains in the local snapshot');
}

console.log(`Validation passed: ${files} files, ${(bytes / 1024 / 1024).toFixed(2)} MiB.`);

