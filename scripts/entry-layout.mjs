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

const title = blocks[0].split('\n')[0].trim();
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const inline = value => escape(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const highlights = [
  'drive straight into a wall',
  'decision-making and control',
  'an unscripted day in gta vi',
  'what does it do when the mission is over?',
  'deciding for itself where to go next',
  "can yesterday's experience change today's decisions?",
  "that's where the experiment begins.",
];
let highlightHits = 0;
const renderParagraph = value => {
  let rendered = inline(value.toLowerCase()).replaceAll('<strong>afksix</strong>', 'afksix');
  for (const phrase of highlights) {
    if (rendered.includes(phrase)) {
      rendered = rendered.replace(phrase, `<mark class="miami-highlight">${phrase}</mark>`);
      highlightHits++;
    }
  }
  return rendered;
};
const pairs = [];
for (let i = 1; i < blocks.length; i += 2) {
  const zh = blocks[i];
  const en = blocks[i + 1];
  if (!/[\u3400-\u9fff]/.test(zh) || /[\u3400-\u9fff]/.test(en)) throw new Error(`Bad bilingual pair ${Math.ceil(i / 2)}`);
  pairs.push(`<p class="story-en" lang="en">${renderParagraph(en)}</p>`);
}
if (highlightHits !== highlights.length) throw new Error(`Expected ${highlights.length} article highlights, found ${highlightHits}`);
const wantedStars = Array.from({ length: 6 }, (_, i) => `<span class="wanted-star" aria-hidden="true">★</span>`).join('');
const wantedAnimation = Array.from({ length: 6 }, (_, i) => {
  const on = i * 11;
  const before = i ? `0%,${on - 1}%{color:#4b4020;text-shadow:none}` : '';
  return `.wanted-star:nth-child(${i + 1}){animation:wanted-${i + 1} 7.2s linear infinite}@keyframes wanted-${i + 1}{${before} ${on}%,${on + 2}%,${on + 4}%,84%{color:#ffd443;text-shadow:0 0 5px #ffd443,0 0 11px #ffb600} ${on + 1}%,${on + 3}%{color:#b88a23;text-shadow:none} 91%,100%{color:#4b4020;text-shadow:none}}`;
}).join('');

const social = current.match(/<p style="line-height:1\.3;">([\s\S]*?)<\/p>/)?.[1]?.replaceAll('&nbsp;', '');
const badges = current.match(/<img src="badges\/sideadd\.gif"[\s\S]*?(?=\s*<\/center>)/)?.[0]?.replace(/<br\s*\/?>/gi, '');
const rainbowScript = current.match(/<script>[\s\S]*?<\/script>/)?.[0];
if (!social || !badges || !rainbowScript) throw new Error('Existing social links, badges, or Enter animation are missing');
const caScript = `<script>
(() => {
  const endpoint = 'https://raw.githubusercontent.com/dellmodrun/afksix/ca-live/ca.json';
  const value = document.getElementById('entry-ca-value');
  const copy = document.getElementById('entry-ca-copy');
  let activeCa = '';
  let loading = false;
  async function refreshCa() {
    if (loading || document.hidden) return;
    loading = true;
    try {
      const response = await fetch(endpoint + '?v=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('CA feed unavailable');
      const data = await response.json();
      const next = String(data.ca || '').trim();
      if (next.toLowerCase() !== 'tba' && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(next)) throw new Error('Invalid CA');
      activeCa = next.toLowerCase() === 'tba' ? '' : next;
      value.textContent = activeCa || 'tba';
      copy.hidden = !activeCa;
    } catch (error) {
      console.warn('Could not refresh afksix CA', error);
    } finally {
      loading = false;
    }
  }
  copy.addEventListener('click', async () => {
    if (!activeCa) return;
    try {
      await navigator.clipboard.writeText(activeCa);
      copy.textContent = 'copied';
      setTimeout(() => { copy.textContent = 'copy'; }, 1300);
    } catch (error) {
      console.warn('Could not copy CA', error);
    }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshCa(); });
  refreshCa();
  setInterval(refreshCa, 2000);
})();
</script>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>afksix</title><link rel="icon" href="afksix.png"><meta name="theme-color" content="#000000">
<style>
:root{color-scheme:dark}*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:#000;color:#f6f3f6;font-family:Arial,"Microsoft YaHei",sans-serif}
.entry-grid{width:min(1290px,100%);margin:auto;padding:clamp(26px,4vw,64px);display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:clamp(40px,5vw,100px);align-items:start}
.story{max-width:720px;min-width:0}.wanted-level{display:flex;gap:5px;align-items:center;margin:0 0 20px;height:20px;font:20px/1 Arial,sans-serif;letter-spacing:0}.wanted-star{color:#4b4020}
${wantedAnimation}
@media(prefers-reduced-motion:reduce){.wanted-star{animation:none!important;color:#ffd443!important;text-shadow:none!important}}
.entry-ca{display:flex;align-items:center;gap:12px;width:min(100%,640px);min-height:44px;margin:-3px 0 27px;padding:10px 12px;border:1px solid #5e414a;background:#120d12;box-shadow:inset 3px 0 #ff92a9;font:13px/1.4 Consolas,monospace}.entry-ca-label{flex:none;color:#ffd28b;font-weight:700;letter-spacing:.12em}.entry-ca-value{min-width:0;overflow-wrap:anywhere;color:#f7eaf0}.entry-ca-copy{margin-left:auto;padding:4px 8px;border:1px solid #886d76;background:#22171d;color:#ffe0a6;font:11px/1 Consolas,monospace;cursor:pointer}.entry-ca-copy[hidden]{display:none}
h1{font-size:clamp(19px,3.2vw,48px);line-height:1.15;letter-spacing:-.055em;margin:0 0 30px;white-space:nowrap}
.story-en{font-size:17px;line-height:1.85;color:#f2ebef;margin:0 0 1.15em;max-width:68ch}
.story strong{font-weight:700;color:#f2ebef}.miami-highlight{font-weight:700;font-style:normal;background:linear-gradient(100deg,#75e7df 0%,#ff86ba 25%,#ffe087 50%,#ff9369 75%,#75e7df 100%);background-size:300% 100%;background-position:0% 50%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:miami-flow 7s ease-in-out infinite alternate}@keyframes miami-flow{to{background-position:100% 50%}}@media(prefers-reduced-motion:reduce){.miami-highlight{animation:none}}@media(forced-colors:active){.miami-highlight{background:none;color:CanvasText}}.side{position:sticky;top:28px;text-align:center;border:1px solid #242024;background:#080708;padding:28px 22px 24px}
.side-logo{display:block;width:min(220px,100%);height:auto;margin:0 auto 18px}.side-name{font:700 26px/1 Arial,sans-serif;letter-spacing:-.04em;margin:0 0 25px}
.enterbtn{display:inline-block;font:700 15px/1 "MS Sans Serif",Tahoma,Verdana,sans-serif;letter-spacing:1px;color:#000;text-decoration:none;background:#c0c0c0;padding:11px 32px;border-top:2px solid #fff;border-left:2px solid #fff;border-right:2px solid #808080;border-bottom:2px solid #808080;box-shadow:2px 2px 0 #000}
.enterbtn:active{border-color:#808080 #fff #fff #808080;box-shadow:none;transform:translate(2px,2px)}
.side-rule{height:1px;background:#242024;margin:27px 0 20px}.side-label{font:700 11px/1.4 Consolas,monospace;letter-spacing:.19em;text-transform:uppercase;color:#9f929b;margin:0 0 14px}
.social-links{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;align-items:center}.social-links a{display:inline-flex}.social-links img{height:28px;width:auto}
.badge-wall{display:grid;grid-template-columns:repeat(3,88px);justify-content:center;gap:5px}.badge-wall a,.badge-wall img{display:block;width:88px;height:31px;max-width:100%}
.side-foot{font:12px/1.5 Consolas,monospace;color:#8e858d;margin:23px 0 0}
@media(max-width:880px){.entry-grid{grid-template-columns:1fr;gap:35px}.side{position:static;grid-row:1;width:min(100%,420px);margin:auto}.story{max-width:none}.story-en{max-width:none}}
@media(max-width:420px){.entry-grid{padding:18px}.side{padding:17px 10px}.side-logo{width:150px;margin-bottom:9px}.side-name{font-size:21px;margin-bottom:15px}.side-rule{margin:17px 0 12px}.social-links img{height:24px}.badge-wall{gap:3px;grid-template-columns:repeat(4,72px)}.badge-wall a,.badge-wall img{width:72px;height:25px}.side-foot{margin-top:16px}.story-en{font-size:16px}}
</style></head><body>
<main class="entry-grid"><article class="story" aria-labelledby="story-title"><div class="wanted-level" role="img" aria-label="Six wanted stars lighting up one by one">${wantedStars}</div>
<div class="entry-ca" aria-label="afksix contract address"><span class="entry-ca-label">ca</span><span class="entry-ca-value" id="entry-ca-value" aria-live="polite">tba</span><button class="entry-ca-copy" id="entry-ca-copy" type="button" hidden>copy</button></div>
<h1 id="story-title">${escape(title)}</h1>
${pairs.join('\n')}
</article><aside class="side" aria-label="Enter and links"><a href="blockmind/"><img class="side-logo" src="afksix.png" alt="afksix"></a><p class="side-name">afksix</p>
<a href="blockmind/" class="enterbtn" aria-label="Enter afksix"><span class="rainbow">E</span><span class="rainbow">N</span><span class="rainbow">T</span><span class="rainbow">E</span><span class="rainbow">R</span></a>
<div class="side-rule"></div><p class="side-label">Links</p><div class="social-links">${social}</div>
<div class="side-rule"></div><p class="side-label">Badges</p><div class="badge-wall">${badges}</div>
<p class="side-foot">© 2026 afksix</p></aside></main>
${rainbowScript}${caScript}</body></html>`;
fs.writeFileSync(entryPath, html);
fs.writeFileSync(path.join(site, 'story.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./"><title>afksix story</title></head><body><a href="./">Read the afksix story</a></body></html>');
console.log(`Rendered complete English entry story with ${pairs.length} paragraphs`);
