import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Horizontal plane at y=0
const intersection = new THREE.Vector3();

/**
 * Project mouse position onto horizontal plane at given Y height
 */
export function getMouseWorldPosition(
  mouseNormalized: THREE.Vector2,
  camera: THREE.Camera,
  yHeight: number = 1,
): THREE.Vector3 {
  // Update plane height
  plane.constant = -yHeight;

  // Cast ray from camera through mouse position
  raycaster.setFromCamera(mouseNormalized, camera);

  // Find intersection with plane
  raycaster.ray.intersectPlane(plane, intersection);

  return intersection.clone();
}
