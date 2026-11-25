import { useId, useMemo, useState, useSyncExternalStore } from 'react';
import { LineChart, type ChartPoint } from './LineChart';
import styles from './RatesChart.module.css';
import {
  displayRateOneDecimal,
  displayTick,
  displayWholeMoney,
} from '../money/format';
import { compareAmounts } from '../money/scale';
import {
  SWEEP_COLUMN,
  type ProvinceSweep,
  type SweepPoint,
} from '../state/hubCharts';
import { strings } from '../strings';

type Props = {
  sweep: ProvinceSweep;
  /** The province's name as the page says it, for the table's caption. */
  place: string;
};

/** The highest salary the slider can show, a step at a time; the chart always starts at $0 and opens at the first. */
export const RANGE_MAXIMA = [
  '150000',
  '200000',
  '250000',
  '300000',
  '350000',
  '400000',
  '450000',
  '500000',
] as const;

/** The labelled salaries up the axis for each maximum: every $50,000. */
const ALL_TICKS = ['50000', '100000', ...RANGE_MAXIMA] as const;
/** Past $250,000 the labels are every $100,000, or they run together. */
const SPARSE_TICKS = ['100000', '200000', '300000', '400000'] as const;

/** Salaries below this are the Employment Insurance band, which must not set the scale. */
const BAND_CEILING = '5000';

/** The address is read once after hydration; nothing in it changes by itself, so there is nothing to subscribe to. */
const noSubscription = () => () => undefined;

/** The sweep's salary as text for the address: `70000.00` is `70000`. */
function salaryParam(salary: string): string {
  return salary.replace(/\.00$/, '');
}

/** The index of the point the address names with `?salary=`, if it is a whole-dollar salary the sweep holds. */
function pointFromAddress(sweep: ProvinceSweep, search: string): number | null {
  const wanted = new URLSearchParams(search).get('salary');
  if (wanted === null || !/^[1-9]\d{0,6}$/.test(wanted)) return null;
  const at = sweep.points.findIndex((point) => point[0] === `${wanted}.00`);
  return at < 0 ? null : at;
}

/** The rates page's chart: both rates against salary, a slider for the highest salary shown, and the figures as a closed table. */
export function RatesChart({ sweep, place }: Props) {
  const t = strings.ratesPage;
  const { points, unit, rateUnit } = sweep;
  // A salary in the address is read after hydration (the static page has none), so the first render matches the page.
  const search = useSyncExternalStore(
    noSubscription,
    () => window.location.search,
    () => '',
  );
  const fromAddress = useMemo(() => {
    const at = pointFromAddress(sweep, search);
    if (at === null) return null;
    const needed = RANGE_MAXIMA.findIndex(
      (limit) => compareAmounts(sweep.points[at]?.[0] ?? '0', limit) <= 0,
    );
    return { at, range: needed < 0 ? RANGE_MAXIMA.length - 1 : needed };
  }, [sweep, search]);
  const [rangePick, setRangePick] = useState<number | null>(null);
  const [markerPick, setMarkerPick] = useState<number | null | undefined>(
    undefined,
  );
  const range = rangePick ?? fromAddress?.range ?? 0;
  const marker =
    markerPick === undefined ? (fromAddress?.at ?? null) : markerPick;
  const sliderId = useId();
  const max = RANGE_MAXIMA[range] ?? RANGE_MAXIMA[0];

  const visible = useMemo(
    () => points.filter((point) => compareAmounts(point[0], max) <= 0),
    [points, max],
  );
  const series = useMemo(
    (): ChartPoint[] =>
      visible.map((point) => ({
        salary: point[0],
        values: [point[SWEEP_COLUMN.marginal], point[SWEEP_COLUMN.average]],
      })),
    [visible],
  );
  // The $2,000 band (100%) is left out of the scale; a note says where it goes off the top.
  const scaleValues = useMemo(
    () =>
      series
        .filter((point) => compareAmounts(point.salary, BAND_CEILING) >= 0)
        .flatMap((point) => point.values),
    [series],
  );
  const bandNote = useMemo(() => {
    const low = series.filter(
      (point) => compareAmounts(point.salary, BAND_CEILING) < 0,
    );
    let top = '0';
    for (const point of low) {
      const value = point.values[0] ?? '0';
      if (compareAmounts(value, top) > 0) top = value;
    }
    const scaleTop = scaleValues.reduce(
      (high, value) => (compareAmounts(value, high) > 0 ? value : high),
      '0',
    );
    const from = sweep.facts['ei_exemption'];
    const to = sweep.facts['ei_band_end'];
    if (compareAmounts(top, scaleTop) <= 0 || !from || !to) return undefined;
    return t.topNote(
      displayRateOneDecimal(top, rateUnit),
      displayWholeMoney(from, 'annually', unit),
      displayWholeMoney(to, 'annually', unit),
    );
  }, [series, scaleValues, sweep.facts, rateUnit, unit, t]);

  const everyTick =
    compareAmounts(max, '250000') <= 0 ? ALL_TICKS : SPARSE_TICKS;
  const ticks = [
    ...everyTick.filter((tick) => compareAmounts(tick, max) <= 0),
    ...(everyTick === SPARSE_TICKS && max === '500000' ? ['500000'] : []),
  ];
  const active = marker !== null && marker < visible.length ? marker : null;
  const activePoint = active === null ? undefined : visible[active];
  const from = displayWholeMoney('0', 'annually', unit);
  const to = displayWholeMoney(max, 'annually', unit);

  /** The address names the picked salary; only this changes it, never the slider. */
  function linkToSalary(point: SweepPoint) {
    const url = new URL(window.location.href);
    url.searchParams.set('salary', salaryParam(point[0]));
    window.history.replaceState(null, '', url);
  }

  return (
    <div className={styles.card}>
      {activePoint ? (
        <p className={styles.readout} aria-live="polite">
          {t.readout(
            displayWholeMoney(activePoint[0], 'annually', unit),
            displayRateOneDecimal(activePoint[SWEEP_COLUMN.marginal], rateUnit),
            displayRateOneDecimal(activePoint[SWEEP_COLUMN.average], rateUnit),
          )}
        </p>
      ) : (
        <p className={styles.hint}>{t.hint}</p>
      )}
      <LineChart
        points={series}
        series={[
          { id: 'marginal', label: t.marginal },
          { id: 'average', label: t.average, dashed: true },
        ]}
        xMin="0"
        xMax={max}
        xTicks={ticks}
        xTicksPhone={[max]}
        xAxisLabel={t.salaryAxis}
        yAxisLabel={t.percent}
        xUnit={unit}
        yUnit={rateUnit}
        formatValue={(value) => displayRateOneDecimal(value, rateUnit)}
        ariaLabel={t.chartLabel(from, to)}
        activeIndex={active}
        onActiveChange={setMarkerPick}
        scaleValues={scaleValues}
        markerLabel={false}
        topNote={bandNote}
      />
      {activePoint && (
        <p className={styles.linkRow}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => {
              linkToSalary(activePoint);
            }}
          >
            {t.linkToSalary}
          </button>
        </p>
      )}
      <label className={styles.range} htmlFor={sliderId}>
        {t.sliderLabel}
        <input
          id={sliderId}
          type="range"
          min={0}
          max={RANGE_MAXIMA.length - 1}
          step={1}
          value={range}
          aria-valuetext={t.sliderValueText(to)}
          onChange={(event) => {
            setRangePick(
              RANGE_MAXIMA.findIndex(
                (_, at) => at.toString() === event.currentTarget.value,
              ),
            );
          }}
        />
        <span className={styles.steps} aria-hidden="true">
          {RANGE_MAXIMA.map((limit, at) => (
            <span key={limit} className={at % 2 === 1 ? styles.stepsEven : ''}>
              {displayTick(limit, unit)}
            </span>
          ))}
        </span>
      </label>
      <details className={styles.details}>
        <summary>{t.tableShow}</summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption>
              {t.tableCaption(place, sweep.year, points.length)}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t.salaryHeader}</th>
                <th scope="col">{t.marginalHeader}</th>
                <th scope="col">{t.averageHeader}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point[0]}>
                  <th scope="row">
                    {displayWholeMoney(point[0], 'annually', unit)}
                  </th>
                  <td>
                    {displayRateOneDecimal(
                      point[SWEEP_COLUMN.marginal],
                      rateUnit,
                    )}
                  </td>
                  <td>
                    {displayRateOneDecimal(
                      point[SWEEP_COLUMN.average],
                      rateUnit,
                    )}
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
