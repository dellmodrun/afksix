import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReadme } from './readme-html.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(root, '_site');
const project = path.join(output, 'blockmind');
if (path.dirname(output) !== root) throw new Error('Unsafe Pages output path');

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(project, { recursive: true });
for (const directory of ['entry-gifs', 'entry-buttons', 'entry-gta-badges']) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}
fs.cpSync(path.join(root, 'project-v2', 'assets'), path.join(project, 'assets'), { recursive: true });
fs.cpSync(path.join(root, 'source-ui'), path.join(output, 'source'), { recursive: true });
fs.cpSync(path.join(root, 'afksix-core'), path.join(output, 'source', 'files'), {
  recursive: true, filter: source => !source.includes('__pycache__') && !source.endsWith('.pyc'),
});
await import('./source-archive.mjs');
const sourcePage = path.join(output, 'source', 'index.html');
const readme = fs.readFileSync(path.join(root, 'afksix-core', 'README.md'), 'utf8');
const template = fs.readFileSync(sourcePage, 'utf8');
if (!/<article class="box readme">[\s\S]*?<\/article>/.test(template)) throw new Error('Source README slot missing');
fs.writeFileSync(sourcePage, template.replace(/<article class="box readme">[\s\S]*?<\/article>/, renderReadme(readme)));
fs.copyFileSync(path.join(root, 'brand', 'logo.png'), path.join(output, 'afksix.png'));
fs.copyFileSync(path.join(root, 'project-v2', 'site.css'), path.join(project, 'site.css'));
fs.copyFileSync(path.join(root, 'project-v2', 'retro.css'), path.join(project, 'retro.css'));

await import('./entry-layout.mjs');
await import('./project-layout.mjs');

const redirect = destination => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${destination}"><link rel="canonical" href="https://afksix.run${destination}"><title>afksix</title><p><a href="${destination}">Continue to afksix</a></p></html>`;
fs.mkdirSync(path.join(output, 'home'));
fs.writeFileSync(path.join(output, 'home', 'index.html'), redirect('/blockmind/'));
fs.writeFileSync(path.join(output, 'story.html'), redirect('/'));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Prepared afksix story and GTA VI project pages for afksix.run');
