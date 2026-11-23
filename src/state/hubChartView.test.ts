import { act, renderHook } from '@testing-library/react';
import {
  resetChartView,
  setChartMarker,
  setChartPeriod,
  useHubChartView,
} from './hubChartView';

afterEach(() => {
  act(() => {
    resetChartView();
  });
});

describe('the shared hub chart view', () => {
  it('starts on Per year with the marker in its first place', () => {
    const { result } = renderHook(() => useHubChartView());
    expect(result.current).toEqual({ period: 'annually', marker: null });
  });

  it('gives every reader of the page the same period and marker', () => {
    const one = renderHook(() => useHubChartView());
    const two = renderHook(() => useHubChartView());
    act(() => {
      setChartPeriod('monthly');
      setChartMarker(12);
    });
    expect(one.result.current).toEqual({ period: 'monthly', marker: 12 });
    expect(two.result.current).toEqual({ period: 'monthly', marker: 12 });
    act(() => {
      setChartMarker(null);
    });
    expect(two.result.current.marker).toBeNull();
    expect(two.result.current.period).toBe('monthly');
  });

  it('stops telling a reader that has gone', () => {
    const one = renderHook(() => useHubChartView());
    one.unmount();
    expect(() => {
      act(() => {
        setChartPeriod('monthly');
      });
    }).not.toThrow();
  });
});
