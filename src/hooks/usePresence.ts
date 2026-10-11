import { useEffect, useState } from 'react';
import type { BoardSnapshot, User } from '../../shared/protocol';
import type { BoardSocket } from '../lib/socket';

export interface Presence {
  users: User[];
  selfId: string | null;
  connected: boolean;
}

/**
 * Tracks who is online and joins the board under `name` whenever the socket
 * (re)connects. Passing `null` stays connected as a spectator.
 */
export function usePresence(socket: BoardSocket, name: string | null): Presence {
  const [users, setUsers] = useState<User[]>([]);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('users', setUsers);
    const onSnapshot = (snapshot: BoardSnapshot) => {
      setUsers(snapshot.users);
      setSelfId(snapshot.selfId);
    };
    socket.on('snapshot', onSnapshot);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('users', setUsers);
      socket.off('snapshot', onSnapshot);
    };
  }, [socket]);

  useEffect(() => {
    if (!name) return;
    const join = () => socket.emit('join', name);
    if (socket.connected) join();
    socket.on('connect', join);
    return () => {
      socket.off('connect', join);
    };
  }, [socket, name]);

  return { users, selfId, connected };
}
