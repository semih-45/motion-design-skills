import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTexture } from './three-common.js';

export const GREEN = new THREE.Color('#22C55E');

const M = {
  whiteGloss: () => new THREE.MeshPhysicalMaterial({ color: '#f7f8f7', roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.18 }),
  whiteSatin: () => new THREE.MeshPhysicalMaterial({ color: '#eceeed', roughness: 0.5, clearcoat: 0.3 }),
  dark: () => new THREE.MeshStandardMaterial({ color: '#1d2226', roughness: 0.6 }),
  grey: () => new THREE.MeshStandardMaterial({ color: '#c9cdcb', roughness: 0.55, metalness: 0.1 }),
};

function rbox(w, h, d, r, mat) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, r), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* ───────── Indoor wall split (modelled after the Daikin / Atlantic units in the photos) ───────── */
export function makeAC() {
  const g = new THREE.Group();
  const back = box(1.7, 0.5, 0.02, M.grey()); back.position.set(0, 0, -0.215);
  const body = rbox(2.0, 0.62, 0.36, 0.08, M.whiteSatin()); body.position.set(0, 0, -0.02);
  const panel = rbox(2.03, 0.45, 0.06, 0.03, M.whiteGloss()); panel.position.set(0, 0.085, 0.17);
  // dark outlet slot + vertical vanes
  const slot = new THREE.Group();
  const slotPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.82, 0.11), new THREE.MeshStandardMaterial({ color: '#181c1f', roughness: 0.9 }));
  slotPlane.position.set(0, -0.228, 0.161);
  slot.add(slotPlane);
  const vaneMat = new THREE.MeshStandardMaterial({ color: '#3a4146', roughness: 0.7 });
  for (let i = 0; i < 26; i++) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.09, 0.03), vaneMat);
    v.position.set(-0.86 + i * 0.069, -0.228, 0.165); slot.add(v);
  }
  // louver (flap)
  const louverPivot = new THREE.Group(); louverPivot.position.set(0, -0.172, 0.185);
  const louver = rbox(1.86, 0.115, 0.016, 0.006, M.whiteGloss()); louver.position.set(0, -0.058, 0);
  louverPivot.add(louver);
  // display (22°)
  const dispTex = canvasTexture(512, 192, (c, w, h) => {
    c.fillStyle = '#0c1013';
    const r = 60; c.beginPath(); c.roundRect(0, 0, w, h, r); c.fill();
    c.fillStyle = '#7dd3fc'; c.shadowColor = '#38bdf8'; c.shadowBlur = 24;
    c.font = '700 120px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('22°', w / 2 - 40, h / 2 + 6);
    c.shadowColor = '#22c55e'; c.fillStyle = '#4ade80';
    c.beginPath(); c.arc(w - 70, h / 2, 16, 0, Math.PI * 2); c.fill();
  });
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.075), new THREE.MeshBasicMaterial({ map: dispTex, transparent: true, toneMapped: false }));
  disp.position.set(0.8, -0.01, 0.2015);
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(1.98, 0.004), new THREE.MeshBasicMaterial({ color: '#cfd4d2' }));
  seam.position.set(0, 0.2, 0.2012);
  panel.add(seam); seam.position.set(0, 0.11, 0.0302);
  const panelGroup = new THREE.Group(); panelGroup.add(panel, disp);
  g.add(back, body, slot, louverPivot, panelGroup);
  g.name = 'Clim_murale'; back.name = 'Clim_plaque_murale'; body.name = 'Clim_corps'; slot.name = 'Clim_sortie_air'; panelGroup.name = 'Clim_facade'; panel.name = 'Clim_facade_panneau'; louverPivot.name = 'Clim_volet'; louver.name = 'Clim_volet_lame'; disp.name = 'Clim_ecran_22';
  return { group: g, back, body, slot, panel: panelGroup, louverPivot, disp };
}

/* ───────── Outdoor unit (Fujitsu / Samsung style) ───────── */
export function makeOutdoor() {
  const g = new THREE.Group();
  const casing = rbox(1.0, 0.72, 0.34, 0.03, new THREE.MeshPhysicalMaterial({ color: '#ebecea', roughness: 0.45, clearcoat: 0.3 }));
  const fanG = new THREE.Group(); fanG.position.set(-0.17, 0, 0.171);
  const recess = new THREE.Mesh(new THREE.CircleGeometry(0.29, 64), new THREE.MeshStandardMaterial({ color: '#23292d', roughness: 0.8 }));
  fanG.add(recess);
  const blades = new THREE.Group(); blades.position.z = 0.004;
  const bladeShape = new THREE.Shape(); bladeShape.ellipse(0.13, 0, 0.13, 0.055, 0, Math.PI * 2);
  const bladeMat = new THREE.MeshStandardMaterial({ color: '#4a535a', roughness: 0.5, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.ShapeGeometry(bladeShape), bladeMat); b.rotation.z = i * Math.PI * 2 / 3; blades.add(b); }
  const hub = new THREE.Mesh(new THREE.CircleGeometry(0.05, 32), new THREE.MeshStandardMaterial({ color: '#60696f' })); hub.position.z = 0.006; blades.add(hub);
  fanG.add(blades);
  // grille (instanced bars)
  const grille = new THREE.Group();
  const bar = new THREE.BoxGeometry(1, 1, 1);
  const gm = new THREE.MeshStandardMaterial({ color: '#d9dcda', roughness: 0.4, metalness: 0.2 });
  const nV = 21, nH = 22; const inst = new THREE.InstancedMesh(bar, gm, nV + nH);
  const m4 = new THREE.Matrix4(); let k = 0;
  for (let i = 0; i < nV; i++) { m4.compose(new THREE.Vector3(-0.47 + i * 0.03, 0, 0.183), new THREE.Quaternion(), new THREE.Vector3(0.006, 0.66, 0.006)); inst.setMatrixAt(k++, m4); }
  for (let i = 0; i < nH; i++) { m4.compose(new THREE.Vector3(-0.17, -0.33 + i * 0.0314, 0.19), new THREE.Quaternion(), new THREE.Vector3(0.62, 0.006, 0.006)); inst.setMatrixAt(k++, m4); }
  inst.castShadow = true; grille.add(inst);
  const frame = rbox(0.64, 0.68, 0.012, 0.004, gm); frame.position.set(-0.17, 0, 0.177); frame.scale.set(1, 1, 0.5);
  // make frame hollow-looking: use 4 border bars
  frame.visible = false;
  const side = rbox(0.33, 0.7, 0.02, 0.01, new THREE.MeshPhysicalMaterial({ color: '#f1f2f0', roughness: 0.4, clearcoat: 0.4 }));
  side.position.set(0.32, 0, 0.175);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.05), new THREE.MeshBasicMaterial({ color: '#22C55E', toneMapped: false }));
  label.position.set(0, 0.22, 0.0105); side.add(label);
  const top = box(1.03, 0.03, 0.37, new THREE.MeshPhysicalMaterial({ color: '#f2f3f1', roughness: 0.4 })); top.position.set(0, 0.375, 0);
  g.add(casing, fanG, grille, side, top);
  // wall brackets
  const brackets = new THREE.Group();
  const bm = new THREE.MeshStandardMaterial({ color: '#b9bdbb', roughness: 0.4, metalness: 0.5 });
  for (const x of [-0.36, 0.36]) {
    const arm = box(0.05, 0.035, 0.6, bm); arm.position.set(x, -0.378, -0.05);
    const up = box(0.05, 0.42, 0.035, bm); up.position.set(x, -0.58, -0.335);
    const diag = box(0.035, 0.5, 0.035, bm); diag.position.set(x, -0.55, -0.2); diag.rotation.x = 0.62;
    brackets.add(arm, up, diag);
  }
  g.add(brackets);
  g.name = 'Groupe_exterieur'; casing.name = 'Groupe_ext_caisson'; fanG.name = 'Groupe_ext_ventilateur'; blades.name = 'Groupe_ext_helice'; grille.name = 'Groupe_ext_grille'; side.name = 'Groupe_ext_panneau_lateral'; top.name = 'Groupe_ext_capot'; brackets.name = 'Groupe_ext_supports_muraux';
  return { group: g, casing, fan: fanG, blades, grille, side, top, brackets };
}

/* ───────── Modern house (day / night) ───────── */
export function makeHouse(night) {
  const g = new THREE.Group();
  const lawn = rbox(5.2, 0.14, 3.8, 0.06, new THREE.MeshStandardMaterial({ color: night ? '#2c4a39' : '#d4ecd6', roughness: 0.95 }));
  lawn.position.y = -0.07; g.add(lawn);
  const white = new THREE.MeshStandardMaterial({ color: '#f6f6f3', roughness: 0.7 });
  const anth = new THREE.MeshStandardMaterial({ color: '#3a4046', roughness: 0.6 });
  const gf = box(2.9, 1.0, 1.6, white); gf.position.set(0.1, 0.5, -0.2); g.add(gf);
  const uf = box(2.0, 0.85, 1.9, anth); uf.position.set(-0.45, 1.45, -0.05); g.add(uf);
  const r1 = box(3.05, 0.06, 1.75, white); r1.position.set(0.1, 1.03, -0.2); g.add(r1);
  const r2 = box(2.15, 0.07, 2.05, white); r2.position.set(-0.45, 1.91, -0.05); g.add(r2);
  const glass = night
    ? new THREE.MeshStandardMaterial({ color: '#ffd59a', emissive: '#ffae4d', emissiveIntensity: 2.4, roughness: 0.3 })
    : new THREE.MeshPhysicalMaterial({ color: '#2a3a44', roughness: 0.04, metalness: 0.3, clearcoat: 1 });
  const w1 = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.78), glass); w1.position.set(0.55, 0.47, 0.602); g.add(w1);
  const w2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.52), glass); w2.position.set(-0.45, 1.45, 0.902); g.add(w2);
  const w3 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.78), glass); w3.position.set(-0.75, 0.47, 0.602); g.add(w3);
  // mullions
  const mul = new THREE.MeshStandardMaterial({ color: '#2b3035' });
  for (const x of [0.05, 0.55, 1.05]) { const m = box(0.03, 0.78, 0.02, mul); m.position.set(x, 0.47, 0.61); g.add(m); }
  { const m = box(0.03, 0.52, 0.02, mul); m.position.set(-0.45, 1.45, 0.91); g.add(m); }
  // terrace + path
  const terr = box(3.2, 0.04, 0.9, new THREE.MeshStandardMaterial({ color: night ? '#5b6168' : '#e9e7e2', roughness: 0.8 }));
  terr.position.set(0.15, 0.02, 1.05); g.add(terr);
  // outdoor AC unit on the side wall
  const ac = rbox(0.42, 0.32, 0.16, 0.02, new THREE.MeshPhysicalMaterial({ color: '#eeeeec', roughness: 0.4 }));
  ac.position.set(1.62, 0.28, 0.25); ac.rotation.y = Math.PI / 2; g.add(ac);
  const acFan = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), new THREE.MeshStandardMaterial({ color: '#2b3236' }));
  acFan.position.set(1.705, 0.28, 0.3); acFan.rotation.y = Math.PI / 2; g.add(acFan);
  // trees
  const leaf = new THREE.MeshStandardMaterial({ color: night ? '#3f7a55' : '#7fcf95', roughness: 0.8 });
  const trunk = new THREE.MeshStandardMaterial({ color: '#7b6450' });
  for (const [x, z, s] of [[-2.1, 0.9, 1], [2.05, -1.1, 1.2], [-1.9, -1.2, 0.8]]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.5 * s, 8), trunk); t.position.set(x, 0.25 * s, z); t.castShadow = true;
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38 * s, 2), leaf); f.position.set(x, 0.75 * s, z); f.castShadow = true; f.receiveShadow = true;
    g.add(t, f);
  }
  g.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; } });
  if (night) {
    const p1 = new THREE.PointLight('#ffad5c', 4, 4, 1.5); p1.position.set(0.5, 0.5, 1.3); g.add(p1);
    const p2 = new THREE.PointLight('#ffad5c', 2.5, 3, 1.5); p2.position.set(-0.45, 1.4, 1.5); g.add(p2);
  }
  g.name = night ? 'Maison_nuit' : 'Maison_jour';
  return g;
}

/* ───────── Electric car (clean, Tesla-like clay design) ───────── */
export function makeCar() {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  const pts = [[-2.28, 0.34], [-2.32, 0.56], [-2.26, 0.82], [-2.02, 0.95], [-1.1, 0.99], [0.95, 0.99], [1.7, 0.87], [2.2, 0.74], [2.34, 0.58], [2.3, 0.36], [2.15, 0.24]];
  s.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) s.lineTo(...pts[i]);
  // front arch
  s.lineTo(1.93, 0.24); s.absarc(1.45, 0.36, 0.48, Math.atan2(-0.12, 0.48), Math.PI - Math.atan2(-0.12, 0.48) , false);
  s.lineTo(-0.97, 0.24);
  s.absarc(-1.45, 0.36, 0.48, Math.atan2(-0.12, 0.48), Math.PI - Math.atan2(-0.12, 0.48), false);
  s.lineTo(-2.2, 0.25);
  s.closePath();
  const depth = 1.62;
  const bodyGeo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.09, bevelSegments: 8, curveSegments: 32 });
  bodyGeo.translate(0, 0, -depth / 2);
  const paint = new THREE.MeshPhysicalMaterial({ color: '#f5f6f5', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06 });
  const body = new THREE.Mesh(bodyGeo, paint); body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const c = new THREE.Shape();
  c.moveTo(-1.98, 0.9); c.bezierCurveTo(-1.6, 1.2, -1.2, 1.38, -0.55, 1.42); c.lineTo(0.2, 1.41);
  c.bezierCurveTo(0.55, 1.36, 0.85, 1.12, 1.08, 0.92); c.closePath();
  const cd = 1.32;
  const cabGeo = new THREE.ExtrudeGeometry(c, { depth: cd, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.08, bevelSegments: 8, curveSegments: 32 });
  cabGeo.translate(0, 0, -cd / 2);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#0f1418', roughness: 0.04, metalness: 0.4, clearcoat: 1 });
  const cab = new THREE.Mesh(cabGeo, glass); cab.castShadow = true; g.add(cab);
  // B-pillar hint
  const pill = box(0.07, 0.42, 1.6, paint); pill.position.set(-0.35, 1.13, 0); pill.rotation.z = 0.12; pill.scale.set(1, 1, 1);
  // wheels
  const tireM = new THREE.MeshStandardMaterial({ color: '#1a1c1e', roughness: 0.85 });
  const rimM = new THREE.MeshPhysicalMaterial({ color: '#2d3236', roughness: 0.25, metalness: 0.8 });
  const capM = new THREE.MeshPhysicalMaterial({ color: '#d7dbdc', roughness: 0.2, metalness: 0.9 });
  const wheels = [];
  for (const x of [-1.45, 1.45]) for (const z of [-0.9, 0.9]) {
    const w = new THREE.Group(); w.position.set(x, 0.36, z);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.095, 20, 48), tireM); tire.castShadow = true;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.16, 48), rimM); rim.rotation.x = Math.PI / 2;
    w.add(tire, rim);
    const sign = Math.sign(z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.02, 48), capM); cap.rotation.x = Math.PI / 2; cap.position.z = sign * 0.085; w.add(cap);
    for (let i = 0; i < 5; i++) { const sp = box(0.03, 0.2, 0.01, rimM); sp.rotation.z = i * Math.PI * 2 / 5; sp.position.z = sign * 0.097; sp.translateY(0.1); w.add(sp); }
    g.add(w); wheels.push(w);
  }
  // lights
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 1.5), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
  head.position.set(2.29, 0.7, 0); head.rotation.z = -0.5; g.add(head);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 1.7), new THREE.MeshBasicMaterial({ color: '#ff3b3b', toneMapped: false }));
  tail.position.set(-2.33, 0.78, 0); g.add(tail);
  // handles & mirror
  for (const x of [-0.75, 0.35]) { const h = box(0.25, 0.03, 0.02, glass); h.position.set(x, 0.86, 0.985); g.add(h); }
  const mir = rbox(0.2, 0.1, 0.18, 0.04, paint); mir.position.set(0.85, 1.02, 0.98); g.add(mir);
  // charge port (rear left, visible side +z)
  const port = new THREE.Group(); port.position.set(-1.98, 0.84, 0.97);
  const portRing = new THREE.Mesh(new THREE.CircleGeometry(0.06, 32), new THREE.MeshBasicMaterial({ color: '#22C55E', toneMapped: false }));
  port.add(portRing); g.add(port);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.name = 'Voiture_electrique'; body.name = 'Voiture_carrosserie'; cab.name = 'Voiture_vitres'; port.name = 'Voiture_prise_recharge'; wheels.forEach((w, i) => (w.name = 'Voiture_roue_' + (i + 1)));
  return { group: g, wheels, port, portRing, head };
}

/* ───────── Wall charger (inspired by the Legrand Green'Up in the photos) ───────── */
export function makeBorne() {
  const g = new THREE.Group();
  const w = 0.34, h = 0.6, r = w / 2;
  const s = new THREE.Shape();
  s.moveTo(-r, -h / 2 + r); s.lineTo(-r, h / 2 - r); s.absarc(0, h / 2 - r, r, Math.PI, 0, true); s.lineTo(r, -h / 2 + r); s.absarc(0, -h / 2 + r, r, 0, Math.PI, true);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 6, curveSegments: 48 });
  const shell = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#3d4753', roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3 }));
  shell.castShadow = true; g.add(shell);
  const barMat = new THREE.MeshBasicMaterial({ color: '#1f2a24', toneMapped: false });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.01), barMat); bar.position.set(0, 0.07, 0.087); g.add(bar);
  const sensor = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 12, 32), new THREE.MeshStandardMaterial({ color: '#2a323b' })); sensor.position.set(0, 0.15, 0.088); g.add(sensor);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 48), new THREE.MeshPhysicalMaterial({ color: '#36404b', roughness: 0.4 }));
  sock.rotation.x = Math.PI / 2; sock.position.set(0, -0.14, 0.095); g.add(sock);
  g.name = 'Borne_recharge'; shell.name = 'Borne_coque'; bar.name = 'Borne_barre_lumineuse'; sock.name = 'Borne_prise';
  return { group: g, bar, barMat };
}

/* ───────── Logo slab (official logo image on a glossy black tile) ───────── */
export function makeLogoSlab(tex) {
  const g = new THREE.Group();
  const W = 3.0, H = 3.0 * 785 / 1206;
  const slab = new THREE.Mesh(new RoundedBoxGeometry(W + 0.16, H + 0.16, 0.2, 6, 0.1), new THREE.MeshPhysicalMaterial({ color: '#050605', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, metalness: 0.2 }));
  slab.castShadow = true;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }));
  face.position.z = 0.101;
  // green rim line
  const rr = new THREE.Shape(); const rw = W / 2 + 0.11, rh = H / 2 + 0.11, rad = 0.12;
  rr.moveTo(-rw + rad, -rh); rr.lineTo(rw - rad, -rh); rr.quadraticCurveTo(rw, -rh, rw, -rh + rad); rr.lineTo(rw, rh - rad); rr.quadraticCurveTo(rw, rh, rw - rad, rh);
  rr.lineTo(-rw + rad, rh); rr.quadraticCurveTo(-rw, rh, -rw, rh - rad); rr.lineTo(-rw, -rh + rad); rr.quadraticCurveTo(-rw, -rh, -rw + rad, -rh);
  const hole = new THREE.Path(); const iw = rw - 0.025, ih = rh - 0.025, ir = rad - 0.02;
  hole.moveTo(-iw + ir, -ih); hole.lineTo(iw - ir, -ih); hole.quadraticCurveTo(iw, -ih, iw, -ih + ir); hole.lineTo(iw, ih - ir); hole.quadraticCurveTo(iw, ih, iw - ir, ih);
  hole.lineTo(-iw + ir, ih); hole.quadraticCurveTo(-iw, ih, -iw, ih - ir); hole.lineTo(-iw, -ih + ir); hole.quadraticCurveTo(-iw, -ih, -iw + ir, -ih);
  rr.holes.push(hole);
  const rimMat = new THREE.MeshBasicMaterial({ color: '#22C55E', toneMapped: false, transparent: true });
  const rim = new THREE.Mesh(new THREE.ShapeGeometry(rr, 12), rimMat); rim.position.z = 0.102;
  g.add(slab, face, rim);
  g.name = 'Logo_plaque_3D'; slab.name = 'Logo_plaque'; face.name = 'Logo_image'; rim.name = 'Logo_liseret_vert';
  return { group: g, slab, face, rim, rimMat, W, H };
}
