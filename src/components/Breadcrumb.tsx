import { strings } from '../strings';
import styles from './Breadcrumb.module.css';

/** A step of the trail that links to a page. */
export type BreadcrumbStep = { label: string; href: string };

type Props = {
  /** The linked steps, nearest the site root first. */
  steps: BreadcrumbStep[];
  /** The page being read: the last step, plain text. */
  current: string;
};

/** The trail from Home down to the current page. */
export function Breadcrumb({ steps, current }: Props) {
  return (
    <nav aria-label={strings.siteNav.breadcrumb} className={styles.crumbs}>
      <ol className={styles.crumbList}>
        {steps.map((step) => (
          <li key={step.href}>
            <a href={step.href}>{step.label}</a>
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
