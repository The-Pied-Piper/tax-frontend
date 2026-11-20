import { useId } from 'react';
import type { AdvancedGroup, AdvancedLine, Unit } from '../adapters';
import {
  groupThousands,
  isDollarUnit,
  withCents,
  withUnit,
} from '../money/format';
import { formPageLink } from '../state/formLinks';
import { strings } from '../strings';
import { HelpTerm } from './HelpTerm';
import styles from './AdvancedView.module.css';

type Props = {
  groups: readonly AdvancedGroup[];
};

// Display only: every trace line, grouped by form title, in the order
// the API returned them. Always yearly, so there is no pay period here.
export function AdvancedView({ groups }: Props) {
  const headingId = useId();
  if (groups.length === 0) return null;
  return (
    <details aria-labelledby={headingId}>
      <summary className={styles.summary}>
        <h3 id={headingId} className={styles.heading}>
          {strings.advanced.toggle}
        </h3>
      </summary>
      <p className={styles.note}>{strings.advanced.note}</p>
      {groups.map((group, index) => (
        <FormGroup group={group} key={`${group.form}-${String(index)}`} />
      ))}
    </details>
  );
}

function FormGroup({ group }: { group: AdvancedGroup }) {
  const nameId = useId();
  const pageHref = group.page === null ? null : formPageLink(group.page);
  return (
    <details className={styles.form} aria-labelledby={nameId}>
      <summary className={styles.formSummary}>
        <span className={styles.formHead}>
          <span id={nameId} className={styles.formName}>
            {group.name}
          </span>
          {pageHref === null ? null : (
            <a className={styles.formLink} href={pageHref}>
              {strings.advanced.formLink}
              <span className={styles.hidden}>{` (${group.name})`}</span>
            </a>
          )}
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
  // The API may send a whole-dollar figure as "70000"; dollars show cents.
  const dollars = unit !== null && isDollarUnit(unit);
  const grouped = groupThousands(dollars ? withCents(amount) : amount);
  return unit === null ? grouped : withUnit(grouped, unit);
}
