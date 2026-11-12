import type { ListJurisdictionsResponse } from '../api/client';
import { placeOptions } from './places';

type Supported = ListJurisdictionsResponse['jurisdictions'];

const api = (...places: [string, string][]): Supported =>
  places.map(([code, name]) => ({
    code,
    name,
    years: [{ year: 2025, provisional: false }],
  }));

const fixed = [
  ['CA-AB', 'Alberta'],
  ['CA-BC', 'British Columbia'],
  ['CA-MB', 'Manitoba'],
  ['CA-NB', 'New Brunswick'],
  ['CA-NL', 'Newfoundland and Labrador'],
  ['CA-NT', 'Northwest Territories'],
  ['CA-NS', 'Nova Scotia'],
  ['CA-NU', 'Nunavut'],
  ['CA-ON', 'Ontario'],
  ['CA-PE', 'Prince Edward Island'],
  ['CA-QC', 'Quebec'],
  ['CA-SK', 'Saskatchewan'],
  ['CA-YT', 'Yukon'],
];

describe('placeOptions', () => {
  it('lists the 13 places alphabetically, all unsupported, for an empty API', () => {
    expect(placeOptions([])).toEqual(
      fixed.map(([code, name]) => ({ code, name, supported: false })),
    );
  });

  it('marks only the places the API returns as supported', () => {
    const out = placeOptions(api(['CA-ON', 'Ontario']));
    expect(out).toHaveLength(13);
    expect(out.filter((o) => o.supported)).toEqual([
      { code: 'CA-ON', name: 'Ontario', supported: true },
    ]);
  });

  it('uses the trimmed API name for a supported place', () => {
    const out = placeOptions(api(['CA-AB', '  Alberta Prov ']));
    expect(out[0]).toEqual({
      code: 'CA-AB',
      name: 'Alberta Prov',
      supported: true,
    });
  });

  it('falls back to the code when the API name is blank', () => {
    const out = placeOptions(api(['CA-ON', '  ']));
    expect(out.find((o) => o.code === 'CA-ON')).toEqual({
      code: 'CA-ON',
      name: 'CA-ON',
      supported: true,
    });
  });

  it('appends API places outside the fixed list, supported, after the fixed ones', () => {
    const out = placeOptions(api(['US-NY', 'New York'], ['CA-ON', 'Ontario']));
    expect(out).toHaveLength(14);
    expect(out[13]).toEqual({
      code: 'US-NY',
      name: 'New York',
      supported: true,
    });
    expect(out.slice(0, 13).map((o) => o.code)).toEqual(fixed.map(([c]) => c));
  });
});
