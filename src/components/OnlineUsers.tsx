import type { User } from '../../shared/protocol';
import styles from './OnlineUsers.module.css';

const MAX_SHOWN = 4;

interface OnlineUsersProps {
  /** Other people on the board (not the current user). */
  users: User[];
}

export function OnlineUsers({ users }: OnlineUsersProps) {
  if (users.length === 0) return null;
  const shown = users.slice(0, MAX_SHOWN);
  const hidden = users.slice(MAX_SHOWN);

  return (
    <ul
      className={styles.stack}
      aria-label={`${users.length} other ${users.length === 1 ? 'person' : 'people'} drawing`}
    >
      {shown.map((user) => (
        <li
          key={user.id}
          className={styles.avatar}
          style={{ background: user.color }}
          data-tip={user.name}
          data-tip-side="bottom"
          aria-label={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </li>
      ))}
      {hidden.length > 0 && (
        <li
          className={`${styles.avatar} ${styles.more}`}
          data-tip={hidden.map((u) => u.name).join(', ')}
          data-tip-side="bottom"
          aria-label={`and ${hidden.length} more`}
        >
          +{hidden.length}
        </li>
      )}
    </ul>
  );
}
