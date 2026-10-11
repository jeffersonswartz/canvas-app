import { extendStroke } from '../../shared/protocol';
import type { Point, Stroke } from '../../shared/protocol';
import { drawStroke } from './draw';

/**
 * Draws the board onto two stacked canvases:
 *
 * - `base` holds finished strokes on a transparent background (the paper is
 *   CSS underneath). New strokes are painted on top
 *   incrementally; the whole layer is only repainted on resize or reset.
 * - `overlay` holds strokes still being drawn (by anyone). It is cleared and
 *   repainted once per animation frame while something changes, so live
 *   previews never damage the finished drawing underneath.
 *
 * Because strokes are kept as data rather than pixels, resizing and joining
 * late both repaint a crisp, complete drawing.
 */
export class BoardRenderer {
  private readonly baseCtx: CanvasRenderingContext2D;
  private readonly overlayCtx: CanvasRenderingContext2D;
  private strokes: Stroke[] = [];
  private readonly active = new Map<string, Stroke>();
  private width = 0;
  private height = 0;
  private frame: number | undefined;

  constructor(
    private readonly base: HTMLCanvasElement,
    private readonly overlay: HTMLCanvasElement,
  ) {
    this.baseCtx = getContext(base);
    this.overlayCtx = getContext(overlay);
  }

  /** Matches the canvases to their CSS size, accounting for HiDPI screens. */
  resize(width: number, height: number, pixelRatio = window.devicePixelRatio || 1): void {
    this.width = width;
    this.height = height;
    for (const [canvas, ctx] of [
      [this.base, this.baseCtx],
      [this.overlay, this.overlayCtx],
    ] as const) {
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }
    this.repaintBase();
    this.repaintOverlay();
  }

  /** Replaces everything, e.g. with the server snapshot after (re)connecting. */
  reset(strokes: Stroke[], active: Iterable<[key: string, stroke: Stroke]> = []): void {
    this.strokes = [...strokes];
    this.active.clear();
    for (const [key, stroke] of active) this.active.set(key, stroke);
    this.repaintBase();
    this.scheduleOverlay();
  }

  clear(): void {
    this.reset([]);
  }

  startStroke(key: string, stroke: Stroke): void {
    this.active.set(key, { ...stroke, points: [...stroke.points] });
    this.scheduleOverlay();
  }

  extendStroke(key: string, points: Point[]): void {
    const stroke = this.active.get(key);
    if (!stroke) return;
    extendStroke(stroke, points);
    this.scheduleOverlay();
  }

  /** Moves an active stroke onto the finished layer. */
  endStroke(key: string): void {
    const stroke = this.active.get(key);
    if (!stroke) return;
    this.active.delete(key);
    this.strokes.push(stroke);
    drawStroke(this.baseCtx, stroke);
    this.scheduleOverlay();
  }

  dispose(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
  }

  private repaintBase(): void {
    const ctx = this.baseCtx;
    ctx.clearRect(0, 0, this.width, this.height);
    for (const stroke of this.strokes) drawStroke(ctx, stroke);
  }

  private scheduleOverlay(): void {
    if (this.frame !== undefined) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = undefined;
      this.repaintOverlay();
    });
  }

  private repaintOverlay(): void {
    this.overlayCtx.clearRect(0, 0, this.width, this.height);
    for (const stroke of this.active.values()) {
      drawStroke(this.overlayCtx, stroke, { preview: true });
    }
  }
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not supported in this browser');
  return ctx;
}
