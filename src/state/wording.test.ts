import { describe, expect, it } from 'vitest';
import { strings } from '../strings';
import { wordingFor } from './wording';

describe('wordingFor', () => {
  it('gives every province but Quebec the shared wording', () => {
    for (const code of ['CA-ON', 'CA-AB', 'CA-BC', 'CA-MB', 'CA-SK', 'CA-NL']) {
      const words = wordingFor(code);
      expect(words.answer.takenOff.help).toBe(strings.answer.takenOff.help);
      expect(words.pageText).toBe(strings.pageText);
    }
  });

  it('words Quebec with QPP, QPIP and the drug premium, never the Canada Pension Plan', () => {
    const words = wordingFor('CA-QC');
    const texts = [
      words.answer.takenOff.help,
      words.answer.averageRate.help,
      words.answer.marginalRate.help,
      words.pageText.description('$70,000', 'Quebec', 2026, '$49,073.39'),
      words.pageText.paragraph(
        '$70,000',
        'Quebec',
        2026,
        '$49,073.39',
        '$20,926.61',
        '29.90%',
        '45.03%',
      ),
    ];
    for (const text of texts) {
      expect(text).not.toMatch(/Canada Pension|CPP/);
      expect(text).toMatch(/[Pp]arental [Ii]nsurance/);
    }
    expect(texts[4]).toContain('Quebec Pension Plan');
    expect(texts[4]).toContain('drug insurance premium');
    expect(texts[4]).not.toContain('abatement');
  });

  it('keeps the card names the same for every province', () => {
    expect(wordingFor('CA-QC').answer.takenOff.name).toBe(
      strings.answer.takenOff.name,
    );
  });
});
