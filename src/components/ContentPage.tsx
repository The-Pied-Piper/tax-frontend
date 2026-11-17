import { Breadcrumb } from './Breadcrumb';
import styles from './ContentPage.module.css';
import { FormSections } from './FormSections';
import { SiteFooter } from './SiteFooter';
import { ThemeToggle } from './ThemeToggle';
import type { ContentBlock, ContentPageSpec } from '../state/contentPages';
import { THEME_TOGGLE_SLOT_ID } from '../state/themeSlot';
import { contentPath, HOME_PATH } from '../state/siteLinks';
import { strings } from '../strings';

/** One block of a section: a paragraph, a list of forms, a group of links or a table. */
function ContentBlockView({ block }: { block: ContentBlock }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <p>
          {block.content.map((part, at) =>
            typeof part === 'string' ? (
              part
            ) : (
              <a key={at} href={part.href}>
                {part.label}
              </a>
            ),
          )}
        </p>
      );
    case 'list':
      return (
        <>
          {block.title && <h3 className={styles.subheading}>{block.title}</h3>}
          <ul className={styles.formList}>
            {block.items.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <a href={item.href}>{item.label}</a>
                ) : (
                  <span className={styles.formName}>{item.label}</span>
                )}
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </>
      );
    case 'links':
      return (
        <nav aria-label={block.label}>
          <ul className={block.layout === 'grid' ? styles.grid : styles.row}>
            {block.links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      );
    case 'table':
      return (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption>{block.caption}</caption>
            <thead>
              <tr>
                {block.head.map((cell) => (
                  <th key={cell} scope="col">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, at) => (
                <tr key={at}>
                  {row.map((cell, column) => (
                    <td key={column}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** A reading page: heading, theme switch, breadcrumb, sections of blocks and the site footer. */
export function ContentPage({
  heading,
  lede,
  trail,
  sections,
  form,
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
        <Breadcrumb
          steps={[
            { label: strings.siteNav.home, href: HOME_PATH },
            ...trail.map((step) => ({
              label: step.label,
              href: contentPath(step.slug),
            })),
          ]}
          current={heading}
        />
        {form && <FormSections {...form} />}
        {sections.map((section, at) => (
          <section key={at} className={styles.section}>
            <h2>{section.heading}</h2>
            {section.blocks.map((block, line) => (
              <ContentBlockView key={line} block={block} />
            ))}
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
