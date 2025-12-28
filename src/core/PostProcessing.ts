import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  SMAAEffect,
  SMAAPreset,
} from 'postprocessing';
import * as THREE from 'three';

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): { composer: EffectComposer; bloomEffect: BloomEffect } {
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
  });

  // Base render pass
  composer.addPass(new RenderPass(scene, camera));

  // Bloom - lower threshold to catch more colors
  const bloomEffect = new BloomEffect({
    intensity: 1.0,
    luminanceThreshold: 0.4, // Lower = more bloom
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    radius: 0.8,
  });

  // Anti-aliasing
  const smaaEffect = new SMAAEffect({
    preset: SMAAPreset.HIGH,
  });

  composer.addPass(new EffectPass(camera, bloomEffect, smaaEffect));

  return { composer, bloomEffect };
}
