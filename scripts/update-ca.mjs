import { spawnSync } from 'node:child_process';

const owner = 'dellmodrun';
const repo = 'afksix';
const branch = 'ca-live';
const ca = process.argv[2]?.trim();

if (!ca || (ca.toLowerCase() !== 'tba' && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca))) {
  console.error('Usage: node scripts/update-ca.mjs tba|SOLANA_MINT_ADDRESS');
  process.exit(1);
}

const endpoint = `repos/${owner}/${repo}/contents/ca.json`;
const current = spawnSync('gh', ['api', `${endpoint}?ref=${branch}`, '--jq', '.sha'], { encoding: 'utf8' });
if (current.status !== 0 && !current.stderr.includes('404')) {
  console.error(current.stderr.trim());
  process.exit(1);
}

const data = JSON.stringify({ ca: ca.toLowerCase() === 'tba' ? 'tba' : ca, updated_at: new Date().toISOString() });
const payload = {
  message: `Update afksix CA to ${ca.toLowerCase() === 'tba' ? 'tba' : 'new mint'}`,
  branch,
  content: Buffer.from(data).toString('base64'),
};
if (current.status === 0) payload.sha = current.stdout.trim();
const update = spawnSync('gh', ['api', endpoint, '--method', 'PUT', '--input', '-'], {
  encoding: 'utf8',
  input: JSON.stringify(payload),
});
if (update.status !== 0) {
  console.error(update.stderr.trim());
  process.exit(1);
}
console.log(`Updated independent CA feed to ${ca}. No Pages deployment was triggered.`);
