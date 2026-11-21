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
import {
  buildBookStand,
  buildPaintedSanctum,
  buildTempleEffects,
  STAND_BOARD_TILT,
  type BookStandRig,
  type PaintedSanctumRig,
  type TempleLayer,
} from '../temple/templeEffects';
import { buildProceduralTemple, hasLicensedDeityModel } from '../temple/proceduralTemple';
import defaultSanctumArtUrl from '../../assets/images/lord_krishna_devotional_portrait_1794747546478.jpg';

/** 'painted' = devotional artwork backdrop + live 3D foreground; 'sculpted' = fully 3D temple. */
export type TempleView = 'painted' | 'sculpted';

/** The book model is authored at ~3.4 units wide; this brings it to a ~0.7 m lectern volume. */
const BOOK_SCALE = 0.2;

const DEFAULT_SANCTUM_ART_URL = defaultSanctumArtUrl;
/** Operators can drop their own Radha-Krishna sanctum artwork here to replace the default. */
export const CUSTOM_SANCTUM_ART_URL = '/assets/temple/sanctum-backdrop.jpg';

async function resolveCustomSanctumArt(): Promise<string | null> {
  try {
    const res = await fetch(CUSTOM_SANCTUM_ART_URL, { method: 'HEAD' });
    const type = res.headers.get('content-type') ?? '';
    // SPA fallback serves index.html for unknown paths, so require an actual image
    return res.ok && type.startsWith('image/') ? CUSTOM_SANCTUM_ART_URL : null;
  } catch {
    return null;
  }
}

export interface SacredBookCallbacks {
  onChapterVisualSettled?: (chapterNumber: number) => void;
  onWebglContextLost?: () => void;
  onTempleViewChange?: (view: TempleView) => void;
}

export interface SacredBookTexts {
  chapterCode: string;
  sanskritTitle: string;
  englishTitle: string;
  shlokaSanskrit: string;
  translation: string;
  reference: string;
}

/** Deterministic PRNG so grain/fibre noise is identical on every repaint. */
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const COVER_W = 1024;
const COVER_H = 1400;

/**
 * PBR channel encoding for the cover (glTF convention: G = roughness, B = metalness).
 * Leather: fully rough, non-metal. Gold leaf: low roughness, fully metallic.
 */
const PBR_LEATHER = 'rgb(0, 255, 0)';
const PBR_GOLD = 'rgb(0, 62, 255)';

/**
 * Paints the cover art. Called twice with identical geometry:
 * 'color' → albedo with embossed gold, 'pbr' → roughness/metalness mask,
 * so gold filigree reflects the environment like real gold leaf while leather stays matte.
 */
function drawCoverArt(ctx: CanvasRenderingContext2D, mode: 'color' | 'pbr'): void {
  const isPbr = mode === 'pbr';
  const W = COVER_W;
  const H = COVER_H;

  if (isPbr) {
    ctx.fillStyle = PBR_LEATHER;
    ctx.fillRect(0, 0, W, H);
  } else {
    // Deep maroon Moroccan leather
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#6A1624');
    bg.addColorStop(0.5, '#4A0E19');
    bg.addColorStop(1, '#2C0710');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Pebbled leather grain
    const rand = seededRandom(1987);
    for (let i = 0; i < 14000; i++) {
      const x = rand() * W;
      const y = rand() * H;
      const r = 0.8 + rand() * 2.2;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255, 210, 200, 0.035)' : 'rgba(0, 0, 0, 0.09)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Worn, darker edges like a hand-bound volume
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(10, 0, 4, 0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  // Gold leaf: banded metallic gradient + emboss shadow (colour pass only)
  const goldGrad = ctx.createLinearGradient(0, 0, W, H);
  goldGrad.addColorStop(0, '#FFF1B8');
  goldGrad.addColorStop(0.22, '#F7D774');
  goldGrad.addColorStop(0.42, '#C8922F');
  goldGrad.addColorStop(0.58, '#F2CC6B');
  goldGrad.addColorStop(0.78, '#B8862A');
  goldGrad.addColorStop(1, '#F7D774');
  const gold: string | CanvasGradient = isPbr ? PBR_GOLD : goldGrad;

  const withEmboss = (paint: () => void) => {
    ctx.save();
    if (!isPbr) {
      ctx.shadowColor = 'rgba(15, 2, 5, 0.75)';
      ctx.shadowOffsetX = 2.5;
      ctx.shadowOffsetY = 3;
      ctx.shadowBlur = 4;
    }
    paint();
    ctx.restore();
  };

  ctx.strokeStyle = gold;
  ctx.fillStyle = gold;

  // Triple frame
  withEmboss(() => {
    ctx.strokeStyle = gold;
    ctx.lineWidth = 16;
    ctx.strokeRect(52, 52, W - 104, H - 104);
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 80, W - 160, H - 160);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(96, 96, W - 192, H - 192);
  });

  // Corner lotus rosettes
  const corners: Array<[number, number]> = [
    [124, 124],
    [W - 124, 124],
    [124, H - 124],
    [W - 124, H - 124],
  ];
  for (const [cx, cy] of corners) {
    withEmboss(() => {
      ctx.translate(cx, cy);
      ctx.strokeStyle = gold;
      ctx.fillStyle = gold;
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        ctx.rotate((Math.PI * 2) / 8);
        ctx.beginPath();
        ctx.ellipse(0, -20, 7.5, 17, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Central sunburst + 18-petal lotus mandala (one petal per Adhyaya)
  withEmboss(() => {
    ctx.translate(W / 2, 600);
    ctx.strokeStyle = gold;
    ctx.fillStyle = gold;

    // Radiating sunburst rays
    for (let i = 0; i < 72; i++) {
      const a = (i * Math.PI * 2) / 72;
      const inner = 244;
      const outer = i % 2 === 0 ? 300 : 272;
      ctx.lineWidth = i % 2 === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.stroke();
    }

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 232, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 204, 0, Math.PI * 2);
    ctx.stroke();

    // Bead ring
    for (let i = 0; i < 54; i++) {
      const a = (i * Math.PI * 2) / 54;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 218, Math.sin(a) * 218, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.lineWidth = 2.5;
    for (let i = 0; i < 18; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 18);
      ctx.beginPath();
      ctx.moveTo(0, -88);
      ctx.quadraticCurveTo(30, -148, 0, -196);
      ctx.quadraticCurveTo(-30, -148, 0, -88);
      ctx.stroke();
      // inner vein
      ctx.beginPath();
      ctx.moveTo(0, -100);
      ctx.lineTo(0, -176);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 84, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Medallion centre: leather recess with gold Devanagari inscription
  ctx.save();
  ctx.translate(W / 2, 600);
  ctx.beginPath();
  ctx.arc(0, 0, 80, 0, Math.PI * 2);
  ctx.fillStyle = isPbr ? PBR_LEATHER : 'rgba(40, 6, 14, 0.92)';
  ctx.fill();
  ctx.restore();

  withEmboss(() => {
    ctx.fillStyle = gold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 40px "Noto Sans Devanagari", serif';
    ctx.fillText('श्रीमद्भगवद्गीता', W / 2, 602);
  });

  // Title block with flourishes
  withEmboss(() => {
    ctx.fillStyle = gold;
    ctx.strokeStyle = gold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '600 58px Georgia, "Cormorant Garamond", serif';
    ctx.fillText('BHAGAVAD GITA', W / 2, 1010);

    ctx.lineWidth = 2;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + dir * 40, 1052);
      ctx.lineTo(W / 2 + dir * 260, 1052);
      ctx.stroke();
    }
    // Centre diamond
    ctx.beginPath();
    ctx.moveTo(W / 2, 1042);
    ctx.lineTo(W / 2 + 12, 1052);
    ctx.lineTo(W / 2, 1062);
    ctx.lineTo(W / 2 - 12, 1052);
    ctx.closePath();
    ctx.fill();

    ctx.font = '500 22px Georgia, serif';
    ctx.fillText('VISHWA MAHOTSAV · 2027 COLLECTOR EDITION', W / 2, 1100);
  });
}

function createGoldFiligreeCoverTextures(): { map: THREE.CanvasTexture; pbr: THREE.CanvasTexture } {
  const make = (mode: 'color' | 'pbr') => {
    const canvas = document.createElement('canvas');
    canvas.width = COVER_W;
    canvas.height = COVER_H;
    const ctx = canvas.getContext('2d');
    if (ctx) drawCoverArt(ctx, mode);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  };
  const map = make('color');
  map.colorSpace = THREE.SRGBColorSpace;
  const pbr = make('pbr'); // linear data texture
  // The art sits on the board's underside (-Y face). When the cover folds shut it is rotated
  // 180° about the spine, which would show the art upside down; pre-rotate so it reads upright.
  for (const tex of [map, pbr]) {
    tex.center.set(0.5, 0.5);
    tex.rotation = Math.PI;
  }
  return { map, pbr };
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
    // Warm aged vellum
    ctx.fillStyle = '#F6EBD3';
    ctx.fillRect(0, 0, w, h);

    // Paper fibres / foxing specks
    const rand = seededRandom(isLeft ? 31 : 77);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = rand() > 0.55 ? 'rgba(140, 100, 40, 0.05)' : 'rgba(255, 255, 245, 0.18)';
      ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2.5, 1 + rand() * 1.2);
    }

    // Age toning toward the outer edges
    const tone = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.72);
    tone.addColorStop(0, 'rgba(255, 250, 235, 0.35)');
    tone.addColorStop(1, 'rgba(160, 112, 48, 0.22)');
    ctx.fillStyle = tone;
    ctx.fillRect(0, 0, w, h);

    // Gutter shadow where the page curves into the spine
    const gutterX = isLeft ? w : 0;
    const gutter = ctx.createLinearGradient(gutterX, 0, isLeft ? w - 110 : 110, 0);
    gutter.addColorStop(0, 'rgba(90, 60, 20, 0.32)');
    gutter.addColorStop(1, 'rgba(90, 60, 20, 0)');
    ctx.fillStyle = gutter;
    ctx.fillRect(isLeft ? w - 110 : 0, 0, 110, h);

    // Illuminated double border with gold corner lotuses
    ctx.strokeStyle = 'rgba(156, 107, 30, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(34, 34, w - 68, h - 68);
    ctx.strokeStyle = 'rgba(212, 165, 55, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(46, 46, w - 92, h - 92);

    ctx.fillStyle = '#B8862A';
    for (const [cx, cy] of [
      [40, 40],
      [w - 40, 40],
      [40, h - 40],
      [w - 40, h - 40],
    ] as Array<[number, number]>) {
      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, -8, 3.5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  /** Lotus divider: gold rule fading out from a small central lotus. */
  const drawLotusDivider = (ctx: CanvasRenderingContext2D, cx: number, y: number, halfWidth: number) => {
    for (const dir of [-1, 1]) {
      const g = ctx.createLinearGradient(cx, y, cx + dir * halfWidth, y);
      g.addColorStop(0, 'rgba(184, 134, 42, 0.95)');
      g.addColorStop(1, 'rgba(184, 134, 42, 0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + dir * 22, y);
      ctx.lineTo(cx + dir * halfWidth, y);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(cx, y);
    ctx.fillStyle = '#B8862A';
    for (const angle of [-0.7, 0, 0.7]) {
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, -9, 5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };

  // Left Folio: Chapter Identity & Sacred Sanskrit Devanagari
  const lctx = leftCanvas.getContext('2d');
  if (lctx) {
    const w = leftCanvas.width;
    const h = leftCanvas.height;
    drawBaseParchment(lctx, w, h, true);

    lctx.textAlign = 'center';
    lctx.fillStyle = '#9C6B1E';
    lctx.font = '600 21px Georgia, serif';
    lctx.fillText(`✦  ADHYAYA ${texts.chapterCode}  ✦`, w / 2, 108);

    lctx.fillStyle = '#6A1624';
    lctx.font = '700 46px "Noto Sans Devanagari", serif';
    lctx.fillText(texts.sanskritTitle, w / 2, 188);

    lctx.fillStyle = '#2A1A10';
    lctx.font = 'italic 27px Georgia, serif';
    wrapCanvasText(lctx, texts.englishTitle, w / 2, 245, w - 140, 36);

    drawLotusDivider(lctx, w / 2, 365, w * 0.3);

    // Key shloka
    lctx.fillStyle = '#9C6B1E';
    lctx.font = '600 18px Georgia, serif';
    lctx.fillText(texts.reference.toUpperCase(), w / 2, 425);

    lctx.fillStyle = '#3A1A0E';
    lctx.font = '600 31px "Noto Sans Devanagari", serif';
    const endY = wrapCanvasText(lctx, texts.shlokaSanskrit, w / 2, 495, w - 130, 50);

    drawLotusDivider(lctx, w / 2, Math.min(h - 120, endY + 30), w * 0.18);
  }

  // Right Folio: Illuminated Translation & Contemplation
  const rctx = rightCanvas.getContext('2d');
  if (rctx) {
    const w = rightCanvas.width;
    const h = rightCanvas.height;
    drawBaseParchment(rctx, w, h, false);

    rctx.textAlign = 'center';
    rctx.fillStyle = '#9C6B1E';
    rctx.font = '600 20px Georgia, serif';
    rctx.fillText('TIMELESS WISDOM & MEANING', w / 2, 108);

    drawLotusDivider(rctx, w / 2, 150, w * 0.26);

    // Illuminated opening quote mark
    rctx.fillStyle = 'rgba(184, 134, 42, 0.35)';
    rctx.font = '700 120px Georgia, serif';
    rctx.fillText('“', 110, 265);

    rctx.fillStyle = '#21160E';
    rctx.font = '400 29px Georgia, serif';
    wrapCanvasText(rctx, texts.translation, w / 2, 235, w - 150, 44);

    drawLotusDivider(rctx, w / 2, h - 140, w * 0.2);
    rctx.fillStyle = '#9C6B1E';
    rctx.font = '500 17px Georgia, serif';
    rctx.fillText('BHAGAVAD GITA VISHWA MAHOTSAV 2027', w / 2, h - 88);
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
  private leafFrontCanvas: HTMLCanvasElement;
  private leafBackCanvas: HTMLCanvasElement;
  private stagingLeftCanvas: HTMLCanvasElement;
  private stagingRightCanvas: HTMLCanvasElement;
  private leafFrontTex: THREE.CanvasTexture;
  private leafBackTex: THREE.CanvasTexture;
  private turnTargetTexts: SacredBookTexts | null = null;

  private leftPageCanvas: HTMLCanvasElement;
  private rightPageCanvas: HTMLCanvasElement;
  private leftPageTex: THREE.CanvasTexture;
  private rightPageTex: THREE.CanvasTexture;
  private coverTex: THREE.CanvasTexture;
  private coverPbrTex: THREE.CanvasTexture;
  private extraTextures: THREE.Texture[] = [];

  // Temple environment
  private stand: BookStandRig;
  private effects: TempleLayer;
  private painted: PaintedSanctumRig | null = null;
  private sculpted: TempleLayer | null = null;
  private deityArtTexture: THREE.Texture;
  private quality: 'low' | 'high' = 'high';
  private templeView: TempleView = 'painted';

  private openFactor = 1; // 0 = closed, 1 = opened 180°
  private targetOpenFactor = 1;

  private turnActive = false;
  private turnDirection: 'next' | 'prev' = 'next';
  private turnProgress = 0;

  private cameraLerpTargetPos: THREE.Vector3 | null = null;
  private cameraLerpTargetLook: THREE.Vector3 | null = null;
  private activePreset: BookCameraPreset = 'desk';

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

    // Cinematic temple lighting: warm key through the hall, cool rim from the altar side,
    // a soft "sunbeam" spot on the reading stand. Diya/aarti point lights live in templeEffects.
    const ambient = new THREE.AmbientLight(0xfff0d8, 0.32);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffe2b0, 1.35);
    keyLight.position.set(2.6, 5.2, 3.4);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    const sc = keyLight.shadow.camera;
    sc.left = -3.5;
    sc.right = 3.5;
    sc.top = 3.5;
    sc.bottom = -3.5;
    sc.near = 0.5;
    sc.far = 14;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa9bfe0, 0.45);
    rimLight.position.set(-3.5, 3.2, -4.5);
    this.scene.add(rimLight);

    const sunbeam = new THREE.SpotLight(0xffe2a8, 9, 9, Math.PI / 9, 0.7, 1.4);
    sunbeam.position.set(1.6, 4.6, 1.2);
    sunbeam.target.position.set(0, 0.95, 0);
    this.scene.add(sunbeam);
    this.scene.add(sunbeam.target);

    // Temple foreground shared by both sanctum views
    this.stand = buildBookStand();
    this.scene.add(this.stand.group);

    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.quality = this.isSoftwareGl || (typeof window !== 'undefined' && window.innerWidth < 640) ? 'low' : 'high';
    this.effects = buildTempleEffects({ quality: this.quality, reduceMotion });
    this.scene.add(this.effects.group);

    // Devotional artwork: an operator-supplied backdrop if present, else the bundled portrait
    this.deityArtTexture = new THREE.TextureLoader().load(DEFAULT_SANCTUM_ART_URL, (tex) => {
      this.painted?.fitToCamera(this.camera);
      tex.needsUpdate = true;
    });
    this.deityArtTexture.colorSpace = THREE.SRGBColorSpace;
    this.deityArtTexture.anisotropy = 8;
    this.extraTextures.push(this.deityArtTexture);
    void resolveCustomSanctumArt().then((url) => {
      if (!url || this.disposed) return;
      new THREE.TextureLoader().load(url, (tex) => {
        if (this.disposed) return tex.dispose();
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        this.extraTextures.push(tex);
        if (this.painted) {
          this.painted.group.removeFromParent();
          this.painted.dispose();
        }
        this.painted = buildPaintedSanctum(tex);
        this.painted.fitToCamera(this.camera);
        this.painted.group.visible = this.templeView === 'painted';
        this.scene.add(this.painted.group);
      });
    });
    this.painted = buildPaintedSanctum(this.deityArtTexture);
    this.scene.add(this.painted.group);

    // Root Book Assembly — rests on the carved stand at lectern scale
    this.bookRoot = new THREE.Group();
    this.bookRoot.scale.setScalar(BOOK_SCALE);
    this.stand.bookAnchor.add(this.bookRoot);

    const coverTextures = createGoldFiligreeCoverTextures();
    this.coverTex = coverTextures.map;
    this.coverPbrTex = coverTextures.pbr;

    // Leather + gold-leaf cover: the PBR mask makes only the filigree metallic
    const boardMatOuter = new THREE.MeshStandardMaterial({
      map: this.coverTex,
      roughnessMap: this.coverPbrTex,
      metalnessMap: this.coverPbrTex,
      roughness: 0.68,
      metalness: 1,
    });
    const boardMatGoldEdge = new THREE.MeshStandardMaterial({
      color: 0xe0b24a,
      roughness: 0.2,
      metalness: 1,
    });
    const innerLiningMat = new THREE.MeshStandardMaterial({
      color: 0x3a0b14,
      roughness: 0.7,
      metalness: 0.05,
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x5a1220,
      roughness: 0.55,
      metalness: 0.08,
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

    // Gilt page edges, as on fine scripture bindings
    const pageEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xdcae4a,
      roughness: 0.3,
      metalness: 0.9,
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

    // Rounded leather spine cradling the gutter from below (half-cylinder along Z, bulging -Y),
    // so from above it reads as a shadowed gutter rather than a strip standing between the pages.
    const makeSpineGeo = (radius: number, length: number) =>
      new THREE.CylinderGeometry(radius, radius, length, 24, 1, true, 0, Math.PI)
        .rotateX(Math.PI / 2)
        .rotateZ(-Math.PI / 2);
    const spineMat = leatherMat.clone();
    spineMat.side = THREE.DoubleSide;
    const spine = new THREE.Mesh(makeSpineGeo(0.1, boardD), spineMat);
    spine.position.set(0, 0.02, 0);
    spine.castShadow = true;
    this.bookRoot.add(spine);

    // Raised gold bands sit outside the leather, so they show on the spine's outer curve only
    const spineBandGeo = makeSpineGeo(0.108, 0.045);
    for (const z of [-0.98, -0.52, 0.52, 0.98]) {
      const band = new THREE.Mesh(spineBandGeo, boardMatGoldEdge);
      band.position.set(0, 0.02, z);
      this.bookRoot.add(band);
    }

    // Saffron silk ribbon marker: lies across the right folio and hangs off the foot
    // Kept inside the gutter margin (page border starts ~0.15 from the spine) so it never covers text
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xa8380f,
      roughness: 0.42,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const ribbonX = 0.11;
    const ribbonFlat = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 1.98), ribbonMat);
    ribbonFlat.rotation.x = -Math.PI / 2;
    ribbonFlat.position.set(ribbonX, 0.1, 0.09);
    ribbonFlat.receiveShadow = true;
    this.bookRoot.add(ribbonFlat);

    const ribbonTail = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.46), ribbonMat);
    ribbonTail.position.set(ribbonX, 0.1 - 0.22, 1.1);
    ribbonTail.rotation.x = -0.18;
    ribbonTail.castShadow = true;
    this.bookRoot.add(ribbonTail);

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

    // Two-sided printed leaf: the front carries the outgoing right folio, the back the incoming
    // left folio (mirrored in U because the sheet flips about the spine).
    const makePageCanvas = () => {
      const c = document.createElement('canvas');
      c.width = 768;
      c.height = 1040;
      return c;
    };
    this.leafFrontCanvas = makePageCanvas();
    this.leafBackCanvas = makePageCanvas();
    this.stagingLeftCanvas = makePageCanvas();
    this.stagingRightCanvas = makePageCanvas();
    this.leafFrontTex = new THREE.CanvasTexture(this.leafFrontCanvas);
    this.leafBackTex = new THREE.CanvasTexture(this.leafBackCanvas);
    for (const tex of [this.leafFrontTex, this.leafBackTex]) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      this.extraTextures.push(tex);
    }
    this.leafBackTex.wrapS = THREE.RepeatWrapping;
    this.leafBackTex.repeat.x = -1;
    this.leafBackTex.offset.x = 1;

    this.turningLeafMat = new THREE.MeshStandardMaterial({
      map: this.leafFrontTex,
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.FrontSide,
    });
    this.turningLeafMesh = new THREE.Mesh(leafGeo, this.turningLeafMat);
    this.turningLeafMesh.position.set(0, 0.105, 0);
    this.turningLeafMesh.rotation.x = -Math.PI / 2;
    this.turningLeafMesh.visible = false;
    this.turningLeafMesh.castShadow = true;
    const leafBack = new THREE.Mesh(
      leafGeo,
      new THREE.MeshStandardMaterial({
        map: this.leafBackTex,
        roughness: 0.82,
        metalness: 0.02,
        side: THREE.BackSide,
      }),
    );
    this.turningLeafMesh.add(leafBack);
    this.bookRoot.add(this.turningLeafMesh);

    // Restrained orbit: enough to feel the depth of the sanctum, never enough to reveal the
    // painted backdrop's edges. Panning off; zoom stays between the stand and the hall entrance.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minPolarAngle = 0.35;
    this.controls.maxPolarAngle = 1.62;
    this.controls.minDistance = 0.45;
    this.controls.maxDistance = 6;
    this.applyViewLimits();
    const initial = SacredGitaBookEngine.presetPose('desk');
    this.camera.position.copy(initial.pos);
    this.controls.target.copy(initial.look);
    this.adaptFieldOfView();
    this.painted?.fitToCamera(this.camera);

    // Licensed deity model present → the sculpted 3D sanctum becomes the default view
    void hasLicensedDeityModel().then((present) => {
      if (present && !this.disposed) this.setTempleView('sculpted');
    });

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
    // Mid-turn, the resting folios are staged by triggerPageTurn; apply the latest texts on landing.
    if (this.turnActive) {
      this.turnTargetTexts = texts;
      return;
    }
    paintParchmentSpread(this.leftPageCanvas, this.rightPageCanvas, texts);
    this.leftPageTex.needsUpdate = true;
    this.rightPageTex.needsUpdate = true;
  }

  public setBookOpen(open: boolean): void {
    this.targetOpenFactor = open ? 1 : 0;
  }

  /**
   * Physically ordered page turn. 'next': the right folio lifts (front of the leaf = outgoing
   * page), the new right folio is revealed beneath it, and the leaf's reverse lands as the new
   * left folio. 'prev' mirrors this from the left.
   */
  public triggerPageTurn(direction: 'next' | 'prev', nextTexts: SacredBookTexts): void {
    if (this.targetOpenFactor < 0.5) {
      this.targetOpenFactor = 1;
    }
    if (this.turnActive) this.finishTurn();

    paintParchmentSpread(this.stagingLeftCanvas, this.stagingRightCanvas, nextTexts);
    const copy = (dst: HTMLCanvasElement, src: HTMLCanvasElement) => dst.getContext('2d')?.drawImage(src, 0, 0);
    if (direction === 'next') {
      copy(this.leafFrontCanvas, this.rightPageCanvas);
      copy(this.leafBackCanvas, this.stagingLeftCanvas);
      copy(this.rightPageCanvas, this.stagingRightCanvas);
      this.rightPageTex.needsUpdate = true;
    } else {
      copy(this.leafBackCanvas, this.leftPageCanvas);
      copy(this.leafFrontCanvas, this.stagingRightCanvas);
      copy(this.leftPageCanvas, this.stagingLeftCanvas);
      this.leftPageTex.needsUpdate = true;
    }
    this.leafFrontTex.needsUpdate = true;
    this.leafBackTex.needsUpdate = true;

    this.turnTargetTexts = nextTexts;
    this.turnDirection = direction;
    this.turnProgress = 0;
    this.turnActive = true;
    this.applyTurningLeafCurl();
    this.turningLeafMesh.visible = true;
  }

  /** Lands the leaf: hide it and commit the final spread (including any texts that arrived mid-turn). */
  private finishTurn(): void {
    this.turnActive = false;
    this.turningLeafMesh.visible = false;
    if (this.turnTargetTexts) {
      paintParchmentSpread(this.leftPageCanvas, this.rightPageCanvas, this.turnTargetTexts);
      this.leftPageTex.needsUpdate = true;
      this.rightPageTex.needsUpdate = true;
      this.turnTargetTexts = null;
    }
  }

  /**
   * Temple camera poses. Book centre ≈ (0, 1.0, 0) on a board tilted STAND_BOARD_TILT toward
   * the viewer; altar toward -z. 'desk' = whole-temple view, 'reading' = along the page normal,
   * 'close' = three-quarter close-up, 'spine' = darshan view over the book toward the deities.
   */
  private static presetPose(preset: BookCameraPreset): { pos: THREE.Vector3; look: THREE.Vector3 } {
    switch (preset) {
      case 'reading': {
        const n = new THREE.Vector3(0, Math.cos(STAND_BOARD_TILT), Math.sin(STAND_BOARD_TILT));
        const center = new THREE.Vector3(0, 1.0, 0);
        return { pos: center.clone().addScaledVector(n, 0.88), look: center };
      }
      case 'close':
        return { pos: new THREE.Vector3(0.34, 1.33, 0.64), look: new THREE.Vector3(0, 1.0, 0) };
      case 'spine':
        return { pos: new THREE.Vector3(0, 1.5, 0.78), look: new THREE.Vector3(0, 1.55, -5) };
      case 'desk':
      default:
        return { pos: new THREE.Vector3(0, 1.62, 2.35), look: new THREE.Vector3(0, 1.2, -2.2) };
    }
  }

  /**
   * Keeps the horizontal field of view constant on portrait/narrow panels (widening the
   * vertical FOV) instead of moving the camera — moving back in a temple would leave the hall.
   */
  private adaptFieldOfView(): void {
    const BASE_VFOV = 40;
    const DESIGN_ASPECT = 1.25;
    const tanH = Math.tan(THREE.MathUtils.degToRad(BASE_VFOV / 2)) * DESIGN_ASPECT;
    const vfov =
      this.camera.aspect >= DESIGN_ASPECT
        ? BASE_VFOV
        : Math.min(66, THREE.MathUtils.radToDeg(2 * Math.atan(tanH / this.camera.aspect)));
    this.camera.fov = vfov;
    this.camera.near = 0.05;
    this.camera.updateProjectionMatrix();
  }

  /** Painted view allows only a gentle drift; the sculpted temple can be explored further. */
  private applyViewLimits(): void {
    const sculpted = this.templeView === 'sculpted';
    // The sculpted hall is open behind z≈3.5, so cap distance/azimuth to stay inside its walls.
    this.controls.minAzimuthAngle = sculpted ? -0.55 : -0.2;
    this.controls.maxAzimuthAngle = sculpted ? 0.55 : 0.2;
    this.controls.maxDistance = sculpted ? 5.3 : 4.7;
  }

  public getTempleView(): TempleView {
    return this.templeView;
  }

  /** Switches between the painted sanctum and the fully sculpted 3D temple. */
  public setTempleView(view: TempleView): void {
    if (this.disposed) return;
    this.templeView = view;
    if (view === 'sculpted' && !this.sculpted) {
      const temple: TempleLayer = buildProceduralTemple({
        renderer: this.renderer,
        quality: this.quality,
        deityFallbackTexture: this.deityArtTexture,
      });
      this.sculpted = temple;
      this.scene.add(temple.group);
    }
    if (this.sculpted) this.sculpted.group.visible = view === 'sculpted';
    if (this.painted) this.painted.group.visible = view === 'painted';
    this.applyViewLimits();
    this.callbacks.onTempleViewChange?.(view);
  }

  public setCameraPreset(preset: BookCameraPreset): void {
    this.activePreset = preset;
    const { pos, look } = SacredGitaBookEngine.presetPose(preset);
    this.cameraLerpTargetPos = pos;
    this.cameraLerpTargetLook = look;
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
    this.adaptFieldOfView();
    this.painted?.fitToCamera(this.camera);
  }

  private animate = (): void => {
    this.rafId = null;
    if (this.disposed || this.paused || document.hidden || isWebGLContextLost(this.renderer)) {
      return;
    }

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTick) / 1000);
    this.lastTick = now;

    // Living temple: flames, aarti, incense, light shafts, petals, drapes/bells
    const t = now / 1000;
    this.effects.update(t, dt);
    if (this.sculpted?.group.visible) this.sculpted.update(t, dt);

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
        this.finishTurn();
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
    this.coverPbrTex.dispose();
    this.stand.dispose();
    this.effects.dispose();
    this.painted?.dispose();
    this.sculpted?.dispose();
    for (const tex of this.extraTextures) tex.dispose();
    this.extraTextures = [];
    this.envRenderTarget?.dispose();
    this.envRenderTarget = null;
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
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
