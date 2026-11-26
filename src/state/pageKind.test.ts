import { describe, expect, it } from 'vitest';
import { contentPageKind } from './pageKind';

describe('contentPageKind', () => {
  it.each([
    ['/compare-provinces/', 'compare'],
    ['/forms/on428/', 'form'],
    ['/ca-on/tax-rates/', 'rates'],
    ['/ca-qc/', 'hub'],
    ['/ca-qc', 'hub'],
    ['/nowhere/tax-rates/', 'other'],
    ['/forms/', 'other'],
    ['/some-missing-page/', 'other'],
    ['/', 'other'],
  ])('%s is %s', (path, kind) => {
    expect(contentPageKind(path)).toBe(kind);
  });
});
