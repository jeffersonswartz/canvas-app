import { describe, expect, it } from 'vitest';
import { distance, squareFromDrag } from './draw';

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
