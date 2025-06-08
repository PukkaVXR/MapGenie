import { describe, it, expect } from 'vitest';
import { getPolygonBounds, rectsIntersect, getPolygonCentroid, getTerritoryCenter } from '../geometry';

const squarePoints = [0, 0, 10, 0, 10, 10, 0, 10];

describe('geometry utils', () => {
  it('calculates polygon bounds', () => {
    const bounds = getPolygonBounds(squarePoints);
    expect(bounds).toEqual({ x: 0, y: 0, width: 10, height: 10 });
  });

  it('checks rectangle intersection', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    const c = { x: 20, y: 20, width: 5, height: 5 };
    expect(rectsIntersect(a, b)).toBe(true);
    expect(rectsIntersect(a, c)).toBe(false);
  });

  it('calculates polygon centroid', () => {
    const centroid = getPolygonCentroid(squarePoints);
    expect(centroid.x).toBeCloseTo(5);
    expect(centroid.y).toBeCloseTo(5);
  });

  it('handles zero-area polygon centroid', () => {
    const line = [0, 0, 1, 0, 2, 0];
    const centroid = getPolygonCentroid(line);
    expect(centroid).toEqual({ x: 0, y: 0 });
  });

  it('gets territory center for rect', () => {
    const territory = { shape: { type: 'rect', x: 0, y: 0, width: 10, height: 20 } };
    const center = getTerritoryCenter(territory);
    expect(center).toEqual({ x: 5, y: 10 });
  });
});
