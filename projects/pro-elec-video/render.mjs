// Frame renderer: serves the project, drives window.renderAt(t) in headless Chromium,
// screenshots every frame (or chosen stills), then encodes with ffmpeg.
//   node render.mjs --fmt v --stills 1,5,9 --dpr 1 --out out/stills
//   node render.mjs --fmt v --fps 30 --dpr 2 --workers 3 --out out/frames_v
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]] : a), []));
const fmt = args.fmt || 'v';
const dpr = parseFloat(args.dpr || '2');
const fps = parseInt(args.fps || '30');
const duration = parseFloat(args.duration || '35');
const out = path.resolve(args.out || `out/frames_${fmt}`);
const workers = parseInt(args.workers || '3');
const quality = parseInt(args.quality || '93');
fs.mkdirSync(out, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { console.log('404', req.url); res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const W = fmt === 'v' ? 1080 : 1920, H = fmt === 'v' ? 1920 : 1080;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: dpr });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html?fmt=${fmt}&dpr=${dpr}`);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 180000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  return page;
}
async function shoot(page, t, file) {
  await page.evaluate((t) => window.renderAt(t), t);
  await page.screenshot({ path: file, type: file.endsWith('.png') ? 'png' : 'jpeg', quality: file.endsWith('.png') ? undefined : quality, clip: { x: 0, y: 0, width: W, height: H } });
}

const t0 = Date.now();
if (args.stills) {
  const page = await openPage();
  for (const s of String(args.stills).split(',')) { const t = parseFloat(s); await shoot(page, t, path.join(out, `${fmt}_${t.toFixed(2)}.jpg`)); console.log('still', t); }
} else {
  const total = Math.round(duration * fps);
  const from = parseInt(args.from || '0'), to = parseInt(args.to || String(total));
  const todo = []; for (let f = from; f < to; f++) { const file = path.join(out, `f_${String(f).padStart(5, '0')}.jpg`); if (!fs.existsSync(file)) todo.push(f); }
  console.log(`rendering ${todo.length} frames with ${workers} workers`);
  let done = 0;
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const page = await openPage();
    for (let k = w; k < todo.length; k += workers) {
      const f = todo[k];
      await shoot(page, f / fps, path.join(out, `f_${String(f).padStart(5, '0')}.jpg`));
      if (++done % 30 === 0) console.log(`${done}/${todo.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }));
}
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
await browser.close(); server.close();
