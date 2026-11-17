import * as THREE from 'three';
import { blobShadow, glowSprite, keyLights, fitDistance, orbit, canvasTexture, radialTex } from './three-common.js';
import { makeAC, makeOutdoor, makeHouse, makeCar, makeBorne, makeLogoSlab, makeWallbox, makeType2, makeCoffret, makeConduit, makeApplique, makePlanter } from './models.js';
import { clamp, lerp, prog, easeInOut, easeOut, easeOutQuint, spring, smooth, rng } from './util.js';

const hex3 = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

/* ── soft particle points (sRGB colours, normal blending — reads on white) ── */
function makePoints(n) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(n), 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 1000 } },
    vertexShader: `attribute vec3 aColor; attribute float aSize; attribute float aAlpha; uniform float uScale; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = aSize*uScale/(-mv.z); gl_Position = projectionMatrix*mv; vC=aColor; vA=aAlpha; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float r=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,r); a=pow(a,1.4); if(a*vA<0.003) discard; gl_FragColor=vec4(vC+ (1.0-vC)*smoothstep(0.2,0.0,r)*0.25, a*vA); }`,
    transparent: true, depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}
function pointScale(pts, cam, H, dpr) {
  pts.material.uniforms.uScale.value = (H * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
}

/* ── air-flow ribbon ── */
function makeRibbon(curve, width, segs = 80) {
  const pos = [], uv = [], idx = [];
  const tmp = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs; curve(u, tmp);
    const w = width * (0.6 + u * 1.6);
    pos.push(tmp.x - w / 2, tmp.y, tmp.z, tmp.x + w / 2, tmp.y, tmp.z);
    uv.push(u, 0, u, 1);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uOp: { value: 0 }, uGrow: { value: 0 }, uWarm: { value: -1 }, uPhase: { value: Math.random() } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uT,uOp,uGrow,uWarm,uPhase;
      void main(){ float u=vUv.x, v=vUv.y;
        float edge=smoothstep(0.0,0.4,v)*smoothstep(1.0,0.6,v);
        float head=smoothstep(0.0,0.06,u)*smoothstep(1.0,0.5,u);
        float s=0.5+0.5*sin((u*9.0-uT*3.2+uPhase*6.0)*3.14159); float stripe=0.35+0.65*s*s;
        float grow=1.0-smoothstep(uGrow-0.12,uGrow,u);
        float warm=1.0-smoothstep(uWarm-0.1,uWarm,u);
        vec3 cold=vec3(0.22,0.66,0.97); vec3 hot=vec3(0.98,0.57,0.24);
        vec3 c=mix(cold,hot,warm); c=mix(c,vec3(1.0),0.15*(1.0-v*v));
        gl_FragColor=vec4(c, edge*head*stripe*grow*uOp*0.5); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

/* ───────────────────────────────────────────────────────────── */
export function buildScenes(ctx) {
  const { W, H, portrait, dpr, renderers, textures } = ctx;
  const aspect = W / H;
  const scenes = [];
  const mkCam = (fov) => { const c = new THREE.PerspectiveCamera(fov, aspect, 0.05, 200); return c; };
  const envFor = (canvas) => renderers[canvas].userData.env;

  /* S1 + S7 — logo slab */
  function logoScene(canvas, t0, t1, mode) {
    const scene = new THREE.Scene(); scene.environment = envFor(canvas); scene.environmentIntensity = 1.0;
    keyLights(scene, { shadowSize: 3, intensity: 2.4, dir: [2, 5, 6] });
    const L = makeLogoSlab(textures.logo);
    scene.add(L.group);
    const shadow = blobShadow(4.2, 1.1, 0.16); shadow.position.y = -1.55; scene.add(shadow);
    const glow = blobShadow(4.4, 1.2, 0.0, '34,197,94'); glow.position.y = -1.54; scene.add(glow);
    const cam = mkCam(28);
    const sparks = makePoints(160); scene.add(sparks);
    const r = rng(7); const sp = [];
    for (let i = 0; i < 160; i++) { const a = r() * Math.PI * 2, e = (r() - 0.5) * 1.2; const v = 1.2 + r() * 2.8; sp.push([Math.cos(a) * Math.cos(e) * v, Math.sin(a) * Math.cos(e) * v * 0.8, Math.sin(e) * v * 0.6, 0.03 + r() * 0.06, r()]); }
    const tgt = new THREE.Vector3();
    const update = (t) => {
      const lt = t - t0;
      let dist = fitDistance(cam, 3.3, 2.3, portrait ? 0.74 : 0.5);
      if (mode === 'intro') {
        const f = spring(prog(t, 0.62, 1.9));
        L.group.scale.set(lerp(0.55, 1, f), lerp(0.55, 1, f), lerp(0.02, 1, easeOut(prog(t, 0.7, 1.5))));
        L.group.rotation.y = lerp(-1.25, -0.16, f) + 0.12 * easeInOut(prog(t, 1.5, 3.2));
        L.group.rotation.x = lerp(0.35, 0.04, f);
        L.face.material.opacity = easeOut(prog(t, 0.78, 1.35));
        L.group.visible = t > 0.6;
        L.group.position.set(0, (portrait ? 0.35 : 0.25) + 0.05 * Math.sin(lt * 1.5), lerp(0, 1.6, easeInOut(prog(t, 2.85, 3.25))));
        tgt.set(0, portrait ? -0.25 : -0.05, 0);
        orbit(cam, tgt, dist * lerp(1.12, 1.0, easeOut(prog(t, 0, 3))), lerp(0.12, -0.05, easeInOut(prog(t, 0.5, 3))), 0.06);
        // sparks at bolt impact
        const age = t - 0.74;
        const P = sparks.geometry.attributes.position.array, C = sparks.geometry.attributes.aColor.array, S = sparks.geometry.attributes.aSize.array, A = sparks.geometry.attributes.aAlpha.array;
        for (let i = 0; i < sp.length; i++) {
          const [vx, vy, vz, s, w] = sp[i]; const k = age > 0 ? 1 - Math.exp(-2.8 * age) : 0;
          P[i * 3] = vx * k * 1.2; P[i * 3 + 1] = 0.35 + vy * k * 1.2 - 0.3 * age * age; P[i * 3 + 2] = 0.3 + vz * k;
          const c = w > 0.5 ? hex3('#22c55e') : hex3('#86efac'); C.set(c, i * 3);
          S[i] = s; A[i] = age > 0 ? Math.max(0, 1 - age / (0.7 + w * 0.6)) : 0;
        }
        for (const k of ['position', 'aColor', 'aSize', 'aAlpha']) sparks.geometry.attributes[k].needsUpdate = true;
        L.rimMat.opacity = 0.35 + 0.65 * easeOut(prog(t, 1.0, 1.8));
        glow.material.opacity = 0.25 * easeOut(prog(t, 1, 2));
      } else {
        const f = spring(prog(t, 32.05, 33.0));
        const s = (portrait ? 0.95 : 0.78) * lerp(0.6, 1, f);
        L.group.scale.set(s, s, s * lerp(0.1, 1, f));
        L.group.rotation.y = lerp(0.9, -0.12, f) + 0.14 * easeInOut(prog(t, 32.6, 35));
        L.group.rotation.x = lerp(-0.2, 0.05, f);
        L.face.material.opacity = 1;
        L.group.position.set(portrait ? 0 : -1.05, portrait ? 1.0 : 0.15, 0);
        shadow.position.set(portrait ? 0 : -1.05, portrait ? -0.25 : -1.15, 0); shadow.scale.setScalar(portrait ? 0.82 : 0.7);
        glow.position.copy(shadow.position); glow.scale.copy(shadow.scale);
        tgt.set(0, 0, 0);
        dist = fitDistance(cam, 3.3, 2.3, portrait ? 0.74 : 0.5) * (portrait ? 1.0 : 1.0);
        orbit(cam, tgt, dist * lerp(1.06, 1.0, easeOut(prog(t, 32, 35))), 0.03, 0.04);
        // final sparkle around rim
        const pulse = Math.max(0, 1 - Math.abs(t - 34.15) / 0.35);
        L.rimMat.opacity = 0.6 + 0.4 * pulse;
        glow.material.opacity = 0.2 + 0.4 * pulse;
        sparks.visible = false;
      }
      pointScale(sparks, cam, H, dpr);
    };
    return { name: mode, canvas, t0, t1, scene, camera: cam, update, logo: L };
  }
  scenes.push(logoScene('A', 0, 3.25, 'intro'));

  /* S2a — reversible AC hero */
  {
    const canvas = 'B', t0 = 2.9, t1 = 8.55;
    const scene = new THREE.Scene(); scene.environment = envFor(canvas); scene.environmentIntensity = 0.9;
    keyLights(scene, { shadowSize: 3, intensity: 2.0, dir: [2.5, 5, 6] });
    const ac = makeAC(); scene.add(ac.group);
    const shadow = blobShadow(3.2, 0.9, 0.0); shadow.visible = false; scene.add(shadow);
    const cam = mkCam(30);
    // ribbons
    const ribbons = [];
    const rr = rng(3);
    for (let i = 0; i < 7; i++) {
      const x0 = -0.8 + i * (1.6 / 6) + (rr() - 0.5) * 0.08; const ph = rr() * 6;
      const rb = makeRibbon((u, v) => v.set(x0 * (1 + u * 0.6) + 0.06 * Math.sin(u * 5 + ph), -0.26 - 1.25 * Math.pow(u, 1.25) - 0.05 * u, 0.24 + 2.0 * u), 0.05 + rr() * 0.05);
      rb.material.uniforms.uPhase.value = rr(); rb.renderOrder = 2;
      scene.add(rb); ribbons.push(rb);
    }
    const N = 1500; const pts = makePoints(N); pts.renderOrder = 3; scene.add(pts);
    const pr = rng(11); const pd = [];
    for (let i = 0; i < N; i++) pd.push({ x: (pr() - 0.5) * 1.75, base: pr(), s: pr(), ph: pr() * 6.28, sp: 0.8 + pr() * 0.5 });
    const L = 1.9, E0 = 4.45, SW = 6.35;
    const cold = [hex3('#38bdf8'), hex3('#7dd3fc'), hex3('#bae6fd')], warm = [hex3('#fb923c'), hex3('#fdba74'), hex3('#f97316')];
    const tgt = new THREE.Vector3();
    const update = (t) => {
      const a = spring(prog(t, 2.95, 4.3));
      ac.group.rotation.y = lerp(-2.4, 0, a);
      ac.group.position.y = lerp(1.0, 0, a);
      ac.group.scale.setScalar(lerp(0.7, 1, a));
      ac.louverPivot.rotation.x = -0.95 * easeInOut(prog(t, 4.2, 4.9));
      shadow.material.opacity = 0.14 * a;
      const dist = fitDistance(cam, 2.25, 0.7, portrait ? 0.84 : 0.44);
      if (portrait) { tgt.set(0, -0.62, 0.3); cam.filmOffset = 0; } else { tgt.set(0, -0.45, 0.3); cam.filmOffset = -5.5; }
      orbit(cam, tgt, dist * lerp(1.18, 1.0, easeOut(prog(t, 2.9, 5))) , lerp(-0.38, 0.3, easeInOut(prog(t, 2.9, 8.5))), lerp(-0.12, 0.06, easeInOut(prog(t, 3, 8.5))));
      cam.updateProjectionMatrix();
      // ribbons
      const grow = clamp((t - 4.45) / 1.0, 0, 1.2);
      const warmFront = (t - SW) * 0.9;
      for (const rb of ribbons) { const u = rb.material.uniforms; u.uT.value = t; u.uOp.value = smooth(4.4, 4.8, t); u.uGrow.value = grow * 1.1; u.uWarm.value = warmFront; }
      // particles
      const P = pts.geometry.attributes.position.array, C = pts.geometry.attributes.aColor.array, S = pts.geometry.attributes.aSize.array, A = pts.geometry.attributes.aAlpha.array;
      for (let i = 0; i < N; i++) {
        const d = pd[i]; const rel = t - E0 - d.base * L;
        if (rel < 0) { A[i] = 0; continue; }
        const cyc = Math.floor(rel / L); const emit = E0 + d.base * L + cyc * L; const age = (t - emit) / L * d.sp;
        if (age > 1) { A[i] = 0; continue; }
        const s = age;
        P[i * 3] = d.x * (1 + s * 0.7) + 0.07 * Math.sin(s * 7 + d.ph);
        P[i * 3 + 1] = -0.27 - 1.3 * Math.pow(s, 1.25) + 0.05 * Math.sin(s * 9 + d.ph);
        P[i * 3 + 2] = 0.24 + 2.1 * s + 0.05 * Math.cos(s * 5 + d.ph);
        const isWarm = emit > SW; const pal = isWarm ? warm : cold; C.set(pal[Math.floor(d.s * 2.99)], i * 3);
        S[i] = (0.018 + d.s * 0.035) * (1 + s * 1.4);
        A[i] = smooth(0, 0.08, s) * (1 - smooth(0.55, 1, s)) * 0.85 * smooth(4.45, 4.7, t);
      }
      for (const k of ['position', 'aColor', 'aSize', 'aAlpha']) pts.geometry.attributes[k].needsUpdate = true;
      pointScale(pts, cam, H, dpr);
    };
    scenes.push({ name: 'ac', canvas, t0, t1, scene, camera: cam, update, ac });
  }

  /* S2b — day / night split */
  {
    const canvas = 'A', t0 = 8.3, t1 = 10.45;
    const day = new THREE.Scene(); day.environment = envFor(canvas); day.environmentIntensity = 0.7;
    keyLights(day, { shadowSize: 4, intensity: 2.6, dir: [4, 6, 4], ambient: 0.5 });
    day.add(makeHouse(false));
    const ds = blobShadow(6.5, 5, 0.12); ds.position.y = -0.15; day.add(ds);
    const night = new THREE.Scene(); night.environment = envFor(canvas); night.environmentIntensity = 0.12;
    night.add(new THREE.HemisphereLight(0x6b7fb8, 0x101820, 0.5));
    const moon = new THREE.DirectionalLight(0x9db4ff, 0.7); moon.position.set(-3, 5, 3); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.radius = 4;
    Object.assign(moon.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); night.add(moon);
    night.add(makeHouse(true));
    const nGlow = glowSprite('255,170,80', 3.2, 0.45); nGlow.position.set(0.5, 0.5, 1.0); night.add(nGlow);
    const cam = mkCam(30); const tgt = new THREE.Vector3(0, portrait ? 0.7 : 1.15, 0);
    let split = 1;
    const update = (t) => {
      const dist = fitDistance(cam, 5.6, 2.6, portrait ? 0.82 : 0.46);
      orbit(cam, tgt, dist * lerp(1.1, 0.98, easeInOut(prog(t, 8.3, 10.45))), lerp(0.62, 0.38, easeInOut(prog(t, 8.3, 10.45))), 0.32);
      cam.filmOffset = portrait ? 0 : 0; cam.updateProjectionMatrix();
      split = lerp(1, 0.5, easeInOut(prog(t, 8.55, 9.25)));
      ctx.state.split = split;
    };
    const render = (r) => {
      const sx = Math.round(W * split);
      r.setScissorTest(true);
      r.setScissor(0, 0, sx, H); r.setViewport(0, 0, W, H); r.render(day, cam);
      r.setScissor(sx, 0, W - sx, H); r.render(night, cam);
      r.setScissorTest(false);
    };
    scenes.push({ name: 'house', canvas, t0, t1, scene: day, night, camera: cam, update, render });
  }

  /* S3 — exploded installation */
  {
    const canvas = 'B', t0 = 11.95, t1 = 16.25;
    const scene = new THREE.Scene(); scene.environment = envFor(canvas); scene.environmentIntensity = 0.8;
    const lights = keyLights(scene, { shadowSize: 4, intensity: 2.2, dir: [3, 4, 6], ambient: 0.45 });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: '#f3f5f4', roughness: 0.95 }));
    wall.position.z = -0.36; wall.receiveShadow = true; scene.add(wall);
    const ac = makeAC(); const od = makeOutdoor();
    const acPos = portrait ? new THREE.Vector3(0, 1.05, -0.13) : new THREE.Vector3(-1.35, 0.35, -0.13);
    const odPos = portrait ? new THREE.Vector3(0.25, -1.0, 0) : new THREE.Vector3(1.45, -0.25, 0);
    ac.group.position.copy(acPos); od.group.position.copy(odPos);
    scene.add(ac.group, od.group);
    // refrigerant lines
    const p0 = acPos.clone().add(new THREE.Vector3(0.95, -0.22, -0.12));
    const p1 = odPos.clone().add(new THREE.Vector3(0.56, 0.05, -0.05));
    const mid = portrait ? [new THREE.Vector3(1.15, p0.y - 0.1, -0.3), new THREE.Vector3(1.15, p1.y + 0.4, -0.3)] : [new THREE.Vector3(p0.x + 0.35, p0.y - 0.1, -0.3), new THREE.Vector3(p1.x + 0.2, p0.y - 0.1, -0.3), new THREE.Vector3(p1.x + 0.25, p1.y + 0.35, -0.3)];
    const tubes = [];
    const tubeMat = new THREE.MeshStandardMaterial({ color: '#22C55E', emissive: '#22C55E', emissiveIntensity: 0.55, roughness: 0.35 });
    for (const off of [0, 0.065]) {
      const pts = [p0, ...mid, p1].map((p, i) => p.clone().add(new THREE.Vector3(off, off * 0.3, 0)));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
      const geo = new THREE.TubeGeometry(curve, 200, 0.022, 12, false);
      const m = new THREE.Mesh(geo, tubeMat); m.castShadow = true; scene.add(m); tubes.push(m);
    }
    const tipGlow = glowSprite('34,197,94', 0.5, 0.9); scene.add(tipGlow);
    const tipCurve = tubes[0].geometry.parameters.path;
    const cam = mkCam(30); const tgt = new THREE.Vector3();
    const parts = [
      [ac.back, 12.15, [0, 0, 0.6]], [ac.body, 12.3, [0, 0, 1.6]], [ac.slot, 12.3, [0, 0, 1.6]], [ac.panel, 12.5, [0, 0.2, 2.4]], [ac.louverPivot, 12.65, [0, -0.4, 2.8]],
      [od.brackets, 12.4, [0, -0.3, 0.8]], [od.casing, 12.55, [0, 0, 1.6]], [od.top, 12.8, [0, 0.7, 0.6]], [od.fan, 12.75, [0, 0, 2.0]], [od.grille, 12.9, [-0.3, 0, 2.4]], [od.side, 13.0, [0.9, 0, 1.2]],
    ];
    for (const p of parts) p.push(p[0].position.clone(), p[0].rotation.clone());
    const update = (t) => {
      for (const [o, ts, off, base, rot] of parts) {
        const f = spring(prog(t, ts, ts + 0.75));
        o.position.set(base.x + off[0] * (1 - f), base.y + off[1] * (1 - f), base.z + off[2] * (1 - f));
        o.rotation.set(rot.x + 0.6 * (1 - f), rot.y - 0.5 * (1 - f), rot.z);
        o.scale.setScalar(lerp(0.0001, 1, Math.min(1, prog(t, ts, ts + 0.2) * 1.0)) );
        o.visible = t >= ts;
      }
      ac.louverPivot.rotation.x = -0.5 * easeInOut(prog(t, 13.6, 14.2));
      od.blades.rotation.z = -Math.max(0, t - 13.6) * 9;
      const tp = easeInOut(prog(t, 13.25, 14.2));
      for (const m of tubes) { const n = m.geometry.index.count; m.geometry.setDrawRange(0, Math.floor(n * tp / 6) * 6); m.visible = tp > 0.001; }
      tipGlow.visible = tp > 0.001 && tp < 0.999; tipCurve.getPointAt(Math.min(tp, 0.999), tipGlow.position); tipGlow.position.z += 0.05;
      const dist = fitDistance(cam, portrait ? 2.4 : 4.6, portrait ? 3.3 : 1.9, portrait ? 0.72 : 0.62);
      tgt.set(portrait ? 0.15 : 0.05, portrait ? 0.32 : 0.15, 0);
      orbit(cam, tgt, dist * lerp(1.0, 1.1, easeInOut(prog(t, 12, 16.2))), lerp(-0.3, 0.22, easeInOut(prog(t, 11.95, 16.25))), lerp(0.1, 0.02, easeInOut(prog(t, 12, 16))));
    };
    scenes.push({ name: 'pose', canvas, t0, t1, scene, camera: cam, update });
  }

  /* S4 — EV charger (detailed) */
  {
    const canvas = 'A', t0 = 15.95, t1 = 21.25;
    const scene = new THREE.Scene(); scene.environment = envFor(canvas); scene.environmentIntensity = 0.85;
    scene.fog = new THREE.Fog('#f4f6f5', 12, 28);
    keyLights(scene, { shadowSize: 5, intensity: 2.4, dir: [-3, 7, 5], ambient: 0.45 });
    // driveway: large pavers + gravel strip along the facade
    const paveTex = canvasTexture(1024, 1024, (c, w, h) => {
      c.fillStyle = '#b9bdb9'; c.fillRect(0, 0, w, h);
      const rr = rng(8);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) { const v = 206 + Math.floor(rr() * 12); c.fillStyle = `rgb(${v},${v + 2},${v + 1})`; c.fillRect(x * w / 2 + 5, y * h / 4 + 5, w / 2 - 10, h / 4 - 10); }
      for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(0,0,0,${rr() * 0.035})`; c.fillRect(rr() * w, rr() * h, 2, 2); }
    });
    paveTex.wrapS = paveTex.wrapT = THREE.RepeatWrapping; paveTex.repeat.set(14, 7);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ map: paveTex, roughness: 0.85 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const gravel = new THREE.Mesh(new THREE.BoxGeometry(30, 0.03, 0.38), new THREE.MeshStandardMaterial({ color: '#c9ccc7', roughness: 1 }));
    gravel.position.set(0, 0.015, -1.4); gravel.receiveShadow = true; scene.add(gravel);
    // facade (fine render texture) + anthracite plinth
    const renderTex = canvasTexture(1024, 1024, (c, w, h) => { c.fillStyle = '#f5f5f1'; c.fillRect(0, 0, w, h); const rr = rng(2); for (let i = 0; i < 9000; i++) { c.fillStyle = rr() > 0.5 ? `rgba(0,0,0,${rr() * 0.03})` : `rgba(255,255,255,${rr() * 0.5})`; c.fillRect(rr() * w, rr() * h, 2, 2); } });
    renderTex.wrapS = renderTex.wrapT = THREE.RepeatWrapping; renderTex.repeat.set(8, 4);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 0.3), new THREE.MeshStandardMaterial({ map: renderTex, roughness: 0.9 }));
    wall.position.set(0, 4, -1.75); wall.receiveShadow = true; wall.castShadow = true; scene.add(wall);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(16, 0.22, 0.04), new THREE.MeshStandardMaterial({ color: '#3a3f44', roughness: 0.7 }));
    plinth.position.set(0, 0.11, -1.58); plinth.receiveShadow = true; scene.add(plinth);
    // sectional garage door with panels, grooves, frame, handle
    const doorG = new THREE.Group(); doorG.position.set(1.0, 0, -1.6); scene.add(doorG);
    const frameM = new THREE.MeshStandardMaterial({ color: '#2f3439', roughness: 0.5 });
    const fr = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameM); m.position.set(x, y, 0.04); m.castShadow = true; doorG.add(m); };
    fr(3.2, 0.1, 0, 2.38); fr(0.1, 2.38, -1.55, 1.19); fr(0.1, 2.38, 1.55, 1.19);
    const panelM = new THREE.MeshPhysicalMaterial({ color: '#4e565e', roughness: 0.45, clearcoat: 0.3 });
    for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.455, 0.05), panelM); p.position.set(0, 0.24 + i * 0.465, 0.025); p.receiveShadow = true; doorG.add(p);
      for (let k = 0; k < 2; k++) { const gr = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.006, 0.004), new THREE.MeshBasicMaterial({ color: '#3d444b' })); gr.position.set(0, 0.24 + i * 0.465 + (k ? 0.08 : -0.08), 0.052); doorG.add(gr); } }
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.03), new THREE.MeshPhysicalMaterial({ color: '#c9ced1', metalness: 0.9, roughness: 0.25 })); handle.position.set(0, 0.95, 0.07); doorG.add(handle);
    // wallbox + protection box + conduit
    const BX = -2.35, BY = 1.15, WZ = -1.6;
    const wb = makeWallbox(); wb.group.position.set(BX, BY, WZ); scene.add(wb.group);
    const coffret = makeCoffret(); coffret.position.set(BX, BY + 0.72, WZ); scene.add(coffret);
    scene.add(makeConduit([new THREE.Vector3(BX, BY + 0.66, WZ + 0.04), new THREE.Vector3(BX, BY + 0.14, WZ + 0.04)]));
    scene.add(makeConduit([new THREE.Vector3(BX - 0.08, BY + 0.78, WZ + 0.04), new THREE.Vector3(BX - 0.08, 3.6, WZ + 0.04)]));
    const ringGlow = glowSprite('34,197,94', 0.32, 0); ringGlow.position.set(BX, BY + 0.055, WZ + 0.16); scene.add(ringGlow);
    // wall lamp + warm wash
    const lamp = makeApplique(); lamp.position.set(-0.75, 2.05, WZ); scene.add(lamp);
    const lampGlow = glowSprite('255,236,200', 0.9, 0.55); lampGlow.position.set(-0.75, 2.05, WZ + 0.12); scene.add(lampGlow);
    const lampLight = new THREE.PointLight('#ffe2b0', 1.2, 2.5, 1.6); lampLight.position.set(-0.75, 2.05, WZ + 0.25); scene.add(lampLight);
    // planters
    const pl1 = makePlanter(1.1); pl1.position.set(-3.75, 0, -1.32); pl1.visible = portrait; scene.add(pl1);
    const pl2 = makePlanter(0.6); pl2.position.set(3.2, 0, -1.32); scene.add(pl2);
    // car
    const car = makeCar(); car.group.position.set(0.55, 0, 0.05); scene.add(car.group);
    const carShadow = blobShadow(5.6, 2.6, 0.35); carShadow.position.set(0.55, 0.005, 0.05); scene.add(carShadow);
    // Type 2 connector + live cable
    const plug = makeType2(); scene.add(plug.group);
    const cableMat = new THREE.MeshPhysicalMaterial({ color: '#23292e', roughness: 0.5, clearcoat: 0.4 });
    let cable = new THREE.Mesh(new THREE.BufferGeometry(), cableMat); cable.castShadow = true; scene.add(cable);
    const N = 220; const pts = makePoints(N); scene.add(pts);
    const portGlow = glowSprite('34,197,94', 0.7, 0); scene.add(portGlow);
    const gland = new THREE.Vector3(BX - 0.05, BY - 0.23, WZ + 0.07);
    const dock = new THREE.Vector3(BX + 0.18, BY - 0.07 - 0.03, WZ + 0.06);
    const UP = new THREE.Vector3(0, 1, 0), IN = new THREE.Vector3(0, 0, -1);
    const qa = new THREE.Quaternion(), qb = new THREE.Quaternion().setFromUnitVectors(UP, IN), qDock = new THREE.Quaternion();
    const cam = mkCam(30); const tgt = new THREE.Vector3(); const tmp = new THREE.Vector3(); const tail = new THREE.Vector3(); const pos = new THREE.Vector3();
    let curve = null;
    const update = (t) => {
      const a = easeOutQuint(prog(t, 15.95, 17.1));
      car.group.position.x = 0.55 + lerp(5.0, 0, a);
      for (const w of car.wheels) w.rotation.z = -lerp(5.0, 0, a) / 0.36;
      carShadow.position.x = car.group.position.x;
      car.group.updateMatrixWorld(true);
      const portW = car.port.getWorldPosition(new THREE.Vector3());
      car.flapPivot.rotation.y = -1.6 * easeInOut(prog(t, 17.2, 17.6));
      // LED: off → green, then breathing while charging
      const on = smooth(16.45, 16.75, t), chg = smooth(18.45, 18.7, t);
      const breath = 0.75 + 0.25 * Math.sin((t - 18.45) * 5.5);
      const lv = on * (chg ? lerp(1, breath, chg) : 1);
      wb.ledMat.color.setRGB(lerp(0.16, 0.13 * lv + 0.05, on), lerp(0.2, 0.77 * lv + 0.1, on), lerp(0.19, 0.37 * lv + 0.05, on));
      ringGlow.material.opacity = on * 0.8 * lv;
      // connector path
      const pull = easeInOut(prog(t, 17.3, 17.6)), travel = easeInOut(prog(t, 17.6, 18.35)), insert = easeOut(prog(t, 18.35, 18.45));
      const p0 = dock, p1 = dock.clone().add(new THREE.Vector3(0, -0.16, 0.18));
      const end = portW.clone().add(new THREE.Vector3(0, 0, 0.09 - 0.045 * insert));
      const mid = new THREE.Vector3((p1.x + end.x) / 2 - 0.2, 1.05, (p1.z + end.z) / 2 + 0.3);
      if (travel <= 0) pos.lerpVectors(p0, p1, pull);
      else { const u = travel; pos.set(0, 0, 0).addScaledVector(p1, (1 - u) * (1 - u)).addScaledVector(mid, 2 * u * (1 - u)).addScaledVector(end, u * u); }
      plug.group.position.copy(pos);
      plug.group.quaternion.copy(qDock).slerp(qb, travel);
      plug.group.updateMatrixWorld(true);
      tail.copy(plug.tailLocal).applyMatrix4(plug.group.matrixWorld);
      const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(plug.group.quaternion);
      const s2 = travel;
      const lv3 = (x, y) => new THREE.Vector3().lerpVectors(x, y, s2);
      const cps = [gland, new THREE.Vector3(BX - 0.07, 0.55, WZ + 0.14),
        lv3(new THREE.Vector3(BX - 0.02, 0.18, WZ + 0.3), new THREE.Vector3(BX - 0.12, 0.035, -0.6)),
        lv3(new THREE.Vector3(BX + 0.16, 0.3, WZ + 0.22), new THREE.Vector3(BX + 0.05, 0.035, 0.6)),
        lv3(tail.clone().addScaledVector(dir, -0.22), new THREE.Vector3(portW.x - 0.25, 0.3, portW.z + 0.45)),
        tail.clone()];
      curve = new THREE.CatmullRomCurve3(cps, false, 'centripetal');
      cable.geometry.dispose(); cable.geometry = new THREE.TubeGeometry(curve, 180, 0.024, 10, false);
      car.portRing.material.color.set(t > 18.45 ? '#22C55E' : '#9ca3af');
      portGlow.position.copy(portW).add(new THREE.Vector3(0, 0, 0.05));
      portGlow.material.opacity = t > 18.45 ? 0.45 + 0.35 * Math.sin((t - 18.45) * 8) : 0;
      // energy particles along the cable (borne → car)
      const P = pts.geometry.attributes.position.array, C = pts.geometry.attributes.aColor.array, S = pts.geometry.attributes.aSize.array, A = pts.geometry.attributes.aAlpha.array;
      const flow = smooth(18.5, 18.8, t) * (1 - smooth(20.95, 21.25, t));
      for (let i = 0; i < N; i++) {
        const u = ((i / N) + (t - 18.5) * 0.45) % 1;
        curve.getPointAt(Math.max(0, Math.min(1, u)), tmp);
        const j = (i * 7919 % 100) / 100;
        P[i * 3] = tmp.x + (j - 0.5) * 0.04; P[i * 3 + 1] = tmp.y + 0.03 + ((i * 31 % 100) / 100 - 0.5) * 0.04; P[i * 3 + 2] = tmp.z + 0.02;
        C.set(j > 0.5 ? hex3('#22c55e') : hex3('#86efac'), i * 3); S[i] = 0.025 + j * 0.04; A[i] = flow * (0.6 + 0.4 * Math.sin(u * 40 + t * 10));
      }
      for (const k of ['position', 'aColor', 'aSize', 'aAlpha']) pts.geometry.attributes[k].needsUpdate = true;
      // camera: detail close-up on the charger, then pull back to reveal the car
      const k = easeInOut(prog(t, 16.9, 18.7));
      const wideD = fitDistance(cam, portrait ? 3.8 : 6.4, portrait ? 3.0 : 2.6, 0.85) * lerp(1.04, 0.97, easeInOut(prog(t, 18.7, 21.2)));
      const closeD = portrait ? 2.7 : 1.8;
      const cT = portrait ? new THREE.Vector3(BX + 0.16, BY + 0.36, WZ + 0.1) : new THREE.Vector3(BX + 0.1, BY + 0.22, WZ + 0.1), wT = new THREE.Vector3(portrait ? -1.2 : -0.5, portrait ? 0.95 : 0.8, 0);
      tgt.lerpVectors(cT, wT, k);
      const az = lerp(-0.42 + 0.12 * prog(t, 16, 17), -0.48, k) + 0.14 * easeInOut(prog(t, 18.7, 21.2));
      orbit(cam, tgt, lerp(closeD, wideD, k), az, lerp(0.06, 0.15, k));
      cam.filmOffset = portrait ? 0 : lerp(-3.5, -6.6, k); cam.updateProjectionMatrix();
      pointScale(pts, cam, H, dpr);
    };
    qDock.identity();
    scenes.push({ name: 'borne', canvas, t0, t1, scene, camera: cam, update });
  }

  /* S6 — service-area map */
  {
    const canvas = 'B', t0 = 27.95, t1 = 32.25;
    const scene = new THREE.Scene(); scene.environment = envFor(canvas); scene.environmentIntensity = 0.9;
    keyLights(scene, { shadowSize: 3, intensity: 2.0, dir: [2, 6, 4], ambient: 0.6 });
    const S = 6; // 6 units = 300 km  →  1 unit = 50 km
    const kmx = (lon) => (lon - 1.909) * 74.4 / 50, kmy = (lat) => -(lat - 47.902) * 111 / 50;
    const mapTex = canvasTexture(2048, 2048, (c, w, h) => {
      const P = (lon, lat) => [w / 2 + kmx(lon) / S * w, h / 2 + kmy(lat) / S * h];
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
      // soft land patches
      const rr = rng(5);
      for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(34,197,94,${0.04 + rr() * 0.06})`; c.beginPath(); c.ellipse(rr() * w, rr() * h, 60 + rr() * 200, 40 + rr() * 140, rr() * 3, 0, Math.PI * 2); c.fill(); }
      // forest (Orléans forest)
      c.fillStyle = 'rgba(34,197,94,0.10)'; c.beginPath(); const [fx, fy] = P(2.2, 47.98); c.ellipse(fx, fy, 260, 90, -0.2, 0, Math.PI * 2); c.fill();
      // Loire
      const loire = [[3.0, 47.35], [2.93, 47.41], [2.74, 47.64], [2.63, 47.69], [2.375, 47.766], [2.12, 47.86], [1.909, 47.896], [1.7, 47.83], [1.63, 47.78], [1.335, 47.586], [1.0, 47.43], [0.69, 47.39], [0.3, 47.33]];
      c.strokeStyle = '#a7f3d0'; c.lineWidth = 22; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); loire.forEach(([lo, la], i) => { const [x, y] = P(lo, la); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
      c.strokeStyle = '#6ee7b7'; c.lineWidth = 6; c.stroke();
      // motorways
      const roads = [[[1.909, 47.902], [2.0, 48.1], [2.15, 48.4], [2.35, 48.85]], [[1.909, 47.902], [1.6, 47.75], [1.2, 47.55], [0.69, 47.39]], [[1.909, 47.902], [1.98, 47.6], [2.07, 47.22], [2.4, 47.08]], [[1.909, 47.902], [2.3, 47.95], [2.733, 47.997], [3.1, 48.1]], [[1.909, 47.902], [1.6, 48.0], [1.338, 48.07], [1.489, 48.446]], [[1.909, 47.902], [2.252, 48.172], [2.6, 48.4]]];
      for (const r of roads) { c.strokeStyle = '#cfd6d2'; c.lineWidth = 22; c.beginPath(); r.forEach(([lo, la], i) => { const [x, y] = P(lo, la); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.stroke(); }
      // towns
      const towns = [['Blois', 1.335, 47.586], ['Chartres', 1.489, 48.446], ['Montargis', 2.733, 47.997], ['Gien', 2.63, 47.69], ['Vierzon', 2.068, 47.222], ['Châteaudun', 1.338, 48.07], ['Pithiviers', 2.252, 48.172], ['Romorantin', 1.741, 47.358], ['Bourges', 2.398, 47.081], ['Tours', 0.69, 47.39], ['Paris', 2.352, 48.857]];
      c.font = '700 44px Montserrat'; c.textAlign = 'left'; c.textBaseline = 'middle';
      for (const [n, lo, la] of towns) { const [x, y] = P(lo, la); c.fillStyle = '#9ca3af'; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); c.fillStyle = '#4b5563'; c.fillText(n, x + 20, y + 2); }
      // edge fade
      const g = c.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.5);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    const alphaTex = canvasTexture(512, 512, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.5); g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    alphaTex.colorSpace = THREE.NoColorSpace;
    const map = new THREE.Mesh(new THREE.PlaneGeometry(S, S), new THREE.MeshStandardMaterial({ map: mapTex, alphaMap: alphaTex, transparent: true, roughness: 0.9 }));
    map.rotation.x = -Math.PI / 2; map.receiveShadow = true; scene.add(map);
    const fill = new THREE.Mesh(new THREE.CircleGeometry(1, 128), new THREE.MeshBasicMaterial({ color: '#22C55E', transparent: true, opacity: 0.1, depthWrite: false }));
    fill.rotation.x = -Math.PI / 2; fill.position.y = 0.004; scene.add(fill);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 160), new THREE.MeshBasicMaterial({ color: '#16a34a', transparent: true, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.006; scene.add(ring);
    const pulses = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 64), new THREE.MeshBasicMaterial({ color: '#22C55E', transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.008; scene.add(m); return m; });
    const pin = new THREE.Group();
    const pinMat = new THREE.MeshPhysicalMaterial({ color: '#22C55E', roughness: 0.25, clearcoat: 1 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 48, 32), pinMat); head.position.y = 0.52; head.castShadow = true;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 48), pinMat); cone.rotation.x = Math.PI; cone.position.y = 0.3; cone.castShadow = true;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 32, 16), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.2 })); dot.position.set(0, 0.52, 0.12);
    pin.add(head, cone, dot); scene.add(pin);
    const pinShadow = blobShadow(0.5, 0.5, 0.35); pinShadow.position.y = 0.01; scene.add(pinShadow);
    const cam = mkCam(32); const tgt = new THREE.Vector3();
    const R = 2; // 100 km
    const update = (t) => {
      const d = spring(prog(t, 28.25, 29.0));
      pin.position.y = lerp(2.2, 0, d); pin.rotation.y = (t - 28) * 1.4;
      pinShadow.material.opacity = 0.35 * d; pinShadow.scale.setScalar(lerp(2, 1, d));
      const r = R * easeOut(prog(t, 28.85, 29.9));
      ring.scale.setScalar(Math.max(r, 0.0001)); fill.scale.setScalar(Math.max(r, 0.0001));
      ring.visible = fill.visible = r > 0.001;
      pulses.forEach((p, i) => { const ph = ((t - 28.9) * 0.9 + i / 3) % 1; const on = t > 28.9 ? 1 : 0; p.scale.setScalar(0.05 + ph * 0.9); p.material.opacity = on * (1 - ph) * 0.5; });
      const dist = fitDistance(cam, 4.6, portrait ? 4.6 : 2.6, portrait ? 0.95 : 0.6);
      tgt.set(0, 0, portrait ? 0.2 : 0.1);
      orbit(cam, tgt, dist * lerp(1.15, 0.98, easeInOut(prog(t, 28, 32.2))), lerp(-0.35, 0.2, easeInOut(prog(t, 28, 32.2))), lerp(1.05, 0.88, easeInOut(prog(t, 28, 32))));
      cam.filmOffset = portrait ? 0 : -5.0; cam.updateProjectionMatrix();
      ctx.state.mapLabel = { p: new THREE.Vector3(0, 0, r), cam, on: smooth(29.5, 29.9, t) };
    };
    scenes.push({ name: 'map', canvas, t0, t1, scene, camera: cam, update });
  }

  scenes.push(logoScene('A', 31.95, 35.1, 'end'));
  return scenes;
}
