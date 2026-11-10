import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';
import {
  ApiError,
  NetworkError,
  RequestTimeoutError,
  createApiClient,
} from './client';
import compute2025 from './fixtures/compute-on-2025-70000.json';
import compute2026 from './fixtures/compute-on-2026-70000.json';
import invalidSalary from './fixtures/error-invalid-salary.json';
import jurisdictions from './fixtures/jurisdictions.json';

const BASE = 'http://localhost:8000/api/v1';
const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

const client = createApiClient({ baseUrl: BASE });

describe('listJurisdictions', () => {
  it('returns the saved list, years and provisional flags included', async () => {
    server.use(
      http.get(`${BASE}/jurisdictions`, () => HttpResponse.json(jurisdictions)),
    );
    const result = await client.listJurisdictions();
    expect(result.jurisdictions[0]?.code).toBe('CA-ON');
    expect(result.jurisdictions[0]?.years).toEqual(
      expect.arrayContaining([
        { year: 2025, provisional: false },
        { year: 2026, provisional: true },
      ]),
    );
  });

  it('sends paging parameters', async () => {
    let seen = '';
    server.use(
      http.get(`${BASE}/jurisdictions`, ({ request }) => {
        seen = new URL(request.url).search;
        return HttpResponse.json(jurisdictions);
      }),
    );
    await client.listJurisdictions({ max_page_size: 5, page_token: 'abc' });
    expect(seen).toBe('?max_page_size=5&page_token=abc');
  });
});

describe('computeTakeHomeCalculation', () => {
  it('posts the request and returns the $70,000 Ontario 2025 figures as text', async () => {
    let posted: unknown;
    server.use(
      http.post(
        `${BASE}/take-home-calculations\\:compute`,
        async ({ request }) => {
          posted = await request.json();
          return HttpResponse.json(compute2025);
        },
      ),
    );
    const result = await client.computeTakeHomeCalculation({
      jurisdiction_code: 'CA-ON',
      year: 2025,
      salary: '70000.00',
      include_trace: true,
    });
    expect(posted).toEqual({
      jurisdiction_code: 'CA-ON',
      year: 2025,
      salary: '70000.00',
      include_trace: true,
    });
    expect(result.take_home).toBe('53468.68');
    expect(result.total_deductions).toBe('16531.32');
    expect(result.provisional).toBe(false);
    expect(typeof result.take_home).toBe('string');
    expect(result.trace?.length).toBeGreaterThan(0);
    for (const form of result.trace ?? []) {
      for (const line of form.lines) {
        if (line.amount !== undefined)
          expect(typeof line.amount).toBe('string');
      }
    }
  });

  it('returns the provisional 2026 figures', async () => {
    server.use(
      http.post(`${BASE}/take-home-calculations\\:compute`, () =>
        HttpResponse.json(compute2026),
      ),
    );
    const result = await client.computeTakeHomeCalculation({
      jurisdiction_code: 'CA-ON',
      year: 2026,
      salary: '70000.00',
    });
    expect(result.take_home).toBe('53786.25');
    expect(result.provisional).toBe(true);
  });

  it('throws ApiError carrying the problem body on a 400', async () => {
    server.use(
      http.post(`${BASE}/take-home-calculations\\:compute`, () =>
        HttpResponse.json(invalidSalary, {
          status: 400,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      ),
    );
    const error = await client
      .computeTakeHomeCalculation({
        jurisdiction_code: 'CA-ON',
        year: 2025,
        salary: 'abc',
      })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).problem).toEqual(invalidSalary);
  });

  it('throws ApiError with no problem when the error body is not a problem', async () => {
    server.use(
      http.post(`${BASE}/take-home-calculations\\:compute`, () =>
        HttpResponse.text('Bad gateway', { status: 502 }),
      ),
    );
    const error = await client
      .computeTakeHomeCalculation({
        jurisdiction_code: 'CA-ON',
        year: 2025,
        salary: '1',
      })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(502);
    expect((error as ApiError).problem).toBeNull();
  });

  it('throws NetworkError when the request gets no answer', async () => {
    server.use(
      http.post(`${BASE}/take-home-calculations\\:compute`, () =>
        HttpResponse.error(),
      ),
    );
    await expect(
      client.computeTakeHomeCalculation({
        jurisdiction_code: 'CA-ON',
        year: 2025,
        salary: '1',
      }),
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it('throws RequestTimeoutError when no answer arrives in time', async () => {
    const slow = createApiClient({
      baseUrl: BASE,
      timeoutMs: 20,
      // Never answers; only the abort signal ends it.
      fetch: (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    });
    await expect(
      slow.computeTakeHomeCalculation({
        jurisdiction_code: 'CA-ON',
        year: 2025,
        salary: '1',
      }),
    ).rejects.toBeInstanceOf(RequestTimeoutError);
  });

  it('throws a clear ApiError when a 200 body is empty or not JSON', async () => {
    server.use(
      http.post(`${BASE}/take-home-calculations\\:compute`, () =>
        HttpResponse.text('<html>oops</html>', { status: 200 }),
      ),
    );
    const error = await client
      .computeTakeHomeCalculation({
        jurisdiction_code: 'CA-ON',
        year: 2025,
        salary: '1',
      })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe(
      'The service sent an empty or unreadable answer',
    );
  });
});

describe('base URL', () => {
  it('strips trailing slashes and works with a relative base', async () => {
    const calls: string[] = [];
    const relative = createApiClient({
      baseUrl: '/api/v1//',
      fetch: (input) => {
        calls.push(
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
        );
        return Promise.resolve(Response.json(jurisdictions));
      },
    });
    await relative.listJurisdictions();
    expect(calls).toEqual(['/api/v1/jurisdictions']);
  });
});
