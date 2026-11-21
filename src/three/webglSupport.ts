import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface WebGLCapability {
  supported: boolean;
  isSoftwareGl: boolean;
}

export interface StudioEnvironmentResult {
  envTarget: THREE.WebGLRenderTarget | null;
  shaderFailed: boolean;
}

let cachedCapability: WebGLCapability | null = null;

/**
 * Pure predicate identifying software-emulated WebGL renderers
 * (SwiftShader, llvmpipe, softpipe, WARP) from the GPU renderer string.
 */
export function isSoftwareGlRendererString(rendererString: string): boolean {
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render|SubZero/i.test(rendererString);
}

/**
 * Probes WebGL2 availability once per session and releases the temporary
 * probe context immediately so we never accumulate leaked WebGL contexts.
 */
export function detectWebGLCapability(): WebGLCapability {
  if (typeof document === 'undefined') {
    return { supported: false, isSoftwareGl: true };
  }
  if (cachedCapability) {
    return cachedCapability;
  }
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) {
      cachedCapability = { supported: false, isSoftwareGl: true };
      return cachedCapability;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const unmasked = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '') : '';
    const masked = String(gl.getParameter(gl.RENDERER) ?? '');
    const isSoftwareGl = isSoftwareGlRendererString(`${unmasked} ${masked}`);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedCapability = { supported: true, isSoftwareGl };
    return cachedCapability;
  } catch {
    cachedCapability = { supported: false, isSoftwareGl: true };
    return cachedCapability;
  }
}

export function isWebGLContextLost(renderer: THREE.WebGLRenderer | null | undefined): boolean {
  if (!renderer) return true;
  try {
    const gl = renderer.getContext();
    return !gl || gl.isContextLost();
  } catch {
    return true;
  }
}

/**
 * Builds a procedural RoomEnvironment PMREM reflection map safely, disposing
 * intermediate PMREMGenerator & RoomEnvironment GPU objects immediately and
 * detecting broken/lost WebGL contexts or shader link failures.
 */
export function createStudioEnvironment(
  renderer: THREE.WebGLRenderer,
): StudioEnvironmentResult {
  if (isWebGLContextLost(renderer)) {
    return { envTarget: null, shaderFailed: true };
  }

  let shaderFailed = false;
  const prevOnShaderError = renderer.debug.onShaderError;
  let pmrem: THREE.PMREMGenerator | null = null;
  let roomEnv: RoomEnvironment | null = null;
  let envTarget: THREE.WebGLRenderTarget | null = null;

  renderer.debug.onShaderError = () => {
    shaderFailed = true;
  };

  try {
    pmrem = new THREE.PMREMGenerator(renderer);
    roomEnv = new RoomEnvironment();
    envTarget = pmrem.fromScene(roomEnv, 0.04);

    if (shaderFailed || isWebGLContextLost(renderer)) {
      envTarget.dispose();
      return { envTarget: null, shaderFailed: true };
    }

    return { envTarget, shaderFailed: false };
  } catch {
    if (envTarget) {
      try {
        envTarget.dispose();
      } catch {
        // ignore
      }
    }
    return { envTarget: null, shaderFailed: true };
  } finally {
    renderer.debug.onShaderError = prevOnShaderError;
    if (roomEnv) {
      try {
        roomEnv.dispose();
      } catch {
        // ignore
      }
    }
    if (pmrem) {
      try {
        pmrem.dispose();
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Disposes Three.js renderer resources and releases the underlying Chromium
 * WebGL context slot immediately so navigating between 3D pages never hits
 * the per-tab WebGL context limit.
 */
export function disposeRendererSafely(renderer: THREE.WebGLRenderer): void {
  const alreadyLost = isWebGLContextLost(renderer);
  try {
    renderer.dispose();
  } catch {
    // ignore
  }
  if (!alreadyLost) {
    try {
      renderer.forceContextLoss();
    } catch {
      // ignore
    }
  }
}

/**
 * Waits for CPU/GPU WebGL draw completion via fenceSync before scheduling the
 * next frame on software WebGL so main-thread UI clicks never starve.
 */
export function scheduleAfterDraw(
  renderer: THREE.WebGLRenderer,
  registerTimer: (id: number) => void,
  callback: () => void,
): void {
  if (isWebGLContextLost(renderer)) return;
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (!gl || typeof gl.fenceSync !== 'function') {
    const id = window.setTimeout(callback, 180);
    registerTimer(id);
    return;
  }
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  const poll = () => {
    if (isWebGLContextLost(renderer)) {
      if (sync) {
        try {
          gl.deleteSync(sync);
        } catch {
          // ignore
        }
      }
      return;
    }
    const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
    if (status === gl.UNSIGNALED) {
      const id = window.setTimeout(poll, 8);
      registerTimer(id);
    } else {
      if (sync) gl.deleteSync(sync);
      const id = window.setTimeout(callback, 180);
      registerTimer(id);
    }
  };
  const id = window.setTimeout(poll, 8);
  registerTimer(id);
}
