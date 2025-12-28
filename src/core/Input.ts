import * as THREE from 'three';

export class Input {
  public mouse: THREE.Vector2 = new THREE.Vector2();
  public mouseNormalized: THREE.Vector2 = new THREE.Vector2();
  public isPointerDown = false;

  private domElement: HTMLElement;

  constructor(domElement: HTMLElement = document.body) {
    this.domElement = domElement;
    this.setupListeners();
  }

  private setupListeners() {
    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerMove = (event: PointerEvent) => {
    // Raw pixel coordinates
    this.mouse.set(event.clientX, event.clientY);

    // Normalized device coordinates (-1 to +1)
    this.mouseNormalized.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );
  };

  private onPointerDown = () => {
    this.isPointerDown = true;
  };

  private onPointerUp = () => {
    this.isPointerDown = false;
  };

  dispose() {
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
  }
}
