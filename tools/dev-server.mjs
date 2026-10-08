#!/usr/bin/env node
/* Serveur de développement — reproduit le comportement Vercel utile au site :
   URL propres (/cgu → cgu.html), 404.html avec statut 404, et la fonction
   /api/contact exécutée telle quelle.
     node tools/dev-server.mjs [port]                                          */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.argv[2] || 8790);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.avif': 'image/avif', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const exists = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/contact') {
    const { default: handler } = await import(join(ROOT, 'api', 'contact.js'));
    return handler(req, res);
  }
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  if (path.endsWith('/')) path += 'index.html';
  let file = join(ROOT, path);
  if (!extname(file) && await exists(`${file}.html`)) file = `${file}.html`;
  if (/[/\\](src|tools|api|\.git)[/\\]/.test(file.slice(ROOT.length - 1))) file = '';
  if (file && await exists(file)) {
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return res.end(await readFile(file));
  }
  res.writeHead(404, { 'Content-Type': TYPES['.html'] });
  res.end(await readFile(join(ROOT, '404.html')).catch(() => 'Not found'));
}).listen(PORT, () => console.log(`Roll in Love — http://localhost:${PORT}`));
