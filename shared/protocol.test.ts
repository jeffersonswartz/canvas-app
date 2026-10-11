import { describe, expect, it } from 'vitest';
import { MAX_POINTS_PER_STROKE, extendStroke, strokeSchema } from './protocol';
import type { Stroke } from './protocol';

const stroke = (overrides: Partial<Stroke> = {}): Stroke => ({
  id: 's1',
  tool: 'free',
  strokeColor: '#000000',
  fillColor: '#ffffff',
  fill: false,
  width: 4,
  points: [{ x: 0, y: 0 }],
  ...overrides,
});

describe('extendStroke', () => {
  it('appends points to freehand strokes', () => {
    const s = stroke();
    extendStroke(s, [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
    expect(s.points).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
  });

  it('keeps only the start and latest end point for shapes', () => {
    const s = stroke({ tool: 'circle' });
    extendStroke(s, [{ x: 5, y: 5 }]);
    extendStroke(s, [
      { x: 6, y: 6 },
      { x: 9, y: 9 },
    ]);
    expect(s.points).toEqual([
      { x: 0, y: 0 },
      { x: 9, y: 9 },
    ]);
  });

  it('caps the number of points in a stroke', () => {
    const s = stroke();
    const many = Array.from({ length: MAX_POINTS_PER_STROKE + 50 }, (_, i) => ({ x: i, y: i }));
    extendStroke(s, many);
    expect(s.points).toHaveLength(MAX_POINTS_PER_STROKE);
  });
});

describe('strokeSchema', () => {
  it('accepts a valid stroke', () => {
    expect(strokeSchema.safeParse(stroke()).success).toBe(true);
  });

  it.each([
    ['an unknown tool', { tool: 'spray' }],
    ['a non-hex colour', { strokeColor: 'red' }],
    ['a huge width', { width: 1000 }],
    ['no points', { points: [] }],
    ['a non-finite coordinate', { points: [{ x: Number.NaN, y: 0 }] }],
  ])('rejects %s', (_, overrides) => {
    expect(strokeSchema.safeParse({ ...stroke(), ...overrides }).success).toBe(false);
  });
});
