import * as THREE from 'three';
import type { QualityProfileConfig } from './storyTimeline';

export interface VishvarupaTransformHandle {
  group: THREE.Group;
  update: (params: {
    intensity: number; // 0..1 overall revelation scale
    phase: number; // 0..1 across Scene 04's 8 phases
    chariotPositionZ: number;
    timeSec: number;
    reducedMotion: boolean;
  }) => void;
  dispose: () => void;
}

/**
 * Progressive 8-phase devotional 3D Vishvarupa Cosmic Revelation centered behind Sri Krishna:
 *   0.00 - 0.12 : Sacred stillness & awakening golden halo
 *   0.12 - 0.28 : Concentric counter-rotating Kalachakra (Wheel of Time) golden rings
 *   0.28 - 0.44 : Cosmic nebula sphere + outward golden light rays
 *   0.44 - 0.60 : Monumental sacred silhouette arches & divine golden emblems (Chakra, Lotus)
 *   0.60 - 0.74 : Infinite luminous star-worlds & planetary orbits expand outward
 *   0.74 - 0.84 : Peak cosmic unity radiance
 *   0.84 - 1.00 : Graceful retraction back into Krishna's serene charioteer presence
 */
export function createVishvarupaTransform(
  quality: QualityProfileConfig,
): VishvarupaTransformHandle {
  const group = new THREE.Group();
  group.name = 'VishvarupaCosmicRevelation';
  group.visible = false;

  const disposables: Array<{ dispose: () => void }> = [];

  const goldEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0xf6d58e,
    emissive: new THREE.Color(0xe6a83a),
    emissiveIntensity: 1.35,
    metalness: 0.88,
    roughness: 0.2,
    transparent: true,
    opacity: 0.95,
  });

  const auraDiscMat = new THREE.MeshBasicMaterial({
    color: 0xffd782,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const nebulaMat = new THREE.MeshBasicMaterial({
    color: 0x3b4ba8,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  });

  disposables.push(goldEmissiveMat, auraDiscMat, nebulaMat);

  // Anchor behind Krishna's stance on the chariot
  const origin = new THREE.Group();
  origin.position.set(-0.34, 3.85, -0.5);
  group.add(origin);

  // 1. Central Solar Halo Disc & Golden Corona
  const coreDiscGeo = new THREE.CircleGeometry(2.4, 48);
  const coreDisc = new THREE.Mesh(coreDiscGeo, auraDiscMat);
  origin.add(coreDisc);
  disposables.push(coreDiscGeo);

  // 2. Concentric Counter-Rotating Kalachakra Mandalas
  const mandalaRings: THREE.Group[] = [];
  const ringRadii = [2.8, 4.6, 6.8, 9.4];
  for (let rIdx = 0; rIdx < ringRadii.length; rIdx++) {
    const r = ringRadii[rIdx];
    const ringGroup = new THREE.Group();
    const torusGeo = new THREE.TorusGeometry(r, 0.045 + rIdx * 0.012, 10, 64);
    const torus = new THREE.Mesh(torusGeo, goldEmissiveMat);
    ringGroup.add(torus);
    disposables.push(torusGeo);

    // Engraved solar spokes along ring perimeter
    const spokeCount = 12 + rIdx * 6;
    const markerGeo = new THREE.OctahedronGeometry(0.14 + rIdx * 0.03, 0);
    disposables.push(markerGeo);
    for (let s = 0; s < spokeCount; s++) {
      const angle = (s / spokeCount) * Math.PI * 2;
      const marker = new THREE.Mesh(markerGeo, goldEmissiveMat);
      marker.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      marker.rotation.z = angle;
      ringGroup.add(marker);
    }

    origin.add(ringGroup);
    mandalaRings.push(ringGroup);
  }

  // 3. Radiant Cosmic Multi-Armed Silhouette Arches & Divine Emblems (Sudarshana Chakra + Sacred Wings)
  const emblemGroup = new THREE.Group();
  const wingCount = 8;
  const rayGeo = new THREE.ConeGeometry(0.18, 6.2, 6);
  rayGeo.translate(0, 3.1, 0);
  disposables.push(rayGeo);

  for (let i = 0; i < wingCount; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const tier = Math.floor(i / 2);
    const ray = new THREE.Mesh(rayGeo, auraDiscMat);
    ray.rotation.z = side * (0.35 + tier * 0.28);
    ray.position.set(side * (0.9 + tier * 0.45), -0.4 + tier * 0.35, -0.4 - tier * 0.15);
    emblemGroup.add(ray);
  }

  // Two monumental spinning Sudarshana Chakra rings framing upper radiance
  const chakraGeo = new THREE.TorusGeometry(1.05, 0.055, 8, 24);
  disposables.push(chakraGeo);
  const leftChakra = new THREE.Mesh(chakraGeo, goldEmissiveMat);
  leftChakra.position.set(-4.2, 1.8, -0.6);
  const rightChakra = new THREE.Mesh(chakraGeo, goldEmissiveMat);
  rightChakra.position.set(4.2, 1.8, -0.6);
  emblemGroup.add(leftChakra, rightChakra);
  origin.add(emblemGroup);

  // 4. Outer Celestial Nebula Shell
  const nebulaGeo = new THREE.SphereGeometry(28, 28, 20);
  const nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
  origin.add(nebulaMesh);
  disposables.push(nebulaGeo);

  // 5. Star-Worlds & Orbital Celestial Nodes
  const starCount = quality.vishvarupaStarCount;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 5.5 + Math.random() * 24;
    starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = radius * Math.cos(phi) + 1.5;
    starPos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 3;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.28,
    color: 0xffe4a3,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  origin.add(stars);
  disposables.push(starGeo, starMat);

  const update = (params: {
    intensity: number;
    phase: number;
    chariotPositionZ: number;
    timeSec: number;
    reducedMotion: boolean;
  }) => {
    const { intensity, phase, chariotPositionZ, timeSec, reducedMotion } = params;
    group.position.z = chariotPositionZ;

    if (intensity <= 0.005) {
      group.visible = false;
      return;
    }

    group.visible = true;

    const motionScale = reducedMotion ? 0.12 : 1;
    const expandEase = THREE.MathUtils.smoothstep(intensity, 0.02, 0.92);
    origin.scale.setScalar(0.32 + expandEase * 0.92);

    // Progressive emergence across the 8 Vishvarupa phases
    auraDiscMat.opacity = 0.28 * intensity;
    nebulaMat.opacity = 0.22 * THREE.MathUtils.smoothstep(phase, 0.2, 0.55) * intensity;
    goldEmissiveMat.opacity = Math.min(0.95, intensity * 1.25);
    starMat.opacity = Math.min(0.92, intensity * 1.15);

    mandalaRings.forEach((ring, idx) => {
      const threshold = idx * 0.12;
      const ringActive = THREE.MathUtils.smoothstep(intensity, threshold, Math.min(1, threshold + 0.35));
      ring.visible = ringActive > 0.02;
      ring.scale.setScalar(0.5 + ringActive * 0.55);
      const dir = idx % 2 === 0 ? 1 : -1;
      ring.rotation.z = timeSec * (0.18 + idx * 0.06) * dir * motionScale;
      ring.rotation.x = Math.sin(timeSec * 0.35 * motionScale + idx) * 0.09;
    });

    const emblemReveal = THREE.MathUtils.smoothstep(intensity, 0.3, 0.72);
    emblemGroup.visible = emblemReveal > 0.02;
    emblemGroup.scale.setScalar(0.6 + emblemReveal * 0.55);
    leftChakra.rotation.z = timeSec * 1.6 * motionScale;
    rightChakra.rotation.z = -timeSec * 1.6 * motionScale;

    stars.rotation.y = timeSec * 0.08 * motionScale;
    stars.rotation.x = Math.sin(timeSec * 0.15 * motionScale) * 0.05;
  };

  const dispose = () => {
    for (const d of disposables) d.dispose();
  };

  return {
    group,
    update,
    dispose,
  };
}
