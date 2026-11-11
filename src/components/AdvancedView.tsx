import { useId, useState } from 'react';
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
  const labelId = useId();
  const [on, setOn] = useState(false);
  if (groups.length === 0) return null;
  return (
    <section className={styles.card} aria-labelledby={labelId}>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={on}
          onChange={(event) => {
            setOn(event.target.checked);
          }}
        />
        <span id={labelId}>{strings.advanced.toggle}</span>
      </label>
      {on && (
        <>
          <p className={styles.note}>{strings.advanced.note}</p>
          {groups.map((group, index) => (
            <FormGroup group={group} key={`${group.form}-${String(index)}`} />
          ))}
        </>
      )}
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
            {group.name}
          </span>
          <span className={styles.count}>
            {strings.advanced.lineCount(group.lines.length)}
          </span>
        </span>
      </summary>
      <dl className={styles.lines}>
        {group.lines.map((line, index) => (
          <div className={styles.line} key={`${line.label}-${String(index)}`}>
            <dt>
              {line.label}
              {line.reference !== null && (
                <span className={styles.reference}>
                  <span className={styles.hidden}>
                    {strings.advanced.reference}{' '}
                  </span>
                  {line.reference}
                </span>
              )}
            </dt>
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
