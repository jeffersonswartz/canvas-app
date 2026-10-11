import { describe, expect, it } from 'vitest';
import { mixColor, noise, resample, seedFrom } from './brushes';

describe('noise', () => {
  it('is repeatable and in [0, 1)', () => {
    const seed = seedFrom('stroke-1');
    const values = Array.from({ length: 200 }, (_, i) => noise(seed, i, i % 7));
    expect(values).toEqual(Array.from({ length: 200 }, (_, i) => noise(seed, i, i % 7)));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('differs between strokes', () => {
    expect(noise(seedFrom('a'), 1, 1)).not.toBe(noise(seedFrom('b'), 1, 1));
  });
});

describe('resample', () => {
  it('spaces samples evenly along a polyline, across corners', () => {
    const samples = resample(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
      4,
    );
    expect(samples.map(({ x, y }) => [x, y])).toEqual([
      [0, 0],
      [4, 0],
      [8, 0],
      [10, 2],
      [10, 6],
      [10, 10],
    ]);
    expect(samples[1]?.angle).toBe(0);
    expect(samples[4]?.angle).toBeCloseTo(Math.PI / 2);
  });

  it('keeps earlier samples unchanged when the path grows', () => {
    const short = resample(
      [
        { x: 0, y: 0 },
        { x: 9, y: 0 },
      ],
      2,
    );
    const long = resample(
      [
        { x: 0, y: 0 },
        { x: 9, y: 0 },
        { x: 9, y: 9 },
      ],
      2,
    );
    expect(long.slice(0, short.length)).toEqual(short);
  });

  it('returns the single point of a dot', () => {
    expect(resample([{ x: 3, y: 4 }], 2)).toEqual([{ x: 3, y: 4, angle: 0 }]);
  });
});

describe('mixColor', () => {
  it('mixes towards another colour', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixColor('#e5482d', '#000000', 0)).toBe('#e5482d');
    expect(mixColor('#e5482d', '#ffffff', 1)).toBe('#ffffff');
  });
});
