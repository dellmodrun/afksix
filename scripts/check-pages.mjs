import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const site = path.join(root, '_site');
const entry = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
if (!entry.includes('<title>afksix</title>') || !entry.includes('href="blockmind/" class="enterbtn"')) throw new Error('afksix entry or Enter route is missing');
if (!entry.includes('when i put the controller down') || !entry.includes("For afksix, that's where the experiment begins.") || !entry.includes('background:#000') || (entry.match(/class="story-pair"/g) || []).length !== 10) throw new Error('Full bilingual entry story or black layout is missing');
if (!entry.includes('https://x.com/woodcutleaf') || !entry.includes('https://github.com/woodcutleaf/Woodoo') || !entry.includes('badges/sideadd.gif')) throw new Error('Existing social links or badges changed');
if (entry.includes('Minecraft') || entry.includes('the block that wouldn')) throw new Error('Old Minecraft copy remains on the entry');
for (const file of ['afksix.png', 'story.html', 'style.css', 'home/index.html', 'badges/badge_twitter.svg']) {
  if (!fs.existsSync(path.join(site, file))) throw new Error(`Missing Woodoo frontend asset ${file}`);
}
const routes = ['', 'skills/', 'proof/', 'ledger/'];
for (const route of routes) {
  const file = path.join(site, 'blockmind', route, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Missing page ${route || '/'}`);
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('afksix') || !html.includes('/afksix/blockmind/site/rs.css')) throw new Error(`Broken page ${route || '/'}`);
  if (!html.includes('<nav class="nav" aria-label="Main"><a href="/afksix/">Home</a>')) throw new Error(`Woodoo Home link missing in ${route || '/'}`);
  if (!html.includes('<div class="sheet" id="sheet"><a href="/afksix/">Home')) throw new Error(`Mobile Home link missing in ${route || '/'}`);
  if (!html.includes('/afksix/blockmind/site/nav-home.css')) throw new Error(`Mobile header stylesheet missing in ${route || '/'}`);
  if (html.includes('href="/skills"') || html.includes('href="/proof"') || html.includes('href="/ledger"')) throw new Error(`Unprefixed navigation in ${route || '/'}`);
}
const blockmindHome = fs.readFileSync(path.join(site, 'blockmind', 'index.html'), 'utf8');
if (!blockmindHome.includes('id="watch-guide"') || !blockmindHome.includes('id="faq"') || !blockmindHome.includes('/afksix/blockmind/site/observer.css')) throw new Error('BlockMind guide or FAQ is missing');
if (!fs.existsSync(path.join(site, 'blockmind', 'site', 'observer.css'))) throw new Error('BlockMind guide styles are missing');
if (!fs.existsSync(path.join(site, 'blockmind', 'site', 'nav-home.css'))) throw new Error('BlockMind header styles are missing');
for (const file of ['site/home.js', 'site/skills.js', 'site/proof.js', 'site/ledger.js', 'api/state', 'api/brand', 'rec/site/plays.mp4', 'art/reel/test-life4.mp4']) {
  if (!fs.existsSync(path.join(site, 'blockmind', file))) throw new Error(`Missing asset ${file}`);
}
if (!fs.existsSync(path.join(site, '.nojekyll'))) throw new Error('Pages bypass file missing');
console.log('PASS: complete afksix entry story, existing links, project pages, and media assets');
