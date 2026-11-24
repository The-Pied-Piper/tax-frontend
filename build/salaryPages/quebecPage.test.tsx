import { adapters } from '../../src/adapters';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import fixtureQc from '../../src/api/fixtures/compute-qc-2025-70000.json';
import { strings } from '../../src/strings';
import { bareLinks } from '../../src/test/pageLinks';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { DESCRIPTION_LIMIT } from './limits';
import { salaryPageText } from '../../src/state/salaryPageText';
import { pageMeta } from './pageMeta';
import { renderSalaryApp } from './prerender';

const response = fixtureQc as ComputeTakeHomeCalculationResponse;

// The saved Quebec answer for $70,000 in 2025, as the page for it would be built.
const data: SalaryPageData = {
  jurisdictions: [
    {
      code: 'CA-QC',
      name: 'Quebec',
      years: [{ year: 2025, provisional: false }],
    },
  ],
  response,
  jurisdictionCode: 'CA-QC',
  year: 2025,
  salary: '70000',
  links: bareLinks,
};

describe('a pre-built Quebec salary page', () => {
  it('words the page text with QPP and QPIP, never the Canada Pension Plan', () => {
    const { description, paragraph } = pageMeta(data);
    for (const text of [description, paragraph]) {
      expect(text).not.toMatch(/Canada Pension|CPP/);
      expect(text).toMatch(/[Pp]arental [Ii]nsurance/);
    }
    expect(paragraph).toContain('Quebec Pension Plan');
    expect(paragraph).toContain('prescription drug insurance premium');
    expect(paragraph).toContain('$21,382.18');
    expect(paragraph).not.toContain('abatement');
  });

  it('puts the Quebec rows and help texts in the HTML a crawler reads', () => {
    document.body.innerHTML = renderSalaryApp(data);
    // The advanced view prints the engine's own form lines as sent, so it is left out here.
    for (const details of document.querySelectorAll('details')) {
      if (details.textContent.includes(strings.advanced.toggle)) {
        details.remove();
      }
    }
    const text = document.body.textContent;
    for (const wanted of [
      '$48,617.82',
      'Quebec Pension Plan',
      'Quebec Parental Insurance Plan',
      'Prescription drug insurance premium',
      '$345.80',
      '$755.00',
    ]) {
      expect(text).toContain(wanted);
    }
    expect(text).not.toMatch(/Canada Pension/);
  });
});

describe('the Quebec page descriptions', () => {
  it('stay under the description limit on the longest page, with or without the accent', () => {
    // The longest page: the largest salary step with a six-figure take-home.
    const longest = {
      ...response,
      salary: '150000.00',
      take_home: '149999.99',
    };
    for (const name of ['Quebec', 'Québec']) {
      const { description } = salaryPageText(
        longest,
        name,
        2026,
        adapters.adapt('CA-QC', 2026, longest).wording,
      );
      expect(description.length).toBeLessThan(DESCRIPTION_LIMIT);
    }
  });
});
