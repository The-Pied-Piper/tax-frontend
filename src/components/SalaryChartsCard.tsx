import { useMemo, useState } from 'react';
import { LineChart, type ChartPoint } from './LineChart';
import styles from './SalaryChartsCard.module.css';
import { displayMoney, displayRate, displayWholeMoney } from '../money/format';
import { amountForPeriod, type PayPeriod } from '../money/payPeriod';
import {
  CHART_COLUMN,
  defaultIndex,
  SALARY_AXIS,
  type HubChartsData,
  type ProvinceSweep,
} from '../state/hubCharts';
import type { FooterProvinceSlug } from '../state/siteLinks';
import { strings } from '../strings';

type Props = { data: HubChartsData; province: FooterProvinceSlug };

type Period = Extract<PayPeriod, 'annually' | 'monthly'>;

// One chart of the card: its words, the column it reads and whether it is a rate.
type ChartSpec = {
  id: string;
  title: string;
  description: string;
  column: number;
  rate: boolean;
  yAxisLabel: string;
};

function chartSpecs(place: string, period: Period): ChartSpec[] {
  const t = strings.hubCharts;
  const dollars = period === 'monthly' ? t.dollarsMonth : t.dollarsYear;
  return [
    {
      id: 'average',
      title: t.averageTitle,
      description: t.averageText(place),
      column: CHART_COLUMN.averageRate,
      rate: true,
      yAxisLabel: t.percentOfSalary,
    },
    {
      id: 'marginal',
      title: t.marginalTitle,
      description: t.marginalText(place),
      column: CHART_COLUMN.marginalRate,
      rate: true,
      yAxisLabel: t.percentOfExtra,
    },
    {
      id: 'take-home',
      title: t.takeHomeTitle,
      description: t.takeHomeText,
      column: CHART_COLUMN.takeHome,
      rate: false,
      yAxisLabel: dollars,
    },
    {
      id: 'income-tax',
      title: t.incomeTaxTitle,
      description: t.incomeTaxText(place),
      column: CHART_COLUMN.incomeTax,
      rate: false,
      yAxisLabel: dollars,
    },
  ];
}

/** The salary charts of one province hub, from the sweep in the hub's data block. Draws nothing for a province with no sweep. */
export function SalaryChartsCard({ data, province }: Props) {
  const sweep = data.provinces.find((entry) => entry.slug === province);
  if (!sweep) return null;
  return <Card sweep={sweep} place={strings.siteNav.provinceNames[province]} />;
}

function Card({ sweep, place }: { sweep: ProvinceSweep; place: string }) {
  const t = strings.hubCharts;
  const [period, setPeriod] = useState<Period>('annually');
  const [active, setActive] = useState(defaultIndex());
  const [tableOpen, setTableOpen] = useState(false);
  const { unit, rateUnit, points } = sweep;
  const specs = chartSpecs(place, period);
  const first = points[0]?.[0] ?? '0';
  const last = points[points.length - 1]?.[0] ?? '0';
  const from = displayWholeMoney(first, 'annually', unit);
  const to = displayWholeMoney(last, 'annually', unit);
  const salaryAt = displayWholeMoney(
    points[active]?.[0] ?? first,
    'annually',
    unit,
  );

  // Rates ignore Per month; money is divided by 12 through money/.
  const series = useMemo(
    () =>
      specs.map((spec): ChartPoint[] =>
        points.map((point) => {
          const value = point[spec.column] ?? '0';
          return {
            salary: point[0],
            values: [
              spec.rate || period === 'annually'
                ? value
                : amountForPeriod(value, 'monthly'),
            ],
          };
        }),
      ),
    // specs only changes with period and the province's name, both covered here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, period, place],
  );

  return (
    <div className={styles.card}>
      <p className={styles.intro}>{t.intro('four')}</p>
      <div className={styles.bar}>
        <div className={styles.switch}>
          {(
            [
              ['annually', t.perYear],
              ['monthly', t.perMonth],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => {
                setPeriod(value);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className={styles.readout} aria-live="polite">
          {t.readout(salaryAt)}
        </p>
      </div>
      <div className={styles.grid}>
        {specs.map((spec, at) => (
          <LineChart
            key={spec.id}
            title={spec.title}
            description={spec.description}
            points={series[at] ?? []}
            series={[{ id: spec.id, label: spec.title }]}
            xMin={SALARY_AXIS.min}
            xMax={SALARY_AXIS.max}
            xTicks={SALARY_AXIS.ticks}
            xAxisLabel={t.salaryAxis}
            yAxisLabel={spec.yAxisLabel}
            xUnit={unit}
            yUnit={spec.rate ? rateUnit : unit}
            formatValue={(value) =>
              spec.rate
                ? displayRate(value, rateUnit)
                : displayMoney(value, 'annually', unit)
            }
            ariaLabel={t.chartLabel(spec.title, from, to)}
            activeIndex={active}
            // Escape clears the marker; it goes back to its first place.
            onActiveChange={(index) => {
              setActive(index ?? defaultIndex());
            }}
          />
        ))}
      </div>
      <p className={styles.note}>{t.monthNote}</p>
      <p className={styles.note}>
        {t.note}
        {sweep.provisional && (
          <span className={styles.provisional}>
            {' '}
            {t.provisional(sweep.year)}
          </span>
        )}
      </p>
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
                <th scope="col">{t.headers.salary}</th>
                <th scope="col">{t.headers.average}</th>
                <th scope="col">{t.headers.marginal}</th>
                <th scope="col">{t.headers.takeHome}</th>
                <th scope="col">{t.headers.incomeTax}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point[0]}>
                  <th scope="row">
                    {displayWholeMoney(point[0], 'annually', unit)}
                  </th>
                  <td>
                    {displayRate(point[CHART_COLUMN.averageRate], rateUnit)}
                  </td>
                  <td>
                    {displayRate(point[CHART_COLUMN.marginalRate], rateUnit)}
                  </td>
                  <td>
                    {displayMoney(point[CHART_COLUMN.takeHome], period, unit)}
                  </td>
                  <td>
                    {displayMoney(point[CHART_COLUMN.incomeTax], period, unit)}
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
