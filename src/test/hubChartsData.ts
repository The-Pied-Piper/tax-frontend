import sweeps from './hubChartsSweep.json';
import { strings } from '../strings';
import type { HubChartsData, SweepPoint } from '../state/hubCharts';

const unit = strings.fallbackUnit;
const rateUnit = {
  ...strings.fallbackUnit,
  singular: '%',
  plural: '%',
  as_percentage: true,
};

// Real tax-engine figures (2026, a single person with a salary only) for Ontario
// and Alberta, as the sweep writes them. Another slug gets Ontario's points.
const ontario = sweeps['ca-on'] as SweepPoint[];
const alberta = sweeps['ca-ab'] as SweepPoint[];

/** A sweep with the real shape and real engine figures, a province per slug. */
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
      points: slug === 'ca-ab' ? alberta : ontario,
    })),
  };
}
