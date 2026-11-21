import * as THREE from 'three';
import {
  createCarvedSandstoneTextures,
  createHammeredGoldTextures,
  createSanctumFloorTextures,
} from './templeMaterials';

export interface TempleSanctuaryRig {
  root: THREE.Group;
  sanctumLightMesh: THREE.Mesh;
  goldTextures: ReturnType<typeof createHammeredGoldTextures>;
  setSanctumGlow: (intensity: number) => void;
  dispose: () => void;
}

/**
 * Builds a monumental Indian temple architecture colonnade leading to a sacred golden sanctum archway:
 * - Stepped carved stone floor extending smoothly into midnight navy horizon fog
 * - 8 multi-part carved pillars (6 distinct architectural segments per pillar:
 *   stepped plinth, lotus base molding, fluted/octagonal column shaft, antique gold collar bands,
 *   bracket potika capital, and upper abacus)
 * - Overhead longitudinal entablature beams & carved frieze
 * - Grand stepped Sanctum Torana portal framing the inner golden radiance
 */
export function buildTempleSanctuary(
  maxAnisotropy: number,
  enableShadows: boolean,
): TempleSanctuaryRig {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const stoneTex = createCarvedSandstoneTextures(maxAnisotropy);
  const goldTex = createHammeredGoldTextures(maxAnisotropy);
  const floorTex = createSanctumFloorTextures(maxAnisotropy);
  disposables.push(stoneTex, goldTex, floorTex);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: stoneTex.colorMap,
    bumpMap: stoneTex.bumpMap,
    bumpScale: 0.045,
    roughnessMap: stoneTex.roughnessMap,
    roughness: 0.82,
    metalness: 0.08,
  });

  const goldTrimMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xd8ae5e),
    bumpMap: goldTex.bumpMap,
    bumpScale: 0.015,
    roughnessMap: goldTex.roughnessMap,
    metalness: 0.88,
    roughness: 0.28,
    clearcoat: 0.28,
    clearcoatRoughness: 0.22,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: floorTex.colorMap,
    bumpMap: floorTex.bumpMap,
    bumpScale: 0.025,
    roughnessMap: floorTex.roughnessMap,
    roughness: 0.36,
    metalness: 0.16,
  });

  disposables.push(stoneMat, goldTrimMat, floorMat);

  // 1. Honed temple courtyard floor (large enough to blend seamlessly into horizon fog)
  const floorGeo = new THREE.PlaneGeometry(80, 90);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, -14);
  floorMesh.receiveShadow = enableShadows;
  root.add(floorMesh);
  disposables.push(floorGeo);

  // Raised central ceremonial stone runner (offset Y >= 0.02 to prevent Z-fighting)
  const runnerGeo = new THREE.BoxGeometry(5.2, 0.06, 36);
  const runnerMesh = new THREE.Mesh(runnerGeo, stoneMat);
  runnerMesh.position.set(0, 0.03, -6);
  runnerMesh.receiveShadow = enableShadows;
  root.add(runnerMesh);
  disposables.push(runnerGeo);

  // Golden inlaid threshold strips flanking the ceremonial walkway
  const inlayGeo = new THREE.BoxGeometry(0.08, 0.07, 36);
  for (const side of [-1, 1]) {
    const inlay = new THREE.Mesh(inlayGeo, goldTrimMat);
    inlay.position.set(side * 2.52, 0.036, -6);
    root.add(inlay);
  }
  disposables.push(inlayGeo);

  // Shared Pillar Geometries (6 distinct parts per monumental column)
  const plinthLowerGeo = new THREE.BoxGeometry(1.55, 0.42, 1.55);
  const plinthUpperGeo = new THREE.BoxGeometry(1.26, 0.34, 1.26);
  const baseMoldingGeo = new THREE.CylinderGeometry(0.48, 0.62, 0.42, 12);
  const shaftGeo = new THREE.CylinderGeometry(0.39, 0.45, 5.1, 12);
  const goldCollarGeo = new THREE.TorusGeometry(0.435, 0.055, 10, 24);
  const capitalBellGeo = new THREE.CylinderGeometry(0.68, 0.41, 0.56, 12);
  const bracketCrossGeo = new THREE.BoxGeometry(1.56, 0.36, 0.64);
  const abacusGeo = new THREE.BoxGeometry(1.42, 0.28, 1.42);
  disposables.push(
    plinthLowerGeo,
    plinthUpperGeo,
    baseMoldingGeo,
    shaftGeo,
    goldCollarGeo,
    capitalBellGeo,
    bracketCrossGeo,
    abacusGeo,
  );

  function createTemplePillar(x: number, z: number): THREE.Group {
    const pillar = new THREE.Group();
    pillar.position.set(x, 0, z);

    const pLow = new THREE.Mesh(plinthLowerGeo, stoneMat);
    pLow.position.y = 0.21;
    pLow.castShadow = enableShadows;
    pLow.receiveShadow = enableShadows;
    pillar.add(pLow);

    const pUp = new THREE.Mesh(plinthUpperGeo, stoneMat);
    pUp.position.y = 0.59;
    pUp.castShadow = enableShadows;
    pUp.receiveShadow = enableShadows;
    pillar.add(pUp);

    const baseMold = new THREE.Mesh(baseMoldingGeo, stoneMat);
    baseMold.position.y = 0.97;
    baseMold.castShadow = enableShadows;
    pillar.add(baseMold);

    const shaft = new THREE.Mesh(shaftGeo, stoneMat);
    shaft.position.y = 3.72;
    shaft.castShadow = enableShadows;
    shaft.receiveShadow = enableShadows;
    pillar.add(shaft);

    // Three chased antique gold decorative bands along the carved column
    for (const bandY of [1.45, 3.85, 5.95]) {
      const collar = new THREE.Mesh(goldCollarGeo, goldTrimMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = bandY;
      pillar.add(collar);
    }

    const capBell = new THREE.Mesh(capitalBellGeo, stoneMat);
    capBell.position.y = 6.52;
    capBell.castShadow = enableShadows;
    pillar.add(capBell);

    // Traditional temple corbel bracket (potika) supporting architrave
    const bracketA = new THREE.Mesh(bracketCrossGeo, stoneMat);
    bracketA.position.y = 6.96;
    bracketA.castShadow = enableShadows;
    pillar.add(bracketA);

    const bracketB = new THREE.Mesh(bracketCrossGeo, stoneMat);
    bracketB.rotation.y = Math.PI / 2;
    bracketB.position.y = 6.96;
    pillar.add(bracketB);

    const abacus = new THREE.Mesh(abacusGeo, stoneMat);
    abacus.position.y = 7.26;
    pillar.add(abacus);

    return pillar;
  }

  // Symmetrical processional colonnade
  const pillarZCoords = [6.8, 1.4, -4.0, -9.4, -14.8];
  for (const z of pillarZCoords) {
    root.add(createTemplePillar(-3.35, z));
    root.add(createTemplePillar(3.35, z));
  }

  // Longitudinal stone architrave beams resting flush on pillar abaci
  const beamGeo = new THREE.BoxGeometry(1.18, 0.72, 24.5);
  const beamTrimGeo = new THREE.BoxGeometry(1.24, 0.1, 24.5);
  for (const side of [-1, 1]) {
    const beam = new THREE.Mesh(beamGeo, stoneMat);
    beam.position.set(side * 3.35, 7.75, -4.0);
    beam.castShadow = enableShadows;
    root.add(beam);

    const trim = new THREE.Mesh(beamTrimGeo, goldTrimMat);
    trim.position.set(side * 3.35, 7.42, -4.0);
    root.add(trim);
  }
  disposables.push(beamGeo, beamTrimGeo);

  // Transverse ceremonial lintel beams tying left and right colonnades
  const crossBeamGeo = new THREE.BoxGeometry(7.9, 0.56, 0.92);
  for (const z of [1.4, -4.0, -9.4]) {
    const cross = new THREE.Mesh(crossBeamGeo, stoneMat);
    cross.position.set(0, 7.82, z);
    root.add(cross);
  }
  disposables.push(crossBeamGeo);

  // 2. Grand Sanctum Torana Gateway at the focal end (z = -17.2)
  const sanctumGroup = new THREE.Group();
  sanctumGroup.position.set(0, 0, -17.2);

  const sanctumStepGeo = new THREE.BoxGeometry(9.6, 0.34, 3.8);
  const sanctumStep = new THREE.Mesh(sanctumStepGeo, stoneMat);
  sanctumStep.position.set(0, 0.17, 0.2);
  sanctumGroup.add(sanctumStep);

  const sanctumStep2Geo = new THREE.BoxGeometry(7.8, 0.32, 2.8);
  const sanctumStep2 = new THREE.Mesh(sanctumStep2Geo, stoneMat);
  sanctumStep2.position.set(0, 0.48, 0);
  sanctumGroup.add(sanctumStep2);

  // Flanking jamb piers (grounded against outer walls)
  const jambGeo = new THREE.BoxGeometry(2.6, 8.2, 1.8);
  const innerPilasterGeo = new THREE.BoxGeometry(0.46, 5.05, 0.72);
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(jambGeo, stoneMat);
    jamb.position.set(side * 3.8, 4.1, 0);
    jamb.castShadow = enableShadows;
    sanctumGroup.add(jamb);

    const pilaster = new THREE.Mesh(innerPilasterGeo, stoneMat);
    pilaster.position.set(side * 2.35, 2.52, 0.65);
    sanctumGroup.add(pilaster);
  }

  // Outer carved sanctum hall side walls framing the courtyard perimeter cleanly
  const hallWallGeo = new THREE.BoxGeometry(0.9, 8.8, 32);
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(hallWallGeo, stoneMat);
    wall.position.set(side * 7.8, 4.4, -3.5);
    root.add(wall);
  }
  disposables.push(innerPilasterGeo, hallWallGeo);

  // Stepped temple gopuram / cornice tiers crowning the gateway
  const cornice1Geo = new THREE.BoxGeometry(10.8, 0.95, 2.2);
  const cornice1 = new THREE.Mesh(cornice1Geo, stoneMat);
  cornice1.position.set(0, 8.15, 0);
  sanctumGroup.add(cornice1);

  const cornice2Geo = new THREE.BoxGeometry(8.8, 0.78, 1.9);
  const cornice2 = new THREE.Mesh(cornice2Geo, stoneMat);
  cornice2.position.set(0, 9.0, 0);
  sanctumGroup.add(cornice2);

  const cornice3Geo = new THREE.BoxGeometry(6.4, 0.65, 1.6);
  const cornice3 = new THREE.Mesh(cornice3Geo, stoneMat);
  cornice3.position.set(0, 9.7, 0);
  sanctumGroup.add(cornice3);

  // Ornamental gold torana arch resting cleanly on inner doorway pilasters
  const toranaArchGeo = new THREE.TorusGeometry(2.35, 0.11, 12, 36, Math.PI);
  const toranaArch = new THREE.Mesh(toranaArchGeo, goldTrimMat);
  toranaArch.position.set(0, 4.95, 0.72);
  sanctumGroup.add(toranaArch);

  // Inner sanctum luminous backdrop plane behind threshold
  const portalGlowGeo = new THREE.PlaneGeometry(5.2, 7.6);
  const portalGlowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uGlow: { value: 0.25 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uGlow;
      varying vec2 vUv;
      void main() {
        vec2 centered = (vUv - vec2(0.5, 0.44)) * vec2(1.0, 0.72);
        float dist = length(centered);
        float core = exp(-dist * dist * 5.2);
        float halo = exp(-dist * 2.4) * 0.55;
        vec3 deepGold = vec3(0.84, 0.62, 0.26);
        vec3 warmWhite = vec3(1.0, 0.94, 0.78);
        vec3 col = mix(deepGold, warmWhite, clamp(core * 1.1, 0.0, 1.0));
        float alpha = clamp((core + halo) * uGlow, 0.0, 0.98);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const sanctumLightMesh = new THREE.Mesh(portalGlowGeo, portalGlowMat);
  sanctumLightMesh.position.set(0, 3.85, -0.45);
  sanctumGroup.add(sanctumLightMesh);

  root.add(sanctumGroup);

  disposables.push(
    sanctumStepGeo,
    sanctumStep2Geo,
    jambGeo,
    cornice1Geo,
    cornice2Geo,
    cornice3Geo,
    toranaArchGeo,
    portalGlowGeo,
    portalGlowMat,
  );

  return {
    root,
    sanctumLightMesh,
    goldTextures: goldTex,
    setSanctumGlow: (intensity: number) => {
      portalGlowMat.uniforms.uGlow.value = intensity;
    },
    dispose: () => {
      for (const item of disposables) item.dispose();
    },
  };
}
