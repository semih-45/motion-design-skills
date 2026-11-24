// The single WebGL layer. One renderer per tab, every frame is a pure function of `frame`.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {H, W, S, C} from '../timeline';
import {buildCar, CarColor, glowBlend, PartName} from './carModel';
import {carMatrix, hoodAngle, makeCarCamera, scanHeight, xraySweep} from './rig';
import {clamp, easeIn, easeInOut, lin, prog} from '../lib/anim';
import {buildPhone, PhoneBuild} from './phone';
import {buildDisc, DiscBuild} from './disc';
import {phoneCamera, phonePose, discCamera, discPose} from './rig2';
import {useFontsReady} from '../lib/fonts';

type Ctx = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  car: ReturnType<typeof buildCar>;
  carStage: THREE.Group;
  platformRing: THREE.Mesh;
  platformGlow: THREE.Mesh;
  platform: THREE.Mesh;
  floor: THREE.Mesh;
  shadow: THREE.Mesh;
  scanRing: THREE.Mesh;
  sweepFrame: THREE.LineSegments;
  wave: THREE.Points;
  waveSeeds: Float32Array;
  phone: PhoneBuild;
  disc: DiscBuild;
  lights: THREE.Group;
};

const radialTexture = (inner: string, outer: string, ring = false) => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  if (ring) {
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.78, 'rgba(0,0,0,0)');
    grd.addColorStop(0.9, inner);
    grd.addColorStop(1, outer);
  } else {
    grd.addColorStop(0, inner);
    grd.addColorStop(1, outer);
  }
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const dotTexture = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
};

const PART_ORDER: {name: PartName; ann: string; fix: string}[] = [
  {name: 'head', ann: 'ann1', fix: 'fix1'},
  {name: 'egr', ann: 'ann2', fix: 'fix2'},
  {name: 'turbo', ann: 'ann3', fix: 'fix3'},
  {name: 'fap', ann: 'ann4', fix: 'fix4'},
  {name: 'muffler', ann: 'ann5', fix: 'fix5'},
];

const BLUE = new THREE.Color('#5aa0ff');
const RED = new THREE.Color('#ff3b44');
const GREEN = new THREE.Color('#2BD17E');

const init = (canvas: HTMLCanvasElement, carColor: CarColor): Ctx => {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = env;

  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(4, 8, 6);
  const rim = new THREE.DirectionalLight('#4f8dff', 3.2);
  rim.position.set(-6, 3, -8);
  const fill = new THREE.DirectionalLight('#9fc3ff', 0.5);
  fill.position.set(-5, 2, 6);
  lights.add(key, rim, fill, new THREE.AmbientLight('#203050', 0.4));
  scene.add(lights);

  // --- car stage ---
  const carStage = new THREE.Group();
  scene.add(carStage);
  const car = buildCar(carColor);
  carStage.add(car.root);

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(3.05, 3.1, 0.06, 96),
    new THREE.MeshStandardMaterial({color: '#071021', metalness: 0.5, roughness: 0.32, envMapIntensity: 0.22}),
  );
  platform.position.y = 0.03;
  carStage.add(platform);
  const platformRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.08, 0.022, 8, 160),
    new THREE.MeshBasicMaterial({color: new THREE.Color(0.35, 0.75, 2.4), toneMapped: false, transparent: true}),
  );
  platformRing.rotation.x = Math.PI / 2;
  platformRing.position.y = 0.065;
  carStage.add(platformRing);
  const platformGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 8.4),
    glowBlend(new THREE.MeshBasicMaterial({map: radialTexture('rgba(60,130,255,0.55)', 'rgba(30,107,255,0)', true), transparent: true, depthWrite: false}), true),
  );
  platformGlow.rotation.x = -Math.PI / 2;
  platformGlow.position.y = 0.07;
  carStage.add(platformGlow);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshBasicMaterial({color: '#050d22', transparent: true, opacity: 0.9, alphaMap: radialTexture('#ffffff', '#000000'), depthWrite: false}),
  );
  floor.rotation.x = -Math.PI / 2;
  carStage.add(floor);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 2.6),
    new THREE.MeshBasicMaterial({map: radialTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false}),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.067;
  car.root.add(shadow);
  shadow.position.y = 0.006;

  // scan ring (car materialisation) & x-ray sweep frame
  const scanRing = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.012, 6, 128),
    new THREE.MeshBasicMaterial({color: new THREE.Color(0.6, 1.2, 3.0), toneMapped: false, transparent: true}),
  );
  scanRing.rotation.x = Math.PI / 2;
  scanRing.scale.set(2.6, 1.2, 1);
  car.root.add(scanRing);
  const sf = new THREE.BufferGeometry();
  const fr = [
    [0, 0.05, -1.15],
    [0, 1.6, -1.15],
    [0, 1.6, -1.15],
    [0, 1.6, 1.15],
    [0, 1.6, 1.15],
    [0, 0.05, 1.15],
    [0, 0.05, 1.15],
    [0, 0.05, -1.15],
  ].flat();
  sf.setAttribute('position', new THREE.Float32BufferAttribute(fr, 3));
  const sweepFrame = new THREE.LineSegments(sf, new THREE.LineBasicMaterial({color: new THREE.Color(0.7, 1.4, 3), toneMapped: false, transparent: true}));
  car.root.add(sweepFrame);

  // hydrogen wave particles along the exhaust line
  const N = 420;
  const wpos = new Float32Array(N * 3);
  const seeds = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const r = (k: number) => {
      const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    seeds[i * 4] = r(1);
    seeds[i * 4 + 1] = r(2);
    seeds[i * 4 + 2] = r(3);
    seeds[i * 4 + 3] = r(4);
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.BufferAttribute(wpos, 3));
  const wave = new THREE.Points(
    wg,
    glowBlend(new THREE.PointsMaterial({color: new THREE.Color(0.4, 2.2, 1.1), size: 0.15, map: dotTexture(), transparent: true, depthWrite: false, toneMapped: false}), true),
  );
  car.root.add(wave);

  const phone = buildPhone();
  scene.add(phone.root);
  const disc = buildDisc();
  scene.add(disc.root);

  return {renderer, scene, car, carStage, platformRing, platformGlow, platform, floor, shadow, scanRing, sweepFrame, wave, waveSeeds: seeds, phone, disc, lights};
};

const setOpacity = (m: THREE.Material, o: number) => {
  m.transparent = true;
  m.opacity = o;
};

const updateCar = (ctx: Ctx, f: number) => {
  const {car} = ctx;
  const m = carMatrix(f);
  car.root.matrixAutoUpdate = false;
  car.root.matrix.copy(m);
  car.root.matrixWorldNeedsUpdate = true;
  ctx.platform.rotation.y = 0;

  // hood
  const ha = hoodAngle(f);
  car.hoodPivotReal.rotation.z = ha;
  car.hoodPivotGhost.rotation.z = ha;

  // clipping: realistic keeps (y <= h) ∩ (x <= sweep), ghost keeps the complement
  const h = scanHeight(f);
  const sx = xraySweep(f);
  const toWorld = (n: THREE.Vector3, p: THREE.Vector3) => {
    const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(n, p);
    return pl.applyMatrix4(m);
  };
  const realY = toWorld(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, h, 0));
  const realX = toWorld(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(sx, 0, 0));
  const ghostY = toWorld(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, h, 0));
  const ghostX = toWorld(new THREE.Vector3(1, 0, 0), new THREE.Vector3(sx, 0, 0));
  const fullyReal = h > 1.6 && sx > 2.6;
  const fullyGhost = h > 1.6 && sx < -2.6;
  car.real.visible = !fullyGhost && h > -0.04;
  for (const mat of car.realMaterials) {
    mat.clippingPlanes = fullyReal ? null : [realY, realX];
    mat.clipIntersection = false;
  }
  const ghostVisible = !fullyReal && f >= C.carScan - 4;
  car.ghost.visible = ghostVisible;
  for (const mat of car.ghostMaterials) {
    mat.clippingPlanes = fullyGhost ? null : [ghostY, ghostX];
    mat.clipIntersection = true;
  }
  // ghost intensity: during scan-in, ghost (above scan line) appears as a drawing
  const ghostIn = prog(f, C.carScan - 4, 8);
  car.ghostBody.uniforms.uOpacity.value = ghostIn;
  car.wireMat.opacity = 0.5 * ghostIn;

  // part states: neutral blue → red when annotated → green when cleaned
  for (const {name, ann, fix} of PART_ORDER) {
    const red = prog(f, C[ann] - 2, 6);
    const green = prog(f, C[fix] - 2, 6);
    const pulse = red * (1 - green) * (0.75 + 0.25 * Math.sin(f * 0.45));
    const col = BLUE.clone().lerp(RED, red).lerp(GREEN, green);
    const gm = car.partGhosts[name];
    gm.uniforms.uColor.value.copy(col);
    gm.uniforms.uOpacity.value = (0.75 + 0.6 * pulse + 0.5 * green * (1 - prog(f, C[fix] + 10, 20))) * ghostIn;
    car.partWires[name].color.copy(col);
    car.partWires[name].opacity = (0.35 + 0.5 * red) * ghostIn;
  }
  for (const name of ['exhaust', 'block', 'misc'] as PartName[]) {
    const green = name === 'exhaust' ? prog(f, C.fix4 - 6, 14) : name === 'block' ? prog(f, C.fix1, 8) : 0;
    const col = BLUE.clone().lerp(GREEN, green);
    car.partGhosts[name].uniforms.uColor.value.copy(col);
    car.partGhosts[name].uniforms.uOpacity.value = 0.6 * ghostIn;
    car.partWires[name].color.copy(col);
    car.partWires[name].opacity = 0.3 * ghostIn;
  }

  // scan ring follows the scan height
  const scanning = f >= C.carScan - 2 && f <= C.carScan + 24;
  ctx.scanRing.visible = scanning;
  ctx.scanRing.position.y = h;
  (ctx.scanRing.material as THREE.MeshBasicMaterial).opacity = Math.sin(Math.PI * clamp(lin(f, C.carScan - 2, 26)));
  // sweep frame follows x-ray sweep
  const sweeping = Math.abs(sx) < 2.65;
  ctx.sweepFrame.visible = sweeping;
  ctx.sweepFrame.position.x = sx;

  // platform ring intensity
  const ringOn = prog(f, S.problem - 4, 10);
  (ctx.platformRing.material as THREE.MeshBasicMaterial).opacity = ringOn;
  (ctx.platformGlow.material as THREE.MeshBasicMaterial).opacity = ringOn * (0.85 + 0.15 * Math.sin(f * 0.2));
  setOpacity(ctx.platform.material as THREE.Material, ringOn);
  setOpacity(ctx.floor.material as THREE.Material, 0.9 * ringOn);

  // hydrogen wave
  const wpos = (ctx.wave.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
  const head = lin(f, C.dropHit, C.fix5 - C.dropHit + 4) * 1.25 - 0.05;
  const waveOn = f >= C.dropHit - 1 && f < C.fix5 + 26;
  ctx.wave.visible = waveOn;
  const fade = 1 - prog(f, C.fix5 + 6, 18, easeIn);
  (ctx.wave.material as THREE.PointsMaterial).opacity = fade;
  const N = wpos.length / 3;
  const curve = car.exhaustCurve;
  const tmp = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const s0 = ctx.waveSeeds[i * 4];
    const s1 = ctx.waveSeeds[i * 4 + 1];
    const s2 = ctx.waveSeeds[i * 4 + 2];
    const s3 = ctx.waveSeeds[i * 4 + 3];
    // particles: trail behind head, spread decreasing
    let u = head - s0 * 0.35 * (0.3 + s3);
    if (u < 0 || u > 1) {
      wpos[i * 3] = 9999;
      wpos[i * 3 + 1] = 9999;
      wpos[i * 3 + 2] = 9999;
      continue;
    }
    // the first segment starts at the cylinder head (drop hit), so blend from engine to curve
    curve.getPointAt(u, tmp);
    const engineBlend = clamp(1 - u / 0.08);
    tmp.lerp(new THREE.Vector3(1.38, 0.8, 0.05), engineBlend * 0.8);
    const ang = s1 * Math.PI * 2 + f * 0.25 * (s2 - 0.5);
    const rad = 0.03 + 0.1 * s2 * (1 - (head - u));
    wpos[i * 3] = tmp.x + (s3 - 0.5) * 0.04;
    wpos[i * 3 + 1] = tmp.y + Math.sin(ang) * rad;
    wpos[i * 3 + 2] = tmp.z + Math.cos(ang) * rad;
  }
  (ctx.wave.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  void easeInOut;
};

export const World3D: React.FC<{carColor?: CarColor}> = ({carColor = 'bleu'}) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<Ctx | null>(null);

  const carOn = frame >= S.problem - 6 && frame < C.phoneReveal;
  const phoneOn = frame >= C.phoneReveal && frame < S.travel + 14;
  const discOn = frame >= C.disc - 6 && frame < C.qr + 12;
  const active = carOn || phoneOn || discOn;
  const fontsReady = useFontsReady();
  // focus pull onto the H2 drop before the phone match cut
  const carBlur = carOn ? 14 * prog(frame, C.dropOut + 2, 12) : 0;

  useLayoutEffect(() => {
    if (!ref.current || !fontsReady) return;
    if (!ctxRef.current) ctxRef.current = init(ref.current, carColor);
    const ctx = ctxRef.current;
    if (!active) return;
    ctx.carStage.visible = carOn;
    ctx.phone.root.visible = phoneOn;
    ctx.disc.root.visible = discOn;
    let cam: THREE.PerspectiveCamera;
    if (carOn) {
      updateCar(ctx, frame);
    }
    if (phoneOn) {
      ctx.phone.update(frame, phonePose(frame));
    }
    if (discOn) {
      ctx.disc.update(frame, discPose(frame));
    }
    if (carOn && !phoneOn) cam = makeCarCamera(frame);
    else if (phoneOn) cam = phoneCamera(frame);
    else cam = discCamera(frame);
    ctx.renderer.render(ctx.scene, cam);
  }, [frame, active, carOn, phoneOn, discOn, fontsReady]);

  const memo = useMemo(() => ({width: W, height: H}), []);
  return (
    <canvas
      ref={ref}
      width={memo.width}
      height={memo.height}
      style={{
        position: 'absolute',
        inset: 0,
        width: W,
        height: H,
        opacity: active ? 1 : 0,
        filter: carBlur > 0.3 ? `blur(${carBlur}px) brightness(${1 - carBlur / 40})` : undefined,
      }}
    />
  );
};
