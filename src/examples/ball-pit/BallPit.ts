import { Engine } from '../../core/Engine';
import { createBall } from '../../objects/Ball';
import { createGround } from '../../objects/Ground';
import { PALETTES, randomFromPalette } from '../../utils/colors';
import { randomRange } from '../../utils/math';

export async function initBallPit() {
  const engine = new Engine();
  await engine.initPhysics();

  // Create ground
  createGround(engine.scene, engine.world);

  // Spawn balls
  const BALL_COUNT = 80;

  for (let i = 0; i < BALL_COUNT; i++) {
    const ball = createBall(engine.world, {
      radius: randomRange(0.3, 0.6),
      position: {
        x: randomRange(-6, 6),
        y: randomRange(5, 20), // Drop from different heights
        z: randomRange(-6, 6),
      },
      color: randomFromPalette(PALETTES.candy),
      restitution: randomRange(0.5, 0.9),
    });

    engine.addPhysicsBody(ball);
  }

  // Start the engine
  engine.start();

  console.log('🎱 Ball Pit initialized with', BALL_COUNT, 'balls!');

  return engine;
}
