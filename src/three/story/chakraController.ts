import * as THREE from 'three';

export interface ChakraControllerHandle {
  group: THREE.Group;
  equip: () => void;
  unequip: () => void;
  attachToHand: (target: THREE.Object3D) => void;
  returnToHand: (target: THREE.Object3D) => void;
  setRotation: (speedRadPerSec: number) => void;
  setActivation: (amount01: number) => void;
  update: (deltaSec: number, timeSec: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

/**
 * Reusable Divine Sudarshana Chakra System (Scene 04 Vishvarupa symbolic context ONLY, BG 11.17).
 * Distinct from the broken wooden chariot wheel lifted in Part B Day 9.
 */
export function createChakraController(): ChakraControllerHandle {
  const group = new THREE.Group();
  group.name = 'SudarshanaChakraProp';
  group.visible = false;

  const disposables: Array<{ dispose: () => void }> = [];

  const goldWheelMat = new THREE.MeshStandardMaterial({
    color: 0xf7d07a,
    emissive: new THREE.Color(0xe69f28),
    emissiveIntensity: 1.45,
    metalness: 0.92,
    roughness: 0.16,
    transparent: true,
    opacity: 0.96,
  });

  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xffd778,
    transparent: true,
    opacity: 0.36,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  disposables.push(goldWheelMat, coronaMat);

  const rotor = new THREE.Group();
  group.add(rotor);

  // Outer celestial rim
  const outerRimGeo = new THREE.TorusGeometry(0.28, 0.022, 10, 32);
  const innerRimGeo = new THREE.TorusGeometry(0.14, 0.016, 8, 24);
  const hubGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.036, 16);
  hubGeo.rotateX(Math.PI / 2);
  const spokeGeo = new THREE.BoxGeometry(0.018, 0.54, 0.014);
  const serrationGeo = new THREE.ConeGeometry(0.026, 0.075, 4);
  const coronaGeo = new THREE.CircleGeometry(0.42, 32);

  disposables.push(outerRimGeo, innerRimGeo, hubGeo, spokeGeo, serrationGeo, coronaGeo);

  rotor.add(new THREE.Mesh(outerRimGeo, goldWheelMat));
  rotor.add(new THREE.Mesh(innerRimGeo, goldWheelMat));
  rotor.add(new THREE.Mesh(hubGeo, goldWheelMat));

  // 8 sacred spokes
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(spokeGeo, goldWheelMat);
    spoke.rotation.z = (i * Math.PI) / 4;
    rotor.add(spoke);
  }

  // 16 serrated solar flames around outer rim
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const tooth = new THREE.Mesh(serrationGeo, goldWheelMat);
    tooth.position.set(Math.cos(angle) * 0.32, Math.sin(angle) * 0.32, 0);
    tooth.rotation.z = angle - Math.PI / 2;
    rotor.add(tooth);
  }

  const coronaDisc = new THREE.Mesh(coronaGeo, coronaMat);
  coronaDisc.position.z = -0.02;
  group.add(coronaDisc);

  let isEquipped = false;
  let activationAmount = 0;
  let spinSpeed = 5.5;
  let spinAngle = 0;

  const equip = () => {
    isEquipped = true;
  };

  const unequip = () => {
    isEquipped = false;
    activationAmount = 0;
    group.visible = false;
  };

  const attachToHand = (target: THREE.Object3D) => {
    if (group.parent !== target) {
      target.add(group);
    }
    group.position.set(-0.04, 0.24, 0.14);
    group.rotation.set(0.18, 0.25, 0);
  };

  const returnToHand = (target: THREE.Object3D) => {
    attachToHand(target);
  };

  const setRotation = (speedRadPerSec: number) => {
    spinSpeed = speedRadPerSec;
  };

  const setActivation = (amount01: number) => {
    activationAmount = Math.max(0, Math.min(1, amount01));
    if (activationAmount > 0.02) {
      isEquipped = true;
    } else {
      isEquipped = false;
    }
  };

  const update = (deltaSec: number, timeSec: number, reducedMotion: boolean) => {
    if (!isEquipped || activationAmount <= 0.02) {
      group.visible = false;
      return;
    }
    group.visible = true;
    const dt = Math.min(0.08, Math.max(0.001, deltaSec));
    const spinRate = reducedMotion ? spinSpeed * 0.15 : spinSpeed;
    spinAngle = (spinAngle + spinRate * dt) % (Math.PI * 2);
    rotor.rotation.z = spinAngle;

    const scale = 0.55 + activationAmount * 0.72;
    group.scale.setScalar(scale);
    goldWheelMat.opacity = Math.min(0.96, activationAmount * 1.3);
    goldWheelMat.emissiveIntensity = 1.1 + activationAmount * 1.2 + Math.sin(timeSec * 4) * 0.15;
    coronaMat.opacity = activationAmount * 0.42;
  };

  const dispose = () => {
    group.parent?.remove(group);
    for (const d of disposables) d.dispose();
  };

  return {
    group,
    equip,
    unequip,
    attachToHand,
    returnToHand,
    setRotation,
    setActivation,
    update,
    dispose,
  };
}
