import { useMemo, useState } from 'react';
import { displayWholeMoney, type MoneyUnit } from '../money/format';
import { separatorsFor, toDisplaySalary } from '../money/salaryInput';
import { PROVINCE_COMPARISON_SLOT_ID } from '../state/hubChartSlots';
import { typedSalaryIndex } from '../state/provinceComparison';
import { languageCode, strings } from '../strings';
import styles from './SalarySlider.module.css';

// One comparison sits on a page, so its controls have fixed ids: the page the
// build writes and the page the browser mounts then carry the same markup.
const SLIDER_ID = `${PROVINCE_COMPARISON_SLOT_ID}-salary`;
const BOX_ID = `${PROVINCE_COMPARISON_SLOT_ID}-typed`;
const HINT_ID = `${PROVINCE_COMPARISON_SLOT_ID}-hint`;
const ERROR_ID = `${PROVINCE_COMPARISON_SLOT_ID}-error`;

type Props = {
  /** Every point of the sweep, lowest first, as the API wrote them. The slider has one step for each. */
  salaries: readonly string[];
  /** The index of the chosen salary. */
  index: number;
  unit: MoneyUnit;
  onChange: (index: number) => void;
};

const copy = strings.hubCharts.comparison;

// A slider over the salaries of the sweep, and a box to type one. The page owns
// the chosen index; the box keeps only what is being typed and whether it was refused.
export function SalarySlider({ salaries, index, unit, onChange }: Props) {
  const separators = useMemo(() => separatorsFor(languageCode), []);
  const [draft, setDraft] = useState<string | null>(null);
  const [refused, setRefused] = useState(false);
  const first = salaries[0] ?? '';
  const last = salaries[salaries.length - 1] ?? '';
  const chosen = salaries[index] ?? first;
  const shown = displayWholeMoney(chosen, 'annually', unit);

  function commit() {
    if (draft === null) return;
    const at = typedSalaryIndex(draft, salaries, separators);
    if (at === null) {
      setRefused(true);
      return;
    }
    setRefused(false);
    setDraft(null);
    onChange(at);
  }

  return (
    <div className={styles.controls}>
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label htmlFor={SLIDER_ID}>{copy.salaryLabel}</label>
          <span className={styles.value}>{shown}</span>
        </div>
        <input
          id={SLIDER_ID}
          type="range"
          min={0}
          max={salaries.length - 1}
          step={1}
          value={index}
          aria-valuetext={copy.salaryValueText(shown)}
          aria-describedby={HINT_ID}
          onChange={(event) => {
            setDraft(null);
            setRefused(false);
            onChange(event.target.valueAsNumber);
          }}
        />
        <div className={styles.ends} aria-hidden="true">
          <span>{displayWholeMoney(first, 'annually', unit)}</span>
          <span>{displayWholeMoney(last, 'annually', unit)}</span>
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor={BOX_ID}>{copy.typedLabel}</label>
        <div className={refused ? styles.boxBad : styles.box}>
          <span aria-hidden="true">$</span>
          <input
            id={BOX_ID}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={
              draft ?? toDisplaySalary(chosen.replace(/\.00$/, ''), separators)
            }
            aria-invalid={refused}
            aria-describedby={refused ? `${HINT_ID} ${ERROR_ID}` : HINT_ID}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              commit();
            }}
          />
        </div>
      </div>
      <div id={HINT_ID} className={styles.hint}>
        <span>{copy.hint}</span>
        <span>{copy.stepNote}</span>
        <span>{copy.typedNote}</span>
      </div>
      {refused && (
        <div id={ERROR_ID} className={styles.error} role="alert">
          {copy.salaryError(
            displayWholeMoney(first, 'annually', unit),
            displayWholeMoney(last, 'annually', unit),
          )}
        </div>
      )}
    </div>
  );
}
