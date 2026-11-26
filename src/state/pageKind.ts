import {
  COMPARE_SLUG,
  FOOTER_PROVINCE_SLUGS,
  FORMS_SEGMENT,
  RATES_SEGMENT,
} from './siteLinks';
import type { VisitKind } from '../beacon/visitBeacon';

function isProvince(segment: string | undefined): boolean {
  return FOOTER_PROVINCE_SLUGS.some((slug) => slug === segment);
}

// The kind of a pre-built content page, from its address alone, for the beacons.
// Only this fixed word is ever sent, never the address, so a page's province,
// form or year does not leave the browser through the beacon.
export function contentPageKind(pathname: string): VisitKind {
  const parts = pathname.split('/').filter((part) => part !== '');
  const [first, second] = parts;
  if (parts.length === 1 && first === COMPARE_SLUG) return 'compare';
  if (parts.length === 2 && first === FORMS_SEGMENT) return 'form';
  if (parts.length === 2 && second === RATES_SEGMENT && isProvince(first)) {
    return 'rates';
  }
  if (parts.length === 1 && isProvince(first)) return 'hub';
  return 'other';
}
