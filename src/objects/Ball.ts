import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type { PhysicsBody } from '../core/types';

/**
 * Ball.ts
 *
 * Creates a physics-enabled sphere with Three.js mesh and Rapier rigid body.
 * Supports customizable radius, color, position, and bounciness.
 */

export interface BallOptions {
  radius?: number;
  position?: { x: number; y: number; z: number };
  color?: number;
  restitution?: number;
  friction?: number;
}

export function createBall(
  world: RAPIER.World,
  options: BallOptions = {},
): PhysicsBody {
  const {
    radius = 0.5,
    position = { x: 0, y: 5, z: 0 },
    color = 0xff6b6b,
    restitution = 0.7,
    friction = 0.3,
  } = options;

  // Three.js mesh
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.1,
    emissive: color,
    emissiveIntensity: 0.15,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(position.x, position.y, position.z);

  // Rapier rigid body
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
    position.x,
    position.y,
    position.z,
  );
  const rigidBody = world.createRigidBody(rigidBodyDesc);

  // Collider
  const colliderDesc = RAPIER.ColliderDesc.ball(radius)
    .setRestitution(restitution)
    .setFriction(friction);
  world.createCollider(colliderDesc, rigidBody);

  return { mesh, rigidBody };
}
