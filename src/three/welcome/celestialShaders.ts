import * as THREE from 'three';

export interface VolumetricLightRig {
  group: THREE.Group;
  update: (timeSec: number, intensity: number) => void;
  dispose: () => void;
}

/**
 * Restrained volumetric light shafts slanting cleanly across the temple colonnade
 * and behind the sacred golden lotus threshold.
 */
export function buildVolumetricLightRays(): VolumetricLightRig {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const rayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.25 },
      uColor: { value: new THREE.Color(0xf3cd82) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uColor;

      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        // Soft vertical fade from sanctum crown downward
        float verticalFade = smoothstep(0.0, 0.28, vUv.y) * smoothstep(1.0, 0.12, vUv.y);
        // Smooth radial beam falloff across cylinder edges (zero hard silhouette)
        float facing = abs(dot(normalize(vNormalView), normalize(vViewDir)));
        float radialFade = pow(facing, 1.85);
        // Subtle atmospheric shimmer
        float shimmer = 0.86 + 0.14 * sin(vUv.x * 12.566 + uTime * 0.45);
        float alpha = verticalFade * radialFade * shimmer * uIntensity * 0.27;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
  disposables.push(rayMaterial);

  const raySpecs = [
    { x: 0, y: 5.5, z: -13.2, topR: 0.9, botR: 4.8, h: 14.5, rx: 0.34, rz: 0.0 },
    { x: -2.4, y: 5.8, z: -8.5, topR: 0.55, botR: 2.7, h: 13.5, rx: 0.28, rz: 0.26 },
    { x: 2.4, y: 5.8, z: -8.5, topR: 0.55, botR: 2.7, h: 13.5, rx: 0.28, rz: -0.26 },
    { x: -2.6, y: 5.6, z: -2.5, topR: 0.45, botR: 2.2, h: 12.8, rx: 0.24, rz: 0.22 },
    { x: 2.6, y: 5.6, z: -2.5, topR: 0.45, botR: 2.2, h: 12.8, rx: 0.24, rz: -0.22 },
  ];

  for (const spec of raySpecs) {
    const geo = new THREE.CylinderGeometry(spec.topR, spec.botR, spec.h, 24, 1, true);
    const mesh = new THREE.Mesh(geo, rayMaterial);
    mesh.position.set(spec.x, spec.y, spec.z);
    mesh.rotation.set(spec.rx, 0, spec.rz);
    group.add(mesh);
    disposables.push(geo);
  }

  return {
    group,
    update: (timeSec: number, intensity: number) => {
      rayMaterial.uniforms.uTime.value = timeSec;
      rayMaterial.uniforms.uIntensity.value = intensity;
    },
    dispose: () => {
      for (const item of disposables) item.dispose();
    },
  };
}

export interface GoldenDustRig {
  points: THREE.Points;
  update: (timeSec: number, visibility: number) => void;
  dispose: () => void;
}

/**
 * Floating golden temple dust motes rendered in a single GPU draw call.
 */
export function buildGoldenDustParticles(count: number): GoldenDustRig {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const seed1 = Math.sin(i * 12.9898) * 43758.5453;
    const seed2 = Math.sin(i * 78.233 + 1.7) * 29431.1234;
    const seed3 = Math.sin(i * 39.425 + 4.3) * 19571.6821;
    const rx = seed1 - Math.floor(seed1);
    const ry = seed2 - Math.floor(seed2);
    const rz = seed3 - Math.floor(seed3);

    positions[i * 3] = (rx - 0.5) * 12.5;
    positions[i * 3 + 1] = 0.35 + ry * 7.4;
    positions[i * 3 + 2] = 9.0 - rz * 26.0;
    phases[i] = rx * Math.PI * 2;
    scales[i] = 0.65 + ry * 1.15;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.65 },
      uPixelRatio: { value: 1 },
    },
    vertexShader: `
      attribute float aPhase;
      attribute float aScale;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vTwinkle;

      void main() {
        vec3 pos = position;
        pos.y += mod(uTime * 0.16 + aPhase, 1.8) - 0.9;
        pos.x += sin(uTime * 0.42 + aPhase * 3.0) * 0.24;
        pos.z += cos(uTime * 0.31 + aPhase * 2.0) * 0.18;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float dist = max(1.0, -mvPosition.z);
        gl_PointSize = clamp((58.0 * aScale * uPixelRatio) / dist, 2.0, 12.0);
        vTwinkle = 0.55 + 0.45 * sin(uTime * 1.4 + aPhase * 6.2831);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vTwinkle;

      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 2.2);
        vec3 gold = mix(vec3(0.84, 0.64, 0.28), vec3(1.0, 0.91, 0.68), glow);
        gl_FragColor = vec4(gold, glow * vTwinkle * uOpacity);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);

  return {
    points,
    update: (timeSec: number, visibility: number) => {
      material.uniforms.uTime.value = timeSec;
      material.uniforms.uOpacity.value = visibility;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
