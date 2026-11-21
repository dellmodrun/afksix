import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const blockmindSource = path.join(root, 'public');
const woodooSource = path.join(root, 'woodoo');
const output = path.join(root, '_site');
const blockmindOutput = path.join(output, 'blockmind');
const base = '/afksix/blockmind';
const localPath = /(?<![A-Za-z0-9/:])\/(api|art|assets|icons|img|ledger|proof|rec|run|site|skills|vendor|favicon\.ico|favicon\.svg|site\.webmanifest|robots\.txt)(?=[/?#"'`<>)}]|$)/g;
const textExtensions = new Set(['.html', '.js', '.css', '.json', '.svg', '.webmanifest', '.txt']);

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(woodooSource, output, { recursive: true });
fs.cpSync(blockmindSource, blockmindOutput, { recursive: true });
fs.cpSync(path.join(root, 'entry-gifs'), path.join(output, 'entry-gifs'), { recursive: true });

const entry = path.join(output, 'index.html');
const woodooEntry = fs.readFileSync(entry, 'utf8');
const routedEntry = woodooEntry.replaceAll('href="home/index.html"', 'href="blockmind/"');
if (routedEntry === woodooEntry || !routedEntry.includes('class="enterbtn"')) throw new Error('Woodoo Enter link was not found');
fs.writeFileSync(entry, routedEntry);

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) { visit(target); continue; }
    const relative = path.relative(blockmindOutput, target).replaceAll('\\', '/');
    if (!textExtensions.has(path.extname(entry.name)) && !relative.startsWith('api/')) continue;
    const before = fs.readFileSync(target, 'utf8');
    let after = before
      .replace(localPath, `${base}/$1`)
      .replace(/(["'`])\/\1/g, `$1${base}/$1`)
      .replaceAll('https://blockmind.fun/img/banner.png?v=1', 'https://dellmodrun.github.io/afksix/blockmind/img/banner.png?v=1')
      .replaceAll('https://blockmind.fun/', 'https://dellmodrun.github.io/afksix/blockmind/');
    if (entry.name.endsWith('.html')) {
      const navs = [
        ['<nav class="nav" aria-label="Main">', '<nav class="nav" aria-label="Main"><a href="/afksix/">Home</a>'],
        ['<div class="sheet" id="sheet">', '<div class="sheet" id="sheet"><a href="/afksix/">Home<span aria-hidden="true">↗</span></a>'],
        ['<nav class="ft-nav" aria-label="Footer">', '<nav class="ft-nav" aria-label="Footer"><a href="/afksix/">Home</a>']
      ];
      for (const [anchor, replacement] of navs) {
        if (!after.includes(anchor)) throw new Error(`Missing BlockMind navigation in ${relative}`);
        after = after.replace(anchor, replacement);
      }
      after = after.replace('</head>', '<link rel="stylesheet" href="/afksix/blockmind/site/nav-home.css"></head>');
    }
    if (after !== before) fs.writeFileSync(target, after);
  }
}
visit(blockmindOutput);
await import('./brand-only.mjs');
await import('./entry-layout.mjs');
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`Prepared afksix branding at /afksix/ and ${base}/`);
