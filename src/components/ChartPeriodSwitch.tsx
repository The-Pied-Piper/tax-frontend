import type { PayPeriod } from '../money/payPeriod';
import { strings } from '../strings';
import styles from './ChartPeriodSwitch.module.css';

/** The two periods the hub charts show: the yearly figure, or it divided by 12. */
export type ChartPeriod = Extract<PayPeriod, 'annually' | 'monthly'>;

type Props = {
  value: ChartPeriod;
  onChange: (period: ChartPeriod) => void;
};

const OPTIONS = [
  ['annually', strings.hubCharts.perYear],
  ['monthly', strings.hubCharts.perMonth],
] as const;

// Controlled switch: the card keeps the chosen period (Per year by default).
export function ChartPeriodSwitch({ value, onChange }: Props) {
  return (
    <div className={styles.group}>
      {OPTIONS.map(([period, label]) => (
        <button
          key={period}
          type="button"
          aria-pressed={value === period}
          onClick={() => {
            onChange(period);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
