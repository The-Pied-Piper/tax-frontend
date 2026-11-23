import { hydrateRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ContentPage } from '../../src/components/ContentPage';
import { SalaryChart } from '../../src/components/SalaryChart';
import { HUB_CHART_IDS } from '../../src/state/hubCharts';
import { HUB_CHART_SLOT_IDS } from '../../src/state/hubSlots';
import { hubPage, provinceHubs } from '../../src/state/provinceHubs';
import { strings } from '../../src/strings';
import { hubChartsData } from '../../src/test/hubChartsData';

const text = provinceHubs.find((hub) => hub.slug === 'ca-on');
if (!text) throw new Error('no Ontario hub');
const spec = hubPage(text, 'Ontario', [], new Set(), [], true);
const data = hubChartsData(['ca-on']);

describe('a hub with a sweep', () => {
  it('has one typed chart block for each chart, in the order of the sections', () => {
    const blocks = spec.sections.flatMap((section) =>
      section.blocks.filter((block) => block.kind === 'salaryChart'),
    );
    expect(blocks).toEqual(
      HUB_CHART_IDS.map((chart) => ({
        kind: 'salaryChart',
        province: 'ca-on',
        chart,
      })),
    );
  });

  it('has no chart section when it has no sweep', () => {
    const plain = hubPage(text, 'Ontario', [], new Set(), []);
    expect(
      plain.sections.some((s) =>
        s.blocks.some((b) => b.kind === 'salaryChart'),
      ),
    ).toBe(false);
  });

  it('writes a section with a permalink for each chart, the take-home chart in the existing section', () => {
    const html = renderToString(<ContentPage {...spec} hubCharts={data} />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    for (const [id, chart, heading] of [
      ['take-home', 'takeHome', 'How your Ontario take-home is worked out'],
      [
        'average-rate',
        'averageRate',
        strings.hubCharts.charts.averageRate.title,
      ],
      [
        'marginal-rate',
        'marginalRate',
        strings.hubCharts.charts.marginalRate.title,
      ],
      [
        'tax-and-contributions',
        'yearTotal',
        strings.hubCharts.charts.yearTotal.title,
      ],
    ] as const) {
      const section = doc.getElementById(id);
      expect(section?.tagName, id).toBe('SECTION');
      expect(section?.querySelector('h2')?.textContent).toBe(heading);
      expect(section?.querySelector(`a[href="#${id}"]`)).not.toBeNull();
      expect(
        section?.querySelector(`#${HUB_CHART_SLOT_IDS[chart]} svg`),
      ).not.toBeNull();
    }
    // Four sections with a chart: the take-home section exists once.
    expect(doc.querySelectorAll('h2')).toHaveLength(
      new Set([...doc.querySelectorAll('h2')].map((h) => h.textContent)).size,
    );
    expect(doc.querySelectorAll('[id^="hub-chart-"] svg')).toHaveLength(4);
  });

  it("writes each chart's figures table and the marker into the static HTML", () => {
    const html = renderToString(<ContentPage {...spec} hubCharts={data} />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    for (const chart of HUB_CHART_IDS) {
      expect(
        doc.querySelectorAll(`#${HUB_CHART_SLOT_IDS[chart]} details tbody tr`),
        chart,
      ).toHaveLength(307);
    }
    expect(doc.body.textContent).toContain(
      strings.hubCharts.readout('$70,000'),
    );
    expect(doc.querySelectorAll('svg circle').length).toBeGreaterThan(0);
  });

  it('writes no salary readout beside the Per year / Per month switch', () => {
    const html = renderToString(<ContentPage {...spec} hubCharts={data} />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const readouts = [...doc.querySelectorAll('p')].filter((p) =>
      p.textContent.includes(strings.hubCharts.readout('$70,000')),
    );
    expect(readouts).toHaveLength(1);
    expect(readouts[0]?.className).toMatch(/visuallyHidden/);
  });

  it('writes empty slots when no data is given', () => {
    const html = renderToString(<ContentPage {...spec} />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    for (const chart of HUB_CHART_IDS) {
      expect(
        doc.getElementById(HUB_CHART_SLOT_IDS[chart])?.children,
      ).toHaveLength(0);
    }
  });

  it.each(HUB_CHART_IDS)(
    'hydrates the %s chart to the same markup the build wrote (parity)',
    async (chart) => {
      const html = renderToString(<ContentPage {...spec} hubCharts={data} />);
      const host = document.createElement('div');
      host.innerHTML = html;
      document.body.append(host);
      const slot = host.querySelector(`#${HUB_CHART_SLOT_IDS[chart]}`);
      if (!(slot instanceof HTMLElement)) throw new Error('no slot');
      const before = slot.innerHTML;
      const errors: unknown[] = [];
      await act(async () => {
        hydrateRoot(
          slot,
          <SalaryChart data={data} province="ca-on" chart={chart} />,
          { onRecoverableError: (error) => errors.push(error) },
        );
        await Promise.resolve();
      });
      expect(errors).toEqual([]);
      expect(slot.innerHTML).toBe(before);
      host.remove();
    },
  );
});
