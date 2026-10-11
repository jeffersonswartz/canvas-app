import type { Brush, Point } from '../../shared/protocol';

/**
 * Textured brushes. Each one paints a polyline (a pen path, a line, or a
 * shape's outline) onto a 2D context.
 *
 * Textures look random but are fully deterministic: every "random" choice is
 * a hash of the stroke's seed and the position along the path. So every
 * client paints identical pixels, and extending a stroke never changes the
 * part already drawn (live previews match the finished stroke).
 */

export interface BrushInfo {
  brush: Brush;
  label: string;
}

export const BRUSH_INFO: BrushInfo[] = [
  { brush: 'ink', label: 'Ink pen' },
  { brush: 'matte', label: 'Matte' },
  { brush: 'oil', label: 'Oil paint' },
  { brush: 'crayon', label: 'Crayon' },
];

interface Sample extends Point {
  /** Direction of travel at this sample, in radians. */
  angle: number;
}

/** A 32-bit seed from a string (FNV-1a). */
export function seedFrom(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** A repeatable pseudo-random number in [0, 1) for (seed, a, b). */
export function noise(seed: number, a: number, b: number): number {
  let h = seed ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 1, 0x85ebca77);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Points spaced `spacing` apart along the polyline, with direction. */
export function resample(points: Point[], spacing: number): Sample[] {
  const [first] = points;
  if (!first) return [];
  const samples: Sample[] = [];
  let angle = 0;
  let carry = 0; // Distance already travelled towards the next sample.

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length === 0) continue;
    angle = Math.atan2(b.y - a.y, b.x - a.x);
    if (samples.length === 0) samples.push({ ...first, angle });

    let at = spacing - carry;
    while (at <= length) {
      const t = at / length;
      samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle });
      at += spacing;
    }
    carry = length - (at - spacing);
  }

  if (samples.length === 0) samples.push({ ...first, angle });
  return samples;
}

/** Mixes a #rrggbb colour towards another by `amount` (0–1). */
export function mixColor(color: string, toward: string, amount: number): string {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) || 0);
  const from = parse(color);
  const to = parse(toward);
  const mixed = from.map((c, i) => Math.round(c + ((to[i] ?? c) - c) * amount));
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function tracePolyline(ctx: CanvasRenderingContext2D, points: Point[]) {
  const [first] = points;
  if (!first) return;
  ctx.moveTo(first.x, first.y);
  // A single point still needs a (tiny) segment for its round cap to show.
  if (points.length === 1) ctx.lineTo(first.x + 0.01, first.y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
}

function strokePolyline(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  tracePolyline(ctx, points);
  ctx.stroke();
}

/** Offsets a sample sideways (perpendicular to travel) by `distance`. */
function sideways(sample: Sample, distance: number): Point {
  return {
    x: sample.x - Math.sin(sample.angle) * distance,
    y: sample.y + Math.cos(sample.angle) * distance,
  };
}

export interface BrushStroke {
  brush: Brush;
  color: string;
  width: number;
  seed: number;
}

/** Paints `points` with a textured brush. `ink` is a plain smooth line. */
export function paintBrush(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  { brush, color, width, seed }: BrushStroke,
): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  switch (brush) {
    case 'ink':
      strokePolyline(ctx, points);
      break;
    case 'matte':
      paintMatte(ctx, points, width, seed);
      break;
    case 'oil':
      paintOil(ctx, points, color, width, seed);
      break;
    case 'crayon':
      paintCrayon(ctx, points, width, seed);
      break;
  }
  ctx.restore();
}

/** Flat, opaque gouache: an even body with slightly dry, broken edges. */
function paintMatte(ctx: CanvasRenderingContext2D, points: Point[], width: number, seed: number) {
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  strokePolyline(ctx, points);

  const spacing = Math.max(1.5, width * 0.2);
  const perSample = Math.ceil(width / 1.5);
  const half = width / 2;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  resample(points, spacing).forEach((sample, i) => {
    for (let j = 0; j < perSample; j++) {
      const across = (noise(seed, i, j * 3) - 0.5) * width;
      // Dry-brush breaks only at the edges; the middle stays flat.
      const edge = Math.abs(across) / half;
      if (edge < 0.72) continue;
      const strength = (edge - 0.72) / 0.28;
      if (noise(seed, i, j * 3 + 1) > strength) continue;
      const dot = sideways(sample, across);
      const length = 1 + noise(seed, i, j * 3 + 2) * spacing * 1.5;
      ctx.globalAlpha = 0.2 + strength * 0.5;
      // Breaks run along the stroke, like a brush running dry at its edges.
      ctx.save();
      ctx.translate(dot.x, dot.y);
      ctx.rotate(sample.angle);
      ctx.fillRect(-length / 2, -0.6, length, 1.2);
      ctx.restore();
    }
  });
}

/** Thick paint: a body, bristle streaks in light and dark tones, and a sheen. */
function paintOil(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  width: number,
  seed: number,
) {
  strokePolyline(ctx, points);

  const samples = resample(points, Math.max(2, width * 0.3));
  if (samples.length < 2) return;
  const dark = mixColor(color, '#000000', 0.3);
  const light = mixColor(color, '#ffffff', 0.35);
  const bristles = Math.min(14, Math.max(3, Math.round(width / 2.5)));

  for (let b = 0; b < bristles; b++) {
    const offset = ((b + 0.5) / bristles - 0.5) * width * 0.85;
    ctx.strokeStyle = noise(seed, -1, b) < 0.5 ? dark : light;
    ctx.globalAlpha = 0.16 + noise(seed, -2, b) * 0.22;
    ctx.lineWidth = Math.max(0.7, (width / bristles) * 0.55);
    strokePolyline(
      ctx,
      samples.map((sample, i) => sideways(sample, offset + (noise(seed, i, b) - 0.5) * 0.8)),
    );
  }

  // A soft highlight along one edge reads as wet, glossy paint.
  ctx.strokeStyle = mixColor(color, '#ffffff', 0.6);
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = Math.max(1, width * 0.12);
  strokePolyline(
    ctx,
    samples.map((sample) => sideways(sample, -width * 0.22)),
  );
}

/** Waxy crayon: dense colour with paper grain showing through and a ragged edge. */
function paintCrayon(ctx: CanvasRenderingContext2D, points: Point[], width: number, seed: number) {
  // A faint wax wash under the dabs; square ends so it never pokes out past them.
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = width * 0.85;
  ctx.lineCap = 'butt';
  strokePolyline(ctx, points);
  ctx.lineCap = 'round';

  const spacing = Math.max(1, width * 0.12);
  const perSample = Math.max(3, Math.ceil(width * 1.6));
  const half = width / 2;
  const maxDab = Math.max(1, width * 0.08);
  resample(points, spacing).forEach((sample, i) => {
    for (let j = 0; j < perSample; j++) {
      const across = (noise(seed, i, j * 4) - 0.5) * width;
      // Fewer dabs near the edges gives the ragged crayon outline.
      const edge = Math.abs(across) / half;
      if (noise(seed, i, j * 4 + 1) < 0.12 + edge * edge * 0.6) continue;
      const along = (noise(seed, i, j * 4 + 2) - 0.5) * spacing * 2;
      const dot = sideways(sample, across);
      const size = 0.8 + noise(seed, i, j * 4 + 3) * maxDab;
      ctx.globalAlpha = 0.55 + noise(seed, j, i) * 0.4;
      ctx.fillRect(
        dot.x + Math.cos(sample.angle) * along - size / 2,
        dot.y + Math.sin(sample.angle) * along - size / 2,
        size,
        size,
      );
    }
  });

  // Paper grain: tiny specks where the wax skipped over the paper's tooth.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 0.7;
  resample(points, Math.max(1.5, width * 0.18)).forEach((sample, i) => {
    const specks = Math.ceil(width * 0.35);
    for (let j = 0; j < specks; j++) {
      if (noise(seed + 1, i, j) < 0.45) continue;
      const dot = sideways(sample, (noise(seed + 2, i, j) - 0.5) * width * 0.8);
      ctx.fillRect(dot.x, dot.y, 1.1, 1.1);
    }
  });
}
