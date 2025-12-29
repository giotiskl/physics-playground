import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { EffectComposer, BloomEffect } from 'postprocessing';
import { Input } from './Input';
import { createPostProcessing } from './PostProcessing';
import { createGradientSky } from '../objects/Sky';
import type { EngineConfig, PhysicsBody } from './types';

/**
 * Engine.ts
 *
 * Core orchestrator for Physics Playground.
 * Manages Three.js scene, Rapier physics world, rendering pipeline,
 * and the game loop. Handles post-processing with bloom effects.
 *
 * @example
 * const engine = new Engine();
 * await engine.initPhysics();
 * engine.start((delta) => { ... });
 */
export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public world!: RAPIER.World;
  public physicsBodies: PhysicsBody[] = [];
  public input: Input;
  public bloomEffect!: BloomEffect;

  private physicsTimeScale = 1.0;
  private clock = new THREE.Clock();
  private isRunning = false;
  private composer!: EffectComposer;

  constructor(config: EngineConfig = {}) {
    // Scene (no background color - sky will handle it)
    this.scene = new THREE.Scene();

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
      antialias: false,
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

    // Sky
    createGradientSky(this.scene);

    // Post-processing
    const { composer, bloomEffect } = createPostProcessing(
      this.renderer,
      this.scene,
      this.camera,
    );
    this.composer = composer;
    this.bloomEffect = bloomEffect;

    this.setupLighting();
    this.setupResizeHandler();
  }

  async initPhysics(gravity = { x: 0, y: -9.81, z: 0 }) {
    await RAPIER.init();
    this.world = new RAPIER.World(gravity);
  }

  private setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x6688cc, 0.4);
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

    // Rim light
    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.6);
    rimLight.position.set(-10, 10, -10);
    this.scene.add(rimLight);

    // Hemisphere light for sky/ground color bleed
    const hemiLight = new THREE.HemisphereLight(0x6688cc, 0x223344, 0.5);
    this.scene.add(hemiLight);
  }

  private setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setBloomIntensity(intensity: number) {
    this.bloomEffect.intensity = intensity;
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

  setPhysicsTimeScale(scale: number) {
    this.physicsTimeScale = scale;
  }

  start(onUpdate?: (delta: number) => void) {
    this.isRunning = true;

    const animate = () => {
      if (!this.isRunning) return;
      requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      this.world.timestep = (1 / 60) * this.physicsTimeScale;
      this.world.step();
      this.syncPhysics();

      onUpdate?.(delta);

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
