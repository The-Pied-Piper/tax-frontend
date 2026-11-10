import { useId, type SubmitEvent } from 'react';
import type { SalaryCheck } from '../state/salary';
import type { FormValues, JurisdictionsState } from '../state/useTakeHome';
import { strings } from '../strings';
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

  if (jurisdictionsState.status === 'loading') {
    return <p role="status">{strings.form.loadingPlaces}</p>;
  }
  if (jurisdictionsState.status === 'failed') {
    return <p role="alert">{strings.form.placesFailed}</p>;
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
          {jurisdictions.map((j) => (
            <option key={j.code} value={j.code}>
              {j.name.trim() || j.code}
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
      <div className={styles.field}>
        <label htmlFor={salaryId}>{strings.form.salary}</label>
        <input
          id={salaryId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={values.salary}
          onChange={(e) => {
            onSalaryChange(e.target.value);
          }}
          aria-invalid={salaryMessage !== null}
          aria-describedby={salaryMessage ? `${hintId} ${errorId}` : hintId}
        />
        <span id={hintId} className={styles.hint}>
          {strings.form.salaryHint}
        </span>
        {salaryMessage && (
          <p id={errorId} className={styles.error} role="alert">
            {salaryMessage}
          </p>
        )}
      </div>
      <button type="submit" disabled={loading || !canSubmit}>
        {loading ? strings.form.calculating : strings.form.calculate}
      </button>
    </form>
  );
}
