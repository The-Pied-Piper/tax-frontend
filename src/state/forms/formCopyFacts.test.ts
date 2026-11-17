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

describe('bc428 copy', () => {
  const text = () =>
    page('bc428')
      .sections.map((s) => `${s.paragraph} ${s.example}`)
      .join(' ');
  const income = () => section('bc428', 'income');
  const brackets = () => section('bc428', 'brackets');
  const credits = () => section('bc428', 'credits');
  const reduction = () => section('bc428', 'reduction');

  it('says taxable income is the part of your income that tax is charged on', () => {
    expect(income().paragraph).toMatch(
      /taxable income is the part of your income that tax is charged on/i,
    );
  });

  it('says the form copies taxable income and does not work it out', () => {
    expect(income().paragraph).toMatch(/does not work it out/i);
    expect(income().paragraph).toMatch(
      /copies the number from the federal part/i,
    );
  });

  it('says some things are taken off first, like pension plan payments', () => {
    expect(income().paragraph).toMatch(
      /taken off first, like part of your pension plan payments/i,
    );
  });

  it('shows the amount taken off first and the taxable income left', () => {
    expect(income().example).toMatch(
      /\{taken\}[^.]*pension plan payments[^.]*taken off first/i,
    );
    expect(income().example).toMatch(
      /That leaves a taxable income of \{income\}/,
    );
  });

  it('says British Columbia does not tax all income at one rate', () => {
    expect(brackets().paragraph).toMatch(
      /does not tax all of your income at one rate/i,
    );
  });

  it('says income is cut into slices called brackets, each with its own rate', () => {
    expect(brackets().paragraph).toMatch(
      /cuts your income into slices, called brackets, and each slice has its own rate/i,
    );
  });

  it('says the form finds the top slice your income reaches', () => {
    expect(brackets().paragraph).toMatch(
      /finds the top slice your income reaches/i,
    );
  });

  it("adds the tax on the slices below, then charges the top slice's rate on the rest", () => {
    expect(brackets().paragraph).toMatch(
      /adds up the tax on all the slices below that one/i,
    );
    expect(brackets().paragraph).toMatch(
      /top slice['\u2019]s rate on the rest of your income/i,
    );
  });

  it('shows the slice the income reaches and its rate', () => {
    expect(brackets().example).toMatch(
      /reaches the slice that starts at \{start\}\. That slice is taxed at \{rate\}/,
    );
  });

  it('shows the tax on the slices below', () => {
    expect(brackets().example).toMatch(
      /tax on the slices below it comes to \{below\}/i,
    );
  });

  it('shows the income above the slice start and the tax it adds', () => {
    expect(brackets().example).toMatch(
      /\{above\} of your income above \{start\} adds \{added\}/,
    );
  });

  it('shows the tax before credits', () => {
    expect(brackets().example).toMatch(
      /British Columbia tax before credits: \{tax\}/,
    );
  });

  it('says a credit lowers your tax bill', () => {
    expect(credits().paragraph).toMatch(/a credit lowers your tax bill/i);
  });

  it('lists the basic personal amount that everyone gets', () => {
    expect(credits().paragraph).toMatch(
      /basic personal amount that everyone gets \(\{basic\} in 2025\)/i,
    );
  });

  it('lists the pension plan payments and EI payments', () => {
    expect(credits().paragraph).toMatch(
      /main part of your pension plan payments/i,
    );
    expect(credits().paragraph).toMatch(/your EI payments/);
  });

  it('adds the amounts up and takes the credit rate of the total as the discount', () => {
    expect(credits().paragraph).toMatch(
      /adds them up, then takes \{rate\} of the total/i,
    );
    expect(credits().paragraph).toMatch(/That is your discount/);
  });

  it('says the reduction helps people on lower incomes', () => {
    expect(reduction().paragraph).toMatch(
      /lowers the tax of people on lower incomes/i,
    );
  });

  it('says the reduction starts at a set amount', () => {
    expect(reduction().paragraph).toMatch(/reduction starts at \{set\}/i);
  });

  it('says the form charges a rate on net income over the base', () => {
    expect(reduction().paragraph).toMatch(
      /takes your net income over \{base\} and charges \{rate\} on it/i,
    );
  });

  it('says that amount is taken away from the reduction', () => {
    expect(reduction().paragraph).toMatch(/taken away from the reduction/i);
  });

  it('says the reduction is zero if nothing is left', () => {
    expect(reduction().paragraph).toMatch(
      /If nothing is left, the reduction is zero/,
    );
  });

  it('says the higher your income, the smaller the reduction', () => {
    expect(reduction().paragraph).toMatch(
      /the higher your income, the smaller the reduction, until it reaches zero/i,
    );
  });

  it('shows the net income over the base and the clawback', () => {
    expect(reduction().example).toMatch(
      /net income is \{over\} over \{base\}\. \{rate\} of that is \{clawback\}/,
    );
  });

  it('shows a clawback bigger than the starting reduction giving the final reduction', () => {
    expect(reduction().example).toMatch(
      /more than \{set\}, so the reduction is \{reduction\}/,
    );
  });

  it('keeps sentences short', () => {
    expect(longestSentence(text())).toBeLessThanOrEqual(40);
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

  it('says the form starts with your income and takes off the threshold', () => {
    const { paragraph } = section('bc479', 'income');
    expect(paragraph).toMatch(/starts with your income/i);
    expect(paragraph).toMatch(/takes off \{threshold\}/i);
  });

  it('says the sales tax credit only starts to shrink above the threshold', () => {
    expect(section('bc479', 'income').paragraph).toMatch(
      /sales tax credit only starts to shrink once your income is over that amount/i,
    );
  });

  it('shows the income, the amount taken off and what is left', () => {
    const { example } = section('bc479', 'income');
    expect(example).toMatch(/Your income is \{income\}/);
    expect(example).toMatch(/Take off \{threshold\} and \{over\} is left/);
  });

  it('says the sales tax credit starts at a set amount', () => {
    expect(section('bc479', 'sales-tax').paragraph).toMatch(
      /sales tax credit starts at \{credit\}/i,
    );
  });

  it('says the sales tax credit shrinks by a rate of income over the threshold', () => {
    expect(section('bc479', 'sales-tax').paragraph).toMatch(
      /shrinks by \{rate\} of your income over \{threshold\}/i,
    );
  });

  it('says the sales tax credit can be paid even if you owe no BC tax', () => {
    expect(section('bc479', 'sales-tax').paragraph).toMatch(
      /It can be paid to you even if you owe no BC tax/,
    );
  });

  it('says very low incomes can see take-home pay above salary', () => {
    expect(section('bc479', 'sales-tax').paragraph).toMatch(
      /very low incomes[^.]*take-home pay higher than your salary/i,
    );
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
