import type { Point, User } from '../../shared/protocol';
import styles from './RemoteCursors.module.css';

interface RemoteCursorsProps {
  cursors: Record<string, Point>;
  users: User[];
}

/** Other people's pointers, each with a name tag in their colour. */
export function RemoteCursors({ cursors, users }: RemoteCursorsProps) {
  return (
    <div className={styles.layer} aria-hidden="true">
      {users.map((user) => {
        const point = cursors[user.id];
        if (!point) return null;
        return (
          <div
            key={user.id}
            className={styles.cursor}
            style={{ transform: `translate(${point.x}px, ${point.y}px)`, color: user.color }}
          >
            <svg width="16" height="18" viewBox="0 0 16 18" className={styles.arrow}>
              <path
                d="M1.5 1.5 14 8.2l-5.6 1.5-2.6 5.8z"
                fill="currentColor"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles.tag} style={{ background: user.color }}>
              {user.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
