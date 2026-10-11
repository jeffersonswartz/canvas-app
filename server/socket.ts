import type { Server, Socket } from 'socket.io';
import { Board } from './board.js';
import {
  strokeEndSchema,
  strokeExtendSchema,
  strokeSchema,
  userNameSchema,
} from '../shared/protocol.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../shared/protocol.js';

type BoardServer = Server<ClientToServerEvents, ServerToClientEvents>;
type BoardSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/** Wires Socket.IO events to a {@link Board}. Invalid payloads are ignored. */
export function attachBoardHandlers(io: BoardServer, board = new Board()): Board {
  const broadcastUsers = () => io.emit('users', board.listUsers());

  io.on('connection', (socket: BoardSocket) => {
    const userId = socket.id;
    socket.emit('snapshot', board.snapshot(userId));

    // Drawing is only allowed after joining with a name.
    const whenJoined =
      <T>(handler: (payload: T) => void) =>
      (payload: T) => {
        if (board.isJoined(userId)) handler(payload);
      };

    const leave = () => {
      if (!board.isJoined(userId)) return;
      board.leave(userId).forEach((stroke) => {
        socket.broadcast.emit('stroke:end', { id: stroke.id, userId });
      });
      broadcastUsers();
    };

    socket.on('join', (name) => {
      const parsed = userNameSchema.safeParse(name);
      if (!parsed.success) return;
      board.join(userId, parsed.data);
      broadcastUsers();
    });

    socket.on('leave', leave);
    socket.on('disconnect', leave);

    socket.on(
      'stroke:start',
      whenJoined((payload) => {
        const parsed = strokeSchema.safeParse(payload);
        if (!parsed.success) return;
        socket.broadcast.emit('stroke:start', board.startStroke(userId, parsed.data));
      }),
    );

    socket.on(
      'stroke:extend',
      whenJoined((payload) => {
        const parsed = strokeExtendSchema.safeParse(payload);
        if (!parsed.success) return;
        if (board.extendStroke(userId, parsed.data.id, parsed.data.points)) {
          socket.broadcast.emit('stroke:extend', { ...parsed.data, userId });
        }
      }),
    );

    socket.on(
      'stroke:end',
      whenJoined((payload) => {
        const parsed = strokeEndSchema.safeParse(payload);
        if (!parsed.success) return;
        if (board.endStroke(userId, parsed.data.id)) {
          socket.broadcast.emit('stroke:end', { id: parsed.data.id, userId });
        }
      }),
    );

    socket.on('board:clear', () => {
      if (!board.isJoined(userId)) return;
      board.clear();
      io.emit('board:clear');
    });
  });

  return board;
}
