import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public');
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.m3u8': 'application/vnd.apple.mpegurl'
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const resolved = path.resolve(root, '.' + decoded);
  return resolved.startsWith(root + path.sep) || resolved === root ? resolved : null;
}

const server = http.createServer(async (req, res) => {
  try {
    let file = safePath(req.url || '/');
    if (!file) throw Object.assign(new Error('Forbidden'), { status: 403 });
    let info;
    try { info = await stat(file); } catch {}
    if (info?.isDirectory()) file = path.join(file, 'index.html');
    else if (!info && !path.extname(file)) {
      try {
        const routeIndex = path.join(file, 'index.html');
        if ((await stat(routeIndex)).isFile()) file = routeIndex;
      } catch {}
    }
    const body = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'content-type': types[ext] || (file.includes(path.join('api', path.sep)) ? 'application/json; charset=utf-8' : 'application/octet-stream'),
      'cache-control': 'no-cache',
      'access-control-allow-origin': '*'
    });
    if (req.method === 'HEAD') res.end(); else res.end(body);
  } catch (error) {
    res.writeHead(error.status || 404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(error.status === 403 ? 'Forbidden' : 'Not found in the offline snapshot');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`BlockMind local is running at http://127.0.0.1:${port}`);
});

