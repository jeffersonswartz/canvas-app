import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { MAX_NAME_LENGTH } from '../../shared/protocol';
import styles from './JoinDialog.module.css';

interface JoinDialogProps {
  onJoin: (name: string) => void;
}

/** Modal asking for a display name before the user can draw. */
export function JoinDialog({ onJoin }: JoinDialogProps) {
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
        <h2 id={titleId} className={styles.title}>
          Join the party!
        </h2>
        <label className={styles.field}>
          <span>What&apos;s your name?</span>
          <input
            autoFocus
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
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
          Join
        </button>
      </form>
    </div>
  );
}
