import { addressOf, pagePath, pageUrl } from './address';

// The one function that says where a salary page lives. The sitemap, the
// canonical link, og:url and the page links all take their address from it.
describe('pagePath', () => {
  it('is the folder of the page, with a leading and a trailing slash', () => {
    expect(pagePath('ca-on', '70000')).toBe('/ca-on/70000/');
    expect(pagePath('ca-on', 30000)).toBe('/ca-on/30000/');
  });
});

describe('pageUrl', () => {
  it('puts the site origin in front of the path', () => {
    expect(pageUrl('https://aftertaxlens.com', 'ca-on', '70000')).toBe(
      'https://aftertaxlens.com/ca-on/70000/',
    );
  });
});

describe('addressOf', () => {
  it('keeps the salary page address', () => {
    expect(addressOf('ca-on/70000/index.html')).toBe('/ca-on/70000/');
  });

  it('maps a content page file to its address through the site links', () => {
    expect(addressOf('sample-page/index.html')).toBe('/sample-page/');
    expect(addressOf('ca-on/index.html')).toBe('/ca-on/');
    expect(addressOf('methodology/index.html')).toBe('/methodology/');
  });

  it('maps a nested content page file', () => {
    expect(addressOf('forms/bc428/index.html')).toBe('/forms/bc428/');
    expect(addressOf('forms/ca/bc428/index.html')).toBe('/forms/ca/bc428/');
  });

  it('throws on a path that is not a page file', () => {
    for (const file of [
      'index.html',
      'sample-page/page.html',
      'Bad_Slug/index.html',
      'ca-on/70000/page.html',
      '',
    ]) {
      expect(() => addressOf(file), file).toThrow();
    }
  });
});
