// Export the 3D scenes (posed at a key moment) to GLB for Blender.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright-core';
const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'blender', 'glb'); fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
await page.goto(`http://127.0.0.1:${server.address().port}/index.html?fmt=v&dpr=1`);
await page.waitForFunction(() => window.__ready);
const jobs = [['logo', 2.6, 'scene', '01_logo_3D'], ['ac', 5.2, 'scene', '02_clim_murale'], ['house', 9.7, 'scene', '03_maison_jour'], ['house', 9.7, 'night', '04_maison_nuit'],
  ['pose', 15.0, 'scene', '05_installation_clim_groupe_exterieur'], ['borne', 19.6, 'scene', '06_borne_recharge_voiture'], ['map', 30.0, 'scene', '07_carte_orleans_100km']];
for (const [name, t, key, file] of jobs) {
  const b64 = await page.evaluate(async ([name, t, key]) => {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const s = window.__scenes.find((s) => s.name === (name === 'logo' ? 'intro' : name));
    window.renderAt(t);
    const sc = s[key];
    const hidden = [];
    sc.traverse((o) => { const bad = o.isPoints || o.isSprite || o.isLight || (o.material && (o.material.isShaderMaterial || o.renderOrder === -1 || o.material.isShadowMaterial)) || (o.isMesh && o.material && o.material.map && o.material.transparent && o.material.depthWrite === false); if (bad && o.visible) { o.visible = false; hidden.push(o); } });
    let k = 0; sc.traverse((o) => { if (!o.name) o.name = (o.parent && o.parent.name ? o.parent.name : 'Element') + '_' + (++k); if (o.material && !o.material.name) o.material.name = o.name + '_matiere'; });
    const res = await new GLTFExporter().parseAsync(sc, { binary: true, onlyVisible: true, maxTextureSize: 4096 });
    hidden.forEach((o) => (o.visible = true));
    let bin = ''; const u = new Uint8Array(res); for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(bin);
  }, [name, t, key]);
  fs.writeFileSync(path.join(out, file + '.glb'), Buffer.from(b64, 'base64'));
  console.log(file, (b64.length * 0.75 / 1024).toFixed(0) + ' KB');
}
await browser.close(); server.close();
