import { hydrateRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ContentPage } from '../../src/components/ContentPage';
import { hubPage, provinceHubs } from '../../src/state/provinceHubs';
import { strings } from '../../src/strings';
import { hubChartsData } from '../../src/test/hubChartsData';

const text = provinceHubs.find((hub) => hub.slug === 'ca-on');
if (!text) throw new Error('no Ontario hub');
const spec = hubPage(text, 'Ontario', [], new Set(), [], true);
const data = hubChartsData(['ca-on']);

describe('a hub with a sweep', () => {
  it('lists the charts section first, with the card heading and one typed block', () => {
    const [first] = spec.sections;
    expect(first?.heading).toBe(strings.hubCharts.heading);
    expect(first?.blocks).toEqual([
      { kind: 'salaryCharts', province: 'ca-on' },
    ]);
  });

  it('has no charts section when it has no sweep', () => {
    const plain = hubPage(text, 'Ontario', [], new Set(), []);
    expect(
      plain.sections.some((s) =>
        s.blocks.some((b) => b.kind === 'salaryCharts'),
      ),
    ).toBe(false);
  });

  it('writes the figures table and the marker into the static HTML', () => {
    const html = renderToString(<ContentPage {...spec} hubCharts={data} />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelectorAll('details tbody tr')).toHaveLength(300);
    expect(doc.body.textContent).toContain(
      strings.hubCharts.readout('$70,000'),
    );
    expect(doc.querySelectorAll('svg circle').length).toBeGreaterThan(0);
  });

  it('writes an empty slot when no data is given', () => {
    const html = renderToString(<ContentPage {...spec} />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('#hub-charts-slot')?.children).toHaveLength(0);
  });

  it('hydrates to the same markup the build wrote (parity)', async () => {
    const html = renderToString(<ContentPage {...spec} hubCharts={data} />);
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
    const slot = host.querySelector('#hub-charts-slot');
    if (!(slot instanceof HTMLElement)) throw new Error('no slot');
    const before = slot.innerHTML;
    const { SalaryChartsCard } =
      await import('../../src/components/SalaryChartsCard');
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(slot, <SalaryChartsCard data={data} province="ca-on" />, {
        onRecoverableError: (error) => errors.push(error),
      });
      await Promise.resolve();
    });
    expect(errors).toEqual([]);
    expect(slot.innerHTML).toBe(before);
    host.remove();
  });
});
