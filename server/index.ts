import { createServer } from 'node:http';
import path from 'node:path';
import express from 'express';
import { Server } from 'socket.io';
import { attachBoardHandlers } from './socket.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../shared/protocol.js';

const port = Number(process.env.PORT ?? 3000);
const clientDir = path.resolve(process.env.CLIENT_DIR ?? 'dist/client');

const app = express();
app.disable('x-powered-by');
app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});
app.use(express.static(clientDir));
// Single-page app: fall back to index.html for any other GET request.
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  // The client is always served from the same origin (directly, or through
  // the Vite proxy in development), so no CORS configuration is needed.
  maxHttpBufferSize: 1e6,
});
attachBoardHandlers(io);

httpServer.listen(port, () => {
  console.log(`Canvas server listening on http://localhost:${port}`);
});

function shutdown() {
  io.close();
  httpServer.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
