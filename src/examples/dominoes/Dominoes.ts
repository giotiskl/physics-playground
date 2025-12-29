/**
 * Dominoes.ts
 *
 * Domino Chain - Example #2
 *
 * Knock over dominoes and watch satisfying chain reactions.
 *
 * Features:
 * - Multiple layout patterns
 * - Click to topple first domino
 * - Gradient colors
 * - Reset functionality
 */

import * as THREE from 'three';
import { Engine } from '../../core/Engine';
import { createDomino, DOMINO_SIZE } from '../../objects/Domino';
import { createGround } from '../../objects/Ground';
import { layouts } from './layouts';
import { getGradientColor } from '../../utils/gradient';
import type { PhysicsBody } from '../../core/types';
import type { LayoutType } from './layouts';

const DOMINO_COUNT = 30;
const DEFAULT_LAYOUT: LayoutType = 'line';

export async function initDominoes() {
  const engine = new Engine();
  await engine.initPhysics({ x: 0, y: -9.81, z: 0 });

  // Adjust camera for better view
  engine.camera.position.set(0, 12, 16);
  engine.camera.lookAt(0, 0, 0);

  // Create ground
  createGround(engine.scene, engine.world, {
    size: 30,
    color: 0x12121a,
  });

  // Domino storage
  let dominoes: PhysicsBody[] = [];
  let currentLayout: LayoutType = DEFAULT_LAYOUT;

  // Spawn dominoes in a layout
  const spawnDominoes = (layout: LayoutType, count: number) => {
    // Clear existing
    for (const domino of dominoes) {
      engine.removePhysicsBody(domino);
    }
    dominoes = [];

    // Generate positions
    const positions = layouts[layout](count);

    // Create dominoes with gradient colors
    const startColor = new THREE.Color(0xff6b6b);
    const endColor = new THREE.Color(0x4ecdc4);

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const color = getGradientColor(i, positions.length, startColor, endColor);

      const domino = createDomino(engine.world, {
        position: {
          x: pos.x,
          y: DOMINO_SIZE.height / 2 + 0.01,
          z: pos.z,
        },
        rotation: pos.rotation,
        color,
        index: i,
      });

      engine.addPhysicsBody(domino);
      dominoes.push(domino);
    }

    console.log(`🁡 Spawned ${positions.length} dominoes in ${layout} layout`);
  };

  // Initial spawn
  spawnDominoes(currentLayout, DOMINO_COUNT);

  // Start engine
  engine.start();

  console.log(
    '🁡 Dominoes initialized! Click implementation coming in Phase 2.',
  );

  return engine;
}
