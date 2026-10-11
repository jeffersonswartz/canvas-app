import type { User } from '../../shared/protocol';
import styles from './OnlineUsers.module.css';

interface OnlineUsersProps {
  users: User[];
  selfId: string | null;
}

export function OnlineUsers({ users, selfId }: OnlineUsersProps) {
  return (
    <section className={styles.online} aria-label="Online users">
      <span className={styles.heading}>Online</span>
      <ul className={styles.list}>
        {users.map((user) => {
          const label = user.id === selfId ? `${user.name} (you)` : user.name;
          return (
            <li
              key={user.id}
              className={styles.avatar}
              style={{ background: user.color }}
              title={label}
              aria-label={label}
            >
              {user.name.charAt(0).toUpperCase()}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
