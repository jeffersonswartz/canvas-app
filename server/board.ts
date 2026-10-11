import { extendStroke } from '../shared/protocol.js';
import type { BoardSnapshot, OwnedStroke, Point, Stroke, User } from '../shared/protocol.js';

export const USER_COLORS = [
  '#ff9800',
  '#e91e63',
  '#9c27b0',
  '#3f51b5',
  '#03a9f4',
  '#009688',
  '#8bc34a',
  '#795548',
];

export const DEFAULT_MAX_STROKES = 5_000;

/**
 * In-memory state of the shared drawing board: who is online, the finished
 * strokes (so late joiners see the full drawing) and strokes in progress.
 *
 * Kept free of any Socket.IO code so it can be unit tested directly.
 */
export class Board {
  private readonly users = new Map<string, User>();
  private readonly strokes: OwnedStroke[] = [];
  /** Strokes in progress, keyed by user id then stroke id. */
  private readonly active = new Map<string, Map<string, OwnedStroke>>();
  private colorIndex = 0;

  constructor(private readonly maxStrokes = DEFAULT_MAX_STROKES) {}

  join(id: string, name: string): User {
    const existing = this.users.get(id);
    if (existing) {
      existing.name = name;
      return existing;
    }
    const color = USER_COLORS[this.colorIndex++ % USER_COLORS.length] ?? '#03a9f4';
    const user = { id, name, color };
    this.users.set(id, user);
    return user;
  }

  /** Removes the user. Anything they were drawing is kept as finished. */
  leave(id: string): OwnedStroke[] {
    this.users.delete(id);
    const unfinished = [...(this.active.get(id)?.values() ?? [])];
    this.active.delete(id);
    unfinished.forEach((stroke) => this.commit(stroke));
    return unfinished;
  }

  isJoined(id: string): boolean {
    return this.users.has(id);
  }

  listUsers(): User[] {
    return [...this.users.values()];
  }

  startStroke(userId: string, stroke: Stroke): OwnedStroke {
    const owned: OwnedStroke = { ...stroke, points: [...stroke.points], userId };
    let mine = this.active.get(userId);
    if (!mine) {
      mine = new Map();
      this.active.set(userId, mine);
    }
    mine.set(stroke.id, owned);
    return owned;
  }

  /** Returns false when the stroke is unknown (e.g. never started). */
  extendStroke(userId: string, id: string, points: Point[]): boolean {
    const stroke = this.active.get(userId)?.get(id);
    if (!stroke) return false;
    extendStroke(stroke, points);
    return true;
  }

  endStroke(userId: string, id: string): OwnedStroke | undefined {
    const mine = this.active.get(userId);
    const stroke = mine?.get(id);
    if (!mine || !stroke) return undefined;
    mine.delete(id);
    this.commit(stroke);
    return stroke;
  }

  clear(): void {
    this.strokes.length = 0;
  }

  snapshot(selfId: string): BoardSnapshot {
    return {
      selfId,
      users: this.listUsers(),
      strokes: this.strokes,
      activeStrokes: [...this.active.values()].flatMap((mine) => [...mine.values()]),
    };
  }

  private commit(stroke: OwnedStroke): void {
    this.strokes.push(stroke);
    // Drop the oldest strokes so memory and join payloads stay bounded.
    if (this.strokes.length > this.maxStrokes) {
      this.strokes.splice(0, this.strokes.length - this.maxStrokes);
    }
  }
}
