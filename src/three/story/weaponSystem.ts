import * as THREE from 'three';

export interface HeroArrowTrackingPose {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

export interface WeaponSystemHandle {
  group: THREE.Group;
  brokenWheelGroup: THREE.Group;
  getHeroArrowTrackingPose: () => HeroArrowTrackingPose;
  update: (params: {
    deltaSec: number;
    timeSec: number;
    chariotPositionZ: number;
    arjunaBowDrawAmount: number;
    arrowVolleyIntensity: number;
    brokenWheelRaisedAmount: number;
    arjunaBowMountPosWorld?: THREE.Vector3 | null;
    arjunaRightHandPosWorld?: THREE.Vector3 | null;
    krishnaRightHandPosWorld?: THREE.Vector3 | null;
    reducedMotion: boolean;
  }) => void;
  dispose: () => void;
}

interface PooledArrowSlot {
  active: boolean;
  ageSec: number;
  durationSec: number;
  startPos: THREE.Vector3;
  velocity: THREE.Vector3;
  isHeroArrow: boolean;
}

/**
 * Manages:
 *  1) Gandiva dynamic bowstring vertices & nocked arrow flexing between Arjuna's Bow & RightHand
 *  2) GPU-Instanced projectile arrow pool (up to maxArrows simultaneous flights + impact bursts)
 *  3) Sculpted Broken Timber/Iron Chariot Wheel Prop lifted by Krishna ONLY in Scene 09 (Day 9)
 */
export function createWeaponSystem(maxArrows = 40): WeaponSystemHandle {
  const group = new THREE.Group();
  group.name = 'MahabharataWeaponSystem';

  const disposables: Array<{ dispose: () => void }> = [];

  // 1. Dynamic Gandiva Bowstring & Nocked Arrow (World Space Bridge between Bow Tips & Hand)
  const stringPoints = new Float32Array(9); // top tip, nock mid, bottom tip
  const stringGeo = new THREE.BufferGeometry();
  stringGeo.setAttribute('position', new THREE.BufferAttribute(stringPoints, 3));
  const stringMat = new THREE.LineBasicMaterial({
    color: 0xf7e3a8,
    transparent: true,
    opacity: 0.92,
  });
  const bowStringLine = new THREE.Line(stringGeo, stringMat);
  bowStringLine.frustumCulled = false;
  group.add(bowStringLine);
  disposables.push(stringGeo, stringMat);

  const nockedArrowGroup = new THREE.Group();
  const shaftGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.96, 6);
  shaftGeo.rotateX(Math.PI / 2);
  const arrowHeadGeo = new THREE.ConeGeometry(0.028, 0.11, 6);
  arrowHeadGeo.rotateX(Math.PI / 2);
  arrowHeadGeo.translate(0, 0, 0.52);
  const fletchGeo = new THREE.BoxGeometry(0.055, 0.008, 0.14);
  fletchGeo.translate(0, 0, -0.42);

  const goldArrowMat = new THREE.MeshStandardMaterial({
    color: 0xf5cf74,
    metalness: 0.85,
    roughness: 0.24,
    emissive: new THREE.Color(0x3a2504),
    emissiveIntensity: 0.2,
  });
  const featherMat = new THREE.MeshStandardMaterial({
    color: 0xd94426,
    roughness: 0.6,
  });

  nockedArrowGroup.add(new THREE.Mesh(shaftGeo, goldArrowMat));
  nockedArrowGroup.add(new THREE.Mesh(arrowHeadGeo, goldArrowMat));
  nockedArrowGroup.add(new THREE.Mesh(fletchGeo, featherMat));
  group.add(nockedArrowGroup);
  disposables.push(shaftGeo, arrowHeadGeo, fletchGeo, goldArrowMat, featherMat);

  // 2. GPU-Instanced In-Flight Arrow Volley Pool (merged low-poly silhouette)
  const flightShaft = new THREE.CylinderGeometry(0.015, 0.015, 1.12, 5);
  flightShaft.rotateX(Math.PI / 2);
  const flightTip = new THREE.ConeGeometry(0.036, 0.13, 5);
  flightTip.rotateX(Math.PI / 2);
  flightTip.translate(0, 0, 0.62);

  const nonIdxA = flightShaft.toNonIndexed();
  const nonIdxB = flightTip.toNonIndexed();
  const countA = nonIdxA.attributes.position.count;
  const countB = nonIdxB.attributes.position.count;
  const mergedPos = new Float32Array((countA + countB) * 3);
  const mergedNorm = new Float32Array((countA + countB) * 3);
  nonIdxA.computeVertexNormals();
  nonIdxB.computeVertexNormals();
  mergedPos.set(nonIdxA.attributes.position.array as Float32Array, 0);
  mergedPos.set(nonIdxB.attributes.position.array as Float32Array, countA * 3);
  mergedNorm.set(nonIdxA.attributes.normal.array as Float32Array, 0);
  mergedNorm.set(nonIdxB.attributes.normal.array as Float32Array, countA * 3);

  flightShaft.dispose();
  flightTip.dispose();
  nonIdxA.dispose();
  nonIdxB.dispose();

  const pooledArrowGeo = new THREE.BufferGeometry();
  pooledArrowGeo.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  pooledArrowGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  const pooledArrowsInst = new THREE.InstancedMesh(pooledArrowGeo, goldArrowMat, maxArrows);
  pooledArrowsInst.frustumCulled = false;
  pooledArrowsInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(pooledArrowsInst);
  disposables.push(pooledArrowGeo);

  // Pooled Ground/Shield Impact Dust Puffs
  const puffGeo = new THREE.SphereGeometry(0.24, 6, 5);
  const puffMat = new THREE.MeshBasicMaterial({
    color: 0xd6b078,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const puffPoolSize = 12;
  const puffInst = new THREE.InstancedMesh(puffGeo, puffMat, puffPoolSize);
  puffInst.frustumCulled = false;
  group.add(puffInst);
  disposables.push(puffGeo, puffMat);

  // 3. Sculpted Broken Wooden & Iron Chariot Wheel Prop (STRICTLY Scene 09 Day 9 Bhishma encounter)
  const brokenWheelGroup = new THREE.Group();
  brokenWheelGroup.name = 'BrokenChariotWheelProp';
  brokenWheelGroup.visible = false;

  const weatheredWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5c361e,
    roughness: 0.78,
    metalness: 0.08,
  });
  const rustedIronMat = new THREE.MeshStandardMaterial({
    color: 0x565963,
    roughness: 0.48,
    metalness: 0.74,
  });
  disposables.push(weatheredWoodMat, rustedIronMat);

  // Arced outer felloe with realistic broken gap + protruding splintered wood spokes
  const felloeGeo = new THREE.TorusGeometry(0.56, 0.048, 8, 22, Math.PI * 1.65);
  const ironRimGeo = new THREE.TorusGeometry(0.605, 0.02, 6, 22, Math.PI * 1.65);
  const wheelHubGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.24, 12);
  wheelHubGeo.rotateX(Math.PI / 2);
  const brokenSpokeGeo = new THREE.CylinderGeometry(0.018, 0.025, 0.54, 6);

  brokenWheelGroup.add(new THREE.Mesh(felloeGeo, weatheredWoodMat));
  brokenWheelGroup.add(new THREE.Mesh(ironRimGeo, rustedIronMat));
  brokenWheelGroup.add(new THREE.Mesh(wheelHubGeo, rustedIronMat));
  for (let s = 0; s < 9; s++) {
    const angle = (s / 10) * Math.PI * 1.85;
    const spoke = new THREE.Mesh(brokenSpokeGeo, weatheredWoodMat);
    spoke.position.set(Math.cos(angle) * 0.27, Math.sin(angle) * 0.27, 0);
    spoke.rotation.z = angle - Math.PI / 2;
    brokenWheelGroup.add(spoke);
  }
  group.add(brokenWheelGroup);
  disposables.push(felloeGeo, ironRimGeo, wheelHubGeo, brokenSpokeGeo);

  // Pool state
  const slots: PooledArrowSlot[] = Array.from({ length: maxArrows }, () => ({
    active: false,
    ageSec: 0,
    durationSec: 1.6,
    startPos: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    isHeroArrow: false,
  }));

  const impacts: Array<{ active: boolean; pos: THREE.Vector3; ageSec: number }> = Array.from(
    { length: puffPoolSize },
    () => ({ active: false, pos: new THREE.Vector3(), ageSec: 0 }),
  );

  let nextSpawnTimer = 0;
  let nextHeroTimer = 0;
  let impactCursor = 0;
  const dummy = new THREE.Object3D();
  const arrowLookTarget = new THREE.Vector3();
  const currPos = new THREE.Vector3();
  const currVel = new THREE.Vector3();
  const heroTrackState: HeroArrowTrackingPose = {
    active: false,
    position: new THREE.Vector3(0.3, 2.3, 3),
    velocity: new THREE.Vector3(0, 2, 18),
  };

  const spawnArrow = (
    origin: THREE.Vector3,
    velocity: THREE.Vector3,
    isHeroArrow: boolean,
  ) => {
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i].active) {
        slots[i].active = true;
        slots[i].ageSec = 0;
        slots[i].durationSec = isHeroArrow ? 1.75 : 1.35 + (i % 5) * 0.14;
        slots[i].startPos.copy(origin);
        slots[i].velocity.copy(velocity);
        slots[i].isHeroArrow = isHeroArrow;
        return;
      }
    }
  };

  const update = (params: {
    deltaSec: number;
    timeSec: number;
    chariotPositionZ: number;
    arjunaBowDrawAmount: number;
    arrowVolleyIntensity: number;
    brokenWheelRaisedAmount: number;
    arjunaBowMountPosWorld?: THREE.Vector3 | null;
    arjunaRightHandPosWorld?: THREE.Vector3 | null;
    krishnaRightHandPosWorld?: THREE.Vector3 | null;
    reducedMotion: boolean;
  }) => {
    const {
      deltaSec,
      timeSec,
      chariotPositionZ,
      arjunaBowDrawAmount,
      arrowVolleyIntensity,
      brokenWheelRaisedAmount,
      arjunaBowMountPosWorld,
      arjunaRightHandPosWorld,
      krishnaRightHandPosWorld,
      reducedMotion,
    } = params;

    const dt = Math.min(0.08, Math.max(0.001, deltaSec));

    // 1. Update Gandiva Bowstring + Nocked Arrow
    if (arjunaBowMountPosWorld) {
      bowStringLine.visible = true;
      const topTipX = arjunaBowMountPosWorld.x + 0.04;
      const topTipY = arjunaBowMountPosWorld.y + 0.72;
      const topTipZ = arjunaBowMountPosWorld.z + 0.08;

      const botTipX = arjunaBowMountPosWorld.x + 0.04;
      const botTipY = arjunaBowMountPosWorld.y - 0.66;
      const botTipZ = arjunaBowMountPosWorld.z + 0.08;

      // Default relaxed cord vs pulled back toward Arjuna's RightHand
      const neutralMidX = arjunaBowMountPosWorld.x + 0.02;
      const neutralMidY = arjunaBowMountPosWorld.y + 0.04;
      const neutralMidZ = arjunaBowMountPosWorld.z + 0.02;

      const pullTargetX = arjunaRightHandPosWorld
        ? arjunaRightHandPosWorld.x
        : neutralMidX - 0.08;
      const pullTargetY = arjunaRightHandPosWorld
        ? arjunaRightHandPosWorld.y
        : neutralMidY;
      const pullTargetZ = arjunaRightHandPosWorld
        ? arjunaRightHandPosWorld.z - 0.14
        : neutralMidZ - 0.45;

      const midX = THREE.MathUtils.lerp(neutralMidX, pullTargetX, arjunaBowDrawAmount);
      const midY = THREE.MathUtils.lerp(neutralMidY, pullTargetY, arjunaBowDrawAmount);
      const midZ = THREE.MathUtils.lerp(neutralMidZ, pullTargetZ, arjunaBowDrawAmount);

      stringPoints[0] = topTipX;
      stringPoints[1] = topTipY;
      stringPoints[2] = topTipZ;
      stringPoints[3] = midX;
      stringPoints[4] = midY;
      stringPoints[5] = midZ;
      stringPoints[6] = botTipX;
      stringPoints[7] = botTipY;
      stringPoints[8] = botTipZ;
      (stringGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      if (arjunaBowDrawAmount > 0.15) {
        nockedArrowGroup.visible = true;
        nockedArrowGroup.position.set(midX, midY, midZ);
        nockedArrowGroup.lookAt(
          arjunaBowMountPosWorld.x + 0.04,
          arjunaBowMountPosWorld.y + 0.14,
          arjunaBowMountPosWorld.z + 1.2,
        );
      } else {
        nockedArrowGroup.visible = false;
      }
    } else {
      bowStringLine.visible = false;
      nockedArrowGroup.visible = false;
    }

    // 2. Spawn Volleys when battle arrows are active
    if (arrowVolleyIntensity > 0.08) {
      nextHeroTimer -= dt;
      if (nextHeroTimer <= 0) {
        const origin = arjunaBowMountPosWorld
          ? arjunaBowMountPosWorld.clone()
          : new THREE.Vector3(0.35, 2.25, chariotPositionZ + 0.5);
        spawnArrow(origin, new THREE.Vector3(0.15, 4.4, 24), true);
        nextHeroTimer = 1.75;
      }

      nextSpawnTimer -= dt * arrowVolleyIntensity;
      if (nextSpawnTimer <= 0) {
        const idxSeed = Math.floor(timeSec * 37) % 10;
        const fromPandava = idxSeed % 2 === 0;
        const xSpread = ((idxSeed - 4.5) * 3.8);
        const start = new THREE.Vector3(
          xSpread,
          1.7 + (idxSeed % 3) * 0.4,
          fromPandava ? chariotPositionZ - 14 : chariotPositionZ + 22,
        );
        const vel = new THREE.Vector3(
          Math.sin(idxSeed) * 1.6,
          4.8 + (idxSeed % 3) * 1.1,
          fromPandava ? 22 : -22,
        );
        spawnArrow(start, vel, false);
        nextSpawnTimer = reducedMotion ? 0.45 : 0.11;
      }
    }

    // 3. Advance Pooled Projectiles (Parabolic Arc y = y0 + vy*t - 0.5*g*t^2)
    heroTrackState.active = false;
    const G = 5.4;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot.active) {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        pooledArrowsInst.setMatrixAt(i, dummy.matrix);
        continue;
      }

      slot.ageSec += dt * (reducedMotion ? 0.35 : 1);
      if (slot.ageSec >= slot.durationSec || currPos.y < -0.2) {
        // Trigger tiny dust impact burst at landing site
        const impact = impacts[impactCursor % puffPoolSize];
        impactCursor += 1;
        impact.active = true;
        impact.ageSec = 0;
        impact.pos.set(
          slot.startPos.x + slot.velocity.x * slot.ageSec,
          0.25,
          slot.startPos.z + slot.velocity.z * slot.ageSec,
        );
        slot.active = false;
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        pooledArrowsInst.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const t = slot.ageSec;
      currPos.set(
        slot.startPos.x + slot.velocity.x * t,
        slot.startPos.y + slot.velocity.y * t - 0.5 * G * t * t,
        slot.startPos.z + slot.velocity.z * t,
      );
      currVel.set(slot.velocity.x, slot.velocity.y - G * t, slot.velocity.z);
      arrowLookTarget.copy(currPos).add(currVel);

      dummy.position.copy(currPos);
      dummy.lookAt(arrowLookTarget);
      dummy.scale.setScalar(slot.isHeroArrow ? 1.25 : 1.0);
      dummy.updateMatrix();
      pooledArrowsInst.setMatrixAt(i, dummy.matrix);

      if (slot.isHeroArrow && !heroTrackState.active) {
        heroTrackState.active = true;
        heroTrackState.position.copy(currPos);
        heroTrackState.velocity.copy(currVel);
      }
    }
    pooledArrowsInst.instanceMatrix.needsUpdate = true;

    // 4. Advance Ground Impact Puffs
    for (let i = 0; i < puffPoolSize; i++) {
      const imp = impacts[i];
      if (!imp.active) {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        puffInst.setMatrixAt(i, dummy.matrix);
        continue;
      }
      imp.ageSec += dt;
      if (imp.ageSec > 0.65) {
        imp.active = false;
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.001);
      } else {
        const k = imp.ageSec / 0.65;
        dummy.position.set(imp.pos.x, imp.pos.y + k * 0.5, imp.pos.z);
        dummy.scale.setScalar(0.4 + k * 1.45);
      }
      dummy.updateMatrix();
      puffInst.setMatrixAt(i, dummy.matrix);
    }
    puffInst.instanceMatrix.needsUpdate = true;

    // 5. Scene 09 Day 9 Broken Wooden Chariot Wheel Prop lifted beside Krishna without occluding face
    if (brokenWheelRaisedAmount > 0.04) {
      brokenWheelGroup.visible = true;
      const anchor = krishnaRightHandPosWorld
        ? krishnaRightHandPosWorld
        : new THREE.Vector3(-0.6, 2.35, chariotPositionZ + 1.15);
      brokenWheelGroup.position.set(
        anchor.x - 0.68,
        anchor.y + 0.22 * brokenWheelRaisedAmount,
        anchor.z + 0.42,
      );
      brokenWheelGroup.rotation.set(
        0.14,
        Math.PI * 0.14 + (reducedMotion ? 0 : Math.sin(timeSec * 1.8) * 0.1),
        0.24,
      );
      brokenWheelGroup.scale.setScalar(0.62 + brokenWheelRaisedAmount * 0.28);
    } else {
      brokenWheelGroup.visible = false;
    }
  };

  const dispose = () => {
    for (const d of disposables) d.dispose();
  };

  return {
    group,
    brokenWheelGroup,
    getHeroArrowTrackingPose: () => heroTrackState,
    update,
    dispose,
  };
}
