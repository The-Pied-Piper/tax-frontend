import type { ListJurisdictionsResponse } from '../api/generated';

type Supported = ListJurisdictionsResponse['jurisdictions'];

/** One entry of the place list: selectable only when the API returns it. */
export type PlaceOption = {
  code: string;
  name: string;
  supported: boolean;
};

// Every province and territory, in alphabetical order. Only the ones the API
// returns can be chosen; the rest are listed as coming soon.
const PROVINCES: readonly { code: string; name: string }[] = [
  { code: 'CA-AB', name: 'Alberta' },
  { code: 'CA-BC', name: 'British Columbia' },
  { code: 'CA-MB', name: 'Manitoba' },
  { code: 'CA-NB', name: 'New Brunswick' },
  { code: 'CA-NL', name: 'Newfoundland and Labrador' },
  { code: 'CA-NT', name: 'Northwest Territories' },
  { code: 'CA-NS', name: 'Nova Scotia' },
  { code: 'CA-NU', name: 'Nunavut' },
  { code: 'CA-ON', name: 'Ontario' },
  { code: 'CA-PE', name: 'Prince Edward Island' },
  { code: 'CA-QC', name: 'Quebec' },
  { code: 'CA-SK', name: 'Saskatchewan' },
  { code: 'CA-YT', name: 'Yukon' },
];

/** The fixed list merged with the places the API returns. */
export function placeOptions(supported: Supported): PlaceOption[] {
  const fromApi = new Map(supported.map((j) => [j.code, j]));
  const fixed = PROVINCES.map(({ code, name }) => {
    const found = fromApi.get(code);
    return found
      ? { code, name: found.name.trim() || code, supported: true }
      : { code, name, supported: false };
  });
  const known = new Set(PROVINCES.map((p) => p.code));
  const extra = supported
    .filter((j) => !known.has(j.code))
    .map((j) => ({
      code: j.code,
      name: j.name.trim() || j.code,
      supported: true,
    }));
  return [...fixed, ...extra];
}
