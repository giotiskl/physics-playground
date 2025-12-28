import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Input } from './Input';
import type { EngineConfig, PhysicsBody } from './types';

export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public world!: RAPIER.World;
  public physicsBodies: PhysicsBody[] = [];
  public input: Input;

  private clock = new THREE.Clock();
  private isRunning = false;

  constructor(config: EngineConfig = {}) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 12, 20);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: config.canvas,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Input
    this.input = new Input(this.renderer.domElement);

    if (!config.canvas) {
      document.body.appendChild(this.renderer.domElement);
    }

    this.setupLighting();
    this.setupResizeHandler();
  }

  async initPhysics(gravity = { x: 0, y: -9.81, z: 0 }) {
    await RAPIER.init();
    this.world = new RAPIER.World(gravity);
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 50;
    directional.shadow.camera.left = -20;
    directional.shadow.camera.right = 20;
    directional.shadow.camera.top = 20;
    directional.shadow.camera.bottom = -20;
    this.scene.add(directional);
  }

  private setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  addPhysicsBody(body: PhysicsBody) {
    this.scene.add(body.mesh);
    this.physicsBodies.push(body);
  }

  removePhysicsBody(body: PhysicsBody) {
    this.scene.remove(body.mesh);
    this.world.removeRigidBody(body.rigidBody);
    this.physicsBodies = this.physicsBodies.filter((b) => b !== body);
  }

  private syncPhysics() {
    for (const { mesh, rigidBody } of this.physicsBodies) {
      const position = rigidBody.translation();
      const rotation = rigidBody.rotation();

      mesh.position.set(position.x, position.y, position.z);
      mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
  }

  start(onUpdate?: (delta: number) => void) {
    this.isRunning = true;

    const animate = () => {
      if (!this.isRunning) return;
      requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      // Step physics
      this.world.step();
      this.syncPhysics();

      // Custom update callback
      onUpdate?.(delta);

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  stop() {
    this.isRunning = false;
  }

  dispose() {
    this.stop();
    this.renderer.dispose();
    this.input.dispose();
    this.physicsBodies = [];
  }
}
