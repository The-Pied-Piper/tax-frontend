import { http, HttpResponse } from 'msw';
import compute2025 from '../api/fixtures/compute-on-2025-70000.json';
import compute2026 from '../api/fixtures/compute-on-2026-70000.json';
import invalidSalary from '../api/fixtures/error-invalid-salary.json';
import jurisdictions from '../api/fixtures/jurisdictions.json';

/**
 * Canned tax-service responses, saved from the real engine. They answer for
 * any salary (the figures are the $70,000 ones), except that a salary the API
 * would reject gets the saved validation error. Paths match with a leading
 * wildcard so the same handlers work in the browser (relative URLs) and in
 * tests (absolute URLs).
 */
const SALARY_PATTERN = /^(0*[1-9][0-9]*|[0-9]+\.[0-9]{1,2})$/;

export const handlers = [
  http.get('*/api/v1/jurisdictions', () => HttpResponse.json(jurisdictions)),
  http.post(
    '*/api/v1/take-home-calculations\\:compute',
    async ({ request }) => {
      const body = (await request.json()) as {
        salary?: unknown;
        year?: unknown;
      };
      if (
        typeof body.salary !== 'string' ||
        !SALARY_PATTERN.test(body.salary)
      ) {
        return HttpResponse.json(invalidSalary, {
          status: 400,
          headers: { 'content-type': 'application/problem+json' },
        });
      }
      return HttpResponse.json(body.year === 2026 ? compute2026 : compute2025);
    },
  ),
];
