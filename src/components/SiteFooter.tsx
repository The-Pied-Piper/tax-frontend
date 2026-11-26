import styles from './SiteFooter.module.css';
import { strings } from '../strings';
import {
  COMPARE_SLUG,
  contentPath,
  FOOTER_PROVINCE_SLUGS,
  METHODOLOGY_SLUG,
} from '../state/siteLinks';

export function SiteFooter() {
  return (
    <footer className="page-footer">
      <nav aria-label={strings.siteNav.label} className={styles.nav}>
        <div className={styles.row}>
          <a href={contentPath(METHODOLOGY_SLUG)}>
            {strings.siteNav.methodology}
          </a>
          <a href={contentPath(COMPARE_SLUG)}>{strings.siteNav.compare}</a>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{strings.siteNav.provinces}</span>
          {FOOTER_PROVINCE_SLUGS.map((slug) => (
            <a key={slug} href={contentPath(slug)}>
              {strings.siteNav.provinceNames[slug]}
            </a>
          ))}
        </div>
      </nav>
      <p className={styles.disclaimer}>{strings.footer}</p>
    </footer>
  );
}
