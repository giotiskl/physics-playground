import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type { PhysicsBody } from '../core/types';

/**
 * Paddle.ts
 *
 * Creates a kinematic box that can be moved via code (mouse control).
 * Used as the player-controlled object that scatters balls.
 */

export interface PaddleOptions {
  size?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  color?: number;
}

export function createPaddle(
  world: RAPIER.World,
  options: PaddleOptions = {},
): PhysicsBody {
  const {
    size = { x: 2, y: 0.5, z: 2 },
    position = { x: 0, y: 1, z: 0 },
    color = 0xffffff,
  } = options;

  // Three.js mesh
  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.2,
    metalness: 0.5,
    emissive: color,
    emissiveIntensity: 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(position.x, position.y, position.z);

  // Kinematic rigid body (controlled by code, not physics)
  const rigidBodyDesc =
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      position.x,
      position.y,
      position.z,
    );
  const rigidBody = world.createRigidBody(rigidBodyDesc);

  // Collider
  const colliderDesc = RAPIER.ColliderDesc.cuboid(
    size.x / 2,
    size.y / 2,
    size.z / 2,
  ).setRestitution(0.8); // Bouncy paddle!
  world.createCollider(colliderDesc, rigidBody);

  return { mesh, rigidBody };
}
