// Test data only. A real API client over a fake network: the saved list of
// places, and `answer` for every calculation.
import {
  createApiClient,
  type ApiClient,
  type ComputeTakeHomeCalculationRequest,
} from '../api';
import compute2025 from '../api/fixtures/compute-on-2025-70000.json';
import jurisdictions from '../api/fixtures/jurisdictions.json';

export function fixtureClient(
  onCompute: (body: ComputeTakeHomeCalculationRequest) => void = () => {},
  answer: unknown = compute2025,
): ApiClient {
  return createApiClient({
    baseUrl: 'http://test/api/v1',
    fetch: (input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.endsWith('/jurisdictions')) {
        return Promise.resolve(new Response(JSON.stringify(jurisdictions)));
      }
      onCompute(
        JSON.parse(
          typeof init?.body === 'string' ? init.body : '',
        ) as ComputeTakeHomeCalculationRequest,
      );
      return Promise.resolve(new Response(JSON.stringify(answer)));
    },
  });
}
