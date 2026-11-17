import { pageOf as page, sectionOf as section } from '../../test/formText';
import { contentPath, formSlug } from '../siteLinks';

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

describe('bc479 copy', () => {
  const text = () =>
    page('bc479')
      .sections.map((s) => `${s.paragraph} ${s.example}`)
      .join(' ');

  it('says it counts only the sales tax credit', () => {
    expect(text()).toMatch(
      /(count|use|include|add)\w*[^.]*\b(only|just)\b[^.]*sales tax credit|\b(only|just) the sales tax credit/i,
    );
  });

  it('says in the intro that it counts only the sales tax credit', () => {
    expect(page('bc479').intro).toMatch(/only the sales tax credit/i);
  });

  it("says the renter's credit can still pay at higher incomes, if you paid rent", () => {
    const { paragraph, example } = section('bc479', 'total');
    const total = `${paragraph} ${example}`;
    expect(total).toMatch(/higher incomes/i);
    expect(total).toMatch(/paid rent/i);
  });

  it("names the renter's credit as left out", () => {
    expect(text()).toMatch(/renter/i);
  });

  it('names the home renovation credit as left out', () => {
    expect(text()).toMatch(/home renovation/i);
  });

  it('names the venture capital credit as left out', () => {
    expect(text()).toMatch(/venture capital/i);
  });

  it('names the mining exploration credit as left out', () => {
    expect(text()).toMatch(/mining exploration/i);
  });

  it('names the clean buildings credit as left out', () => {
    expect(text()).toMatch(/clean buildings/i);
  });

  it('names the training credit as left out', () => {
    expect(text()).toMatch(/\btraining\b/i);
  });

  it('no longer calls the sales tax credit the main one', () => {
    expect(page('bc479').intro).not.toMatch(/main one/i);
    expect(text()).not.toMatch(/the main one/i);
  });

  it('says the total goes to line 47900', () => {
    const { paragraph, example } = section('bc479', 'total');
    expect(`${paragraph} ${example}`).toMatch(/47900/);
  });

  it('keeps sentences short', () => {
    expect(longestSentence(text())).toBeLessThanOrEqual(40);
  });
});

describe('t2204 copy', () => {
  const text = () =>
    page('t2204')
      .sections.map((s) => `${s.paragraph} ${s.example}`)
      .join(' ');
  const earnings = () => {
    const { paragraph, example } = section('t2204', 'earnings');
    return `${paragraph} ${example}`;
  };

  it('says in the intro that a refund needs more than $1', () => {
    expect(page('t2204').intro).toMatch(/more than \$1(?![\d,])/);
  });

  it('labels the refund section Lines 13–16', () => {
    expect(section('t2204', 'refund').lines).toBe('Lines 13–16');
  });

  it('says in the refund section that a refund needs more than $1', () => {
    const { paragraph, example } = section('t2204', 'refund');
    expect(`${paragraph} ${example}`).toMatch(/more than \$1(?![\d,])/);
  });

  it('does not say the form takes $2,000 off', () => {
    expect(text()).not.toMatch(/takes? (\{exempt\}|\$2,000) off/i);
  });

  it('says pay under the exempt amount is entered as zero', () => {
    expect(earnings()).toMatch(/under[^.]*(zero|\$0)|(zero|\$0)[^.]*under/i);
  });

  it('limits the zero rule to people with no self-employment income', () => {
    expect(earnings()).toMatch(/no self-employment income/i);
    expect(earnings()).not.toMatch(/only work for an employer/i);
  });

  it('says insured pay is added up from all T4 slips', () => {
    expect(earnings()).toMatch(
      /insured pay[^.]*added up from all your T4 slips/i,
    );
  });

  it('says the premiums are capped at a top amount, then compared', () => {
    const { paragraph } = section('t2204', 'premiums');
    expect(paragraph).toMatch(/top amount for the year/i);
    expect(paragraph).toMatch(/Then it compares/);
    expect(paragraph).not.toMatch(/set most/i);
  });

  it('says there may still be a refund when nothing was overpaid, pointing to the first section', () => {
    const { paragraph } = section('t2204', 'refund');
    expect(paragraph).toMatch(
      /there may still be a refund, as the first section explains/i,
    );
    expect(paragraph).not.toMatch(/there is no refund/i);
  });

  it('says line 16 is a different amount, the EI credit figure', () => {
    const { paragraph } = section('t2204', 'refund');
    expect(paragraph).toMatch(/line 16 is a different amount/i);
    expect(paragraph).toMatch(/EI credit figure/i);
    expect(paragraph).toMatch(/smallest of three amounts/i);
    expect(paragraph).toMatch(/line 31200 of your return/i);
    expect(paragraph).toMatch(/line 58300 of your provincial form/i);
  });

  it('words the refund example as three plain sentences', () => {
    expect(section('t2204', 'refund').example).toBe(
      'Your employer took off {taken}. The most you owe is {most}. The difference, your overpayment, is {extra}.',
    );
  });

  it('never lets pay less the exempt amount go below zero', () => {
    expect(earnings()).toMatch(/never below zero/i);
  });

  it('uses the amount for the refund and the EI credit', () => {
    expect(earnings()).toMatch(/refund/i);
    expect(earnings()).toMatch(/credit/i);
  });

  it('sends line 16 to the EI credit lines and the provincial form', () => {
    expect(text()).toMatch(/line 16/i);
    expect(text()).toMatch(/31200/);
    expect(text()).toMatch(/58300/);
    expect(text()).toMatch(/provincial/i);
  });

  it('keeps sentences short', () => {
    expect(longestSentence(text())).toBeLessThanOrEqual(40);
  });
});

describe('schedule-6 copy', () => {
  const text = () =>
    page('schedule-6')
      .sections.map((s) => `${s.paragraph} ${s.example}`)
      .join(' ');

  it('says the amounts are for a single person', () => {
    expect(text()).toMatch(/single person/i);
  });

  it('says a spouse gives other amounts', () => {
    expect(text()).toMatch(/spouse/i);
  });

  const earnings = () => {
    const { paragraph, example } = section('schedule-6', 'earnings');
    return `${paragraph} ${example}`;
  };
  const benefit = () => {
    const { paragraph, example } = section('schedule-6', 'benefit');
    return `${paragraph} ${example}`;
  };

  it('says who the benefit is for: a full year in Canada, 19 or older', () => {
    expect(earnings()).toMatch(/lived in Canada all year/i);
    expect(earnings()).toMatch(
      /19 or older[^.]*lived with a spouse, partner or child/i,
    );
  });

  it('names an approved school or college and more than 13 weeks', () => {
    expect(earnings()).toMatch(
      /full-time student at a school or college the government has approved/i,
    );
    expect(earnings()).toMatch(/studied for more than 13 weeks/i);
  });

  it('extends the diplomat rule to family members and employees', () => {
    expect(earnings()).toMatch(
      /diplomats, the family members who lived with them, and their employees/i,
    );
  });

  it('keeps the 90 day prison rule in the earnings section', () => {
    expect(earnings()).toMatch(/prison for 90 days or more/i);
  });

  it('says the first amount does not count, up to a top amount', () => {
    expect(benefit()).toMatch(/does not count/i);
    expect(benefit()).toMatch(/top amount of \{max\}/);
    expect(benefit()).not.toMatch(/nothing on the first/i);
  });

  it('words the benefit example against the top amount', () => {
    const { example } = section('schedule-6', 'benefit');
    expect(example).toMatch(/which is more than \{max\}/);
    expect(example).toMatch(/before your income is taken into account/i);
  });

  it('says full-time students cannot claim, after 13 weeks', () => {
    expect(text()).toMatch(/full-time student/i);
    expect(text()).toMatch(/13 weeks/i);
  });

  it('says prisoners of 90 days or more cannot claim', () => {
    expect(text()).toMatch(/prison/i);
    expect(text()).toMatch(/90 days/i);
  });

  it('says diplomats cannot claim', () => {
    expect(text()).toMatch(/diplomat/i);
  });

  it('names the eligible dependant and December 31', () => {
    expect(text()).toMatch(/eligible dependant/i);
    expect(text()).toMatch(/under 19/i);
    expect(text()).toMatch(/December 31/);
  });

  it('says the dependant was not eligible for the benefit themselves', () => {
    expect(text()).toMatch(
      /(not eligible|isn't eligible|was not|were not)[^.]*(benefit|CWB)|(benefit|CWB)[^.]*(not eligible|isn't eligible|was not|were not)/i,
    );
  });

  it('says the dependant is a child of yours or your spouse', () => {
    expect(text()).toMatch(/your (spouse|partner)/i);
  });

  it('names an eligible spouse', () => {
    expect(text()).toMatch(/eligible spouse/i);
  });

  it('sends the benefit to line 45300, even with no tax owed', () => {
    expect(text()).toMatch(/45300/);
    expect(text()).toMatch(/even if you owe no (income )?tax/i);
  });

  it('keeps sentences short', () => {
    expect(longestSentence(text())).toBeLessThanOrEqual(40);
  });
});

describe('on428-a copy', () => {
  const text = () =>
    page('on428-a')
      .sections.map((s) => `${s.paragraph} ${s.example}`)
      .join(' ');

  it('says the amounts are for a single person', () => {
    expect(text()).toMatch(/single person/i);
  });

  it('says a spouse gives other amounts', () => {
    expect(text()).toMatch(/spouse/i);
  });

  it('sends the result to line 85 of the ON428', () => {
    expect(text()).toMatch(/ON428/);
    expect(text()).toMatch(/line 85/i);
  });

  it('does not mention children', () => {
    expect(text()).not.toMatch(/child/i);
  });

  it('keeps sentences short', () => {
    expect(longestSentence(text())).toBeLessThanOrEqual(40);
  });
});

describe('on428 lift section links', () => {
  const lift = () => section('on428', 'lift');

  it('has exactly one link, to the ON428-A page', () => {
    expect(lift().links).toHaveLength(1);
    expect(lift().links?.[0]?.href).toBe(contentPath(formSlug('on428-a')));
  });

  it('words the link without digits', () => {
    const label = lift().links?.[0]?.label ?? '';
    expect(label.trim()).not.toBe('');
    expect(label).not.toMatch(/\d/);
  });

  it('gives no other on428 section a link', () => {
    for (const s of page('on428').sections) {
      if (s.id === 'lift') continue;
      expect(s.links ?? [], s.id).toHaveLength(0);
    }
  });
});
