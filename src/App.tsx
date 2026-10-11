import { useCallback, useEffect, useState } from 'react';
import { LogOut, Spline } from 'lucide-react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { JoinDialog } from './components/JoinDialog';
import { OnlineUsers } from './components/OnlineUsers';
import { Toolbar } from './components/Toolbar';
import { usePresence } from './hooks/usePresence';
import { useStoredName } from './hooks/useStoredName';
import { createBoardSocket } from './lib/socket';
import { DEFAULT_TOOL_SETTINGS } from './lib/tools';
import type { ToolSettings } from './lib/tools';
import styles from './App.module.css';

export function App() {
  const [socket] = useState(createBoardSocket);
  const [name, setName] = useStoredName();
  const [settings, setSettings] = useState<ToolSettings>(DEFAULT_TOOL_SETTINGS);
  const { users, selfId, connected } = usePresence(socket, name);

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

  const logout = () => {
    socket.emit('leave');
    setName(null);
  };

  const clearBoard = () => {
    if (window.confirm('Clear the board for everyone?')) socket.emit('board:clear');
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Spline size={24} aria-hidden="true" />
          <h1 className={styles.title}>Canvas Draw</h1>
        </div>
        <div className={styles.headerEnd}>
          <OnlineUsers users={users} selfId={selfId} />
          {name && (
            <button type="button" className={styles.userButton} onClick={logout}>
              <span>{name}</span>
              <LogOut size={16} aria-hidden="true" />
              <span className="visually-hidden">Log out</span>
            </button>
          )}
        </div>
      </header>

      <Toolbar
        settings={settings}
        onChange={updateSettings}
        onClearBoard={clearBoard}
        disabled={!name}
      />

      {!connected && (
        <p className={styles.status} role="status">
          Connecting to the server…
        </p>
      )}

      <main className={styles.board}>
        <DrawingCanvas socket={socket} settings={settings} enabled={Boolean(name)} />
      </main>

      {!name && <JoinDialog onJoin={setName} />}
    </div>
  );
}
