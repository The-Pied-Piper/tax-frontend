import { useMemo, useState } from 'react';
import { ChartPeriodSwitch } from './ChartPeriodSwitch';
import { LineChart, type ChartPoint } from './LineChart';
import styles from './SalaryChart.module.css';
import {
  displayMoney,
  displayRate,
  displayRateOneDecimal,
  displayRoundedMoney,
  displayWholeMoney,
} from '../money/format';
import { amountForPeriod } from '../money/payPeriod';
import {
  CHART_COLUMN,
  defaultIndex,
  isRateChart,
  SALARY_AXIS,
  type HubChartId,
  type HubChartsData,
  type ProvinceSweep,
} from '../state/hubCharts';
import {
  setChartMarker,
  setChartPeriod,
  useHubChartView,
} from '../state/hubChartView';
import type { FooterProvinceSlug } from '../state/siteLinks';
import { strings } from '../strings';

type Props = {
  data: HubChartsData;
  province: FooterProvinceSlug;
  chart: HubChartId;
};

/** One salary chart of a province hub, from the sweep in the hub's data block, with the table of its figures. Draws nothing for a province with no sweep. */
export function SalaryChart({ data, province, chart }: Props) {
  const sweep = data.provinces.find((entry) => entry.slug === province);
  if (!sweep) return null;
  return <Chart sweep={sweep} chart={chart} />;
}

function yAxisLabel(chart: HubChartId, dollars: string): string {
  const t = strings.hubCharts;
  return isRateChart(chart) ? t.percent : dollars;
}

function Chart({ sweep, chart }: { sweep: ProvinceSweep; chart: HubChartId }) {
  const t = strings.hubCharts;
  const words = t.charts[chart];
  const { period, marker } = useHubChartView();
  const { unit, rateUnit, points } = sweep;
  const [tableOpen, setTableOpen] = useState(false);
  const rate = isRateChart(chart);
  const column = CHART_COLUMN[chart];
  // Rates ignore Per month; money is divided by 12 through money/.
  const shown = rate ? 'annually' : period;
  const active = marker ?? defaultIndex(points);
  const first = points[0]?.[0] ?? '0';
  const last = points[points.length - 1]?.[0] ?? '0';
  const from = displayWholeMoney(first, 'annually', unit);
  const to = displayWholeMoney(last, 'annually', unit);
  const salaryAt = displayWholeMoney(
    points[active]?.[0] ?? first,
    'annually',
    unit,
  );

  const series = useMemo(
    (): ChartPoint[] =>
      points.map((point) => {
        const value = point[column] ?? '0';
        return {
          salary: point[0],
          values: [
            shown === 'annually' ? value : amountForPeriod(value, shown),
          ],
        };
      }),
    [points, column, shown],
  );

  return (
    <div className={styles.card}>
      {!rate && (
        <div className={styles.bar}>
          <ChartPeriodSwitch value={period} onChange={setChartPeriod} />
        </div>
      )}
      <LineChart
        points={series}
        series={[{ id: chart, label: words.title }]}
        xMin={SALARY_AXIS.min}
        xMax={SALARY_AXIS.max}
        xTicks={SALARY_AXIS.ticks}
        xTicksPhone={SALARY_AXIS.phoneTicks}
        xAxisLabel={t.salaryAxis}
        yAxisLabel={yAxisLabel(
          chart,
          period === 'monthly' ? t.dollarsMonth : t.dollarsYear,
        )}
        xUnit={unit}
        yUnit={rate ? rateUnit : unit}
        formatValue={(value) =>
          t.hover(
            salaryAt,
            rate
              ? displayRateOneDecimal(value, rateUnit)
              : displayRoundedMoney(value, 'annually', unit),
          )
        }
        ariaLabel={t.chartLabel(words.title, from, to)}
        activeIndex={active}
        // Escape clears the marker; it goes back to its first place.
        onActiveChange={(index) => {
          setChartMarker(index);
        }}
      />
      {/* One announcement for the four charts, which share the marker: the take-home chart's. */}
      {chart === 'takeHome' && (
        <p className={styles.visuallyHidden} aria-live="polite">
          {t.readout(salaryAt)}
        </p>
      )}
      <p className={styles.note}>{t.note}</p>
      <details
        className={styles.details}
        open={tableOpen}
        onToggle={(event) => {
          setTableOpen(event.currentTarget.open);
        }}
      >
        <summary>{tableOpen ? t.hideTable : t.showTable}</summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t.salaryHeader}</th>
                <th scope="col">{words.header}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point[0]}>
                  <th scope="row">
                    {displayWholeMoney(point[0], 'annually', unit)}
                  </th>
                  <td>
                    {rate
                      ? displayRate(point[column] ?? '0', rateUnit)
                      : displayMoney(point[column] ?? '0', shown, unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
