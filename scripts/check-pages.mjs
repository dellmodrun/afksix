import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const site = path.join(root, '_site');
const entry = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
if (!entry.includes('<title>afksix</title>') || !entry.includes('href="blockmind/" class="badge-link enterbtn"')) throw new Error('afksix entry or Enter route is missing');
if (!entry.includes('when i put the controller down') || !entry.includes('afk usually means the player has stepped away.') || !entry.includes('background:#000') || (entry.match(/class="story-en"/g) || []).length !== 10 || /[\u3400-\u9fff]/.test(entry)) throw new Error('English entry story or black layout is missing');
for (const paragraph of entry.matchAll(/<p class="story-en" lang="en">([\s\S]*?)<\/p>/g)) {
  if (/[A-Z]/.test(paragraph[1])) throw new Error('Entry article is not fully lowercase');
}
if ((entry.match(/class="miami-highlight"/g) || []).length !== 7 || !entry.includes('animation:miami-flow 7s') || !entry.includes('deciding for itself where to go next</mark>') || !entry.includes("that's where the experiment begins.</mark>") || entry.includes('<strong>afksix</strong>')) throw new Error('Flowing Miami article highlights are missing or project name is highlighted');
if (!entry.includes('white-space:nowrap') || entry.includes('story-pair')) throw new Error('Entry title or article layout is wrong');
if (entry.includes('afksix / story') || !entry.includes('class="wanted-level"') || (entry.match(/class="wanted-star"/g) || []).length !== 6 || !entry.includes('wanted-6 7.2s linear infinite')) throw new Error('Six animated wanted stars are missing');
if (!/class="entry-status"><div class="wanted-level"[\s\S]*?<\/div>\s*<div class="entry-ca"[\s\S]*?<\/div><\/div>\s*<h1 id="story-title"/.test(entry) || !entry.includes('.entry-status{display:flex') || !entry.includes('https://afksix-ca-feed.zaunmanx.chatgpt.site/ca') || !entry.includes('setInterval(refreshCa, 2000)') || !entry.includes('id="entry-ca-copy"')) throw new Error('Independent CA box must share one line with wanted stars');
if (!entry.includes('href="https://x.com/afksixauto"') || !entry.includes('href="https://github.com/"') || !entry.includes('href="https://pump.fun/"') || entry.includes('https://x.com/woodcutleaf') || entry.includes('https://github.com/woodcutleaf/Woodoo') || entry.includes('https://pump.fun/coin/7cYYeZ2kt7XZa5Bj9ed4qg39nmUvT6SP7XBiU7twpump')) throw new Error('afksix social links are incorrect');
if (!entry.includes('entry-buttons/readme-enter.svg') || !entry.includes('entry-buttons/readme-github.svg') || !entry.includes('entry-buttons/readme-x.svg') || !entry.includes('entry-buttons/readme-pump.svg') || entry.includes('class="readme-button') || entry.includes('class="rainbow"') || entry.includes('badges/badge_twitter.svg" alt=')) throw new Error('Original Shields.io README badges are missing');
if (!/<div class="social-links">(?:<a class="badge-link"[^>]+><img src="entry-buttons\/readme-[^"]+\.svg" alt="[^"]+"><\/a>){3}<\/div>/.test(entry)) throw new Error('Social links must use original badge SVG images');
if (entry.indexOf('entry-buttons/readme-x.svg') > entry.indexOf('entry-buttons/readme-github.svg')) throw new Error('X badge must appear before GitHub');
const badgeWall = entry.match(/<div class="badge-wall">([\s\S]*?)<\/div>/)?.[1];
const gtaBadges = JSON.parse(fs.readFileSync(path.join(site, 'entry-gta-badges', 'manifest.json'), 'utf8'));
if (!badgeWall || gtaBadges.length !== 18 || (badgeWall.match(/<a /g) || []).length !== 18 || (badgeWall.match(/<img src="entry-gta-badges\//g) || []).length !== 18 || !entry.includes('grid-template-columns:repeat(3,minmax(0,1fr))') || badgeWall.includes('src="badges/')) throw new Error('GTA badge wall must contain exactly six rows of three new badges');
if (gtaBadges[8].src !== 'rockstarfans.gif') throw new Error('Third row, third badge must be the final GTA Place affiliate');
for (const badge of gtaBadges) if (!fs.existsSync(path.join(site, 'entry-gta-badges', badge.src))) throw new Error(`Missing GTA badge ${badge.src}`);
if (!entry.includes('entry-gifs/ballas-transparent.gif') || !entry.includes('entry-gifs/cj-transparent.gif') || !entry.includes('gif-24558015') || !entry.includes('gif-23381821')) throw new Error('Corner GTA animations are missing');
if (!entry.includes('.entry-gifs{position:fixed') || !entry.includes('classList.toggle(\'is-reading\'')) throw new Error('Corner GIFs do not appear immediately or move aside during reading');
if (entry.includes('Minecraft') || entry.includes('the block that wouldn')) throw new Error('Old Minecraft copy remains on the entry');
for (const file of ['afksix.png', 'story.html', 'home/index.html', 'entry-gifs/ballas-transparent.gif', 'entry-gifs/cj-transparent.gif', 'entry-buttons/readme-enter.svg', 'entry-buttons/readme-github.svg', 'entry-buttons/readme-x.svg', 'entry-buttons/readme-pump.svg', 'blockmind/site.css', 'blockmind/retro.css', 'blockmind/assets/vice-city-postcard.jpg']) {
  if (!fs.existsSync(path.join(site, file))) throw new Error(`Missing afksix site asset ${file}`);
}
if (fs.existsSync(path.join(site, 'entry-buttons', 'vice-city.jpg'))) throw new Error('Old realistic button image remains');
const routes = ['', 'skills/', 'proof/', 'ledger/', 'docs/'];
for (const route of routes) {
  const file = path.join(site, 'blockmind', route, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Missing page ${route || '/'}`);
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('afksix') || !html.includes('/afksix/blockmind/site.css') || !html.includes('/afksix/blockmind/retro.css') || !html.includes('href="/afksix/">Story</a>') || !html.includes('class="mobile-nav"')) throw new Error(`Broken project page ${route || '/'}`);
  if (!html.includes('https://x.com/afksixauto') || !html.includes('https://afksix-ca-feed.zaunmanx.chatgpt.site/ca') || !html.includes('data-ca')) throw new Error(`X or independent CA missing in ${route || '/'}`);
  if (/>BlockMind<|\$BLOCKMIND|Minecraft|Mojang|watchblockmind|Opus 5\.5|Haiku 5\.5|hardcore|burns? \$AFKSIX/i.test(html)) throw new Error(`Old project narrative remains in ${route || '/'}`);
}
const projectHome = fs.readFileSync(path.join(site, 'blockmind', 'index.html'), 'utf8');
for (const id of ['brief', 'live', 'watch-guide', 'how', 'lives', 'learned', 'ladder', 'skills', 'mind', 'bill', 'docs', 'token', 'faq']) if (!projectHome.includes(`id="${id}"`)) throw new Error(`Missing project section ${id}`);
if (!projectHome.includes('When the mission ends') || !projectHome.includes('No public sessions yet.') || !projectHome.includes('first public run') || !projectHome.includes('GTA VI')) throw new Error('GTA VI narrative or honest run status missing');
if (!projectHome.includes('id="brief"') || !projectHome.includes('class="data-blueprint"') || !projectHome.includes('class="loop-diagram"') || !projectHome.includes('class="record-frame"') || projectHome.includes('<table')) throw new Error('Project explanation or honest data displays missing');
if (!projectHome.includes('class="video-launch"') || !projectHome.includes('youtube-nocookie.com/embed/VQRLujxTm3c') || !projectHome.includes('https://www.rockstargames.com/VI/media/videos') || !projectHome.includes('not measurements')) throw new Error('Official footage player, fallback, or data disclosure missing');
if (!projectHome.includes('href="docs/"') || !projectHome.includes('$AFKSIX') || (projectHome.match(/data-ca title="tba"/g) || []).length < 2 || !projectHome.includes('data-token-status')) throw new Error('Project documentation or independent official token panel missing');
const docs = fs.readFileSync(path.join(site, 'blockmind', 'docs', 'index.html'), 'utf8');
if (!docs.includes('Read the run.') || !docs.includes('How to check the CA.') || !docs.includes('no visitor control panel')) throw new Error('Project documentation is incomplete');
if (fs.existsSync(path.join(site, 'blockmind', 'api')) || fs.existsSync(path.join(site, 'blockmind', 'site', 'home.js'))) throw new Error('Old Minecraft runtime was deployed');
if (!fs.existsSync(path.join(site, '.nojekyll'))) throw new Error('Pages bypass file missing');
console.log('PASS: English entry, thirteen GTA VI project sections, four subpages, official video, token feed, links, and assets');
