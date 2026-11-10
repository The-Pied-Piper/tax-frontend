import { useId, useState } from 'react';
import type { DisplayRow } from '../adapters';
import { displayAmount } from '../money/format';
import type { PayPeriod } from '../money/payPeriod';
import { strings } from '../strings';
import styles from './Breakdown.module.css';

type Props = {
  rows: readonly DisplayRow[];
  totals: readonly DisplayRow[];
  payPeriod: PayPeriod;
};

// Display only: names, help text and yearly amounts come from the adapter.
// The page shows nothing when the adapter gave no simple rows.
export function Breakdown({ rows, totals, payPeriod }: Props) {
  const headingId = useId();
  if (rows.length === 0 && totals.length === 0) return null;
  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <details className={styles.details}>
        <summary className={styles.summary}>
          <h2 id={headingId} className={styles.heading}>
            {strings.breakdown.toggle}
          </h2>
        </summary>
        <RowList rows={rows} payPeriod={payPeriod} />
        {totals.length > 0 && (
          <RowList rows={totals} payPeriod={payPeriod} strong />
        )}
      </details>
    </section>
  );
}

function RowList({
  rows,
  payPeriod,
  strong = false,
}: {
  rows: readonly DisplayRow[];
  payPeriod: PayPeriod;
  strong?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <dl className={strong ? styles.totals : styles.rows}>
      {rows.map((row) => (
        <div className={styles.row} key={row.id}>
          <dt>
            <HelpTerm name={row.name} help={row.help} />
          </dt>
          <dd>{displayAmount(row.amount, payPeriod)}</dd>
        </div>
      ))}
    </dl>
  );
}

// A name followed by a "?" button that shows or hides its explanation.
function HelpTerm({ name, help }: { name: string; help: string }) {
  const helpId = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className={styles.term}>
      <span className={styles.name}>{name}</span>
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
