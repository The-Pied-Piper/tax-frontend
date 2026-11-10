/**
 * Where the API lives, set at build time per environment (VITE_API_BASE_URL).
 * It is the full prefix in front of the spec's paths, for example
 * `https://api.example.com/api/v1`. The default `/api/v1` is for local
 * development, where the dev server proxies `/api` to a real tax-service.
 */
export const DEFAULT_API_BASE_URL = '/api/v1';

export function apiBaseUrl(): string {
  const configured: unknown = import.meta.env.VITE_API_BASE_URL;
  return typeof configured === 'string' && configured !== ''
    ? configured.replace(/\/+$/, '')
    : DEFAULT_API_BASE_URL;
}
