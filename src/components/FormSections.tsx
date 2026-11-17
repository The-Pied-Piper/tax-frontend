import { Fragment } from 'react';
import styles from './FormSections.module.css';
import { displayWholeMoney } from '../money/format';
import { splitFigures, type FormBody } from '../state/formPage';
import {
  contentPath,
  METHODOLOGY_SLUG,
  salaryPagePath,
} from '../state/siteLinks';
import { strings } from '../strings';

/** Words with each `{name}` shown as its figure in monospace. */
function Words({
  text,
  figures,
}: {
  text: string;
  figures: FormBody['sections'][number]['figures'];
}) {
  return (
    <>
      {splitFigures(text).map((part, at) => (
        <Fragment key={at}>
          {part.kind === 'figure' ? (
            <code>{figures[part.value]?.shown ?? part.value}</code>
          ) : (
            part.value
          )}
        </Fragment>
      ))}
    </>
  );
}

/**
 * The parts of a form page: a notice, the contents, then one section per group
 * of lines, each with its own address, line numbers, a paragraph and a worked
 * example, and a row of related links.
 */
export function FormSections({
  province,
  year,
  exampleSalary,
  sections,
  salaryPageWritten,
}: FormBody) {
  const salary = displayWholeMoney(
    exampleSalary,
    'annually',
    strings.fallbackUnit,
  );
  const place = strings.siteNav.provinceNames[province];
  return (
    <>
      <p className={styles.notice}>{strings.formPage.notice(year, salary)}</p>
      <nav aria-labelledby="form-contents" className={styles.contents}>
        <h2 id="form-contents">{strings.formPage.contents}</h2>
        <ol className={styles.contentsList}>
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>
                <span className={styles.lines}>{section.lines}</span>{' '}
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-heading`}
          className={styles.section}
        >
          <h2>
            <span id={`${section.id}-heading`}>{section.heading}</span>{' '}
            <a
              className={styles.permalink}
              href={`#${section.id}`}
              aria-label={strings.formPage.permalink(section.heading)}
            >
              #
            </a>
            <span className={styles.pill}>{section.lines}</span>
          </h2>
          <p>
            <Words text={section.paragraph} figures={section.figures} />
          </p>
          <div className={styles.example}>
            <span className={styles.exampleLabel}>
              {strings.formPage.example(salary)}
            </span>
            <Words text={section.example} figures={section.figures} />
          </div>
          {section.links !== undefined && section.links.length > 0 && (
            <div className={styles.links}>
              {section.links.map((link, at) => (
                <a key={`${at.toString()}-${link.href}`} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </section>
      ))}
      <nav aria-label={strings.formPage.related} className={styles.related}>
        <a href={contentPath(province)}>{strings.formPage.hub(place)}</a>
        <a href={contentPath(METHODOLOGY_SLUG)}>
          {strings.siteNav.methodology}
        </a>
        {salaryPageWritten === true && (
          <a href={salaryPagePath(province, exampleSalary)}>
            {strings.formPage.salaryExample(salary)}
          </a>
        )}
      </nav>
    </>
  );
}
