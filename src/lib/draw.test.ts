import { describe, expect, it } from 'vitest';
import { distance, squareFromDrag, strokeOutline } from './draw';
import { stepBrushSize } from './tools';

describe('squareFromDrag', () => {
  it('uses the longer drag distance as the side', () => {
    expect(squareFromDrag({ x: 10, y: 10 }, { x: 40, y: 20 })).toEqual({
      x: 10,
      y: 10,
      width: 30,
      height: 30,
    });
  });

  it('grows towards the direction of the drag', () => {
    expect(squareFromDrag({ x: 50, y: 50 }, { x: 40, y: 10 })).toEqual({
      x: 50,
      y: 50,
      width: -40,
      height: -40,
    });
  });
});

describe('distance', () => {
  it('is the euclidean distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('stepBrushSize', () => {
  it('moves between the preset sizes and stops at the ends', () => {
    expect(stepBrushSize(4, 1)).toBe(8);
    expect(stepBrushSize(4, -1)).toBe(2);
    expect(stepBrushSize(2, -1)).toBe(2);
    expect(stepBrushSize(32, 1)).toBe(32);
    expect(stepBrushSize(10, 1)).toBe(16);
  });
});

describe('strokeOutline', () => {
  const base = {
    id: 's',
    brush: 'crayon' as const,
    strokeColor: '#000000',
    fillColor: '#000000',
    fill: false,
    width: 4,
    points: [],
  };

  it('closes square outlines', () => {
    const outline = strokeOutline({ ...base, tool: 'square' }, { x: 0, y: 0 }, { x: 10, y: 4 });
    expect(outline).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 0, y: 0 },
    ]);
  });

  it('traces circles as a closed ring at the radius', () => {
    const outline = strokeOutline({ ...base, tool: 'circle' }, { x: 5, y: 5 }, { x: 25, y: 5 });
    expect(outline.length).toBeGreaterThan(24);
    for (const point of outline) expect(distance(point, { x: 5, y: 5 })).toBeCloseTo(20);
    expect(outline[0]?.x).toBeCloseTo(outline[outline.length - 1]!.x);
  });
});
