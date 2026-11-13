import type { Unit } from '../adapters';
import { displayMoney } from '../money/format';
import type { SalaryPageLink } from '../state/useTakeHome';
import { strings } from '../strings';
import styles from './NearbySalaries.module.css';

type Props = {
  /** The pages to list, already chosen and in order. */
  pages: SalaryPageLink[];
  /** The name of the province the pages are in. */
  place: string;
  /** The unit of the amounts in the link text. */
  unit: Unit;
};

/** Plain links to the pre-built salary pages nearest to a result. */
export function NearbySalaries({ pages, place, unit }: Props) {
  if (pages.length === 0) return null;
  return (
    <nav className={styles.nav} aria-label={strings.salaryIndex.nearby}>
      <p className={styles.heading}>{strings.salaryIndex.nearby}</p>
      <ul className={styles.list}>
        {pages.map((page) => (
          <li key={page.href}>
            <a className={styles.link} href={page.href}>
              {strings.salaryIndex.link(
                displayMoney(page.salary, 'annually', unit),
                place,
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
