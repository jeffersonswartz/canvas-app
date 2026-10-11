/**
 * Wire protocol shared by the browser client and the Socket.IO server.
 *
 * Everything a client sends is validated with these schemas on the server, so
 * a misbehaving client can't corrupt the board for everyone else.
 */
import { z } from 'zod';

export const TOOLS = ['free', 'line', 'circle', 'square', 'erase'] as const;
export type Tool = (typeof TOOLS)[number];

/** Freehand tools record every point; shape tools only a start and an end. */
export const isFreehand = (tool: Tool): boolean => tool === 'free' || tool === 'erase';

export const MIN_STROKE_WIDTH = 2;
export const MAX_STROKE_WIDTH = 72;
export const MAX_NAME_LENGTH = 32;
export const MAX_POINTS_PER_STROKE = 10_000;
export const MAX_POINTS_PER_MESSAGE = 500;

const coordinate = z.number().finite().min(-100_000).max(100_000);
export const pointSchema = z.object({ x: coordinate, y: coordinate });
export type Point = z.infer<typeof pointSchema>;

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a #rrggbb colour');
const strokeId = z.string().min(1).max(64);

export const strokeSchema = z.object({
  id: strokeId,
  tool: z.enum(TOOLS),
  strokeColor: color,
  fillColor: color,
  fill: z.boolean(),
  width: z.number().min(MIN_STROKE_WIDTH).max(MAX_STROKE_WIDTH),
  points: z.array(pointSchema).min(1).max(MAX_POINTS_PER_MESSAGE),
});
export type Stroke = z.infer<typeof strokeSchema>;

export const strokeExtendSchema = z.object({
  id: strokeId,
  points: z.array(pointSchema).min(1).max(MAX_POINTS_PER_MESSAGE),
});
export type StrokeExtend = z.infer<typeof strokeExtendSchema>;

export const strokeEndSchema = z.object({ id: strokeId });

/** Where a user's pointer is on the board, or `null` when it left. */
export const cursorSchema = pointSchema.nullable();

export const userNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);

export interface User {
  id: string;
  name: string;
  color: string;
}

/** A stroke together with the user who drew it. */
export interface OwnedStroke extends Stroke {
  userId: string;
}

export interface BoardSnapshot {
  selfId: string;
  users: User[];
  /** Finished strokes, oldest first. */
  strokes: OwnedStroke[];
  /** Strokes other users are drawing right now. */
  activeStrokes: OwnedStroke[];
}

export interface ServerToClientEvents {
  snapshot: (snapshot: BoardSnapshot) => void;
  users: (users: User[]) => void;
  'stroke:start': (stroke: OwnedStroke) => void;
  'stroke:extend': (update: StrokeExtend & { userId: string }) => void;
  'stroke:end': (end: { id: string; userId: string }) => void;
  'board:clear': () => void;
  cursor: (cursor: { userId: string; point: Point | null }) => void;
}

export interface ClientToServerEvents {
  join: (name: string) => void;
  leave: () => void;
  'stroke:start': (stroke: Stroke) => void;
  'stroke:extend': (update: StrokeExtend) => void;
  'stroke:end': (end: { id: string }) => void;
  'board:clear': () => void;
  cursor: (point: Point | null) => void;
}

/**
 * Applies new points to a stroke in place. Freehand strokes grow; shapes keep
 * their start point and move their end point to the latest position.
 */
export function extendStroke(stroke: Stroke, points: Point[]): void {
  if (points.length === 0) return;
  if (isFreehand(stroke.tool)) {
    const room = MAX_POINTS_PER_STROKE - stroke.points.length;
    if (room > 0) stroke.points.push(...points.slice(0, room));
    return;
  }
  const start = stroke.points[0];
  const end = points[points.length - 1];
  if (start && end) stroke.points = [start, end];
}
