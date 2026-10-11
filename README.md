# Canvas App

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fjeffersonswartz%2Fcanvas-app.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fjeffersonswartz%2Fcanvas-app?ref=badge_shield)

Canvas App is a collaborative drawing board: everyone who opens the page draws on the same canvas,
and strokes appear in each other's browsers in real time.

- Freehand pen, line, circle, square and eraser tools
- Stroke colour, fill colour, fill toggle and stroke width
- Live list of who is online
- People who join late see the whole drawing
- Works with a mouse, pen or touch screen
- "Clear board" wipes the canvas for everyone

## Tech stack

| Part   | Tools                                                                     |
| ------ | ------------------------------------------------------------------------- |
| Client | React 19, TypeScript, Vite, CSS Modules, `socket.io-client`, lucide icons |
| Server | Node.js, Express 5, Socket.IO 4, zod (validates every incoming message)   |
| Tests  | Vitest, Testing Library, a real Socket.IO server for integration tests    |
| Checks | ESLint (typescript-eslint, react-hooks), Prettier, GitHub Actions CI      |

## Getting started

Requires Node.js 20.19 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:5173. `npm run dev` starts the Socket.IO server (port 3000, restarts on
changes) and the Vite dev server (hot reload), which forwards `/socket.io` to the server. Open a
second browser window to see the drawing sync.

### Production

```sh
npm run build   # client -> dist/client, server -> dist/server
npm start       # serves the app and the socket on http://localhost:3000
```

Environment variables:

| Variable     | Default       | Meaning                             |
| ------------ | ------------- | ----------------------------------- |
| `PORT`       | `3000`        | Port the server listens on          |
| `CLIENT_DIR` | `dist/client` | Folder of the built client to serve |

The client always connects to the server that served the page, so no URL needs configuring.
`GET /healthz` returns `{ "ok": true }` for load balancer health checks.

## Scripts

| Script                      | What it does                          |
| --------------------------- | ------------------------------------- |
| `npm run dev`               | Server and client in watch mode       |
| `npm run build`             | Production build of client and server |
| `npm start`                 | Run the production build              |
| `npm test`                  | Run all tests once                    |
| `npm run test:watch`        | Run tests in watch mode               |
| `npm run lint`              | ESLint                                |
| `npm run typecheck`         | TypeScript for client, server, config |
| `npm run format` / `:check` | Prettier write / check                |

## Project layout

```
shared/protocol.ts      Event types and zod schemas shared by client and server
server/
  board.ts              In-memory board state: users, finished and in-progress strokes
  socket.ts             Socket.IO event handlers (validation, broadcasting)
  index.ts              Express + Socket.IO entry point
src/
  App.tsx               Layout, tool settings, join/logout
  components/
    DrawingCanvas.tsx   Pointer input, sending strokes, mirroring remote strokes
    Toolbar.tsx         Tools, colours, width, clear
    OnlineUsers.tsx     Online avatars
    JoinDialog.tsx      Name prompt
  hooks/
    usePresence.ts      Online users, joining on (re)connect
    useStoredName.ts    Name kept in sessionStorage for the tab
  lib/
    BoardRenderer.ts    Two-layer canvas renderer
    draw.ts             Pure drawing functions for each tool
    socket.ts           Typed socket factory
```

## How it works

Drawings are sent as **strokes** (tool, colours, width and points), not pixels.

1. When you press the pointer, the client sends `stroke:start`. While you drag, it sends
   `stroke:extend` with new points, batched to at most one message per animation frame. When you
   release, it sends `stroke:end`.
2. The server validates each message, records the stroke and forwards it to everyone else, tagged
   with your user id. Each user's in-progress strokes are tracked separately, so several people
   can draw at once without their lines joining up.
3. On connecting, a client receives a `snapshot` of the users, all finished strokes (up to the most
   recent 5,000) and any strokes in progress.
4. The client draws on two stacked canvases. Finished strokes go on the bottom layer. Strokes still
   being drawn are redrawn on the top layer each frame, so shape previews never smudge the drawing.
   Because strokes are data, resizing the window redraws a sharp image, including on HiDPI screens.

The board lives in server memory, so it is empty again after a server restart.

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fjeffersonswartz%2Fcanvas-app.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fjeffersonswartz%2Fcanvas-app?ref=badge_large)
