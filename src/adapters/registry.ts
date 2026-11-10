import type { ComputeTakeHomeCalculationResponse } from '../api';
import { fallbackResult } from './fallback';
import type { AdaptedResult, JurisdictionAdapter } from './types';

/** Adapters keyed by `jurisdiction_code`, and by year where labels change. */
export class AdapterRegistry {
  private readonly adapters = new Map<string, JurisdictionAdapter[]>();

  register(input: JurisdictionAdapter): void {
    if (input.years?.length === 0) {
      throw new Error(
        `The adapter for ${input.jurisdictionCode} lists no years; leave years out to cover every year`,
      );
    }
    // Copy the years so later changes by the caller cannot bypass the overlap check.
    const adapter: JurisdictionAdapter = {
      jurisdictionCode: input.jurisdictionCode,
      years: input.years && [...input.years],
      adapt: (response) => input.adapt(response),
    };
    const existing = this.adapters.get(adapter.jurisdictionCode) ?? [];
    for (const other of existing) {
      if (overlaps(other, adapter)) {
        throw new Error(
          `An adapter for ${adapter.jurisdictionCode} already covers the same year`,
        );
      }
    }
    this.adapters.set(adapter.jurisdictionCode, [...existing, adapter]);
  }

  /** The adapter for this jurisdiction and year, or undefined. */
  find(
    jurisdictionCode: string,
    year: number,
  ): JurisdictionAdapter | undefined {
    const candidates = this.adapters.get(jurisdictionCode) ?? [];
    return (
      candidates.find((a) => a.years?.includes(year)) ??
      candidates.find((a) => a.years === undefined)
    );
  }

  /** Adapts a response; falls back to the plain advanced view when no adapter matches. */
  adapt(
    jurisdictionCode: string,
    year: number,
    response: ComputeTakeHomeCalculationResponse,
  ): AdaptedResult {
    const adapter = this.find(jurisdictionCode, year);
    return adapter ? adapter.adapt(response) : fallbackResult(response);
  }
}

function overlaps(a: JurisdictionAdapter, b: JurisdictionAdapter): boolean {
  if (a.years === undefined || b.years === undefined) {
    return a.years === b.years;
  }
  return a.years.some((year) => b.years?.includes(year));
}
