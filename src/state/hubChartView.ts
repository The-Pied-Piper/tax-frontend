import { useSyncExternalStore } from 'react';
import type { PayPeriod } from '../money/payPeriod';

/** The two periods the hub charts show: the yearly figure, or it divided by 12. */
export type ChartPeriod = Extract<PayPeriod, 'annually' | 'monthly'>;

/**
 * What the charts of one hub share while the page is open: the period of the money
 * charts and the marker (an index into the sweep's points, or null for its first
 * place). Each chart is mounted in its own section, so the state lives here and not in a parent.
 */
export type HubChartView = { period: ChartPeriod; marker: number | null };

const FIRST_VIEW: HubChartView = { period: 'annually', marker: null };

let view = FIRST_VIEW;
const listeners = new Set<() => void>();

function change(next: HubChartView) {
  view = next;
  listeners.forEach((listener) => {
    listener();
  });
}

export function setChartPeriod(period: ChartPeriod) {
  change({ ...view, period });
}

/** Moves the marker; null puts it back to its first place. */
export function setChartMarker(marker: number | null) {
  change({ ...view, marker });
}

/** Back to the first view. Only tests need it: a page starts there. */
export function resetChartView() {
  change(FIRST_VIEW);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The shared view. The static page and the first hydrated render use the first view. */
export function useHubChartView(): HubChartView {
  return useSyncExternalStore(
    subscribe,
    () => view,
    () => FIRST_VIEW,
  );
}
