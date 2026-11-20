import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const site = path.join(root, '_site');
const project = path.join(site, 'project');
const brand = path.join(root, 'brand');
const oldCa = /HpY7yfUkhe2JaLkdkvJbZVSAo7JzEbwSoavYxUafpump|7cYYeZ2kt7XZa5Bj9ed4qg39nmUvT6SP7XBiU7twpump/g;

function copy(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(brand, source), destination);
}

for (const [source, destination] of [
  ['afksix.png', 'afksix.png'], ['favicon.png', 'favicon.png'], ['favicon.ico', 'favicon.ico'],
  ['afksix.png', 'Woodoo.png'], ['afksix.png', 'home/Woodoo.png'],
  ['afksix.png', 'project/img/logo.png'], ['banner.png', 'project/img/banner.png'],
  ['favicon.ico', 'project/favicon.ico'], ['favicon.png', 'project/favicon.png'],
  ['icon-192.png', 'project/icons/icon-192.png'], ['icon-512.png', 'project/icons/icon-512.png'],
  ['apple-touch-icon.png', 'project/icons/apple-touch-icon.png'],
  ['hero-wide.webp', 'project/art/hero/hero-wide.webp'],
  ['hero-phone.webp', 'project/art/hero/hero-phone.webp'],
  ['hero-standin.jpg', 'project/art/hero/standin.jpg'],
  ['afksix.png', 'home/graphics/woodoo-logo.png'],
]) copy(source, path.join(site, destination));

const entryPath = path.join(site, 'index.html');
let entry = fs.readFileSync(entryPath, 'utf8');
entry = entry.replace('the block that wouldn\'t stay deleted', 'one life at a time');
entry = entry.replace(/<p>I'm not gonna pretend I'm somebody[\s\S]*?<p><a href="story.html">/, `<p>Meet afksix: an AI learning Minecraft in hardcore mode, one life at a time.</p>
    <p>Each death ends a world. The next run begins with empty hands, saved skills and lessons from the last ten lives.</p>
    <p><b class="rainbowline">Watch the decisions, the proof and the progress as the experiment unfolds.</b></p>
    <p><a href="story.html">`);
entry = entry.replace(/<p style="line-height:1\.3;">[\s\S]*?<\/p>/, '<p>Token contract: <strong>TBA</strong> &nbsp;路&nbsp; <a href="https://github.com/dellmodrun/afksix" target="_blank" rel="noopener">GitHub</a></p>');
entry = entry.replace(/background-color: #186c4d;/, 'background-color: #090b15;');
entry = entry.replace(/<img src="Woodoo.png" width="220"/, '<img src="Woodoo.png" width="220" style="mix-blend-mode:screen"');
entry = entry.replace(/<link rel="icon" href="Woodoo.png">/, '<link rel="icon" href="favicon.png">');
fs.writeFileSync(entryPath, entry);

fs.writeFileSync(path.join(site, 'story.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The afksix story</title><link rel="icon" href="favicon.png"><link rel="stylesheet" href="style.css">
<style>body{background:#090b15;color:#f5f2e6;font:16px/1.7 Arial,sans-serif;margin:0;padding:30px 20px}main{max-width:660px;margin:auto}a{color:#ff74b8}img{mix-blend-mode:screen}h1{line-height:1.1}</style></head>
<body><main><a href="index.html">鈫?Back to entry</a><p><img src="afksix.png" width="100" alt="afksix"></p>
<h1>One life at a time.</h1><p>afksix follows an AI learning to play Minecraft in hardcore mode. A death ends that world and the next life starts from scratch. The agent keeps verified skills and lessons from its last ten deaths, so every run can build on what it learned.</p>
<p>Watch the live feed, inspect the decisions and check the proof on the project page. The question is simple: how many lives until it reaches the Dragon?</p>
<p><a href="project/">Explore afksix 鈫?/a></p></main></body></html>`);

const textExt = new Set(['.html', '.js', '.json', '.css', '.svg', '.webmanifest', '.txt']);
function visit(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) { visit(file); continue; }
    if (!textExt.has(path.extname(file)) && !file.includes(`${path.sep}api${path.sep}`)) continue;
    let text = fs.readFileSync(file, 'utf8');
    const before = text;
    text = text.replaceAll('/afksix/blockmind', '/afksix/project')
      .replaceAll('$BLOCKMIND', '$AFKSIX').replaceAll('BlockMind', 'afksix').replaceAll('BLOCKMIND', 'AFKSIX')
      .replaceAll('Woodoo', 'afksix').replaceAll('WOODOO', 'AFKSIX')
      .replaceAll('watchblockmind', 'afksix').replaceAll('woodcutleaf/Woodoo', 'dellmodrun/afksix')
      .replace(oldCa, 'TBA').replaceAll('鈫?', '&rarr;').replaceAll('路', '&middot;');
    if (file.startsWith(project)) {
      text = text.replaceAll('<b>B</b>', '<b>af</b>');
      if (item.name.endsWith('.html')) {
        text = text.replaceAll('href="/#', 'href="/afksix/project/#');
        text = text.replace(/<link rel="icon" href="\/afksix\/project\/favicon\.svg"[^>]*>/g, '');
        text = text.replace(/<a id="t-x"[^>]*>[\s\S]*?<\/a>/g, '');
        text = text.replace(/<a class="" href="https:\/\/x\.com\/afksix"[^>]*>X<\/a>/g, '');
        text = text.replace('</head>', '<style>.brand-logo{mix-blend-mode:screen}.mk-round b{font-size:10px!important;letter-spacing:-.02em}</style></head>');
      }
    }
    if (text !== before) fs.writeFileSync(file, text);
  }
}
visit(site);

const manifestPath = path.join(project, 'site.webmanifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.start_url = '/afksix/project/';
for (const icon of manifest.icons || []) {
  if (!icon.src.startsWith('/afksix/project/')) icon.src = `/afksix/project${icon.src}`;
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
fs.rmSync(path.join(project, 'favicon.svg'), { force: true });

// The old contract and X account belong to the source projects. Keep the
// current afksix launch state explicit until official details are supplied.
const brandApi = path.join(project, 'api', 'brand');
const api = JSON.parse(fs.readFileSync(brandApi, 'utf8'));
Object.assign(api, { name: 'afksix', ticker: 'AFKSIX', x: null, handle: null, ca: null,
  domain: 'dellmodrun.github.io/afksix', logo: '/afksix/project/img/logo.png' });
fs.writeFileSync(brandApi, JSON.stringify(api));

const statePath = path.join(project, 'api', 'state');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
Object.assign(state, { name: 'afksix', symbol: 'AFKSIX', x: null, ca: null,
  trades: [], candles: [], burns: [] });
if (state.totals && typeof state.totals === 'object') {
  for (const key of Object.keys(state.totals)) {
    if (typeof state.totals[key] === 'number') state.totals[key] = 0;
  }
  Object.assign(state.totals, { launched: false, mint: null, launchAt: null });
}
fs.writeFileSync(statePath, JSON.stringify(state));

const ledgerPath = path.join(project, 'api', 'money', 'ledger');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
for (const key of ['rows', 'claims', 'releases', 'compute']) {
  if (Array.isArray(ledger[key])) ledger[key] = [];
}
if (ledger.totals && typeof ledger.totals === 'object') {
  for (const key of Object.keys(ledger.totals)) {
    if (typeof ledger.totals[key] === 'number') ledger.totals[key] = 0;
  }
  Object.assign(ledger.totals, { launched: false, mint: null, launchAt: null });
}
fs.writeFileSync(ledgerPath, JSON.stringify(ledger));

// Old Woodoo world was an independent, stale application. The entry and
// story remain available; its old live backend is not an afksix service.
fs.rmSync(path.join(site, 'home'), { recursive: true, force: true });
console.log('Applied afksix branding to entry, project pages, icons and hero images');

