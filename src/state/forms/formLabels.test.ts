import { formPages } from '../formPages';

function pageOf(id: string) {
  const form = formPages.find((entry) => entry.id === id);
  if (!form) throw new Error(`No form page with id ${id}`);
  return form;
}

function sectionOf(pageId: string, sectionId: string) {
  const section = pageOf(pageId).sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`No section ${sectionId} on ${pageId}`);
  return section;
}

/** A section's paragraph, with each `{name}` shown as its figure. */
function paragraphOf(pageId: string, sectionId: string): string {
  const section = sectionOf(pageId, sectionId);
  return section.paragraph.replace(
    /\{([a-z][a-zA-Z0-9]*)\}/g,
    (whole, name: string) => section.figures[name]?.shown ?? whole,
  );
}

describe('form page labels and copy (ticket 168)', () => {
  it('ab428 names its supplement section "Alberta supplemental tax credit"', () => {
    const section = sectionOf('ab428', 'supplement');
    expect(section.heading).toMatch(/^Alberta supplemental tax credit$/i);
    expect(section.heading).not.toMatch(/extra credit/i);
  });

  it('ab428 supplement says tuition is not counted in the credit total', () => {
    expect(paragraphOf('ab428', 'supplement')).toMatch(/tuition/i);
  });

  it('on428 credits says "main part of your pension plan payments"', () => {
    const text = paragraphOf('on428', 'credits');
    expect(text).toMatch(/main part of your pension plan payments/i);
    expect(text).not.toMatch(/the pension plan and EI payments/i);
  });

  it('t1-income deductions names line 22215 and says 23300 is the total', () => {
    const text = paragraphOf('t1-income', 'deductions');
    expect(text).toMatch(/22215/);
    expect(text).toMatch(/23300/);
    expect(text).toMatch(/total/i);
  });

  it('t1-income deductions label lists both 22215 and 23300', () => {
    const { lines } = sectionOf('t1-income', 'deductions');
    expect(lines).toMatch(/22215/);
    expect(lines).toMatch(/23300/);
    expect(lines).toMatch(/^Lines? [A-Z\d]/);
  });

  it('schedule-8 on-return mentions lines 30800 and 22215', () => {
    const text = paragraphOf('schedule-8', 'on-return');
    expect(text).toMatch(/30800/);
    expect(text).toMatch(/22215/);
  });

  it('t4 pension mentions box 16A', () => {
    expect(paragraphOf('t4', 'pension')).toMatch(/16A/);
  });

  it('t1-tax after-credits says "basic federal tax"', () => {
    const text = paragraphOf('t1-tax', 'after-credits');
    expect(text).toMatch(/basic federal tax/i);
    expect(text).not.toMatch(/is your federal tax\.?\s*$/i);
  });

  it('bc428 reduction says the reduction is zero at net income of $40,807 or more', () => {
    const text = paragraphOf('bc428', 'reduction');
    expect(text).toMatch(/net income/i);
    expect(text).toMatch(/\$40,807/);
    expect(text).not.toMatch(/your income/i);
  });
});
