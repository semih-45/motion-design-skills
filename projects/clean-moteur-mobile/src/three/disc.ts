// 3D cross-drilled brake disc with brand-red caliper.
import * as THREE from 'three';

export type DiscPoseT = {pos: THREE.Vector3; rx: number; ry: number; spin: number; scale: number; face: number};
export type DiscBuild = {root: THREE.Group; update: (f: number, pose: DiscPoseT) => void; holes: {r: number; a: number}[]};

const machinedTexture = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8f959d';
  g.fillRect(0, 0, 512, 512);
  // concentric machining rings
  for (let r = 60; r < 256; r += 1.5) {
    const v = 130 + Math.floor(40 * Math.sin(r * 1.7) * Math.sin(r * 0.13));
    g.strokeStyle = `rgb(${v},${v + 4},${v + 10})`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(256, 256, r, 0, Math.PI * 2);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const DISC_HOLES = (() => {
  const holes: {r: number; a: number}[] = [];
  const rows = [0.58, 0.7, 0.82];
  for (let k = 0; k < 14; k++)
    rows.forEach((r, i) => {
      holes.push({r, a: ((k + i * 0.33) / 14) * Math.PI * 2});
    });
  return holes;
})();

export const buildDisc = (): DiscBuild => {
  const root = new THREE.Group();
  const spinner = new THREE.Group();
  root.add(spinner);

  const outer = 1;
  const inner = 0.4;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  for (const h of DISC_HOLES) {
    const p = new THREE.Path();
    p.absarc(Math.cos(h.a) * h.r, Math.sin(h.a) * h.r, 0.038, 0, Math.PI * 2, true);
    shape.holes.push(p);
  }
  const discGeo = new THREE.ExtrudeGeometry(shape, {depth: 0.07, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 64});
  discGeo.translate(0, 0, -0.035);
  // planar UVs for the machined texture
  const pos = discGeo.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) * 0.5 + 0.5;
    uv[i * 2 + 1] = pos.getY(i) * 0.5 + 0.5;
  }
  discGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const steel = new THREE.MeshStandardMaterial({color: '#ffffff', map: machinedTexture(), metalness: 1, roughness: 0.3, envMapIntensity: 1.35});
  spinner.add(new THREE.Mesh(discGeo, steel));

  // hat / bell
  const hatShape = new THREE.Shape();
  hatShape.absarc(0, 0, 0.43, 0, Math.PI * 2, false);
  const bore = new THREE.Path();
  bore.absarc(0, 0, 0.12, 0, Math.PI * 2, true);
  hatShape.holes.push(bore);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + Math.PI / 2;
    const p = new THREE.Path();
    p.absarc(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.04, 0, Math.PI * 2, true);
    hatShape.holes.push(p);
  }
  const hatGeo = new THREE.ExtrudeGeometry(hatShape, {depth: 0.16, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 48});
  const hat = new THREE.Mesh(hatGeo, new THREE.MeshStandardMaterial({color: '#3a3f47', metalness: 0.9, roughness: 0.35}));
  hat.position.z = 0.02;
  spinner.add(hat);

  // caliper (does not spin)
  const cal = new THREE.Shape();
  const a0 = Math.PI * 0.12;
  const a1 = Math.PI * 0.44;
  cal.absarc(0, 0, 1.13, a0, a1, false);
  cal.absarc(0, 0, 0.74, a1, a0, true);
  const calGeo = new THREE.ExtrudeGeometry(cal, {depth: 0.26, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4, curveSegments: 24});
  calGeo.translate(0, 0, -0.13);
  const caliperMat = new THREE.MeshPhysicalMaterial({color: '#E3262E', metalness: 0.15, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05});
  const caliper = new THREE.Mesh(calGeo, caliperMat);
  root.add(caliper);
  // small white "badge" stripe on the caliper
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.01), new THREE.MeshBasicMaterial({color: '#ffffff'}));
  const am = (a0 + a1) / 2;
  badge.position.set(Math.cos(am) * 0.94, Math.sin(am) * 0.94, 0.185);
  badge.rotation.z = am - Math.PI / 2;
  root.add(badge);

  const update = (_f: number, pose: DiscPoseT) => {
    root.position.copy(pose.pos);
    root.rotation.set(pose.rx, pose.ry, 0);
    root.scale.setScalar(pose.scale);
    spinner.rotation.z = pose.spin;
    caliper.visible = pose.face < 0.98;
    badge.visible = caliper.visible;
    const k = 1 - pose.face;
    caliperMat.opacity = k;
    caliperMat.transparent = k < 1;
  };
  return {root, update, holes: DISC_HOLES};
};
