import type { Point, Stroke } from '../../shared/protocol';

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

/** Filled shapes are filled and then outlined, so both colours show. */
function paintShape(ctx: CanvasRenderingContext2D, fill: boolean) {
  if (fill) ctx.fill();
  ctx.stroke();
}
