import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const site = path.join(root, '_site');
const entry = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
if (!entry.includes('<title>afksix</title>') || !entry.includes('href="project/" class="enterbtn"')) throw new Error('afksix entry or Enter route is missing');
for (const file of ['afksix.png', 'favicon.png', 'story.html', 'style.css']) {
  if (!fs.existsSync(path.join(site, file))) throw new Error(`Missing entry asset ${file}`);
}
const routes = ['', 'skills/', 'proof/', 'ledger/'];
for (const route of routes) {
  const file = path.join(site, 'project', route, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Missing page ${route || '/'}`);
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('afksix') || !html.includes('/afksix/project/site/rs.css')) throw new Error(`Broken page ${route || '/'}`);
  if (!html.includes('<nav class="nav" aria-label="Main"><a href="/afksix/">Home</a>')) throw new Error(`Woodoo Home link missing in ${route || '/'}`);
  if (!html.includes('<div class="sheet" id="sheet"><a href="/afksix/">Home')) throw new Error(`Mobile Home link missing in ${route || '/'}`);
  if (!html.includes('/afksix/project/site/nav-home.css')) throw new Error(`Mobile header stylesheet missing in ${route || '/'}`);
  if (html.includes('href="/skills"') || html.includes('href="/proof"') || html.includes('href="/ledger"') || html.includes('href="/#')) throw new Error(`Unprefixed navigation in ${route || '/'}`);
  if (/BlockMind|Woodoo|watchblockmind|woodcutleaf|HpY7yfUkhe2JaLkdkvJbZVSAo7JzEbwSoavYxUafpump/.test(html)) throw new Error(`Old branding in ${route || '/'}`);
}
const blockmindHome = fs.readFileSync(path.join(site, 'project', 'index.html'), 'utf8');
if (!blockmindHome.includes('id="watch-guide"') || !blockmindHome.includes('id="faq"') || !blockmindHome.includes('/afksix/project/site/observer.css')) throw new Error('BlockMind guide or FAQ is missing');
if (!fs.existsSync(path.join(site, 'project', 'site', 'observer.css'))) throw new Error('BlockMind guide styles are missing');
if (!fs.existsSync(path.join(site, 'project', 'site', 'nav-home.css'))) throw new Error('BlockMind header styles are missing');
const manifest = JSON.parse(fs.readFileSync(path.join(site, 'project', 'site.webmanifest'), 'utf8'));
if (manifest.name !== 'afksix' || manifest.start_url !== '/afksix/project/') throw new Error('Manifest branding or start URL is wrong');
for (const icon of manifest.icons) {
  if (!icon.src.startsWith('/afksix/project/') || !fs.existsSync(path.join(site, icon.src.slice('/afksix/'.length)))) throw new Error(`Broken manifest icon ${icon.src}`);
}
const brand = JSON.parse(fs.readFileSync(path.join(site, 'project', 'api', 'brand'), 'utf8'));
const state = JSON.parse(fs.readFileSync(path.join(site, 'project', 'api', 'state'), 'utf8'));
if (brand.name !== 'afksix' || brand.ca !== null || brand.x !== null || state.ca !== null || state.x !== null) throw new Error('Old contract or social account survived');
for (const file of ['site/home.js', 'site/skills.js', 'site/proof.js', 'site/ledger.js', 'api/state', 'api/brand', 'rec/site/plays.mp4', 'art/reel/test-life4.mp4']) {
  if (!fs.existsSync(path.join(site, 'project', file))) throw new Error(`Missing asset ${file}`);
}
if (!fs.existsSync(path.join(site, '.nojekyll'))) throw new Error('Pages bypass file missing');
console.log('PASS: afksix entry, Enter route, project pages, API snapshots, and media assets');
