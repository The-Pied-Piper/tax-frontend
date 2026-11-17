import styles from './SiteFooter.module.css';
import { strings } from '../strings';
import {
  contentPath,
  FOOTER_PROVINCES,
  METHODOLOGY_SLUG,
} from '../state/siteLinks';

export function SiteFooter() {
  return (
    <footer className="page-footer">
      <nav aria-label={strings.siteNav.label} className={styles.nav}>
        <a href={contentPath(METHODOLOGY_SLUG)}>
          {strings.siteNav.methodology}
        </a>
        <span className={styles.label}>{strings.siteNav.provinces}</span>
        {FOOTER_PROVINCES.map((province) => (
          <a key={province.slug} href={contentPath(province.slug)}>
            {province.name}
          </a>
        ))}
      </nav>
      <p className={styles.disclaimer}>{strings.footer}</p>
    </footer>
  );
}
