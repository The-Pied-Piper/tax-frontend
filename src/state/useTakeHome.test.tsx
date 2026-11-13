import { act, renderHook } from '@testing-library/react';
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
