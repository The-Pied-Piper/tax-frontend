import type { ListJurisdictionsResponse } from '../api';
import { placeOptions } from './places';

type Supported = ListJurisdictionsResponse['jurisdictions'];

const api = (...places: [string, string][]): Supported =>
  places.map(([code, name]) => ({
    code,
    name,
    years: [{ year: 2025, provisional: false }],
  }));

const soon = [
  { code: 'CA-AB', name: 'Alberta' },
  { code: 'CA-BC', name: 'British Columbia' },
];

describe('placeOptions', () => {
  it('lists the API places first, then the coming-soon ones', () => {
    expect(placeOptions(api(['CA-ON', 'Ontario']), soon)).toEqual([
      { code: 'CA-ON', name: 'Ontario', supported: true },
      { code: 'CA-AB', name: 'Alberta', supported: false },
      { code: 'CA-BC', name: 'British Columbia', supported: false },
    ]);
  });

  it('lets the API entry win for a code it serves', () => {
    expect(placeOptions(api(['CA-AB', '  Alberta Prov ']), soon)).toEqual([
      { code: 'CA-AB', name: 'Alberta Prov', supported: true },
      { code: 'CA-BC', name: 'British Columbia', supported: false },
    ]);
  });

  it('falls back to the code when the API name is blank', () => {
    expect(placeOptions(api(['CA-ON', '  ']), [])).toEqual([
      { code: 'CA-ON', name: 'CA-ON', supported: true },
    ]);
  });

  it('lists only coming-soon places for an empty API', () => {
    expect(placeOptions([], soon).every((o) => !o.supported)).toBe(true);
  });
});
