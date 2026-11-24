// Procedural mid-size sedan, built from lofted cross-sections (no external assets).
// x = forward (nose at +2.35), y = up, z = side (the camera sees the +z side).
// Returns realistic meshes + "blueprint" (x-ray) counterparts sharing the same geometry.
import * as THREE from 'three';

// ---------- small math helpers ----------
type P2 = [number, number];

/** Monotone cubic interpolation through control points (no overshoot). */
const monotone = (pts: P2[]) => {
  const n = pts.length;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ---------- dimensions ----------
export const CAR = {
  L: 4.7,
  half: 2.35,
  halfW: 0.915,
  wheelR: 0.335,
  tireW: 0.225,
  trackZ: 0.785,
  axleF: 1.38,
  axleR: -1.42,
  archR: 0.425,
};

const yTop = monotone([
  [-2.35, 0.78],
  [-2.31, 0.92],
  [-2.24, 1.0],
  [-2.12, 1.04],
  [-1.8, 1.05],
  [-1.4, 1.045],
  [-1.2, 1.03],
  [-0.4, 1.005],
  [0.4, 0.985],
  [0.8, 0.965],
  [0.98, 0.94],
  [1.5, 0.895],
  [2.0, 0.84],
  [2.2, 0.79],
  [2.3, 0.72],
  [2.35, 0.6],
]);

const yBot = monotone([
  [-2.35, 0.44],
  [-2.27, 0.34],
  [-2.05, 0.28],
  [-1.7, 0.215],
  [1.7, 0.205],
  [2.1, 0.25],
  [2.3, 0.32],
  [2.35, 0.4],
]);

const halfWidth = (x: number) => {
  const front = x > 0;
  const u = Math.min(1, Math.abs(x) / CAR.half);
  const p = front ? 4.2 : 6.5;
  const plan = Math.pow(Math.max(0, 1 - Math.pow(u, p)), 1 / p);
  // slightly narrower at the very nose & tail top, wide hips at rear wheels
  const hips = 1 + 0.012 * Math.exp(-Math.pow((x - CAR.axleR) / 0.6, 2));
  return CAR.halfW * plan * hips;
};

const bayDepth = (x: number) => 0.4 * smoothstep(0.84, 0.98, x) * (1 - smoothstep(1.92, 2.04, x));

const archY = (x: number) => {
  let y = -10;
  for (const xa of [CAR.axleF, CAR.axleR]) {
    const dx = x - xa;
    if (Math.abs(dx) < CAR.archR) y = Math.max(y, CAR.wheelR + Math.sqrt(CAR.archR * CAR.archR - dx * dx));
  }
  return y;
};

export const topY = (x: number, z: number) => {
  const w = halfWidth(x);
  return yTop(x) - 0.05 * Math.pow(Math.min(1, Math.abs(z) / Math.max(w, 0.01)), 2);
};

// ---------- body cross-section ----------
type SecPt = {z: number; y: number; dark: number; seg: string};

const lineSeg = (a: P2, b: P2, n: number, out: SecPt[], dark: number, seg: string, skipFirst = true) => {
  for (let i = skipFirst ? 1 : 0; i < n; i++) {
    const t = i / (n - 1);
    out.push({z: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, dark, seg});
  }
};

const bodySection = (x: number): SecPt[] => {
  const w = halfWidth(x);
  const d = bayDepth(x);
  const yb = yBot(x);
  const zB = Math.min(0.6, w * 0.68);
  const zE = w * 0.86;
  const ty = (z: number) => topY(x, z);
  const pts: SecPt[] = [];
  const bayDark = d > 0.02 ? 1 : 0;
  // A: bay floor (or top surface) centre -> zB
  for (let i = 0; i < 7; i++) {
    const z = (zB * i) / 6;
    pts.push({z, y: ty(z) - d, dark: bayDark, seg: 'A'});
  }
  // B: bay wall up
  lineSeg([zB, ty(zB) - d], [zB + 0.012, ty(zB + 0.012)], 5, pts, bayDark, 'B');
  // C: fender / top surface
  for (let i = 1; i < 6; i++) {
    const z = zB + 0.012 + ((zE - zB - 0.012) * i) / 5;
    pts.push({z, y: ty(z), dark: 0, seg: 'C'});
  }
  // D: shoulder (superellipse quarter)
  const yE = ty(zE);
  const ys = ty(w) - 0.1;
  for (let i = 1; i < 8; i++) {
    const phi = (i / 7) * (Math.PI / 2);
    const n = 3.2;
    const s = Math.pow(Math.sin(phi), 2 / n);
    const c = Math.pow(Math.cos(phi), 2 / n);
    pts.push({z: zE + (w - zE) * s, y: ys + (yE - ys) * c, dark: 0, seg: 'D'});
  }
  // E: side wall down to cut height (arch or rocker)
  const ylo = yb + 0.17;
  const aY = archY(x);
  const yCut = Math.max(ylo, aY);
  const wE = w - 0.03;
  for (let i = 1; i < 10; i++) {
    const t = i / 9;
    const z = w + 0.014 * Math.sin(Math.PI * t * 0.9) - 0.03 * t * t;
    pts.push({z, y: ys + (yCut - ys) * t, dark: 0, seg: 'E'});
  }
  // F: lower corner
  const yW = Math.max(yb, aY);
  for (let i = 1; i < 5; i++) {
    const phi = (i / 4) * (Math.PI / 2);
    pts.push({
      z: wE - 0.08 * (1 - Math.cos(phi)),
      y: yCut - (yCut - yW) * Math.sin(phi),
      dark: aY > yb ? 0.6 : 0.3,
      seg: 'F',
    });
  }
  // G: wheel-well ceiling inward, then inner wall down
  const zIn = 0.655;
  lineSeg([wE - 0.08, yW], [zIn, yW], 4, pts, 1, 'G');
  lineSeg([zIn, yW], [zIn - 0.01, yb], 3, pts, 1, 'G');
  // H: underbody to centre
  lineSeg([zIn - 0.01, yb], [0, yb], 4, pts, 1, 'H');
  return pts;
};

// ---------- loft builder ----------
type Loft = {geo: THREE.BufferGeometry; ringCount: number; stations: number[]; rings: THREE.Vector3[][]};

const buildLoft = (
  stations: number[],
  section: (x: number) => SecPt[],
  closeRing: boolean,
  classify?: (x: number, s: number, seg: string) => number,
): Loft & {groups: number} => {
  const rings: THREE.Vector3[][] = [];
  const darks: number[][] = [];
  const segs: string[][] = [];
  for (const x of stations) {
    const half = section(x);
    // full ring: right half (z>=0) then mirrored left half (reverse, without the two centre points)
    const ring: THREE.Vector3[] = [];
    const dk: number[] = [];
    const sg: string[] = [];
    for (const p of half) {
      ring.push(new THREE.Vector3(x, p.y, p.z));
      dk.push(p.dark);
      sg.push(p.seg);
    }
    if (closeRing) {
      for (let i = half.length - 2; i >= 1; i--) {
        const p = half[i];
        ring.push(new THREE.Vector3(x, p.y, -p.z));
        dk.push(p.dark);
        sg.push(p.seg);
      }
    } else {
      // open section mirrored: left side first then right
      const left: THREE.Vector3[] = [];
      const ldk: number[] = [];
      const lsg: string[] = [];
      for (let i = half.length - 1; i >= 1; i--) {
        const p = half[i];
        left.push(new THREE.Vector3(x, p.y, -p.z));
        ldk.push(p.dark);
        lsg.push(p.seg);
      }
      ring.unshift(...left);
      dk.unshift(...ldk);
      sg.unshift(...lsg);
    }
    rings.push(ring);
    darks.push(dk);
    segs.push(sg);
  }
  const R = rings[0].length;
  const pos: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  for (let j = 0; j < rings.length; j++) {
    for (let i = 0; i < R; i++) {
      const v = rings[j][i];
      pos.push(v.x, v.y, v.z);
      const c = 1 - darks[j][i] * 0.93;
      col.push(c, c, c);
      uv.push(j / (rings.length - 1), i / (R - 1));
    }
  }
  const groupsIdx: number[][] = [[], []];
  const segCount = closeRing ? R : R - 1;
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < segCount; i++) {
      const i2 = (i + 1) % R;
      const a = j * R + i;
      const b = j * R + i2;
      const c = (j + 1) * R + i;
      const d = (j + 1) * R + i2;
      const g = classify ? classify((stations[j] + stations[j + 1]) / 2, (i + 0.5) / segCount, segs[j][i]) : 0;
      // winding chosen so normals face outward for our ring order
      groupsIdx[g].push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const index = [...groupsIdx[0], ...groupsIdx[1]];
  geo.setIndex(index);
  geo.addGroup(0, groupsIdx[0].length, 0);
  if (groupsIdx[1].length) geo.addGroup(groupsIdx[0].length, groupsIdx[1].length, 1);
  geo.computeVertexNormals();
  return {geo, ringCount: R, stations, rings, groups: groupsIdx[1].length ? 2 : 1};
};

const stationList = (a: number, b: number, n: number, extra: number[] = []) => {
  const xs: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // cosine spacing → dense at ends
    xs.push(a + (b - a) * (0.5 - 0.5 * Math.cos(Math.PI * t)));
  }
  for (const e of extra) if (e > a && e < b) xs.push(e);
  xs.sort((p, q) => p - q);
  return xs.filter((x, i) => i === 0 || x - xs[i - 1] > 0.0008);
};

// ---------- greenhouse (cabin glass + roof/pillars) ----------
const G_FRONT = 0.8;
const G_REAR = -1.33;
const yRoof = monotone([
  [-1.33, 1.03],
  [-1.25, 1.1],
  [-1.12, 1.21],
  [-0.95, 1.335],
  [-0.75, 1.405],
  [-0.5, 1.425],
  [-0.25, 1.418],
  [0.0, 1.375],
  [0.25, 1.27],
  [0.55, 1.1],
  [0.8, 0.965],
]);

const GH_ROOF = 6;
const GH_CORNER = 7;
const GH_SIDE = 8;

const greenSection = (x: number): SecPt[] => {
  const yb = yTop(x) - 0.004;
  const yr = Math.max(yb + 0.002, yRoof(x));
  const h = yr - yb;
  const w = halfWidth(x);
  const wb = w * 0.86 - 0.025;
  const wr = wb - 0.16;
  const rc = Math.min(0.11, h * 0.45);
  const pts: SecPt[] = [];
  for (let i = 0; i < GH_ROOF; i++) {
    const z = ((wr - rc) * i) / (GH_ROOF - 1);
    pts.push({z, y: yr - 0.035 * Math.pow(z / wr, 2) * Math.min(1, h / 0.2), dark: 0, seg: 'R'});
  }
  const cy = yr - 0.035 * Math.pow((wr - rc) / wr, 2) * Math.min(1, h / 0.2) - rc;
  for (let i = 1; i <= GH_CORNER; i++) {
    const phi = (i / GH_CORNER) * (Math.PI / 2) * 0.82;
    pts.push({z: wr - rc + rc * Math.sin(phi), y: cy + rc * Math.cos(phi), dark: 0, seg: 'K'});
  }
  const last = pts[pts.length - 1];
  for (let i = 1; i <= GH_SIDE; i++) {
    const t = i / GH_SIDE;
    pts.push({z: last.z + (wb - last.z) * t + 0.01 * Math.sin(Math.PI * t), y: last.y + (yb - last.y) * t, dark: 0, seg: 'S'});
  }
  return pts;
};

// ---------- materials ----------
export type CarMaterials = ReturnType<typeof makeCarMaterials>;

export const makeCarMaterials = () => {
  const paint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0f4ee6'),
    metalness: 0.62,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    vertexColors: true,
    envMapIntensity: 0.95,
  });
  const paintSolid = paint.clone();
  paintSolid.vertexColors = false;
  const glass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#04070d'),
    metalness: 0.0,
    roughness: 0.14,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.55,
  });
  const chrome = new THREE.MeshStandardMaterial({color: '#e6ebf2', metalness: 1, roughness: 0.14});
  const rim = new THREE.MeshStandardMaterial({color: '#c7ccd4', metalness: 1, roughness: 0.24});
  const rimDark = new THREE.MeshStandardMaterial({color: '#2b2f36', metalness: 0.9, roughness: 0.35});
  const tire = new THREE.MeshStandardMaterial({color: '#141619', metalness: 0, roughness: 0.88});
  const plastic = new THREE.MeshStandardMaterial({color: '#0c0e12', metalness: 0.2, roughness: 0.42});
  const caliper = new THREE.MeshPhysicalMaterial({color: '#E3262E', metalness: 0.2, roughness: 0.3, clearcoat: 1});
  const disc = new THREE.MeshStandardMaterial({color: '#8d939b', metalness: 1, roughness: 0.38});
  const headlight = new THREE.MeshBasicMaterial({color: new THREE.Color(1.6, 1.75, 2.0), toneMapped: false});
  const lampHousing = new THREE.MeshPhysicalMaterial({color: '#0a0d12', metalness: 0.6, roughness: 0.08, clearcoat: 1});
  const taillight = new THREE.MeshBasicMaterial({color: new THREE.Color(2.2, 0.12, 0.15), toneMapped: false});
  const engineMetal = new THREE.MeshStandardMaterial({color: '#6d737c', metalness: 0.85, roughness: 0.42});
  const engineDark = new THREE.MeshStandardMaterial({color: '#1d2026', metalness: 0.5, roughness: 0.5});
  const cast = new THREE.MeshStandardMaterial({color: '#7a5a44', metalness: 0.8, roughness: 0.45});
  const pipe = new THREE.MeshStandardMaterial({color: '#8b8f96', metalness: 0.9, roughness: 0.32});
  const seat = new THREE.MeshStandardMaterial({color: '#0b0c10', metalness: 0, roughness: 0.8, envMapIntensity: 0.3});
  const hoodUnder = new THREE.MeshStandardMaterial({color: '#20242c', metalness: 0.3, roughness: 0.6, side: THREE.BackSide});
  const all = [
    paint, paintSolid, glass, chrome, rim, rimDark, tire, plastic, caliper, disc, lampHousing, engineMetal, engineDark, cast, pipe, seat, hoodUnder,
  ];
  return {paint, paintSolid, glass, chrome, rim, rimDark, tire, plastic, caliper, disc, headlight, lampHousing, taillight, engineMetal, engineDark, cast, pipe, seat, hoodUnder, all};
};

// ---------- blueprint (x-ray) materials ----------
/** Additive colour that leaves canvas alpha untouched (the canvas is composited over the 2D background). */
export const glowBlend = <T extends THREE.Material>(m: T, useSrcAlpha = false): T => {
  m.blending = THREE.CustomBlending;
  m.blendEquation = THREE.AddEquation;
  m.blendSrc = useSrcAlpha ? THREE.SrcAlphaFactor : THREE.OneFactor;
  m.blendDst = THREE.OneFactor;
  m.blendEquationAlpha = THREE.AddEquation;
  m.blendSrcAlpha = THREE.ZeroFactor;
  m.blendDstAlpha = THREE.OneFactor;
  m.transparent = true;
  m.depthWrite = false;
  return m;
};

const ghostVert = /* glsl */ `
  #include <common>
  #include <clipping_planes_pars_vertex>
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`;
const ghostFrag = /* glsl */ `
  #include <common>
  #include <clipping_planes_pars_fragment>
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uBase;
  uniform float uPower;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    #include <clipping_planes_fragment>
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    f = pow(f, uPower);
    float a = (uBase + f * 1.25) * uOpacity;
    gl_FragColor = vec4(uColor * a, 1.0);
  }
`;

export const makeGhost = (color: string, base = 0.05, power = 2.2) =>
  glowBlend(new THREE.ShaderMaterial({
    uniforms: {
      uColor: {value: new THREE.Color(color)},
      uOpacity: {value: 1},
      uBase: {value: base},
      uPower: {value: power},
    },
    vertexShader: ghostVert,
    fragmentShader: ghostFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    clipping: true,
  }));

export const makeWireMat = (color: string, opacity: number) =>
  glowBlend(
    new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      depthWrite: false,
    }),
    true,
  );

/** Isoparametric "blueprint" lines from a loft: every kStation-th ring + every kRing-th longitudinal. */
const loftWires = (loft: Loft, kStation: number, kRing: number, closeRing: boolean) => {
  const pts: number[] = [];
  const {rings} = loft;
  const R = rings[0].length;
  const push = (a: THREE.Vector3, b: THREE.Vector3) => pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  // cross-section rings (pick evenly in x, not in index, so spacing looks regular)
  const xs = loft.stations;
  const x0 = xs[0];
  const x1 = xs[xs.length - 1];
  const nLines = Math.max(2, Math.round((x1 - x0) / kStation));
  const chosen = new Set<number>();
  for (let k = 0; k <= nLines; k++) {
    const target = x0 + ((x1 - x0) * k) / nLines;
    let best = 0;
    for (let j = 0; j < xs.length; j++) if (Math.abs(xs[j] - target) < Math.abs(xs[best] - target)) best = j;
    chosen.add(best);
  }
  for (const j of chosen) {
    const seg = closeRing ? R : R - 1;
    for (let i = 0; i < seg; i++) push(rings[j][i], rings[j][(i + 1) % R]);
  }
  for (let i = 0; i < R; i += kRing) {
    for (let j = 0; j < rings.length - 1; j++) push(rings[j][i], rings[j + 1][i]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
};

// ---------- the car ----------
export type PartName = 'head' | 'egr' | 'turbo' | 'fap' | 'muffler' | 'exhaust' | 'block' | 'misc';

export type CarBuild = {
  root: THREE.Group; // add to scene; apply turntable transform here
  real: THREE.Group; // realistic layer
  ghost: THREE.Group; // blueprint layer
  hoodPivotReal: THREE.Group;
  hoodPivotGhost: THREE.Group;
  mats: CarMaterials;
  ghostBody: THREE.ShaderMaterial;
  wireMat: THREE.LineBasicMaterial;
  partGhosts: Record<PartName, THREE.ShaderMaterial>;
  partWires: Record<PartName, THREE.LineBasicMaterial>;
  exhaustCurve: THREE.CatmullRomCurve3; // engine → tailpipe (car-local)
  realMaterials: THREE.Material[];
  ghostMaterials: THREE.Material[];
};

const roundedBox = (w: number, h: number, d: number, r: number) => {
  // cheap rounded box: box with bevelled edges via ExtrudeGeometry of rounded rect
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(shape, {depth: d - 2 * r * 0.6, bevelEnabled: true, bevelSize: r * 0.6, bevelThickness: r * 0.6, bevelSegments: 3, curveSegments: 4});
  g.translate(0, 0, -(d - 2 * r * 0.6) / 2);
  return g;
};

export const buildCar = (): CarBuild => {
  const mats = makeCarMaterials();
  const root = new THREE.Group();
  const real = new THREE.Group();
  const ghost = new THREE.Group();
  root.add(real, ghost);

  const ghostBody = makeGhost('#3f8cff', 0.035, 2.4);
  const wireMat = makeWireMat('#5aa0ff', 0.55);
  const ghostGlass = makeGhost('#3f8cff', 0.02, 2.0);

  const mk = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], parent: THREE.Object3D = real) => {
    const m = new THREE.Mesh(geo, mat);
    parent.add(m);
    return m;
  };

  // --- body ---
  const extras: number[] = [];
  for (const xa of [CAR.axleF, CAR.axleR]) {
    extras.push(xa - CAR.archR - 0.003, xa - CAR.archR + 0.003, xa + CAR.archR - 0.003, xa + CAR.archR + 0.003);
    for (let k = -6; k <= 6; k++) extras.push(xa + (k / 6.5) * CAR.archR);
  }
  extras.push(0.84, 0.9, 0.98, 1.92, 1.98, 2.04);
  const bodyStations = stationList(-CAR.half, CAR.half, 150, extras);
  const body = buildLoft(bodyStations, bodySection, true);
  mk(body.geo, mats.paint);
  const bodyGhostMesh = new THREE.Mesh(body.geo, ghostBody);
  ghost.add(bodyGhostMesh);
  ghost.add(new THREE.LineSegments(loftWires(body, 0.2, 6, true), wireMat));

  // --- greenhouse: glass + painted roof/pillars via material groups ---
  const ghStations = stationList(G_REAR, G_FRONT, 56, [-0.02, -0.82, -0.36, -0.42]);
  const ghTotal = GH_ROOF + GH_CORNER + GH_SIDE; // points per half
  const green = buildLoft(ghStations, greenSection, false, (x, s, seg) => {
    // s is 0..1 across the full open section (left side → roof → right side)
    const sh = Math.abs(s - 0.5) * 2; // 0 at roof centre, 1 at belt
    const cornerA = (GH_ROOF - 1) / (ghTotal - 1);
    const cornerB = (GH_ROOF + GH_CORNER - 1) / (ghTotal - 1);
    const inRoofX = x < -0.02 && x > -0.86;
    if (sh <= cornerA + 0.02 && inRoofX) return 1; // roof panel
    if (sh > cornerA - 0.01 && sh < cornerB + 0.03) return 1; // A/C pillar frame
    // C-pillar (slanted) and quarter in front of the door glass
    const xC = -0.86 - (sh - cornerB) * 0.55;
    if (sh >= cornerB && x < xC) return 1;
    if (sh >= cornerB && x > 0.66 - (sh - cornerB) * 0.2) return 1;
    void seg;
    return 0;
  });
  mk(green.geo, [mats.glass, mats.paint]);
  ghost.add(new THREE.Mesh(green.geo, ghostGlass));
  ghost.add(new THREE.LineSegments(loftWires(green, 0.25, 4, false), wireMat));

  // B-pillar (piano black) on both sides
  for (const sgn of [1, -1]) {
    const x = -0.39;
    const pts: THREE.Vector3[] = [];
    const sec = greenSection(x);
    for (let i = GH_ROOF + GH_CORNER - 1; i < sec.length; i++) pts.push(new THREE.Vector3(x, sec[i].y, sgn * (sec[i].z + 0.004)));
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 12, 0.04, 4, false);
    g.scale(1, 1, 0.12);
    mk(g, mats.plastic);
  }

  // chrome belt line + door seams + handles
  for (const sgn of [1, -1]) {
    const belt: THREE.Vector3[] = [];
    for (let x = 0.7; x >= -1.2; x -= 0.05) {
      const s = greenSection(x);
      const p = s[s.length - 1];
      belt.push(new THREE.Vector3(x, p.y + 0.008, sgn * (p.z + 0.012)));
    }
    mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(belt), 40, 0.007, 5, false), mats.chrome);
    for (const xs of [0.66, -0.43, -1.3]) {
      const sec = bodySection(xs);
      const seam = sec.filter((p) => p.seg === 'E' || p.seg === 'D').map((p) => new THREE.Vector3(xs, p.y, sgn * (p.z + 0.002)));
      if (seam.length > 2) mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam), 16, 0.0035, 3, false), mats.plastic);
    }
    for (const xh of [0.12, -0.95]) {
      const h = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.11, 4, 8), mats.chrome);
      h.rotation.z = Math.PI / 2;
      const zz = halfWidth(xh) + 0.012;
      h.position.set(xh, topY(xh, zz) - 0.13, sgn * zz);
      real.add(h);
    }
    // mirrors
    const mir = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), mats.paintSolid);
    mir.scale.set(0.9, 0.62, 1.1);
    mir.position.set(0.56, 1.03, sgn * (halfWidth(0.56) + 0.07));
    real.add(mir);
    const mirBase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.1), mats.plastic);
    mirBase.position.set(0.6, 0.99, sgn * (halfWidth(0.6) - 0.01));
    real.add(mirBase);
  }

  // --- hood (separate, hinged at the cowl) ---
  const hoodX0 = 0.86;
  const hoodX1 = 2.07;
  const hoodGeo = (() => {
    const nx = 26;
    const nz = 18;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let j = 0; j <= nx; j++) {
      const x = hoodX0 + ((hoodX1 - hoodX0) * j) / nx;
      const zmax = Math.min(0.64, halfWidth(x) * 0.71);
      for (let i = 0; i <= nz; i++) {
        const z = -zmax + (2 * zmax * i) / nz;
        pos.push(x - hoodX0, topY(x, z) + 0.006 - 0.955, z);
      }
    }
    for (let j = 0; j < nx; j++)
      for (let i = 0; i < nz; i++) {
        const a = j * (nz + 1) + i;
        const b = a + 1;
        const c = a + nz + 1;
        const d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const col = new Float32Array(pos.length).fill(1);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  })();
  const hoodPivotReal = new THREE.Group();
  hoodPivotReal.position.set(hoodX0, 0.955, 0);
  real.add(hoodPivotReal);
  const hoodTop = new THREE.Mesh(hoodGeo, mats.paint);
  hoodPivotReal.add(hoodTop);
  hoodPivotReal.add(new THREE.Mesh(hoodGeo, mats.hoodUnder));
  const hoodPivotGhost = new THREE.Group();
  hoodPivotGhost.position.copy(hoodPivotReal.position);
  ghost.add(hoodPivotGhost);
  hoodPivotGhost.add(new THREE.Mesh(hoodGeo, ghostBody));
  hoodPivotGhost.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.PlaneGeometry(1, 1, 1, 1)), wireMat));
  hoodPivotGhost.children[1].visible = false;

  // --- lights ---
  const ribbon = (xa: number, xb: number, segFilter: (p: SecPt, idx: number) => boolean, yOff: number, zOut: number, height: number, mat: THREE.Material, sgn: number) => {
    const pos: number[] = [];
    const idx: number[] = [];
    const n = 16;
    for (let j = 0; j <= n; j++) {
      const x = xa + ((xb - xa) * j) / n;
      const sec = bodySection(x).filter(segFilter);
      const p = sec[Math.floor(sec.length / 2)] ?? sec[0];
      if (!p) continue;
      const y = p.y + yOff;
      const z = sgn * (p.z + zOut);
      pos.push(x, y, z, x, y - height, z);
    }
    const cnt = pos.length / 6;
    for (let j = 0; j < cnt - 1; j++) {
      const a = j * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    (m.material as THREE.Material).side = THREE.DoubleSide;
    real.add(m);
    return m;
  };
  for (const sgn of [1, -1]) {
    // headlight housing + LED DRL strip
    ribbon(1.93, 2.3, (p) => p.seg === 'D', 0.0, 0.006, 0.085, mats.lampHousing, sgn);
    ribbon(1.95, 2.29, (p) => p.seg === 'D', -0.012, 0.012, 0.014, mats.headlight, sgn);
    // tail lights
    ribbon(-2.31, -2.02, (p) => p.seg === 'D', -0.005, 0.008, 0.06, mats.taillight, sgn);
  }
  // light bar across the trunk
  {
    const g = new THREE.BoxGeometry(0.012, 0.012, 1.25);
    const m = new THREE.Mesh(g, mats.taillight);
    m.position.set(-2.33, 0.93, 0);
    real.add(m);
  }

  // grille + lower intake (front face)
  const roundedRectShape = (w: number, h: number, r: number, topW = w) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(topW / 2, h / 2 - r);
    s.quadraticCurveTo(topW / 2, h / 2, topW / 2 - r, h / 2);
    s.lineTo(-topW / 2 + r, h / 2);
    s.quadraticCurveTo(-topW / 2, h / 2, -topW / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  };
  {
    const grille = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRectShape(0.78, 0.26, 0.05, 0.62), {depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2}), mats.plastic);
    grille.rotation.y = Math.PI / 2;
    grille.position.set(2.29, 0.5, 0);
    real.add(grille);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(1, 0.006, 4, 48), mats.chrome);
    frame.scale.set(0.37, 0.14, 1);
    frame.rotation.y = Math.PI / 2;
    frame.position.set(2.345, 0.5, 0);
    real.add(frame);
    for (let k = 0; k < 5; k++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.006, 0.6 - k * 0.02), mats.rimDark);
      bar.position.set(2.348, 0.42 + k * 0.04, 0);
      real.add(bar);
    }
    const intake = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRectShape(1.2, 0.1, 0.04), {depth: 0.04, bevelEnabled: false}), mats.plastic);
    intake.rotation.y = Math.PI / 2;
    intake.position.set(2.29, 0.32, 0);
    real.add(intake);
  }

  // --- wheels ---
  const tireGeo = (() => {
    const R = CAR.wheelR;
    const w = CAR.tireW;
    const pts: THREE.Vector2[] = [];
    const rIn = R * 0.62;
    const n = 10;
    pts.push(new THREE.Vector2(rIn, -w / 2 + 0.01));
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / n;
      pts.push(new THREE.Vector2(R - 0.04 + 0.04 * Math.cos(a) * 1.0, (w / 2 - 0.02) * Math.sin(a)));
    }
    pts.push(new THREE.Vector2(rIn, w / 2 - 0.01));
    const g = new THREE.LatheGeometry(pts, 48);
    g.rotateX(Math.PI / 2);
    return g;
  })();
  const rimGeo = (() => {
    const group: THREE.BufferGeometry[] = [];
    void group;
    return null;
  })();
  void rimGeo;
  const makeWheel = (x: number, sgn: number) => {
    const wg = new THREE.Group();
    wg.position.set(x, CAR.wheelR, sgn * CAR.trackZ);
    const tire = new THREE.Mesh(tireGeo, mats.tire);
    wg.add(tire);
    const face = sgn; // outward direction along z
    // barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(CAR.wheelR * 0.63, CAR.wheelR * 0.63, CAR.tireW * 0.8, 40, 1, true), mats.rimDark);
    barrel.rotation.x = Math.PI / 2;
    wg.add(barrel);
    // brake disc + caliper
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 36), mats.disc);
    disc.rotation.x = Math.PI / 2;
    disc.position.z = face * -0.03;
    wg.add(disc);
    const cal = new THREE.Mesh(roundedBox(0.1, 0.16, 0.06, 0.02), mats.caliper);
    cal.position.set(-0.11, 0.08, face * 0.0);
    cal.rotation.z = 0.5;
    wg.add(cal);
    // spokes (10, twisted pairs)
    const spokeZ = face * (CAR.tireW * 0.32);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.035, CAR.wheelR * 0.5, 0.03), mats.rim);
      sp.position.set(Math.cos(a) * CAR.wheelR * 0.36, Math.sin(a) * CAR.wheelR * 0.36, spokeZ);
      sp.rotation.z = a - Math.PI / 2 + 0.18;
      wg.add(sp);
    }
    const lip = new THREE.Mesh(new THREE.TorusGeometry(CAR.wheelR * 0.62, 0.012, 6, 48), mats.rim);
    lip.position.z = spokeZ;
    wg.add(lip);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.04, 24), mats.rim);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = spokeZ;
    wg.add(hub);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.045, 20), mats.rimDark);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = spokeZ + face * 0.005;
    wg.add(cap);
    real.add(wg);
    // ghost wheel
    const gw = new THREE.Mesh(tireGeo, makeGhostShared);
    gw.position.copy(wg.position);
    ghost.add(gw);
  };
  const makeGhostShared = makeGhost('#3f8cff', 0.02, 2.0);
  for (const x of [CAR.axleF, CAR.axleR]) for (const s of [1, -1]) makeWheel(x, s);

  // --- interior (seats, wheel) ---
  for (const xs of [0.05, -0.85])
    for (const zs of [0.38, -0.38]) {
      const cushion = new THREE.Mesh(roundedBox(0.5, 0.12, 0.48, 0.05), mats.seat);
      cushion.position.set(xs, 0.5, zs);
      real.add(cushion);
      const back = new THREE.Mesh(roundedBox(0.12, 0.62, 0.46, 0.05), mats.seat);
      back.position.set(xs - 0.25, 0.82, zs);
      back.rotation.z = 0.2;
      real.add(back);
    }
  const steer = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 8, 32), mats.plastic);
  steer.position.set(0.42, 0.88, 0.38);
  steer.rotation.y = Math.PI / 2;
  steer.rotation.x = 0.0;
  steer.rotation.z = 0.35;
  real.add(steer);
  const dash = new THREE.Mesh(roundedBox(0.35, 0.22, 1.5, 0.06), mats.plastic);
  dash.position.set(0.62, 0.8, 0);
  real.add(dash);

  // --- engine bay parts ---
  const parts: Record<PartName, THREE.Group> = {
    head: new THREE.Group(),
    egr: new THREE.Group(),
    turbo: new THREE.Group(),
    fap: new THREE.Group(),
    muffler: new THREE.Group(),
    exhaust: new THREE.Group(),
    block: new THREE.Group(),
    misc: new THREE.Group(),
  };
  Object.values(parts).forEach((g) => real.add(g));

  // block
  const block = new THREE.Mesh(roundedBox(0.5, 0.36, 0.66, 0.04), mats.engineMetal);
  block.position.set(1.38, 0.53, 0);
  parts.block.add(block);
  // cylinder head + ribbed cam cover
  const head = new THREE.Mesh(roundedBox(0.42, 0.11, 0.62, 0.03), mats.engineMetal);
  head.position.set(1.38, 0.75, 0);
  parts.head.add(head);
  const cover = new THREE.Mesh(roundedBox(0.34, 0.07, 0.56, 0.03), mats.engineDark);
  cover.position.set(1.38, 0.81, 0);
  parts.head.add(cover);
  for (let k = 0; k < 6; k++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.012), mats.engineMetal);
    rib.position.set(1.38, 0.85, -0.22 + k * 0.088);
    parts.head.add(rib);
  }
  // valves (visible in x-ray): 4 cylinders x 2 valves
  const valveGeo = new THREE.LatheGeometry(
    [new THREE.Vector2(0.0, 0), new THREE.Vector2(0.03, 0.0), new THREE.Vector2(0.03, 0.008), new THREE.Vector2(0.008, 0.03), new THREE.Vector2(0.006, 0.12), new THREE.Vector2(0, 0.12)],
    16,
  );
  for (let c = 0; c < 4; c++)
    for (const dx of [-0.06, 0.06]) {
      const v = new THREE.Mesh(valveGeo, mats.pipe);
      v.position.set(1.38 + dx, 0.66, -0.22 + c * 0.147);
      parts.head.add(v);
    }
  // intake runners + plenum (misc)
  const plenum = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.44, 4, 12), mats.engineDark);
  plenum.rotation.x = Math.PI / 2;
  plenum.position.set(1.12, 0.76, -0.05);
  parts.misc.add(plenum);
  for (let c = 0; c < 4; c++) {
    const z = -0.22 + c * 0.147;
    const cu = new THREE.CatmullRomCurve3([new THREE.Vector3(1.14, 0.78, z), new THREE.Vector3(1.2, 0.83, z), new THREE.Vector3(1.26, 0.78, z)]);
    parts.misc.add(new THREE.Mesh(new THREE.TubeGeometry(cu, 8, 0.022, 8, false), mats.engineDark));
  }
  // battery + radiator + coolant tank
  const battery = new THREE.Mesh(roundedBox(0.26, 0.19, 0.18, 0.02), mats.plastic);
  battery.position.set(1.0, 0.62, -0.47);
  parts.misc.add(battery);
  for (const [dz, m] of [[-0.05, mats.caliper], [0.05, mats.engineMetal]] as const) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 10), m);
    t.position.set(1.0, 0.73, -0.47 + dz);
    parts.misc.add(t);
  }
  const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 1.1), mats.engineDark);
  radiator.position.set(1.95, 0.56, 0);
  parts.misc.add(radiator);
  const tank = new THREE.Mesh(roundedBox(0.16, 0.12, 0.12, 0.03), new THREE.MeshStandardMaterial({color: '#d9dde3', roughness: 0.4, transparent: true, opacity: 0.85}));
  tank.position.set(1.75, 0.72, -0.48);
  parts.misc.add(tank);

  // EGR valve: body + actuator + pipe
  const egrBody = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 20), mats.engineMetal);
  egrBody.position.set(1.02, 0.76, 0.3);
  parts.egr.add(egrBody);
  const egrAct = new THREE.Mesh(roundedBox(0.09, 0.07, 0.09, 0.015), mats.plastic);
  egrAct.position.set(1.02, 0.83, 0.3);
  parts.egr.add(egrAct);
  const egrPipe = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.02, 0.72, 0.3),
    new THREE.Vector3(1.08, 0.64, 0.4),
    new THREE.Vector3(1.22, 0.6, 0.44),
  ]);
  parts.egr.add(new THREE.Mesh(new THREE.TubeGeometry(egrPipe, 12, 0.02, 8, false), mats.pipe));

  // Turbo: compressor + turbine snails
  const snail = (r: number, mat: THREE.Material) => {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.55, 12, 28, Math.PI * 1.75), mat);
    g.add(t);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r * 0.75, r * 0.9, 20), mat);
    c.rotation.x = Math.PI / 2;
    g.add(c);
    const out = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, r * 1.6, 16), mat);
    out.position.set(r, r * 0.3, 0);
    out.rotation.z = Math.PI / 2;
    g.add(out);
    return g;
  };
  const turbo = new THREE.Group();
  const comp = snail(0.075, mats.engineMetal);
  comp.position.set(0.0, 0, 0.06);
  const turb = snail(0.07, mats.cast);
  turb.position.set(0, 0, -0.06);
  turbo.add(comp, turb);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16), mats.engineDark);
  shaft.rotation.x = Math.PI / 2;
  turbo.add(shaft);
  turbo.position.set(1.3, 0.6, 0.45);
  turbo.rotation.y = 0.25;
  parts.turbo.add(turbo);

  // Exhaust path (car-local), turbo → down → under the car → FAP → muffler → tailpipe
  const exhaustPts = [
    new THREE.Vector3(1.3, 0.56, 0.42),
    new THREE.Vector3(1.22, 0.42, 0.4),
    new THREE.Vector3(1.08, 0.26, 0.34),
    new THREE.Vector3(0.86, 0.22, 0.3),
    new THREE.Vector3(0.66, 0.22, 0.3),
    new THREE.Vector3(0.12, 0.22, 0.3),
    new THREE.Vector3(-0.4, 0.23, 0.3),
    new THREE.Vector3(-1.1, 0.24, 0.3),
    new THREE.Vector3(-1.62, 0.26, 0.3),
    new THREE.Vector3(-2.05, 0.27, 0.36),
    new THREE.Vector3(-2.25, 0.27, 0.48),
    new THREE.Vector3(-2.42, 0.27, 0.52),
  ];
  const exhaustCurve = new THREE.CatmullRomCurve3(exhaustPts, false, 'catmullrom', 0.2);
  parts.exhaust.add(new THREE.Mesh(new THREE.TubeGeometry(exhaustCurve, 120, 0.032, 10, false), mats.pipe));
  // FAP (DPF) canister
  const fap = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.42, 6, 20), mats.pipe);
  fap.rotation.z = Math.PI / 2;
  fap.position.set(0.39, 0.22, 0.3);
  parts.fap.add(fap);
  // muffler
  const muff = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.32, 6, 20), mats.pipe);
  muff.rotation.x = Math.PI / 2;
  muff.scale.set(1.5, 0.75, 1);
  muff.position.set(-1.86, 0.27, 0.15);
  parts.muffler.add(muff);
  // chrome tailpipe tip
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.14, 20, 1, true), mats.chrome);
  tip.rotation.z = Math.PI / 2;
  tip.position.set(-2.38, 0.27, 0.52);
  (tip.material as THREE.Material).side = THREE.DoubleSide;
  parts.exhaust.add(tip);

  // ghost copies of engine parts (each part gets its own colourable materials)
  const partGhosts = {} as Record<PartName, THREE.ShaderMaterial>;
  const partWires = {} as Record<PartName, THREE.LineBasicMaterial>;
  (Object.keys(parts) as PartName[]).forEach((name) => {
    const gmat = makeGhost('#5aa0ff', 0.12, 1.6);
    const wmat = makeWireMat('#7ab4ff', 0.0);
    partGhosts[name] = gmat;
    partWires[name] = wmat;
    const gg = new THREE.Group();
    parts[name].updateMatrixWorld(true);
    parts[name].traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        const gm = new THREE.Mesh(m.geometry, gmat);
        gm.applyMatrix4(m.matrixWorld);
        gg.add(gm);
        const eg = new THREE.EdgesGeometry(m.geometry, 35);
        const lines = new THREE.LineSegments(eg, wmat);
        lines.applyMatrix4(m.matrixWorld);
        gg.add(lines);
      }
    });
    ghost.add(gg);
  });

  // collect materials for clipping control
  const realMaterials: THREE.Material[] = [];
  real.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach((mm) => {
      if (!realMaterials.includes(mm)) realMaterials.push(mm);
    });
  });
  const ghostMaterials: THREE.Material[] = [];
  ghost.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach((mm) => {
      if (!ghostMaterials.includes(mm)) ghostMaterials.push(mm);
    });
  });

  return {
    root,
    real,
    ghost,
    hoodPivotReal,
    hoodPivotGhost,
    mats,
    ghostBody,
    wireMat,
    partGhosts,
    partWires,
    exhaustCurve,
    realMaterials,
    ghostMaterials,
  };
};
