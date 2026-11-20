/**
 * Printed-form order for a line's reference. A reference is whatever the form
 * prints beside the figure: "8", "105", "64 box A", "5 (column 2)", "A".
 * Lines with a number come first, by that number (so 8 sorts before 63 and
 * 105, not as text); lines with the same number go by the rest of the text
 * ("box A" before "box B", "(column 1)" before "(column 2)"); references that
 * start with no number ("A", "B") come last, in alphabetical order.
 */
// Digits stay text (money and numbers are never parsed here): a longer run of
// digits, once leading zeros are gone, is the bigger number.
function leadingNumber(reference: string): string | null {
  const match = /^\d+/.exec(reference);
  return match ? match[0].replace(/^0+(?=\d)/, '') : null;
}

function compareDigits(x: string, y: string): number {
  if (x.length !== y.length) return x.length - y.length;
  return x < y ? -1 : x > y ? 1 : 0;
}

export function compareReferences(a: string, b: string): number {
  const x = leadingNumber(a.trim());
  const y = leadingNumber(b.trim());
  if (x !== null && y !== null && x !== y) return compareDigits(x, y);
  if (x !== null && y === null) return -1;
  if (x === null && y !== null) return 1;
  return a.localeCompare(b, 'en', { numeric: true });
}

/** Sorts lines by reference; equal references keep the order the API sent. */
export function sortByReference<T extends { reference: string | null }>(
  lines: readonly T[],
): T[] {
  return [...lines].sort((a, b) =>
    compareReferences(a.reference ?? '', b.reference ?? ''),
  );
}
