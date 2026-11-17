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

  it('says the premium goes up in steps as income rises', () => {
    expect(paragraph).toMatch(/goes up in steps as income rises/i);
    expect(paragraph).toMatch(/little or nothing/i);
  });

  it('adds the premium to the tax after all the earlier steps, not "after credits"', () => {
    expect(paragraph).toMatch(
      /adds it to your tax after all the earlier steps/,
    );
    expect(paragraph).not.toMatch(/after credits/);
  });

  it('keeps sentences short', () => {
    expect(longestSentence(paragraph)).toBeLessThanOrEqual(40);
  });
});

describe('on428 plain-English copy', () => {
  it('income says income, not pay, and puts the cause before the result', () => {
    const { paragraph, example } = section('on428', 'income');
    expect(paragraph).toMatch(/part of your income that tax is charged on/);
    expect(example).toMatch(
      /^\{taken\}.*That leaves a taxable income of \{income\}\.$/,
    );
  });

  it('brackets calls the result the Ontario tax before credits', () => {
    const { paragraph, example } = section('on428', 'brackets');
    expect(paragraph).toMatch(/finds the top slice your income reaches/);
    expect(example).toMatch(/Ontario tax before credits: \{tax\}\.$/);
  });

  it('credits starts from a list of amounts', () => {
    expect(section('on428', 'credits').paragraph).toMatch(
      /^A credit lowers your tax bill\. The form starts with a list of amounts/,
    );
  });

  it('keeps every changed section short in sentences', () => {
    for (const id of ['income', 'brackets', 'credits', 'surtax', 'reduction']) {
      const { paragraph, example } = section('on428', id);
      expect(longestSentence(`${paragraph} ${example}`)).toBeLessThanOrEqual(
        40,
      );
    }
  });
});

describe('on428 corrections', () => {
  it('surtax says the form tests Ontario tax after credits, before the health premium', () => {
    const { paragraph, example } = section('on428', 'surtax');
    expect(paragraph).toMatch(
      /tests your Ontario tax after credits, before the health premium/,
    );
    expect(example).toMatch(/^Your Ontario tax after credits is \{tax\}\./);
  });

  it('reduction says it takes away Ontario tax after credits and surtax', () => {
    const { paragraph, example } = section('on428', 'reduction');
    expect(paragraph).toMatch(
      /takes away your Ontario tax after credits and surtax/,
    );
    expect(example).toMatch(/less your tax of \{tax\}/);
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
