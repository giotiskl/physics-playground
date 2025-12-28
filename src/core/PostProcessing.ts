import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
} from 'postprocessing';
import * as THREE from 'three';

export interface PostProcessingOptions {
  bloom?: {
    intensity?: number;
    luminanceThreshold?: number;
    luminanceSmoothing?: number;
  };
  smaa?: boolean;
}

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: PostProcessingOptions = {},
): EffectComposer {
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
  });

  // Base render pass
  composer.addPass(new RenderPass(scene, camera));

  // Bloom
  const bloomEffect = new BloomEffect({
    intensity: options.bloom?.intensity ?? 0.5,
    luminanceThreshold: options.bloom?.luminanceThreshold ?? 0.8,
    luminanceSmoothing: options.bloom?.luminanceSmoothing ?? 0.3,
    mipmapBlur: true,
  });

  // Anti-aliasing (SMAA)
  const smaaEffect = new SMAAEffect({
    preset: SMAAPreset.HIGH,
  });

  // Tone mapping for HDR look
  const toneMappingEffect = new ToneMappingEffect({
    mode: ToneMappingMode.ACES_FILMIC,
  });

  // Combine effects into single pass (more efficient)
  composer.addPass(
    new EffectPass(camera, bloomEffect, smaaEffect, toneMappingEffect),
  );

  return composer;
}
