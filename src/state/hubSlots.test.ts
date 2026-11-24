import {
  HUB_CHARTS_DATA_ID,
  HUB_CHART_SLOT_IDS,
  PROVINCE_COMPARISON_SLOT_ID,
} from './hubSlots';

describe('the hub chart ids', () => {
  it('are pinned: the build writes them and the page reads them', () => {
    expect(HUB_CHART_SLOT_IDS).toEqual({
      takeHome: 'hub-chart-take-home',
      averageRate: 'hub-chart-average-rate',
      marginalRate: 'hub-chart-marginal-rate',
    });
    expect(HUB_CHARTS_DATA_ID).toBe('hub-charts-data');
    expect(PROVINCE_COMPARISON_SLOT_ID).toBe('province-comparison');
  });
});
