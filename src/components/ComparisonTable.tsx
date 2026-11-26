import {
  displayRateOneDecimal,
  displayRoundedMoney,
  displayWholeMoney,
} from '../money/format';
import {
  regularIndexes,
  SWEEP_COLUMN,
  type HubChartsData,
} from '../state/hubCharts';
import { strings } from '../strings';
import styles from './ProvinceComparison.module.css';

const copy = strings.hubCharts.comparison.table;
const provinceNames = new Map(Object.entries(strings.siteNav.provinceNames));

type Props = {
  /** The sweep of every served province. */
  data: HubChartsData;
};

// Every salary the chart can show, one row each, with take-home pay, income tax and the average
// tax rate of every province in the row. It is plain table markup, written into the page's HTML,
// so a reader without script (and a search engine) has all of it. Every figure is the API's text,
// rounded once for display by money/format; nothing is computed here.
export function ComparisonTable({ data }: Props) {
  const first = data.provinces[0];
  if (!first) return null;
  // Each province's regular points, in salary order; every province has the same salaries.
  const columns = data.provinces.map((sweep) => ({
    sweep,
    points: regularIndexes(sweep.points).flatMap((at) => {
      const point = sweep.points[at];
      return point ? [point] : [];
    }),
  }));
  const salaries = columns[0]?.points ?? [];
  return (
    <div
      className={styles.tableWrap}
      role="region"
      // A table wider than the screen scrolls sideways, and a keyboard reader can only scroll it by focusing it.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label={copy.scrollLabel}
    >
      <table className={styles.table}>
        <caption>{copy.caption(first.year, salaries.length)}</caption>
        <thead>
          <tr>
            <th rowSpan={2} scope="col">
              {copy.salaryHeader}
            </th>
            {columns.map(({ sweep }) => (
              <th
                key={sweep.slug}
                colSpan={3}
                scope="colgroup"
                className={styles.group3}
              >
                {provinceNames.get(sweep.slug) ?? sweep.slug}
              </th>
            ))}
          </tr>
          <tr>
            {columns.map(({ sweep }) => [
              <th key={`${sweep.slug}-t`} scope="col" className={styles.first3}>
                {copy.takeHomeHeader}
              </th>,
              <th key={`${sweep.slug}-i`} scope="col">
                {copy.takenOffHeader}
              </th>,
              <th key={`${sweep.slug}-a`} scope="col">
                {copy.averageRateHeader}
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {salaries.map((salary, row) => (
            <tr key={salary[0]}>
              <th scope="row">
                {displayWholeMoney(salary[0], 'annually', first.unit)}
              </th>
              {columns.map(({ sweep, points }) => {
                const point = points[row] ?? salary;
                return [
                  <td key={`${sweep.slug}-t`} className={styles.first3}>
                    {displayRoundedMoney(
                      point[SWEEP_COLUMN.takeHome],
                      'annually',
                      sweep.unit,
                    )}
                  </td>,
                  <td key={`${sweep.slug}-i`}>
                    {displayRoundedMoney(
                      point[SWEEP_COLUMN.deductions],
                      'annually',
                      sweep.unit,
                    )}
                  </td>,
                  <td key={`${sweep.slug}-a`}>
                    {displayRateOneDecimal(
                      point[SWEEP_COLUMN.average],
                      sweep.rateUnit,
                    )}
                  </td>,
                ];
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
