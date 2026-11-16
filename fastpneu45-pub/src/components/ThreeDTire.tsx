import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {COLORS} from '../config';

/* ---------- géométrie procédurale du pneu ---------- */
const R_OUT = 1.0;      // rayon extérieur
const R_RIM = 0.6;      // rayon de la jante
const HALF = 0.3;       // demi-largeur

const tireProfile = () => {
  const pts: THREE.Vector2[] = [];
  const side = (s: number) => [
    [R_RIM, 0.25 * s], [R_RIM + 0.03, 0.285 * s], [0.7, 0.31 * s], [0.8, 0.325 * s], [0.88, 0.315 * s],
    [0.94, 0.295 * s], [0.975, 0.265 * s], [0.993, 0.235 * s],
  ];
  const a = side(-1);
  a.forEach(([r, y]) => pts.push(new THREE.Vector2(r, y)));
  const treadStart = pts.length;
  // bande de roulement avec 4 rainures longitudinales réelles
  const grooves = [-0.15, -0.05, 0.05, 0.15];
  const gw = 0.016, gd = 0.045;
  pts.push(new THREE.Vector2(R_OUT, -0.215));
  grooves.forEach((g) => {
    pts.push(new THREE.Vector2(R_OUT, g - gw - 0.004));
    pts.push(new THREE.Vector2(R_OUT - gd, g - gw + 0.004));
    pts.push(new THREE.Vector2(R_OUT - gd, g + gw - 0.004));
    pts.push(new THREE.Vector2(R_OUT, g + gw + 0.004));
  });
  pts.push(new THREE.Vector2(R_OUT, 0.215));
  const treadEnd = pts.length - 1;
  side(1).reverse().forEach(([r, y]) => pts.push(new THREE.Vector2(r, y)));
  return {pts, treadStart, treadEnd};
};

const makeTextures = (treadV0: number, treadV1: number, n: number) => {
  const Wc = 4096, Hc = 1024;
  const mk = () => { const c = document.createElement('canvas'); c.width = Wc; c.height = Hc; return c; };
  const bump = mk(), col = mk();
  const b = bump.getContext('2d')!, c = col.getContext('2d')!;
  b.fillStyle = '#808080'; b.fillRect(0, 0, Wc, Hc);
  c.fillStyle = '#0c0d10'; c.fillRect(0, 0, Wc, Hc);
  // v = indice de point / (n-1) ; canvas y = (1 - v) * H
  const yOf = (v: number) => (1 - v) * Hc;
  const y0 = yOf(treadV1), y1 = yOf(treadV0);
  // sculptures en V (lamelles) sur la bande de roulement
  const pitch = 96;
  b.strokeStyle = '#101010'; b.lineCap = 'butt';
  const mid = (y0 + y1) / 2, th = y1 - y0;
  for (let i = 0; i < pitch; i++) {
    const x = (i / pitch) * Wc;
    b.lineWidth = 9;
    b.beginPath(); b.moveTo(x - 26, y0); b.lineTo(x + 20, mid - th * 0.08); b.stroke();
    b.beginPath(); b.moveTo(x - 26, y1); b.lineTo(x + 20, mid + th * 0.08); b.stroke();
    b.lineWidth = 4;
    b.beginPath(); b.moveTo(x + 22 - 20, y0 + th * 0.2); b.lineTo(x + 22 + 6, mid - th * 0.1); b.stroke();
    b.beginPath(); b.moveTo(x + 22 - 20, y1 - th * 0.2); b.lineTo(x + 22 + 6, mid + th * 0.1); b.stroke();
  }
  c.fillStyle = '#08090b'; c.fillRect(0, y0, Wc, y1 - y0);
  // flancs : filets + marquage
  const sidewalls: [number, number, boolean][] = [[0, y0, false], [y1, Hc, true]];
  sidewalls.forEach(([a, z, flip]) => {
    const h = z - a;
    b.fillStyle = '#9a9a9a';
    [0.18, 0.82].forEach((t) => b.fillRect(0, a + h * t, Wc, 4));
    c.fillStyle = '#17191d';
    [0.18, 0.82].forEach((t) => c.fillRect(0, a + h * t, Wc, 4));
    for (let k = 0; k < 6; k++) {
      [b, c].forEach((ctx, idx) => {
        ctx.save();
        ctx.translate((k + 0.5) * (Wc / 6), a + h * 0.5);
        if (!flip) ctx.scale(-1, -1);
        ctx.font = 'italic 900 64px "Barlow Condensed", Arial, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = idx === 0 ? '#c8c8c8' : (k % 3 === 0 ? '#565b66' : '#0c0d10');
        ctx.fillText(k % 3 === 0 ? 'FASTPNEU45' : '', 0, 0);
        ctx.restore();
      });
    }
  });
  const tb = new THREE.CanvasTexture(bump), tc = new THREE.CanvasTexture(col);
  [tb, tc].forEach((t) => { t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; });
  tc.colorSpace = THREE.SRGBColorSpace;
  void n;
  return {tb, tc};
};

const spokeFace = () => {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, R_RIM - 0.015, 0, Math.PI * 2, false);
  const N = 5;
  for (let i = 0; i < N; i++) {
    // deux ouvertures par secteur → branches en Y
    for (const [a0, a1, r0, r1] of [[0.08, 0.6, 0.18, 0.535], [0.68, 0.98, 0.37, 0.535]] as number[][]) {
      const base = (i / N) * Math.PI * 2;
      const s = base + a0 * ((Math.PI * 2) / N), e = base + a1 * ((Math.PI * 2) / N);
      const hole = new THREE.Path();
      hole.absarc(0, 0, r1, s, e, false);
      hole.absarc(0, 0, r0, e - 0.04, s + 0.04, true);
      hole.closePath();
      shape.holes.push(hole);
    }
  }
  const g = new THREE.ExtrudeGeometry(shape, {depth: 0.07, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.014, bevelSegments: 3, curveSegments: 48});
  g.translate(0, 0, -0.035);
  return g;
};

const Env: React.FC<{intensity: number}> = ({intensity}) => {
  const {gl, scene} = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    pmrem.dispose();
  }, [gl, scene]);
  scene.environmentIntensity = intensity;
  return null;
};

const Rig: React.FC<{pos: [number, number, number]; look: [number, number, number]; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...pos); cam.fov = fov; cam.near = 0.1; cam.far = 50; cam.lookAt(...look); cam.updateProjectionMatrix();
  return null;
};

const Wheel: React.FC<{spin: number}> = ({spin}) => {
  const {tire, barrel, face, tex} = useMemo(() => {
    const {pts, treadStart, treadEnd} = tireProfile();
    const n = pts.length;
    const tire = new THREE.LatheGeometry(pts, 200);
    tire.rotateX(Math.PI / 2);
    const tex = makeTextures(treadStart / (n - 1), treadEnd / (n - 1), n);
    const bp = [[R_RIM + 0.012, -0.27], [R_RIM, -0.24], [R_RIM - 0.03, -0.2], [R_RIM - 0.06, 0], [R_RIM - 0.03, 0.2], [R_RIM, 0.24], [R_RIM + 0.012, 0.27], [R_RIM - 0.02, 0.275]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const barrel = new THREE.LatheGeometry(bp, 96);
    barrel.rotateX(Math.PI / 2);
    return {tire, barrel, face: spokeFace(), tex};
  }, []);
  const rubber = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff', map: tex.tc, bumpMap: tex.tb, bumpScale: 3.2, roughness: 0.78, metalness: 0.05, side: THREE.DoubleSide,
  }), [tex]);
  const alloy = useMemo(() => new THREE.MeshStandardMaterial({color: '#aeb7c4', metalness: 1, roughness: 0.27, side: THREE.DoubleSide}), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({color: '#23272e', metalness: 0.9, roughness: 0.45, side: THREE.DoubleSide}), []);
  const disc = useMemo(() => new THREE.MeshStandardMaterial({color: '#8c949f', metalness: 1, roughness: 0.35}), []);
  const blue = useMemo(() => new THREE.MeshStandardMaterial({color: COLORS.bleu, metalness: 0.5, roughness: 0.3, emissive: COLORS.bleu, emissiveIntensity: 0.9}), []);
  return (
    <group>
      {/* étrier fixe */}
      <mesh position={[0.33, 0.25, 0.02]} rotation={[0, 0, 0.65]} material={blue}>
        <boxGeometry args={[0.2, 0.34, 0.16]} />
      </mesh>
      <group rotation={[0, 0, -spin]}>
        <mesh geometry={tire} material={rubber} />
        <mesh geometry={barrel} material={dark} />
        <mesh geometry={face} material={alloy} position={[0, 0, 0.2]} />
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.05]} material={disc}>
          <cylinderGeometry args={[0.46, 0.46, 0.035, 64]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.245]} material={dark}>
          <cylinderGeometry args={[0.105, 0.12, 0.05, 48]} />
        </mesh>
        <mesh position={[0, 0, 0.272]} material={blue}>
          <torusGeometry args={[0.085, 0.012, 12, 48]} />
        </mesh>
        {new Array(5).fill(0).map((_, i) => {
          const a = (i / 5) * Math.PI * 2 + 0.3;
          return (
            <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[Math.cos(a) * 0.155, Math.sin(a) * 0.155, 0.245]} material={dark}>
              <cylinderGeometry args={[0.022, 0.022, 0.04, 6]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

export type TireView = {
  /** angle d'orbite de la caméra autour du pneu (degrés), hauteur, distance */
  orbit: number; height: number; distance: number;
  spin: number;        // rotation du pneu (radians)
  light: number;       // 0→1 : intensité de l'éclairage (apparition depuis le noir)
  lookY?: number;
  fov?: number;
};

/** Pneu + jante alliage 3D (Three.js), éclairage bleu électrique. */
export const ThreeDTire: React.FC<{width: number; height: number; view: TireView; style?: React.CSSProperties}> = ({width, height, view, style}) => {
  const a = (view.orbit * Math.PI) / 180;
  const pos: [number, number, number] = [Math.sin(a) * view.distance, view.height, Math.cos(a) * view.distance];
  const L = view.light;
  return (
    <ThreeCanvas width={width} height={height} style={style} gl={{alpha: true, antialias: true}} camera={{fov: view.fov ?? 34, position: pos}}>
      <Rig pos={pos} look={[0, view.lookY ?? 0, 0]} fov={view.fov ?? 34} />
      <Env intensity={0.55 * L} />
      <ambientLight intensity={0.15 * L} color="#6fa8ff" />
      <directionalLight position={[2.5, 3, 4]} intensity={2.4 * L} color="#ffffff" />
      <pointLight position={[-3, 0.5, 1.5]} intensity={60 * L} color={COLORS.bleu} />
      <pointLight position={[3, -1.2, -1]} intensity={50 * L} color={COLORS.neon} />
      <pointLight position={[0, 2.5, -2.5]} intensity={40 * L} color="#3f9bff" />
      <Wheel spin={view.spin} />
    </ThreeCanvas>
  );
};
