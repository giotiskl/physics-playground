/**
 * dominoTexture.ts
 *
 * Generates domino face textures with pips (dots).
 */

import * as THREE from 'three';

// Pip positions for each number (0-6) on a domino face
// Coordinates are relative to face center, normalized -1 to 1
const pipPatterns: Record<number, { x: number; y: number }[]> = {
  0: [],
  1: [{ x: 0, y: 0 }],
  2: [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: 0.5 },
  ],
  3: [
    { x: -0.5, y: -0.5 },
    { x: 0, y: 0 },
    { x: 0.5, y: 0.5 },
  ],
  4: [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: -0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
  ],
  5: [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: 0, y: 0 },
    { x: -0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
  ],
  6: [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: -0.5, y: 0 },
    { x: 0.5, y: 0 },
    { x: -0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
  ],
};

/**
 * Create a canvas texture for a domino face
 */
function createDominoFaceTexture(
  topPips: number,
  bottomPips: number,
  baseColor: string,
  pipColor: string = '#ffffff',
  size: number = 256,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size * 2; // Domino is taller than wide
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add subtle rounded corners effect with gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size * 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Divider line
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size * 0.15, size);
  ctx.lineTo(size * 0.85, size);
  ctx.stroke();

  // Helper to draw pips in a section
  const drawPips = (pips: number, yOffset: number) => {
    const pattern = pipPatterns[Math.min(pips, 6)];
    const pipRadius = size * 0.08;
    const areaSize = size * 0.7;

    ctx.fillStyle = pipColor;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    for (const pip of pattern) {
      const x = size / 2 + pip.x * areaSize * 0.5;
      const y = yOffset + size / 2 + pip.y * areaSize * 0.5;

      ctx.beginPath();
      ctx.arc(x, y, pipRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowColor = 'transparent';
  };

  // Draw top pips
  drawPips(topPips, 0);
  // Draw bottom pips
  drawPips(bottomPips, size);

  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Create materials for a complete domino (6 faces)
 * BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
 * Our domino: width=0.15 (X, thin), height=1.0 (Y, tall), depth=0.5 (Z, wide)
 * Wide faces are +Z/-Z, so those get the pip texture
 */
export function createDominoMaterials(
  baseColor: number,
  topPips: number,
  bottomPips: number,
): THREE.Material[] {
  const colorHex = '#' + baseColor.toString(16).padStart(6, '0');
  const faceTexture = createDominoFaceTexture(topPips, bottomPips, colorHex);

  const sideMaterial = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.4,
    metalness: 0.1,
  });

  const faceMaterial = new THREE.MeshStandardMaterial({
    map: faceTexture,
    roughness: 0.4,
    metalness: 0.1,
  });

  // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
  return [
    faceMaterial, // +X (right side - wide face, gets pips)
    faceMaterial, // -X (left side - wide face, gets pips)
    sideMaterial, // +Y (top edge)
    sideMaterial, // -Y (bottom edge)
    sideMaterial, // +Z (front thin edge)
    sideMaterial, // -Z (back thin edge)
  ];
}

/**
 * Get random domino pip values (0-6 each side)
 */
export function getRandomDominoPips(): { top: number; bottom: number } {
  return {
    top: Math.floor(Math.random() * 7),
    bottom: Math.floor(Math.random() * 7),
  };
}

/**
 * Get domino pips based on index (cycles through combinations)
 */
export function getDominoPipsByIndex(index: number): {
  top: number;
  bottom: number;
} {
  // Standard domino set has 28 pieces (0-0 through 6-6)
  const combinations: { top: number; bottom: number }[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      combinations.push({ top: i, bottom: j });
    }
  }
  return combinations[index % combinations.length];
}
