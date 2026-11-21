import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Shared temple foreground for the Gita experience (used by both the painted and the fully
 * sculpted sanctum views): carved book stand, brass diya stands with living flames, a circling
 * aarti lamp, incense smoke, light shafts, falling petals and the painted backdrop layer.
 *
 * World layout (metres, y-up): floor y=0, book stand at the origin, altar toward -z.
 */

export interface TempleLayer {
  group: THREE.Group;
  update(timeSec: number, dtSec: number): void;
  dispose(): void;
}

type Quality = 'low' | 'high';

// ---------------------------------------------------------------------------
// Shared materials & canvas textures
// ---------------------------------------------------------------------------

function canvasTexture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void, srgb = true) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Teardrop diya flame: white-hot core → saffron → transparent. */
function createFlameTexture() {
  return canvasTexture(64, 128, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.bezierCurveTo(50, 40, 60, 78, 50, 102);
    ctx.bezierCurveTo(42, 122, 22, 122, 14, 102);
    ctx.bezierCurveTo(4, 78, 14, 40, 32, 4);
    ctx.closePath();
    ctx.clip();
    const g = ctx.createRadialGradient(32, 92, 2, 32, 80, 70);
    g.addColorStop(0, 'rgba(255,255,245,1)');
    g.addColorStop(0.22, 'rgba(255,236,150,1)');
    g.addColorStop(0.55, 'rgba(255,150,40,0.85)');
    g.addColorStop(1, 'rgba(200,60,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 128);
  });
}

function createSoftDiscTexture(inner: string, outer: string, size = 128) {
  return canvasTexture(size, size, (ctx) => {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  });
}

/** Rosewood grain for the carved stand. */
function createWoodTexture() {
  const tex = canvasTexture(256, 512, (ctx) => {
    ctx.fillStyle = '#4A2416';
    ctx.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * 256;
      ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? '30,12,6' : '110,58,32'},${0.15 + Math.random() * 0.25})`;
      ctx.lineWidth = 0.6 + Math.random() * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y <= 512; y += 32) ctx.lineTo(x + Math.sin(y * 0.02 + i) * 6, y);
      ctx.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

interface FlameRig {
  object: THREE.Group;
  update(t: number): void;
}

/** A living flame: billboarded teardrop + soft halo, flickering procedurally. */
function createFlame(flameTex: THREE.Texture, glowTex: THREE.Texture, scale: number, seed: number): FlameRig {
  const object = new THREE.Group();
  const flameMat = new THREE.SpriteMaterial({
    map: flameTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const flame = new THREE.Sprite(flameMat);
  flame.scale.set(0.5 * scale, scale, 1);
  flame.position.y = scale * 0.42;
  object.add(flame);

  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    opacity: 0.55,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(scale * 4.2);
  glow.position.y = scale * 0.4;
  object.add(glow);

  return {
    object,
    update(t) {
      const n = Math.sin(t * 13.1 + seed) * 0.5 + Math.sin(t * 7.3 + seed * 2.1) * 0.3 + Math.sin(t * 23.7 + seed) * 0.2;
      flame.scale.set(0.5 * scale * (1 - n * 0.06), scale * (1 + n * 0.14), 1);
      flame.position.x = Math.sin(t * 3.1 + seed) * scale * 0.04;
      glowMat.opacity = 0.48 + n * 0.08;
    },
  };
}

// ---------------------------------------------------------------------------
// Carved wooden-and-gold book stand (Vyasa peetha)
// ---------------------------------------------------------------------------

export interface BookStandRig extends TempleLayer {
  /** Parent the book assembly here: local +y is the board's surface normal. */
  bookAnchor: THREE.Object3D;
}

export const STAND_BOARD_TILT = 0.36; // radians (~21°), front edge lowered toward the reader

export function buildBookStand(): BookStandRig {
  const group = new THREE.Group();
  const disposables: Array<{ dispose(): void }> = [];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const woodTex = track(createWoodTexture());
  const wood = track(new THREE.MeshStandardMaterial({ map: woodTex, color: 0xffffff, roughness: 0.42, metalness: 0.05 }));
  const gold = track(new THREE.MeshStandardMaterial({ color: 0xe0b24a, roughness: 0.22, metalness: 1 }));
  const velvet = track(new THREE.MeshStandardMaterial({ color: 0x741d32, roughness: 0.85, metalness: 0 }));

  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    track(geo);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  // Two-tier carved plinth with gold banding
  const plinth = mesh(new RoundedBoxGeometry(0.72, 0.09, 0.52, 3, 0.02), wood);
  plinth.position.y = 0.045;
  group.add(plinth);
  const plinthBand = mesh(new THREE.BoxGeometry(0.74, 0.012, 0.54), gold);
  plinthBand.position.y = 0.092;
  group.add(plinthBand);
  const tier = mesh(new RoundedBoxGeometry(0.54, 0.06, 0.38, 3, 0.015), wood);
  tier.position.y = 0.128;
  group.add(tier);

  // Turned column (lathe) with gold collars
  const profile = [
    [0.0, 0.0], [0.085, 0.0], [0.09, 0.02], [0.06, 0.05], [0.05, 0.1], [0.065, 0.16], [0.05, 0.22],
    [0.038, 0.3], [0.036, 0.5], [0.055, 0.56], [0.06, 0.6], [0.042, 0.64], [0.04, 0.7], [0.07, 0.73], [0.0, 0.74],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const column = mesh(new THREE.LatheGeometry(profile, 28), wood);
  column.position.y = 0.158;
  group.add(column);
  for (const y of [0.18, 0.38, 0.76, 0.88]) {
    const collar = mesh(new THREE.TorusGeometry(y > 0.7 ? 0.05 : 0.064, 0.009, 10, 32), gold);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y;
    group.add(collar);
  }

  // Yoke under the reading board
  const yoke = mesh(new RoundedBoxGeometry(0.5, 0.05, 0.14, 2, 0.015), wood);
  yoke.position.y = 0.915;
  group.add(yoke);

  // Tilted reading board with gold frame, velvet inlay and a lip that holds the book
  const board = new THREE.Group();
  board.position.set(0, 0.965, 0);
  board.rotation.x = STAND_BOARD_TILT;
  group.add(board);

  const boardSlab = mesh(new RoundedBoxGeometry(0.86, 0.034, 0.58, 3, 0.012), wood);
  board.add(boardSlab);
  const inlay = mesh(new THREE.BoxGeometry(0.76, 0.004, 0.48), velvet);
  inlay.position.y = 0.0185;
  board.add(inlay);
  const frameGeo = [
    [0.86, 0.012, 0.016, 0, 0.29],
    [0.86, 0.012, 0.016, 0, -0.29],
    [0.016, 0.012, 0.58, 0.43, 0],
    [0.016, 0.012, 0.58, -0.43, 0],
  ];
  for (const [w, h, d, x, z] of frameGeo) {
    const bar = mesh(new THREE.BoxGeometry(w, h, d), gold);
    bar.position.set(x, 0.02, z);
    board.add(bar);
  }
  const lip = mesh(new RoundedBoxGeometry(0.86, 0.05, 0.024, 2, 0.008), wood);
  lip.position.set(0, 0.035, 0.29);
  board.add(lip);
  const lipGold = mesh(new THREE.BoxGeometry(0.8, 0.008, 0.026), gold);
  lipGold.position.set(0, 0.058, 0.29);
  board.add(lipGold);

  // Carved lotus finials at the board corners
  const finialGeo = track(new THREE.SphereGeometry(0.018, 14, 10));
  for (const [x, z] of [[-0.42, 0.28], [0.42, 0.28], [-0.42, -0.28], [0.42, -0.28]]) {
    const f = new THREE.Mesh(finialGeo, gold);
    f.position.set(x, 0.03, z);
    board.add(f);
  }

  const bookAnchor = new THREE.Object3D();
  bookAnchor.position.set(0, 0.038, -0.012);
  board.add(bookAnchor);

  return {
    group,
    bookAnchor,
    update() {
      /* static prop */
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Living effects: diyas, aarti, incense, light shafts, petals
// ---------------------------------------------------------------------------

export interface TempleEffectsOptions {
  quality: Quality;
  reduceMotion: boolean;
  /** Centre of the aarti circle (in front of the deities). */
  aartiCenter?: THREE.Vector3;
}

const SMOKE_VERT = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  varying float vAlpha;
  void main() {
    float life = fract(uTime * 0.11 + aSeed);
    vec3 p = position;
    p.y += life * 1.35;
    p.x += sin(life * 6.0 + aSeed * 20.0) * 0.07 * life + life * 0.06;
    p.z += cos(life * 5.0 + aSeed * 13.0) * 0.05 * life;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.25 + life * 1.7) * uPixelRatio / max(0.2, -mv.z);
    vAlpha = smoothstep(0.0, 0.12, life) * (1.0 - life) * 0.3;
  }
`;

const SMOKE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying float vAlpha;
  void main() {
    float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(0.93, 0.91, 0.87, a);
  }
`;

export function buildTempleEffects(opts: TempleEffectsOptions): TempleLayer {
  const group = new THREE.Group();
  const disposables: Array<{ dispose(): void }> = [];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);
  const flames: FlameRig[] = [];
  const motion = opts.reduceMotion ? 0 : 1;

  const flameTex = track(createFlameTexture());
  const glowTex = track(createSoftDiscTexture('rgba(255,190,90,0.9)', 'rgba(255,140,40,0)'));
  const brass = track(new THREE.MeshStandardMaterial({ color: 0xc89b3c, roughness: 0.28, metalness: 1 }));
  const darkBrass = track(new THREE.MeshStandardMaterial({ color: 0x8a6420, roughness: 0.4, metalness: 1 }));

  // --- Brass deepa stambha (tall diya stands) flanking the book
  const stambhaProfile = [
    [0.0, 0.0], [0.16, 0.0], [0.17, 0.025], [0.12, 0.06], [0.07, 0.09], [0.05, 0.13], [0.034, 0.2],
    [0.03, 0.48], [0.046, 0.51], [0.03, 0.54], [0.027, 0.84], [0.05, 0.87], [0.03, 0.91], [0.036, 0.94],
    [0.12, 0.975], [0.132, 0.995], [0.115, 1.0], [0.0, 0.99],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const stambhaGeo = track(new THREE.LatheGeometry(stambhaProfile, 32));
  const lights: Array<{ light: THREE.PointLight; base: number; seed: number }> = [];

  for (const side of [-1, 1]) {
    const stand = new THREE.Group();
    stand.position.set(side * 0.92, 0, 0.18);
    const body = new THREE.Mesh(stambhaGeo, brass);
    body.castShadow = true;
    body.receiveShadow = true;
    stand.add(body);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + side;
      const f = createFlame(flameTex, glowTex, 0.05, i * 1.7 + side * 3);
      f.object.position.set(Math.cos(a) * 0.1, 1.0, Math.sin(a) * 0.1);
      stand.add(f.object);
      flames.push(f);
    }
    const light = new THREE.PointLight(0xffa64a, 2.2, 4.5, 2);
    light.position.set(0, 1.08, 0);
    stand.add(light);
    lights.push({ light, base: 2.2, seed: side * 5 });
    group.add(stand);
  }

  // --- Aarti lamp: five-wick brass plate circling clockwise before the deities
  const aartiCenter = opts.aartiCenter ?? new THREE.Vector3(0, 1.55, -3.4);
  const aarti = new THREE.Group();
  const plate = new THREE.Mesh(
    track(new THREE.LatheGeometry([[0, 0], [0.11, 0.0], [0.13, 0.025], [0.12, 0.03], [0.0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y)), 28)),
    brass,
  );
  aarti.add(plate);
  const handle = new THREE.Mesh(track(new THREE.CylinderGeometry(0.012, 0.016, 0.22, 12)), darkBrass);
  handle.position.y = -0.11;
  aarti.add(handle);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const r = i === 0 ? 0 : 0.075;
    const f = createFlame(flameTex, glowTex, 0.045, 10 + i);
    f.object.position.set(i === 0 ? 0 : Math.cos(a) * r, 0.03, i === 0 ? 0 : Math.sin(a) * r);
    aarti.add(f.object);
    flames.push(f);
  }
  const aartiLight = new THREE.PointLight(0xffb45c, 3.2, 5, 2);
  aartiLight.position.y = 0.08;
  aarti.add(aartiLight);
  lights.push({ light: aartiLight, base: 3.2, seed: 21 });
  aarti.position.copy(aartiCenter);
  group.add(aarti);

  // --- Incense: brass holders with glowing tips + GPU smoke
  const smokeTex = track(createSoftDiscTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)', 64));
  const emberMat = track(new THREE.MeshBasicMaterial({ color: 0xff6a2a, toneMapped: false }));
  const stickMat = track(new THREE.MeshStandardMaterial({ color: 0x3a1d12, roughness: 0.9 }));
  const holderGeo = track(new THREE.CylinderGeometry(0.035, 0.045, 0.05, 18));
  const stickGeo = track(new THREE.CylinderGeometry(0.0025, 0.0025, 0.26, 6));
  const emberGeo = track(new THREE.SphereGeometry(0.005, 8, 6));
  const smokeEmitters: THREE.Vector3[] = [];
  for (const side of [-1, 1]) {
    const holder = new THREE.Group();
    holder.position.set(side * 0.56, 0, -0.2);
    const bowl = new THREE.Mesh(holderGeo, brass);
    bowl.position.y = 0.025;
    bowl.castShadow = true;
    holder.add(bowl);
    for (let i = 0; i < 3; i++) {
      const tilt = (i - 1) * 0.16;
      const stick = new THREE.Mesh(stickGeo, stickMat);
      stick.position.set(Math.sin(tilt) * 0.13, 0.05 + 0.13 * Math.cos(tilt), 0);
      stick.rotation.z = -tilt;
      holder.add(stick);
      const ember = new THREE.Mesh(emberGeo, emberMat);
      ember.position.set(Math.sin(tilt) * 0.26, 0.05 + 0.26 * Math.cos(tilt), 0);
      holder.add(ember);
      smokeEmitters.push(new THREE.Vector3(holder.position.x + ember.position.x, ember.position.y, holder.position.z));
    }
    group.add(holder);
  }

  const smokePerEmitter = opts.quality === 'high' ? 26 : 10;
  const smokeCount = smokeEmitters.length * smokePerEmitter;
  const smokePos = new Float32Array(smokeCount * 3);
  const smokeSeed = new Float32Array(smokeCount);
  for (let i = 0; i < smokeCount; i++) {
    const e = smokeEmitters[i % smokeEmitters.length];
    smokePos.set([e.x, e.y, e.z], i * 3);
    smokeSeed[i] = Math.random();
  }
  const smokeGeo = track(new THREE.BufferGeometry());
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
  smokeGeo.setAttribute('aSeed', new THREE.BufferAttribute(smokeSeed, 1));
  const smokeMat = track(
    new THREE.ShaderMaterial({
      vertexShader: SMOKE_VERT,
      fragmentShader: SMOKE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uSize: { value: 150 },
        uMap: { value: smokeTex },
      },
      transparent: true,
      depthWrite: false,
    }),
  );
  const smoke = new THREE.Points(smokeGeo, smokeMat);
  smoke.frustumCulled = false;
  if (motion) group.add(smoke);

  // --- Light shafts streaming from high windows toward the altar
  const rayTex = track(
    canvasTexture(64, 256, (ctx) => {
      const v = ctx.createLinearGradient(0, 0, 0, 256);
      v.addColorStop(0, 'rgba(255,236,190,0)');
      v.addColorStop(0.25, 'rgba(255,236,190,0.9)');
      v.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, 64, 256);
      ctx.globalCompositeOperation = 'destination-in';
      const h = ctx.createLinearGradient(0, 0, 64, 0);
      h.addColorStop(0, 'rgba(0,0,0,0)');
      h.addColorStop(0.5, 'rgba(0,0,0,1)');
      h.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = h;
      ctx.fillRect(0, 0, 64, 256);
    }),
  );
  const rays: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; base: number; seed: number }> = [];
  const rayGeo = track(new THREE.PlaneGeometry(1, 1));
  const rayDefs = [
    { x: 1.9, y: 3.1, z: -3.2, w: 0.9, h: 5.2, rot: 0.42, o: 0.13 },
    { x: 1.2, y: 3.0, z: -3.9, w: 0.55, h: 5.0, rot: 0.4, o: 0.1 },
    { x: 2.5, y: 3.3, z: -2.4, w: 0.7, h: 5.4, rot: 0.46, o: 0.08 },
    { x: -2.1, y: 3.2, z: -3.6, w: 0.5, h: 4.8, rot: -0.38, o: 0.06 },
  ];
  rayDefs.forEach((d, i) => {
    const mat = track(
      new THREE.MeshBasicMaterial({
        map: rayTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide,
        opacity: d.o,
      }),
    );
    const m = new THREE.Mesh(rayGeo, mat);
    m.position.set(d.x, d.y, d.z);
    m.scale.set(d.w, d.h, 1);
    m.rotation.z = d.rot;
    group.add(m);
    rays.push({ mesh: m, mat, base: d.o, seed: i * 1.9 });
  });

  // --- Falling petals (marigold, rose, jasmine)
  const petalCount = motion ? (opts.quality === 'high' ? 46 : 18) : 0;
  const petalGeo = track(new THREE.PlaneGeometry(0.028, 0.018, 2, 1));
  // gentle cup so petals catch light like real petals rather than flat cards
  const pp = petalGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.abs(pp.getX(i)) * 0.35);
  petalGeo.computeVertexNormals();
  const petalMat = track(new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide }));
  const petals = new THREE.InstancedMesh(petalGeo, petalMat, Math.max(1, petalCount));
  petals.count = petalCount;
  const palette = [0xf28c1c, 0xf6b21b, 0xc8243c, 0xfff6e6, 0xe2572a];
  const petalState = Array.from({ length: petalCount }, () => ({
    x: (Math.random() - 0.5) * 5,
    y: Math.random() * 4,
    z: -4 + Math.random() * 5,
    vy: 0.12 + Math.random() * 0.16,
    sway: Math.random() * Math.PI * 2,
    spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(2.5),
  }));
  const tmpColor = new THREE.Color();
  petalState.forEach((_, i) => petals.setColorAt(i, tmpColor.setHex(palette[i % palette.length])));
  if (petals.instanceColor) petals.instanceColor.needsUpdate = true;
  if (petalCount) group.add(petals);
  const dummy = new THREE.Object3D();

  return {
    group,
    update(t, dt) {
      for (const f of flames) f.update(t);
      for (const l of lights) {
        l.light.intensity = l.base * (0.9 + 0.1 * Math.sin(t * 11 + l.seed) * Math.sin(t * 4.3 + l.seed));
      }

      // Aarti: slow clockwise circles (as seen from the devotees), with a gentle forward offering dip
      const a = -t * 1.9 * motion;
      aarti.position.set(
        aartiCenter.x + Math.sin(a) * 0.32,
        aartiCenter.y + Math.cos(a) * 0.32,
        aartiCenter.z + Math.sin(a * 0.5) * 0.04,
      );
      aarti.rotation.z = Math.sin(a) * 0.12;

      smokeMat.uniforms.uTime.value = t;

      for (const r of rays) r.mat.opacity = r.base * (0.8 + 0.2 * Math.sin(t * 0.35 + r.seed));

      for (let i = 0; i < petalCount; i++) {
        const s = petalState[i];
        s.y -= s.vy * dt;
        s.sway += dt * 1.3;
        if (s.y < 0.02) {
          s.y = 3.6 + Math.random() * 0.8;
          s.x = (Math.random() - 0.5) * 5;
          s.z = -4 + Math.random() * 5;
        }
        dummy.position.set(s.x + Math.sin(s.sway) * 0.18, s.y, s.z + Math.cos(s.sway * 0.7) * 0.1);
        dummy.rotation.set(t * s.spin.x, t * s.spin.y, t * s.spin.z);
        dummy.updateMatrix();
        petals.setMatrixAt(i, dummy.matrix);
      }
      if (petalCount) petals.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      // Sprite materials are created per flame; free them (sprite geometry is shared by three.js)
      group.traverse((obj) => {
        if (obj instanceof THREE.Sprite) obj.material.dispose();
      });
      for (const d of disposables) d.dispose();
      petals.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Painted sanctum (hybrid view): devotional artwork as a deep backdrop
// ---------------------------------------------------------------------------

export interface PaintedSanctumRig extends TempleLayer {
  /** Scales the backdrop to cover the view from the given camera (call on resize). */
  fitToCamera(camera: THREE.PerspectiveCamera): void;
}

export const PAINTED_BACKDROP_Z = -7;

export function buildPaintedSanctum(texture: THREE.Texture): PaintedSanctumRig {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, depthWrite: true });
  const backdrop = new THREE.Mesh(geo, mat);
  backdrop.position.set(0, 0, PAINTED_BACKDROP_Z);
  group.add(backdrop);

  // Invisible floor that only shows real-time shadows, grounding the 3D props on the painting
  const catcherGeo = new THREE.PlaneGeometry(8, 8);
  const catcherMat = new THREE.ShadowMaterial({ opacity: 0.42 });
  const catcher = new THREE.Mesh(catcherGeo, catcherMat);
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = 0.001;
  catcher.receiveShadow = true;
  group.add(catcher);

  const image = texture.image as { width?: number; height?: number } | undefined;
  const imageAspect = image?.width && image?.height ? image.width / image.height : 4 / 3;

  return {
    group,
    fitToCamera(camera) {
      // Cover the frustum at the backdrop depth with a 16% margin so limited orbiting/parallax
      // never reveals an edge. The painting's horizon sits a little below centre like a real sanctum.
      const distance = Math.abs(camera.position.z - PAINTED_BACKDROP_Z);
      const viewH = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.16;
      const viewW = viewH * camera.aspect;
      const h = Math.max(viewH, viewW / imageAspect);
      backdrop.scale.set(h * imageAspect, h, 1);
      backdrop.position.y = camera.position.y - viewH * 0.06;
    },
    update() {
      /* static */
    },
    dispose() {
      geo.dispose();
      mat.dispose();
      catcherGeo.dispose();
      catcherMat.dispose();
    },
  };
}
