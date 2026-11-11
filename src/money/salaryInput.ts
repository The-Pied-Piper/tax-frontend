// The salary box shows the number the way the person's language writes it
// (70,000.50 in English, 70 000,50 in French) while the page keeps and sends
// plain text ("70000.50"). Only the two separators come from Intl; the digits
// are never turned into a number.

export type Separators = { group: string; decimal: string };

const SPACE = /[\s\u00a0\u202f]/g;

// Language code ("en", "fr") -> the Canadian locale of that language.
function localeFor(languageCode: string): string {
  return languageCode === 'fr' ? 'fr-CA' : 'en-CA';
}

export function separatorsFor(languageCode: string): Separators {
  const parts = new Intl.NumberFormat(localeFor(languageCode)).formatToParts(
    1000000.5,
  );
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  };
}

// What was typed or pasted -> plain text: spaces and the group mark are
// dropped, the language's decimal mark becomes ".". A "." is also accepted as
// the decimal mark in every language. Anything else is kept for the salary
// check to refuse.
export function toPlainSalary(
  typed: string,
  sep: Separators,
  pasted = false,
): string {
  let text = typed.replace(SPACE, '');
  // "70 000,50" pasted into an English box: a comma with one or two digits
  // after it and no "." anywhere is a decimal mark. Only for a paste: while
  // typing, deleting a digit from "1,000" leaves "1,00", which is a group.
  if (
    pasted &&
    sep.group === ',' &&
    !text.includes('.') &&
    /,\d{1,2}$/.test(text)
  ) {
    text = `${text.slice(0, text.lastIndexOf(','))}.${text.slice(text.lastIndexOf(',') + 1)}`;
  }
  if (!/^\s*$/.test(sep.group) && sep.group !== '.') {
    text = text.split(sep.group).join('');
  }
  if (sep.decimal !== '.') text = text.split(sep.decimal).join('.');
  return text;
}

const PLAIN = /^(\d*)(\.\d*)?$/;

// Plain text -> what the box shows. Text that is not plain digits is shown as is.
export function toDisplaySalary(plain: string, sep: Separators): string {
  const match = PLAIN.exec(plain);
  if (!match) return plain;
  const [, whole = '', fraction = ''] = match;
  const grouped = whole.replace(/\B(?=(\d{3})+$)/g, sep.group);
  return `${grouped}${fraction.replace('.', sep.decimal)}`;
}

// Number of digits and decimal marks before the caret: what has to stay
// before it when the text is rewritten with separators.
export function significantBefore(
  text: string,
  caret: number,
  sep: Separators,
): number {
  let count = 0;
  for (const ch of text.slice(0, caret)) {
    if (/\d/.test(ch) || ch === sep.decimal || ch === '.') count += 1;
  }
  return count;
}

// Caret position in the rewritten text after `count` digits and marks.
export function caretFor(
  display: string,
  count: number,
  sep: Separators,
): number {
  if (count === 0) return 0;
  let seen = 0;
  for (let i = 0; i < display.length; i += 1) {
    const ch = display.charAt(i);
    if (/\d/.test(ch) || ch === sep.decimal || ch === '.') seen += 1;
    if (seen === count) return i + 1;
  }
  return display.length;
}
