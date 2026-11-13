import { pagePath, pageUrl } from './address';

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
