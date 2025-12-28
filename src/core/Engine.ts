import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { EffectComposer } from 'postprocessing';
import { Input } from './Input';
import { createPostProcessing } from './PostProcessing';
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
  private composer!: EffectComposer;

  constructor(config: EngineConfig = {}) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 14, 22);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // We use SMAA instead
      powerPreference: 'high-performance',
      canvas: config.canvas,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    if (!config.canvas) {
      document.body.appendChild(this.renderer.domElement);
    }

    // Input
    this.input = new Input(this.renderer.domElement);

    // Post-processing
    this.composer = createPostProcessing(
      this.renderer,
      this.scene,
      this.camera,
    );

    this.setupLighting();
    this.setupResizeHandler();
  }

  async initPhysics(gravity = { x: 0, y: -9.81, z: 0 }) {
    await RAPIER.init();
    this.world = new RAPIER.World(gravity);
  }

  private setupLighting() {
    // Ambient light (soft fill)
    const ambient = new THREE.AmbientLight(0x404060, 0.4);
    this.scene.add(ambient);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 60;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    mainLight.shadow.bias = -0.0001;
    this.scene.add(mainLight);

    // Rim light (back light for depth)
    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.5);
    rimLight.position.set(-10, 10, -10);
    this.scene.add(rimLight);

    // Ground bounce light
    const bounceLight = new THREE.HemisphereLight(0x303050, 0x101020, 0.3);
    this.scene.add(bounceLight);
  }

  private setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
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

  setGravity(y: number) {
    this.world.gravity = { x: 0, y, z: 0 };
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

      // Render with post-processing
      this.composer.render(delta);
    };

    animate();
  }

  stop() {
    this.isRunning = false;
  }

  dispose() {
    this.stop();
    this.input.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.physicsBodies = [];
  }
}
