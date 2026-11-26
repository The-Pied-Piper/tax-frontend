import { useId, useMemo, useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import {
  isBeyond,
  nearestIndex,
  niceAxis,
  pointerPosition,
  scalePosition,
} from '../money/scale';
import { displayTick, type MoneyUnit } from '../money/format';
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
  /** Sorted by salary. */
  points: readonly ChartPoint[];
  /** One or two lines; values[i] of each point belongs to series[i]. */
  series: readonly ChartSeries[];
  /** The salary axis runs from xMin to xMax; ticks are round salaries. */
  xMin: string;
  xMax: string;
  xTicks: readonly string[];
  /** The round salaries labelled on a phone instead of xTicks; the last one ends the axis. */
  xTicksPhone: readonly string[];
  xAxisLabel: string;
  yAxisLabel: string;
  /** The API's units for the salary axis and for the values (a percent for a rate). */
  xUnit: MoneyUnit;
  yUnit: MoneyUnit;
  /** A money/format formatter: the label beside the marker. */
  formatValue: (value: string) => string;
  /** The text for screen readers. */
  ariaLabel: string;
  /** The shared marker: an index into points, or none. The card owns it. */
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
  /**
   * The values that set the vertical scale, when some points should not (the narrow Employment Insurance band
   * that rises to 100%): the lines are cut at the top of the plot instead. Defaults to every value.
   */
  scaleValues?: readonly string[];
  /** False leaves the figure beside the marker out, for a card that shows it in a readout of its own. */
  markerLabel?: boolean;
  /**
   * Lines of text for the label beside each series' dot at a point, one entry per series, when one figure is
   * not enough (a chart of two rates: each rate hovers by its own dot). Replaces the single figure from
   * formatValue; markerLabel false still leaves the labels out.
   */
  markerLabels?: (index: number) => readonly (readonly string[])[];
  /**
   * The text that hovers beside the salary axis at the marker's position (the salary of the picked point), in the
   * same style as the labels beside the dots. Left out when not given.
   */
  markerAxisLabel?: (index: number) => string;
  /** The drawing's height in its own units (its width is fixed); taller fits a narrow screen. */
  height?: number;
};

// Beyond this many labels up the side, a phone hides every other one (in CSS).
const PHONE_MAX_Y_LABELS = 4;
const WIDTH = 420;
/** The drawing's height when the caller gives none; a phone can ask for a taller one. */
const DEFAULT_HEIGHT = 250;
const LEFT = 56;
const RIGHT = 12;
const TOP = 10;
const BOTTOM = 44;
const PLOT_RIGHT = WIDTH - RIGHT;
// The axis label is centred on the marker, but starts at it near the left edge and ends at it near the right.
const AXIS_LABEL_STARTS_BEFORE = scalePosition('1', '0', '5', 0, WIDTH);
const AXIS_LABEL_ENDS_AFTER = scalePosition('4', '0', '5', 0, WIDTH);
// Its baseline is this far below the axis line: between the salary labels and the axis title.
const AXIS_LABEL_DROP = 27;
// The marker's figure moves to the left of the dot past 60% of the width.
const LABEL_FLIPS_AFTER = scalePosition('3', '0', '5', 0, WIDTH);

/** The line height of a multi-line marker label, in em, and its font size in drawing units. */
const LINE_EM = 1.25;
/** One extra line of a label is this many drawing units taller (1.25 em of 11). */
const LINE_STEP = 14;

/**
 * Where each label beside a dot goes: its lines and the y its text starts from. With several series the topmost
 * dot's label ends just above it and the others start just below theirs, so two close dots never share a place.
 * Every label is kept inside the plot: a block below its dot stops short of the axis line, and the topmost
 * dot's block stops just above it when `several`, so the blocks never run into each other or off the bottom.
 */
function markerBlocks(
  blocks: readonly (readonly string[])[],
  dots: readonly string[],
  several: boolean,
  plotBottom: number,
) {
  const top = dots.reduce(
    (best, dot, index) => (isBeyond(dots[best] ?? dot, dot) ? index : best),
    0,
  );
  const topExtra = Math.max(0, (blocks[top]?.length ?? 1) - 1) * LINE_STEP;
  return blocks.map((block, index) => {
    const dot = dots[index] ?? '0';
    const extra = Math.max(0, block.length - 1) * LINE_STEP;
    const below = several && index !== top;
    // Highest a block may start from: the figure clears the top of the plot; a block below its dot also stays
    // a line under the topmost block (which is held at the top of the plot when its dot is there).
    const least = scalePosition(
      String(below ? 22 + topExtra - 5 : 22 + extra),
      '0',
      '1',
      0,
      1,
    );
    // Lowest: a block below its dot stops short of the axis line; the topmost block stops just above it.
    const most = scalePosition(
      String(below ? plotBottom - 14 - extra : plotBottom - 10),
      '0',
      '1',
      0,
      1,
    );
    const lowered = several && isBeyond(dot, most) ? most : dot;
    return { block, below, at: isBeyond(least, lowered) ? least : lowered };
  });
}

// One chart of a hub: a figure with the lines and
// the shared marker. Controlled and presentational: no fetch, no storage, no
// arithmetic of its own; positions come from money/scale.
export function LineChart({
  points,
  series,
  xMin,
  xMax,
  xTicks,
  xTicksPhone,
  xAxisLabel,
  yAxisLabel,
  xUnit,
  yUnit,
  formatValue,
  ariaLabel,
  activeIndex,
  onActiveChange,
  scaleValues,
  markerLabel = true,
  markerLabels,
  markerAxisLabel,
  height = DEFAULT_HEIGHT,
}: Props) {
  const plotBottom = height - BOTTOM;
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useId();

  const geometry = useMemo(() => {
    const axis = niceAxis(
      scaleValues ?? points.flatMap((point) => point.values),
    );
    const x = (salary: string) =>
      scalePosition(salary, xMin, xMax, LEFT, PLOT_RIGHT);
    const y = (value: string) =>
      scalePosition(value, axis.min, axis.max, plotBottom, TOP);
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
  }, [points, series, xMin, xMax, scaleValues, plotBottom]);

  const { axis, xs, y } = geometry;
  // On a phone, an axis with more than four labels shows every other one.
  const phoneHidesY = axis.ticks.length > PHONE_MAX_Y_LABELS;
  // The one that stays is the zero line's, so the labels shown are zero and every other tick from it.
  const zeroAt = Math.max(
    0,
    axis.ticks.findIndex((tick) => /^-?0(\.0+)?$/.test(tick)),
  );
  const active =
    activeIndex !== null && activeIndex in points ? activeIndex : undefined;
  const activeX = active === undefined ? undefined : xs[active];
  const labels =
    active === undefined
      ? []
      : markerBlocks(
          markerLabels
            ? markerLabels(active)
            : [[formatValue(points[active]?.values[0] ?? '0')]],
          (points[active]?.values ?? []).map((value) => y(value)),
          markerLabels !== undefined,
          plotBottom,
        );

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
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${String(WIDTH)} ${String(height)}`}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {axis.ticks.map((tick, at) => (
          <g key={`y${tick}`}>
            <line
              className={styles.grid}
              x1={LEFT}
              x2={PLOT_RIGHT}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text
              className={
                phoneHidesY && (at - zeroAt) % 2 !== 0
                  ? [styles.tick, styles.desktopOnly].join(' ')
                  : styles.tick
              }
              x={LEFT - 6}
              y={y(tick)}
              dy="0.35em"
              textAnchor="end"
            >
              {displayTick(tick, yUnit)}
            </text>
          </g>
        ))}
        {[...new Set([...xTicks, ...xTicksPhone])].map((tick) => {
          const onDesktop = xTicks.includes(tick);
          const onPhone = xTicksPhone.includes(tick);
          const labelClasses = onDesktop
            ? onPhone
              ? [styles.tick]
              : [styles.tick, styles.desktopOnly]
            : [styles.tick, styles.phoneOnly];
          // The last label is right-aligned on a phone so it stays inside the drawing's edge.
          const ends = tick === xTicksPhone[xTicksPhone.length - 1];
          return (
            <text
              key={`x${tick}`}
              className={(ends
                ? [...labelClasses, styles.phoneEnd]
                : labelClasses
              ).join(' ')}
              x={geometry.x(tick)}
              y={plotBottom + 14}
              // A label at the end of the axis is right-aligned on every screen, so it is not cut off at the edge.
              textAnchor={tick === xMax ? 'end' : 'middle'}
            >
              {displayTick(tick, xUnit)}
            </text>
          );
        })}
        <text
          className={[styles.tick, styles.title].join(' ')}
          x={(LEFT + PLOT_RIGHT) / 2}
          y={height - 4}
          textAnchor="middle"
        >
          {xAxisLabel}
        </text>
        <text
          className={[styles.tick, styles.title, styles.yTitle].join(' ')}
          transform={`translate(11 ${String((TOP + plotBottom) / 2)}) rotate(-90)`}
          textAnchor="middle"
        >
          {yAxisLabel}
        </text>
        <line
          className={styles.axis}
          x1={LEFT}
          x2={PLOT_RIGHT}
          y1={plotBottom}
          y2={plotBottom}
        />
        <clipPath id={clipId}>
          <rect
            x={LEFT}
            y={TOP}
            width={PLOT_RIGHT - LEFT}
            height={plotBottom - TOP}
          />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          {series.map((line, index) => (
            <path
              key={line.id}
              className={line.dashed === true ? styles.dashed : styles.line}
              d={geometry.paths[index]}
            />
          ))}
        </g>
        {active !== undefined && activeX !== undefined && (
          <g aria-hidden="true">
            <line
              className={styles.cross}
              x1={activeX}
              x2={activeX}
              y1={TOP}
              y2={plotBottom}
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
            {markerLabel &&
              labels.map(({ block, below, at }, label) => (
                <text
                  key={series[label]?.id ?? String(label)}
                  className={styles.markerLabel}
                  x={activeX}
                  y={at}
                  dx={isBeyond(activeX, LABEL_FLIPS_AFTER) ? -9 : 9}
                  textAnchor={
                    isBeyond(activeX, LABEL_FLIPS_AFTER) ? 'end' : 'start'
                  }
                >
                  {block.map((line, row) => (
                    <tspan
                      key={`${String(row)}${line}`}
                      x={activeX}
                      dy={
                        row > 0
                          ? `${String(LINE_EM)}em`
                          : below
                            ? '1.1em'
                            : `${String(-0.6 - (block.length - 1) * LINE_EM)}em`
                      }
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              ))}
            {markerLabel && markerAxisLabel && (
              <text
                className={styles.markerLabel}
                x={activeX}
                y={plotBottom + AXIS_LABEL_DROP}
                textAnchor={
                  isBeyond(AXIS_LABEL_STARTS_BEFORE, activeX)
                    ? 'start'
                    : isBeyond(activeX, AXIS_LABEL_ENDS_AFTER)
                      ? 'end'
                      : 'middle'
                }
              >
                {markerAxisLabel(active)}
              </text>
            )}
          </g>
        )}
        <rect
          className={styles.hit}
          x={LEFT}
          y={TOP}
          width={PLOT_RIGHT - LEFT}
          height={plotBottom - TOP}
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
