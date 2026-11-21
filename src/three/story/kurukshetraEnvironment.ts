import * as THREE from 'three';
import type { AtmospherePreset, QualityProfileConfig, StoryFrameSnapshot } from './storyTimeline';

export interface KurukshetraEnvironmentHandle {
  group: THREE.Group;
  fog: THREE.FogExp2;
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  cosmicFillLight: THREE.PointLight;
  update: (params: {
    snapshot: StoryFrameSnapshot;
    timeSec: number;
    reducedMotion: boolean;
  }) => void;
  dispose: () => void;
}

const SKY_VERTEX_SHADER = `
  varying vec3 vWorldDir;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SKY_FRAGMENT_SHADER = `
  uniform vec3 uZenithColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uCosmicMix;
  uniform float uTime;
  varying vec3 vWorldDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y * 0.85 + 0.15, 0.0, 1.0);
    vec3 col = mix(uHorizonColor, uZenithColor, pow(h, 0.58));

    float sunAmt = max(dot(dir, normalize(uSunDir)), 0.0);
    col += uSunColor * pow(sunAmt, 14.0) * 0.72;
    col += uSunColor * pow(sunAmt, 140.0) * 1.15;

    // Subtle cosmic starlight emerges cleanly during Vishvarupa Scene 04
    if (uCosmicMix > 0.01 && dir.y > 0.05) {
      vec2 grid = floor(dir.xz / max(0.08, dir.y + 0.25) * 32.0);
      float starVal = hash(grid);
      if (starVal > 0.985) {
        float twinkle = 0.6 + 0.4 * sin(uTime * 2.5 + starVal * 90.0);
        col += vec3(1.0, 0.88, 0.65) * uCosmicMix * twinkle * 1.1;
      }
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

interface AtmospherePalette {
  zenith: THREE.Color;
  horizon: THREE.Color;
  sun: THREE.Color;
  fog: THREE.Color;
  sunIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
}

const PALETTES: Record<AtmospherePreset, AtmospherePalette> = {
  dawn: {
    zenith: new THREE.Color(0x16223d),
    horizon: new THREE.Color(0xe5a45b),
    sun: new THREE.Color(0xffdfa3),
    fog: new THREE.Color(0x9a7554),
    sunIntensity: 2.35,
    hemiSky: new THREE.Color(0xffe1b5),
    hemiGround: new THREE.Color(0x47331e),
  },
  dilemma: {
    zenith: new THREE.Color(0x192038),
    horizon: new THREE.Color(0xb87e4b),
    sun: new THREE.Color(0xf7c57c),
    fog: new THREE.Color(0x6d5846),
    sunIntensity: 1.9,
    hemiSky: new THREE.Color(0xd9b384),
    hemiGround: new THREE.Color(0x3a2a1c),
  },
  teaching: {
    zenith: new THREE.Color(0x1a294a),
    horizon: new THREE.Color(0xf0b86e),
    sun: new THREE.Color(0xffe8b8),
    fog: new THREE.Color(0x8e6f4f),
    sunIntensity: 2.45,
    hemiSky: new THREE.Color(0xffe6bd),
    hemiGround: new THREE.Color(0x4a3622),
  },
  cosmic: {
    zenith: new THREE.Color(0x050714),
    horizon: new THREE.Color(0x22234a),
    sun: new THREE.Color(0xf3cd82),
    fog: new THREE.Color(0x0d1126),
    sunIntensity: 1.05,
    hemiSky: new THREE.Color(0x8fa7ff),
    hemiGround: new THREE.Color(0x1b1528),
  },
  wisdom: {
    zenith: new THREE.Color(0x1d2b4f),
    horizon: new THREE.Color(0xe7b46b),
    sun: new THREE.Color(0xffebb8),
    fog: new THREE.Color(0x876a4a),
    sunIntensity: 2.35,
    hemiSky: new THREE.Color(0xffe5bd),
    hemiGround: new THREE.Color(0x453220),
  },
  clarity: {
    zenith: new THREE.Color(0x1e355e),
    horizon: new THREE.Color(0xf2c179),
    sun: new THREE.Color(0xfff0c4),
    fog: new THREE.Color(0x9b7952),
    sunIntensity: 2.55,
    hemiSky: new THREE.Color(0xffebc5),
    hemiGround: new THREE.Color(0x4f3923),
  },
  eternal: {
    zenith: new THREE.Color(0x223866),
    horizon: new THREE.Color(0xf9d18b),
    sun: new THREE.Color(0xfff6dc),
    fog: new THREE.Color(0xb68f5d),
    sunIntensity: 2.75,
    hemiSky: new THREE.Color(0xfff0cc),
    hemiGround: new THREE.Color(0x5b4228),
  },
  'war-fury': {
    zenith: new THREE.Color(0x2a1f28),
    horizon: new THREE.Color(0xd97d42),
    sun: new THREE.Color(0xffb86b),
    fog: new THREE.Color(0x7d5338),
    sunIntensity: 2.45,
    hemiSky: new THREE.Color(0xf4b67f),
    hemiGround: new THREE.Color(0x472d1c),
  },
  'sunset-eclipse': {
    zenith: new THREE.Color(0x1b1124),
    horizon: new THREE.Color(0xc9552d),
    sun: new THREE.Color(0xff9254),
    fog: new THREE.Color(0x5a3128),
    sunIntensity: 1.95,
    hemiSky: new THREE.Color(0xe6845a),
    hemiGround: new THREE.Color(0x361f18),
  },
  'night-torches': {
    zenith: new THREE.Color(0x060916),
    horizon: new THREE.Color(0x2a1b19),
    sun: new THREE.Color(0x6b7fb8),
    fog: new THREE.Color(0x120f1c),
    sunIntensity: 0.55,
    hemiSky: new THREE.Color(0x4a5d8f),
    hemiGround: new THREE.Color(0x1f1410),
  },
  'dusk-aftermath': {
    zenith: new THREE.Color(0x1a1e33),
    horizon: new THREE.Color(0xb8764c),
    sun: new THREE.Color(0xffc088),
    fog: new THREE.Color(0x5d463a),
    sunIntensity: 1.75,
    hemiSky: new THREE.Color(0xd19c73),
    hemiGround: new THREE.Color(0x33251d),
  },
};

function createSoftParticleTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
  grad.addColorStop(0, 'rgba(255, 232, 185, 0.95)');
  grad.addColorStop(0.5, 'rgba(243, 205, 130, 0.4)');
  grad.addColorStop(1, 'rgba(243, 205, 130, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function createKurukshetraEnvironment(
  quality: QualityProfileConfig,
): KurukshetraEnvironmentHandle {
  const group = new THREE.Group();
  group.name = 'KurukshetraEnvironment';
  const disposables: Array<{ dispose: () => void }> = [];

  const fog = new THREE.FogExp2(0x9a7554, 0.011);

  // 1. Lighting Rig (Sunrise Key Light + Hemisphere Sky/Sand Bounce + Cosmic Point Light)
  const hemiLight = new THREE.HemisphereLight(0xffe1b5, 0x47331e, 1.05);
  group.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffdfa3, 2.35);
  sunLight.position.set(22, 18, 62);
  sunLight.castShadow = quality.enableShadows;
  sunLight.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  sunLight.shadow.camera.near = 2;
  sunLight.shadow.camera.far = 140;
  sunLight.shadow.camera.left = -26;
  sunLight.shadow.camera.right = 26;
  sunLight.shadow.camera.top = 22;
  sunLight.shadow.camera.bottom = -16;
  sunLight.shadow.bias = -0.0008;
  group.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x9bb8ff, 0.58);
  rimLight.position.set(-28, 12, -32);
  group.add(rimLight);

  const portraitFillLight = new THREE.DirectionalLight(0xffe0b0, 0.45);
  portraitFillLight.position.set(-14, 7.5, 28);
  group.add(portraitFillLight);

  const cosmicFillLight = new THREE.PointLight(0xf3cd82, 0, 36, 1.4);
  cosmicFillLight.position.set(0, 5.2, -1.5);
  group.add(cosmicFillLight);

  // 2. Sky Dome Shader
  const skyUniforms = {
    uZenithColor: { value: PALETTES.dawn.zenith.clone() },
    uHorizonColor: { value: PALETTES.dawn.horizon.clone() },
    uSunColor: { value: PALETTES.dawn.sun.clone() },
    uSunDir: { value: new THREE.Vector3(0.28, 0.2, 0.92).normalize() },
    uCosmicMix: { value: 0 },
    uTime: { value: 0 },
  };
  const skyGeo = new THREE.SphereGeometry(280, 36, 24);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERTEX_SHADER,
    fragmentShader: SKY_FRAGMENT_SHADER,
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyDome);
  disposables.push(skyGeo, skyMat);

  // 3. Expansive Undulating Kurukshetra Plain (flat central chariot corridor |x| < 12)
  const terrainGeo = new THREE.PlaneGeometry(420, 420, 88, 88);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
  const tCols = new Float32Array(tPos.count * 3);
  const sandA = new THREE.Color(0x94734d);
  const sandB = new THREE.Color(0x705336);
  const cTmp = new THREE.Color();

  for (let i = 0; i < tPos.count; i++) {
    const x = tPos.getX(i);
    const z = tPos.getZ(i);
    const dist = Math.hypot(x, z);
    // Keep central corridor flat for flawless wheel contact
    const corridorBlend = THREE.MathUtils.smoothstep(Math.abs(x), 11, 28);
    const ridge =
      (Math.sin(x * 0.045) * Math.cos(z * 0.038) * 1.4 +
        Math.sin(x * 0.11 + z * 0.09) * 0.35) *
        corridorBlend +
      Math.max(0, (dist - 105) * 0.16);
    tPos.setY(i, ridge);

    const shade = 0.5 + 0.5 * Math.sin(x * 0.08 + z * 0.07);
    cTmp.lerpColors(sandA, sandB, shade);
    tCols[i * 3] = cTmp.r;
    tCols[i * 3 + 1] = cTmp.g;
    tCols[i * 3 + 2] = cTmp.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(tCols, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.receiveShadow = quality.enableShadows;
  group.add(terrain);
  disposables.push(terrainGeo, terrainMat);

  // 4. Distant Kurukshetra Horizon Hills Silhouette
  const hillGeo = new THREE.ConeGeometry(28, 18, 7);
  const hillMat = new THREE.MeshStandardMaterial({
    color: 0x3b312a,
    roughness: 0.95,
    metalness: 0.0,
  });
  const hillInst = new THREE.InstancedMesh(hillGeo, hillMat, 26);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2;
    const radius = 165 + (i % 3) * 18;
    dummy.position.set(Math.cos(angle) * radius, 4 + (i % 4) * 1.8, Math.sin(angle) * radius);
    dummy.scale.set(1.4 + (i % 3) * 0.4, 0.8 + (i % 5) * 0.25, 1.3);
    dummy.rotation.y = angle;
    dummy.updateMatrix();
    hillInst.setMatrixAt(i, dummy.matrix);
  }
  group.add(hillInst);
  disposables.push(hillGeo, hillMat);

  // 5. GPU-Instanced Opposing Armies (Pandavas left/back vs Kauravas front/right) + Spears
  const countPerArmy = quality.soldierInstancesPerArmy;
  const totalSoldiers = countPerArmy * 2;
  // Sculpted armored warrior silhouette (chest + waist + helm + shield) merged manually into one clean buffer
  const torso = new THREE.CylinderGeometry(0.24, 0.2, 1.25, 7);
  torso.translate(0, 0.85, 0);
  const helm = new THREE.ConeGeometry(0.14, 0.26, 7);
  helm.translate(0, 1.68, 0);
  const shield = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 8);
  shield.rotateZ(Math.PI / 2);
  shield.translate(-0.28, 1.05, 0.06);

  const soldierParts = [torso, helm, shield].map((g) => (g.index ? g.toNonIndexed() : g));
  const totalVerts = soldierParts.reduce((acc, g) => acc + g.attributes.position.count, 0);
  const sPos = new Float32Array(totalVerts * 3);
  const sNorm = new Float32Array(totalVerts * 3);
  let vOffset = 0;
  for (const part of soldierParts) {
    part.computeVertexNormals();
    const pArr = part.attributes.position.array as Float32Array;
    const nArr = part.attributes.normal.array as Float32Array;
    sPos.set(pArr, vOffset * 3);
    sNorm.set(nArr, vOffset * 3);
    vOffset += part.attributes.position.count;
    part.dispose();
  }
  const soldierGeo = new THREE.BufferGeometry();
  soldierGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  soldierGeo.setAttribute('normal', new THREE.BufferAttribute(sNorm, 3));
  const soldierMat = new THREE.MeshStandardMaterial({
    roughness: 0.62,
    metalness: 0.38,
  });
  const soldiersInst = new THREE.InstancedMesh(soldierGeo, soldierMat, totalSoldiers);
  soldiersInst.castShadow = false;
  soldiersInst.receiveShadow = true;

  const spearGeo = new THREE.CylinderGeometry(0.025, 0.03, 2.55, 5);
  spearGeo.translate(0.26, 1.35, 0);
  const spearMat = new THREE.MeshStandardMaterial({
    color: 0xc49c54,
    roughness: 0.4,
    metalness: 0.72,
  });
  const spearsInst = new THREE.InstancedMesh(spearGeo, spearMat, totalSoldiers);

  const pandavaArmor = new THREE.Color(0x9a6d38);
  const kauravaArmor = new THREE.Color(0x5e2c26);

  let idx = 0;
  const colsPerRank = Math.max(12, Math.round(Math.sqrt(countPerArmy * 1.6)));
  for (let side = 0; side < 2; side++) {
    const isKaurava = side === 1;
    for (let i = 0; i < countPerArmy; i++) {
      const row = Math.floor(i / colsPerRank);
      const col = i % colsPerRank;
      const jitterX = Math.sin(i * 12.9898 + side) * 0.45;
      const jitterZ = Math.cos(i * 78.233 + side) * 0.45;
      // Leave wide ceremonial space (|z| < 18, |x| < 10.5) clear around the chariot dialogue stage
      const spreadX = (col - colsPerRank / 2) * 2.15 + jitterX;
      const clampedX = Math.abs(spreadX) < 10.5 ? (spreadX < 0 ? spreadX - 11 : spreadX + 11) : spreadX;
      const rankZ = (isKaurava ? 22 + row * 2.1 : -26 - row * 2.1) + jitterZ;

      dummy.position.set(clampedX, 0, rankZ);
      dummy.rotation.set(0, isKaurava ? Math.PI : 0, 0);
      const scaleVar = 0.94 + ((i * 7) % 10) * 0.015;
      dummy.scale.set(scaleVar, scaleVar, scaleVar);
      dummy.updateMatrix();

      soldiersInst.setMatrixAt(idx, dummy.matrix);
      spearsInst.setMatrixAt(idx, dummy.matrix);
      soldiersInst.setColorAt(idx, isKaurava ? kauravaArmor : pandavaArmor);
      idx += 1;
    }
  }
  soldiersInst.instanceMatrix.needsUpdate = true;
  if (soldiersInst.instanceColor) soldiersInst.instanceColor.needsUpdate = true;
  spearsInst.instanceMatrix.needsUpdate = true;
  group.add(soldiersInst);
  group.add(spearsInst);
  disposables.push(soldierGeo, soldierMat, spearGeo, spearMat);

  // 6. Wind-Animated Regimental Banners
  const bannerCount = quality.bannerCount;
  const bannerPoleGeo = new THREE.CylinderGeometry(0.04, 0.05, 5.2, 6);
  bannerPoleGeo.translate(0, 2.6, 0);
  const bannerClothGeo = new THREE.PlaneGeometry(1.5, 0.9, 6, 3);
  bannerClothGeo.translate(0.75, 4.7, 0);
  const bannerPoleMat = new THREE.MeshStandardMaterial({ color: 0xc99c4a, metalness: 0.7, roughness: 0.35 });
  const bannerClothMat = new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide });

  const polesInst = new THREE.InstancedMesh(bannerPoleGeo, bannerPoleMat, bannerCount);
  const clothsInst = new THREE.InstancedMesh(bannerClothGeo, bannerClothMat, bannerCount);
  const bannerMeta: Array<{ x: number; z: number; phase: number }> = [];

  for (let i = 0; i < bannerCount; i++) {
    const isKaurava = i % 2 === 1;
    const rankIdx = Math.floor(i / 2);
    const x = (rankIdx - bannerCount / 4) * 7.5 + (isKaurava ? 3.5 : -3.5);
    const clampedX = Math.abs(x) < 12 ? (x < 0 ? -12.5 : 12.5) : x;
    const z = isKaurava ? 24 + (rankIdx % 3) * 8 : -28 - (rankIdx % 3) * 8;
    bannerMeta.push({ x: clampedX, z, phase: i * 0.9 });

    dummy.position.set(clampedX, 0, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    polesInst.setMatrixAt(i, dummy.matrix);
    clothsInst.setColorAt(i, new THREE.Color(isKaurava ? 0x99231f : 0xd96820));
  }
  if (clothsInst.instanceColor) clothsInst.instanceColor.needsUpdate = true;
  group.add(polesInst);
  group.add(clothsInst);
  disposables.push(bannerPoleGeo, bannerPoleMat, bannerClothGeo, bannerClothMat);

  // 7. Distant Siege Chariots along opposing wings
  const wingChariotGeo = new THREE.BoxGeometry(2.1, 1.45, 2.5);
  wingChariotGeo.translate(0, 1.15, 0);
  const wingChariotMat = new THREE.MeshStandardMaterial({ color: 0x735128, roughness: 0.5, metalness: 0.55 });
  const wingChariots = new THREE.InstancedMesh(wingChariotGeo, wingChariotMat, 12);
  for (let i = 0; i < 12; i++) {
    const isFront = i < 6;
    const side = (i % 6) - 2.5;
    const x = side * 12 + (side >= 0 ? 11 : -11);
    const z = isFront ? 29 : -33;
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, isFront ? Math.PI : 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    wingChariots.setMatrixAt(i, dummy.matrix);
  }
  group.add(wingChariots);
  disposables.push(wingChariotGeo, wingChariotMat);

  // 8. Golden Atmospheric Kurukshetra Dust Particles
  const dustCount = quality.dustParticleCount;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 85;
    dustPositions[i * 3 + 1] = 0.25 + Math.random() * 8.5;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustTex = createSoftParticleTexture();
  const dustMat = new THREE.PointsMaterial({
    size: 0.42,
    map: dustTex ?? undefined,
    color: 0xffdfa2,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  group.add(dustPoints);
  disposables.push(dustGeo, dustMat);
  if (dustTex) disposables.push(dustTex);

  const curPalette = PALETTES.dawn;

  const update = (params: {
    snapshot: StoryFrameSnapshot;
    timeSec: number;
    reducedMotion: boolean;
  }) => {
    const { snapshot, timeSec, reducedMotion } = params;
    const target = PALETTES[snapshot.atmospherePreset] ?? PALETTES.dawn;
    const cosmicMix = snapshot.vishvarupaIntensity;

    // Smooth atmospheric color interpolation
    skyUniforms.uZenithColor.value.lerp(target.zenith, 0.08);
    skyUniforms.uHorizonColor.value.lerp(target.horizon, 0.08);
    skyUniforms.uSunColor.value.lerp(target.sun, 0.08);
    skyUniforms.uCosmicMix.value = cosmicMix;
    skyUniforms.uTime.value = timeSec;

    const elevRad = THREE.MathUtils.degToRad(snapshot.sunElevationDeg);
    skyUniforms.uSunDir.value
      .set(0.26, Math.sin(elevRad), Math.cos(elevRad))
      .normalize();

    sunLight.position.set(22, Math.max(4, Math.sin(elevRad) * 65), Math.cos(elevRad) * 65);
    sunLight.intensity = THREE.MathUtils.lerp(
      sunLight.intensity,
      target.sunIntensity,
      0.08,
    );

    hemiLight.color.lerp(target.hemiSky, 0.08);
    hemiLight.groundColor.lerp(target.hemiGround, 0.08);

    fog.color.lerp(target.fog, 0.08);
    fog.density = THREE.MathUtils.lerp(fog.density, snapshot.fogDensity, 0.08);

    // Cosmic illumination glow on chariot heroes during Scene 04
    cosmicFillLight.position.z = snapshot.chariotPositionZ - 1.2;
    cosmicFillLight.intensity = cosmicMix * (7.5 + Math.sin(timeSec * 2.2) * 0.9);

    // Animate fluttering battlefield banners gently in wind
    for (let i = 0; i < bannerMeta.length; i++) {
      const b = bannerMeta[i];
      const sway = reducedMotion ? 0 : Math.sin(timeSec * 2.6 + b.phase) * 0.14;
      dummy.position.set(b.x, 0, b.z);
      dummy.rotation.set(0, sway, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      clothsInst.setMatrixAt(i, dummy.matrix);
    }
    clothsInst.instanceMatrix.needsUpdate = true;

    // Slow drifting dust veil
    if (!reducedMotion) {
      dustPoints.rotation.y = timeSec * 0.015;
    }
    dustMat.opacity = 0.42 * (1 - cosmicMix * 0.65) + 0.14 * snapshot.dawnGoldenMix;
    void curPalette;
  };

  const dispose = () => {
    for (const d of disposables) d.dispose();
  };

  return {
    group,
    fog,
    sunLight,
    hemiLight,
    cosmicFillLight,
    update,
    dispose,
  };
}
