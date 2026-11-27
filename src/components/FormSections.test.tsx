import { render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ContentPage } from './ContentPage';
import type { ContentPageSpec } from '../state/contentPages';
import { formContentPage, type FormPageSpec } from '../state/formPage';
import { formPages } from '../state/formPages';
import { isSitePath } from '../state/salaryPageData';
import { sampleFormSpec } from '../test/contentPageData';
import { strings } from '../strings';

const page = formContentPage(sampleFormSpec);
const form = page.form;
if (!form) throw new Error('the sample form has no body');

/** The page as the build hands it over, with the salary link flag set or not. */
const pageWith = (salaryPageWritten?: boolean): ContentPageSpec => ({
  ...page,
  form: { ...form, salaryPageWritten },
});

/** The sample as a federal form: the same parts, marked as shared by the federal pages. */
const federalPageWith = (salaryPageWritten?: boolean): ContentPageSpec => {
  const federal = formContentPage({
    ...sampleFormSpec,
    federal: true,
  });
  if (!federal.form) throw new Error('the federal sample has no body');
  return { ...federal, form: { ...federal.form, salaryPageWritten } };
};

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
    const heading = part.getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe('First part');
    const permalink = part.getByRole('link', {
      name: strings.formPage.permalink('First part'),
    });
    expect(permalink).toHaveAttribute('href', '#first');
    expect(heading).not.toContainElement(permalink);
    const pill = part.getByText('Line 1');
    expect(heading).not.toContainElement(pill);
    expect(first).toContainElement(permalink);
    expect(first).toContainElement(pill);
    expect(first?.getAttribute('aria-labelledby')).toBe('first-heading');
    expect(container.querySelector('#first-heading')?.textContent).toBe(
      'First part',
    );
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
    render(<ContentPage {...pageWith(true)} />);
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

  it.each([
    ['is false', false],
    ['is not set', undefined],
  ])('has no salary link when the salary page flag %s', (_, flag) => {
    render(<ContentPage {...pageWith(flag)} />);
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
    ]);
  });

  it('ends with the province hubs, the methodology and the Ontario salary page on a federal page', () => {
    render(<ContentPage {...federalPageWith(true)} />);
    const related = screen.getByRole('navigation', {
      name: strings.formPage.related,
    });
    expect(
      within(related)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual([
      ['Ontario forms and salary pages', '/ca-on/'],
      ['Alberta forms and salary pages', '/ca-ab/'],
      ['British Columbia forms and salary pages', '/ca-bc/'],
      ['Manitoba forms and salary pages', '/ca-mb/'],
      ['Saskatchewan forms and salary pages', '/ca-sk/'],
      ['Newfoundland and Labrador forms and salary pages', '/ca-nl/'],
      ['New Brunswick forms and salary pages', '/ca-nb/'],
      ['Nova Scotia forms and salary pages', '/ca-ns/'],
      ['Prince Edward Island forms and salary pages', '/ca-pe/'],
      ['Québec forms and salary pages', '/ca-qc/'],
      ['How we calculate', '/methodology/'],
      ['See an Ontario $70,000 example', '/ca-on/70000/'],
    ]);
  });

  it.each([
    ['is false', false],
    ['is not set', undefined],
  ])(
    'has no salary link on a federal page when the salary page flag %s',
    (_, flag) => {
      render(<ContentPage {...federalPageWith(flag)} />);
      const related = screen.getByRole('navigation', {
        name: strings.formPage.related,
      });
      expect(
        within(related)
          .getAllByRole('link')
          .map((a) => [a.textContent, a.getAttribute('href')]),
      ).toEqual([
        ['Ontario forms and salary pages', '/ca-on/'],
        ['Alberta forms and salary pages', '/ca-ab/'],
        ['British Columbia forms and salary pages', '/ca-bc/'],
        ['Manitoba forms and salary pages', '/ca-mb/'],
        ['Saskatchewan forms and salary pages', '/ca-sk/'],
        ['Newfoundland and Labrador forms and salary pages', '/ca-nl/'],
        ['New Brunswick forms and salary pages', '/ca-nb/'],
        ['Nova Scotia forms and salary pages', '/ca-ns/'],
        ['Prince Edward Island forms and salary pages', '/ca-pe/'],
        ['Québec forms and salary pages', '/ca-qc/'],
        ['How we calculate', '/methodology/'],
      ]);
    },
  );

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

// The h2 is what screen readers and search read, so it holds only the words.
describe.each(formPages)('the headings on the $name page', (spec) => {
  const built = formContentPage(spec);

  it('read exactly as the section heading, with the permalink and tag outside', () => {
    const { container } = render(<ContentPage {...built} />);
    const sections = [...container.querySelectorAll('section[id]')];
    expect(sections.length).toBe(spec.sections.length);
    spec.sections.forEach((section, at) => {
      const el = sections[at];
      if (el === undefined) throw new Error(`no section at ${at.toString()}`);
      expect(el.id).toBe(section.id);
      const h2 = el.querySelector('h2, h3');
      expect(h2?.textContent).toBe(section.heading);
      const permalink = el.querySelector(`a[href="#${section.id}"]`);
      expect(permalink).not.toBeNull();
      expect(h2).not.toContainElement(permalink as HTMLElement);
    });
  });

  it('keep every contents link pointing at an existing section', () => {
    const { container } = render(<ContentPage {...built} />);
    const contents = screen.getByRole('navigation', {
      name: strings.formPage.contents,
    });
    const links = within(contents).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      spec.sections.map((section) => `#${section.id}`),
    );
    for (const a of links) {
      const target = (a.getAttribute('href') ?? '').slice(1);
      expect(container.querySelector(`section[id="${target}"]`)).not.toBeNull();
    }
  });
});

/** A made-up form whose first part has links and whose second part has none. */
const linkedSpec: FormPageSpec = {
  id: 'linked-form',
  name: 'Form LINKED: A made-up form',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form LINKED in plain words',
  description: 'A made-up form page with links in one part.',
  intro: 'What the made-up form is for.',
  sections: [
    {
      id: 'first',
      heading: 'First part',
      lines: 'Line 1',
      paragraph: 'Only words here.',
      example: 'No figure.',
      figures: {},
      links: [
        { label: 'Sample schedule', href: '/forms/sample-schedule/' },
        { label: 'Same page part', href: '#second' },
      ],
    },
    {
      id: 'second',
      heading: 'Second part',
      lines: 'Lines 2–4',
      paragraph: 'Only words here.',
      example: 'No figure.',
      figures: {},
    },
  ],
};

describe('the links of a form part', () => {
  it('draws each link as an anchor inside its own part', () => {
    const { container } = render(
      <ContentPage {...formContentPage(linkedSpec)} />,
    );
    const first = container.querySelector('#first');
    expect(first).not.toBeNull();
    expect(
      within(first as HTMLElement)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual([
      ['#', '#first'],
      ['Sample schedule', '/forms/sample-schedule/'],
      ['Same page part', '#second'],
    ]);
  });

  it('shows the links after the worked example, not inside it', () => {
    const { container } = render(
      <ContentPage {...formContentPage(linkedSpec)} />,
    );
    const first = container.querySelector('#first') as HTMLElement;
    const exampleBox = within(first).getByText('At $70,000')
      .parentElement as HTMLElement;
    const link = within(first).getByRole('link', { name: 'Sample schedule' });
    expect(exampleBox).not.toContainElement(link);
    expect(
      exampleBox.compareDocumentPosition(link) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('draws the links as one short row', () => {
    const { container } = render(
      <ContentPage {...formContentPage(linkedSpec)} />,
    );
    const first = container.querySelector('#first') as HTMLElement;
    const rowLinks = within(first)
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') !== '#first');
    expect(rowLinks).toHaveLength(2);
    const rows = new Set(rowLinks.map((a) => a.parentElement));
    expect(rows.size).toBe(1);
  });

  it('adds no link row to a part without links', () => {
    const { container } = render(
      <ContentPage {...formContentPage(linkedSpec)} />,
    );
    const second = container.querySelector('#second') as HTMLElement;
    expect(
      within(second)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['#second']);
  });
});

describe('a form page with step groups', () => {
  const grouped: FormPageSpec = {
    ...sampleFormSpec,
    sections: sampleFormSpec.sections.map((section, at) => ({
      ...section,
      group: at === 0 ? 'Group A' : 'Group B',
    })),
  };

  it('shows each group once, as a heading above its parts, which sit one level lower', () => {
    render(<ContentPage {...formContentPage(grouped)} />);
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual(expect.arrayContaining(['Group A', 'Group B']));
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent),
    ).toEqual(['First part', 'Second part']);
  });
});
