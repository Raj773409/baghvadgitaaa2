import test from 'node:test';
import assert from 'node:assert/strict';
import { isSoftwareGlRendererString, isWebGLContextLost } from './webglSupport';

test('isSoftwareGlRendererString detects software renderers accurately', () => {
  assert.equal(isSoftwareGlRendererString('Google SwiftShader (ANGLE)'), true);
  assert.equal(isSoftwareGlRendererString('llvmpipe (LLVM 15.0.7, 256 bits)'), true);
  assert.equal(isSoftwareGlRendererString('Microsoft Basic Render Driver'), true);
  assert.equal(isSoftwareGlRendererString('ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Pro, Unspecified Version)'), false);
  assert.equal(isSoftwareGlRendererString('ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0)'), false);
});

test('isWebGLContextLost treats null or context-lost renderers safely', () => {
  assert.equal(isWebGLContextLost(null), true);
  assert.equal(isWebGLContextLost(undefined), true);
  assert.equal(
    isWebGLContextLost({
      getContext: () => ({ isContextLost: () => true }),
    } as never),
    true,
  );
  assert.equal(
    isWebGLContextLost({
      getContext: () => ({ isContextLost: () => false }),
    } as never),
    false,
  );
});
