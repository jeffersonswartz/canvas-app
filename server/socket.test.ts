// @vitest-environment node
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import { io as connect } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { attachBoardHandlers } from './socket';
import type {
  BoardSnapshot,
  ClientToServerEvents,
  ServerToClientEvents,
  Stroke,
} from '../shared/protocol';

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

const stroke: Stroke = {
  id: 's1',
  tool: 'free',
  strokeColor: '#ff0000',
  fillColor: '#000000',
  fill: false,
  width: 4,
  points: [{ x: 1, y: 2 }],
};

function once<E extends keyof ServerToClientEvents>(
  client: Client,
  event: E,
): Promise<Parameters<ServerToClientEvents[E]>[0]> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.once(event, resolve as any);
  });
}

describe('board socket handlers', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let url: string;
  const clients: Client[] = [];

  beforeEach(async () => {
    const httpServer = createServer();
    io = new Server(httpServer);
    attachBoardHandlers(io);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    clients.splice(0).forEach((c) => c.disconnect());
    await io.close();
  });

  async function joinedClient(name: string): Promise<{ client: Client; snapshot: BoardSnapshot }> {
    const client: Client = connect(url, { transports: ['websocket'] });
    clients.push(client);
    const snapshot = await once(client, 'snapshot');
    client.emit('join', name);
    await once(client, 'users');
    return { client, snapshot };
  }

  it('relays a stroke to other users and replays it to late joiners', async () => {
    const { client: ada } = await joinedClient('Ada');
    const { client: bob } = await joinedClient('Bob');

    const started = once(bob, 'stroke:start');
    ada.emit('stroke:start', stroke);
    expect(await started).toMatchObject({ ...stroke, userId: ada.id });

    const extended = once(bob, 'stroke:extend');
    ada.emit('stroke:extend', { id: 's1', points: [{ x: 3, y: 4 }] });
    expect(await extended).toEqual({ id: 's1', points: [{ x: 3, y: 4 }], userId: ada.id });

    const ended = once(bob, 'stroke:end');
    ada.emit('stroke:end', { id: 's1' });
    expect(await ended).toEqual({ id: 's1', userId: ada.id });

    const { snapshot } = await joinedClient('Cy');
    expect(snapshot.strokes).toEqual([
      expect.objectContaining({
        id: 's1',
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
      }),
    ]);
    expect(snapshot.users.map((u) => u.name)).toEqual(['Ada', 'Bob']);
  });

  it('ignores invalid strokes and strokes from users who have not joined', async () => {
    const { client: ada } = await joinedClient('Ada');
    const spectator: Client = connect(url, { transports: ['websocket'] });
    clients.push(spectator);
    await once(spectator, 'snapshot');

    let relayed = 0;
    ada.on('stroke:start', () => relayed++);
    spectator.emit('stroke:start', stroke);
    ada.emit('stroke:start', { ...stroke, id: 's2', strokeColor: 'javascript:alert(1)' });

    // A valid stroke afterwards proves the earlier ones were processed and dropped.
    const { client: bob } = await joinedClient('Bob');
    const started = once(ada, 'stroke:start');
    bob.emit('stroke:start', { ...stroke, id: 's3' });
    expect(await started).toMatchObject({ id: 's3' });
    expect(relayed).toBe(1);
  });

  it('relays cursor positions and hides them when a user leaves', async () => {
    const { client: ada } = await joinedClient('Ada');
    const { client: bob } = await joinedClient('Bob');

    const moved = once(bob, 'cursor');
    ada.emit('cursor', { x: 10, y: 20 });
    expect(await moved).toEqual({ userId: ada.id, point: { x: 10, y: 20 } });

    const hidden = once(bob, 'cursor');
    ada.emit('leave');
    expect(await hidden).toEqual({ userId: ada.id, point: null });
  });

  it('removes users who leave', async () => {
    const { client: ada } = await joinedClient('Ada');
    const { client: bob } = await joinedClient('Bob');

    const users = once(ada, 'users');
    bob.emit('leave');
    expect((await users).map((u) => u.name)).toEqual(['Ada']);
  });

  it('clears the board for everyone', async () => {
    const { client: ada } = await joinedClient('Ada');
    const { client: bob } = await joinedClient('Bob');
    ada.emit('stroke:start', stroke);
    ada.emit('stroke:end', { id: 's1' });

    const cleared = once(bob, 'board:clear');
    ada.emit('board:clear');
    await cleared;

    const { snapshot } = await joinedClient('Cy');
    expect(snapshot.strokes).toEqual([]);
  });
});
