import type { PageLink, SalaryPageLinks } from '../state/useTakeHome';
import { strings } from '../strings';
import styles from './LearnMore.module.css';

type Props = {
  /** The "Learn more" links of a pre-built page. */
  links: SalaryPageLinks['learnMore'];
  /** The link to the province's rates page, drawn as one line above the list; null when there is none. */
  rates: PageLink | null;
};

/** Plain links from a salary page to its province hub, the method and the tax form. */
export function LearnMore({ links, rates }: Props) {
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
