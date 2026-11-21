import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  buildGoldenDustParticles,
  buildVolumetricLightRays,
} from '../../three/welcome/celestialShaders';
import { buildGoldenLotusEmblem } from '../../three/welcome/goldenLotusEmblem';
import { buildTempleSanctuary } from '../../three/welcome/templeArchitecture';
import {
  createStudioEnvironment,
  detectWebGLCapability,
  disposeRendererSafely,
  isWebGLContextLost,
  scheduleAfterDraw,
} from '../../three/webglSupport';
import { WELCOME_TOTAL_DURATION_SEC } from '../../utils/welcomeExperience';

interface WelcomeScene3DProps {
  elapsedSec: number;
  reducedMotion: boolean;
  onWebGLStatusChange?: (mode: 'webgl' | 'fallback') => void;
}

const StaticSanctuaryFallback: React.FC<{ elapsedSec: number; reducedMotion: boolean }> = ({
  elapsedSec,
  reducedMotion,
}) => {
  const t = reducedMotion ? 14.0 : elapsedSec;
  const awakening = Math.min(1, Math.max(0.25, t / 2.8));
  const lotusScale = t < 5.5 ? 0.85 : Math.min(1.04, 0.85 + ((t - 5.5) / 6) * 0.19);
  const glowOpacity = Math.min(0.95, 0.22 + (t / WELCOME_TOTAL_DURATION_SEC) * 0.72);

  return (
    <div
      data-testid="welcome-fallback-scene"
      className="absolute inset-0 overflow-hidden bg-[#0A0F20]"
      aria-hidden="true"
    >
      {/* Midnight Navy & Golden Horizon Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 74% 58% at 50% 44%, rgba(214, 164, 71, 0.24) 0%, rgba(28, 43, 74, 0.56) 46%, rgba(10, 15, 32, 0.98) 100%)',
          opacity: awakening,
        }}
      />

      {/* Architectural Indian Temple Colonnade & Sanctum Torana SVG */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full opacity-85"
      >
        <defs>
          <linearGradient id="welcomeGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F3CD82" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#9C712A" stopOpacity="0.18" />
          </linearGradient>
          <radialGradient id="sanctumCore" cx="50%" cy="46%" r="48%">
            <stop offset="0%" stopColor="#FFF2CE" stopOpacity={glowOpacity} />
            <stop offset="45%" stopColor="#D6A447" stopOpacity={glowOpacity * 0.42} />
            <stop offset="100%" stopColor="#0A0F20" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1440" height="900" fill="url(#sanctumCore)" />

        {/* Stepped Sanctum Torana Archway */}
        <path
          d="M470 860 L470 250 L530 250 L530 190 L910 190 L910 250 L970 250 L970 860"
          fill="none"
          stroke="url(#welcomeGold)"
          strokeWidth="2"
          opacity="0.65"
        />
        <path
          d="M555 860 L555 430 A165 165 0 0 1 885 430 L885 860"
          fill="none"
          stroke="#F3CD82"
          strokeWidth="2.5"
          opacity="0.72"
        />

        {/* Carved Temple Pillars Left & Right */}
        {[170, 320, 1120, 1270].map((x, idx) => (
          <g key={x} opacity={idx === 1 || idx === 2 ? 0.65 : 0.45}>
            <rect x={x - 32} y="150" width="64" height="720" fill="#121A31" stroke="#D6A447" strokeOpacity="0.28" />
            <rect x={x - 46} y="150" width="92" height="44" fill="#1A2442" stroke="#F3CD82" strokeOpacity="0.45" />
            <rect x={x - 42} y="785" width="84" height="75" fill="#1A2442" stroke="#F3CD82" strokeOpacity="0.38" />
            <line x1={x - 32} y1="340" x2={x + 32} y2="340" stroke="#F3CD82" strokeOpacity="0.42" strokeWidth="2" />
            <line x1={x - 32} y1="560" x2={x + 32} y2="560" stroke="#F3CD82" strokeOpacity="0.42" strokeWidth="2" />
          </g>
        ))}

        {/* Golden Lotus Emblem */}
        <g transform={`translate(720 385) scale(${lotusScale})`} opacity={Math.min(1, t / 4.2)}>
          <circle cx="0" cy="0" r="105" fill="none" stroke="#F3CD82" strokeOpacity="0.35" strokeWidth="1.5" />
          <path
            d="M0 -72 C18 -38 18 -10 0 38 C-18 -10 -18 -38 0 -72 Z"
            fill="#F3CD82"
            fillOpacity="0.22"
            stroke="#F3CD82"
            strokeWidth="2"
          />
          <path
            d="M0 38 C-38 18 -58 -16 -64 -54 C-32 -38 -12 -6 0 38 Z"
            fill="#F3CD82"
            fillOpacity="0.16"
            stroke="#F3CD82"
            strokeWidth="1.8"
          />
          <path
            d="M0 38 C38 18 58 -16 64 -54 C32 -38 12 -6 0 38 Z"
            fill="#F3CD82"
            fillOpacity="0.16"
            stroke="#F3CD82"
            strokeWidth="1.8"
          />
          <path
            d="M0 44 C-48 40 -86 16 -108 -22 C-68 -16 -32 8 0 44 Z"
            fill="#D6A447"
            fillOpacity="0.14"
            stroke="#F3CD82"
            strokeWidth="1.5"
          />
          <path
            d="M0 44 C48 40 86 16 108 -22 C68 -16 32 8 0 44 Z"
            fill="#D6A447"
            fillOpacity="0.14"
            stroke="#F3CD82"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
};

export const WelcomeScene3D: React.FC<WelcomeScene3DProps> = ({
  elapsedSec,
  reducedMotion,
  onWebGLStatusChange,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const elapsedRef = useRef<number>(elapsedSec);
  const reducedMotionRef = useRef<boolean>(reducedMotion);
  const onStatusRef = useRef(onWebGLStatusChange);
  const renderOnceRef = useRef<(() => void) | null>(null);

  elapsedRef.current = elapsedSec;
  reducedMotionRef.current = reducedMotion;
  onStatusRef.current = onWebGLStatusChange;

  const webglCap = useMemo(() => detectWebGLCapability(), []);
  const [webglFailed, setWebglFailed] = useState<boolean>(() => !webglCap.supported);

  useEffect(() => {
    if (!webglCap.supported) {
      onStatusRef.current?.('fallback');
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !webglCap.isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglFailed(true);
      onStatusRef.current?.('fallback');
      return;
    }

    const isSoftware = webglCap.isSoftwareGl;
    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || window.innerHeight);
    const pixelRatio = isSoftware ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftware;
    if (!isSoftware) {
      renderer.shadowMap.type = THREE.PCFShadowMap;
    }
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const { envTarget, shaderFailed } = createStudioEnvironment(renderer);
    if (shaderFailed || !envTarget || isWebGLContextLost(renderer)) {
      disposeRendererSafely(renderer);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      setWebglFailed(true);
      onStatusRef.current?.('fallback');
      return;
    }

    const scene = new THREE.Scene();
    const bgNavy = new THREE.Color(0x0a1022);
    scene.background = bgNavy;
    scene.fog = new THREE.FogExp2(0x0a1022, 0.036);

    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.72;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    camera.position.set(0, 2.55, 10.6);

    // Warm / Cool Lighting Contrast
    const hemiLight = new THREE.HemisphereLight(0x5272a6, 0x0d1224, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xf6d388, 1.85);
    keyLight.position.set(5.5, 11.5, 6.5);
    if (!isSoftware) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 36;
      keyLight.shadow.camera.left = -12;
      keyLight.shadow.camera.right = 12;
      keyLight.shadow.camera.top = 12;
      keyLight.shadow.camera.bottom = -12;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const sanctumPoint = new THREE.PointLight(0xffcb72, 6.5, 34, 1.4);
    sanctumPoint.position.set(0, 4.1, -15.6);
    scene.add(sanctumPoint);

    const lotusLight = new THREE.PointLight(0xf3cd82, 3.8, 18, 1.6);
    lotusLight.position.set(0, 4.3, -9.2);
    scene.add(lotusLight);

    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const sanctuary = buildTempleSanctuary(maxAniso, !isSoftware);
    scene.add(sanctuary.root);

    const lotus = buildGoldenLotusEmblem(sanctuary.goldTextures);
    lotus.group.position.set(0, 3.72, -11.4);
    scene.add(lotus.group);

    const rays = buildVolumetricLightRays();
    scene.add(rays.group);

    const dust = buildGoldenDustParticles(isSoftware ? 110 : 260);
    scene.add(dust.points);

    let rafId = 0;
    const activeTimers = new Set<number>();
    let disposed = false;

    const triggerFallback = () => {
      if (disposed) return;
      disposed = true;
      window.cancelAnimationFrame(rafId);
      for (const id of activeTimers) {
        window.clearTimeout(id);
      }
      activeTimers.clear();
      setWebglFailed(true);
      onStatusRef.current?.('fallback');
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      triggerFallback();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

    renderer.debug.onShaderError = () => {
      triggerFallback();
    };

    if (!isSoftware && !isWebGLContextLost(renderer)) {
      try {
        renderer.compile(scene, camera);
      } catch {
        // Ignore and let renderFrame/fallback handle
      }
    }
    if (disposed || isWebGLContextLost(renderer)) {
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      sanctuary.dispose();
      lotus.dispose();
      rays.dispose();
      dust.dispose();
      envTarget.dispose();
      disposeRendererSafely(renderer);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      setWebglFailed(true);
      onStatusRef.current?.('fallback');
      return;
    }
    onStatusRef.current?.('webgl');

    // Pointer parallax state (damped without allocations in RAF)
    let targetPtrX = 0;
    let targetPtrY = 0;
    let smoothPtrX = 0;
    let smoothPtrY = 0;
    const lookTarget = new THREE.Vector3(0, 3.3, -15.5);

    const onPointerMove = (e: PointerEvent) => {
      if (reducedMotionRef.current) return;
      targetPtrX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      targetPtrY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth || window.innerWidth);
      const h = Math.max(1, container.clientHeight || window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const evaluateSceneFrame = (dt: number) => {
      const t = reducedMotionRef.current ? 14.0 : elapsedRef.current;

      // Damped pointer parallax
      const damp = 1 - Math.exp(-4.5 * Math.min(0.1, dt));
      smoothPtrX += (targetPtrX - smoothPtrX) * damp;
      smoothPtrY += (targetPtrY - smoothPtrY) * damp;
      const parallaxScale = reducedMotionRef.current ? 0 : 1;

      // 6-scene camera choreography & atmosphere
      let camZ = 10.6;
      let camY = 2.55;
      let lookY = 3.2;
      let lookZ = -15.5;
      let sanctumIntensity = 0.25;
      let rayIntensity = 0.2;
      let lotusBloom = 0.0;
      let lotusVis = 0.0;
      let dustVis = 0.25;

      if (t < 2.5) {
        // Scene 1: Awakening
        const k = t / 2.5;
        camZ = THREE.MathUtils.lerp(11.4, 9.8, k);
        camY = THREE.MathUtils.lerp(2.35, 2.6, k);
        sanctumIntensity = THREE.MathUtils.lerp(0.08, 0.58, k);
        rayIntensity = THREE.MathUtils.lerp(0.05, 0.42, k);
        dustVis = THREE.MathUtils.lerp(0.1, 0.55, k);
      } else if (t < 5.8) {
        // Scene 2: Temple Entrance
        const k = (t - 2.5) / 3.3;
        const ease = k * k * (3 - 2 * k);
        camZ = THREE.MathUtils.lerp(9.8, 2.4, ease);
        camY = THREE.MathUtils.lerp(2.6, 3.05, ease);
        lookY = THREE.MathUtils.lerp(3.2, 3.45, ease);
        sanctumIntensity = THREE.MathUtils.lerp(0.58, 0.78, ease);
        rayIntensity = THREE.MathUtils.lerp(0.42, 0.76, ease);
        dustVis = THREE.MathUtils.lerp(0.55, 0.85, ease);
      } else if (t < 8.6) {
        // Scene 3: Sacred Light & Lotus emergence
        const k = (t - 5.8) / 2.8;
        const ease = k * k * (3 - 2 * k);
        camZ = THREE.MathUtils.lerp(2.4, -2.4, ease);
        camY = THREE.MathUtils.lerp(3.05, 3.3, ease);
        lookY = THREE.MathUtils.lerp(3.45, 3.68, ease);
        sanctumIntensity = THREE.MathUtils.lerp(0.78, 0.96, ease);
        rayIntensity = THREE.MathUtils.lerp(0.76, 1.0, ease);
        lotusVis = ease;
        lotusBloom = THREE.MathUtils.lerp(0.05, 0.72, ease);
        dustVis = 0.9;
      } else if (t < 13.4) {
        // Scene 4: Voice Welcome
        const k = (t - 8.6) / 4.8;
        camZ = THREE.MathUtils.lerp(-2.4, -5.1, k);
        camY = THREE.MathUtils.lerp(3.3, 3.48, k);
        lookY = 3.72;
        sanctumIntensity = 0.95 + Math.sin(t * 1.4) * 0.05;
        rayIntensity = 0.95;
        lotusVis = 1.0;
        lotusBloom = THREE.MathUtils.lerp(0.72, 0.96, k);
        dustVis = 0.92;
      } else if (t < 15.6) {
        // Scene 5: Grand Title Reveal
        const k = (t - 13.4) / 2.2;
        camZ = THREE.MathUtils.lerp(-5.1, -6.9, k);
        camY = THREE.MathUtils.lerp(3.48, 3.62, k);
        lookY = 3.78;
        sanctumIntensity = 1.0;
        rayIntensity = 1.0;
        lotusVis = 1.0;
        lotusBloom = 1.0;
        dustVis = 0.85;
      } else {
        // Scene 6: Camera glide toward the golden sanctum light
        const k = Math.min(1, (t - 15.6) / (WELCOME_TOTAL_DURATION_SEC - 15.6));
        const ease = k * k;
        camZ = THREE.MathUtils.lerp(-6.9, -13.6, ease);
        camY = THREE.MathUtils.lerp(3.62, 3.8, ease);
        lookY = 3.82;
        sanctumIntensity = THREE.MathUtils.lerp(1.0, 1.35, ease);
        rayIntensity = THREE.MathUtils.lerp(1.0, 1.25, ease);
        lotusVis = Math.max(0.15, 1.0 - ease * 0.85);
        lotusBloom = 1.0;
        dustVis = Math.max(0.1, 0.85 - ease * 0.65);
      }

      camera.position.set(
        smoothPtrX * 0.28 * parallaxScale,
        camY - smoothPtrY * 0.14 * parallaxScale,
        camZ,
      );
      lookTarget.set(smoothPtrX * 0.15 * parallaxScale, lookY, lookZ);
      camera.lookAt(lookTarget);

      sanctumPoint.intensity = 2.5 + sanctumIntensity * 8.5;
      lotusLight.intensity = 1.2 + lotusVis * 4.5;
      sanctuary.setSanctumGlow(sanctumIntensity);
      lotus.update(lotusBloom, t, lotusVis);
      rays.update(t, rayIntensity);
      dust.update(t, dustVis);
    };

    let lastNow = performance.now();

    const registerTimer = (id: number) => {
      activeTimers.add(id);
    };

    const renderFrame = () => {
      if (disposed || isWebGLContextLost(renderer)) return;
      const now = performance.now();
      const dt = Math.min(0.1, Math.max(0.001, (now - lastNow) / 1000));
      lastNow = now;
      evaluateSceneFrame(dt);
      renderer.render(scene, camera);
    };

    renderOnceRef.current = renderFrame;

    const tick = () => {
      if (disposed || isWebGLContextLost(renderer)) return;
      if (document.hidden || reducedMotionRef.current) {
        return;
      }
      renderFrame();
      if (disposed || isWebGLContextLost(renderer)) return;
      if (isSoftware) {
        scheduleAfterDraw(renderer, registerTimer, tick);
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    // Initial render
    renderFrame();

    const startLoop = () => {
      if (disposed || document.hidden || reducedMotionRef.current) return;
      if (isSoftware) {
        scheduleAfterDraw(renderer, registerTimer, tick);
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    startLoop();

    const onVisibilityChange = () => {
      if (!document.hidden && !reducedMotionRef.current) {
        lastNow = performance.now();
        startLoop();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      disposed = true;
      renderOnceRef.current = null;
      window.cancelAnimationFrame(rafId);
      for (const id of activeTimers) {
        window.clearTimeout(id);
      }
      activeTimers.clear();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);

      sanctuary.dispose();
      lotus.dispose();
      rays.dispose();
      dust.dispose();
      envTarget.dispose();
      disposeRendererSafely(renderer);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webglCap.supported, webglCap.isSoftwareGl]);

  // Re-render static composition cleanly when Reduced Motion is toggled on
  useEffect(() => {
    if (reducedMotion) {
      renderOnceRef.current?.();
    }
  }, [reducedMotion, elapsedSec]);

  if (webglFailed) {
    return <StaticSanctuaryFallback elapsedSec={elapsedSec} reducedMotion={reducedMotion} />;
  }

  return (
    <div
      ref={mountRef}
      data-testid="welcome-webgl-canvas"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
};
