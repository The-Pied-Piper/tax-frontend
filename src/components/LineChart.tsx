import { useMemo, useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import {
  isBeyond,
  nearestIndex,
  niceAxis,
  pointerPosition,
  scalePosition,
  tickLabel,
} from '../money/scale';
import styles from './LineChart.module.css';

// A point's salary and one value per series, all the API's own text.
export interface ChartPoint {
  salary: string;
  values: readonly string[];
}

export interface ChartSeries {
  id: string;
  label: string;
  /** The second line of a pair is dashed, so it never relies on colour alone. */
  dashed?: boolean;
}

type Props = {
  title: string;
  description: string;
  /** Sorted by salary. */
  points: readonly ChartPoint[];
  /** One or two lines; values[i] of each point belongs to series[i]. */
  series: readonly ChartSeries[];
  /** The salary axis runs from xMin to xMax; ticks are round salaries. */
  xMin: string;
  xMax: string;
  xTicks: readonly string[];
  xAxisLabel: string;
  yAxisLabel: string;
  /** Whether the values are dollars or fractions shown as percent. */
  yKind: 'dollars' | 'percent';
  /** A money/format formatter: the label beside the marker. */
  formatValue: (value: string) => string;
  /** The text for screen readers; the figures themselves are in the table. */
  ariaLabel: string;
  /** The shared marker: an index into points, or none. The card owns it. */
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
};

const WIDTH = 420;
const HEIGHT = 250;
const LEFT = 56;
const RIGHT = 12;
const TOP = 10;
const BOTTOM = 44;
const PLOT_RIGHT = WIDTH - RIGHT;
const PLOT_BOTTOM = HEIGHT - BOTTOM;
// The marker's figure moves to the left of the dot past 60% of the width.
const LABEL_TOP = scalePosition('22', '0', '1', 0, 1);
const LABEL_FLIPS_AFTER = scalePosition('3', '0', '5', 0, WIDTH);

// One chart of the hub card: a figure with the title, the words, the lines and
// the shared marker. Controlled and presentational: no fetch, no storage, no
// arithmetic of its own; positions come from money/scale.
export function LineChart({
  title,
  description,
  points,
  series,
  xMin,
  xMax,
  xTicks,
  xAxisLabel,
  yAxisLabel,
  yKind,
  formatValue,
  ariaLabel,
  activeIndex,
  onActiveChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const geometry = useMemo(() => {
    const axis = niceAxis(points.flatMap((point) => point.values));
    const x = (salary: string) =>
      scalePosition(salary, xMin, xMax, LEFT, PLOT_RIGHT);
    const y = (value: string) =>
      scalePosition(value, axis.min, axis.max, PLOT_BOTTOM, TOP);
    return {
      axis,
      x,
      y,
      xs: points.map((point) => x(point.salary)),
      paths: series.map((_, index) =>
        points
          .map(
            (point, at) =>
              `${at === 0 ? 'M' : 'L'}${x(point.salary)} ${y(point.values[index] ?? '0')}`,
          )
          .join(''),
      ),
    };
  }, [points, series, xMin, xMax]);

  const { axis, xs, y } = geometry;
  const active =
    activeIndex !== null && activeIndex in points ? activeIndex : undefined;
  const activeX = active === undefined ? undefined : xs[active];
  // The figure sits above its dot but never above the top of the plot.
  const dotY = y(
    (active === undefined ? undefined : points[active]?.values[0]) ?? '0',
  );
  const markerY = isBeyond(LABEL_TOP, dotY) ? LABEL_TOP : dotY;

  const choose = (event: PointerEvent<SVGRectElement>) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box || box.width <= 0 || points.length === 0) return;
    const target = pointerPosition(event.clientX - box.left, box.width, WIDTH);
    onActiveChange(nearestIndex(xs, target));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const last = points.length - 1;
    if (last < 0) return;
    const current = activeIndex === null ? null : Math.min(activeIndex, last);
    let next: number | null | undefined;
    if (event.key === 'ArrowRight') {
      next = current === null ? 0 : Math.min(last, current + 1);
    } else if (event.key === 'ArrowLeft') {
      next = current === null ? last : Math.max(0, current - 1);
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = last;
    } else if (event.key === 'Escape') {
      next = null;
    }
    if (next === undefined) return;
    event.preventDefault();
    onActiveChange(next);
  };

  const showLegend = series.length > 1;

  return (
    <figure className={styles.chart}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {axis.ticks.map((tick) => (
          <g key={`y${tick}`}>
            <line
              className={styles.grid}
              x1={LEFT}
              x2={PLOT_RIGHT}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text
              className={styles.tick}
              x={LEFT - 6}
              y={y(tick)}
              dy="0.35em"
              textAnchor="end"
            >
              {tickLabel(tick, yKind)}
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <text
            key={`x${tick}`}
            className={styles.tick}
            x={geometry.x(tick)}
            y={PLOT_BOTTOM + 14}
            textAnchor="middle"
          >
            {tickLabel(tick, 'dollars')}
          </text>
        ))}
        <text
          className={styles.tick}
          x={(LEFT + PLOT_RIGHT) / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
        >
          {xAxisLabel}
        </text>
        <text
          className={styles.tick}
          transform={`translate(11 ${String((TOP + PLOT_BOTTOM) / 2)}) rotate(-90)`}
          textAnchor="middle"
        >
          {yAxisLabel}
        </text>
        <line
          className={styles.axis}
          x1={LEFT}
          x2={PLOT_RIGHT}
          y1={PLOT_BOTTOM}
          y2={PLOT_BOTTOM}
        />
        {series.map((line, index) => (
          <path
            key={line.id}
            className={line.dashed === true ? styles.dashed : styles.line}
            d={geometry.paths[index]}
          />
        ))}
        {active !== undefined && activeX !== undefined && (
          <g aria-hidden="true">
            <line
              className={styles.cross}
              x1={activeX}
              x2={activeX}
              y1={TOP}
              y2={PLOT_BOTTOM}
            />
            {series.map((line, index) => {
              const value = points[active]?.values[index];
              return value === undefined ? null : (
                <circle
                  key={line.id}
                  className={
                    line.dashed === true ? styles.dotDashed : styles.dot
                  }
                  cx={activeX}
                  cy={y(value)}
                  r={5}
                />
              );
            })}
            <text
              className={styles.markerLabel}
              x={activeX}
              y={markerY}
              dx={isBeyond(activeX, LABEL_FLIPS_AFTER) ? -9 : 9}
              dy="-0.6em"
              textAnchor={
                isBeyond(activeX, LABEL_FLIPS_AFTER) ? 'end' : 'start'
              }
            >
              {formatValue(points[active]?.values[0] ?? '0')}
            </text>
          </g>
        )}
        <rect
          className={styles.hit}
          x={LEFT}
          y={TOP}
          width={PLOT_RIGHT - LEFT}
          height={PLOT_BOTTOM - TOP}
          onPointerMove={choose}
          onPointerDown={choose}
        />
      </svg>
      {showLegend && (
        <ul className={styles.legend}>
          {series.map((line) => (
            <li key={line.id}>
              <i
                className={
                  line.dashed === true ? styles.swatchDashed : styles.swatch
                }
              />
              {line.label}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
