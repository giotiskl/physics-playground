import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export interface GroundOptions {
  size?: number;
  color?: number;
}

export function createGround(
  scene: THREE.Scene,
  world: RAPIER.World,
  options: GroundOptions = {},
) {
  const { size = 20, color = 0x16213e } = options;

  // Three.js mesh
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Static collider (no rigid body needed)
  const colliderDesc = RAPIER.ColliderDesc.cuboid(
    size / 2,
    0.1,
    size / 2,
  ).setTranslation(0, -0.1, 0);
  world.createCollider(colliderDesc);

  return mesh;
}
