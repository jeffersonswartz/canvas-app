import { ArrowRight } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { MAX_NAME_LENGTH } from '../../shared/protocol';
import type { User } from '../../shared/protocol';
import { BrandMark } from './BrandMark';
import styles from './JoinDialog.module.css';

interface JoinDialogProps {
  onJoin: (name: string) => void;
  /** People already on the board, to show who you'd be drawing with. */
  users: User[];
}

function describePresence(users: User[]): string {
  const names = users.map((u) => u.name);
  if (names.length === 0) return 'Nobody’s here yet. You’ll be the first.';
  if (names.length === 1) return `${names[0]} is drawing right now.`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are drawing right now.`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more are drawing right now.`;
}

/** Modal asking for a display name before the user can draw. */
export function JoinDialog({ onJoin, users }: JoinDialogProps) {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const titleId = useId();
  const errorId = useId();
  const trimmed = name.trim();
  const showError = touched && trimmed === '';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (trimmed) onJoin(trimmed);
  };

  return (
    <div className={styles.backdrop}>
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        noValidate
      >
        <BrandMark size={34} />
        <h2 id={titleId} className={styles.title}>
          Draw together.
        </h2>
        <p className={styles.lede}>
          One sheet of paper, shared live with everyone on this page. Pick a name so others know
          whose lines are whose.
        </p>

        <label className={styles.field}>
          <span className={styles.label}>Your name</span>
          <input
            autoFocus
            value={name}
            placeholder="e.g. Ada"
            maxLength={MAX_NAME_LENGTH}
            autoComplete="nickname"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={showError}
            aria-describedby={showError ? errorId : undefined}
          />
        </label>
        {showError && (
          <p id={errorId} className={styles.error} role="alert">
            Name is required
          </p>
        )}

        <button type="submit" className={styles.submit}>
          Start drawing
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>

        <p className={styles.presence}>
          {users.length > 0 && (
            <span className={styles.faces} aria-hidden="true">
              {users.slice(0, 3).map((user) => (
                <span key={user.id} className={styles.face} style={{ background: user.color }}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ))}
            </span>
          )}
          {describePresence(users)}
        </p>
      </form>
    </div>
  );
}
