// Tiny concurrent static file server for the landing E2E (Playwright webServer).
// Dependency-free + handles directory paths like /account -> /account/index.html.
// Node handles concurrency, so it doesn't choke under parallel test workers the
// way `python -m http.server` (single-threaded) does.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.LANDING_PORT ? Number(process.env.LANDING_PORT) : 4321;
const ROOT = path.join(__dirname, '..');
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain',
};

function sendFile(res, fp) {
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}

http
  .createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, p);
    fs.stat(fp, (err, st) => {
      if (!err && st.isFile()) return sendFile(res, fp);
      if (!err && st.isDirectory()) return sendFile(res, path.join(fp, 'index.html'));
      // extensionless dir path (e.g. /account) -> /account/index.html
      sendFile(res, path.join(ROOT, p.replace(/\/?$/, ''), 'index.html'));
    });
  })
  .listen(PORT, '127.0.0.1', () => console.log(`[static-server] http://127.0.0.1:${PORT}`));
