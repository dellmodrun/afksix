import { spawnSync } from 'node:child_process';

const endpoint = 'https://afksix-ca-feed.zaunmanx.chatgpt.site/ca';
const input = process.argv[2]?.trim();
if (!input || (input.toLowerCase() !== 'tba' && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input))) {
  console.error('Usage: node scripts/update-ca.mjs tba|SOLANA_MINT_ADDRESS');
  process.exit(1);
}
const ca = input.toLowerCase() === 'tba' ? 'tba' : input;
const auth = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8' });
if (auth.status !== 0 || !auth.stdout.trim()) {
  console.error('GitHub authentication is required to update the CA.');
  process.exit(1);
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${auth.stdout.trim()}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({ ca }),
});
if (!response.ok) {
  console.error(`CA update failed with HTTP ${response.status}: ${await response.text()}`);
  process.exit(1);
}
const saved = await response.json();
if (saved.ca !== ca) throw new Error('CA update response did not match the requested value');
console.log(`Updated independent CA feed to ${ca} at ${saved.updated_at}. No Pages deployment was triggered.`);
