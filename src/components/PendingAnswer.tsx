import type { ReactNode } from 'react';
import { strings } from '../strings';
import styles from './PendingAnswer.module.css';

type Props = {
  /** True while a new answer is being fetched; the old answer shows faded. */
  pending: boolean;
  children: ReactNode;
};

// Keeps the answer where it is while the next one loads. The faded copy cannot
// be used (inert). The moving bar and the spoken note sit outside the inert
// part, so a screen reader still hears that work is going on; the note's live
// region is always on the page so its change is announced.
export function PendingAnswer({ pending, children }: Props) {
  return (
    <div
      className={pending ? styles.pending : styles.answer}
      aria-busy={pending}
    >
      {pending && <div className={styles.bar} aria-hidden="true" />}
      <p role="status" className={styles.visuallyHidden}>
        {pending ? strings.form.calculating : ''}
      </p>
      <div className={styles.content} inert={pending}>
        {children}
      </div>
    </div>
  );
}
