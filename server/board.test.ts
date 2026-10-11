import { describe, expect, it } from 'vitest';
import { Board, USER_COLORS } from './board';
import type { Stroke } from '../shared/protocol';

const stroke = (id: string, tool: Stroke['tool'] = 'free'): Stroke => ({
  id,
  tool,
  strokeColor: '#000000',
  fillColor: '#000000',
  fill: false,
  width: 2,
  points: [{ x: 0, y: 0 }],
});

describe('Board', () => {
  it('tracks users and gives them distinct colours', () => {
    const board = new Board();
    const ada = board.join('a', 'Ada');
    const bob = board.join('b', 'Bob');
    expect(board.listUsers()).toEqual([ada, bob]);
    expect(ada.color).toBe(USER_COLORS[0]);
    expect(bob.color).toBe(USER_COLORS[1]);

    board.leave('a');
    expect(board.listUsers()).toEqual([bob]);
  });

  it('renames instead of duplicating a user who joins twice', () => {
    const board = new Board();
    board.join('a', 'Ada');
    board.join('a', 'Ada L.');
    expect(board.listUsers()).toEqual([expect.objectContaining({ id: 'a', name: 'Ada L.' })]);
  });

  it('moves strokes from active to finished when they end', () => {
    const board = new Board();
    board.startStroke('a', stroke('s1'));
    board.extendStroke('a', 's1', [{ x: 1, y: 1 }]);
    expect(board.snapshot('x').activeStrokes).toHaveLength(1);

    board.endStroke('a', 's1');
    const snapshot = board.snapshot('x');
    expect(snapshot.activeStrokes).toEqual([]);
    expect(snapshot.strokes).toEqual([
      expect.objectContaining({
        id: 's1',
        userId: 'a',
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      }),
    ]);
  });

  it("does not let one user extend or end another user's stroke", () => {
    const board = new Board();
    board.startStroke('a', stroke('s1'));
    expect(board.extendStroke('b', 's1', [{ x: 1, y: 1 }])).toBe(false);
    expect(board.endStroke('b', 's1')).toBeUndefined();
  });

  it("finishes a user's strokes in progress when they leave", () => {
    const board = new Board();
    board.join('a', 'Ada');
    board.startStroke('a', stroke('s1'));
    expect(board.leave('a').map((s) => s.id)).toEqual(['s1']);
    expect(board.snapshot('x').strokes.map((s) => s.id)).toEqual(['s1']);
  });

  it('keeps only the most recent strokes', () => {
    const board = new Board(2);
    for (const id of ['s1', 's2', 's3']) {
      board.startStroke('a', stroke(id));
      board.endStroke('a', id);
    }
    expect(board.snapshot('x').strokes.map((s) => s.id)).toEqual(['s2', 's3']);
  });

  it('clears finished strokes', () => {
    const board = new Board();
    board.startStroke('a', stroke('s1'));
    board.endStroke('a', 's1');
    board.clear();
    expect(board.snapshot('x').strokes).toEqual([]);
  });
});
