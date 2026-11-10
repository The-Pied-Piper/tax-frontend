import type { PayPeriod } from '../money/payPeriod';
import { strings } from '../strings';
import styles from './PayPeriodSwitch.module.css';

const OPTIONS: readonly PayPeriod[] = [
  'weekly',
  'biweekly',
  'monthly',
  'annually',
];

type Props = {
  value: PayPeriod;
  onChange: (period: PayPeriod) => void;
};

// Controlled switch: the page keeps the chosen period (Annually by default).
export function PayPeriodSwitch({ value, onChange }: Props) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{strings.payPeriod.legend}</legend>
      <div className={styles.group}>
        {OPTIONS.map((period) => (
          <label key={period} className={styles.option}>
            <input
              type="radio"
              name="pay-period"
              value={period}
              checked={value === period}
              onChange={() => onChange(period)}
            />
            {strings.payPeriod[period]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
