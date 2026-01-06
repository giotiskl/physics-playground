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
const PLACEMENT_SPACING = 0.55;

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

  // Custom placement state
  let isCtrlHeld = false;
  let isPlacing = false;
  let lastPlacementPosition: THREE.Vector3 | null = null;

  // Create invisible ground plane for raycasting
  const groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.y = 0;
  engine.scene.add(groundPlane);

  // Track if we just finished placing (to prevent click from toppling)
  let justFinishedPlacing = false;

  // Click handler (checks current dominoes on each click)
  const handleClick = (event: MouseEvent) => {
    // Skip if we just finished a placement drag
    if (justFinishedPlacing) {
      justFinishedPlacing = false;
      return;
    }

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

  // Helper: Get ground hit position from mouse event
  const getGroundHitPosition = (event: MouseEvent): THREE.Vector3 | null => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, engine.camera);

    const intersects = raycaster.intersectObject(groundPlane);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  };

  // Helper: Place a domino at position facing toward previous position
  const placeDominoAt = (position: THREE.Vector3, previousPosition: THREE.Vector3 | null) => {
    const startColor = new THREE.Color(0xff6b6b);
    const endColor = new THREE.Color(0x4ecdc4);
    const color = getGradientColor(dominoes.length, dominoes.length + 20, startColor, endColor);

    // Calculate rotation so domino's flat face is perpendicular to the path
    // and facing backward (so force is applied correctly for chain reaction)
    let rotation = 0;
    if (previousPosition) {
      rotation = Math.atan2(
        position.x - previousPosition.x,
        position.z - previousPosition.z,
      ) - Math.PI / 2; // Subtract 90 degrees to face the other way
    }

    const domino = createDomino(engine.world, {
      position: {
        x: position.x,
        y: DOMINO_SIZE.height / 2 + 0.01,
        z: position.z,
      },
      rotation,
      color,
      index: dominoes.length,
    });

    engine.addPhysicsBody(domino);
    dominoes.push(domino);
  };

  // Custom placement event handlers
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Control') {
      isCtrlHeld = true;
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Control') {
      isCtrlHeld = false;
      isPlacing = false;
      lastPlacementPosition = null;
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (!isCtrlHeld || event.button !== 0) return;

    event.preventDefault();
    isPlacing = true;

    const hitPosition = getGroundHitPosition(event);
    if (hitPosition) {
      placeDominoAt(hitPosition, lastPlacementPosition);
      lastPlacementPosition = hitPosition.clone();
    }
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (event.button === 0 && isPlacing) {
      justFinishedPlacing = true;
      isPlacing = false;
      lastPlacementPosition = null;
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isCtrlHeld || !isPlacing) return;

    const hitPosition = getGroundHitPosition(event);
    if (!hitPosition) return;

    if (lastPlacementPosition) {
      const distance = hitPosition.distanceTo(lastPlacementPosition);
      if (distance >= PLACEMENT_SPACING) {
        placeDominoAt(hitPosition, lastPlacementPosition);
        lastPlacementPosition = hitPosition.clone();
      }
    } else {
      placeDominoAt(hitPosition, null);
      lastPlacementPosition = hitPosition.clone();
    }
  };

  // Add placement event listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  engine.renderer.domElement.addEventListener('mousedown', handleMouseDown);
  engine.renderer.domElement.addEventListener('mouseup', handleMouseUp);
  engine.renderer.domElement.addEventListener('mousemove', handleMouseMove);

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
      slowMotion: false,
    },
    {
      onReset: () =>
        spawnDominoes(controlValues.layout, controlValues.dominoCount),
      onLayoutChange: (layout) => {
        spawnDominoes(layout, controlValues.dominoCount);
        adjustCameraForLayout(layout);
      },
      onCountChange: (count) => spawnDominoes(controlValues.layout, count),
      onSlowMotionChange: (enabled) => {
        engine.setPhysicsTimeScale(enabled ? 0.3 : 1.0);
      },
    },
  );

  const adjustCameraForLayout = (layout: LayoutType) => {
    switch (layout) {
      case 'line':
        engine.camera.position.set(0, 10, 18);
        break;
      case 'circle':
        engine.camera.position.set(0, 16, 8);
        break;
      case 'split':
        engine.camera.position.set(0, 12, 16);
        break;
      case 'empty':
        engine.camera.position.set(0, 14, 14);
        break;
    }
    engine.camera.lookAt(0, 0, 0);
  };

  // Initial spawn
  spawnDominoes(DEFAULT_LAYOUT, DEFAULT_COUNT);
  adjustCameraForLayout(DEFAULT_LAYOUT);

  // Hint text (topple hint - fades out)
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

  // Placement hint (persistent)
  const placementHint = document.createElement('div');
  placementHint.className = 'placement-hint';
  placementHint.textContent = 'Hold CTRL + Click & Drag to place dominoes';
  document.body.appendChild(placementHint);

  // Start engine
  engine.start(() => {
    stats.update();
  });

  // Cleanup on dispose
  const originalDispose = engine.dispose.bind(engine);
  engine.dispose = () => {
    engine.renderer.domElement.removeEventListener('click', handleClick);
    engine.renderer.domElement.removeEventListener('mousedown', handleMouseDown);
    engine.renderer.domElement.removeEventListener('mouseup', handleMouseUp);
    engine.renderer.domElement.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    hint.remove();
    placementHint.remove();
    originalDispose();
  };

  console.log('🁡 Dominoes ready! Click to topple.');

  return engine;
}
