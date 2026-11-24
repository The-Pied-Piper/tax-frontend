import type { HubChartId } from './hubCharts';

/** The id of the data block on a province hub that holds every served province's salary sweep. */
export const HUB_CHARTS_DATA_ID = 'hub-charts-data';

/** The id of the slot in a pre-built province hub where one salary chart is mounted, one slot for each chart. Its `data-province` holds the hub's province slug. */
export const HUB_CHART_SLOT_IDS: Record<HubChartId, string> = {
  takeHome: 'hub-chart-take-home',
  averageRate: 'hub-chart-average-rate',
  marginalRate: 'hub-chart-marginal-rate',
};

/** The id of the slot in a pre-built province hub where the province comparison is mounted. Its `data-province` holds the hub's province slug. */
export const PROVINCE_COMPARISON_SLOT_ID = 'province-comparison';
