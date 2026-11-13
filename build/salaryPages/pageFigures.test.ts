import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { strings } from '../../src/strings';
import {
  compute150000,
  compute30000,
  compute70000,
} from '../../src/test/syntheticPages';
import { template } from '../../src/test/generatedSite';
import {
  parseSalaryPageData,
  SALARY_PAGE_DATA_ID,
} from '../../src/state/salaryPageData';
import { generateSalaryPages } from './generate';
import { renderSalaryApp } from './prerender';
import type { Province } from './provinces';

// Every built page carries the figures the API gave for ITS salary.
// The fake API answers by the salary in the request body, with the saved
// engine responses. One list entry per salary (from = to), so exactly the
// three saved salaries are built.
const baseUrl = 'https://api.test/api/v1';

const answers = new Map<string, ComputeTakeHomeCalculationResponse>([
  ['30000', compute30000],
  ['70000', compute70000],
  ['150000', compute150000],
]);

const expected = [
  {
    salary: '30000',
    n: 30000,
    takeHome: 'CA$27,550.43',
    takenOff: 'CA$2,449.57',
  },
  {
    salary: '70000',
    n: 70000,
    takeHome: 'CA$53,786.25',
    takenOff: 'CA$16,213.75',
  },
  {
    salary: '150000',
    n: 150000,
    takeHome: 'CA$104,319.88',
    takenOff: 'CA$45,680.12',
  },
];

const entries: Province[] = expected.map(({ salary, n }) => ({
  code: 'CA-ON',
  slug: `ca-on-${salary}`,
  year: 2026,
  from: n,
  to: n,
  step: 1,
}));

const answerBySalary: typeof fetch = (input, init) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (url === `${baseUrl}/jurisdictions`) {
    return Promise.resolve(Response.json(jurisdictions));
  }
  const body = JSON.parse(
    typeof init?.body === 'string' ? init.body : '{}',
  ) as {
    salary?: string;
  };
  const answer = answers.get(body.salary ?? '');
  return answer
    ? Promise.resolve(Response.json(answer))
    : Promise.reject(new Error(`no saved answer for ${String(body.salary)}`));
};

const outDir = mkdtempSync(join(tmpdir(), 'salary-figures-'));
beforeAll(async () => {
  await generateSalaryPages({
    fetch: answerBySalary,
    baseUrl,
    provinces: entries,
    outDir,
    template,
    render: renderSalaryApp,
  });
});

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

function pageOf(salary: string): Document {
  return new DOMParser().parseFromString(
    readFileSync(join(outDir, `ca-on-${salary}`, salary, 'index.html'), 'utf8'),
    'text/html',
  );
}

function answerRow(page: Document, label: string): string | undefined {
  const card = Array.from(page.querySelectorAll('section')).find(
    (s) => s.querySelector('h2')?.textContent === strings.answer.heading,
  );
  const row = Array.from(card?.querySelectorAll('dl > div') ?? []).find(
    (r) => r.querySelector('dt')?.textContent === label,
  );
  return row?.querySelector('dd')?.textContent;
}

describe('each built page carries the figures the API gave for its own salary', () => {
  it.each(expected)(
    'shows $takeHome as the take-home on the page for $salary',
    ({ salary, takeHome }) => {
      expect(answerRow(pageOf(salary), strings.answer.takeHomeRow)).toBe(
        takeHome,
      );
    },
  );

  it.each(expected)(
    'shows $takenOff as the total taken off on the page for $salary',
    ({ salary, takenOff }) => {
      expect(answerRow(pageOf(salary), strings.answer.takenOff)).toBe(takenOff);
    },
  );

  it.each(expected)(
    'writes the API response for $salary, and no other, in the data block of that page',
    ({ salary }) => {
      const block = pageOf(salary).getElementById(SALARY_PAGE_DATA_ID);
      const data = parseSalaryPageData(block?.textContent ?? null);
      expect(data).not.toBeNull();
      expect(data?.response).toEqual(answers.get(salary));
    },
  );

  it('builds three pages whose take-home figures are all different', () => {
    const shown = expected.map(({ salary }) =>
      answerRow(pageOf(salary), strings.answer.takeHomeRow),
    );
    expect(new Set(shown).size).toBe(3);
  });
});
