import type { ReactNode } from 'react';
import styles from './FoldingList.module.css';
import { strings } from '../strings';

/** A list longer than this many characters of text folds. */
const FOLD_ABOVE_CHARACTERS = 1000;
/** How many items a folded list shows before the "See more" link. */
const FOLD_SHOWN_ITEMS = 3;

/** One entry of a folding list: its key, its words' length (what the limit counts) and what is drawn. */
export type FoldingItem = { key: string; length: number; content: ReactNode };

/** Whether a list of items is long enough to fold: more than the limit in text and more than one item behind the shown ones. */
function folds(items: readonly FoldingItem[]): boolean {
  const total = items.reduce((sum, item) => sum + item.length, 0);
  return total > FOLD_ABOVE_CHARACTERS && items.length > FOLD_SHOWN_ITEMS + 1;
}

type Props = {
  items: readonly FoldingItem[];
  listClassName: string | undefined;
  /** An extra class on the list behind the link, for a list whose first item is styled differently. */
  foldedClassName?: string;
  /** Data attributes for the first list. */
  data?: Record<`data-${string}`, string>;
};

/**
 * A bullet or plain list that keeps a long page short (#294). A list over
 * `FOLD_ABOVE_CHARACTERS` of text shows its first `FOLD_SHOWN_ITEMS` items and
 * puts the rest behind a "See more" link that opens them in place (a native
 * details element, so the pre-built page works without script). Shorter lists
 * are drawn whole. `listClassName` styles every list drawn; `data` goes on the first one.
 */
export function FoldingList({
  items,
  listClassName,
  foldedClassName,
  data,
}: Props) {
  const li = (item: FoldingItem) => <li key={item.key}>{item.content}</li>;
  if (!folds(items)) {
    return (
      <ul className={listClassName} {...data}>
        {items.map(li)}
      </ul>
    );
  }
  return (
    <>
      <ul className={listClassName} {...data}>
        {items.slice(0, FOLD_SHOWN_ITEMS).map(li)}
      </ul>
      <details className={styles.fold}>
        <summary>
          <span className={styles.more}>{strings.fold.more}</span>{' '}
          <span className={styles.less}>{strings.fold.less}</span>
        </summary>
        <ul
          className={[listClassName, foldedClassName].filter(Boolean).join(' ')}
        >
          {items.slice(FOLD_SHOWN_ITEMS).map(li)}
        </ul>
      </details>
    </>
  );
}
