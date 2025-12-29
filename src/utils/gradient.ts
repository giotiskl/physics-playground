/**
 * gradient.ts
 *
 * Generates color gradients for sequential objects.
 */

import * as THREE from 'three';

export function getGradientColor(
  index: number,
  total: number,
  startColor: THREE.Color = new THREE.Color(0xff6b6b),
  endColor: THREE.Color = new THREE.Color(0x4ecdc4),
): number {
  const t = total > 1 ? index / (total - 1) : 0;
  const color = new THREE.Color().lerpColors(startColor, endColor, t);
  return color.getHex();
}
