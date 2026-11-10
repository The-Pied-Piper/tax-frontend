import { afterAll, afterEach, beforeAll } from 'vitest';
import { ApiError, createApiClient } from '../api/client';
import { server } from './server';

const client = createApiClient({ baseUrl: 'http://localhost:8000/api/v1' });

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const request = (year: number, salary: string) => ({
  jurisdiction_code: 'CA-ON',
  year,
  salary,
  language_code: 'en',
  include_trace: true,
});

describe('default mock handlers', () => {
  it('list Ontario with 2026 provisional', async () => {
    const result = await client.listJurisdictions();
    expect(result.jurisdictions[0]?.code).toBe('CA-ON');
  });

  it('answer $70,000 for 2025 with the saved take-home', async () => {
    const result = await client.computeTakeHomeCalculation(
      request(2025, '70000'),
    );
    expect(result.take_home).toBe('53468.68');
    expect(result.provisional).toBe(false);
  });

  it('answer $70,000 for 2026 as provisional', async () => {
    const result = await client.computeTakeHomeCalculation(
      request(2026, '70000'),
    );
    expect(result.take_home).toBe('53786.25');
    expect(result.provisional).toBe(true);
  });

  it('reject a salary the API would reject', async () => {
    await expect(
      client.computeTakeHomeCalculation(request(2025, 'abc')),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
