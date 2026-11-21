import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ParticipatingCountry } from '../../content/countryContent';
import { buildArmillaryGlobe, type ArmillaryGlobeRig } from '../../three/earthGlobe';
import {
  createStudioEnvironment,
  detectWebGLCapability,
  disposeRendererSafely,
  isWebGLContextLost,
  scheduleAfterDraw,
} from '../../three/webglSupport';
import { cameraFocusForLatLon } from '../../utils/geodesy';
import { prefersReducedMotion } from '../../animations/gsapSetup';
import { WorldAtlasMap } from './WorldAtlasMap';

interface GlobalJourneyGlobeProps {
  countries: ReadonlyArray<ParticipatingCountry>;
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
  onHoverCountry?: (countryId: string | null) => void;
  resetSignal: number;
}

const CAMERA_DISTANCE = 7.15;
const _targetCamPos = new THREE.Vector3();

export const GlobalJourneyGlobe: React.FC<GlobalJourneyGlobeProps> = ({
  countries,
  selectedCountryId,
  onSelectCountry,
  onHoverCountry,
  resetSignal,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<ArmillaryGlobeRig | null>(null);
  const focusFnRef = useRef<((countryId: string) => void) | null>(null);
  const resetFnRef = useRef<(() => void) | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const onSelectRef = useRef(onSelectCountry);
  const onHoverRef = useRef(onHoverCountry);
  const countriesRef = useRef(countries);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelectCountry;
  }, [onSelectCountry]);

  useEffect(() => {
    onHoverRef.current = onHoverCountry;
  }, [onHoverCountry]);

  useEffect(() => {
    countriesRef.current = countries;
  }, [countries]);

  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.setActiveCountry(selectedCountryId);
    }
    if (focusFnRef.current) {
      focusFnRef.current(selectedCountryId);
    }
  }, [selectedCountryId]);

  useEffect(() => {
    if (resetSignal > 0 && resetFnRef.current) {
      resetFnRef.current();
    }
  }, [resetSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const { supported, isSoftwareGl } = detectWebGLCapability();
    if (!supported) {
      setWebglFailed(true);
      return;
    }

    const reduced = prefersReducedMotion();
    let width = container.clientWidth || 560;
    let height = container.clientHeight || 480;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.setAttribute('data-testid', 'global-journey-3d-canvas');
    container.appendChild(canvas);

    const { envTarget, shaderFailed } = createStudioEnvironment(renderer);
    if (shaderFailed || !envTarget || isWebGLContextLost(renderer)) {
      disposeRendererSafely(renderer);
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
      setWebglFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.environment = envTarget.texture;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    const initialCountry =
      countriesRef.current.find((c) => c.id === selectedCountryId) ?? countriesRef.current[0];
    const startPos = cameraFocusForLatLon(initialCountry.lat, initialCountry.lon, CAMERA_DISTANCE);
    camera.position.set(startPos.x, startPos.y, startPos.z);

    // 3-Point Orbital Rig: cool twilight sky fill, warm horizon sunrise key, cool deep rim
    const hemi = new THREE.HemisphereLight(0xb8d4f8, 0x0b1018, 1.15);
    scene.add(hemi);

    const sunKey = new THREE.DirectionalLight(0xffe0b5, 1.6);
    sunKey.position.set(5.5, 4.4, 5.2);
    scene.add(sunKey);

    const rimLight = new THREE.DirectionalLight(0x7ea6dc, 1.15);
    rimLight.position.set(-6.0, 2.5, -4.5);
    scene.add(rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const rig = buildArmillaryGlobe(countriesRef.current, maxAnisotropy);
    rig.setActiveCountry(selectedCountryId);
    scene.add(rig.root);
    rigRef.current = rig;

    const controls = new OrbitControls(camera, canvas);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.62;
    controls.target.set(0, 0, 0);

    let rafId = 0;
    const timers: number[] = [];
    let isDisposed = false;
    let renderBusy = false;
    let renderDirty = false;
    let transitionActive = false;

    const triggerFallback = () => {
      if (isDisposed) return;
      isDisposed = true;
      window.cancelAnimationFrame(rafId);
      for (const id of timers) window.clearTimeout(id);
      setWebglFailed(true);
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      triggerFallback();
    };
    canvas.addEventListener('webglcontextlost', onContextLost, false);

    renderer.debug.onShaderError = () => {
      triggerFallback();
    };

    if (!isSoftwareGl && !isWebGLContextLost(renderer)) {
      try {
        renderer.compile(scene, camera);
      } catch {
        // Fallback if shader compilation throws
      }
    }
    if (isDisposed || isWebGLContextLost(renderer)) {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      rig.dispose();
      envTarget.dispose();
      disposeRendererSafely(renderer);
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
      setWebglFailed(true);
      return;
    }

    const registerTimer = (id: number) => timers.push(id);

    const requestRender = () => {
      if (isDisposed || isWebGLContextLost(renderer)) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      rafId = window.requestAnimationFrame(() => {
        if (isDisposed || isWebGLContextLost(renderer)) return;
        renderDirty = false;

        if (transitionActive) {
          if (isSoftwareGl || reduced) {
            camera.position.copy(_targetCamPos);
            camera.lookAt(0, 0, 0);
            transitionActive = false;
          } else {
            const damp = 1 - Math.exp(-4.5 * 0.016);
            camera.position.lerp(_targetCamPos, damp);
            camera.position.setLength(CAMERA_DISTANCE);
            camera.lookAt(0, 0, 0);
            if (camera.position.distanceTo(_targetCamPos) < 0.04) {
              camera.position.copy(_targetCamPos);
              transitionActive = false;
            } else {
              renderDirty = true;
            }
          }
        }

        controls.update();
        if (isWebGLContextLost(renderer)) {
          triggerFallback();
          return;
        }
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty && !isDisposed && !isWebGLContextLost(renderer)) requestRender();
        };

        if (isSoftwareGl) {
          scheduleAfterDraw(renderer, registerTimer, done);
        } else {
          done();
        }
      });
    };

    requestRenderRef.current = requestRender;

    focusFnRef.current = (countryId: string) => {
      const target = countriesRef.current.find((c) => c.id === countryId);
      if (!target) return;
      const p = cameraFocusForLatLon(target.lat, target.lon, CAMERA_DISTANCE);
      _targetCamPos.set(p.x, p.y, p.z);
      transitionActive = true;
      requestRender();
    };

    resetFnRef.current = () => {
      const india = countriesRef.current[0];
      const p = cameraFocusForLatLon(india.lat, india.lon, CAMERA_DISTANCE);
      _targetCamPos.set(p.x, p.y, p.z);
      transitionActive = true;
      requestRender();
    };

    const onControlsStart = () => {
      transitionActive = false;
    };
    const onControlsChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('change', onControlsChange);

    // Layer-1 Raycaster for fast marker click & throttled hover inspection
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let lastHoverCheck = 0;
    let lastHoveredId: string | null = null;

    const updatePointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      return true;
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 50) return;
      lastHoverCheck = now;

      if (!updatePointer(e)) return;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(rig.interactables, false);
      const hitId = (hits[0]?.object.userData.countryId as string | undefined) ?? null;

      if (hitId !== lastHoveredId) {
        lastHoveredId = hitId;
        rig.setHoveredCountry(hitId);
        canvas.style.cursor = hitId ? 'pointer' : '';
        onHoverRef.current?.(hitId);
        requestRender();
      }
    };

    const onPointerLeave = () => {
      if (lastHoveredId !== null) {
        lastHoveredId = null;
        rig.setHoveredCountry(null);
        canvas.style.cursor = '';
        onHoverRef.current?.(null);
        requestRender();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      if (!updatePointer(e)) return;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(rig.interactables, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.countryId as string | undefined;
        if (hitId) {
          onSelectRef.current(hitId);
        }
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container || isDisposed) return;
      width = container.clientWidth || 560;
      height = container.clientHeight || 480;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    requestRender();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(rafId);
      for (const id of timers) window.clearTimeout(id);
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      rig.dispose();
      rigRef.current = null;
      requestRenderRef.current = null;
      envTarget.dispose();
      disposeRendererSafely(renderer);
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  if (webglFailed) {
    return (
      <WorldAtlasMap
        countries={countries}
        selectedCountryId={selectedCountryId}
        onSelectCountry={onSelectCountry}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      style={{ touchAction: 'pan-y' }}
      className="w-full h-[380px] sm:h-[460px] lg:h-[520px] relative cursor-grab active:cursor-grabbing"
    />
  );
};
