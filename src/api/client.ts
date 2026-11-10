import { apiBaseUrl } from './config';
import type {
  ComputeTakeHomeCalculationRequest,
  ComputeTakeHomeCalculationResponse,
  Error as Problem,
  ListJurisdictionsData,
  ListJurisdictionsResponse,
} from './generated';

export type {
  ComputeTakeHomeCalculationRequest,
  ComputeTakeHomeCalculationResponse,
  Problem,
  ListJurisdictionsResponse,
};
export type ListJurisdictionsQuery = NonNullable<
  ListJurisdictionsData['query']
>;

/** The service answered with an error status. `problem` is its RFC 9457 body, when it sent one. */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: Problem | null;

  constructor(status: number, problem: Problem | null, message?: string) {
    super(
      message ??
        problem?.detail ??
        `Request failed with status ${status.toString()}`,
    );
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

/** The request never got an answer (offline, DNS, CORS, connection reset). */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Could not reach the service', { cause });
    this.name = 'NetworkError';
  }
}

export interface ApiClient {
  listJurisdictions(
    query?: ListJurisdictionsQuery,
  ): Promise<ListJurisdictionsResponse>;
  computeTakeHomeCalculation(
    request: ComputeTakeHomeCalculationRequest,
  ): Promise<ComputeTakeHomeCalculationResponse>;
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

function isProblem(value: unknown): value is Problem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.type === 'string' &&
    typeof v.title === 'string' &&
    typeof v.status === 'number' &&
    typeof v.detail === 'string'
  );
}

function parseJson(text: string): unknown {
  if (text === '') return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = (options.baseUrl ?? apiBaseUrl()).replace(/\/+$/, '');
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${path}`, init);
    } catch (cause) {
      throw new NetworkError(cause);
    }
    // Parsed from text so decimal strings stay strings; no number ever holds money.
    let text: string;
    try {
      text = await response.text();
    } catch (cause) {
      throw new NetworkError(cause);
    }
    const body = parseJson(text);
    if (!response.ok) {
      throw new ApiError(response.status, isProblem(body) ? body : null);
    }
    if (body === null) {
      throw new ApiError(
        response.status,
        null,
        'The service sent an empty or unreadable answer',
      );
    }
    return body as T;
  }

  return {
    listJurisdictions(query = {}) {
      const params = new URLSearchParams();
      if (query.max_page_size !== undefined) {
        params.set('max_page_size', String(query.max_page_size));
      }
      if (query.page_token !== undefined)
        params.set('page_token', query.page_token);
      const qs = params.toString();
      return request<ListJurisdictionsResponse>(
        `/jurisdictions${qs ? `?${qs}` : ''}`,
        {
          headers: { Accept: 'application/json' },
        },
      );
    },
    computeTakeHomeCalculation(body) {
      return request<ComputeTakeHomeCalculationResponse>(
        '/take-home-calculations:compute',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    },
  };
}
