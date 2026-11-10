# Take-home pay estimate

A one-page estimation tool: enter a yearly salary, see an estimate of take-home pay with the working shown. It is an estimate, not tax advice.

Stack: Vite, React and TypeScript, built to plain static files. State is React's own.

## Commands

| Command                | What it does                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `npm install`          | Install dependencies (Node 22 or newer)                                                |
| `npm run dev`          | Start the dev server                                                                   |
| `npm test`             | Run the tests once                                                                     |
| `npm run check`        | Lint, format check, type check and tests                                               |
| `npm run format`       | Format all files                                                                       |
| `npm run build`        | Write the static site to `dist/`                                                       |
| `npm run api:generate` | Regenerate the API types from `api/openapi.yml`                                        |
| `npm run api:sync`     | Copy tax-service's published spec into `api/openapi.yml` (needs `gh`), then regenerate |

## API client

`api/openapi.yml` is a copy of the spec tax-service publishes (`openapi/openapi.yml` on its main). Types in `src/api/generated/` are generated from it and committed; CI fails if they are stale, or if the copy differs from tax-service's current spec (run `npm run api:sync` to update both). The drift check runs on every push to main, daily, and on pull requests. tax-service is private, so it needs the repository secret `TAX_SERVICE_READ_TOKEN` (read-only contents access to tax-service); pull requests from forks cannot see it and skip the check with a warning. Never edit either by hand.

`src/api/client.ts` is a thin hand-written client for the two endpoints: `listJurisdictions` and `computeTakeHomeCalculation`. Money stays a decimal string everywhere. Errors throw `ApiError` (with the RFC 9457 problem body) or `NetworkError`.

The API location is `VITE_API_BASE_URL` at build time: the full prefix in front of the spec's paths (for example `https://api.example.com/api/v1`). Unset, it is `/api/v1`, meant for a dev server that proxies `/api` to a local tax-service. That proxy is not set up yet (ticket 3), so until then set `VITE_API_BASE_URL` to a running service.

## Lint rules

`npm run lint` enforces the architecture doc's layering. Each folder under `src/` may import only what the folder table allows: `api`, `money` and `theme` import nothing else in `src`; `adapters`, `money`, `theme` and `api` never import React; components may use `api` and `adapters` for types only (`import type`) and never `mocks`; only `src/main.tsx` and tests import `src/mocks`. Money stays text: `Number`, `parseFloat`, `parseInt`, `.toFixed(` and `Intl.NumberFormat` are banned everywhere except `src/money/`. Components also get `eslint-plugin-jsx-a11y`, and all code gets typescript-eslint `strictTypeChecked` with `noUncheckedIndexedAccess` and `verbatimModuleSyntax` in `tsconfig.json`. `eslint.rules.test.js` lints a small example for each rule, so a rule that stops firing fails the tests. Node 22 is pinned in `.nvmrc`.

## License

Apache 2.0, see [LICENSE](LICENSE).
