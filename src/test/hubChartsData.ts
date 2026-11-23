import sweeps from './hubChartsSweep.json';
import { strings } from '../strings';
import type { HubChartsData, SweepEdge, SweepPoint } from '../state/hubCharts';

type Saved = {
  points: SweepPoint[];
  edges: SweepEdge[];
  facts: Record<string, string>;
};

const unit = strings.fallbackUnit;
const rateUnit = {
  ...strings.fallbackUnit,
  placement: 'after' as const,
  singular: '%',
  plural: '%',
  as_percentage: true,
};

// Real tax-engine figures (2026, a single person with a salary only) for Ontario
// and Alberta, as the sweep writes them. Another slug gets Ontario's points.
const ontario = sweeps['ca-on'] as unknown as Saved;
const alberta = sweeps['ca-ab'] as unknown as Saved;

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
      ...(slug === 'ca-ab' ? alberta : ontario),
    })),
  };
}
