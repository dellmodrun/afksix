import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const site = path.join(root, '_site');
const entryPath = path.join(site, 'index.html');
const current = fs.readFileSync(entryPath, 'utf8');
const source = fs.readFileSync(path.join(root, 'content', 'entry-story.txt'), 'utf8');
const blocks = source.replaceAll('\r\n', '\n').trim().split(/\n\s*\n/).map(block => block.trim());
if (blocks.length !== 21) throw new Error(`Expected title and 10 bilingual paragraph pairs, got ${blocks.length} blocks`);

const [title, subtitle] = blocks[0].split('\n').map(line => line.trim().replace(/\\+$/, ''));
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const inline = value => escape(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const pairs = [];
for (let i = 1; i < blocks.length; i += 2) {
  const zh = blocks[i];
  const en = blocks[i + 1];
  if (!/[\u3400-\u9fff]/.test(zh) || /[\u3400-\u9fff]/.test(en)) throw new Error(`Bad bilingual pair ${Math.ceil(i / 2)}`);
  pairs.push(`<section class="story-pair"><p class="story-zh" lang="zh-CN">${inline(zh)}</p><p class="story-en" lang="en">${inline(en)}</p></section>`);
}

const social = current.match(/<p style="line-height:1\.3;">([\s\S]*?)<\/p>/)?.[1]?.replaceAll('&nbsp;', '');
const badges = current.match(/<img src="badges\/sideadd\.gif"[\s\S]*?(?=\s*<\/center>)/)?.[0]?.replace(/<br\s*\/?>/gi, '');
const rainbowScript = current.match(/<script>[\s\S]*?<\/script>/)?.[0];
if (!social || !badges || !rainbowScript) throw new Error('Existing social links, badges, or Enter animation are missing');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>afksix</title><link rel="icon" href="afksix.png"><meta name="theme-color" content="#000000">
<style>
:root{color-scheme:dark}*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:#000;color:#f6f3f6;font-family:Arial,"Microsoft YaHei",sans-serif}
.entry-grid{width:min(1290px,100%);margin:auto;padding:clamp(26px,4vw,64px);display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:clamp(40px,5vw,100px);align-items:start}
.story{max-width:720px;min-width:0}.eyebrow{font:700 12px/1.4 Consolas,monospace;letter-spacing:.24em;color:#ff72bd;text-transform:uppercase;margin:0 0 20px}
h1{font-size:clamp(38px,5vw,68px);line-height:1.04;letter-spacing:-.055em;margin:0 0 11px;text-wrap:balance}
.subtitle{font-size:clamp(18px,2vw,24px);line-height:1.4;color:#f6a0cf;margin:0 0 42px}
.story-pair{border-top:1px solid #262126;padding:22px 0 24px}.story-pair:first-of-type{border-top:1px solid #565056}
.story-pair p{margin:0;max-width:68ch}.story-zh{font-size:16px;line-height:1.9;color:#f2ebef}.story-en{font-size:15px;line-height:1.8;color:#a9a2aa;margin-top:12px!important}
.story strong{color:#ff9bd0;font-weight:700}.side{position:sticky;top:28px;text-align:center;border:1px solid #242024;background:#080708;padding:28px 22px 24px}
.side-logo{display:block;width:min(220px,100%);height:auto;margin:0 auto 18px}.side-name{font:700 26px/1 Arial,sans-serif;letter-spacing:-.04em;margin:0 0 25px}
.enterbtn{display:inline-block;font:700 15px/1 "MS Sans Serif",Tahoma,Verdana,sans-serif;letter-spacing:1px;color:#000;text-decoration:none;background:#c0c0c0;padding:11px 32px;border-top:2px solid #fff;border-left:2px solid #fff;border-right:2px solid #808080;border-bottom:2px solid #808080;box-shadow:2px 2px 0 #000}
.enterbtn:active{border-color:#808080 #fff #fff #808080;box-shadow:none;transform:translate(2px,2px)}
.side-rule{height:1px;background:#242024;margin:27px 0 20px}.side-label{font:700 11px/1.4 Consolas,monospace;letter-spacing:.19em;text-transform:uppercase;color:#9f929b;margin:0 0 14px}
.social-links{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;align-items:center}.social-links a{display:inline-flex}.social-links img{height:28px;width:auto}
.badge-wall{display:grid;grid-template-columns:repeat(3,88px);justify-content:center;gap:5px}.badge-wall a,.badge-wall img{display:block;width:88px;height:31px;max-width:100%}
.side-foot{font:12px/1.5 Consolas,monospace;color:#8e858d;margin:23px 0 0}
@media(max-width:880px){.entry-grid{grid-template-columns:1fr;gap:35px}.side{position:static;grid-row:1;width:min(100%,420px);margin:auto}.story{max-width:none}.story-pair p{max-width:none}}
@media(max-width:420px){.entry-grid{padding:18px}.side{padding:17px 10px}.side-logo{width:150px;margin-bottom:9px}.side-name{font-size:21px;margin-bottom:15px}.side-rule{margin:17px 0 12px}.social-links img{height:24px}.badge-wall{gap:3px;grid-template-columns:repeat(4,72px)}.badge-wall a,.badge-wall img{width:72px;height:25px}.side-foot{margin-top:16px}.story-zh{font-size:15px}.story-en{font-size:14px}}
</style></head><body>
<main class="entry-grid"><article class="story" aria-labelledby="story-title"><p class="eyebrow">afksix / story</p>
<h1 id="story-title">${escape(title)}</h1><p class="subtitle" lang="zh-CN">${escape(subtitle)}</p>
${pairs.join('\n')}
</article><aside class="side" aria-label="Enter and links"><a href="blockmind/"><img class="side-logo" src="afksix.png" alt="afksix"></a><p class="side-name">afksix</p>
<a href="blockmind/" class="enterbtn" aria-label="Enter afksix"><span class="rainbow">E</span><span class="rainbow">N</span><span class="rainbow">T</span><span class="rainbow">E</span><span class="rainbow">R</span></a>
<div class="side-rule"></div><p class="side-label">Links</p><div class="social-links">${social}</div>
<div class="side-rule"></div><p class="side-label">Badges</p><div class="badge-wall">${badges}</div>
<p class="side-foot">© 2026 afksix</p></aside></main>
${rainbowScript}</body></html>`;
fs.writeFileSync(entryPath, html);
fs.writeFileSync(path.join(site, 'story.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./"><title>afksix story</title></head><body><a href="./">Read the afksix story</a></body></html>');
console.log(`Rendered complete entry story with ${pairs.length} bilingual paragraph pairs`);
