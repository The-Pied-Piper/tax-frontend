import type { SalaryPageLinks } from '../state/useTakeHome';
import { strings } from '../strings';
import styles from './LearnMore.module.css';

type Props = {
  /** The "Learn more" links of a pre-built page. */
  links: SalaryPageLinks['learnMore'];
};

/** Plain links from a salary page to its province hub, the method and the tax form. */
export function LearnMore({ links }: Props) {
  return (
    <nav className={styles.nav} aria-label={strings.learnMore.label}>
      <p className={styles.heading}>{strings.learnMore.label}</p>
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
