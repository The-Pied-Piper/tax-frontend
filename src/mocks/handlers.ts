import { http, HttpResponse } from 'msw';
import compute2025 from '../api/fixtures/compute-on-2025-70000.json';
import compute2026 from '../api/fixtures/compute-on-2026-70000.json';
import invalidSalary from '../api/fixtures/error-invalid-salary.json';
import jurisdictions from '../api/fixtures/jurisdictions.json';

/**
 * Canned tax-service responses, saved from the real engine. They answer for
 * any salary (the figures are the $70,000 ones), except that a salary the API
 * would reject (or a body that is not JSON) gets the saved validation error,
 * whose text is fixed. The jurisdiction and language are ignored, and every
 * year except 2026 gets the 2025 answer. Paths match with a leading
 * wildcard so the same handlers work in the browser (relative URLs) and in
 * tests (absolute URLs).
 */
// Same as the spec's pattern; Python's `$` also accepts one trailing newline.
const SALARY_PATTERN = /^(0*[1-9][0-9]*|[0-9]+\.[0-9]{1,2})\n?$/;

function badRequest() {
  return HttpResponse.json(invalidSalary, {
    status: 400,
    headers: { 'content-type': 'application/problem+json' },
  });
}

export const handlers = [
  http.get('*/api/v1/jurisdictions', () => HttpResponse.json(jurisdictions)),
  http.post(
    '*/api/v1/take-home-calculations\\:compute',
    async ({ request }) => {
      let body: { salary?: unknown; year?: unknown } | null;
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return badRequest();
      }
      if (
        body === null ||
        typeof body !== 'object' ||
        typeof body.salary !== 'string' ||
        !SALARY_PATTERN.test(body.salary)
      ) {
        return badRequest();
      }
      return HttpResponse.json(body.year === 2026 ? compute2026 : compute2025);
    },
  ),
];
