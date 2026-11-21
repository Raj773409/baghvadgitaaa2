import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createStudioEnvironment,
  detectWebGLCapability,
  disposeRendererSafely,
  isWebGLContextLost,
  scheduleAfterDraw,
} from '../webglSupport';
import {
  computePageCurlDisplacement,
  easeInOutCubic,
  type BookCameraPreset,
} from '../../utils/book3dPhysics';

export interface SacredBookCallbacks {
  onChapterVisualSettled?: (chapterNumber: number) => void;
  onWebglContextLost?: () => void;
}

export interface SacredBookTexts {
  chapterCode: string;
  sanskritTitle: string;
  englishTitle: string;
  shlokaSanskrit: string;
  translation: string;
  reference: string;
}

function createGoldFiligreeCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Rich Royal Charcoal-Navy Leather Base
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1400);
    bgGrad.addColorStop(0, '#1B2842');
    bgGrad.addColorStop(0.5, '#131C30');
    bgGrad.addColorStop(1, '#0C1220');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1400);

    // Subtle leather grain noise lines
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 1400; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Triple Ornamental Royal Gold Border Frame
    const goldGrad = ctx.createLinearGradient(60, 60, 964, 1340);
    goldGrad.addColorStop(0, '#F0D38B');
    goldGrad.addColorStop(0.5, '#C9A04E');
    goldGrad.addColorStop(1, '#A87932');

    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 14;
    ctx.strokeRect(54, 54, 916, 1292);

    ctx.lineWidth = 3;
    ctx.strokeRect(78, 78, 868, 1244);

    ctx.strokeStyle = 'rgba(240, 211, 139, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(98, 98, 828, 1204);

    // Sacred Corner Lotus Rosettes
    const corners = [
      [112, 112],
      [912, 112],
      [112, 1288],
      [912, 1288],
    ];
    for (const [cx, cy] of corners) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = '#F0D38B';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        ctx.rotate((Math.PI * 2) / 8);
        ctx.beginPath();
        ctx.ellipse(0, -18, 7, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Center Sacred 18-Spoke Dharma Lotus Mandala Medallion
    ctx.save();
    ctx.translate(512, 620);
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 228, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 198, 0, Math.PI * 2);
    ctx.stroke();

    // 18 Lotus Petals
    for (let i = 0; i < 18; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 18);
      ctx.beginPath();
      ctx.moveTo(0, -84);
      ctx.quadraticCurveTo(28, -144, 0, -192);
      ctx.quadraticCurveTo(-28, -144, 0, -84);
      ctx.fillStyle = 'rgba(201, 160, 78, 0.16)';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 82, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(23, 35, 58, 0.9)';
    ctx.fill();
    ctx.stroke();

    // Gold Inscription
    ctx.fillStyle = '#F0D38B';
    ctx.textAlign = 'center';
    ctx.font = '600 44px serif';
    ctx.fillText('श्रीमद्भगवद्गीता', 0, 14);
    ctx.restore();

    ctx.fillStyle = '#F0D38B';
    ctx.textAlign = 'center';
    ctx.font = '500 34px Georgia, serif';
    ctx.fillText('BHAGAVAD GITA', 512, 980);

    ctx.fillStyle = '#C9A04E';
    ctx.font = '400 22px sans-serif';
    ctx.fillText('VISHWA MAHOTSAV · 2027 COLLECTOR EDITION', 512, 1030);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const paragraphs = text.split('\n');
  let y = startY;
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/);
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    y += lineHeight * 0.25;
  }
  return y;
}

function paintParchmentSpread(
  leftCanvas: HTMLCanvasElement,
  rightCanvas: HTMLCanvasElement,
  texts: SacredBookTexts,
): void {
  const drawBaseParchment = (ctx: CanvasRenderingContext2D, w: number, h: number, isLeft: boolean) => {
    const grad = ctx.createLinearGradient(isLeft ? w : 0, 0, isLeft ? 0 : w, 0);
    grad.addColorStop(0, '#DFD2B7');
    grad.addColorStop(0.12, '#F7EFE0');
    grad.addColorStop(0.85, '#FFFDF7');
    grad.addColorStop(1, '#EFE3CB');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle double gold border on page
    ctx.strokeStyle = 'rgba(168, 121, 50, 0.42)';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, w - 64, h - 64);
    ctx.strokeStyle = 'rgba(201, 160, 78, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(42, 42, w - 84, h - 84);
  };

  // Left Folio: Chapter Identity & Sacred Sanskrit Devanagari
  const lctx = leftCanvas.getContext('2d');
  if (lctx) {
    const w = leftCanvas.width;
    const h = leftCanvas.height;
    drawBaseParchment(lctx, w, h, true);

    lctx.fillStyle = '#8A693A';
    lctx.font = '600 22px sans-serif';
    lctx.textAlign = 'center';
    lctx.fillText(`ADHYAYA ${texts.chapterCode}`, w / 2, 110);

    lctx.fillStyle = '#4A251B';
    lctx.font = '600 42px serif';
    lctx.fillText(texts.sanskritTitle, w / 2, 185);

    lctx.fillStyle = '#17233A';
    lctx.font = 'italic 26px Georgia, serif';
    wrapCanvasText(lctx, texts.englishTitle, w / 2, 245, w - 130, 36);

    // Ornamental divider line
    lctx.strokeStyle = '#C9A04E';
    lctx.lineWidth = 1.5;
    lctx.beginPath();
    lctx.moveTo(w * 0.25, 360);
    lctx.lineTo(w * 0.75, 360);
    lctx.stroke();

    // Key Shloka Box
    lctx.fillStyle = '#8A693A';
    lctx.font = '600 18px sans-serif';
    lctx.fillText(texts.reference.toUpperCase(), w / 2, 420);

    lctx.fillStyle = '#2B1B12';
    lctx.font = '600 30px serif';
    wrapCanvasText(lctx, texts.shlokaSanskrit, w / 2, 490, w - 120, 48);
  }

  // Right Folio: Illuminated Translation & Contemplation
  const rctx = rightCanvas.getContext('2d');
  if (rctx) {
    const w = rightCanvas.width;
    const h = rightCanvas.height;
    drawBaseParchment(rctx, w, h, false);

    rctx.fillStyle = '#8A693A';
    rctx.font = '600 20px sans-serif';
    rctx.textAlign = 'center';
    rctx.fillText('TIMELESS WISDOM & MEANING', w / 2, 110);

    rctx.strokeStyle = 'rgba(201, 160, 78, 0.5)';
    rctx.lineWidth = 1;
    rctx.beginPath();
    rctx.moveTo(w * 0.28, 134);
    rctx.lineTo(w * 0.72, 134);
    rctx.stroke();

    rctx.fillStyle = '#171717';
    rctx.font = '400 29px Georgia, serif';
    wrapCanvasText(rctx, `“${texts.translation}”`, w / 2, 225, w - 130, 44);

    rctx.fillStyle = '#A87932';
    rctx.font = '500 18px sans-serif';
    rctx.fillText('BHAGAVAD GITA VISHWA MAHOTSAV 2027', w / 2, h - 85);
  }
}

export class SacredGitaBookEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private envRenderTarget: THREE.WebGLRenderTarget | null = null;

  private bookRoot: THREE.Group;
  private leftCoverPivot: THREE.Group;
  private rightCoverMesh: THREE.Mesh;
  private turningLeafMesh: THREE.Mesh;
  private turningLeafBasePos: Float32Array;
  private turningLeafMat: THREE.MeshStandardMaterial;

  private leftPageCanvas: HTMLCanvasElement;
  private rightPageCanvas: HTMLCanvasElement;
  private leftPageTex: THREE.CanvasTexture;
  private rightPageTex: THREE.CanvasTexture;
  private coverTex: THREE.CanvasTexture;

  private openFactor = 1; // 0 = closed, 1 = opened 180°
  private targetOpenFactor = 1;

  private turnActive = false;
  private turnDirection: 'next' | 'prev' = 'next';
  private turnProgress = 0;

  private cameraLerpTargetPos: THREE.Vector3 | null = null;
  private cameraLerpTargetLook: THREE.Vector3 | null = null;

  private isSoftwareGl = false;
  private paused = false;
  private rafId: number | null = null;
  private timers: number[] = [];
  private resizeRafId: number | null = null;
  private lastWidth = 0;
  private lastHeight = 0;
  private lastTick = performance.now();
  private disposed = false;
  private resizeObserver: ResizeObserver;
  private callbacks: SacredBookCallbacks;
  private onContextLostHandler: (e: Event) => void;
  private onVisibilityChangeHandler: () => void;

  constructor(container: HTMLElement, initialTexts: SacredBookTexts, callbacks: SacredBookCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    this.scene = new THREE.Scene();

    const width = Math.max(300, container.clientWidth || 640);
    const height = Math.max(320, container.clientHeight || 480);

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 40);
    this.camera.position.set(0, 3.35, 3.65);

    this.isSoftwareGl = detectWebGLCapability().isSoftwareGl;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.lastWidth = width;
    this.lastHeight = height;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.onContextLostHandler = (e: Event) => {
      e.preventDefault();
      this.haltOnContextFailure();
    };
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLostHandler);

    this.onVisibilityChangeHandler = () => {
      if (!document.hidden && !this.disposed && !this.paused && this.rafId === null) {
        this.lastTick = performance.now();
        this.animate();
      }
    };
    document.addEventListener('visibilitychange', this.onVisibilityChangeHandler);

    this.renderer.debug.onShaderError = () => {
      this.haltOnContextFailure();
    };

    // RoomEnvironment PBR metallic gold sheen
    const studioEnv = createStudioEnvironment(this.renderer);
    if (studioEnv.shaderFailed || isWebGLContextLost(this.renderer)) {
      this.disposed = true;
      this.envRenderTarget = studioEnv.envTarget;
      this.cleanupOnEarlyAbort();
      throw new Error('WebGL environment shader unavailable');
    }
    this.envRenderTarget = studioEnv.envTarget;
    if (this.envRenderTarget) {
      this.scene.environment = this.envRenderTarget.texture;
    }

    // Three-Point Sacred Warm Sanctuary Lighting
    const ambient = new THREE.AmbientLight(0xfff4df, 0.48);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffe7ba, 1.55);
    keyLight.position.set(3.2, 5.4, 3.8);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9fb8df, 0.68);
    rimLight.position.set(-4.0, 2.8, -3.2);
    this.scene.add(rimLight);

    const deskGlow = new THREE.PointLight(0xc9a04e, 0.85, 9);
    deskGlow.position.set(0, 1.8, 1.5);
    this.scene.add(deskGlow);

    // Subtle Royal Rosewood Pedestal beneath the Sacred Volume
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.55, 2.75, 0.16, 48),
      new THREE.MeshStandardMaterial({
        color: 0x1a1412,
        roughness: 0.42,
        metalness: 0.18,
      }),
    );
    pedestal.position.y = -0.22;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    const brassTrimRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.54, 0.022, 14, 72),
      new THREE.MeshStandardMaterial({
        color: 0xc9a04e,
        roughness: 0.22,
        metalness: 0.92,
      }),
    );
    brassTrimRing.rotation.x = Math.PI / 2;
    brassTrimRing.position.y = -0.14;
    this.scene.add(brassTrimRing);

    // Root Book Assembly
    this.bookRoot = new THREE.Group();
    this.scene.add(this.bookRoot);

    this.coverTex = createGoldFiligreeCoverTexture();

    const boardMatOuter = new THREE.MeshStandardMaterial({
      map: this.coverTex,
      roughness: 0.34,
      metalness: 0.48,
    });
    const boardMatGoldEdge = new THREE.MeshStandardMaterial({
      color: 0xc9a04e,
      roughness: 0.25,
      metalness: 0.88,
    });
    const innerLiningMat = new THREE.MeshStandardMaterial({
      color: 0x221614,
      roughness: 0.65,
      metalness: 0.15,
    });

    const boardW = 1.68;
    const boardH = 0.048;
    const boardD = 2.28;

    // Right Back Board + Page Block
    this.rightCoverMesh = new THREE.Mesh(
      new THREE.BoxGeometry(boardW, boardH, boardD),
      [boardMatGoldEdge, boardMatGoldEdge, innerLiningMat, boardMatOuter, boardMatGoldEdge, boardMatGoldEdge],
    );
    this.rightCoverMesh.position.set(boardW / 2 + 0.03, -0.05, 0);
    this.rightCoverMesh.castShadow = true;
    this.rightCoverMesh.receiveShadow = true;
    this.bookRoot.add(this.rightCoverMesh);

    const pageEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xebe0c7,
      roughness: 0.72,
      metalness: 0.05,
    });

    // Right thick page block
    const rightBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.58, 0.12, 2.16),
      pageEdgeMat,
    );
    rightBlock.position.set(boardW / 2 + 0.02, 0.032, 0);
    rightBlock.castShadow = true;
    rightBlock.receiveShadow = true;
    this.bookRoot.add(rightBlock);

    // Left thick page block (attached cleanly inside leftCoverPivot so opening/closing folds whole book)
    this.leftCoverPivot = new THREE.Group();
    this.leftCoverPivot.position.set(0, -0.04, 0);
    this.bookRoot.add(this.leftCoverPivot);

    const leftBoard = new THREE.Mesh(
      new THREE.BoxGeometry(boardW, boardH, boardD),
      [boardMatGoldEdge, boardMatGoldEdge, innerLiningMat, boardMatOuter, boardMatGoldEdge, boardMatGoldEdge],
    );
    leftBoard.position.set(-boardW / 2 - 0.03, 0, 0);
    leftBoard.castShadow = true;
    leftBoard.receiveShadow = true;
    this.leftCoverPivot.add(leftBoard);

    const leftBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.58, 0.12, 2.16),
      pageEdgeMat,
    );
    leftBlock.position.set(-boardW / 2 - 0.02, 0.082, 0);
    leftBlock.castShadow = true;
    leftBlock.receiveShadow = true;
    this.leftCoverPivot.add(leftBlock);

    // Rounded Gold-Ribbed Leather Spine
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, boardD, 18, 1, false, 0, Math.PI),
      boardMatGoldEdge,
    );
    spine.rotation.x = Math.PI / 2;
    spine.rotation.z = Math.PI;
    spine.position.set(0, -0.04, 0);
    this.bookRoot.add(spine);

    // Top Printed Parchment Spread Surfaces
    this.leftPageCanvas = document.createElement('canvas');
    this.leftPageCanvas.width = 768;
    this.leftPageCanvas.height = 1040;
    this.rightPageCanvas = document.createElement('canvas');
    this.rightPageCanvas.width = 768;
    this.rightPageCanvas.height = 1040;
    paintParchmentSpread(this.leftPageCanvas, this.rightPageCanvas, initialTexts);

    this.leftPageTex = new THREE.CanvasTexture(this.leftPageCanvas);
    this.leftPageTex.colorSpace = THREE.SRGBColorSpace;
    this.leftPageTex.anisotropy = 4;

    this.rightPageTex = new THREE.CanvasTexture(this.rightPageCanvas);
    this.rightPageTex.colorSpace = THREE.SRGBColorSpace;
    this.rightPageTex.anisotropy = 4;

    const leftSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(1.56, 2.14, 18, 2),
      new THREE.MeshStandardMaterial({
        map: this.leftPageTex,
        roughness: 0.85,
        metalness: 0.02,
      }),
    );
    leftSurface.rotation.x = -Math.PI / 2;
    leftSurface.position.set(-boardW / 2 - 0.02, 0.145, 0);
    leftSurface.receiveShadow = true;
    this.leftCoverPivot.add(leftSurface);

    const rightSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(1.56, 2.14, 18, 2),
      new THREE.MeshStandardMaterial({
        map: this.rightPageTex,
        roughness: 0.85,
        metalness: 0.02,
      }),
    );
    rightSurface.rotation.x = -Math.PI / 2;
    rightSurface.position.set(boardW / 2 + 0.02, 0.095, 0);
    rightSurface.receiveShadow = true;
    this.bookRoot.add(rightSurface);

    // Animated Subdivided Turning Parchment Leaf (hinged at X=0 spine)
    const leafGeo = new THREE.PlaneGeometry(1.54, 2.12, 26, 6);
    leafGeo.translate(1.54 / 2 + 0.03, 0, 0);
    this.turningLeafBasePos = Float32Array.from(leafGeo.attributes.position.array);

    this.turningLeafMat = new THREE.MeshStandardMaterial({
      color: 0xfbf3e2,
      roughness: 0.8,
      metalness: 0.03,
      side: THREE.DoubleSide,
    });
    this.turningLeafMesh = new THREE.Mesh(leafGeo, this.turningLeafMat);
    this.turningLeafMesh.position.set(0, 0.105, 0);
    this.turningLeafMesh.rotation.x = -Math.PI / 2;
    this.turningLeafMesh.visible = false;
    this.turningLeafMesh.castShadow = true;
    this.bookRoot.add(this.turningLeafMesh);

    // OrbitControls with restrained luxury inspection range
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2.15;
    this.controls.minPolarAngle = 0.28;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 6.2;
    this.controls.target.set(0, 0.05, 0);

    // ResizeObserver for crisp responsive framing without synchronous layout loops
    this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
    this.resizeObserver.observe(this.container);

    this.animate();
  }

  private haltOnContextFailure(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    for (const id of this.timers) window.clearTimeout(id);
    this.timers = [];
    this.callbacks.onWebglContextLost?.();
  }

  private cleanupOnEarlyAbort(): void {
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLostHandler);
    document.removeEventListener('visibilitychange', this.onVisibilityChangeHandler);
    this.envRenderTarget?.dispose();
    this.envRenderTarget = null;
    disposeRendererSafely(this.renderer);
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  public setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    if (!paused && !this.disposed && !document.hidden) {
      this.lastTick = performance.now();
      if (this.rafId !== null) {
        window.cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.animate();
    }
  }

  public updateTexts(texts: SacredBookTexts): void {
    paintParchmentSpread(this.leftPageCanvas, this.rightPageCanvas, texts);
    this.leftPageTex.needsUpdate = true;
    this.rightPageTex.needsUpdate = true;
  }

  public setBookOpen(open: boolean): void {
    this.targetOpenFactor = open ? 1 : 0;
  }

  public triggerPageTurn(direction: 'next' | 'prev', nextTexts: SacredBookTexts): void {
    if (this.targetOpenFactor < 0.5) {
      this.targetOpenFactor = 1;
    }
    this.updateTexts(nextTexts);
    this.turnDirection = direction;
    this.turnProgress = 0;
    this.turnActive = true;
    this.turningLeafMesh.visible = true;
  }

  public setCameraPreset(preset: BookCameraPreset): void {
    switch (preset) {
      case 'reading':
        this.cameraLerpTargetPos = new THREE.Vector3(0, 3.85, 1.55);
        this.cameraLerpTargetLook = new THREE.Vector3(0, 0.05, 0.08);
        break;
      case 'close':
        this.cameraLerpTargetPos = new THREE.Vector3(0.45, 2.25, 2.15);
        this.cameraLerpTargetLook = new THREE.Vector3(0, 0.08, 0.15);
        break;
      case 'spine':
        this.cameraLerpTargetPos = new THREE.Vector3(-2.6, 1.95, 2.75);
        this.cameraLerpTargetLook = new THREE.Vector3(0, 0.05, 0);
        break;
      case 'desk':
      default:
        this.cameraLerpTargetPos = new THREE.Vector3(0, 3.35, 3.65);
        this.cameraLerpTargetLook = new THREE.Vector3(0, 0.05, 0);
        break;
    }
  }

  private applyTurningLeafCurl(): void {
    const posAttr = this.turningLeafMesh.geometry.attributes.position as THREE.BufferAttribute;
    const base = this.turningLeafBasePos;
    const maxRadius = 1.57;

    for (let i = 0; i < posAttr.count; i++) {
      const bx = base[i * 3];
      const by = base[i * 3 + 1];
      const u = Math.min(1, Math.max(0, (bx - 0.03) / maxRadius));

      const { angleRad, archLift } = computePageCurlDisplacement(u, this.turnProgress, this.turnDirection);
      const radius = bx;
      const nx = Math.cos(angleRad) * radius;
      const nz = Math.sin(angleRad) * radius + archLift;
      posAttr.setXYZ(i, nx, by, nz);
    }
    posAttr.needsUpdate = true;
    this.turningLeafMesh.geometry.computeVertexNormals();
  }

  private scheduleResize(): void {
    if (this.disposed || this.resizeRafId !== null) return;
    this.resizeRafId = window.requestAnimationFrame(() => {
      this.resizeRafId = null;
      this.handleResize();
    });
  }

  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(300, Math.round(this.container.clientWidth));
    const height = Math.max(320, Math.round(this.container.clientHeight));
    if (width === this.lastWidth && height === this.lastHeight) return;
    this.lastWidth = width;
    this.lastHeight = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private animate = (): void => {
    this.rafId = null;
    if (this.disposed || this.paused || document.hidden || isWebGLContextLost(this.renderer)) {
      return;
    }

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTick) / 1000);
    this.lastTick = now;

    // Gentle book floating breathing when idle
    this.bookRoot.position.y = Math.sin(now * 0.0014) * 0.025;

    // Smooth open / close cover fold
    if (Math.abs(this.openFactor - this.targetOpenFactor) > 0.002) {
      const diff = this.targetOpenFactor - this.openFactor;
      this.openFactor += diff * Math.min(1, dt * 5.2);
      const easedOpen = easeInOutCubic(this.openFactor);
      // 1 => flat open (0 rad), 0 => folded shut (+PI * 0.99 rad onto right stack)
      this.leftCoverPivot.rotation.z = -(1 - easedOpen) * (Math.PI * 0.985);
      this.leftCoverPivot.position.y = -0.04 + (1 - easedOpen) * 0.16;
    }

    // Smooth 3D turning leaf deformation
    if (this.turnActive) {
      this.turnProgress = Math.min(1, this.turnProgress + dt * 1.45);
      this.applyTurningLeafCurl();
      if (this.turnProgress >= 1) {
        this.turnActive = false;
        this.turningLeafMesh.visible = false;
      }
    }

    // Camera preset glide
    if (this.cameraLerpTargetPos && this.cameraLerpTargetLook) {
      this.camera.position.lerp(this.cameraLerpTargetPos, Math.min(1, dt * 4.5));
      this.controls.target.lerp(this.cameraLerpTargetLook, Math.min(1, dt * 4.5));
      if (this.camera.position.distanceTo(this.cameraLerpTargetPos) < 0.03) {
        this.cameraLerpTargetPos = null;
        this.cameraLerpTargetLook = null;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    const scheduleNext = () => {
      if (this.disposed || this.paused || document.hidden || isWebGLContextLost(this.renderer)) return;
      this.rafId = window.requestAnimationFrame(this.animate);
    };

    if (this.isSoftwareGl) {
      scheduleAfterDraw(
        this.renderer,
        (id) => {
          this.timers.push(id);
          if (this.timers.length > 8) this.timers.shift();
        },
        scheduleNext,
      );
    } else {
      scheduleNext();
    }
  };

  public dispose(): void {
    this.disposed = true;
    if (this.rafId !== null) window.cancelAnimationFrame(this.rafId);
    if (this.resizeRafId !== null) window.cancelAnimationFrame(this.resizeRafId);
    for (const id of this.timers) window.clearTimeout(id);
    this.timers = [];
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLostHandler);
    document.removeEventListener('visibilitychange', this.onVisibilityChangeHandler);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.leftPageTex.dispose();
    this.rightPageTex.dispose();
    this.coverTex.dispose();
    this.envRenderTarget?.dispose();
    this.envRenderTarget = null;
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    disposeRendererSafely(this.renderer);
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
