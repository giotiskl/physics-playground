/**
 * Dominoes.ts
 *
 * Domino Chain - Example #2
 *
 * Click to topple dominoes and watch chain reactions.
 */

import * as THREE from 'three';
import { Engine } from '../../core/Engine';
import { createDomino, DOMINO_SIZE } from '../../objects/Domino';
import { createGround } from '../../objects/Ground';
import { layouts, type LayoutType } from './layouts';
import { getGradientColor } from '../../utils/gradient';
import { createStats } from '../../ui/Stats';
import type { PhysicsBody } from '../../core/types';
import { createDominoControls } from '../../ui/DominoControls';

const DEFAULT_COUNT = 30;
const DEFAULT_LAYOUT: LayoutType = 'line';

export async function initDominoes() {
  const engine = new Engine();
  await engine.initPhysics({ x: 0, y: -9.81, z: 0 });

  // Adjust camera
  engine.camera.position.set(0, 12, 16);
  engine.camera.lookAt(0, 0, 0);

  // Stats
  const stats = createStats();

  // Create ground
  createGround(engine.scene, engine.world, {
    size: 30,
    color: 0x12121a,
  });

  // Domino storage
  let dominoes: PhysicsBody[] = [];

  // Click handler (checks current dominoes on each click)
  const handleClick = (event: MouseEvent) => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, engine.camera);

    // Get all domino meshes
    const meshes = dominoes.map((d) => d.mesh);
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const index = meshes.indexOf(clickedMesh as THREE.Mesh);

      if (index !== -1) {
        const domino = dominoes[index];
        const rigidBody = domino.rigidBody;

        // Get domino's forward direction
        const rotation = rigidBody.rotation();
        const quat = new THREE.Quaternion(
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w,
        );
        const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);

        // Apply impulse at top of domino
        const impulseStrength = 0.5;
        const pos = rigidBody.translation();
        rigidBody.applyImpulseAtPoint(
          {
            x: forward.x * impulseStrength,
            y: 0.1,
            z: forward.z * impulseStrength,
          },
          { x: pos.x, y: pos.y + DOMINO_SIZE.height * 0.4, z: pos.z },
          true,
        );

        console.log(`🁡 Toppled domino #${index + 1}`);
      }
    }
  };

  engine.renderer.domElement.addEventListener('click', handleClick);

  // Spawn dominoes
  const spawnDominoes = (layout: LayoutType, count: number) => {
    // Clear existing
    for (const domino of dominoes) {
      engine.removePhysicsBody(domino);
    }
    dominoes = [];

    // Generate positions
    const positions = layouts[layout](count);

    // Colors
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

  // Controls (declare early so spawnDominoes can access values)
  const { values: controlValues } = createDominoControls(
    {
      dominoCount: DEFAULT_COUNT,
      layout: DEFAULT_LAYOUT,
    },
    {
      onReset: () =>
        spawnDominoes(controlValues.layout, controlValues.dominoCount),
      onLayoutChange: (layout) =>
        spawnDominoes(layout, controlValues.dominoCount),
      onCountChange: (count) => spawnDominoes(controlValues.layout, count),
    },
  );

  // Initial spawn
  spawnDominoes(DEFAULT_LAYOUT, DEFAULT_COUNT);

  // Hint text
  const hint = document.createElement('div');
  hint.className = 'domino-hint';
  hint.innerHTML = '👆 Click any domino to topple it!';
  hint.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    color: #fff;
    padding: 12px 24px;
    border-radius: 50px;
    font-size: 14px;
    z-index: 1000;
    pointer-events: none;
    animation: fadeInUp 0.5s ease;
  `;
  document.body.appendChild(hint);

  // Fade out hint after 4 seconds
  setTimeout(() => {
    hint.style.transition = 'opacity 0.5s';
    hint.style.opacity = '0';
    setTimeout(() => hint.remove(), 500);
  }, 4000);

  // Start engine
  engine.start(() => {
    stats.update();
  });

  // Cleanup on dispose
  const originalDispose = engine.dispose.bind(engine);
  engine.dispose = () => {
    engine.renderer.domElement.removeEventListener('click', handleClick);
    hint.remove();
    originalDispose();
  };

  console.log('🁡 Dominoes ready! Click to topple.');

  return engine;
}
