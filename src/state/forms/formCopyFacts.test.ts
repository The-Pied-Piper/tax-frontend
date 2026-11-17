import { pageOf as page, sectionOf as section } from '../../test/formText';

function longestSentence(text: string): number {
  return Math.max(
    0,
    ...text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.split(/\s+/).filter(Boolean).length),
  );
}

describe('t1-tax balance section copy', () => {
  const balance = () => section('t1-tax', 'balance');

  it('no longer calls the section "Your total tax"', () => {
    expect(balance().heading).not.toMatch(/^your total tax$/i);
  });

  it('names total payable and refund or balance owing', () => {
    const text = `${balance().heading} ${balance().paragraph}`;
    expect(text).toMatch(/total payable/i);
    expect(text).toMatch(/refund or balance owing/i);
  });

  it('explains line 167 as total payable minus total credits', () => {
    const { paragraph } = balance();
    expect(paragraph).toMatch(/167/);
    expect(paragraph).toMatch(/total payable/i);
    expect(paragraph).toMatch(/total credits/i);
  });

  it('says tax already taken off pay is left out', () => {
    expect(balance().paragraph).toMatch(/already taken off|already deducted/i);
  });

  it('keeps sentences short', () => {
    const { heading, paragraph } = balance();
    expect(longestSentence(`${heading}. ${paragraph}`)).toBeLessThanOrEqual(40);
  });
});

describe('schedule-8 intro copy', () => {
  const { intro } = page('schedule-8');

  it('does not say the form works out how much you paid', () => {
    expect(intro).not.toMatch(/how much you paid/i);
  });

  it('says it works out contributions required and any overpayment', () => {
    expect(intro).toMatch(/required/i);
    expect(intro).toMatch(/overpa/i);
  });

  it('keeps sentences short', () => {
    expect(longestSentence(intro)).toBeLessThanOrEqual(40);
  });
});

describe('on428 total section copy', () => {
  const { paragraph } = section('on428', 'total');

  it('does not say the premium is not a rate', () => {
    expect(paragraph).not.toMatch(/not a rate/i);
    expect(paragraph).not.toMatch(/a set amount, not/i);
  });

  it('says the premium steps up with income and phases in', () => {
    expect(paragraph).toMatch(/steps? up/i);
    expect(paragraph).toMatch(/phase/i);
  });

  it('keeps sentences short', () => {
    expect(longestSentence(paragraph)).toBeLessThanOrEqual(40);
  });
});
