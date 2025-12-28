import * as THREE from 'three';

export function createGradientSky(scene: THREE.Scene) {
  // Create a large sphere for the sky
  const skyGeometry = new THREE.SphereGeometry(100, 32, 32);

  // Custom shader for gradient
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x0d1b2a) }, // Deep blue
      bottomColor: { value: new THREE.Color(0x1b263b) }, // Slightly lighter
      horizonColor: { value: new THREE.Color(0x415a77) }, // Accent
      offset: { value: 20 },
      exponent: { value: 0.6 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 horizonColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float t = pow(max(h, 0.0), exponent);
        
        // Blend from bottom -> horizon -> top
        vec3 color = mix(bottomColor, horizonColor, smoothstep(0.0, 0.3, t));
        color = mix(color, topColor, smoothstep(0.3, 1.0, t));
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);

  return sky;
}
