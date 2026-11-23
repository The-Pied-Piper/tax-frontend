import sweeps from './hubNotesSweep.json';
import { cad, percent } from './units';
import type { HubChartsData, SweepPoint } from '../state/hubCharts';

/**
 * The full sweep (all 307 salaries) of the six provinces, one engine run in the form the build
 * embeds: the figures of the hub-charts thread's independent sweep (tax-engine 0.4.1, 2026,
 * a single person with a salary only), on the return basis. The hub notes read their figures
 * from it.
 */
export function fullHubCharts(
  slugs: string[] = Object.keys(sweeps),
): HubChartsData {
  const byProvince = sweeps as unknown as Record<string, SweepPoint[]>;
  return {
    provinces: slugs.map((slug) => {
      const points = byProvince[slug];
      if (!points) throw new Error(`No full sweep for ${slug}`);
      return {
        slug,
        year: 2026,
        provisional: true,
        unit: cad,
        rateUnit: percent,
        points,
      };
    }),
  };
}
