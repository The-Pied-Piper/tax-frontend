import { useEffect, useId, useRef, useState } from 'react';
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
// Only a click (or Enter / Space) on the "?" opens it; pointing does nothing.
// Clicking again, clicking elsewhere or pressing Escape closes it.
export function HelpTerm({ name, help, extra }: Props) {
  const helpId = useId();
  const [open, setOpen] = useState(false);
  const termRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !termRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);
  return (
    <span className={styles.term} ref={termRef}>
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
      >
        ?
      </button>
      <span id={helpId} className={styles.bubble} hidden={!open}>
        {help}
      </span>
    </span>
  );
}
