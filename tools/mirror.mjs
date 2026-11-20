import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = 'https://blockmind.fun';
const out = path.resolve('public');
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141 Safari/537.36';
const queue = [];
const queued = new Set();
const done = new Set();
const failed = [];

const seeds = [
  '/', '/skills', '/proof', '/ledger', '/robots.txt', '/sitemap.xml',
  '/api/state', '/api/calls', '/api/money/meter', '/run/last.json',
  '/api/brain/proof', '/api/money/ledger', '/api/brand',
  '/assets/icons/index.json', '/site.webmanifest',
  '/rec/site/plays.mp4', '/rec/site/plays.jpg',
  '/rec/site/dies.mp4', '/rec/site/dies.jpg',
  '/rec/site/respawn.mp4', '/rec/site/respawn.jpg',
  '/art/reel/test-life4.mp4', '/art/reel/test-life4.jpg',
  '/vendor/hls/hls.light.min.js',
  '/assets/icons/hud/hardcore_full.png',
  '/assets/icons/hud/hardcore_half.png',
  '/assets/icons/hud/container_hardcore.png',
  '/assets/icons/hud/food_full.png',
  '/assets/icons/hud/food_half.png',
  '/assets/icons/hud/food_empty.png'
];

function add(value, base = origin + '/') {
  if (!value || /^(?:data:|blob:|mailto:|javascript:|#)/i.test(value)) return;
  value = value.replaceAll('&amp;', '&');
  if (value.includes('${') || value.includes('{') || value.includes('}')) return;
  let url;
  try { url = new URL(value, base); } catch { return; }
  if (url.origin !== origin) return;
  url.hash = '';
  if (url.pathname === '/api/events' || url.pathname.startsWith('/api/events/')) return;
  const key = url.pathname + url.search;
  if (!queued.has(key)) {
    queued.add(key);
    queue.push(url);
  }
}

async function fetchRetry(url, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      const res = await fetch(url, {
        headers: { 'user-agent': ua, accept: '*/*' },
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) return res;
      last = new Error(`HTTP ${res.status}`);
      if (res.status === 404) break;
    } catch (error) { last = error; }
    await new Promise(resolve => setTimeout(resolve, 700 * (i + 1)));
  }
  throw last || new Error('request failed');
}

function destination(url, contentType) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') return path.join(out, 'index.html');
  const htmlRoute = contentType.includes('text/html') && !path.posix.extname(pathname);
  if (htmlRoute) return path.join(out, pathname.slice(1), 'index.html');
  return path.join(out, pathname.slice(1));
}

function discover(text, url, contentType) {
  const patterns = [
    /(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    /["'`]((?:\.{0,2}\/|\/)[^"'`\s<>]+?\.(?:js|css|json|webmanifest|png|jpg|jpeg|webp|svg|ico|woff|woff2|mp4|webm|m3u8))(?:\?[^"'`\s<>]*)?["'`]/gi
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(text))) add(match[1], url.href);
  }
  if (contentType.includes('application/json')) {
    try {
      const data = JSON.parse(text);
      const walk = value => {
        if (typeof value === 'string' && (/^\//.test(value) || /^https?:/.test(value))) add(value, url.href);
        else if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === 'object') Object.values(value).forEach(walk);
      };
      walk(data);
    } catch {}
  }
}

async function processUrl(url) {
  const key = url.pathname + url.search;
  if (done.has(key)) return;
  done.add(key);
  try {
    const res = await fetchRetry(url.href);
    const type = (res.headers.get('content-type') || 'application/octet-stream').toLowerCase();
    const buffer = Buffer.from(await res.arrayBuffer());
    const file = destination(url, type);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, buffer);
    if (/text|javascript|json|xml|svg|webmanifest/.test(type)) {
      discover(buffer.toString('utf8'), url, type);
    }
    process.stdout.write(`OK ${url.pathname}${url.search} (${buffer.length})\n`);
  } catch (error) {
    failed.push({ url: key, error: String(error?.message || error) });
    process.stdout.write(`MISS ${key} ${error?.message || error}\n`);
  }
}

for (const seed of seeds) add(seed);

while (queue.length) {
  const batch = queue.splice(0, 5);
  await Promise.all(batch.map(processUrl));
}

// The icon index names every image used by inventory and armor views.
try {
  const iconIndex = JSON.parse(await readFile(path.join(out, 'assets/icons/index.json'), 'utf8'));
  for (const kind of ['item', 'block']) {
    for (const name of iconIndex[kind] || []) add(`/assets/icons/${kind}/${name}.png`);
  }
  while (queue.length) {
    const batch = queue.splice(0, 8);
    await Promise.all(batch.map(processUrl));
  }
} catch (error) {
  failed.push({ url: '/assets/icons/index.json expansion', error: String(error?.message || error) });
}

// Snapshot every skill source exposed by the public state payload.
try {
  const state = JSON.parse(await readFile(path.join(out, 'api/state'), 'utf8'));
  const skills = state.skills instanceof Array ? state.skills : Object.values(state.skills || {});
  for (const skill of skills) {
    const id = skill?.id || skill?.name;
    if (id) add(`/api/brain/skill/${encodeURIComponent(id)}`);
  }
  while (queue.length) {
    const batch = queue.splice(0, 5);
    await Promise.all(batch.map(processUrl));
  }
} catch (error) {
  failed.push({ url: '/api/state skill expansion', error: String(error?.message || error) });
}

// Make the saved state self-contained: recorded local media replaces the remote live HLS URL.
try {
  const stateFile = path.join(out, 'api/state');
  const state = JSON.parse(await readFile(stateFile, 'utf8'));
  if (state.stream) {
    state.stream.live = false;
    state.stream.hls = '';
    state.stream.hlsBodies = {};
  }
  for (const body of state.bodies || []) body.hls = '';
  await writeFile(stateFile, JSON.stringify(state));
} catch (error) {
  failed.push({ url: '/api/state localization', error: String(error?.message || error) });
}

await writeFile(path.resolve('mirror-report.json'), JSON.stringify({
  source: origin,
  capturedAt: new Date().toISOString(),
  downloaded: done.size - failed.length,
  failed
}, null, 2));

console.log(`Finished: ${done.size - failed.length} downloaded, ${failed.length} unavailable.`);

