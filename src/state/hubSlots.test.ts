import { HUB_CHARTS_DATA_ID, HUB_CHARTS_SLOT_ID } from './hubSlots';

describe('the hub chart ids', () => {
  it('are pinned: the build writes them and the page reads them', () => {
    expect(HUB_CHARTS_SLOT_ID).toBe('hub-charts-slot');
    expect(HUB_CHARTS_DATA_ID).toBe('hub-charts-data');
  });
});
