import type * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';

export interface PhysicsBody {
  mesh: THREE.Mesh;
  rigidBody: RAPIER.RigidBody;
}

export interface ExampleScene {
  init(): void;
  update(delta: number): void;
  dispose(): void;
}

export interface EngineConfig {
  canvas?: HTMLCanvasElement;
  gravity?: { x: number; y: number; z: number };
  debug?: boolean;
}
