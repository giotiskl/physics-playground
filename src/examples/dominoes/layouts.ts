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
 * Circle of dominoes
 */
export function circleLayout(count: number): DominoPosition[] {
  const positions: DominoPosition[] = [];
  const radius = 4;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    positions.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      rotation: -angle - Math.PI / 2, // Face tangent to circle, toward next domino
    });
  }

  return positions;
}

/**
 * Split into two paths (Y-shape)
 */
export function splitLayout(count: number): DominoPosition[] {
  const positions: DominoPosition[] = [];
  const stemCount = Math.floor(count * 0.3);
  const branchCount = Math.floor((count - stemCount) / 2);

  // Stem (straight line going in +Z direction)
  for (let i = 0; i < stemCount; i++) {
    positions.push({
      x: 0,
      z: -4 + i * SPACING,
      rotation: -Math.PI / 2, // Face forward (+Z direction)
    });
  }

  const splitZ = -4 + stemCount * SPACING;
  const splitAngle = Math.PI / 5; // ~36 degrees spread

  // Left branch
  for (let i = 0; i < branchCount; i++) {
    const distance = (i + 1) * SPACING;
    positions.push({
      x: -Math.sin(splitAngle) * distance,
      z: splitZ + Math.cos(splitAngle) * distance,
      rotation: -Math.PI / 2 - splitAngle, // Face along left branch direction
    });
  }

  // Right branch
  for (let i = 0; i < branchCount; i++) {
    const distance = (i + 1) * SPACING;
    positions.push({
      x: Math.sin(splitAngle) * distance,
      z: splitZ + Math.cos(splitAngle) * distance,
      rotation: -Math.PI / 2 + splitAngle, // Face along right branch direction
    });
  }

  return positions;
}

// Layout registry
export const layouts = {
  line: lineLayout,
  circle: circleLayout,
  split: splitLayout,
};

export type LayoutType = keyof typeof layouts;
