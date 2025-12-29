/**
 * Domino.ts
 *
 * Creates a physics-enabled domino with realistic pip textures.
 */

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type { PhysicsBody } from '../core/types';
import {
  createDominoMaterials,
  getDominoPipsByIndex,
} from '../utils/dominoTexture';

export interface DominoOptions {
  position?: { x: number; y: number; z: number };
  rotation?: number;
  color?: number;
  index?: number; // Used to determine pip pattern
}

export const DOMINO_SIZE = {
  width: 0.15,
  height: 1.0,
  depth: 0.5,
};

export function createDomino(
  world: RAPIER.World,
  options: DominoOptions = {},
): PhysicsBody {
  const {
    position = { x: 0, y: DOMINO_SIZE.height / 2, z: 0 },
    rotation = 0,
    color = 0xffffff,
    index = 0,
  } = options;

  // Get pip pattern based on index
  const pips = getDominoPipsByIndex(index);

  // Geometry
  const geometry = new THREE.BoxGeometry(
    DOMINO_SIZE.width,
    DOMINO_SIZE.height,
    DOMINO_SIZE.depth,
  );

  // Materials with pip textures
  const materials = createDominoMaterials(color, pips.top, pips.bottom);

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(position.x, position.y, position.z);
  mesh.rotation.y = rotation;

  // Physics
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setRotation({
      x: 0,
      y: Math.sin(rotation / 2),
      z: 0,
      w: Math.cos(rotation / 2),
    });

  const rigidBody = world.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(
    DOMINO_SIZE.width / 2,
    DOMINO_SIZE.height / 2,
    DOMINO_SIZE.depth / 2,
  )
    .setRestitution(0.1)
    .setFriction(0.6)
    .setDensity(1.5);

  world.createCollider(colliderDesc, rigidBody);

  return { mesh, rigidBody };
}
