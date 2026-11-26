import { act } from '@testing-library/react';
import { dataBlock } from '../build/salaryPages/pageHtml';
import { renderContentPage } from '../build/salaryPages/prerender';
import { comparePage } from '../build/contentPages/compare';
import { PROVINCE_COMPARISON_SLOT_ID } from './state/hubSlots';
import { HUB_CHARTS_DATA_ID } from './state/hubSlots';
import { sampleHubCharts, sampleSweeps } from './test/comparisonData';

// The content entry mounts the comparison into the slot of the pre-built compare page.
// What it mounts must equal what the build wrote there, so the page does not
// change when the script runs.
const compare = comparePage(sampleSweeps);
if (!compare) throw new Error('no compare page');

async function loadEntry() {
  vi.resetModules();
  await act(async () => {
    await import('./contentMain');
  });
}

// The markup as a reader sees it: attributes in a fixed order and the style as
// the browser writes it back, since the server and the browser serialise
// the same element differently ("width:100.0%" and "width: 100%;").
function normalized(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  for (const node of [copy, ...copy.querySelectorAll('*')]) {
    const html = node as HTMLElement;
    const attributes = Array.from(html.attributes)
      .map((attribute) => [attribute.name, attribute.value] as const)
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [name] of attributes) html.removeAttribute(name);
    for (const [name, value] of attributes) {
      html.setAttribute(name, name === 'style' ? html.style.cssText : value);
    }
  }
  return copy.innerHTML;
}

function slot(): HTMLElement {
  const found = document.getElementById(PROVINCE_COMPARISON_SLOT_ID);
  if (!found) throw new Error('no comparison slot');
  return found;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the content entry on the compare page', () => {
  beforeEach(() => {
    document.body.innerHTML =
      renderContentPage(compare, sampleHubCharts) +
      dataBlock(HUB_CHARTS_DATA_ID, sampleHubCharts);
  });

  it('writes the slot with no province and the full comparison, figures included', () => {
    expect(slot().dataset.province).toBeUndefined();
    expect(slot().querySelectorAll('table tbody tr')).toHaveLength(8);
    expect(slot().textContent).toContain('$54,348.15');
  });

  it('mounts the same markup the build wrote', async () => {
    const written = normalized(slot());
    await loadEntry();
    expect(normalized(slot())).toBe(written);
  });

  it('makes the mounted comparison interactive', async () => {
    await loadEntry();
    const toggle = slot().querySelector<HTMLInputElement>(
      'input[type=radio][value=incomeTax]',
    );
    expect(toggle).not.toBeNull();
    act(() => {
      toggle?.click();
    });
    expect(slot().textContent).toContain('$13,217.18');
  });
});

describe('the content entry on a page with no comparison', () => {
  it('mounts nothing when the slot has no data block', async () => {
    document.body.innerHTML =
      '<div id="province-comparison" data-province="ca-on"></div>';
    await loadEntry();
    expect(slot().innerHTML).toBe('');
  });

  it('mounts nothing when the data block is not what the page expects', async () => {
    document.body.innerHTML =
      '<div id="province-comparison" data-province="ca-on"></div>' +
      dataBlock(HUB_CHARTS_DATA_ID, { provinces: [] });
    await loadEntry();
    expect(slot().innerHTML).toBe('');
  });

  it('mounts nothing when the slot names a province the site does not list', async () => {
    document.body.innerHTML =
      '<div id="province-comparison" data-province="ca-xx"></div>' +
      dataBlock(HUB_CHARTS_DATA_ID, sampleHubCharts);
    await loadEntry();
    expect(slot().innerHTML).toBe('');
  });
});
