import styles from './ContentPage.module.css';
import { SiteFooter } from './SiteFooter';
import { ThemeToggle } from './ThemeToggle';
import {
  THEME_TOGGLE_SLOT_ID,
  type ContentPageSpec,
} from '../state/contentPages';
import { contentPath, HOME_PATH } from '../state/siteLinks';
import { strings } from '../strings';

/** A reading page: heading, theme switch, breadcrumb, sections and the site footer. */
export function ContentPage({
  heading,
  lede,
  trail,
  sections,
}: ContentPageSpec) {
  return (
    <>
      <main>
        <header className="page-header">
          <div className="page-header-text">
            <h1>{heading}</h1>
            {lede && <p className="lede">{lede}</p>}
          </div>
          <div id={THEME_TOGGLE_SLOT_ID}>
            <ThemeToggle />
          </div>
        </header>
        <nav aria-label={strings.siteNav.breadcrumb} className={styles.crumbs}>
          <ol className={styles.crumbList}>
            <li>
              <a href={HOME_PATH}>{strings.siteNav.home}</a>
            </li>
            {trail.map((step) => (
              <li key={step.slug}>
                <a href={contentPath(step.slug)}>{step.label}</a>
              </li>
            ))}
            <li aria-current="page">{heading}</li>
          </ol>
        </nav>
        {sections.map((section, at) => (
          <section key={at} className={styles.section}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((text, line) => (
              <p key={line}>{text}</p>
            ))}
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
