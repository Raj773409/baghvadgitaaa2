import * as THREE from 'three';
import type { MaterialTextureSet } from './templeMaterials';

export interface GoldenLotusEmblemRig {
  group: THREE.Group;
  update: (bloomProgress: number, timeSec: number, visibility: number) => void;
  dispose: () => void;
}

function createLotusPetalGeometry(length: number, width: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.62, length * 0.18, width * 0.56, length * 0.66, 0, length);
  shape.bezierCurveTo(-width * 0.56, length * 0.66, -width * 0.62, length * 0.18, 0, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.55,
    bevelSize: width * 0.08,
    bevelSegments: 2,
    curveSegments: 14,
  });
  geo.center();
  // Shift pivot cleanly to petal base
  geo.translate(0, length * 0.45, 0);
  return geo;
}

/**
 * Multi-tiered sculpted 3D Golden Lotus Emblem:
 * - Outer ring (8 sculpted bevelled petals)
 * - Middle ring (8 petals staggered by 22.5°)
 * - Inner crown (6 ascending petals cradling the sacred karnika seed-pod)
 * - Outer chased antique-gold halo ring
 */
export function buildGoldenLotusEmblem(goldTex: MaterialTextureSet): GoldenLotusEmblemRig {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const petalMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xdfb256),
    emissive: new THREE.Color(0x5b3b0e),
    emissiveIntensity: 0.24,
    bumpMap: goldTex.bumpMap,
    bumpScale: 0.014,
    roughnessMap: goldTex.roughnessMap,
    metalness: 0.88,
    roughness: 0.3,
    clearcoat: 0.28,
    clearcoatRoughness: 0.26,
  });

  const coreMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf5d68a),
    emissive: new THREE.Color(0x8e621c),
    emissiveIntensity: 0.45,
    metalness: 0.92,
    roughness: 0.18,
    clearcoat: 0.5,
  });

  disposables.push(petalMat, coreMat);

  const outerPetalGeo = createLotusPetalGeometry(1.18, 0.58, 0.055);
  const midPetalGeo = createLotusPetalGeometry(0.95, 0.46, 0.05);
  const innerPetalGeo = createLotusPetalGeometry(0.72, 0.36, 0.042);
  disposables.push(outerPetalGeo, midPetalGeo, innerPetalGeo);

  interface PetalEntry {
    pivot: THREE.Group;
    closedTilt: number;
    openTilt: number;
  }
  const petals: PetalEntry[] = [];

  const lotusCup = new THREE.Group();
  // Tilt the lotus face gently forward toward the camera while keeping warm brushed reflections
  lotusCup.rotation.x = Math.PI * 0.26;
  group.add(lotusCup);

  const addTier = (
    count: number,
    geo: THREE.BufferGeometry,
    radius: number,
    offsetAngle: number,
    closedTilt: number,
    openTilt: number,
    yOffset: number,
  ) => {
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + offsetAngle;
      const ringHolder = new THREE.Group();
      ringHolder.rotation.y = angle;
      ringHolder.position.y = yOffset;

      const pivot = new THREE.Group();
      pivot.position.set(0, 0, radius);
      pivot.rotation.x = closedTilt;

      const mesh = new THREE.Mesh(geo, petalMat);
      pivot.add(mesh);
      ringHolder.add(pivot);
      lotusCup.add(ringHolder);
      petals.push({ pivot, closedTilt, openTilt });
    }
  };

  addTier(8, outerPetalGeo, 0.24, 0, 0.26, 1.18, 0.0);
  addTier(8, midPetalGeo, 0.19, Math.PI / 8, 0.16, 0.82, 0.05);
  addTier(6, innerPetalGeo, 0.13, Math.PI / 6, 0.08, 0.44, 0.09);

  // Sacred golden karnika center
  const podGeo = new THREE.SphereGeometry(0.2, 20, 16);
  const podMesh = new THREE.Mesh(podGeo, coreMat);
  podMesh.scale.set(1, 0.72, 1);
  podMesh.position.y = 0.22;
  lotusCup.add(podMesh);
  disposables.push(podGeo);

  // Chased golden halo ring framing the emblem
  const haloGeo = new THREE.TorusGeometry(1.42, 0.024, 12, 64);
  const haloMesh = new THREE.Mesh(haloGeo, petalMat);
  haloMesh.position.set(0, 0, -0.25);
  group.add(haloMesh);
  disposables.push(haloGeo);

  return {
    group,
    update: (bloomProgress: number, timeSec: number, visibility: number) => {
      const clampedBloom = Math.max(0, Math.min(1, bloomProgress));
      const smoothBloom = clampedBloom * clampedBloom * (3 - 2 * clampedBloom);

      for (const p of petals) {
        p.pivot.rotation.x = THREE.MathUtils.lerp(p.closedTilt, p.openTilt, smoothBloom);
      }

      lotusCup.rotation.z = Math.sin(timeSec * 0.45) * 0.04;
      haloMesh.rotation.z = timeSec * 0.12;
      group.scale.setScalar(0.55 + 0.45 * Math.min(1, visibility * 1.1));
      group.visible = visibility > 0.01;
      petalMat.emissiveIntensity = 0.18 + 0.22 * smoothBloom;
    },
    dispose: () => {
      for (const item of disposables) item.dispose();
    },
  };
}
