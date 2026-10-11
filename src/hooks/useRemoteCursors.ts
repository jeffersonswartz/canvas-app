import { useEffect, useState } from 'react';
import type { Point } from '../../shared/protocol';
import type { BoardSocket } from '../lib/socket';

/** Latest pointer position of every other user who is over the board. */
export function useRemoteCursors(socket: BoardSocket): Record<string, Point> {
  const [cursors, setCursors] = useState<Record<string, Point>>({});

  useEffect(() => {
    const onCursor = ({ userId, point }: { userId: string; point: Point | null }) => {
      setCursors((current) => {
        if (point) return { ...current, [userId]: point };
        if (!(userId in current)) return current;
        const next = { ...current };
        delete next[userId];
        return next;
      });
    };
    const onSnapshot = () => setCursors({});

    socket.on('cursor', onCursor);
    socket.on('snapshot', onSnapshot);
    return () => {
      socket.off('cursor', onCursor);
      socket.off('snapshot', onSnapshot);
    };
  }, [socket]);

  return cursors;
}
