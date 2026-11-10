import { useId } from 'react';
import type { AdvancedGroup } from '../adapters';
import { groupThousands } from '../money/format';
import { strings } from '../strings';
import styles from './AdvancedView.module.css';

type Props = {
  groups: readonly AdvancedGroup[];
};

// Display only: every trace line, grouped by form, exactly as the engine
// returned it. Always yearly, so there is no pay period here.
export function AdvancedView({ groups }: Props) {
  const headingId = useId();
  if (groups.length === 0) return null;
  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <details>
        <summary className={styles.summary}>
          <h2 id={headingId} className={styles.heading}>
            {strings.advanced.toggle}
          </h2>
        </summary>
        <p className={styles.note}>{strings.advanced.note}</p>
        {groups.map((group, index) => (
          <FormGroup group={group} key={`${group.form}-${String(index)}`} />
        ))}
      </details>
    </section>
  );
}

function FormGroup({ group }: { group: AdvancedGroup }) {
  const nameId = useId();
  return (
    <details className={styles.form} aria-labelledby={nameId}>
      <summary className={styles.formSummary}>
        <span className={styles.formHead}>
          <span id={nameId} className={styles.formName}>
            {group.form}
          </span>
          <span className={styles.count}>
            {strings.advanced.lineCount(group.lines.length)}
          </span>
        </span>
      </summary>
      <dl className={styles.lines}>
        {group.lines.map((line, index) => (
          <div className={styles.line} key={`${line.label}-${String(index)}`}>
            <dt>{line.label}</dt>
            <dd>
              {line.amount === null ? (
                <>
                  <span aria-hidden="true">{strings.advanced.noAmount}</span>
                  <span className={styles.hidden}>
                    {strings.advanced.noAmountSpoken}
                  </span>
                </>
              ) : (
                groupThousands(line.amount)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
