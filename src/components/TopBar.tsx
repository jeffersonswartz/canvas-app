import { LogOut } from 'lucide-react';
import type { User } from '../../shared/protocol';
import { BrandMark } from './BrandMark';
import { OnlineUsers } from './OnlineUsers';
import styles from './TopBar.module.css';

interface TopBarProps {
  connected: boolean;
  self: User | undefined;
  others: User[];
  onLeave: () => void;
}

export function TopBar({ connected, self, others, onLeave }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.panel}>
        <BrandMark />
        <h1 className={styles.wordmark}>Canvas</h1>
        <span className={styles.status} data-live={connected} role="status">
          <span className={styles.statusDot} aria-hidden="true" />
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>

      {self && (
        <div className={styles.panel}>
          <OnlineUsers users={others} />
          <div className={styles.me}>
            <span className={styles.meDot} style={{ background: self.color }} aria-hidden="true" />
            <span className={styles.meName}>{self.name}</span>
            <button
              type="button"
              className={styles.leave}
              aria-label="Leave"
              data-tip="Leave"
              data-tip-side="bottom"
              onClick={onLeave}
            >
              <LogOut size={15} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
