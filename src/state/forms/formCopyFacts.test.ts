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

  it("says the renter's credit is for people who paid rent", () => {
    expect(section('bc479', 'total').paragraph).toMatch(
      /renter['\u2019]s credit is for people who paid rent/i,
    );
  });

  it("says the renter's credit gets smaller as income rises and stops at a set income", () => {
    const { paragraph } = section('bc479', 'total');
    expect(paragraph).toMatch(/gets smaller as income rises/i);
    expect(paragraph).toMatch(/stops at a set income/i);
  });

  it("does not say the renter's credit can still pay at higher incomes", () => {
    const total = text();
    expect(total).not.toMatch(/higher incomes/i);
    expect(total).not.toMatch(/can still pay/i);
  });

  it("names no dollar figure for the renter's credit cut-off", () => {
    expect(section('bc479', 'total').paragraph).not.toMatch(/\$|\d{2},\d{3}/);
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

  it('limits the zero rule to employer pay, not self-employment', () => {
    expect(earnings()).toMatch(
      /under[^.]*(self-employ|only (work|earn)|employer)[^.]*\.|(self-employ|only (work|earn)|employer)[^.]*under/i,
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

// Exact proposed wording for ticket #189. Curly and straight apostrophes
// are treated alike, so the file's own convention may stand.
const plain = (value: string) => value.replace(/\u2019/g, "'");

describe.each([
  [
    'bc428',
    'income',
    'Taxable income is the part of your income that tax is charged on. This form does not work it out. It copies the number from the federal part of your return. Some things are taken off first, like part of your pension plan payments.',
    '{taken}, the extra part of your pension plan payments, is taken off first. That leaves a taxable income of {income}.',
  ],
  [
    'bc428',
    'brackets',
    "British Columbia does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice's rate on the rest of your income.",
    'Your income reaches the slice that starts at {start}. That slice is taxed at {rate}. The tax on the slices below it comes to {below}. The {above} of your income above {start} adds {added}. British Columbia tax before credits: {tax}.',
  ],
  [
    'bc428',
    'credits',
    'A credit lowers your tax bill. The form starts with a list of amounts: the basic personal amount that everyone gets ({basic} in 2025), the main part of your pension plan payments, and your EI payments. It adds them up, then takes {rate} of the total. That is your discount.',
    undefined,
  ],
  [
    'bc428',
    'reduction',
    'British Columbia lowers the tax of people on lower incomes. The reduction starts at {set}. The form then takes your net income over {base} and charges {rate} on it. That amount is taken away from the reduction. If nothing is left, the reduction is zero. So the higher your income, the smaller the reduction, until it reaches zero.',
    'Your net income is {over} over {base}. {rate} of that is {clawback}, which is more than {set}, so the reduction is {reduction}.',
  ],
  [
    'bc479',
    'income',
    'The form starts with your income. It takes off {threshold}, because the sales tax credit only starts to shrink once your income is over that amount.',
    'Your income is {income}. Take off {threshold} and {over} is left.',
  ],
  [
    'bc479',
    'sales-tax',
    'The sales tax credit starts at {credit}. It shrinks by {rate} of your income over {threshold}. It can be paid to you even if you owe no BC tax. At very low incomes, that can make your take-home pay higher than your salary.',
    undefined,
  ],
  [
    'bc479',
    'total',
    "The form adds up your credits. We count only the sales tax credit. The form has other credits too: for renters, home renovation, venture capital, mining exploration, clean buildings and training. We do not use those. The renter's credit is for people who paid rent. It gets smaller as income rises and stops at a set income. The total goes onto line 47900 of your return.",
    undefined,
  ],
])('%s %s section wording (#189)', (id, sectionId, paragraph, example) => {
  it('has the proposed paragraph', () => {
    expect(plain(section(id, sectionId).paragraph)).toBe(plain(paragraph));
  });

  if (example !== undefined) {
    it('has the proposed example', () => {
      expect(plain(section(id, sectionId).example)).toBe(plain(example));
    });
  }

  it('keeps sentences to 40 words', () => {
    const { paragraph: p, example: e } = section(id, sectionId);
    expect(longestSentence(`${p} ${e}`)).toBeLessThanOrEqual(40);
  });
});
