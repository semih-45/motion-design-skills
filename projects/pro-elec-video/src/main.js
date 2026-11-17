import * as THREE from 'three';
import { makeRenderer, toScreen } from './three-common.js';
import { buildScenes } from './scenes.js';
import { buildDOM, updateDOM } from './dom.js';
import { prog, easeOut, easeIn, lerp } from './util.js';

const q = new URLSearchParams(location.search);
const fmt = q.get('fmt') || 'v';
const portrait = fmt === 'v';
const W = portrait ? 1080 : 1920, H = portrait ? 1920 : 1080;
const dpr = parseFloat(q.get('dpr') || '2');
export const DURATION = 35;

const stage = document.getElementById('stage');
stage.classList.add(portrait ? 'portrait' : 'landscape');
Object.assign(stage.style, { width: W + 'px', height: H + 'px' });
document.body.style.width = W + 'px'; document.body.style.height = H + 'px';

async function boot() {
  await document.fonts.load('900 80px Montserrat', 'Électricité éèàç');
  await document.fonts.load('800 80px Montserrat', 'É');
  await document.fonts.load('700 80px Montserrat', 'É');
  await document.fonts.load('40px "Noto Color Emoji"', '👋😊👇✅🔧');
  await document.fonts.ready;
  const cA = document.getElementById('cA'), cB = document.getElementById('cB');
  const renderers = { A: makeRenderer(cA, W, H, dpr), B: makeRenderer(cB, W, H, dpr) };
  const logo = await new THREE.TextureLoader().loadAsync('assets/logo.jpg');
  logo.colorSpace = THREE.SRGBColorSpace; logo.anisotropy = 8;
  const ctx = { W, H, portrait, dpr, renderers, textures: { logo }, state: {} };
  ctx.project = (p, cam) => toScreen(new THREE.Vector3(p.x, p.y, p.z), cam, W, H);
  const scenes = buildScenes(ctx);
  const D = buildDOM(ctx);
  // wait for all <img>
  await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  await Promise.all([...document.images].map((i) => i.decode().catch(() => 0)));

  // pre-compile every scene once
  for (const s of scenes) { s.update(s.t0 + 0.5); renderers[s.canvas].compile(s.scene, s.camera); }

  const canv = { A: cA, B: cB };
  window.renderAt = (t) => {
    for (const k of ['A', 'B']) {
      const r = renderers[k]; const c = canv[k];
      const s = scenes.find((s) => s.canvas === k && t >= s.t0 && t <= s.t1);
      if (!s) { c.style.opacity = 0; continue; }
      s.update(t);
      if (s.render) s.render(r); else r.render(s.scene, s.camera);
      const i = easeOut(prog(t, s.t0, s.t0 + 0.32)); const o = easeIn(prog(t, s.t1 - 0.3, s.t1));
      c.style.opacity = i * (1 - o);
      c.style.transform = `scale(${lerp(1.05, 1, i) * lerp(1, 1.05, o)})`;
      const blur = (1 - i) * 10 + o * 10;
      c.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : '';
    }
    updateDOM(D, t, ctx);
    if (q.has('noui')) { document.getElementById('ui').style.display = 'none'; document.getElementById('sweep').style.display = 'none'; }
    return true;
  };
  window.__fmt = { W, H, fmt, duration: DURATION };
  const t0 = parseFloat(q.get('t') || '0');
  window.renderAt(t0);
  if (q.has('play')) {
    const start = performance.now() - t0 * 1000;
    const loop = () => { const t = ((performance.now() - start) / 1000) % DURATION; window.renderAt(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  window.__ready = true;
}
boot().catch((e) => { console.error(e); window.__error = String(e.stack || e); });
