import * as THREE from 'three';
import { Engine } from '../../core/Engine';
import { createBall } from '../../objects/Ball';
import { createGround } from '../../objects/Ground';
import { createPaddle } from '../../objects/Paddle';
import { PALETTES, randomFromPalette } from '../../utils/colors';
import { randomRange } from '../../utils/math';
import { getMouseWorldPosition } from '../../utils/raycaster';
import { createControls } from '../../ui/BallPitControls';
import { createStats } from '../../ui/Stats';
import type { PhysicsBody } from '../../core/types';

/**
 * BallPit.ts
 *
 * Ball Pit Chaos - Example #1
 *
 * An interactive physics demo where colorful balls scatter
 * as you move a paddle around with your mouse.
 *
 * Features:
 * - Dynamic ball count (10-500)
 * - Adjustable gravity and bounciness
 * - Bloom post-processing
 * - Real-time Tweakpane controls
 */

export async function initBallPit() {
  const engine = new Engine();
  await engine.initPhysics();

  // Stats
  const stats = createStats();

  // Create ground with better material
  createGround(engine.scene, engine.world, {
    size: 20,
    color: 0x12121a,
  });

  // Create walls
  createWalls(engine);

  // Ball storage for reset
  let balls: PhysicsBody[] = [];

  const { values: controlValues } = createControls(
    {
      ballCount: 200,
      gravity: -9.81,
      bounciness: 0.7,
      paddleSize: 2.5,
      bloomIntensity: 1.0,
      showStats: true,
    },
    {
      onReset: () => resetBalls(),
      onGravityChange: (value) => {
        engine.setGravity(value);
      },
      onBloomChange: (value) => {
        engine.setBloomIntensity(value);
      },
      onBallCountChange: (value) => {
        syncBallCount(value);
      },
      onPaddleSizeChange: (value) => {
        updatePaddleSize(value);
      },
    },
  );

  // Spawn balls function (now controlValues exists)
  const spawnBalls = (count: number) => {
    for (let i = 0; i < count; i++) {
      const ball = createBall(engine.world, {
        radius: randomRange(0.35, 0.55),
        position: {
          x: randomRange(-5, 5),
          y: randomRange(8, 18),
          z: randomRange(-5, 5),
        },
        color: randomFromPalette(PALETTES.candy),
        restitution: controlValues.bounciness,
      });

      engine.addPhysicsBody(ball);
      balls.push(ball);
    }
  };

  // Sync ball count to target (add or remove)
  const syncBallCount = (targetCount: number) => {
    const currentCount = balls.length;

    if (targetCount > currentCount) {
      // Add balls
      const toAdd = targetCount - currentCount;
      for (let i = 0; i < toAdd; i++) {
        const ball = createBall(engine.world, {
          radius: randomRange(0.35, 0.55),
          position: {
            x: randomRange(-5, 5),
            y: randomRange(10, 15), // Drop from above
            z: randomRange(-5, 5),
          },
          color: randomFromPalette(PALETTES.candy),
          restitution: controlValues.bounciness,
        });
        engine.addPhysicsBody(ball);
        balls.push(ball);
      }
    } else if (targetCount < currentCount) {
      // Remove balls (from the end)
      const toRemove = currentCount - targetCount;
      for (let i = 0; i < toRemove; i++) {
        const ball = balls.pop();
        if (ball) {
          engine.removePhysicsBody(ball);
        }
      }
    }
  };

  // Reset balls function
  const resetBalls = () => {
    for (const ball of balls) {
      engine.removePhysicsBody(ball);
    }
    balls = [];
    spawnBalls(controlValues.ballCount); // Use configured count
  };

  // Initial spawn (now safe to call)
  spawnBalls(200);

  // Create paddle
  const paddle = createPaddle(engine.world, {
    size: { x: 2.5, y: 0.6, z: 2.5 },
    position: { x: 0, y: 1.5, z: 0 },
    color: 0xffffff,
  });
  engine.scene.add(paddle.mesh);

  // Update paddle size dynamically
  const updatePaddleSize = (size: number) => {
    // Remove old paddle
    engine.scene.remove(paddle.mesh);
    engine.world.removeRigidBody(paddle.rigidBody);

    // Create new paddle with updated size
    const newPaddle = createPaddle(engine.world, {
      size: { x: size, y: 0.6, z: size },
      position: {
        x: smoothedPosition.x,
        y: smoothedPosition.y,
        z: smoothedPosition.z,
      },
      color: 0xffffff,
    });

    // Replace paddle reference
    paddle.mesh = newPaddle.mesh;
    paddle.rigidBody = newPaddle.rigidBody;

    engine.scene.add(paddle.mesh);
  };

  // Paddle movement
  const PADDLE_HEIGHT = 1.5;
  const targetPosition = new THREE.Vector3(0, PADDLE_HEIGHT, 0);
  const smoothedPosition = new THREE.Vector3(0, PADDLE_HEIGHT, 0);
  const SMOOTHING = 0.12;

  // Start engine
  engine.start(() => {
    stats.update();

    const mouseWorld = getMouseWorldPosition(
      engine.input.mouseNormalized,
      engine.camera,
      PADDLE_HEIGHT,
    );

    targetPosition.set(
      THREE.MathUtils.clamp(mouseWorld.x, -6, 6),
      PADDLE_HEIGHT,
      THREE.MathUtils.clamp(mouseWorld.z, -6, 6),
    );

    smoothedPosition.lerp(targetPosition, SMOOTHING);

    paddle.rigidBody.setNextKinematicTranslation({
      x: smoothedPosition.x,
      y: smoothedPosition.y,
      z: smoothedPosition.z,
    });

    const pos = paddle.rigidBody.translation();
    paddle.mesh.position.set(pos.x, pos.y, pos.z);
  });

  console.log('🎱 Ball Pit initialized with controls!');

  return engine;
}

function createWalls(engine: Engine) {
  const wallThickness = 0.5;
  const wallHeight = 12;
  const arenaSize = 8;

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
      const desc = RAPIER.ColliderDesc.cuboid(wall.sx, wall.sy, wall.sz)
        .setTranslation(wall.x, wall.y, wall.z)
        .setRestitution(0.3);
      engine.world.createCollider(desc);
    }
  });
}
