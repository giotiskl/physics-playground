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
const TOUCH_HOLD_DURATION = 1000; // 1 second hold to enter placement mode
const MIN_ZOOM = 8;
const MAX_ZOOM = 70;

export async function initDominoes() {
  const engine = new Engine();
  await engine.initPhysics({ x: 0, y: -9.81, z: 0 });

  // Adjust camera (start max zoomed out on mobile)
  const isMobileDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isMobileDevice) {
    // Start at MAX_ZOOM distance on mobile
    const mobileDistance = MAX_ZOOM - 30;
    const angle = Math.atan2(16, 12); // Preserve camera angle ratio
    engine.camera.position.set(
      0,
      Math.sin(angle) * mobileDistance,
      Math.cos(angle) * mobileDistance,
    );
  } else {
    engine.camera.position.set(0, 12, 16);
  }
  engine.camera.lookAt(0, 0, 0);

  // Stats (hidden on mobile)
  const stats = createStats({ showOnMobile: false });

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

  // Mobile touch state
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  let touchStartTime = 0;
  let touchHoldTimer: ReturnType<typeof setTimeout> | null = null;
  let isTouchPlacing = false;
  let lastTouchPosition: THREE.Vector3 | null = null;
  let initialPinchDistance = 0;
  let holdProgressInterval: ReturnType<typeof setInterval> | null = null;
  let holdProgressShowTimer: ReturnType<typeof setTimeout> | null = null;

  // Create hold progress UI element (for mobile)
  const holdProgress = document.createElement('div');
  holdProgress.className = 'hold-progress';
  holdProgress.innerHTML = `
    <div class="hold-progress-bar"><div class="hold-progress-fill"></div></div>
    <div class="hold-progress-text">Hold...</div>
  `;
  document.body.appendChild(holdProgress);
  const progressFill = holdProgress.querySelector(
    '.hold-progress-fill',
  ) as HTMLElement;
  const progressText = holdProgress.querySelector(
    '.hold-progress-text',
  ) as HTMLElement;

  // Helper: Show hold progress at position (with small delay to avoid flicker)
  const showHoldProgress = (x: number, y: number) => {
    // Wait 150ms before showing to avoid flicker on accidental taps
    holdProgressShowTimer = setTimeout(() => {
      holdProgress.style.left = `${x}px`;
      holdProgress.style.top = `${y}px`;
      holdProgress.classList.remove('complete');
      holdProgress.classList.add('visible');
      progressFill.style.width = '0%';
      progressText.textContent = 'Hold...';

      let progress = 0;
      // Start progress from where we are (150ms into the hold)
      const startProgress = (150 / TOUCH_HOLD_DURATION) * 100;
      progress = startProgress;
      progressFill.style.width = `${progress}%`;

      holdProgressInterval = setInterval(() => {
        progress += 5;
        progressFill.style.width = `${Math.min(progress, 100)}%`;
        if (progress >= 100) {
          if (holdProgressInterval) {
            clearInterval(holdProgressInterval);
            holdProgressInterval = null;
          }
        }
      }, TOUCH_HOLD_DURATION / 20);
    }, 150);
  };

  // Helper: Complete hold progress with sparkle
  const completeHoldProgress = () => {
    if (holdProgressInterval) {
      clearInterval(holdProgressInterval);
      holdProgressInterval = null;
    }
    progressFill.style.width = '100%';
    holdProgress.classList.add('complete');
    progressText.textContent = 'Drag to place!';

    // Hide after a short delay
    setTimeout(() => {
      holdProgress.classList.remove('visible', 'complete');
    }, 1500);
  };

  // Helper: Hide hold progress
  const hideHoldProgress = () => {
    if (holdProgressShowTimer) {
      clearTimeout(holdProgressShowTimer);
      holdProgressShowTimer = null;
    }
    if (holdProgressInterval) {
      clearInterval(holdProgressInterval);
      holdProgressInterval = null;
    }
    holdProgress.classList.remove('visible', 'complete');
  };

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

  // Helper: Get ground hit position from screen coordinates
  const getGroundHitFromCoords = (
    clientX: number,
    clientY: number,
  ): THREE.Vector3 | null => {
    const mouse = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, engine.camera);

    const intersects = raycaster.intersectObject(groundPlane);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  };

  // Helper: Get ground hit position from mouse event
  const getGroundHitPosition = (event: MouseEvent): THREE.Vector3 | null => {
    return getGroundHitFromCoords(event.clientX, event.clientY);
  };

  // Helper: Topple domino at screen coordinates
  const toppleDominoAt = (clientX: number, clientY: number): boolean => {
    const mouse = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, engine.camera);

    const meshes = dominoes.map((d) => d.mesh);
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const index = meshes.indexOf(clickedMesh as THREE.Mesh);

      if (index !== -1) {
        const domino = dominoes[index];
        const rigidBody = domino.rigidBody;

        const rotation = rigidBody.rotation();
        const quat = new THREE.Quaternion(
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w,
        );
        const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);

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

        return true;
      }
    }
    return false;
  };

  // Helper: Zoom camera
  const zoomCamera = (delta: number) => {
    const direction = new THREE.Vector3();
    engine.camera.getWorldDirection(direction);

    const distance = engine.camera.position.length();
    const newDistance = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, distance - delta),
    );

    const normalized = engine.camera.position.clone().normalize();
    engine.camera.position.copy(normalized.multiplyScalar(newDistance));
  };

  // Helper: Get pinch distance
  const getPinchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Helper: Place a domino at position facing toward previous position
  const placeDominoAt = (
    position: THREE.Vector3,
    previousPosition: THREE.Vector3 | null,
  ) => {
    const startColor = new THREE.Color(0xff6b6b);
    const endColor = new THREE.Color(0x4ecdc4);
    const color = getGradientColor(
      dominoes.length,
      dominoes.length + 20,
      startColor,
      endColor,
    );

    // Calculate rotation so domino's flat face is perpendicular to the path
    // and facing backward (so force is applied correctly for chain reaction)
    let rotation = 0;
    if (previousPosition) {
      rotation =
        Math.atan2(
          position.x - previousPosition.x,
          position.z - previousPosition.z,
        ) -
        Math.PI / 2; // Subtract 90 degrees to face the other way
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

  // Touch event handlers for mobile
  const handleTouchStart = (event: TouchEvent) => {
    // Pinch zoom with two fingers
    if (event.touches.length === 2) {
      event.preventDefault();
      initialPinchDistance = getPinchDistance(event.touches);
      // Cancel any pending hold timer and hide progress
      if (touchHoldTimer) {
        clearTimeout(touchHoldTimer);
        touchHoldTimer = null;
        hideHoldProgress();
      }
      return;
    }

    // Single touch
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchStartTime = Date.now();

      // Show hold progress indicator
      showHoldProgress(touch.clientX, touch.clientY);

      // Start hold timer for placement mode
      touchHoldTimer = setTimeout(() => {
        isTouchPlacing = true;
        completeHoldProgress();
        const hitPosition = getGroundHitFromCoords(
          touch.clientX,
          touch.clientY,
        );
        if (hitPosition) {
          placeDominoAt(hitPosition, lastTouchPosition);
          lastTouchPosition = hitPosition.clone();
        }
      }, TOUCH_HOLD_DURATION);
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    // Pinch zoom
    if (event.touches.length === 2 && initialPinchDistance > 0) {
      event.preventDefault();
      const currentDistance = getPinchDistance(event.touches);
      const delta = (currentDistance - initialPinchDistance) * 0.05;
      zoomCamera(delta);
      initialPinchDistance = currentDistance;
      return;
    }

    // Single touch movement
    if (event.touches.length === 1) {
      const touch = event.touches[0];

      // If still waiting for hold, cancel if moved too much
      if (touchHoldTimer && !isTouchPlacing) {
        clearTimeout(touchHoldTimer);
        touchHoldTimer = null;
        hideHoldProgress();
      }

      // If in placement mode, place dominoes along path
      if (isTouchPlacing) {
        event.preventDefault();
        const hitPosition = getGroundHitFromCoords(
          touch.clientX,
          touch.clientY,
        );
        if (hitPosition && lastTouchPosition) {
          const distance = hitPosition.distanceTo(lastTouchPosition);
          if (distance >= PLACEMENT_SPACING) {
            placeDominoAt(hitPosition, lastTouchPosition);
            lastTouchPosition = hitPosition.clone();
          }
        }
      }
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    // Clear hold timer and hide progress
    if (touchHoldTimer) {
      clearTimeout(touchHoldTimer);
      touchHoldTimer = null;
      hideHoldProgress();
    }

    // Reset pinch state
    if (event.touches.length < 2) {
      initialPinchDistance = 0;
    }

    // If was placing, end placement
    if (isTouchPlacing) {
      isTouchPlacing = false;
      lastTouchPosition = null;
      return;
    }

    // If short tap (less than hold duration), topple domino
    const touchDuration = Date.now() - touchStartTime;
    if (
      touchDuration < TOUCH_HOLD_DURATION &&
      event.changedTouches.length > 0
    ) {
      const touch = event.changedTouches[0];
      toppleDominoAt(touch.clientX, touch.clientY);
    }

    touchStartTime = 0;
  };

  // Scroll wheel zoom for desktop
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const delta = -event.deltaY * 0.01;
    zoomCamera(delta);
  };

  // Add touch and wheel event listeners
  engine.renderer.domElement.addEventListener('touchstart', handleTouchStart, {
    passive: false,
  });
  engine.renderer.domElement.addEventListener('touchmove', handleTouchMove, {
    passive: false,
  });
  engine.renderer.domElement.addEventListener('touchend', handleTouchEnd);
  engine.renderer.domElement.addEventListener('wheel', handleWheel, {
    passive: false,
  });

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
  const { pane, values: controlValues } = createDominoControls(
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
  hint.innerHTML = isMobile
    ? '👆 Tap any domino to topple it!'
    : '👆 Click any domino to topple it!';
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

  // Placement hint (persistent, shown after topple hint fades)
  const placementHint = document.createElement('div');
  placementHint.className = 'placement-hint';
  placementHint.textContent = isMobile
    ? 'Hold 1s + Drag to place dominoes • Pinch to zoom'
    : 'CTRL + Drag to place dominoes • Scroll to zoom';
  placementHint.style.opacity = '0';
  document.body.appendChild(placementHint);

  // Fade out topple hint after 4 seconds, then show placement hint
  setTimeout(() => {
    hint.style.transition = 'opacity 0.5s';
    hint.style.opacity = '0';
    setTimeout(() => {
      hint.remove();
      // Fade in placement hint after topple hint is removed
      placementHint.style.transition = 'opacity 0.5s';
      placementHint.style.opacity = '1';
    }, 500);
  }, 4000);

  // Start engine
  engine.start(() => {
    stats.update();
  });

  // Cleanup on dispose
  const originalDispose = engine.dispose.bind(engine);
  engine.dispose = () => {
    engine.renderer.domElement.removeEventListener('click', handleClick);
    engine.renderer.domElement.removeEventListener(
      'mousedown',
      handleMouseDown,
    );
    engine.renderer.domElement.removeEventListener('mouseup', handleMouseUp);
    engine.renderer.domElement.removeEventListener(
      'mousemove',
      handleMouseMove,
    );
    engine.renderer.domElement.removeEventListener(
      'touchstart',
      handleTouchStart,
    );
    engine.renderer.domElement.removeEventListener(
      'touchmove',
      handleTouchMove,
    );
    engine.renderer.domElement.removeEventListener('touchend', handleTouchEnd);
    engine.renderer.domElement.removeEventListener('wheel', handleWheel);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    if (touchHoldTimer) clearTimeout(touchHoldTimer);
    if (holdProgressShowTimer) clearTimeout(holdProgressShowTimer);
    if (holdProgressInterval) clearInterval(holdProgressInterval);
    hint.remove();
    placementHint.remove();
    holdProgress.remove();
    pane.dispose();
    originalDispose();
  };

  console.log('🁡 Dominoes ready! Click to topple.');

  return engine;
}
