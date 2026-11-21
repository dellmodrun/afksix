import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const site = path.join(root, '_site');
const entry = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
if (!entry.includes('<title>afksix</title>') || !entry.includes('href="blockmind/" class="enterbtn"')) throw new Error('afksix entry or Enter route is missing');
if (!entry.includes('when i put the controller down') || !entry.includes('afk usually means the player has stepped away.') || !entry.includes('background:#000') || (entry.match(/class="story-en"/g) || []).length !== 10 || /[\u3400-\u9fff]/.test(entry)) throw new Error('English entry story or black layout is missing');
for (const paragraph of entry.matchAll(/<p class="story-en" lang="en">([\s\S]*?)<\/p>/g)) {
  if (/[A-Z]/.test(paragraph[1])) throw new Error('Entry article is not fully lowercase');
}
if ((entry.match(/class="miami-highlight"/g) || []).length !== 7 || !entry.includes('animation:miami-flow 7s') || !entry.includes('deciding for itself where to go next</mark>') || !entry.includes("that's where the experiment begins.</mark>") || entry.includes('<strong>afksix</strong>')) throw new Error('Flowing Miami article highlights are missing or project name is highlighted');
if (!entry.includes('white-space:nowrap') || entry.includes('story-pair')) throw new Error('Entry title or article layout is wrong');
if (entry.includes('afksix / story') || !entry.includes('class="wanted-level"') || (entry.match(/class="wanted-star"/g) || []).length !== 6 || !entry.includes('wanted-6 7.2s linear infinite')) throw new Error('Six animated wanted stars are missing');
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
console.log('PASS: English afksix entry story, existing links, project pages, and media assets');
