import sweeps from './hubNotesSweep.json';
import { cad, percent } from './units';
import type { HubChartsData, SweepEdge, SweepPoint } from '../state/hubCharts';

type Saved = {
  points: SweepPoint[];
  edges: SweepEdge[];
  facts: Record<string, string>;
};

/**
 * The full sweep (all 327 salaries) of the seven provinces, one engine run in the form the build
 * embeds: the figures of the hub-charts thread's independent sweep (tax-engine 0.6.0, identical to the 0.5.3 sweep for these seven provinces, 2026,
 * a single person with a salary only), on the return basis. The hub notes read their figures
 * from it.
 */
export function fullHubCharts(
  slugs: string[] = Object.keys(sweeps),
): HubChartsData {
  const byProvince = sweeps as unknown as Record<string, Saved>;
  return {
    provinces: slugs.map((slug) => {
      const saved = byProvince[slug];
      if (!saved) throw new Error(`No full sweep for ${slug}`);
      return {
        slug,
        year: 2026,
        provisional: true,
        unit: cad,
        rateUnit: percent,
        points: saved.points,
        edges: saved.edges,
        facts: saved.facts,
      };
    }),
  };
}
