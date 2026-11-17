import { render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ContentPage } from './ContentPage';
import { formContentPage } from '../state/formPage';
import { formPages } from '../state/formPages';
import { isSitePath } from '../state/salaryPageData';
import { sampleFormSpec } from '../test/contentPageData';
import { strings } from '../strings';

const page = formContentPage(sampleFormSpec);

describe('a form page', () => {
  it('shows the notice with the year and the example salary', () => {
    render(<ContentPage {...page} />);
    expect(
      screen.getByText(strings.formPage.notice(2025, '$70,000')),
    ).toBeInTheDocument();
  });

  it('lists each part in the contents with a link to its address', () => {
    render(<ContentPage {...page} />);
    const contents = screen.getByRole('navigation', {
      name: strings.formPage.contents,
    });
    expect(
      within(contents)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual([
      ['Line 1 First part', '#first'],
      ['Lines 2–4 Second part', '#second'],
    ]);
  });

  it('gives each part an id, a permalink, a line pill, a paragraph and an example', () => {
    const { container } = render(<ContentPage {...page} />);
    const first = container.querySelector('#first');
    expect(first).not.toBeNull();
    const part = within(first as HTMLElement);
    expect(
      part.getByRole('heading', { level: 2, name: /First part/ }),
    ).toBeInTheDocument();
    expect(
      part.getByRole('link', {
        name: strings.formPage.permalink('First part'),
      }),
    ).toHaveAttribute('href', '#first');
    expect(part.getByText('Line 1')).toBeInTheDocument();
    expect(part.getByText('At $70,000')).toBeInTheDocument();
    const figures = part.getAllByText('$100');
    expect(figures).toHaveLength(2);
    for (const figure of figures) expect(figure.tagName).toBe('CODE');
  });

  it('leaves no figure marker in the words', () => {
    const { container } = render(<ContentPage {...page} />);
    expect(container.textContent).not.toMatch(/[{}]/);
  });

  it('ends with the related links: the province page, the methodology and a salary page', () => {
    render(<ContentPage {...page} />);
    const related = screen.getByRole('navigation', {
      name: strings.formPage.related,
    });
    expect(
      within(related)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual([
      ['Ontario forms and salary pages', '/ca-on/'],
      ['How we calculate', '/methodology/'],
      ['See a $70,000 example', '/ca-on/70000/'],
    ]);
  });

  it('keeps the theme switch and the footer of every content page', () => {
    render(<ContentPage {...page} />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(strings.footer);
    expect(
      screen.getByRole('group', { name: strings.themeLabel }),
    ).toBeInTheDocument();
  });

  it('renders on the server with the part ids in the markup', () => {
    const html = renderToString(<ContentPage {...page} />);
    expect(html).toContain('id="first"');
    expect(html).toContain('href="#second"');
  });
});

// Clean addresses are served by a rewrite, so the browser's address may have no
// trailing slash: a link that is not a site path (or a fragment of the page
// itself) would resolve against the wrong base.
describe.each([sampleFormSpec, ...formPages])(
  'links on the $name page',
  (spec) => {
    it('are all site paths or fragments of the page', () => {
      const { container } = render(<ContentPage {...formContentPage(spec)} />);
      const hrefs = [...container.querySelectorAll('a')].map((a) =>
        a.getAttribute('href'),
      );
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(
          href !== null && (href.startsWith('#') || isSitePath(href)),
          href ?? 'no href',
        ).toBe(true);
      }
    });
  },
);
