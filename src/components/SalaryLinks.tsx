import { useId } from 'react';
import type { Unit } from '../adapters';
import { displayMoney } from '../money/format';
import type { SalaryPageLinks } from '../state/useTakeHome';
import { strings } from '../strings';
import styles from './SalaryLinks.module.css';

type Props = {
  /** The links of a pre-built page. */
  links: SalaryPageLinks;
  /** The unit of the page's answer, for the amounts in the link text. */
  unit: Unit;
};

/** Plain links to the neighbouring salary pages, the calculator and nearby pages. */
export function SalaryLinks({ links, unit }: Props) {
  const headingId = useId();
  const money = (salary: string) => displayMoney(salary, 'annually', unit);
  return (
    <nav className={styles.nav} aria-label={strings.salaryLinks.label}>
      <div className={styles.row}>
        {links.previous && (
          <a className={styles.link} href={links.previous.href}>
            {strings.salaryLinks.previous(money(links.previous.salary))}
          </a>
        )}
        {links.next && (
          <a className={styles.link} href={links.next.href}>
            {strings.salaryLinks.next(money(links.next.salary))}
          </a>
        )}
        <a className={styles.link} href={links.calculator}>
          {strings.salaryLinks.calculator}
        </a>
      </div>
      {links.others.length > 0 && (
        <>
          <p id={headingId} className={styles.heading}>
            {strings.salaryLinks.others}
          </p>
          <ul className={styles.list} aria-labelledby={headingId}>
            {links.others.map((other) => (
              <li key={other.href}>
                <a className={styles.link} href={other.href}>
                  {money(other.salary)}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}
