import { displayMoney } from '../money/format';
import type { SalaryIndex } from '../state/salaryIndex';
import { strings } from '../strings';
import styles from './SalaryIndexNav.module.css';

type Props = {
  /** Every pre-built page, by province. */
  index: SalaryIndex;
};

/**
 * Plain links to every pre-built salary page, grouped by province, inside a
 * disclosure that is closed on load. The anchors are in the markup either way.
 */
export function SalaryIndexNav({ index }: Props) {
  if (index.groups.length === 0) return null;
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>{strings.salaryIndex.label}</summary>
      <nav className={styles.nav} aria-label={strings.salaryIndex.label}>
        {index.groups.map((group) => {
          const headingId = `salary-index-${group.code}`;
          return (
            <section key={group.code}>
              <h2 id={headingId} className={styles.heading}>
                {group.name}
              </h2>
              <ul className={styles.list} aria-labelledby={headingId}>
                {group.pages.map((page) => (
                  <li key={page.href}>
                    <a className={styles.link} href={page.href}>
                      {strings.salaryIndex.link(
                        displayMoney(page.salary, 'annually', group.unit),
                        group.name,
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </nav>
    </details>
  );
}
