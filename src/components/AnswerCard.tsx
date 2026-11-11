import { useId, type ReactNode } from 'react';
import { displayMoney } from '../money/format';
import type { PayPeriod } from '../money/payPeriod';
import { strings } from '../strings';
import styles from './AnswerCard.module.css';
import { PayPeriodSwitch } from './PayPeriodSwitch';

type Props = {
  salary: string;
  totalDeductions: string;
  takeHome: string;
  /** The place and year the answer is for, as asked. */
  place: string;
  year: number;
  payPeriod: PayPeriod;
  onPayPeriodChange: (period: PayPeriod) => void;
  /** The disclosures that sit under the split, inside this panel. */
  children?: ReactNode;
};

// Display only: the yearly amounts arrive as text and are divided into the
// chosen pay period by money/, never parsed to numbers here.
export function AnswerCard({
  salary,
  totalDeductions,
  takeHome,
  place,
  year,
  payPeriod,
  onPayPeriodChange,
  children,
}: Props) {
  const headingId = useId();
  const show = (yearly: string) =>
    displayMoney(yearly, payPeriod, strings.currencySymbol);
  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.visuallyHidden}>
        {strings.answer.heading}
      </h2>
      <div className={styles.topRow}>
        <p className={styles.label}>{strings.answer.label[payPeriod]}</p>
        <PayPeriodSwitch value={payPeriod} onChange={onPayPeriodChange} />
      </div>
      <p className={styles.amount}>{show(takeHome)}</p>
      <p className={styles.sub}>
        {strings.answer.outOf(show(salary), place, year)}
      </p>
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt>{strings.answer.salary}</dt>
          <dd>{show(salary)}</dd>
        </div>
        <div className={styles.row}>
          <dt>{strings.answer.takenOff}</dt>
          <dd>{show(totalDeductions)}</dd>
        </div>
        <div className={styles.totalRow}>
          <dt>{strings.answer.takeHomeRow}</dt>
          <dd>{show(takeHome)}</dd>
        </div>
      </dl>
      <p className={styles.estimate}>{strings.answer.estimateNote}</p>
      <div className={styles.extras}>{children}</div>
    </section>
  );
}
