import type { ListJurisdictionsResponse } from '../api';

type Supported = ListJurisdictionsResponse['jurisdictions'];

/** One entry of the place list: selectable only when the API returns it. */
export type PlaceOption = {
  code: string;
  name: string;
  supported: boolean;
};

/** The API's places first, then the coming-soon ones the API does not serve. */
export function placeOptions(
  supported: Supported,
  comingSoon: readonly { code: string; name: string }[],
): PlaceOption[] {
  const served = new Set(supported.map((j) => j.code));
  return [
    ...supported.map((j) => ({
      code: j.code,
      name: j.name.trim() || j.code,
      supported: true,
    })),
    ...comingSoon
      .filter((p) => !served.has(p.code))
      .map((p) => ({ code: p.code, name: p.name, supported: false })),
  ];
}
