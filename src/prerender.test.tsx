import { screen, within } from '@testing-library/react';
import { renderSalaryApp } from './prerender';
import type { ComputeTakeHomeCalculationResponse } from './api';
import fixture30000 from './api/fixtures/compute-on-2026-30000.json';
import fixture70000 from './api/fixtures/compute-on-2026-70000.json';
import fixture150000 from './api/fixtures/compute-on-2026-150000.json';
import jurisdictions from './api/fixtures/jurisdictions.json';
import { strings } from './strings';
import type { SalaryPageData } from './state/useTakeHome';

const compute30000 = fixture30000 as ComputeTakeHomeCalculationResponse;
const compute70000 = fixture70000 as ComputeTakeHomeCalculationResponse;
const compute150000 = fixture150000 as ComputeTakeHomeCalculationResponse;

function dataFor(
  response: SalaryPageData['response'],
  salary: string,
): SalaryPageData {
  return {
    jurisdictions: jurisdictions.jurisdictions,
    response,
    jurisdictionCode: 'CA-ON',
    year: 2026,
    salary,
  };
}

// The string is what a crawler gets: no script has run. It is put into the
// document only so it can be read by role.
function show(data: SalaryPageData) {
  document.body.innerHTML = renderSalaryApp(data);
}

describe('renderSalaryApp (the static body of a salary page)', () => {
  it('has the answer in the HTML without JavaScript', () => {
    const html = renderSalaryApp(dataFor(compute70000, '70000'));
    expect(html).toContain('CA$53,786.25');
    expect(html).toContain('CA$16,213.75');
    expect(html).toContain('CA$70,000.00');
  });

  it.each([
    [compute30000, '30000', 'CA$27,550.43'],
    [compute150000, '150000', 'CA$104,319.88'],
  ])(
    'has the real figure on the edge page for $%s',
    (response, salary, takeHome) => {
      expect(renderSalaryApp(dataFor(response, salary))).toContain(takeHome);
    },
  );

  it('shows the same page as the live app: heading, estimate card, footer', () => {
    show(dataFor(compute70000, '70000'));
    expect(
      screen.getByRole('heading', { name: strings.title, level: 1 }),
    ).toBeInTheDocument();
    const card = screen.getByRole('region', { name: strings.answer.heading });
    expect(within(card).getAllByText('CA$53,786.25').length).toBeGreaterThan(0);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(strings.footer);
  });

  it('pre-fills the form for that place, year and salary', () => {
    show(dataFor(compute70000, '70000'));
    expect(
      screen.getByRole('combobox', { name: strings.form.place }),
    ).toHaveValue('CA-ON');
    expect(
      screen.getByRole('combobox', { name: strings.form.year }),
    ).toHaveValue('2026');
    const salary = screen.getByRole('textbox', { name: strings.form.salary });
    expect((salary as HTMLInputElement).value.replace(/,/g, '')).toBe('70000');
  });

  it('uses estimate wording, never "checked against CRA"', () => {
    const html = renderSalaryApp(dataFor(compute70000, '70000'));
    expect(html.toLowerCase()).toContain('estimate');
    expect(html.toLowerCase()).not.toContain('checked against cra');
  });

  it('makes no network request', () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    renderSalaryApp(dataFor(compute70000, '70000'));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
