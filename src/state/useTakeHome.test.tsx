import { act, renderHook, waitFor } from '@testing-library/react';
import type { ApiClient, ComputeTakeHomeCalculationResponse } from '../api';
import computeFixture from '../api/fixtures/compute-on-2026-70000.json';
import jurisdictions from '../api/fixtures/jurisdictions.json';
import { useTakeHome, type SalaryPageData } from './useTakeHome';

const compute = computeFixture as ComputeTakeHomeCalculationResponse;

const initial: SalaryPageData = {
  jurisdictions: jurisdictions.jurisdictions,
  response: compute,
  jurisdictionCode: 'CA-ON',
  year: 2026,
  salary: '70000',
};

function fakeClient() {
  const listJurisdictions = vi.fn<ApiClient['listJurisdictions']>(() =>
    Promise.resolve(jurisdictions),
  );
  const computeTakeHomeCalculation = vi.fn<
    ApiClient['computeTakeHomeCalculation']
  >(() => Promise.resolve(compute));
  const client: ApiClient = { listJurisdictions, computeTakeHomeCalculation };
  return { client, listJurisdictions, computeTakeHomeCalculation };
}

describe('useTakeHome with an initial state (a pre-built salary page)', () => {
  it('starts ready, pre-filled, with the result already shown', () => {
    const { client } = fakeClient();
    const { result } = renderHook(() =>
      useTakeHome(client, undefined, initial),
    );
    expect(result.current.jurisdictionsState.status).toBe('ready');
    expect(result.current.values).toEqual({
      jurisdictionCode: 'CA-ON',
      year: 2026,
      salary: '70000',
    });
    const { request } = result.current;
    expect(request.status).toBe('success');
    if (request.status !== 'success') return;
    expect(request.response.take_home).toBe('53786.25');
    expect(request.asked).toEqual({
      jurisdictionName: 'Ontario',
      year: 2026,
      jurisdictionCode: 'CA-ON',
    });
    expect(request).not.toHaveProperty('jurisdictionCode');
    expect(request.adapted.rows.length).toBeGreaterThan(0);
  });

  it('makes no API request on load', async () => {
    const { client, listJurisdictions, computeTakeHomeCalculation } =
      fakeClient();
    renderHook(() => useTakeHome(client, undefined, initial));
    await act(async () => {
      await Promise.resolve();
    });
    expect(listJurisdictions).not.toHaveBeenCalled();
    expect(computeTakeHomeCalculation).not.toHaveBeenCalled();
  });

  it('calls the API only when the salary changes and is submitted', async () => {
    const { client, listJurisdictions, computeTakeHomeCalculation } =
      fakeClient();
    const { result } = renderHook(() =>
      useTakeHome(client, undefined, initial),
    );
    act(() => {
      result.current.setSalary('80000');
    });
    expect(computeTakeHomeCalculation).not.toHaveBeenCalled();
    await act(async () => {
      result.current.submit();
      await Promise.resolve();
    });
    expect(computeTakeHomeCalculation).toHaveBeenCalledTimes(1);
    expect(computeTakeHomeCalculation).toHaveBeenCalledWith(
      expect.objectContaining({
        jurisdiction_code: 'CA-ON',
        year: 2026,
        salary: '80000',
      }),
    );
    expect(listJurisdictions).not.toHaveBeenCalled();
  });
});

// The seeded success state carries the page's links, and a new calculation drops them.
describe('useTakeHome links of a pre-built page', () => {
  const links = {
    calculator: '/',
    previous: { salary: '65000', href: '/ca-on/65000/' },
    next: { salary: '75000', href: '/ca-on/75000/' },
    others: [{ salary: '60000', href: '/ca-on/60000/' }],
  };
  const withLinks: SalaryPageData = { ...initial, links };

  function linksOf(request: object): unknown {
    return 'links' in request ? request.links : undefined;
  }

  it('carries the links of the data in the seeded success state', () => {
    const { client } = fakeClient();
    const { result } = renderHook(() =>
      useTakeHome(client, undefined, withLinks),
    );
    expect(result.current.request.status).toBe('success');
    expect(linksOf(result.current.request)).toEqual(links);
  });

  it('has no links in the success state after a new calculation', async () => {
    const { client } = fakeClient();
    const { result } = renderHook(() =>
      useTakeHome(client, undefined, withLinks),
    );
    act(() => {
      result.current.setSalary('80000');
    });
    await act(async () => {
      result.current.submit();
      await Promise.resolve();
    });
    expect(result.current.request.status).toBe('success');
    expect(linksOf(result.current.request)).toBeUndefined();
  });
});

describe('useTakeHome default year (the first load and a change of place)', () => {
  const place = (code: string, ...years: number[]) => ({
    code,
    name: code,
    years: years.map((year) => ({ year, provisional: year > 2025 })),
  });
  const clockAt = (year: number) => () => new Date(year, 5, 15);

  function clientListing(...list: ReturnType<typeof place>[]) {
    const { client } = fakeClient();
    return {
      ...client,
      listJurisdictions: () =>
        Promise.resolve({ jurisdictions: list, next_page_token: '' }),
    } satisfies ApiClient;
  }

  async function load(client: ApiClient, year: number) {
    const hook = renderHook(() =>
      useTakeHome(client, undefined, undefined, clockAt(year)),
    );
    await waitFor(() => {
      expect(hook.result.current.jurisdictionsState.status).toBe('ready');
    });
    return hook;
  }

  it('opens on the current year when the place lists it', async () => {
    const { result } = await load(
      clientListing(place('CA-ON', 2025, 2026)),
      2026,
    );
    expect(result.current.values.year).toBe(2026);
  });

  it('opens on the nearest listed year when the current year is not listed', async () => {
    const { result } = await load(
      clientListing(place('CA-ON', 2025, 2026)),
      2027,
    );
    expect(result.current.values.year).toBe(2026);
  });

  it('opens on the only year of a single-year place', async () => {
    const { result } = await load(clientListing(place('CA-ON', 2025)), 2026);
    expect(result.current.values.year).toBe(2025);
  });

  it('picks again for the new place when the place changes', async () => {
    const { result } = await load(
      clientListing(place('CA-ON', 2025, 2026), place('CA-AB', 2024, 2025)),
      2026,
    );
    expect(result.current.values.year).toBe(2026);
    act(() => {
      result.current.setJurisdictionCode('CA-AB');
    });
    expect(result.current.values.year).toBe(2025);
    act(() => {
      result.current.setJurisdictionCode('CA-ON');
    });
    expect(result.current.values.year).toBe(2026);
  });

  it('leaves the year of a pre-built page as it was', () => {
    const { client } = fakeClient();
    const { result } = renderHook(() =>
      useTakeHome(client, undefined, initial, clockAt(2025)),
    );
    expect(result.current.values.year).toBe(2026);
  });

  it('does not change a year the visitor picked when the clock changes or the hook re-renders', async () => {
    const client = clientListing(place('CA-ON', 2025, 2026));
    const listed = vi.spyOn(client, 'listJurisdictions');
    let year = 2026;
    const hook = renderHook(() =>
      useTakeHome(client, undefined, undefined, () => new Date(year, 5, 15)),
    );
    await waitFor(() => {
      expect(hook.result.current.jurisdictionsState.status).toBe('ready');
    });
    act(() => {
      hook.result.current.setYear(2025);
    });
    year = 2027;
    hook.rerender();
    await act(async () => {
      await Promise.resolve();
    });
    expect(listed).toHaveBeenCalledTimes(1);
    expect(hook.result.current.values.year).toBe(2025);
  });
});
