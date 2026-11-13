import { COMING_SOON } from '../adapters/coming-soon';
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
  { code: 'CA-BC', name: 'British Columbia' },
  { code: 'CA-MB', name: 'Manitoba' },
];

describe('placeOptions', () => {
  it('lists the API places first, then the coming-soon ones', () => {
    expect(placeOptions(api(['CA-ON', 'Ontario']), soon)).toEqual([
      { code: 'CA-ON', name: 'Ontario', supported: true },
      { code: 'CA-BC', name: 'British Columbia', supported: false },
      { code: 'CA-MB', name: 'Manitoba', supported: false },
    ]);
  });

  it('lets the API entry win for a code it serves', () => {
    expect(
      placeOptions(api(['CA-BC', '  British Columbia Prov ']), soon),
    ).toEqual([
      { code: 'CA-BC', name: 'British Columbia Prov', supported: true },
      { code: 'CA-MB', name: 'Manitoba', supported: false },
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

describe('COMING_SOON', () => {
  it('no longer lists Alberta, which the API now serves', () => {
    expect(COMING_SOON.map((p) => p.code)).not.toContain('CA-AB');
  });
});
