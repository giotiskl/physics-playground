import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type { PhysicsBody } from '../core/types';

export interface BoxOptions {
  size?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  color?: number;
  isKinematic?: boolean; // For player-controlled objects
}

export function createBox(
  world: RAPIER.World,
  options: BoxOptions = {},
): PhysicsBody {
  const {
    size = { x: 1, y: 1, z: 1 },
    position = { x: 0, y: 1, z: 0 },
    color = 0xffffff,
    isKinematic = false,
  } = options;

  // Three.js mesh
  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(position.x, position.y, position.z);

  // Rapier rigid body
  const rigidBodyDesc = isKinematic
    ? RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        position.x,
        position.y,
        position.z,
      )
    : RAPIER.RigidBodyDesc.dynamic().setTranslation(
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
  );
  world.createCollider(colliderDesc, rigidBody);

  return { mesh, rigidBody };
}
