import type { Brush, Point, Stroke } from '../../shared/protocol';
import { paintBrush, seedFrom } from './brushes';

/** The paper colour; erase previews are painted with it. Keep in sync with --paper. */
export const PAPER_COLOR = '#fbfaf6';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The square dragged out from `start` to `end`. Its side is the longer of the
 * two drag distances, and it grows in the direction the pointer moved.
 */
export function squareFromDrag(start: Point, end: Point): Rect {
  const side = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  return {
    x: start.x,
    y: start.y,
    width: end.x < start.x ? -side : side,
    height: end.y < start.y ? -side : side,
  };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Draws one stroke onto a 2D context.
 *
 * Finished erase strokes cut the ink away (the canvas is transparent and the
 * paper shows through). While a stroke is still a `preview` on the overlay
 * there is nothing underneath to cut, so the eraser paints paper instead.
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  { preview = false } = {},
): void {
  const [start] = stroke.points;
  if (!start) return;
  const end = stroke.points[stroke.points.length - 1] ?? start;

  const brush: Brush = stroke.tool === 'erase' ? 'ink' : (stroke.brush ?? 'ink');
  if (brush !== 'ink') {
    drawTextured(ctx, stroke, brush, start, end);
    return;
  }

  ctx.save();
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.strokeColor;
  if (stroke.tool === 'erase') {
    if (preview) ctx.strokeStyle = PAPER_COLOR;
    else ctx.globalCompositeOperation = 'destination-out';
  }
  ctx.fillStyle = stroke.fillColor;
  ctx.beginPath();

  switch (stroke.tool) {
    case 'free':
    case 'erase':
      if (stroke.points.length === 1) {
        // A single click leaves a dot.
        ctx.fillStyle = ctx.strokeStyle;
        ctx.arc(start.x, start.y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      ctx.moveTo(start.x, start.y);
      for (const point of stroke.points.slice(1)) ctx.lineTo(point.x, point.y);
      ctx.stroke();
      break;

    case 'line':
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      break;

    case 'circle':
      ctx.arc(start.x, start.y, distance(start, end), 0, Math.PI * 2);
      paintShape(ctx, stroke.fill);
      break;

    case 'square': {
      const rect = squareFromDrag(start, end);
      ctx.rect(rect.x, rect.y, rect.width, rect.height);
      paintShape(ctx, stroke.fill);
      break;
    }
  }

  ctx.restore();
}

/**
 * The path a stroke's line follows: the pen's points, a line's two ends, or
 * a shape's closed outline.
 */
export function strokeOutline(stroke: Stroke, start: Point, end: Point): Point[] {
  switch (stroke.tool) {
    case 'free':
    case 'erase':
      return stroke.points;
    case 'line':
      return [start, end];
    case 'circle': {
      const radius = distance(start, end);
      const steps = Math.max(24, Math.ceil((Math.PI * 2 * radius) / 6));
      return Array.from({ length: steps + 1 }, (_, i) => {
        const angle = (i / steps) * Math.PI * 2;
        return { x: start.x + Math.cos(angle) * radius, y: start.y + Math.sin(angle) * radius };
      });
    }
    case 'square': {
      const { x, y, width, height } = squareFromDrag(start, end);
      return [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
        { x, y },
      ];
    }
  }
}

/** Draws a stroke with a textured brush; shapes get a flat fill first. */
function drawTextured(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  brush: Brush,
  start: Point,
  end: Point,
) {
  const outline = strokeOutline(stroke, start, end);
  const isShape = stroke.tool === 'circle' || stroke.tool === 'square';

  if (isShape && stroke.fill) {
    ctx.save();
    ctx.fillStyle = stroke.fillColor;
    // Crayon can't lay down solid colour; a lighter fill keeps it waxy.
    if (brush === 'crayon') ctx.globalAlpha = 0.6;
    ctx.beginPath();
    outline.forEach((point, i) => (i === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, point.x, point.y));
    ctx.fill();
    ctx.restore();
  }

  paintBrush(ctx, outline, {
    brush,
    color: stroke.strokeColor,
    width: stroke.width,
    seed: seedFrom(stroke.id),
  });
}

/** Filled shapes are filled and then outlined, so both colours show. */
function paintShape(ctx: CanvasRenderingContext2D, fill: boolean) {
  if (fill) ctx.fill();
  ctx.stroke();
}
