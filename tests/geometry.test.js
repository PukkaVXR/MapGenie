import assert from 'node:assert';
import { test } from 'node:test';
import { getPolygonBounds, getPolygonCentroid } from '../dist/test/geometry.js';

test('getPolygonBounds square', () => {
  const points = [0, 0, 10, 0, 10, 10, 0, 10];
  assert.deepStrictEqual(getPolygonBounds(points), { x: 0, y: 0, width: 10, height: 10 });
});

test('getPolygonCentroid square', () => {
  const points = [0, 0, 10, 0, 10, 10, 0, 10];
  const center = getPolygonCentroid(points);
  assert(Math.abs(center.x - 5) < 1e-6 && Math.abs(center.y - 5) < 1e-6);
});

// another polygon (triangle)
test('geometry functions triangle', () => {
  const points = [0,0, 4,0, 0,3];
  assert.deepStrictEqual(getPolygonBounds(points), { x:0, y:0, width:4, height:3 });
  const center = getPolygonCentroid(points);
  assert(Math.abs(center.x - 4/3) < 1e-6 && Math.abs(center.y - 1) < 1e-6);
});
