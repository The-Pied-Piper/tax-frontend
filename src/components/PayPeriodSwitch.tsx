import type { PayPeriod } from '../money/payPeriod';
import { strings } from '../strings';

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
    <fieldset>
      <legend>{strings.payPeriod.legend}</legend>
      {OPTIONS.map((period) => (
        <label key={period}>
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
    </fieldset>
  );
}
