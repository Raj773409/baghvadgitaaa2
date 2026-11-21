import * as THREE from 'three';
import type { ParticipatingCountry } from '../content/countryContent';
import {
  greatCircleAngleRad,
  greatCircleArcPoints,
  latLonToVector3,
} from '../utils/geodesy';
import { createCartographicEarthTextures } from './proceduralMaterials';

export interface CountryBeacon {
  countryId: string;
  group: THREE.Group;
  hitTarget: THREE.Mesh;
  coreMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
}

export interface CountryConnectionArc {
  countryId: string;
  mesh: THREE.Mesh;
}

export interface ArmillaryGlobeRig {
  root: THREE.Group;
  earthRadius: number;
  beacons: CountryBeacon[];
  interactables: THREE.Mesh[];
  setActiveCountry: (countryId: string) => void;
  setHoveredCountry: (countryId: string | null) => void;
  dispose: () => void;
}

const _upVec = new THREE.Vector3(0, 1, 0);
const _normalVec = new THREE.Vector3();

/**
 * Builds an illuminated nocturnal 3D Earth with:
 * - Procedural night-side continental relief & city-light emissive textures
 * - Dual-layer orbital atmospheric Fresnel rim shader (sunrise champagne + twilight blue)
 * - 18 golden great-circle TubeGeometry connection arcs radiating from India
 * - 18 interactive multi-part country light beacons on raycaster Layer 1
 * - Subtle distant orbital starfield dust
 */
export function buildArmillaryGlobe(
  countries: ReadonlyArray<ParticipatingCountry>,
  maxAnisotropy: number,
): ArmillaryGlobeRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const root = new THREE.Group();
  const earthRadius = 1.88;

  const { colorMap, emissiveMap, roughnessMap, bumpMap } =
    createCartographicEarthTextures(maxAnisotropy);
  disposables.push(colorMap, emissiveMap, roughnessMap, bumpMap);

  // 1. Primary Earth Sphere
  const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 48);
  const earthMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: colorMap,
    emissive: new THREE.Color(0xf4cf94),
    emissiveMap,
    emissiveIntensity: 1.15,
    roughnessMap,
    bumpMap,
    bumpScale: 0.022,
    roughness: 0.88,
    metalness: 0.04,
  });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  root.add(earthMesh);
  disposables.push(earthGeo, earthMat);

  // 2. Inner Atmospheric Horizon Scatter Rim (FrontSide soft orbital mist)
  const innerAtmoGeo = new THREE.SphereGeometry(earthRadius * 1.008, 48, 36);
  const innerAtmoMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewPos);
        float ndotv = clamp(dot(n, v), 0.0, 1.0);
        float rim = pow(1.0 - ndotv, 4.4);
        // Sun-kissed golden upper-right limb transitioning to cool twilight blue
        float sunSide = clamp(dot(n, normalize(vec3(0.45, 0.72, 0.45))) * 0.5 + 0.5, 0.0, 1.0);
        vec3 twilight = vec3(0.32, 0.52, 0.80);
        vec3 sunset = vec3(0.95, 0.78, 0.52);
        vec3 col = mix(twilight, sunset, sunSide * 0.62);
        gl_FragColor = vec4(col, rim * 0.34);
      }
    `,
  });
  const innerAtmoMesh = new THREE.Mesh(innerAtmoGeo, innerAtmoMat);
  root.add(innerAtmoMesh);
  disposables.push(innerAtmoGeo, innerAtmoMat);

  // 3. Outer Illuminated Orbital Corona Shell (BackSide smooth horizon decay -> 0 at boundary)
  const outerAtmoGeo = new THREE.SphereGeometry(earthRadius * 1.13, 48, 36);
  const outerAtmoMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        // On BackSide, view-facing dot is negative; magnitude is ~0.46 at planet limb and 0.0 at outer boundary
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewPos);
        float edgeDist = clamp(-dot(n, v) / 0.465, 0.0, 1.0);
        float glow = pow(edgeDist, 3.2);
        float sunSide = clamp(dot(-n, normalize(vec3(0.45, 0.75, 0.4))) * 0.5 + 0.5, 0.0, 1.0);
        vec3 deepBlue = vec3(0.24, 0.44, 0.74);
        vec3 warmGold = vec3(0.96, 0.78, 0.54);
        vec3 col = mix(deepBlue, warmGold, sunSide * 0.58);
        gl_FragColor = vec4(col, glow * 0.44);
      }
    `,
  });
  const outerAtmoMesh = new THREE.Mesh(outerAtmoGeo, outerAtmoMat);
  root.add(outerAtmoMesh);
  disposables.push(outerAtmoGeo, outerAtmoMat);

  // 4. Subtle Distant Equatorial Celestial Hairline Orbit
  const orbitGeo = new THREE.TorusGeometry(earthRadius * 1.16, 0.0028, 8, 128);
  const orbitMat = new THREE.MeshBasicMaterial({
    color: 0xd5ac70,
    transparent: true,
    opacity: 0.14,
  });
  const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
  orbitRing.rotation.x = Math.PI / 2.25;
  orbitRing.rotation.y = Math.PI / 8;
  root.add(orbitRing);
  disposables.push(orbitGeo, orbitMat);

  // 5. Fine Golden Geodesic Connection Arcs originating from India
  const india = countries.find((c) => c.id === 'india') ?? countries[0];
  const defaultArcMat = new THREE.MeshBasicMaterial({
    color: 0xe6bf82,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const activeArcMat = new THREE.MeshBasicMaterial({
    color: 0xffeac2,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
  });
  disposables.push(defaultArcMat, activeArcMat);

  const connectionArcs: CountryConnectionArc[] = [];
  for (const country of countries) {
    if (country.id === india.id) continue;
    const angle = greatCircleAngleRad(india.lat, india.lon, country.lat, country.lon);
    const altitude = 0.08 + (angle / Math.PI) * 0.34;
    const pts = greatCircleArcPoints(
      india.lat,
      india.lon,
      country.lat,
      country.lon,
      earthRadius + 0.008,
      altitude,
      40,
    ).map((p) => new THREE.Vector3(p.x, p.y, p.z));

    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.0042, 6, false);
    const arcMesh = new THREE.Mesh(tubeGeo, defaultArcMat);
    root.add(arcMesh);
    disposables.push(tubeGeo);
    connectionArcs.push({ countryId: country.id, mesh: arcMesh });
  }

  // 6. 18 Interactive Multi-Part Golden Country Pinpoints (Interactables on Layer 1)
  const collarGeo = new THREE.CylinderGeometry(0.02, 0.028, 0.008, 16);
  const coreGeo = new THREE.SphereGeometry(0.022, 14, 12);
  const haloGeo = new THREE.RingGeometry(0.036, 0.044, 28);
  const hitProxyGeo = new THREE.SphereGeometry(0.15, 10, 10);

  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xc8a26a,
    roughness: 0.25,
    metalness: 0.85,
  });
  const defaultCoreMat = new THREE.MeshStandardMaterial({
    color: 0xf7deb0,
    emissive: 0xd5ac70,
    emissiveIntensity: 1.25,
    roughness: 0.16,
    metalness: 0.35,
  });
  const activeCoreMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: 0xf0ba7c,
    emissiveIntensity: 2.0,
    roughness: 0.1,
    metalness: 0.2,
  });
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xf4cf94,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const hitProxyMat = new THREE.MeshBasicMaterial({ visible: false });

  disposables.push(
    collarGeo,
    coreGeo,
    haloGeo,
    hitProxyGeo,
    collarMat,
    defaultCoreMat,
    activeCoreMat,
    haloMat,
    hitProxyMat,
  );

  const beacons: CountryBeacon[] = [];
  const interactables: THREE.Mesh[] = [];

  for (const country of countries) {
    const surfacePos = latLonToVector3(country.lat, country.lon, earthRadius);
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(surfacePos.x, surfacePos.y, surfacePos.z);

    _normalVec.set(surfacePos.x, surfacePos.y, surfacePos.z).normalize();
    beaconGroup.quaternion.setFromUnitVectors(_upVec, _normalVec);

    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.y = 0.004;

    const coreMesh = new THREE.Mesh(coreGeo, defaultCoreMat);
    coreMesh.position.y = 0.024;

    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = 0.01;
    haloMesh.visible = false;

    const hitTarget = new THREE.Mesh(hitProxyGeo, hitProxyMat);
    hitTarget.position.y = 0.035;
    hitTarget.layers.set(1);
    hitTarget.userData.countryId = country.id;

    beaconGroup.add(collarMesh, coreMesh, haloMesh, hitTarget);
    root.add(beaconGroup);

    beacons.push({
      countryId: country.id,
      group: beaconGroup,
      hitTarget,
      coreMesh,
      haloMesh,
    });
    interactables.push(hitTarget);
  }

  // 7. Restrained Deep-Space Starfield Dust for Atmospheric Depth
  const starCount = 260;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const u = ((i * 73) % 1000) / 1000;
    const v = ((i * 197) % 1000) / 1000;
    const theta = u * 2 * Math.PI;
    const phi = Math.acos(2 * v - 1);
    const r = 13 + ((i * 37) % 10);
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi);
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xf5f0e7,
    size: 0.045,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  root.add(stars);
  disposables.push(starGeo, starMat);

  let currentActiveId = 'india';
  let currentHoveredId: string | null = null;

  const syncVisualStates = () => {
    for (const b of beacons) {
      const isSelected = b.countryId === currentActiveId;
      const isHovered = b.countryId === currentHoveredId;
      const isOrigin = b.countryId === india.id;

      b.coreMesh.material = isSelected || isHovered ? activeCoreMat : defaultCoreMat;
      b.coreMesh.scale.setScalar(
        isSelected ? 1.45 : isHovered ? 1.28 : isOrigin ? 1.18 : 1,
      );
      b.haloMesh.visible = isSelected || isHovered || isOrigin;
      b.haloMesh.scale.setScalar(isSelected ? 1.38 : isHovered ? 1.2 : 1);
    }

    for (const arc of connectionArcs) {
      const highlighted =
        arc.countryId === currentActiveId || arc.countryId === currentHoveredId;
      arc.mesh.material = highlighted ? activeArcMat : defaultArcMat;
      arc.mesh.scale.setScalar(highlighted ? 1.003 : 1);
    }
  };

  syncVisualStates();

  return {
    root,
    earthRadius,
    beacons,
    interactables,
    setActiveCountry: (countryId: string) => {
      currentActiveId = countryId;
      syncVisualStates();
    },
    setHoveredCountry: (countryId: string | null) => {
      currentHoveredId = countryId;
      syncVisualStates();
    },
    dispose: () => {
      for (const item of disposables) {
        item.dispose();
      }
    },
  };
}
