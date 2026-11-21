import * as THREE from 'three';

export const CHARIOT_WHEEL_RADIUS = 0.78;
export const HORSE_LATERAL_OFFSETS = [-1.26, -0.44, 0.44, 1.26] as const;

export interface ChariotRigHandle {
  group: THREE.Group;
  leftWheel: THREE.Group;
  rightWheel: THREE.Group;
  flagMesh: THREE.Mesh;
  krishnaMount: THREE.Group;
  arjunaMount: THREE.Group;
  horseSlots: THREE.Group[];
  bridleAnchors: THREE.Object3D[];
  reinsLeft: THREE.Line;
  reinsRight: THREE.Line;
  update: (params: {
    chariotPositionZ: number;
    timeSec: number;
    reducedMotion: boolean;
    krishnaLeftHandWorld?: THREE.Vector3 | null;
    krishnaRightHandWorld?: THREE.Vector3 | null;
  }) => void;
  dispose: () => void;
}

function buildSpokedWheel(
  goldMat: THREE.Material,
  woodMat: THREE.Material,
  ironMat: THREE.Material,
): THREE.Group {
  const wheel = new THREE.Group();
  const R = CHARIOT_WHEEL_RADIUS;

  // Outer carved golden rim + iron tire band
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.055, 12, 32), goldMat);
  rim.rotation.y = Math.PI / 2;
  rim.castShadow = true;
  wheel.add(rim);

  const tire = new THREE.Mesh(new THREE.TorusGeometry(R + 0.048, 0.02, 8, 32), ironMat);
  tire.rotation.y = Math.PI / 2;
  wheel.add(tire);

  // Inner concentric ornamental lotus ring
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(R * 0.45, 0.025, 8, 24), goldMat);
  innerRing.rotation.y = Math.PI / 2;
  wheel.add(innerRing);

  // Heavy bronze axle hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.34, 16), goldMat);
  hub.rotation.z = Math.PI / 2;
  hub.castShadow = true;
  wheel.add(hub);

  // 12 radial spokes
  const spokeGeo = new THREE.CylinderGeometry(0.024, 0.032, R * 1.85, 8);
  for (let i = 0; i < 12; i++) {
    const spoke = new THREE.Mesh(spokeGeo, i % 2 === 0 ? woodMat : goldMat);
    spoke.rotation.x = (i * Math.PI) / 6;
    spoke.castShadow = true;
    wheel.add(spoke);
  }

  return wheel;
}

export function createAncientChariotRig(): ChariotRigHandle {
  const group = new THREE.Group();
  group.name = 'ParthasarathiChariot';

  const disposables: Array<{ dispose: () => void }> = [];

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5d351c,
    roughness: 0.56,
    metalness: 0.14,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd9a846,
    roughness: 0.24,
    metalness: 0.88,
  });
  const darkBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x705327,
    roughness: 0.38,
    metalness: 0.78,
  });
  const crimsonSilkMat = new THREE.MeshStandardMaterial({
    color: 0x8f1d1d,
    roughness: 0.52,
    metalness: 0.12,
    side: THREE.DoubleSide,
  });
  const saffronFlagMat = new THREE.MeshStandardMaterial({
    color: 0xd9611e,
    roughness: 0.55,
    metalness: 0.08,
    emissive: new THREE.Color(0x521d04),
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
  });
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x7a1717,
    roughness: 0.65,
    metalness: 0.05,
  });
  const reinMat = new THREE.LineBasicMaterial({
    color: 0xc99c4a,
    transparent: true,
    opacity: 0.92,
  });

  disposables.push(
    woodMat,
    goldMat,
    darkBronzeMat,
    crimsonSilkMat,
    saffronFlagMat,
    cushionMat,
    reinMat,
  );

  const deckY = 0.86;

  // 1. Main Chariot Chassis & Carved Golden Deck
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.18, 2.65), woodMat);
  chassis.position.set(0, deckY, -0.05);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // Beveled golden lower trim around deck
  const trim = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.09, 2.74), goldMat);
  trim.position.set(0, deckY - 0.04, -0.05);
  group.add(trim);

  // Scalloped front prow shield
  const prow = new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 1.02, 0.88, 24, 1, true, -Math.PI * 0.42, Math.PI * 0.84),
    goldMat,
  );
  prow.position.set(0, deckY + 0.48, 0.62);
  prow.castShadow = true;
  group.add(prow);

  // Ornamental rear & side balustrades
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 1.9), woodMat);
    rail.position.set(side * 0.98, deckY + 0.36, -0.35);
    rail.castShadow = true;
    group.add(rail);

    const goldTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 1.98), goldMat);
    goldTop.position.set(side * 0.98, deckY + 0.68, -0.35);
    group.add(goldTop);
  }

  // Ornate Rear Lion Sculptural Crest Finial
  const rearArch = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 0.14), goldMat);
  rearArch.position.set(0, deckY + 0.25, -1.32);
  group.add(rearArch);

  const lionPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.38, 12), goldMat);
  lionPedestal.position.set(0, deckY + 0.6, -1.35);
  group.add(lionPedestal);

  // Axle Shaft
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 2.68, 12), darkBronzeMat);
  axle.rotation.z = Math.PI / 2;
  axle.position.set(0, CHARIOT_WHEEL_RADIUS, -0.15);
  group.add(axle);

  // 2. Left & Right 12-Spoked Wheels
  const leftWheel = buildSpokedWheel(goldMat, woodMat, darkBronzeMat);
  leftWheel.position.set(1.26, CHARIOT_WHEEL_RADIUS, -0.15);
  group.add(leftWheel);

  const rightWheel = buildSpokedWheel(goldMat, woodMat, darkBronzeMat);
  rightWheel.position.set(-1.26, CHARIOT_WHEEL_RADIUS, -0.15);
  group.add(rightWheel);

  // 3. Elevated Seats/Cushions for Krishna (front right/center-right) & Arjuna (rear-left)
  const krishnaCushion = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.28, 16), cushionMat);
  krishnaCushion.position.set(-0.34, deckY + 0.22, 0.58);
  group.add(krishnaCushion);

  const arjunaPlatform = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.95), woodMat);
  arjunaPlatform.position.set(0.32, deckY + 0.14, -0.35);
  group.add(arjunaPlatform);

  // 4. Four Carved Canopy Pillars + Domed Golden Chhatra + Valance Curtains
  const canopyBaseY = deckY + 2.38;
  const pillarPositions: Array<[number, number]> = [
    [-0.86, 0.56],
    [0.86, 0.56],
    [-0.86, -1.06],
    [0.86, -1.06],
  ];
  const pillarGeo = new THREE.CylinderGeometry(0.055, 0.072, 2.38, 12);
  for (const [px, pz] of pillarPositions) {
    const pillar = new THREE.Mesh(pillarGeo, goldMat);
    pillar.position.set(px, deckY + 1.19, pz);
    pillar.castShadow = true;
    group.add(pillar);
  }

  // Carved Dome Roof (Lathe profile matching traditional Hindu Chhatra dome)
  const domePts = [
    new THREE.Vector2(1.28, 0.0),
    new THREE.Vector2(1.18, 0.28),
    new THREE.Vector2(0.88, 0.62),
    new THREE.Vector2(0.42, 0.86),
    new THREE.Vector2(0.14, 0.98),
    new THREE.Vector2(0.03, 1.24),
  ];
  const domeGeo = new THREE.LatheGeometry(domePts, 28);
  const dome = new THREE.Mesh(domeGeo, goldMat);
  dome.position.set(0, canopyBaseY, -0.25);
  dome.castShadow = true;
  group.add(dome);

  // Crimson silk inner valance curtain hanging cleanly around canopy eaves
  const valance = new THREE.Mesh(
    new THREE.CylinderGeometry(1.14, 1.18, 0.28, 28, 1, true),
    crimsonSilkMat,
  );
  valance.position.set(0, canopyBaseY - 0.12, -0.25);
  group.add(valance);

  // 5. Elevated Kapi-Dhvaja (Hanuman Standard Mast + Animated Cloth Banner)
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.048, 2.15, 10), goldMat);
  mast.position.set(0, canopyBaseY + 1.55, -0.25);
  group.add(mast);

  const flagGeo = new THREE.PlaneGeometry(1.65, 0.88, 18, 10);
  // Shift flag origin to hoist edge so waves propagate freely from left to right
  flagGeo.translate(0.825, 0, 0);
  const flagBasePositions = new Float32Array(flagGeo.attributes.position.array);
  const flagMesh = new THREE.Mesh(flagGeo, saffronFlagMat);
  flagMesh.position.set(0, canopyBaseY + 2.18, -0.25);
  flagMesh.rotation.y = Math.PI * 0.42;
  flagMesh.castShadow = true;
  group.add(flagMesh);

  // 6. Central Draught Pole (Isha) & Four-Horse Yoke (Yuga)
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 4.15, 10), goldMat);
  pole.rotation.x = Math.PI / 2;
  pole.position.set(0, deckY - 0.08, 2.85);
  pole.castShadow = true;
  group.add(pole);

  const yokeBar = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 3.2, 10), goldMat);
  yokeBar.rotation.z = Math.PI / 2;
  yokeBar.position.set(0, 1.48, 4.65);
  group.add(yokeBar);

  // 7. Grounded Mounts for Krishna, Arjuna, & 4 White Horses
  const krishnaMount = new THREE.Group();
  krishnaMount.name = 'KrishnaMount';
  krishnaMount.position.set(-0.34, deckY + 0.05, 0.58);
  group.add(krishnaMount);

  const arjunaMount = new THREE.Group();
  arjunaMount.name = 'ArjunaMount';
  arjunaMount.position.set(0.32, deckY + 0.21, -0.35);
  group.add(arjunaMount);

  const horseSlots: THREE.Group[] = [];
  const bridleAnchors: THREE.Object3D[] = [];
  for (let i = 0; i < 4; i++) {
    const slot = new THREE.Group();
    slot.name = `WhiteHorseSlot_${i}`;
    slot.position.set(HORSE_LATERAL_OFFSETS[i], 0, 4.05);
    group.add(slot);
    horseSlots.push(slot);

    const bridle = new THREE.Object3D();
    bridle.position.set(HORSE_LATERAL_OFFSETS[i], 1.82, 5.15);
    group.add(bridle);
    bridleAnchors.push(bridle);
  }

  // 8. Dynamic Reins connecting Krishna's Hands to Horse Bridles (fixed 4-vertex buffers updated in place)
  const reinPtsL = [
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ];
  const reinPtsR = [
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ];
  const reinGeoL = new THREE.BufferGeometry().setFromPoints(reinPtsL);
  const reinGeoR = new THREE.BufferGeometry().setFromPoints(reinPtsR);
  const reinsLeft = new THREE.Line(reinGeoL, reinMat);
  const reinsRight = new THREE.Line(reinGeoR, reinMat);
  group.add(reinsLeft);
  group.add(reinsRight);

  const tempV1 = new THREE.Vector3();
  const tempV2 = new THREE.Vector3();
  const prowGuideL = new THREE.Vector3();
  const prowGuideR = new THREE.Vector3();
  const midL = new THREE.Vector3();
  const midR = new THREE.Vector3();
  const defaultHandL = new THREE.Vector3(-0.18, deckY + 1.05, 0.85);
  const defaultHandR = new THREE.Vector3(-0.48, deckY + 1.05, 0.85);

  const update = (params: {
    chariotPositionZ: number;
    timeSec: number;
    reducedMotion: boolean;
    krishnaLeftHandWorld?: THREE.Vector3 | null;
    krishnaRightHandWorld?: THREE.Vector3 | null;
  }) => {
    const {
      chariotPositionZ,
      timeSec,
      reducedMotion,
      krishnaLeftHandWorld,
      krishnaRightHandWorld,
    } = params;

    group.position.z = chariotPositionZ;

    // Wheel angular rotation locked accurately to travel distance (theta = z / R)
    const wheelAngle = chariotPositionZ / CHARIOT_WHEEL_RADIUS;
    leftWheel.rotation.x = wheelAngle;
    rightWheel.rotation.x = wheelAngle;

    // Wind ripple on Hanuman Flag (Kapi-dhvaja)
    const posAttr = flagGeo.attributes.position as THREE.BufferAttribute;
    const waveAmp = reducedMotion ? 0.015 : 0.095;
    for (let i = 0; i < posAttr.count; i++) {
      const x = flagBasePositions[i * 3];
      const y = flagBasePositions[i * 3 + 1];
      const normX = Math.max(0, x / 1.65);
      const zWave =
        Math.sin(normX * 4.5 - timeSec * 4.2 + y * 1.4) * waveAmp * normX;
      posAttr.setZ(i, zWave);
    }
    posAttr.needsUpdate = true;
    flagGeo.computeVertexNormals();

    // Update braided reins in Chariot local coordinates
    let handL = defaultHandL;
    let handR = defaultHandR;
    if (krishnaLeftHandWorld) {
      tempV1.copy(krishnaLeftHandWorld);
      group.worldToLocal(tempV1);
      handL = tempV1;
    }
    if (krishnaRightHandWorld) {
      tempV2.copy(krishnaRightHandWorld);
      group.worldToLocal(tempV2);
      handR = tempV2;
    }

    const bridleInnerL = bridleAnchors[1].position;
    const bridleOuterR = bridleAnchors[3].position;
    prowGuideL.set(handL.x * 0.72, deckY + 0.98, 1.48);
    prowGuideR.set(handR.x * 0.72, deckY + 0.98, 1.48);
    midL.lerpVectors(prowGuideL, bridleInnerL, 0.55);
    midL.y -= 0.16;
    midR.lerpVectors(prowGuideR, bridleOuterR, 0.55);
    midR.y -= 0.16;

    const reinPosAttrL = reinGeoL.attributes.position as THREE.BufferAttribute;
    reinPosAttrL.setXYZ(0, handL.x, handL.y, handL.z);
    reinPosAttrL.setXYZ(1, prowGuideL.x, prowGuideL.y, prowGuideL.z);
    reinPosAttrL.setXYZ(2, midL.x, midL.y, midL.z);
    reinPosAttrL.setXYZ(3, bridleInnerL.x, bridleInnerL.y, bridleInnerL.z);
    reinPosAttrL.needsUpdate = true;
    reinGeoL.computeBoundingSphere();

    const reinPosAttrR = reinGeoR.attributes.position as THREE.BufferAttribute;
    reinPosAttrR.setXYZ(0, handR.x, handR.y, handR.z);
    reinPosAttrR.setXYZ(1, prowGuideR.x, prowGuideR.y, prowGuideR.z);
    reinPosAttrR.setXYZ(2, midR.x, midR.y, midR.z);
    reinPosAttrR.setXYZ(3, bridleOuterR.x, bridleOuterR.y, bridleOuterR.z);
    reinPosAttrR.needsUpdate = true;
    reinGeoR.computeBoundingSphere();
  };

  const dispose = () => {
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
    reinGeoL.dispose();
    reinGeoR.dispose();
    for (const d of disposables) d.dispose();
  };

  return {
    group,
    leftWheel,
    rightWheel,
    flagMesh,
    krishnaMount,
    arjunaMount,
    horseSlots,
    bridleAnchors,
    reinsLeft,
    reinsRight,
    update,
    dispose,
  };
}
