import * as THREE from 'three';
import { Engine } from '../../core/Engine';
import { createBall } from '../../objects/Ball';
import { createGround } from '../../objects/Ground';
import { createPaddle } from '../../objects/Paddle';
import { PALETTES, randomFromPalette } from '../../utils/colors';
import { randomRange } from '../../utils/math';
import { getMouseWorldPosition } from '../../utils/raycaster';

export async function initBallPit() {
  const engine = new Engine();
  await engine.initPhysics();

  // Create ground
  createGround(engine.scene, engine.world);

  // Create walls to contain balls
  createWalls(engine);

  // Spawn balls
  const BALL_COUNT = 80;

  for (let i = 0; i < BALL_COUNT; i++) {
    const ball = createBall(engine.world, {
      radius: randomRange(0.3, 0.6),
      position: {
        x: randomRange(-6, 6),
        y: randomRange(5, 15),
        z: randomRange(-6, 6),
      },
      color: randomFromPalette(PALETTES.candy),
      restitution: randomRange(0.5, 0.9),
    });

    engine.addPhysicsBody(ball);
  }

  // Create paddle
  const paddle = createPaddle(engine.world, {
    size: { x: 2.5, y: 0.6, z: 2.5 },
    position: { x: 0, y: 1, z: 0 },
    color: 0xffffff,
  });
  engine.scene.add(paddle.mesh);

  // Paddle height (follows mouse on horizontal plane at this Y)
  const PADDLE_HEIGHT = 1.5;

  // Smoothed paddle position for fluid movement
  const targetPosition = new THREE.Vector3(0, PADDLE_HEIGHT, 0);
  const smoothedPosition = new THREE.Vector3(0, PADDLE_HEIGHT, 0);
  const SMOOTHING = 0.15; // Lower = smoother, higher = snappier

  // Start engine with custom update
  engine.start((_delta) => {
    // Get mouse world position
    const mouseWorld = getMouseWorldPosition(
      engine.input.mouseNormalized,
      engine.camera,
      PADDLE_HEIGHT,
    );

    // Clamp to bounds
    targetPosition.set(
      THREE.MathUtils.clamp(mouseWorld.x, -7, 7),
      PADDLE_HEIGHT,
      THREE.MathUtils.clamp(mouseWorld.z, -7, 7),
    );

    // Smooth interpolation
    smoothedPosition.lerp(targetPosition, SMOOTHING);

    // Update kinematic body position
    paddle.rigidBody.setNextKinematicTranslation({
      x: smoothedPosition.x,
      y: smoothedPosition.y,
      z: smoothedPosition.z,
    });

    // Sync mesh to physics body
    const pos = paddle.rigidBody.translation();
    paddle.mesh.position.set(pos.x, pos.y, pos.z);
  });

  console.log('🎱 Ball Pit initialized with paddle control!');

  return engine;
}

// Helper to create invisible walls
function createWalls(engine: Engine) {
  const wallThickness = 0.5;
  const wallHeight = 10;
  const arenaSize = 8;

  // Import RAPIER dynamically since it's async
  import('@dimforge/rapier3d-compat').then((RAPIER) => {
    const walls = [
      {
        x: arenaSize,
        y: wallHeight / 2,
        z: 0,
        sx: wallThickness,
        sy: wallHeight,
        sz: arenaSize,
      },
      {
        x: -arenaSize,
        y: wallHeight / 2,
        z: 0,
        sx: wallThickness,
        sy: wallHeight,
        sz: arenaSize,
      },
      {
        x: 0,
        y: wallHeight / 2,
        z: arenaSize,
        sx: arenaSize,
        sy: wallHeight,
        sz: wallThickness,
      },
      {
        x: 0,
        y: wallHeight / 2,
        z: -arenaSize,
        sx: arenaSize,
        sy: wallHeight,
        sz: wallThickness,
      },
    ];

    for (const wall of walls) {
      const desc = RAPIER.ColliderDesc.cuboid(
        wall.sx,
        wall.sy,
        wall.sz,
      ).setTranslation(wall.x, wall.y, wall.z);
      engine.world.createCollider(desc);
    }
  });
}
