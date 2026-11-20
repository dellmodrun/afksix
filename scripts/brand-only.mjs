import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const site = path.join(root, '_site');
const project = path.join(site, 'blockmind');
const assets = path.join(root, 'brand');
const copy = (source, target) => fs.copyFileSync(path.join(assets, source), path.join(site, target));

// Keep the source pages, copy, layout, routes, data, CA and outbound links.
// Only displayed project names and their logo assets change in the build.
for (const page of ['index.html', 'story.html']) {
  const file = path.join(site, page);
  const original = fs.readFileSync(file, 'utf8');
  const renamed = original.replaceAll('Woodoo', 'afksix')
    .replaceAll('woodcutleaf/afksix', 'woodcutleaf/Woodoo');
  fs.writeFileSync(file, renamed);
}
copy('logo.png', 'afksix.png');
copy('logo.png', 'Woodoo.png');

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    const relative = path.relative(project, file).replaceAll('\\', '/');
    if (!/\.(html|js|json|webmanifest)$/.test(entry.name) && !relative.startsWith('api/')) continue;
    const before = fs.readFileSync(file, 'utf8');
    const after = before.replaceAll('$BLOCKMIND', '$AFKSIX')
      .replaceAll('BlockMind', 'afksix')
      .replaceAll('BLOCKMIND', 'AFKSIX')
      .replaceAll('<b>B</b>', '<b>AF</b>');
    if (after !== before) fs.writeFileSync(file, after);
  }
}
walk(project);

for (const [source, destination] of [
  ['logo.png', 'img/logo.png'], ['favicon.ico', 'favicon.ico'],
  ['favicon.png', 'favicon.png'], ['favicon.svg', 'favicon.svg'],
  ['icon-192.png', 'icons/icon-192.png'], ['icon-512.png', 'icons/icon-512.png'],
  ['apple-touch-icon.png', 'icons/apple-touch-icon.png'],
  ['hero-wide.webp', 'art/hero/hero-wide.webp'], ['hero-phone.webp', 'art/hero/hero-phone.webp'],
  ['standin.jpg', 'art/hero/standin.jpg'], ['banner.png', 'img/banner.png']
]) fs.copyFileSync(path.join(assets, source), path.join(project, destination));

for (const file of ['api/brand', 'api/state']) {
  const target = path.join(project, file);
  const data = JSON.parse(fs.readFileSync(target, 'utf8'));
  data.name = 'afksix';
  if ('ticker' in data) data.ticker = 'AFKSIX';
  if ('symbol' in data) data.symbol = 'AFKSIX';
  fs.writeFileSync(target, JSON.stringify(data));
}
