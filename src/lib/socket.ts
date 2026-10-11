import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/protocol';

export type BoardSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Creates a socket to the server that served this page. It starts
 * disconnected so callers can attach listeners before any event arrives.
 */
export function createBoardSocket(): BoardSocket {
  return io({ autoConnect: false });
}

/** A short unique id; works on plain-http origins where randomUUID is absent. */
export function createId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}
