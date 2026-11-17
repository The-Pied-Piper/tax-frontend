import type { ReactNode } from 'react';
import { strings } from '../strings';
import styles from './PendingAnswer.module.css';

type Props = {
  /** True while a new answer is being fetched; the old answer shows faded. */
  pending: boolean;
  children: ReactNode;
};

// Keeps the answer where it is while the next one loads. The faded copy cannot
// be used (inert), and a moving bar plus a spoken note say that work is going on.
export function PendingAnswer({ pending, children }: Props) {
  return (
    <div
      className={pending ? styles.pending : styles.answer}
      aria-busy={pending}
      inert={pending}
    >
      {pending && <div className={styles.bar} aria-hidden="true" />}
      {pending && (
        <p role="status" className={styles.visuallyHidden}>
          {strings.form.calculating}
        </p>
      )}
      {children}
    </div>
  );
}
