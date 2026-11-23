import { useState } from 'react';
import { displayMoney, displayRate, displayWholeMoney } from '../money/format';
import { PROVINCE_COMPARISON_SLOT_ID } from '../state/hubSlots';
import { regularIndexes, type HubChartsData } from '../state/hubCharts';
import {
  comparisonRows,
  DEFAULT_SALARY,
  MEASURES,
  nearestSalaryIndex,
  type ComparisonRow,
  type Measure,
} from '../state/provinceComparison';
import { contentPath, type FooterProvinceSlug } from '../state/siteLinks';
import { strings } from '../strings';
import styles from './ProvinceComparison.module.css';
import { SalarySlider } from './SalarySlider';

const LABEL_ID = `${PROVINCE_COMPARISON_SLOT_ID}-by`;
const copy = strings.hubCharts.comparison;
const provinceNames = new Map(Object.entries(strings.siteNav.provinceNames));

function nameOf(slug: string): string {
  return provinceNames.get(slug) ?? slug;
}

function figure(row: ComparisonRow, measure: Measure): string {
  return measure === 'averageRate'
    ? displayRate(row.value, row.unit)
    : displayMoney(row.value, 'annually', row.unit);
}

type Props = {
  /** The sweep of every served province. */
  data: HubChartsData;
  /** The slug of the hub the page belongs to: its bar is highlighted and is not a link. */
  province: FooterProvinceSlug;
};

// Every served province as a bar at one salary, for the measure chosen. It has
// its own salary and measure and shares nothing with the charts above it. Every
// figure is the API's text, formatted by money/format; the bars' lengths come
// from money/scale. It fetches nothing and stores nothing.
export function ProvinceComparison({ data, province }: Props) {
  const current = data.provinces.find((sweep) => sweep.slug === province);
  // The slider has a step for each regular salary of the sweep, not for the extra points of the charts.
  const points = data.provinces[0]?.points ?? [];
  const pointIndexes = regularIndexes(points);
  const salaries = pointIndexes.map((at) => points[at]?.[0] ?? '');
  const [index, setIndex] = useState(() =>
    nearestSalaryIndex(salaries, DEFAULT_SALARY),
  );
  const [measure, setMeasure] = useState<Measure>('takeHome');
  if (!current) return null;

  const salary = displayWholeMoney(
    salaries[index] ?? DEFAULT_SALARY,
    'annually',
    current.unit,
  );
  const measureName = copy.measures[measure];
  const rows = comparisonRows(
    data.provinces,
    pointIndexes[index] ?? 0,
    measure,
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
              {copy.measures[option]}
            </label>
          ))}
        </div>
      </div>
      <SalarySlider
        salaries={salaries}
        index={index}
        unit={current.unit}
        onChange={setIndex}
      />
      <div role="group" aria-label={copy.chartLabel(measureName, salary)}>
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
                <a className={styles.name} href={contentPath(row.slug)}>
                  {nameOf(row.slug)}
                </a>
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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{copy.tableProvince}</th>
                <th scope="col">{measureName}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug}>
                  <th scope="row">{nameOf(row.slug)}</th>
                  <td>{figure(row, measure)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className={styles.note} aria-live="polite">
        {copy.caption(salary, current.year)}
      </p>
      <p className={styles.note}>{copy.measureNotes[measure]}</p>
      {data.provinces.some((sweep) => sweep.provisional) && (
        <p className={styles.provisional}>{copy.provisional(current.year)}</p>
      )}
    </div>
  );
}
