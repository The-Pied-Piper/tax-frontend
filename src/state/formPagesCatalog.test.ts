import { DESCRIPTION_LIMIT, TITLE_LIMIT } from '../../build/salaryPages/limits';
import { strings } from '../strings';
import type { FormPageSpec, FormSection } from './formPage';
import { formPages } from './formPages';
import { copyRules, everyString } from '../test/copyRules';
import { hubPage, provinceHubs } from './provinceHubs';

// The forms this catalog must list. Other threads may add more ids to the list,
// so these are checked for presence, not for an exact match.
const REQUIRED = [
  { id: 'on428', province: 'ca-on', year: 2025 },
  { id: 't2204', province: 'ca-on', year: 2025 },
  { id: 'schedule-6', province: 'ca-on', year: 2025 },
  { id: 'on428-a', province: 'ca-on', year: 2025 },
  { id: 'bc479', province: 'ca-bc', year: 2025 },
] as const;

// The four pages this ticket adds. on428 already has its page.
const NEW_IDS = ['t2204', 'schedule-6', 'on428-a', 'bc479'] as const;

const BANNED = ['taxtips', 'cra calculator', 'pdoc'] as const;

/** The page with this id. Throws while it is missing, so the failure names the id. */
function pageOf(id: string): FormPageSpec {
  const form = formPages.find((page) => page.id === id);
  if (!form) throw new Error(`no form page "${id}" in formPages`);
  return form;
}

/** A section's text with each `{name}` figure shown as its value. */
function shown(section: FormSection, text: string): string {
  return text.replace(
    /\{([a-z][a-zA-Z0-9]*)\}/g,
    (whole, name: string) => section.figures[name]?.shown ?? whole,
  );
}

/** Every word of the page's copy, with each `{name}` figure shown as its value. */
function wordsOf(form: FormPageSpec): string {
  return everyString({
    title: form.title,
    description: form.description,
    intro: form.intro,
    sections: form.sections.map((section) => ({
      heading: section.heading,
      paragraph: shown(section, section.paragraph),
      example: shown(section, section.example),
    })),
  }).join(' ');
}

/** The paragraphs and worked examples of a page, with figures shown as their values. */
function bodyOf(form: FormPageSpec): string {
  return form.sections
    .flatMap((section) => [
      shown(section, section.paragraph),
      shown(section, section.example),
    ])
    .join(' ');
}

/** The copy the copy rules apply to: the intro, the headings, the paragraphs and the examples. */
function copyOf(form: FormPageSpec) {
  return {
    intro: form.intro,
    sections: form.sections.map((section) => ({
      heading: section.heading,
      paragraph: section.paragraph,
      example: section.example,
    })),
  };
}

describe('the form page catalog', () => {
  it.each(REQUIRED)(
    'lists $id for $province in $year, at the 70000 example',
    ({ id, province, year }) => {
      const form = pageOf(id);
      expect(form.province).toBe(province);
      expect(form.year).toBe(year);
      expect(form.exampleSalary).toBe('70000');
    },
  );
});

describe.each(NEW_IDS)('the form page %s', (id) => {
  it('has a title and description within the limits', () => {
    const form = pageOf(id);
    expect(form.title.length).toBeGreaterThan(0);
    expect(form.title.length).toBeLessThan(TITLE_LIMIT);
    expect(form.description.length).toBeGreaterThan(0);
    expect(form.description.length).toBeLessThan(DESCRIPTION_LIMIT);
  });

  it('has at least two sections', () => {
    expect(pageOf(id).sections.length).toBeGreaterThanOrEqual(2);
  });

  it('has section ids that are all different', () => {
    const ids = pageOf(id).sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(copyRules)('holds no %s in its copy', (_name, pattern) => {
    const copy = copyOf(pageOf(id));
    for (const words of everyString(copy)) {
      expect(words, words).not.toMatch(pattern);
    }
  });

  it.each(BANNED)('does not use the banned word "%s"', (banned) => {
    const words = wordsOf(pageOf(id)).toLowerCase().replace(/\s+/g, ' ');
    expect(words).not.toContain(banned);
  });
});

describe('the one fact each new page states plainly', () => {
  it('t2204 names the $2,000 amount', () => {
    expect(bodyOf(pageOf('t2204'))).toMatch(/\$2,000/i);
  });

  it('bc479 says the credit is refundable or paid to you', () => {
    expect(bodyOf(pageOf('bc479'))).toMatch(/refundable|paid to you/i);
  });

  it('schedule-6 names the Canada Workers Benefit', () => {
    expect(bodyOf(pageOf('schedule-6'))).toMatch(/Canada Workers Benefit/i);
  });

  it('on428-a names the LIFT credit', () => {
    expect(bodyOf(pageOf('on428-a'))).toMatch(/LIFT/i);
  });
});

describe('the hub lists for the new forms', () => {
  const ontario = provinceHubs.find((hub) => hub.slug === 'ca-on');
  if (!ontario) throw new Error('no hub text for ca-on');
  const federal = hubPage(
    ontario,
    strings.siteNav.provinceNames['ca-on'],
    [],
    new Set(),
    [],
  ).sections.find((section) => section.heading === 'The forms we follow');
  const federalLabels = (federal?.blocks ?? []).flatMap((block) =>
    block.kind === 'list' ? block.items.map((item) => item.label) : [],
  );

  // The federal forms the hubs list, by the label each hub shows for them.
  const FEDERAL: [string, string][] = [
    ['t2204', 'Form T2204: EI overpayment'],
    ['schedule-6', 'Schedule 6: Canada Workers Benefit'],
  ];

  it.each(FEDERAL)('lists %s on every hub, under the label %s', (id, label) => {
    expect(federalLabels).toContain(label);
    expect(pageOf(id).name).toBe(label);
  });

  // The province's own forms, as the hubs list them.
  const OWN: [string, string][] = [
    ['on428-a', 'ca-on'],
    ['bc479', 'ca-bc'],
  ];

  it.each(OWN)(
    'lists %s on the %s hub, under the name the page gives',
    (id, slug) => {
      const hub = provinceHubs.find((h) => h.slug === slug);
      const listed = hub?.own.find((form) => form.id === id);
      expect(listed, `${id} on the ${slug} hub`).toBeDefined();
      expect(pageOf(id).name).toBe(listed?.name);
    },
  );
});
