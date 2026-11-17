import { readUnit } from '../../src/adapters/fallback';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { displayWholeMoney } from '../../src/money/format';
import { salaryBreadcrumb } from '../../src/state/breadcrumbs';
import { strings } from '../../src/strings';
import { bareLinks } from '../../src/test/pageLinks';
import { compute70000 } from '../../src/test/syntheticPages';
import { renderSalaryApp } from './prerender';

// The structured data in a salary page's head is built from salaryBreadcrumb,
// so the breadcrumb App draws must be the same value.
describe('the breadcrumb of a pre-built salary page and salaryBreadcrumb', () => {
  it('show the same links and current page', () => {
    const unit = readUnit(compute70000.unit) ?? strings.fallbackUnit;
    document.body.innerHTML = renderSalaryApp({
      jurisdictions: jurisdictions.jurisdictions,
      response: compute70000,
      jurisdictionCode: 'CA-ON',
      year: 2026,
      salary: '70000',
      links: bareLinks,
    });
    const current = document.querySelector('nav ol li[aria-current="page"]');
    const list = current?.parentElement;
    if (!list) throw new Error('no breadcrumb');
    expect({
      steps: [...list.querySelectorAll('li a')].map((a) => ({
        label: a.textContent,
        href: a.getAttribute('href'),
      })),
      current: current.textContent,
    }).toEqual(
      salaryBreadcrumb(
        bareLinks.hub,
        displayWholeMoney(compute70000.salary, 'annually', unit),
      ),
    );
  });
});
