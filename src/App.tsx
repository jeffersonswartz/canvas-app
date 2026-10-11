import { useCallback, useEffect, useState } from 'react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { JoinDialog } from './components/JoinDialog';
import { RemoteCursors } from './components/RemoteCursors';
import { StyleBar } from './components/StyleBar';
import { ToolRail } from './components/ToolRail';
import { TopBar } from './components/TopBar';
import { usePresence } from './hooks/usePresence';
import { useRemoteCursors } from './hooks/useRemoteCursors';
import { useStoredName } from './hooks/useStoredName';
import { useToolShortcuts } from './hooks/useToolShortcuts';
import { createBoardSocket } from './lib/socket';
import { DEFAULT_TOOL_SETTINGS } from './lib/tools';
import type { ToolSettings } from './lib/tools';

export function App() {
  const [socket] = useState(createBoardSocket);
  const [name, setName] = useStoredName();
  const [settings, setSettings] = useState<ToolSettings>(DEFAULT_TOOL_SETTINGS);
  const { users, selfId, connected } = usePresence(socket, name);
  const cursors = useRemoteCursors(socket);
  const joined = Boolean(name);

  // Connect only after every component has registered its listeners
  // (effects run child-first, and this one is last in the tree).
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const updateSettings = useCallback(
    (changes: Partial<ToolSettings>) => setSettings((current) => ({ ...current, ...changes })),
    [],
  );
  useToolShortcuts(settings, updateSettings, joined);

  const self = users.find((user) => user.id === selfId);
  const others = users.filter((user) => user.id !== selfId);

  const leave = () => {
    socket.emit('leave');
    setName(null);
  };

  const clearBoard = () => {
    if (window.confirm('Clear the board for everyone? This can’t be undone.')) {
      socket.emit('board:clear');
    }
  };

  return (
    <>
      <main>
        <DrawingCanvas socket={socket} settings={settings} enabled={joined}>
          <RemoteCursors cursors={cursors} users={others} />
        </DrawingCanvas>
      </main>

      <TopBar
        connected={connected}
        self={joined ? self : undefined}
        others={others}
        onLeave={leave}
      />

      {joined && (
        <>
          <ToolRail
            tool={settings.tool}
            onToolChange={(tool) => updateSettings({ tool })}
            onClearBoard={clearBoard}
            canClear={connected}
          />
          <StyleBar settings={settings} onChange={updateSettings} />
        </>
      )}

      {!joined && <JoinDialog onJoin={setName} users={users} />}
    </>
  );
}
