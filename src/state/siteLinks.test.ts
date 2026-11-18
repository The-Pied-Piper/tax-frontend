import {
  contentFile,
  contentPath,
  contentSlugOfFile,
  FOOTER_PROVINCE_SLUGS,
  FORMS_SEGMENT,
  formSlug,
  HOME_PATH,
  isContentSlug,
  METHODOLOGY_SLUG,
  NOT_FOUND_FILE,
} from './siteLinks';

// The one place that says where a content page lives.
describe('contentPath', () => {
  it('is the folder of the page, with a leading and a trailing slash', () => {
    expect(contentPath('ca-on')).toBe('/ca-on/');
    expect(contentPath('methodology')).toBe('/methodology/');
  });

  it('keeps the slashes inside a nested slug', () => {
    expect(contentPath('forms/bc428')).toBe('/forms/bc428/');
  });
});

describe('contentFile', () => {
  it('is the index.html below the slug folder, with no leading slash', () => {
    expect(contentFile('ca-on')).toBe('ca-on/index.html');
    expect(contentFile('forms/bc428')).toBe('forms/bc428/index.html');
  });
});

describe('contentSlugOfFile', () => {
  it('is the inverse of contentFile', () => {
    for (const slug of ['ca-on', 'methodology', 'forms/bc428']) {
      expect(contentSlugOfFile(contentFile(slug))).toBe(slug);
    }
  });

  it('throws on a path that is not <slug>/index.html', () => {
    for (const file of [
      'index.html',
      'ca-on/page.html',
      'ca-on/',
      '/ca-on/index.html',
      'Bad_Slug/index.html',
      '',
    ]) {
      expect(() => contentSlugOfFile(file), file).toThrow();
    }
  });
});

describe('isContentSlug', () => {
  it('accepts lower-case letters, digits and hyphens in / separated segments', () => {
    for (const slug of ['ca-on', 'methodology', 'forms/bc428', 'a1/b-2/c3']) {
      expect(isContentSlug(slug), slug).toBe(true);
    }
  });

  it('rejects anything else', () => {
    for (const slug of [
      '',
      'Upper',
      'with space',
      'under_score',
      '/leading',
      'trailing/',
      'double//slash',
      'dots.html',
      '../up',
      'a/./b',
      '-',
    ]) {
      expect(isContentSlug(slug), slug).toBe(false);
    }
  });
});

describe('footer targets', () => {
  it('names the methodology slug', () => {
    expect(METHODOLOGY_SLUG).toBe('methodology');
  });

  it('lists Ontario, Alberta, British Columbia and Manitoba, in that order', () => {
    expect([...FOOTER_PROVINCE_SLUGS]).toEqual([
      'ca-on',
      'ca-ab',
      'ca-bc',
      'ca-mb',
    ]);
  });

  it('gives the calculator the root address', () => {
    expect(HOME_PATH).toBe('/');
  });

  it('uses valid slugs only', () => {
    for (const slug of FOOTER_PROVINCE_SLUGS) {
      expect(isContentSlug(slug)).toBe(true);
    }
    expect(isContentSlug(METHODOLOGY_SLUG)).toBe(true);
  });
});

describe('formSlug', () => {
  it('names the folder the form pages live in', () => {
    expect(FORMS_SEGMENT).toBe('forms');
  });

  it('puts the form id below that folder', () => {
    expect(formSlug('on428')).toBe('forms/on428');
    expect(formSlug('on428-a')).toBe('forms/on428-a');
  });

  it('gives a valid slug and the address a form page is served at', () => {
    expect(isContentSlug(formSlug('t1-income'))).toBe(true);
    expect(contentPath(formSlug('bc428'))).toBe('/forms/bc428/');
    expect(contentFile(formSlug('bc428'))).toBe('forms/bc428/index.html');
  });
});

describe('NOT_FOUND_FILE', () => {
  it('is the file at the top of the output that the host serves for a missing page', () => {
    expect(NOT_FOUND_FILE).toBe('404.html');
  });
});
