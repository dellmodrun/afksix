import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = path.join(root, 'public');
const output = path.join(root, '_site');
const base = '/afksix';
const localPath = /(?<![A-Za-z0-9/:])\/(api|art|assets|icons|img|ledger|proof|rec|run|site|skills|vendor|favicon\.ico|favicon\.svg|site\.webmanifest|robots\.txt)(?=[/?#"'`<>)}]|$)/g;
const textExtensions = new Set(['.html', '.js', '.css', '.json', '.svg', '.webmanifest', '.txt']);

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) { visit(target); continue; }
    const relative = path.relative(output, target).replaceAll('\\', '/');
    if (!textExtensions.has(path.extname(entry.name)) && !relative.startsWith('api/')) continue;
    const before = fs.readFileSync(target, 'utf8');
    const after = before
      .replace(localPath, `${base}/$1`)
      .replace(/(["'`])\/\1/g, `$1${base}/$1`)
      .replaceAll('https://blockmind.fun/img/banner.png?v=1', 'https://dellmodrun.github.io/afksix/img/banner.png?v=1')
      .replaceAll('https://blockmind.fun/', 'https://dellmodrun.github.io/afksix/');
    if (after !== before) fs.writeFileSync(target, after);
  }
}
visit(output);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`Prepared ${output} for ${base}/`);
