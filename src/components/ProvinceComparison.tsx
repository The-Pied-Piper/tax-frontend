import { useState, useSyncExternalStore } from 'react';
import { displayMoney, displayRate, displayWholeMoney } from '../money/format';
import { PROVINCE_COMPARISON_SLOT_ID } from '../state/hubSlots';
import { regularIndexes, type HubChartsData } from '../state/hubCharts';
import {
  allTied,
  comparisonRows,
  DEFAULT_SALARY,
  MEASURES,
  nearestSalaryIndex,
  type ComparisonRow,
  type Measure,
} from '../state/provinceComparison';
import {
  contentPath,
  METHODOLOGY_SLUG,
  salaryPagePath,
  type FooterProvinceSlug,
} from '../state/siteLinks';
import { strings } from '../strings';
import styles from './ProvinceComparison.module.css';
import { ComparisonTable } from './ComparisonTable';
import { SalarySlider } from './SalarySlider';

const LABEL_ID = `${PROVINCE_COMPARISON_SLOT_ID}-by`;
const copy = strings.hubCharts.comparison;
/** The address is read once after hydration; nothing in it changes by itself, so there is nothing to subscribe to. */
const noSubscription = () => () => undefined;
const provinceNames = new Map(Object.entries(strings.siteNav.provinceNames));

function nameOf(slug: string): string {
  return provinceNames.get(slug) ?? slug;
}

/** Where a bar goes: the province's page for the salary shown when it has one, else its hub. */
function barHref(
  data: HubChartsData,
  slug: string,
  salary: string | undefined,
): { href: string; ofSalary: boolean } {
  const whole = salary?.replace(/\.00$/, '');
  const pages = data.provinces.find(
    (sweep) => sweep.slug === slug,
  )?.salaryPages;
  return whole !== undefined && pages?.includes(whole)
    ? { href: salaryPagePath(slug, whole), ofSalary: true }
    : { href: contentPath(slug), ofSalary: false };
}

type BarLinkProps = {
  place: string;
  to: { href: string; ofSalary: boolean };
  measure: string;
  value: string;
  salary: string;
};

/** A bar's province name as a link; its accessible name says what the bar shows and where the link goes. */
function BarLink({ place, to, measure, value, salary }: BarLinkProps) {
  const name = to.ofSalary ? copy.barLinkSalaryPage : copy.barLinkHub;
  return (
    <a
      className={styles.name}
      href={to.href}
      aria-label={name(place, measure, value, salary)}
    >
      {place}
    </a>
  );
}

function figure(row: ComparisonRow, measure: Measure): string {
  return measure === 'averageRate'
    ? displayRate(row.value, row.unit)
    : displayMoney(row.value, 'annually', row.unit);
}

type Props = {
  /** The sweep of every served province. */
  data: HubChartsData;
  /** The slug of the hub the page belongs to: its bar is highlighted and is not a link. The compare page belongs to no province and passes none. */
  province?: FooterProvinceSlug;
};

// Every served province as a bar at one salary, for the measure chosen. It has
// its own salary and measure and shares nothing with the charts above it. Every
// figure is the API's text, formatted by money/format; the bars' lengths come
// from money/scale. It fetches nothing and stores nothing.
export function ProvinceComparison({ data, province }: Props) {
  // A page that belongs to no province reads its units and year from the first province of the data.
  const current =
    data.provinces.find((sweep) => sweep.slug === province) ??
    (province === undefined ? data.provinces[0] : undefined);
  // The slider has a step for each regular salary of the sweep, not for the extra points of the charts.
  const points = data.provinces[0]?.points ?? [];
  const salaries = regularIndexes(points).map((at) => points[at]?.[0] ?? '');
  // `?salary=` names a salary to open at. It is read after hydration (the page the build wrote has none), once, and the slider never writes it.
  const search = useSyncExternalStore(
    noSubscription,
    () => window.location.search,
    () => '',
  );
  const named = new URLSearchParams(search).get('salary');
  const namedAt = named === null ? -1 : salaries.indexOf(`${named}.00`);
  const start =
    namedAt >= 0 ? namedAt : nearestSalaryIndex(salaries, DEFAULT_SALARY);
  // What the reader chose; until they choose, the salary the address names, or the default.
  const [chosen, setChosen] = useState<number | null>(null);
  const index = chosen ?? start;
  // The order of the list follows the slider only once it is let go, so the rows do not jump while it is dragged.
  const [ranked, setRanked] = useState<number | null>(null);
  const rankIndex = ranked ?? start;
  // True once the list has been re-ordered by the reader, so the first view announces nothing.
  const settled = ranked !== null;
  const [measure, setMeasure] = useState<Measure>('takeHome');
  if (!current) return null;

  const salary = displayWholeMoney(
    salaries[index] ?? DEFAULT_SALARY,
    'annually',
    current.unit,
  );
  const measureName = copy.measures[measure];
  const tableCopy = copy.table;
  const rows = comparisonRows(data.provinces, index, measure, rankIndex);
  const tied = allTied(data.provinces, rankIndex);
  const settledSalary = displayWholeMoney(
    salaries[rankIndex] ?? DEFAULT_SALARY,
    'annually',
    current.unit,
  );

  return (
    <div className={styles.comparison}>
      <div className={styles.bar}>
        <span id={LABEL_ID} className={styles.barLabel}>
          {copy.toggleLabel}
        </span>
        <div
          role="radiogroup"
          aria-labelledby={LABEL_ID}
          className={styles.group}
        >
          {MEASURES.map((option) => (
            <label key={option} className={styles.option}>
              <input
                type="radio"
                name={LABEL_ID}
                value={option}
                checked={measure === option}
                onChange={() => {
                  setMeasure(option);
                }}
              />
              <span className={styles.full}>{copy.measures[option]}</span>
              <span className={styles.phone} aria-hidden="true">
                {copy.measuresPhone[option]}
              </span>
            </label>
          ))}
        </div>
      </div>
      <SalarySlider
        salaries={salaries}
        index={index}
        unit={current.unit}
        onChange={setChosen}
        onSettle={setRanked}
      />
      <div
        role="group"
        aria-label={copy.chartLabel(measureName, salary, copy.tableToggle)}
      >
        <ol className={styles.bars}>
          {rows.map((row) => (
            <li
              key={row.slug}
              className={row.slug === province ? styles.mine : styles.row}
              aria-current={row.slug === province ? 'true' : undefined}
            >
              {row.slug === province ? (
                <span className={styles.name}>{nameOf(row.slug)}</span>
              ) : (
                <BarLink
                  place={nameOf(row.slug)}
                  to={barHref(data, row.slug, salaries[index])}
                  measure={measureName}
                  value={figure(row, measure)}
                  salary={salary}
                />
              )}
              <span className={styles.track} aria-hidden="true">
                <span
                  className={styles.fill}
                  style={{ width: `${row.width}%` }}
                />
              </span>
              <span className={styles.figure}>{figure(row, measure)}</span>
            </li>
          ))}
        </ol>
      </div>
      <details className={styles.details}>
        <summary>{copy.tableToggle}</summary>
        <p className={styles.note}>
          {tableCopy.note(
            current.year,
            data.provinces.some((sweep) => sweep.provisional),
          )}{' '}
          <a href={contentPath(METHODOLOGY_SLUG)}>{copy.creditsNote}</a>
        </p>
        <p className={styles.scrollHint}>{tableCopy.scrollHint}</p>
        <ComparisonTable data={data} />
      </details>
      <p className={styles.note}>
        {tied ? copy.tied : copy.caption(salary, current.year)}
      </p>
      <p className={styles.srOnly} role="status">
        {settled &&
          (tied
            ? copy.reorderedTied(settledSalary)
            : copy.reordered(settledSalary))}
      </p>
      <p className={styles.note}>{copy.measureNotes[measure]}</p>
      <p className={styles.note}>
        <a href={contentPath(METHODOLOGY_SLUG)}>{copy.creditsNote}</a>
      </p>
      <p className={styles.note}>{copy.rankingNote}</p>
      {data.provinces.some((sweep) => sweep.provisional) && (
        <p className={styles.provisional}>{copy.provisional(current.year)}</p>
      )}
    </div>
  );
}
