import { breadcrumbJsonLd } from './breadcrumbJsonLd';

const site = 'https://example.test';
const trail = {
  steps: [
    { label: 'Home', href: '/' },
    { label: 'Ontario', href: '/ca-on/' },
  ],
  current: '$75,000',
};

/** The script elements in the markup, and the text of the first. */
function parseBlock(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const scripts = doc.querySelectorAll('script');
  return { scripts, text: scripts[0]?.textContent ?? '' };
}

describe('breadcrumbJsonLd', () => {
  it('is one application/ld+json script element', () => {
    const html = breadcrumbJsonLd(trail, site, '/ca-on/75000/');
    expect(html.startsWith('<script type="application/ld+json">')).toBe(true);
    expect(html.endsWith('</script>')).toBe(true);
    const { scripts } = parseBlock(html);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.getAttribute('type')).toBe('application/ld+json');
  });

  it('is a schema.org BreadcrumbList of ListItems with 1-based positions, names and absolute addresses', () => {
    const { text } = parseBlock(breadcrumbJsonLd(trail, site, '/ca-on/75000/'));
    expect(JSON.parse(text)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://example.test/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Ontario',
          item: 'https://example.test/ca-on/',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: '$75,000',
          item: 'https://example.test/ca-on/75000/',
        },
      ],
    });
  });

  it('has the page itself as the only item when there are no steps', () => {
    const { text } = parseBlock(
      breadcrumbJsonLd({ steps: [], current: 'Only' }, site, '/only/'),
    );
    expect(JSON.parse(text)).toMatchObject({
      itemListElement: [
        { position: 1, name: 'Only', item: 'https://example.test/only/' },
      ],
    });
  });

  it('writes a < in a name as \\u003c so the text cannot end the script element', () => {
    const html = breadcrumbJsonLd(
      { steps: [{ label: 'A </script><b>', href: '/a/' }], current: 'x<y' },
      site,
      '/a/x/',
    );
    const inner = html.slice(
      '<script type="application/ld+json">'.length,
      -'</script>'.length,
    );
    expect(inner).not.toContain('<');
    expect(inner).toContain('\\u003c/script>');
    const { scripts, text } = parseBlock(html);
    expect(scripts).toHaveLength(1);
    const names = (
      JSON.parse(text) as { itemListElement: { name: string }[] }
    ).itemListElement.map((i) => i.name);
    expect(names).toEqual(['A </script><b>', 'x<y']);
  });
});
