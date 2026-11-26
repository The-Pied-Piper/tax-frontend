import { displayWholeMoney, type MoneyUnit } from '../money/format';
import type { PageLink, SalaryPageLinks } from '../state/useTakeHome';
import { strings } from '../strings';
import styles from './LearnMore.module.css';

type Props = {
  /** The "Learn more" links of a pre-built page. */
  links: SalaryPageLinks['learnMore'];
  /** The link to the province's rates page, drawn as one line above the list; null when there is none. */
  rates: PageLink | null;
  /** The link to the compare page at this page's salary, drawn as one line above the list; null when there is none. */
  compare?: PageLink | null;
  /** The unit of the page's own answer, for the salary the compare line names. */
  unit?: MoneyUnit;
};

/** Plain links from a salary page to its province hub, the method and the tax form. */
/** The salary in a compare link's address (`?salary=70000`), as the page's own money; null when it has none or there is no unit. */
function compareSalary(compare: PageLink, unit?: MoneyUnit): string | null {
  const salary = new URLSearchParams(compare.href.split('?')[1] ?? '').get(
    'salary',
  );
  return salary === null || unit === undefined
    ? null
    : displayWholeMoney(salary, 'annually', unit);
}

export function LearnMore({ links, rates, compare = null, unit }: Props) {
  const salary = compare ? compareSalary(compare, unit) : null;
  return (
    <nav className={styles.nav} aria-label={strings.learnMore.label}>
      <p className={styles.heading}>{strings.learnMore.label}</p>
      {rates && (
        <p className={styles.rates}>
          {strings.ratesLink.salaryLead}{' '}
          <a className={styles.link} href={rates.href}>
            {rates.label}
          </a>
          {strings.ratesLink.salaryRest}
        </p>
      )}
      {compare && salary !== null && (
        <p className={styles.rates}>
          {strings.compareLink.salaryLead(salary)}{' '}
          <a className={styles.link} href={compare.href}>
            {compare.label}
          </a>
          {strings.compareLink.salaryRest}
        </p>
      )}
      <ul className={styles.list}>
        {links.map((link) => (
          <li key={link.href}>
            <a className={styles.link} href={link.href}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
