import { useEffect, useRef } from 'react';
import type { Brush, Point } from '../../shared/protocol';
import { paintBrush } from '../lib/brushes';

const WIDTH = 40;
const HEIGHT = 22;

// A short S-curve, like a test stroke on the edge of a sketchbook.
const PATH: Point[] = Array.from({ length: 13 }, (_, i) => ({
  x: 6 + i * 2.33,
  y: HEIGHT / 2 + Math.sin((i / 12) * Math.PI * 2) * 4.5,
}));

interface BrushPreviewProps {
  brush: Brush;
  color: string;
}

/** A small stroke painted with the real brush, in the current colour. */
export function BrushPreview({ brush, color }: BrushPreviewProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    paintBrush(ctx, PATH, { brush, color, width: 6, seed: 7 });
  }, [brush, color]);

  return <canvas ref={ref} style={{ width: WIDTH, height: HEIGHT }} aria-hidden="true" />;
}
