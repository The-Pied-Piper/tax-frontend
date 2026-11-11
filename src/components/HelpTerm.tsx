import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { strings } from '../strings';
import styles from './HelpTerm.module.css';

type Props = {
  name: string;
  help: string;
  /** Shown between the name and the "?" button (for example a form reference). */
  extra?: ReactNode;
};

// A name followed by a "?" button that shows or hides its explanation.
// With a mouse, pointing at it shows the explanation too.
export function HelpTerm({ name, help, extra }: Props) {
  const helpId = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className={styles.term}>
      <span>{name}</span>
      {extra}
      <button
        type="button"
        className={styles.help}
        aria-label={strings.breakdown.helpButton(name)}
        aria-expanded={open}
        aria-controls={helpId}
        onClick={() => {
          setOpen((o) => !o);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      >
        ?
      </button>
      <span id={helpId} className={styles.bubble} hidden={!open}>
        {help}
      </span>
    </span>
  );
}
