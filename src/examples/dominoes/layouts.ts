/**
 * layouts.ts
 *
 * Generates positions for different domino arrangements.
 */

export interface DominoPosition {
  x: number;
  z: number;
  rotation: number; // Y-axis rotation in radians
}

/**
 * Spacing between dominoes (center to center)
 * Should be less than domino height so they can knock each other over
 */
const SPACING = 0.6;

/**
 * Straight line of dominoes
 */
export function lineLayout(count: number): DominoPosition[] {
  const positions: DominoPosition[] = [];
  const startX = -((count - 1) * SPACING) / 2;

  for (let i = 0; i < count; i++) {
    positions.push({
      x: startX + i * SPACING,
      z: 0,
      rotation: 0,
    });
  }

  return positions;
}

/**
 * Curved arc of dominoes
 */
export function curveLayout(count: number): DominoPosition[] {
  const positions: DominoPosition[] = [];
  const radius = 5;
  const arcAngle = Math.PI * 0.8; // 144 degrees
  const startAngle = -arcAngle / 2;

  for (let i = 0; i < count; i++) {
    const angle = startAngle + (i / (count - 1)) * arcAngle;
    positions.push({
      x: Math.sin(angle) * radius,
      z: Math.cos(angle) * radius - radius,
      rotation: -angle, // Face along the curve
    });
  }

  return positions;
}

/**
 * Spiral pattern
 */
export function spiralLayout(count: number): DominoPosition[] {
  const positions: DominoPosition[] = [];
  const startRadius = 1;
  const growthRate = 0.15;
  const angleStep = 0.35;

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const radius = startRadius + i * growthRate;
    positions.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      rotation: angle + Math.PI / 2, // Face outward along spiral
    });
  }

  return positions;
}

/**
 * Split into two paths
 */
export function splitLayout(count: number): DominoPosition[] {
  const positions: DominoPosition[] = [];
  const stemCount = Math.floor(count * 0.3);
  const branchCount = Math.floor((count - stemCount) / 2);

  // Stem (straight line)
  for (let i = 0; i < stemCount; i++) {
    positions.push({
      x: 0,
      z: -3 + i * SPACING,
      rotation: 0,
    });
  }

  const splitZ = -3 + stemCount * SPACING;

  // Left branch
  for (let i = 0; i < branchCount; i++) {
    const angle = -Math.PI / 4; // 45 degrees left
    positions.push({
      x: -SPACING * (i + 1) * Math.sin(-angle),
      z: splitZ + SPACING * (i + 1) * Math.cos(-angle),
      rotation: angle,
    });
  }

  // Right branch
  for (let i = 0; i < branchCount; i++) {
    const angle = Math.PI / 4; // 45 degrees right
    positions.push({
      x: SPACING * (i + 1) * Math.sin(angle),
      z: splitZ + SPACING * (i + 1) * Math.cos(angle),
      rotation: angle,
    });
  }

  return positions;
}

// Layout registry
export const layouts = {
  line: lineLayout,
  curve: curveLayout,
  spiral: spiralLayout,
  split: splitLayout,
};

export type LayoutType = keyof typeof layouts;
