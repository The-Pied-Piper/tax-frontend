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

type Line = { row: DisplayRow; strong: boolean };
type Section = { heading: string | undefined; lines: Line[] };

// Rows and totals that share a heading sit together, in the order the adapter
// gave them; rows with no heading come last, unheaded.
function sections(
  rows: readonly DisplayRow[],
  totals: readonly DisplayRow[],
): Section[] {
  const lines: Line[] = [
    ...rows.map((row) => ({ row, strong: false })),
    ...totals.map((row) => ({ row, strong: true })),
  ];
  const headed = new Map<string, Section>();
  const unheaded: Section = { heading: undefined, lines: [] };
  for (const line of lines) {
    const heading = line.row.group;
    if (heading === undefined) {
      unheaded.lines.push(line);
      continue;
    }
    const section = headed.get(heading) ?? { heading, lines: [] };
    section.lines.push(line);
    headed.set(heading, section);
  }
  return [...headed.values(), ...(unheaded.lines.length > 0 ? [unheaded] : [])];
}

// Display only: names, help text, headings and yearly amounts come from the adapter.
// The page shows nothing when the adapter gave no simple rows.
export function Breakdown({ rows, totals, payPeriod }: Props) {
  const headingId = useId();
  if (rows.length === 0 && totals.length === 0) return null;
  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <details>
        <summary className={styles.summary}>
          <h2 id={headingId} className={styles.heading}>
            {strings.breakdown.toggle}
          </h2>
        </summary>
        {sections(rows, totals).map((section) => (
          <SectionBlock
            key={section.heading ?? ''}
            section={section}
            payPeriod={payPeriod}
          />
        ))}
      </details>
    </section>
  );
}

function SectionBlock({
  section,
  payPeriod,
}: {
  section: Section;
  payPeriod: PayPeriod;
}) {
  return (
    <div className={styles.block}>
      {section.heading !== undefined && (
        <h3 className={styles.groupHeading}>{section.heading}</h3>
      )}
      <dl className={styles.rows}>
        {section.lines.map(({ row, strong }) => (
          <div
            className={
              strong ? [styles.row, styles.strong].join(' ') : styles.row
            }
            key={row.id}
          >
            <dt>
              <HelpTerm name={row.name} help={row.help} />
            </dt>
            <dd>{displayAmount(row.amount, payPeriod)}</dd>
          </div>
        ))}
      </dl>
    </div>
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
