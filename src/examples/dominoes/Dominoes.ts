/**
 * Dominoes.ts
 *
 * Domino Chain - Example #2
 * Placeholder - to be implemented
 */

import { Engine } from '../../core/Engine';
import { createGround } from '../../objects/Ground';

export async function initDominoes() {
  const engine = new Engine();
  await engine.initPhysics();

  createGround(engine.scene, engine.world);

  // TODO: Implement dominoes
  console.log('🁡 Dominoes example - coming soon!');

  engine.start();

  return engine;
}
