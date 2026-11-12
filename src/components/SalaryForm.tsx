import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type SubmitEvent,
} from 'react';
import {
  caretFor,
  separatorsFor,
  significantBefore,
  toDisplaySalary,
  toPlainSalary,
} from '../money/salaryInput';
import type { SalaryCheck } from '../state/salary';
import type { FormValues, JurisdictionsState } from '../state/useTakeHome';
import { placeOptions } from '../state/places';
import { languageCode, strings } from '../strings';
import styles from './SalaryForm.module.css';

type Props = {
  jurisdictionsState: JurisdictionsState;
  values: FormValues;
  salaryCheck: SalaryCheck;
  /** A problem the service reported about the salary. */
  salaryProblem: string | null;
  loading: boolean;
  canSubmit: boolean;
  onJurisdictionChange: (code: string) => void;
  onYearChange: (year: number) => void;
  onSalaryChange: (salary: string) => void;
  onSubmit: () => void;
};

const SALARY_MESSAGES = {
  empty: strings.form.salaryEmpty,
  invalid: strings.form.salaryInvalid,
  zero: strings.form.salaryZero,
} as const;

export function SalaryForm({
  jurisdictionsState,
  values,
  salaryCheck,
  salaryProblem,
  loading,
  canSubmit,
  onJurisdictionChange,
  onYearChange,
  onSalaryChange,
  onSubmit,
}: Props) {
  const id = useId();
  const placeId = `${id}-place`;
  const yearId = `${id}-year`;
  const salaryId = `${id}-salary`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const sep = useMemo(() => separatorsFor(languageCode), []);
  const salaryInput = useRef<HTMLInputElement>(null);
  // Digits before the caret after the last edit; put back once the box has
  // been rewritten with separators, so typing in the middle stays in place.
  const caretCount = useRef<number | null>(null);
  const shownSalary = toDisplaySalary(values.salary, sep);

  useLayoutEffect(() => {
    const input = salaryInput.current;
    if (caretCount.current === null || !input) return;
    if (document.activeElement === input) {
      const at = caretFor(input.value, caretCount.current, sep);
      input.setSelectionRange(at, at);
    }
    caretCount.current = null;
  });

  if (jurisdictionsState.status === 'loading') {
    return (
      <p role="status" className={styles.panel}>
        {strings.form.loadingPlaces}
      </p>
    );
  }
  if (jurisdictionsState.status === 'failed') {
    return (
      <p role="alert" className={styles.panel}>
        {strings.form.placesFailed}
      </p>
    );
  }

  const { jurisdictions } = jurisdictionsState;
  const years =
    jurisdictions.find((j) => j.code === values.jurisdictionCode)?.years ?? [];
  const salaryMessage =
    salaryCheck === 'ok' ? salaryProblem : SALARY_MESSAGES[salaryCheck];

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor={placeId}>{strings.form.place}</label>
        <select
          id={placeId}
          value={values.jurisdictionCode}
          onChange={(e) => {
            onJurisdictionChange(e.target.value);
          }}
        >
          {placeOptions(jurisdictions).map((p) => (
            <option key={p.code} value={p.code} disabled={!p.supported}>
              {p.supported ? p.name : `${p.name} (${strings.form.comingSoon})`}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor={yearId}>{strings.form.year}</label>
        <select
          id={yearId}
          value={values.year ?? ''}
          onChange={(e) => {
            const chosen = years.find((y) => String(y.year) === e.target.value);
            if (chosen) onYearChange(chosen.year);
          }}
        >
          {years.map((y) => (
            <option key={y.year} value={y.year}>
              {y.provisional
                ? `${y.year.toString()} (${strings.form.provisionalYear})`
                : y.year}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.fieldWide}>
        <label htmlFor={salaryId}>{strings.form.salary}</label>
        <div className={salaryMessage ? styles.boxBad : styles.box}>
          <span aria-hidden="true">$</span>
          <input
            id={salaryId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            ref={salaryInput}
            onPaste={(e) => {
              // The pasted text is read on its own ("70 000,50" -> 70000.50),
              // then put into the box where the selection was.
              e.preventDefault();
              const box = e.currentTarget;
              const clip = toPlainSalary(
                e.clipboardData.getData('text'),
                sep,
                true,
              );
              const start = box.selectionStart ?? box.value.length;
              const end = box.selectionEnd ?? start;
              const before = box.value.slice(0, start) + clip;
              caretCount.current = significantBefore(
                before,
                before.length,
                sep,
              );
              onSalaryChange(toPlainSalary(before + box.value.slice(end), sep));
            }}
            value={shownSalary}
            onChange={(e) => {
              caretCount.current = significantBefore(
                e.target.value,
                e.target.selectionStart ?? e.target.value.length,
                sep,
              );
              onSalaryChange(toPlainSalary(e.target.value, sep));
            }}
            aria-invalid={salaryMessage !== null}
            aria-describedby={salaryMessage ? `${hintId} ${errorId}` : hintId}
          />
        </div>
        <span id={hintId} className={styles.hint}>
          {strings.form.salaryHint(
            toDisplaySalary('70000', sep),
            toDisplaySalary('70000.50', sep),
          )}
        </span>
        {salaryMessage && (
          <p id={errorId} className={styles.error} role="alert">
            {salaryMessage}
          </p>
        )}
      </div>
      <button
        type="submit"
        className={styles.primary}
        disabled={loading || !canSubmit}
      >
        {loading ? strings.form.calculating : strings.form.calculate}
      </button>
    </form>
  );
}
