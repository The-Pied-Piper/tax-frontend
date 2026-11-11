import { useId } from 'react';
import { displayAmount } from '../money/format';
import type { PayPeriod } from '../money/payPeriod';
import { strings } from '../strings';
import styles from './AnswerCard.module.css';
import { PayPeriodSwitch } from './PayPeriodSwitch';

type Props = {
  salary: string;
  totalDeductions: string;
  takeHome: string;
  payPeriod: PayPeriod;
  onPayPeriodChange: (period: PayPeriod) => void;
};

// Display only: the yearly amounts arrive as text and are divided into the
// chosen pay period by money/, never parsed to numbers here.
export function AnswerCard({
  salary,
  totalDeductions,
  takeHome,
  payPeriod,
  onPayPeriodChange,
}: Props) {
  const headingId = useId();
  const show = (yearly: string) => displayAmount(yearly, payPeriod);
  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {strings.answer.heading}
      </h2>
      <PayPeriodSwitch value={payPeriod} onChange={onPayPeriodChange} />
      <div className={styles.answer}>
        <p className={styles.label}>{strings.answer.takeHome}</p>
        <p className={styles.amount}>{show(takeHome)}</p>
        <p className={styles.unit}>{strings.answer.per[payPeriod]}</p>
      </div>
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt>{strings.answer.salary}</dt>
          <dd>{show(salary)}</dd>
        </div>
        <div className={styles.row}>
          <dt>{strings.answer.takenOff}</dt>
          <dd>{show(totalDeductions)}</dd>
        </div>
      </dl>
      <p className={styles.estimate}>{strings.answer.estimateNote}</p>
    </section>
  );
}
