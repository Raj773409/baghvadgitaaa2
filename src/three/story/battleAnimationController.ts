import * as THREE from 'three';
import { CharacterController } from './characterController';
import type { LoadedCharacterAsset } from './modelLoader';
import type { QualityProfileConfig, StoryFrameSnapshot } from './storyTimeline';

export interface BattleAnimationControllerHandle {
  group: THREE.Group;
  mountWarPackAssets: (assets: {
    karnaHero?: LoadedCharacterAsset | null;
    bhishmaDronaHero?: LoadedCharacterAsset | null;
    maceDuelists?: LoadedCharacterAsset | null;
    warElephant?: LoadedCharacterAsset | null;
  }) => void;
  getKarnaWorldPos: (out: THREE.Vector3) => boolean;
  getMaceDuelCenterPos: (out: THREE.Vector3) => boolean;
  update: (params: {
    deltaSec: number;
    timeSec: number;
    snapshot: StoryFrameSnapshot;
    visemeSnapshot: import('./visemeTimeline').VisemeWeightsSnapshot | null;
    reducedMotion: boolean;
  }) => void;
  dispose: () => void;
}

/**
 * Orchestrates all Mahabharata War Part B formations & encounters across Days 1–18:
 *  - GPU-Instanced opposing cavalry, archers, and battle chariots
 *  - Chakravyuha 7-ring rotating phalanx formation (Day 13)
 *  - Torch-lit Night Warfare lighting & brazier flames (Day 14 Ghatotkacha)
 *  - Bhishma Shara-Shayya (Day 10 Bed of Arrows)
 *  - Karna vs Arjuna Chariot Duel with Day 17 sunken wheel tilt
 *  - Bhima vs Duryodhana Gada (Mace) Duel on Day 18
 *  - Armored War Elephants on battlefield flanks
 */
export function createBattleAnimationController(
  quality: QualityProfileConfig,
): BattleAnimationControllerHandle {
  const group = new THREE.Group();
  group.name = 'MahabharataBattleSystem';

  const disposables: Array<{ dispose: () => void }> = [];
  const controllers: CharacterController[] = [];

  // 1. GPU-Instanced Grounded Composite Cavalry Cohorts (Steed Barrel, 4 Grounded Legs, Neck/Head, & Armored Rider)
  const cavTotal = quality.cavalryPerArmy * 2;
  const cavParts: THREE.BufferGeometry[] = [];
  const pushCavPart = (geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0) => {
    const g = geo.toNonIndexed();
    if (rx !== 0) g.rotateX(rx);
    g.translate(x, y, z);
    g.computeVertexNormals();
    cavParts.push(g);
    geo.dispose();
  };
  pushCavPart(new THREE.BoxGeometry(0.42, 0.52, 1.32), 0, 0.92, 0); // horse barrel
  pushCavPart(new THREE.BoxGeometry(0.24, 0.62, 0.3), 0, 1.34, 0.56, 0.42); // neck
  pushCavPart(new THREE.BoxGeometry(0.2, 0.22, 0.42), 0, 1.62, 0.78, 0.22); // horse head
  pushCavPart(new THREE.CylinderGeometry(0.06, 0.05, 0.72, 5), -0.15, 0.36, 0.46); // FL leg
  pushCavPart(new THREE.CylinderGeometry(0.06, 0.05, 0.72, 5), 0.15, 0.36, 0.46); // FR leg
  pushCavPart(new THREE.CylinderGeometry(0.06, 0.05, 0.72, 5), -0.15, 0.36, -0.46); // BL leg
  pushCavPart(new THREE.CylinderGeometry(0.06, 0.05, 0.72, 5), 0.15, 0.36, -0.46); // BR leg
  pushCavPart(new THREE.CylinderGeometry(0.16, 0.18, 0.66, 6), 0, 1.48, -0.04); // rider torso
  pushCavPart(new THREE.SphereGeometry(0.14, 6, 5), 0, 1.92, -0.02); // rider helm

  let totalCavVerts = 0;
  for (const gp of cavParts) totalCavVerts += gp.attributes.position.count;
  const cavPosArr = new Float32Array(totalCavVerts * 3);
  const cavNormArr = new Float32Array(totalCavVerts * 3);
  let cavCursor = 0;
  for (const gp of cavParts) {
    cavPosArr.set(gp.attributes.position.array as Float32Array, cavCursor * 3);
    cavNormArr.set(gp.attributes.normal.array as Float32Array, cavCursor * 3);
    cavCursor += gp.attributes.position.count;
    gp.dispose();
  }
  const cavBodyGeo = new THREE.BufferGeometry();
  cavBodyGeo.setAttribute('position', new THREE.BufferAttribute(cavPosArr, 3));
  cavBodyGeo.setAttribute('normal', new THREE.BufferAttribute(cavNormArr, 3));

  const cavMat = new THREE.MeshStandardMaterial({ roughness: 0.56, metalness: 0.25 });
  const cavalryInst = new THREE.InstancedMesh(cavBodyGeo, cavMat, cavTotal);
  const dummy = new THREE.Object3D();

  const cavalryMeta: Array<{ baseX: number; baseZ: number; dirZ: number; phase: number }> = [];
  const pCol = new THREE.Color(0x9a6d38);
  const kCol = new THREE.Color(0x632824);

  for (let i = 0; i < cavTotal; i++) {
    const isKaurava = i >= quality.cavalryPerArmy;
    const localIdx = isKaurava ? i - quality.cavalryPerArmy : i;
    const wingSide = localIdx % 2 === 0 ? -1 : 1;
    const rank = Math.floor(localIdx / 2);
    const x = wingSide * (14.5 + (rank % 4) * 3.8);
    const z = isKaurava ? 18 + Math.floor(rank / 4) * 4.5 : -20 - Math.floor(rank / 4) * 4.5;
    cavalryMeta.push({ baseX: x, baseZ: z, dirZ: isKaurava ? -1 : 1, phase: i * 0.7 });
    cavalryInst.setColorAt(i, isKaurava ? kCol : pCol);
  }
  if (cavalryInst.instanceColor) cavalryInst.instanceColor.needsUpdate = true;
  group.add(cavalryInst);
  disposables.push(cavBodyGeo, cavMat);

  // 2. Day 13 Rotating 7-Ring Chakravyuha Lotus Spiral Formation
  const chakravyuhaGroup = new THREE.Group();
  chakravyuhaGroup.position.set(0, 0.15, 16);
  chakravyuhaGroup.visible = false;
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xb8863d,
    metalness: 0.72,
    roughness: 0.34,
  });
  const chakraSoldierGeo = new THREE.CylinderGeometry(0.22, 0.25, 1.45, 7);
  chakraSoldierGeo.translate(0, 0.75, 0);
  const ringGroups: THREE.Group[] = [];
  for (let r = 0; r < 5; r++) {
    const rg = new THREE.Group();
    const radius = 3.2 + r * 2.1;
    const ringTrackGeo = new THREE.TorusGeometry(radius, 0.06, 6, 36);
    ringTrackGeo.rotateX(Math.PI / 2);
    rg.add(new THREE.Mesh(ringTrackGeo, ringMat));
    disposables.push(ringTrackGeo);

    const nodes = 10 + r * 4;
    for (let n = 0; n < nodes; n++) {
      // Leave narrow rotating spiral breach entry gap
      if (n === 0) continue;
      const a = (n / nodes) * Math.PI * 2;
      const guard = new THREE.Mesh(chakraSoldierGeo, ringMat);
      guard.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      rg.add(guard);
    }
    chakravyuhaGroup.add(rg);
    ringGroups.push(rg);
  }
  group.add(chakravyuhaGroup);
  disposables.push(ringMat, chakraSoldierGeo);

  // 3. Day 14 Night Torch Flaming Braziers + Flicker Lights
  const nightTorchesGroup = new THREE.Group();
  nightTorchesGroup.visible = false;
  const flameGeo = new THREE.ConeGeometry(0.32, 0.95, 7);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xff8c28,
    transparent: true,
    opacity: 0.88,
  });
  const torchPositions: Array<[number, number, number]> = [
    [-9.5, 2.2, 6],
    [9.5, 2.2, 6],
    [-12.5, 2.4, -6],
    [12.5, 2.4, -6],
    [-7.5, 2.3, 18],
    [7.5, 2.3, 18],
  ];
  const torchFlames: THREE.Mesh[] = [];
  const torchLights: THREE.PointLight[] = [];
  for (let i = 0; i < torchPositions.length; i++) {
    const [x, y, z] = torchPositions[i];
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, y, 6),
      ringMat,
    );
    post.position.set(x, y * 0.5, z);
    disposables.push(post.geometry);
    nightTorchesGroup.add(post);

    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y + 0.42, z);
    nightTorchesGroup.add(flame);
    torchFlames.push(flame);

    if (i < 2) {
      const pLight = new THREE.PointLight(0xff7d22, 5.5, 24, 1.5);
      pLight.position.set(x, y + 0.6, z);
      nightTorchesGroup.add(pLight);
      torchLights.push(pLight);
    }
  }
  group.add(nightTorchesGroup);
  disposables.push(flameGeo, flameMat);

  // 4. Karna Solar Duel Chariot Mount + Day 17 Sunken Wheel Tilt Pivot
  const karnaChariotGroup = new THREE.Group();
  karnaChariotGroup.name = 'KarnaSolarChariot';
  karnaChariotGroup.position.set(0.4, 0, 14);
  karnaChariotGroup.visible = false;
  const karnaDeckMat = new THREE.MeshStandardMaterial({
    color: 0xc28e36,
    metalness: 0.82,
    roughness: 0.28,
  });
  const karnaDeckGeo = new THREE.BoxGeometry(1.9, 0.25, 2.3);
  const karnaDeck = new THREE.Mesh(karnaDeckGeo, karnaDeckMat);
  karnaDeck.position.y = 0.88;
  karnaChariotGroup.add(karnaDeck);
  const kWheelGeo = new THREE.TorusGeometry(0.75, 0.07, 8, 24);
  kWheelGeo.rotateY(Math.PI / 2);
  const kWheelL = new THREE.Mesh(kWheelGeo, karnaDeckMat);
  kWheelL.position.set(1.12, 0.75, 0);
  const kWheelR = new THREE.Mesh(kWheelGeo, karnaDeckMat);
  kWheelR.position.set(-1.12, 0.75, 0);
  karnaChariotGroup.add(kWheelL, kWheelR);
  group.add(karnaChariotGroup);
  disposables.push(karnaDeckMat, karnaDeckGeo, kWheelGeo);

  // 5. Bhishma Day 10 Arrow-Bed Cushion Props
  const arrowBedGroup = new THREE.Group();
  arrowBedGroup.position.set(-5.5, 0, 11);
  arrowBedGroup.visible = false;
  const bedShaftGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.35, 5);
  const bedShafts = new THREE.InstancedMesh(bedShaftGeo, karnaDeckMat, 28);
  for (let i = 0; i < 28; i++) {
    const col = i % 7;
    const row = Math.floor(i / 7);
    dummy.position.set((col - 3) * 0.26, 0.55, (row - 1.5) * 0.35);
    dummy.rotation.set(0.35 * (i % 2 === 0 ? 1 : -1), 0, (col - 3) * 0.08);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    bedShafts.setMatrixAt(i, dummy.matrix);
  }
  arrowBedGroup.add(bedShafts);
  group.add(arrowBedGroup);
  disposables.push(bedShaftGeo);

  // Hero Controllers (populated lazily when War Pack GLBs finish loading)
  let karnaCtrl: CharacterController | null = null;
  let bhishmaCtrl: CharacterController | null = null;
  let bhimaCtrl: CharacterController | null = null;
  let duryodhanaCtrl: CharacterController | null = null;
  const elephantCtrls: CharacterController[] = [];

  const mountWarPackAssets: BattleAnimationControllerHandle['mountWarPackAssets'] = (
    assets,
  ) => {
    if (assets.karnaHero && !karnaCtrl) {
      karnaCtrl = new CharacterController({
        asset: assets.karnaHero,
        instanceLabel: 'Karna_Angaraja',
        speakerRole: 'karna',
      });
      karnaCtrl.root.position.set(0, 1.0, 0);
      karnaCtrl.root.rotation.y = Math.PI;
      karnaChariotGroup.add(karnaCtrl.root);
      controllers.push(karnaCtrl);
    }

    if (assets.bhishmaDronaHero && !bhishmaCtrl) {
      bhishmaCtrl = new CharacterController({
        asset: assets.bhishmaDronaHero,
        instanceLabel: 'PitamahaBhishma',
        speakerRole: 'bhishma',
      });
      bhishmaCtrl.root.position.set(-5.5, 0, 11);
      bhishmaCtrl.root.rotation.y = Math.PI;
      bhishmaCtrl.root.visible = false;
      group.add(bhishmaCtrl.root);
      controllers.push(bhishmaCtrl);
    }

    if (assets.maceDuelists && !bhimaCtrl && !duryodhanaCtrl) {
      bhimaCtrl = new CharacterController({
        asset: assets.maceDuelists,
        instanceLabel: 'Bhima_Pandava',
        speakerRole: 'narrator',
      });
      bhimaCtrl.setFactionTint(0x9e3422);
      bhimaCtrl.root.position.set(-2.2, 0, 12);
      bhimaCtrl.root.rotation.y = Math.PI * 0.5;
      bhimaCtrl.root.visible = false;
      group.add(bhimaCtrl.root);
      controllers.push(bhimaCtrl);

      duryodhanaCtrl = new CharacterController({
        asset: assets.maceDuelists,
        instanceLabel: 'Duryodhana_Kaurava',
        speakerRole: 'duryodhana',
        phaseOffsetSec: 0.45,
      });
      duryodhanaCtrl.setFactionTint(0x4c2836);
      duryodhanaCtrl.root.position.set(2.2, 0, 12);
      duryodhanaCtrl.root.rotation.y = -Math.PI * 0.5;
      duryodhanaCtrl.root.visible = false;
      group.add(duryodhanaCtrl.root);
      controllers.push(duryodhanaCtrl);
    }

    if (assets.warElephant && elephantCtrls.length === 0) {
      const count = Math.min(6, quality.elephantsPerArmy * 2);
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const isKaurava = i >= Math.floor(count / 2);
        const ele = new CharacterController({
          asset: assets.warElephant,
          instanceLabel: `WarElephant_${i + 1}`,
          phaseOffsetSec: i * 0.5,
        });
        ele.root.position.set(
          side * (17 + Math.floor(i / 2) * 5.5),
          0,
          isKaurava ? 26 : -28,
        );
        ele.root.rotation.y = isKaurava ? Math.PI : 0;
        ele.transitionTo('idle_sway', 0);
        group.add(ele.root);
        elephantCtrls.push(ele);
        controllers.push(ele);
      }
    }
  };

  const getKarnaWorldPos = (out: THREE.Vector3) => {
    if (!karnaChariotGroup.visible) return false;
    karnaChariotGroup.getWorldPosition(out);
    return true;
  };

  const getMaceDuelCenterPos = (out: THREE.Vector3) => {
    out.set(0, 1.4, 12);
    return true;
  };

  const update: BattleAnimationControllerHandle['update'] = ({
    deltaSec,
    timeSec,
    snapshot,
    visemeSnapshot,
    reducedMotion,
  }) => {
    const inWarPart = snapshot.partId === 'part-b';
    const warAdvance = inWarPart ? 1 : 0;

    // 1. Cavalry Wing March/Charge Offset
    for (let i = 0; i < cavalryMeta.length; i++) {
      const m = cavalryMeta[i];
      const chargeOffset =
        inWarPart && !reducedMotion
          ? Math.sin(timeSec * 1.4 + m.phase) * 3.5 * m.dirZ
          : 0;
      const bounce =
        inWarPart && !reducedMotion
          ? Math.abs(Math.sin(timeSec * 4.5 + m.phase)) * 0.14
          : 0;
      dummy.position.set(m.baseX, bounce, m.baseZ + chargeOffset);
      dummy.rotation.set(0, m.dirZ < 0 ? Math.PI : 0, 0);
      dummy.scale.setScalar(inWarPart ? 1.0 : 0.92);
      dummy.updateMatrix();
      cavalryInst.setMatrixAt(i, dummy.matrix);
    }
    cavalryInst.instanceMatrix.needsUpdate = true;

    // 2. Day 13 Rotating Chakravyuha Phalanx Rings
    if (snapshot.chakravyuhaRotationStrength > 0.04) {
      chakravyuhaGroup.visible = true;
      const rotRate = reducedMotion ? 0.08 : 0.45 * snapshot.chakravyuhaRotationStrength;
      ringGroups.forEach((rg, idx) => {
        const dir = idx % 2 === 0 ? 1 : -1;
        rg.rotation.y = timeSec * rotRate * (1 + idx * 0.12) * dir;
      });
    } else {
      chakravyuhaGroup.visible = false;
    }

    // 3. Day 14 Night Torches
    const nightOn = snapshot.atmospherePreset === 'night-torches';
    nightTorchesGroup.visible = nightOn;
    if (nightOn && !reducedMotion) {
      torchFlames.forEach((f, idx) => {
        f.scale.set(
          1 + Math.sin(timeSec * 9 + idx) * 0.14,
          1 + Math.cos(timeSec * 11 + idx) * 0.22,
          1,
        );
      });
      torchLights.forEach((l, idx) => {
        l.intensity = 5.2 + Math.sin(timeSec * 10 + idx) * 1.4;
      });
    }

    // 4. Bhishma Commander & Day 10 Bed of Arrows
    const showBhishma =
      snapshot.battleMode === 'bhishma-chariot-wheel' ||
      snapshot.battleMode === 'bhishma-bed-of-arrows';
    arrowBedGroup.visible = snapshot.battleMode === 'bhishma-bed-of-arrows';
    if (bhishmaCtrl) {
      bhishmaCtrl.root.visible = showBhishma;
      if (showBhishma) {
        if (snapshot.battleMode === 'bhishma-bed-of-arrows') {
          bhishmaCtrl.transitionTo('arrow_bed_repose', 0.45);
          bhishmaCtrl.root.position.set(-5.5, 0.55, 11);
          bhishmaCtrl.root.rotation.set(-Math.PI * 0.44, Math.PI, 0);
        } else {
          bhishmaCtrl.transitionTo('draw_bow', 0.45);
          bhishmaCtrl.root.position.set(-5.5, 0, 12);
          bhishmaCtrl.root.rotation.set(0, Math.PI, 0);
        }
        bhishmaCtrl.update(deltaSec, timeSec, {
          isActiveSpeaker: snapshot.activeSpeaker === 'bhishma',
          visemeSnapshot,
          emotion: 'serene',
          emotionIntensity: 0.72,
          reducedMotion,
        });
      }
    }

    // 5. Karna vs Arjuna Chariot Duel (Days 15–17 + Sunken Wheel Tilt on Day 17)
    const showKarna = snapshot.karnaDuelIntensity > 0.04;
    karnaChariotGroup.visible = showKarna;
    if (showKarna) {
      const wheelSinkPhase = snapshot.activeWarDay === 17 ? 0.18 : 0;
      karnaChariotGroup.rotation.z = wheelSinkPhase;
      karnaChariotGroup.position.y = -wheelSinkPhase * 1.4;
      if (karnaCtrl) {
        const clip =
          snapshot.activeWarDay === 17 && snapshot.sceneLocalProgress > 0.65
            ? 'wheel_strain'
            : 'draw_vijaya';
        karnaCtrl.transitionTo(clip, 0.4);
        karnaCtrl.update(deltaSec, timeSec, {
          isActiveSpeaker: snapshot.activeSpeaker === 'karna',
          visemeSnapshot,
          emotion: 'battle_focus',
          emotionIntensity: 0.85,
          reducedMotion,
        });
      }
    }

    // 6. Bhima vs Duryodhana Day 18 Mace Duel
    const showMaceDuel = snapshot.battleMode === 'bhima-duryodhana-mace';
    if (bhimaCtrl && duryodhanaCtrl) {
      bhimaCtrl.root.visible = showMaceDuel;
      duryodhanaCtrl.root.visible = showMaceDuel;
      if (showMaceDuel) {
        const phase = snapshot.maceDuelPhase;
        const orbitAngle = reducedMotion ? 0 : timeSec * 0.55;
        const radius = 2.0 - Math.sin(phase * Math.PI) * 0.45;
        bhimaCtrl.root.position.set(
          -Math.cos(orbitAngle) * radius,
          0,
          12 - Math.sin(orbitAngle) * radius,
        );
        bhimaCtrl.root.lookAt(0, 0, 12);

        duryodhanaCtrl.root.position.set(
          Math.cos(orbitAngle) * radius,
          0,
          12 + Math.sin(orbitAngle) * radius,
        );
        duryodhanaCtrl.root.lookAt(0, 0, 12);

        const clipB = phase > 0.68 ? 'gada_swing_overhead' : phase > 0.3 ? 'gada_clash' : 'gada_guard';
        const clipD = phase > 0.8 ? 'kneel_strike' : phase > 0.3 ? 'gada_clash' : 'gada_guard';
        bhimaCtrl.transitionTo(clipB, 0.35);
        duryodhanaCtrl.transitionTo(clipD, 0.35);
        bhimaCtrl.update(deltaSec, timeSec, {
          isActiveSpeaker: false,
          visemeSnapshot: null,
          emotion: 'battle_focus',
          emotionIntensity: 0.85,
          reducedMotion,
        });
        duryodhanaCtrl.update(deltaSec, timeSec, {
          isActiveSpeaker: snapshot.activeSpeaker === 'duryodhana',
          visemeSnapshot,
          emotion: 'battle_focus',
          emotionIntensity: 0.9,
          reducedMotion,
        });
      }
    }

    // 7. War Elephants Wing Choreography
    const eleClip =
      warAdvance > 0.5
        ? snapshot.arrowVolleyIntensity > 0.8
          ? 'trumpet_rear'
          : 'march_charge'
        : 'idle_sway';
    for (const ele of elephantCtrls) {
      ele.transitionTo(eleClip, 0.55);
      ele.update(deltaSec, timeSec, { reducedMotion });
    }
  };

  const dispose = () => {
    for (const c of controllers) c.dispose();
    controllers.length = 0;
    for (const d of disposables) d.dispose();
  };

  return {
    group,
    mountWarPackAssets,
    getKarnaWorldPos,
    getMaceDuelCenterPos,
    update,
    dispose,
  };
}
