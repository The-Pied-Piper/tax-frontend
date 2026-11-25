import { SalaryChart } from './SalaryChart';
import { Breadcrumb } from './Breadcrumb';
import styles from './ContentPage.module.css';
import { FormSections } from './FormSections';
import { SiteFooter } from './SiteFooter';
import { ThemeToggle } from './ThemeToggle';
import { contentBreadcrumb } from '../state/breadcrumbs';
import type { ContentBlock, ContentPageSpec } from '../state/contentPages';
import type { HubChartsData } from '../state/hubCharts';
import {
  HUB_CHART_SLOT_IDS,
  PROVINCE_COMPARISON_SLOT_ID,
  RATES_CHART_SLOT_ID,
} from '../state/hubSlots';
import { chartNotes } from '../state/hubNotes';
import { ratesPageView } from '../state/ratesPage';
import { RatesChart } from './RatesChart';
import { strings } from '../strings';
import { THEME_TOGGLE_SLOT_ID } from '../state/themeSlot';
import { ProvinceComparison } from './ProvinceComparison';
import { FoldingList } from './FoldingList';

/** A table with a caption and column headings; every row has one cell per heading. */
function ContentTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: string[][];
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, at) => (
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

/** One block of a section: a paragraph, a list of forms, a group of links, a table or a hub's charts or comparison. */
function ContentBlockView({
  block,
  hubCharts,
}: {
  block: ContentBlock;
  hubCharts?: HubChartsData;
}) {
  switch (block.kind) {
    case 'salaryChart':
      return (
        <div
          id={HUB_CHART_SLOT_IDS[block.chart]}
          data-province={block.province}
        >
          {hubCharts && (
            <SalaryChart
              data={hubCharts}
              province={block.province}
              chart={block.chart}
            />
          )}
        </div>
      );
    case 'chartNotes': {
      const sweep = hubCharts?.provinces.find(
        (entry) => entry.slug === block.province,
      );
      const notes = sweep ? chartNotes(block.province, block.chart, sweep) : [];
      return notes.length === 0 ? null : (
        <FoldingList
          listClassName={styles.notes}
          data={{ 'data-chart-notes': block.chart }}
          items={notes.map((words) => ({
            key: words,
            length: words.length,
            content: words,
          }))}
        />
      );
    }
    case 'ratesChart': {
      const sweep = hubCharts?.provinces.find(
        (entry) => entry.slug === block.province,
      );
      return (
        <div id={RATES_CHART_SLOT_ID} data-province={block.province}>
          {sweep && (
            <RatesChart
              sweep={sweep}
              place={strings.siteNav.provinceNames[block.province]}
            />
          )}
        </div>
      );
    }
    case 'ratesPart': {
      const sweep = hubCharts?.provinces.find(
        (entry) => entry.slug === block.province,
      );
      const view = sweep ? ratesPageView(block.province, sweep) : null;
      if (!view) return null;
      switch (block.part) {
        case 'intro':
        case 'howToRead':
          return (
            <>
              {view[block.part].map((words) => (
                <p key={words}>{words}</p>
              ))}
            </>
          );
        case 'groups':
          return (
            <>
              {view.groups.map((group) => (
                <div key={group.heading}>
                  <h3 className={styles.chartHeading}>{group.heading}</h3>
                  <ul className={styles.notes}>
                    {group.notes.map((note) => (
                      <li key={note.words}>
                        {note.words}
                        {note.causes.length > 0 && (
                          <span className={styles.causes}>
                            {strings.ratesPage.causedBy}{' '}
                            {note.causes.map((cause, at) => (
                              <span key={cause.label}>
                                {at > 0 && ', '}
                                {cause.href ? (
                                  <a href={cause.href}>{cause.label}</a>
                                ) : (
                                  cause.label
                                )}
                              </span>
                            ))}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          );
        case 'tables':
          return (
            <>
              {view.tables.map((table) => (
                <div key={table.heading}>
                  <h3 className={styles.chartHeading}>{table.heading}</h3>
                  {table.before && <p>{table.before}</p>}
                  {table.rows.length > 0 && (
                    <ContentTable
                      caption={table.caption}
                      head={table.head}
                      rows={table.rows}
                    />
                  )}
                  {table.after && <p>{table.after}</p>}
                </div>
              ))}
            </>
          );
      }
      return null;
    }
    case 'subheading':
      return <h3 className={styles.chartHeading}>{block.text}</h3>;
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
          <FoldingList
            listClassName={styles.formList}
            foldedClassName={styles.formListFolded}
            items={block.items.map((item) => ({
              key: item.label,
              length: item.label.length + item.description.length,
              content: (
                <>
                  {item.href ? (
                    <a href={item.href}>{item.label}</a>
                  ) : (
                    <span className={styles.formName}>{item.label}</span>
                  )}
                  <p>{item.description}</p>
                </>
              ),
            }))}
          />
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
        <ContentTable
          caption={block.caption}
          head={block.head}
          rows={block.rows}
        />
      );
    case 'provinceComparison':
      // The slot the browser mounts the same component into; a hub with no
      // sweep draws nothing.
      return hubCharts?.provinces.some(
        (sweep) => sweep.slug === block.province,
      ) ? (
        <div id={PROVINCE_COMPARISON_SLOT_ID} data-province={block.province}>
          <ProvinceComparison data={hubCharts} province={block.province} />
        </div>
      ) : null;
  }
}

const cardSection = [styles.section, styles.card].join(' ');

/** A reading page: heading, theme switch, breadcrumb, sections of blocks and the site footer. A hub's charts data is what its comparison block draws from. */
export function ContentPage({
  heading,
  lede,
  trail,
  sections,
  form,
  hubCharts,
}: ContentPageSpec & { hubCharts?: HubChartsData }) {
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
        <Breadcrumb {...contentBreadcrumb({ heading, trail })} />
        {form && <FormSections {...form} />}
        {sections.map((section, at) => (
          <section
            key={at}
            id={section.id}
            className={section.card ? cardSection : styles.section}
          >
            {section.id ? (
              <div className={styles.headingRow}>
                <h2>{section.heading}</h2>
                <a
                  className={styles.permalink}
                  href={`#${section.id}`}
                  aria-label={strings.formPage.permalink(section.heading)}
                >
                  #
                </a>
              </div>
            ) : (
              <h2>{section.heading}</h2>
            )}
            {section.blocks.map((block, line) => (
              <ContentBlockView
                key={line}
                block={block}
                hubCharts={hubCharts}
              />
            ))}
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
