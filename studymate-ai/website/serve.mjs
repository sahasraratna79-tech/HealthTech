import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const json = (res, status, message) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: message })); };

http.createServer(async (req, res) => {
  if (req.url?.startsWith('/api/answer')) return json(res, 503, 'The preview is running without the AI server. Run `npm install`, configure OPENAI_API_KEY in .env, then start the full app with `npm run dev`.');
  if (req.url?.startsWith('/api/pdf/extract')) return json(res, 503, 'PDF extraction needs the full app server. Run `npm install` and `npm run dev` from the project folder.');
  try {
    const requested = decodeURIComponent((req.url || '/').split('?')[0]);
    const target = path.resolve(root, `.${requested}`);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) return res.writeHead(403).end();
    const file = await stat(target).then(s => s.isFile() ? target : path.join(root, 'index.html')).catch(() => path.join(root, 'index.html'));
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(500).end('Could not load this page.'); }
}).listen(4173, '127.0.0.1', () => console.log('StudyMate website preview: http://127.0.0.1:4173'));
