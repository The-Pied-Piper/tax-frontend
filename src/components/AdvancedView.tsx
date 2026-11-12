import { useId, useState } from 'react';
import type { AdvancedGroup, AdvancedLine, Unit } from '../adapters';
import { groupThousands, withUnit } from '../money/format';
import { strings } from '../strings';
import { HelpTerm } from './HelpTerm';
import styles from './AdvancedView.module.css';

type Props = {
  groups: readonly AdvancedGroup[];
};

// Display only: every trace line, grouped by form, exactly as the engine
// returned it. Always yearly, so there is no pay period here.
export function AdvancedView({ groups }: Props) {
  const headingId = useId();
  const bodyId = useId();
  const [on, setOn] = useState(false);
  if (groups.length === 0) return null;
  return (
    <div role="group" aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.hidden}>
        {strings.advanced.heading}
      </h3>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          className={styles.checkbox}
          aria-controls={bodyId}
          checked={on}
          onChange={(event) => {
            setOn(event.target.checked);
          }}
        />
        <span>{strings.advanced.toggle}</span>
      </label>
      <div id={bodyId}>
        {on && (
          <>
            <p className={styles.note}>{strings.advanced.note}</p>
            {groups.map((group, index) => (
              <FormGroup group={group} key={`${group.form}-${String(index)}`} />
            ))}
          </>
        )}
      </div>
    </div>
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
              <HelpTerm
                name={line.label}
                help={line.detail}
                extra={reference(line)}
              />
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
                lineAmount(line.amount, line.unit)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function reference(line: AdvancedLine) {
  // "Line 2" already says the number; a second badge would repeat it.
  if (line.reference === null || !line.named) return null;
  return (
    <span className={styles.reference}>
      <span className={styles.hidden}>{strings.advanced.reference} </span>
      {line.reference}
    </span>
  );
}

function lineAmount(amount: string, unit: Unit | null) {
  const grouped = groupThousands(amount);
  return unit === null ? grouped : withUnit(grouped, unit);
}
