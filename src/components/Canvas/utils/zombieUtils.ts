import { BASE_OFFSET, MAX_OFFSET, OFFSET_STEP } from '../constants/sizes';

// Get arrow sizes based on stroke width
export function getArrowSizes(strokeWidth: number) {
  const pointerLength = Math.max(16, strokeWidth * 3);
  const pointerWidth = Math.max(12, strokeWidth * 2.2);
  const outlineStrokeWidth = strokeWidth + 2;
  return { pointerLength, pointerWidth, outlineStrokeWidth };
}

// Improved control point calculation for visible curve
export function getCubicControlPoints(x1: number, y1: number, x2: number, y2: number, curvature: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;
  // Offset c1 closer to start, c2 closer to end
  const c1 = [x1 + (mx - x1) * 0.7 + perpX * curvature, y1 + (my - y1) * 0.7 + perpY * curvature];
  const c2 = [x2 + (mx - x2) * 0.7 + perpX * curvature, y2 + (my - y2) * 0.7 + perpY * curvature];
  return [c1, c2];
}

// Helper functions for arrow generation
export const pairKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
export const arrowKey = (from: number, to: number, color: string) => `${from}->${to}|${color}`;

// Calculate arrow offset
export function calculateArrowOffset(offsetIndex: number): number {
  const offsetMag = Math.min(BASE_OFFSET + Math.abs(offsetIndex) * OFFSET_STEP, MAX_OFFSET) * Math.sign(offsetIndex);
  return offsetMag;
}