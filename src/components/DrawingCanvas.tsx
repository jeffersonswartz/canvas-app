import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { MAX_POINTS_PER_MESSAGE, isFreehand } from '../../shared/protocol';
import type {
  BoardSnapshot,
  OwnedStroke,
  Point,
  Stroke,
  StrokeExtend,
} from '../../shared/protocol';
import { BoardRenderer } from '../lib/BoardRenderer';
import { createId } from '../lib/socket';
import type { BoardSocket } from '../lib/socket';
import type { ToolSettings } from '../lib/tools';
import styles from './DrawingCanvas.module.css';

interface DrawingCanvasProps {
  socket: BoardSocket;
  settings: ToolSettings;
  /** Whether the local user may draw (i.e. has joined). */
  enabled: boolean;
}

const remoteKey = (userId: string, strokeId: string) => `${userId}:${strokeId}`;
const localKey = (strokeId: string) => `local:${strokeId}`;

/** The shared drawing surface: renders everyone's strokes and captures ours. */
export function DrawingCanvas({ socket, settings, enabled }: DrawingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BoardRenderer | null>(null);

  // The stroke the local user is drawing, and points not yet sent.
  const currentRef = useRef<Stroke | null>(null);
  const pendingRef = useRef<Point[]>([]);
  const flushFrameRef = useRef<number | undefined>(undefined);

  // Create the renderer and keep it sized to the container.
  useEffect(() => {
    const container = containerRef.current;
    const base = baseRef.current;
    const overlay = overlayRef.current;
    if (!container || !base || !overlay) return;

    const renderer = new BoardRenderer(base, overlay);
    rendererRef.current = renderer;
    const fit = () => renderer.resize(container.clientWidth, container.clientHeight);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);

    return () => {
      observer.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Mirror everyone else's strokes.
  useEffect(() => {
    const renderer = () => rendererRef.current;
    const onSnapshot = (snapshot: BoardSnapshot) => {
      currentRef.current = null;
      pendingRef.current = [];
      renderer()?.reset(
        snapshot.strokes,
        snapshot.activeStrokes.map((s) => [remoteKey(s.userId, s.id), s] as const),
      );
    };
    const onStart = (stroke: OwnedStroke) =>
      renderer()?.startStroke(remoteKey(stroke.userId, stroke.id), stroke);
    const onExtend = ({ userId, id, points }: StrokeExtend & { userId: string }) =>
      renderer()?.extendStroke(remoteKey(userId, id), points);
    const onEnd = ({ userId, id }: { userId: string; id: string }) =>
      renderer()?.endStroke(remoteKey(userId, id));
    const onClear = () => renderer()?.clear();

    socket.on('snapshot', onSnapshot);
    socket.on('stroke:start', onStart);
    socket.on('stroke:extend', onExtend);
    socket.on('stroke:end', onEnd);
    socket.on('board:clear', onClear);
    return () => {
      socket.off('snapshot', onSnapshot);
      socket.off('stroke:start', onStart);
      socket.off('stroke:extend', onExtend);
      socket.off('stroke:end', onEnd);
      socket.off('board:clear', onClear);
    };
  }, [socket]);

  useEffect(
    () => () => {
      if (flushFrameRef.current !== undefined) cancelAnimationFrame(flushFrameRef.current);
    },
    [],
  );

  // Network updates are batched to at most one message per animation frame.
  const flush = () => {
    if (flushFrameRef.current !== undefined) {
      cancelAnimationFrame(flushFrameRef.current);
      flushFrameRef.current = undefined;
    }
    const stroke = currentRef.current;
    const pending = pendingRef.current;
    if (!stroke || pending.length === 0) return;
    pendingRef.current = [];
    for (let i = 0; i < pending.length; i += MAX_POINTS_PER_MESSAGE) {
      socket.emit('stroke:extend', {
        id: stroke.id,
        points: pending.slice(i, i + MAX_POINTS_PER_MESSAGE),
      });
    }
  };

  const scheduleFlush = () => {
    flushFrameRef.current ??= requestAnimationFrame(() => {
      flushFrameRef.current = undefined;
      flush();
    });
  };

  const toPoint = (event: { clientX: number; clientY: number }): Point => {
    const rect = overlayRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || !event.isPrimary || event.button !== 0 || currentRef.current) return;
    // Keep receiving events even if the pointer leaves the canvas mid-stroke.
    event.currentTarget.setPointerCapture(event.pointerId);

    const stroke: Stroke = {
      id: createId(),
      tool: settings.tool,
      strokeColor: settings.strokeColor,
      fillColor: settings.fillColor,
      fill: settings.fill,
      width: settings.width,
      points: [toPoint(event)],
    };
    currentRef.current = stroke;
    pendingRef.current = [];
    rendererRef.current?.startStroke(localKey(stroke.id), stroke);
    socket.emit('stroke:start', stroke);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const stroke = currentRef.current;
    if (!stroke || !event.isPrimary) return;

    // Coalesced events give smoother freehand lines on fast pointer moves.
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [];
    const points = (events.length > 0 ? events : [event]).map(toPoint);
    rendererRef.current?.extendStroke(localKey(stroke.id), points);

    if (isFreehand(stroke.tool)) pendingRef.current.push(...points);
    else pendingRef.current = points.slice(-1); // Shapes only need the latest end point.
    scheduleFlush();
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const stroke = currentRef.current;
    if (!stroke || !event.isPrimary) return;
    flush();
    currentRef.current = null;
    rendererRef.current?.endStroke(localKey(stroke.id));
    socket.emit('stroke:end', { id: stroke.id });
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={baseRef} className={styles.layer} aria-hidden="true" />
      <canvas
        ref={overlayRef}
        className={styles.layer}
        data-enabled={enabled}
        aria-label="Shared drawing board"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
