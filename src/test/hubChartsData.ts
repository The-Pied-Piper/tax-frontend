import { strings } from '../strings';
import { sweepSalaries, type HubChartsData } from '../state/hubCharts';

const unit = strings.fallbackUnit;
const rateUnit = {
  ...strings.fallbackUnit,
  singular: '%',
  plural: '%',
  as_percentage: true,
};

/**
 * A made-up sweep with the real shape: a province per slug, a point for every
 * sweep salary. The figures are invented for tests of the card, not engine output.
 */
export function hubChartsData(
  slugs: string[] = ['ca-on'],
  provisional = true,
): HubChartsData {
  return {
    provinces: slugs.map((slug) => ({
      slug,
      year: 2026,
      provisional,
      unit,
      rateUnit,
      points: sweepSalaries().map((salary, at) => {
        const tax = (at * 10).toString();
        return [
          `${salary}.00`,
          `${salary}.50`,
          '0.00',
          `${tax}.25`,
          `0.${((at % 90) + 10).toString()}`,
          '0.2',
        ];
      }),
    })),
  };
}
